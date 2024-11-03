from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
import yt_dlp
import subprocess
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import asyncio
import logging
from main import DanceFormationAPI  # Assuming main.py is in the same directory

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    # Add other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessVideoRequest(BaseModel):
    query: str
    num_dancers: int = 5
    duration: int = 40  # Duration in seconds

async def download_video(query, duration=7):
    """
    Downloads the video using yt-dlp based on the query and trims it to the specified duration.
    Returns the path to the trimmed video file.
    """
    unique_filename = f'{uuid.uuid4()}'
    output_filename = f'{unique_filename}_trimmed.mp4'
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'noplaylist': True,
        'outtmpl': f'{unique_filename}.%(ext)s',
        'quiet': True,
    }
    def run_yt_dlp():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                search_query = f"ytsearch1:{query}"
                result = ydl.extract_info(search_query, download=True)
                if 'entries' in result:
                    video = result['entries'][0]
                else:
                    video = result
                video_filename = ydl.prepare_filename(video)

                # Trim the video using FFmpeg
                trimmed_video_filename = output_filename
                trim_command = [
                    'ffmpeg', '-y', '-i', video_filename, '-t', str(duration),
                    '-c', 'copy', trimmed_video_filename
                ]
                subprocess.run(trim_command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

                # Remove the original downloaded video
                os.remove(video_filename)

                return trimmed_video_filename
            except Exception as e:
                logger.error(f"Error downloading or trimming video: {e}")
                return None

    return await asyncio.to_thread(run_yt_dlp)

async def process_video_and_get_positions(video_path, num_dancers, duration):
    """
    Processes the video to generate position matrices.
    """
    api = DanceFormationAPI(num_dancers)
    try:
        output_data = api.process_video_and_get_positions(video_path, duration=duration)
        return output_data
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        # Clean up the downloaded (trimmed) video
        if os.path.exists(video_path):
            os.remove(video_path)
        raise HTTPException(status_code=500, detail="Error processing video.")


# Limit concurrent processing to prevent server overload
processing_semaphore = asyncio.Semaphore(2)  # Adjust the number as needed

@app.post("/api/process-video")
async def process_video(request: ProcessVideoRequest):
    """
    Processes a video based on the song query and returns position matrices.
    """
    query = request.query
    num_dancers = request.num_dancers
    duration = request.duration
    logger.info(f"Processing query: {query} for {duration} seconds with {num_dancers} dancers")

    async with processing_semaphore:
        # Step 1: Download and trim the video using yt-dlp and FFmpeg
        video_path = await download_video(query, duration=duration)
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=500, detail="Video could not be downloaded.")

        # Step 2: Process the video to generate position matrices
        output_data = await process_video_and_get_positions(video_path, num_dancers, duration)

    # Step 3: Prepare the positions data
    positions = []
    for entry in output_data:
        try:
            timestamp = entry['timestamp']
            position_matrix = entry['position_matrix']
            positions.append([timestamp, position_matrix])
        except (KeyError, IndexError) as e:
            logger.error(f"Error parsing output data at entry {entry}: {e}")
            continue  # Skip invalid entries

    # Construct the local video URL
    video_url = f"/videos/{os.path.basename(video_path)}"

    # Return the response
    response = {
        "song": query,
        "positions": positions,
        "video_url": video_url,
        # Optionally include artist or other metadata
        # "artist": artist_name,
    }

    logger.info(f"Processing completed for query: {query}")
    return response

# Serve video files
@app.get("/videos/{video_filename}")
async def get_video(video_filename: str):
    """
    Serves the video file.
    """
    # Prevent directory traversal attacks
    safe_filename = os.path.basename(video_filename)
    video_path = Path(os.getcwd()) / safe_filename
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found.")

    return FileResponse(video_path, media_type="video/mp4")
