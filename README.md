# K-Pop Formation Generator

## Setup

Frontend:

1. `cd frontend`
2. `pnpm install`
3. `npx next dev`

The frontend now runs on https://localhost:3000.

Backend:

1. `cd backend`
2. `pip install -r requirements.txt`

## Features

- [ ] Automatically detects position and translates to a matrix
- [ ] Detects depth
- [ ] Color-codes center
- [ ] 3D view (ThreeJS)
- [ ] Sync frames/poses with music
- [ ] Store user data in Supabase
- [ ] Pose estimation for showing move sequences
- [ ] Service-based arch

## Tech Stack

- Frontend
  - NextJS
  - ThreeJS
  - React
  - Shadcn
- Backend
  - FastAPI
  - Pytorch
  - GPT-4o
  - Deepface
  - OpenCV
  - MediaPipe (pose estimation)
  - Numpy (position translation)
  - Supabase

## Timeline

- Make Figma (Char)
- Three.js rendering engine (William)
- Build UI (William)
- Facial recognition + persistence (Char & Shresht)
- Pose estimation + depth (Char & Shresht)
- Create position (Char & Shresht)
- API (Char & Shresht)
- Supabase schemas + storage (Char & Shresht)
- Connect API to frontend
- Color coding (gpt 4o)
