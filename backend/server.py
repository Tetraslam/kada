from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import uuid
import yt_dlp
from main import DanceFormationAPI
import subprocess

app = FastAPI()


@app.get("/api/hello-world")
async def hello_world():
    return {"message": "Hello World"}


class ProcessVideoRequest(BaseModel):
    query: str
    num_dancers: int = 5
    duration: int = 7


def download_video(query, duration=7):
    """
    Downloads the video using yt-dlp based on the query and trims it to the specified duration.
    Returns the path to the trimmed video file.
    """
    unique_filename = f"{uuid.uuid4()}"
    output_filename = f"{unique_filename}_trimmed.mp4"
    ydl_opts = {
        "format": "bestvideo+bestaudio/best",
        "noplaylist": True,
        "outtmpl": f"{unique_filename}.%(ext)s",
        "quiet": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            search_query = f"ytsearch1:{query}"
            result = ydl.extract_info(search_query, download=True)
            if "entries" in result:
                video = result["entries"][0]
            else:
                video = result
            video_filename = ydl.prepare_filename(video)

            # Trim the video using FFmpeg
            trimmed_video_filename = output_filename
            trim_command = [
                "ffmpeg",
                "-y",
                "-i",
                video_filename,
                "-t",
                str(duration),
                "-c",
                "copy",
                trimmed_video_filename,
            ]
            subprocess.run(
                trim_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )

            # Remove the original downloaded video
            os.remove(video_filename)

            return trimmed_video_filename
        except Exception as e:
            print(f"Error downloading or trimming video: {e}")
            return None


@app.post("/api/process-video")
def process_video(request: ProcessVideoRequest):
    """
    Processes a video based on the song query and returns position matrices.
    """
    query = request.query
    num_dancers = request.num_dancers
    duration = request.duration
    print(
        f"Processing query: {query} for {duration} seconds with {num_dancers} dancers"
    )

    # Step 1: Download and trim the video using yt-dlp and FFmpeg
    video_path = download_video(query, duration=duration)
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=500, detail="Video could not be downloaded.")

    # Step 2: Process the video to generate position matrices
    api = DanceFormationAPI(num_dancers)
    try:
        output_data = api.process_video_and_get_positions(video_path)
    except Exception as e:
        print(f"Error processing video: {e}")
        raise HTTPException(status_code=500, detail="Error processing video.")
    finally:
        # Clean up the downloaded (trimmed) video
        if os.path.exists(video_path):
            os.remove(video_path)

    # Step 3: Format the output data to match the expected response structure
    positions = []
    for entry in output_data:
        timestamp = entry["timestamp"]
        position_matrix = entry["position_matrix"]
        positions.append([timestamp, position_matrix])

    # Step 4: Return the processed positions
    return {"song": query, "positions": positions}
