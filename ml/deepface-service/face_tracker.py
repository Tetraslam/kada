from deepface import DeepFace as face

result = face.verify(
  img1_path = "img1.jpg",
  img2_path = "img2.jpg",
)