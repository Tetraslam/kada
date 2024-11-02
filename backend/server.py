from fastapi import FastAPI

app = FastAPI()

@app.get("/app")
async def root():
    return {"message": "Hello World"}
