from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed_transcripts")


def _safe_basename(filename: str) -> str:
    # prevent path traversal; only allow plain basenames
    base = os.path.basename(filename)
    if base != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return base


@app.get("/transcripts")
def list_transcripts():
    if not os.path.isdir(PROCESSED_DIR):
        raise HTTPException(status_code=404, detail="Processed transcripts directory not found")
    files = [f for f in os.listdir(PROCESSED_DIR) if f.endswith(".txt")]
    return [{"name": f, "path": f"/transcript/{f}"} for f in files]


@app.get("/transcript/{filename}")
def get_transcript(filename: str):
    name = _safe_basename(filename)
    path = os.path.join(PROCESSED_DIR, name)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Transcript not found")
    with open(path, "r", encoding="utf-8") as f:
        return {"filename": name, "content": f.read()}


@app.get("/sentiment")
def get_sentiment():
    file_path = os.path.join(DATA_DIR, "sentiment_results.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="sentiment_results.json not found")
    with open(file_path) as f:
        return json.load(f)


@app.get("/strategic_focuses")
def get_strategic_focuses():
    path = os.path.join(DATA_DIR, "strategic_focuses.json")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="strategic_focuses.json not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)