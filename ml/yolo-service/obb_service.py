from ultralytics import YOLO
import cv2
import numpy as np
from datetime import timedelta

# # Load a model
model = YOLO("yolov8n.pt")

# # Train the model
# results = model.train(data="coco8.yaml", epochs=8, imgsz=640)

# model.info()
# Load a model
# model = YOLO("yolo8n-obb.yaml")  # build a new model from YAML
# model = YOLO("yolov8n-obb.pt")  # load a pretrained model (recommended for training)
# model = YOLO("yolo8n-obb.yaml").load("yolov8n-obb.pt")  # build from YAML and transfer weights
# results = model.train(data="dota8.yaml", epochs=5, imgsz=640)

# for result in results:
#     dataframe = result.boxes.xyxy 

# dataframe = results[0].boxes.data.cpu().numpy()
video_path = '/Users/xiaolesu/CodeProjects/IndepProj/BostonHack/kada/ml/yolo-service/Video/ShortTest.mp4'
# results = model(video_path, show=True, save=True)
# print(results.xyxy[0])  # print results to screen

cap = cv2.VideoCapture(video_path)

# Get video properties

fps = cap.get(cv2.CAP_PROP_FPS)
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Initialize an array to store results
results = model(video_path)


coordinates = []

idx = 0
for result in results:
  boxes = result.boxes
  for box in boxes:
    xyxy = box.xyxy.numpy()
    class_id = box.cls
    if(class_id ==0) :
      x_min, y_min, x_max, y_max = xyxy[0]
      coordinates.append({
        #bottom left, top right
        "idx": idx,
        "coord": [[round(x_min), round(y_min)], [round(x_max), round(y_max)]],
      })
    
  idx +=1


print(coordinates)
# cap = cv2.VideoCapture(video_path)

# fps = cap.get(cv2.CAP_PROP_FPS)

# while cap.isOpened():
#     ret, frame = cap.read()

#     if not ret:
#         break

#     timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)

#     timestamp_sec = timestamp_ms / 1000.0
# cap.release()
# cv2.destroyAllWindows()

#       #  Confidence: {confidence}, Class ID: {class_id}
    
#     print("next frame")
#     frame_idx += 1

# cap.release()

# results.show() 
# results.save()

# # Results array now contains bounding box coordinates and timestamps for each frame
# print(results)


# for result in results:
#     boxes = result.boxes 
#     # box -> posn-x-min posn-y-min posn-y-max posn-x-max
#     for box in boxes:
#         xyxy = box.xyxy.numpy()
#         x_min, y_min, x_max, y_max = xyxy[0]
#         # print("Timestamp: {timestamp_sec:.2f}s, Bounding box coordinates: x_min={x_min}, y_min={y_min}, x_max={x_max}, y_max={y_max}")



# while cap.isOpened():
#     timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)

#     timestamp_sec = timestamp_ms / 1000.0
    
# cap.release()
# cv2.destroyAllWindows()