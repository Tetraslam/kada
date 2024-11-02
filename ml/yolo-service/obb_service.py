from ultralytics import YOLO
import cv2
import numpy as np
from datetime import timedelta

# # Load a model
model = YOLO("yolov8n.pt")

# # Train the model
# results = model.train(data="coco8.yaml", epochs=8, imgsz=640)
video_path = '/Users/xiaolesu/CodeProjects/IndepProj/BostonHack/kada/ml/yolo-service/Video/test.mp4'

cap = cv2.VideoCapture(video_path)

# Get video properties
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Initialize an array to store results
results = model(video_path, show=True)

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)

timestamps = []
idx = 0
while cap.isOpened():
  ret, frame = cap.read()
  if not ret:
      break
  timestamp = timedelta(seconds=idx/fps)
  boxes = results[idx].boxes
  coordinates = []
  
  for box in boxes:
    xyxy = box.xyxy.numpy()
    class_id = int(box.cls)
    if(class_id ==0) :
      x_min, y_min, x_max, y_max = xyxy[0]
      coordinates.append({
        #bottom left, top right
        "idx": idx,
        "coord": [[round(x_min), round(y_min)], [round(x_max), round(y_max)]],
      })
  timestamps.append({
      "time": str(timestamp),
      "capture" : coordinates
  })
   
  idx +=1

cap.release()
cv2.destroyAllWindows()
print(timestamps)


