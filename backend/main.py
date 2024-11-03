import cv2
import numpy as np
import torch
from ultralytics import YOLO
import os
from deep_sort_realtime.deepsort_tracker import DeepSort
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Initialize models and devices
yolo_model = YOLO("yolov8n.pt")
midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small").eval()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
midas.to(device)
midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = midas_transforms.small_transform
tracker = DeepSort(max_age=30, n_init=3, nn_budget=100)


def estimate_depth(frame):
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    input_tensor = transform(img).to(device)
    with torch.no_grad():
        prediction = midas(input_tensor)
        prediction = torch.nn.functional.interpolate(
            prediction.unsqueeze(1),
            size=img.shape[:2],
            mode="bicubic",
            align_corners=False,
        ).squeeze()
    depth_map = prediction.cpu().numpy()
    depth_min, depth_max = depth_map.min(), depth_map.max()
    depth_map_normalized = (
        (depth_map - depth_min) / (depth_max - depth_min)
        if depth_max > depth_min
        else np.zeros_like(depth_map)
    )
    return depth_map_normalized


def calculate_average_depth(depth_map, bbox):
    x1, y1, x2, y2 = bbox
    return np.mean(depth_map[y1:y2, x1:x2])


def normalize_position(bbox, frame_width, frame_height, grid_size=7):
    x_center = (bbox[0] + bbox[2]) / 2 / frame_width
    y_center = (bbox[1] + bbox[3]) / 2 / frame_height
    grid_x = min(int(x_center * grid_size), grid_size - 1)
    grid_y = min(int(y_center * grid_size), grid_size - 1)
    return (grid_x, grid_y)


def generate_position_matrix(dancer_states, grid_size=7):
    position_matrix = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
    position_occupancy = {}
    for dancer_num, state in dancer_states.items():
        x, y = state["grid_position"]
        position_occupancy.setdefault((x, y), []).append(dancer_num)
    for (x, y), dancers in position_occupancy.items():
        queue = dancers.copy()
        queue.sort(key=lambda dn: dancer_states[dn]["depth"])
        for dancer_num in queue:
            if position_matrix[y][x] == 0:
                position_matrix[y][x] = dancer_num
            else:
                found = False
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        nx, ny = x + dx, y + dy
                        if (
                            0 <= nx < grid_size
                            and 0 <= ny < grid_size
                            and position_matrix[ny][nx] == 0
                        ):
                            position_matrix[ny][nx] = dancer_num
                            found = True
                            break
                    if found:
                        break
    return position_matrix


class DanceFormationGenerator:
    def __init__(self, num_dancers):
        self.num_dancers = num_dancers
        self.current_dancer_num = 1
        self.track_id_to_dancer_num = {}
        self.dancer_states = {}
        self.default_positions = self.define_default_positions(num_dancers)
        logging.info(f"DanceFormationGenerator initialized with {num_dancers} dancers.")

    def define_default_positions(self, num_dancers, grid_size=7):
        default_positions = {}
        spacing = grid_size // (num_dancers + 1)
        for i in range(1, num_dancers + 1):
            x = min(spacing * i, grid_size - 1)
            y = grid_size // 2
            default_positions[i] = (x, y)
        return default_positions

    def assign_dancer_num(self, track_id):
        if track_id in self.track_id_to_dancer_num:
            return self.track_id_to_dancer_num[track_id]
        if self.current_dancer_num > self.num_dancers:
            return None
        dancer_num = self.current_dancer_num
        self.track_id_to_dancer_num[track_id] = dancer_num
        self.current_dancer_num += 1
        return dancer_num

    def generate_position_matrices(self, video_path, grid_size=7, frame_interval=10):
        output_data = []
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logging.error("Cannot open video file.")
            return output_data
        frame_rate = cap.get(cv2.CAP_PROP_FPS)
        frame_count = 0
        for dancer_num, position in self.default_positions.items():
            self.dancer_states[dancer_num] = {
                "depth": float("inf"),
                "grid_position": position,
            }
        while True:
            # Skip frames by grabbing without decoding
            for _ in range(frame_interval - 1):
                ret = cap.grab()
                if not ret:
                    break
                frame_count += 1
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            logging.info(f"Processing frame {frame_count}")
            # Detection with YOLOv8
            results = yolo_model(frame)
            bounding_boxes = []
            confidences = []
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                    confidence = box.conf[0].cpu().numpy()
                    bounding_boxes.append([x1, y1, x2, y2])
                    confidences.append(confidence)
            logging.info(f"Number of detections: {len(bounding_boxes)}")
            # Prepare detections for Deep SORT
            detections = []
            for bbox, conf in zip(bounding_boxes, confidences):
                x1, y1, x2, y2 = bbox
                detections.append(([x1, y1, x2 - x1, y2 - y1], conf, "person"))
            # Update tracker
            tracks = tracker.update_tracks(detections, frame=frame)
            dancers_detected = []
            for track in tracks:
                if not track.is_confirmed():
                    continue
                track_id = track.track_id
                ltrb = track.to_ltrb()
                bbox = [int(coord) for coord in ltrb]
                dancer_num = self.assign_dancer_num(track_id)
                if dancer_num:
                    dancers_detected.append({"num": dancer_num, "bbox": bbox})
            # Depth Estimation with MiDaS
            depth_map = estimate_depth(frame)
            frame_height, frame_width = frame.shape[:2]
            # Update dancer_states
            for dancer in dancers_detected:
                dancer_num = dancer["num"]
                bbox = dancer["bbox"]
                depth = calculate_average_depth(depth_map, bbox)
                grid_position = normalize_position(
                    bbox, frame_width, frame_height, grid_size
                )
                self.dancer_states[dancer_num] = {
                    "depth": depth,
                    "grid_position": grid_position,
                }
            # Retain last known positions for missing dancers
            position_matrix = generate_position_matrix(self.dancer_states, grid_size)
            # Save position matrices at intervals
            if frame_count % frame_interval == 0:
                timestamp = round(frame_count / frame_rate, 2)
                output_entry = {
                    "timestamp": timestamp,
                    "position_matrix": position_matrix,
                }
                output_data.append(output_entry)
                logging.info(f"Appended position matrix at timestamp {timestamp}")
        cap.release()
        cv2.destroyAllWindows()
        return output_data


class DanceFormationAPI:
    def __init__(self, num_dancers):
        self.generator = DanceFormationGenerator(num_dancers)
        logging.info(f"DanceFormationAPI initialized with {num_dancers} dancers.")

    def process_video_and_get_positions(self, video_path):
        output_data = self.generator.generate_position_matrices(video_path)
        return output_data


if __name__ == "__main__":
    video_input_path = "twice.mp4"  # Replace with your video path
    json_output_path = "output_position_matrices.json"
    num_dancers = 4  # Set the desired number of dancers
    api = DanceFormationAPI(num_dancers)
    output_data = api.process_video_and_get_positions(video_input_path)
    # Optionally replace None with zeros in output_data
    # with open(json_output_path, 'w') as f:
    #     import json
    #     json.dump(output_data, f, indent=4)
