import cv2
import numpy as np
import torch
from ultralytics import YOLO
import os
from deep_sort_realtime.deepsort_tracker import DeepSort
import logging
from scipy.ndimage import gaussian_filter

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
    depth_map = gaussian_filter(depth_map, sigma=2)  # Apply Gaussian filter for smoothing
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


def normalize_position(bbox, frame_width, frame_height, grid_size=15, margin=0.05):
    """
    Normalize the bounding box center to grid coordinates with optional margins.
    Improved to handle non-uniform scaling better.
    """
    x_center = (bbox[0] + bbox[2]) / 2 / frame_width
    y_center = (bbox[1] + bbox[3]) / 2 / frame_height

    # Apply margins
    x_center = np.clip(x_center, margin, 1 - margin)
    y_center = np.clip(y_center, margin, 1 - margin)

    grid_x = int(x_center * (grid_size - 1))
    grid_y = int(y_center * (grid_size - 1))

    return (grid_x, grid_y)

def generate_position_matrix(dancer_states, grid_size=15):
    """
    Generate a position matrix ensuring dancers are spread out on the grid.
    """
    position_matrix = [[0 for _ in range(grid_size)] for _ in range(grid_size)]
    sorted_dancers = sorted(dancer_states.items(), key=lambda item: item[1]["depth"], reverse=True)

    for dancer_num, state in sorted_dancers:
        x, y = state["grid_position"]
        if position_matrix[y][x] == 0:
            position_matrix[y][x] = dancer_num
        else:
            # Find the nearest unoccupied cell using a spiral search
            found = False
            for radius in range(1, grid_size):
                for dx in range(-radius, radius + 1):
                    for dy in range(-radius, radius + 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < grid_size and 0 <= ny < grid_size and position_matrix[ny][nx] == 0:
                            position_matrix[ny][nx] = dancer_num
                            found = True
                            break
                    if found:
                        break
                if found:
                    break
            if not found:
                logging.warning(f"No available position found for dancer {dancer_num}")
    return position_matrix


class DanceFormationGenerator:
    def __init__(self, num_dancers, grid_size=15, distance_threshold=3):
        self.num_dancers = num_dancers
        self.grid_size = grid_size
        self.distance_threshold = distance_threshold  # Maximum grid distance to consider for reattachment
        self.current_dancer_num = 1
        self.track_id_to_dancer_num = {}
        self.dancer_num_to_track_id = {}
        self.dancer_states = {}
        self.default_positions = self.define_default_positions(num_dancers, grid_size)
        self.track_history = {}  # New: Keeps a history of track IDs to dancer numbers
        logging.info(f"DanceFormationGenerator initialized with {num_dancers} dancers and grid size {grid_size}.")

    def define_default_positions(self, num_dancers, grid_size=15):
        """
        Define default positions for dancers evenly spread across the grid.
        
        Args:
            num_dancers (int): Number of dancers.
            grid_size (int): Size of the grid.
            
        Returns:
            dict: Mapping from dancer number to (x, y) grid positions.
        """
        default_positions = {}
        # Calculate number of rows and columns needed to spread dancers
        cols = int(np.ceil(np.sqrt(num_dancers)))
        rows = int(np.ceil(num_dancers / cols))
        
        # Calculate spacing based on grid size and number of rows/columns
        x_spacing = grid_size / (cols + 1)
        y_spacing = grid_size / (rows + 1)
        
        dancer_num = 1
        for row in range(1, rows + 1):
            for col in range(1, cols + 1):
                if dancer_num > num_dancers:
                    break
                x = int(x_spacing * col)
                y = int(y_spacing * row)
                default_positions[dancer_num] = (x, y)
                dancer_num += 1
        return default_positions

    def find_closest_dancer(self, grid_position):
        """
        Find the closest dancer based on grid position.
        
        Args:
            grid_position (tuple): (grid_x, grid_y) of the new detection.
        
        Returns:
            int or None: Dancer number if a close dancer is found; otherwise, None.
        """
        min_distance = float('inf')
        closest_dancer = None
        for dancer_num, state in self.dancer_states.items():
            last_position = state.get("grid_position")
            if last_position:
                distance = np.linalg.norm(np.array(grid_position) - np.array(last_position))
                if distance < min_distance and distance <= self.distance_threshold:
                    min_distance = distance
                    closest_dancer = dancer_num
        return closest_dancer

    def assign_dancer_num(self, track_id, grid_position):
        """
        Assign a dancer number to a given track ID. Reattach identity based on proximity and history.
        
        Args:
            track_id (int): The track ID from Deep SORT.
            grid_position (tuple): (grid_x, grid_y) of the current detection.
        
        Returns:
            int or None: Assigned dancer number or None if no assignment is possible.
        """
        # If track ID has been seen before, use its existing mapping
        if track_id in self.track_id_to_dancer_num:
            return self.track_id_to_dancer_num[track_id]
        
        # Check history for recently seen track IDs and their positions
        for old_track_id, old_dancer_num in self.track_history.items():
            if old_track_id not in self.track_id_to_dancer_num:
                # Check if this history aligns with the current grid position
                old_position = self.dancer_states.get(old_dancer_num, {}).get("grid_position")
                if old_position and np.linalg.norm(np.array(grid_position) - np.array(old_position)) <= self.distance_threshold:
                    # Reattach identity
                    self.track_id_to_dancer_num[track_id] = old_dancer_num
                    self.dancer_num_to_track_id[old_dancer_num] = track_id
                    logging.info(f"Reattached historical dancer number {old_dancer_num} to track ID {track_id}.")
                    return old_dancer_num
        
        # Attempt to find the closest existing dancer
        closest_dancer = self.find_closest_dancer(grid_position)
        if closest_dancer is not None:
            # Reattach identity
            self.track_id_to_dancer_num[track_id] = closest_dancer
            self.dancer_num_to_track_id[closest_dancer] = track_id
            logging.info(f"Reattached dancer number {closest_dancer} to track ID {track_id}.")
            return closest_dancer
        
        # Assign a new dancer number only if under the limit
        if self.current_dancer_num <= self.num_dancers:
            dancer_num = self.current_dancer_num
            self.track_id_to_dancer_num[track_id] = dancer_num
            self.dancer_num_to_track_id[dancer_num] = track_id
            self.current_dancer_num += 1
            logging.info(f"Assigned dancer number {dancer_num} to new track ID {track_id}.")
            return dancer_num
        
        logging.warning(f"Maximum number of dancers ({self.num_dancers}) reached. Cannot assign new dancer number.")
        return None
    
    def update_track_history(self):
        """
        Updates the history of track IDs to retain recently used track-to-dancer mappings.
        """
        max_history_length = 50  # Keep a reasonable history size to avoid memory issues
        if len(self.track_history) > max_history_length:
            # Trim the history dictionary to maintain a max size
            self.track_history = dict(list(self.track_history.items())[-max_history_length:])
        
        # Add current mappings to the history
        for track_id, dancer_num in self.track_id_to_dancer_num.items():
            self.track_history[track_id] = dancer_num

    def remove_stale_tracks(self, current_frame):
        """
        Remove track mappings that haven't been updated recently.
        
        Args:
            current_frame (int): The current frame count.
        """
        stale_threshold = 60  # Number of frames to consider a track as stale
        stale_dancers = []
        for dancer_num, state in self.dancer_states.items():
            last_seen = state.get("last_seen", 0)
            if current_frame - last_seen > stale_threshold:
                stale_dancers.append(dancer_num)
        
        for dancer_num in stale_dancers:
            track_id = self.dancer_num_to_track_id.get(dancer_num)
            if track_id is not None:
                del self.track_id_to_dancer_num[track_id]
                del self.dancer_num_to_track_id[dancer_num]
                logging.info(f"Removed stale mapping for dancer number {dancer_num} (track ID {track_id}).")
            # Optionally, reset dancer state or assign a new default position
            # Here, we keep the last known position
            # self.dancer_states[dancer_num] = {
            #     "depth": float("inf"),
            #     "grid_position": self.default_positions[dancer_num],
            #     "last_seen": current_frame,
            # }

    def generate_position_matrices(self, video_path, frame_interval=10):
        """
        Generate position matrices for each relevant frame in the video.
        
        Args:
            video_path (str): Path to the input video.
            frame_interval (int): Number of frames to skip between processing.
            
        Returns:
            list: List of position matrices with timestamps.
        """
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
                "last_seen": frame_count,
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
                # Normalize position first to pass to assign_dancer_num
                grid_position = normalize_position(
                    bbox, frame_width := frame.shape[1], frame_height := frame.shape[0], grid_size=self.grid_size
                )
                dancer_num = self.assign_dancer_num(track_id, grid_position)
                if dancer_num:
                    # Depth estimation
                    depth_map = estimate_depth(frame)
                    depth = calculate_average_depth(depth_map, bbox)
                    dancers_detected.append({"num": dancer_num, "bbox": bbox, "grid_position": grid_position})
                    # Update dancer state
                    self.dancer_states[dancer_num]["depth"] = depth
                    self.dancer_states[dancer_num]["grid_position"] = grid_position
                    self.dancer_states[dancer_num]["last_seen"] = frame_count
            # Remove stale tracks
            self.remove_stale_tracks(frame_count)
            # Generate the position matrix
            position_matrix = generate_position_matrix(self.dancer_states, self.grid_size)
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
    def __init__(self, num_dancers, grid_size=15):
        self.generator = DanceFormationGenerator(num_dancers, grid_size)
        logging.info(f"DanceFormationAPI initialized with {num_dancers} dancers and grid size {grid_size}.")
    
    def process_video_and_get_positions(self, video_path, duration=None):
        output_data = self.generator.generate_position_matrices(video_path)
        print(output_data)
        return output_data


if __name__ == "__main__":
    video_input_path = "twice.mp4"  # Replace with your video path
    json_output_path = "output_position_matrices.json"
    num_dancers = 4  # Set the desired number of dancers
    grid_size = 10  # Set the grid size as needed
    api = DanceFormationAPI(num_dancers, grid_size)
    output_data = api.process_video_and_get_positions(video_input_path)
    # Optionally save the output to a JSON file
    with open(json_output_path, 'w') as f:
        import json
        json.dump(output_data, f, indent=4)
    logging.info(f"Position matrices saved to {json_output_path}")
