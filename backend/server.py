from fastapi import FastAPI
import time

app = FastAPI()

@app.get("/api/hello-world")
async def hello_world():
    return {"message": "Hello World"}


@app.post("/api/process-video")
async def process_video(query: str):
    """
    Currently a placeholder for the actual function.
    Takes as input a song query (e.g. "aespa - armageddon") and returns position matrix
    """
    print(f"Processing query: {query}")
    time.sleep(5)

    return {
        "song": query,
        "positions": [
            [0.0, [[0, 0, 1, 0],
                   [0, 2, 0, 0],
                   [0, 0, 3, 0],
                   [4, 0, 0, 0]]],
            [1.0, [[0, 1, 0, 0],
                   [0, 0, 3, 0],
                   [0, 2, 0, 0],
                   [0, 4, 0, 0]]],
            [2.0, [[1, 0, 0, 0],
                   [0, 0, 0, 3],
                   [0, 4, 2, 0],
                   [0, 0, 0, 0]]],
            [3.0, [[0, 1, 0, 0],
                   [0, 0, 3, 0],
                   [4, 0, 0, 0],
                   [0, 0, 2, 0]]],
            [4.0, [[1, 0, 0, 0],
                   [4, 0, 0, 3],
                   [0, 0, 0, 0],
                   [0, 0, 2, 0]]],
            [5.0, [[0, 1, 0, 3],
                   [0, 4, 0, 0],
                   [0, 0, 2, 0],
                   [0, 0, 0, 0]]],
            [6.0, [[0, 0, 1, 3],
                   [0, 0, 4, 0],
                   [0, 0, 0, 2],
                   [0, 0, 0, 0]]],
            [7.0, [[0, 0, 0, 1],
                   [0, 0, 3, 4],
                   [0, 0, 0, 2],
                   [0, 0, 0, 0]]],
            [8.0, [[0, 0, 1, 0],
                   [0, 0, 3, 0],
                   [0, 0, 4, 2],
                   [0, 0, 0, 0]]],
            [9.0, [[0, 1, 0, 0],
                   [0, 3, 0, 0],
                   [0, 4, 2, 0],
                   [0, 0, 0, 0]]],
            [10.0, [[1, 0, 0, 0],
                    [3, 0, 0, 0],
                    [4, 2, 0, 0],
                    [0, 0, 0, 0]]]
        ]
    }
