from ultralytics import YOLO
import cv2
import numpy as np
from datetime import timedelta
import json

# # Load a model
model = YOLO("model.pt")

# # Train the model
# results = model.train(data="coco8.yaml", epochs=20, imgsz=640)
video_path = './Video/MidasTouch.mp4'

cap = cv2.VideoCapture(video_path)

frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

results = model(video_path, show=True, save=True)

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

file_name = 'data.json'
with open(file_name, 'w') as json_file:
    json.dump(timestamps, json_file, indent=2)

