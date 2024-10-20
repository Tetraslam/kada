from deepface import DeepFace as face




result = face.verify(
  img1_path = "./test/rose.jpg",
  img2_path = "./test/roseandbruno.jpg",
)

print(result)

#face.stream(db_path = "./test/database")