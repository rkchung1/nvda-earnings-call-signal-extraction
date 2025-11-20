from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import asyncio

from .utils import quarterly_shift

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
SUMMARIES_DIR = os.path.join(DATA_DIR, "summaries")
PIPELINE_STATUS_PATH = os.path.join(DATA_DIR, "pipeline_status.json")


@app.get("/health")
def health():
    return {"status": "ok"}

def _set_pipeline_status(message: str, state: str = "running"):
    """
    Write a simple JSON status file so the frontend can poll and display
    where the pipeline currently is.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    status = {"state": state, "message": message}
    with open(PIPELINE_STATUS_PATH, "w", encoding="utf-8") as f:
        json.dump(status, f)


# Helper function to run the full pipeline
def run_full_pipeline():
    """
    Run the end-to-end pipeline:
    1. Fetch the latest NVIDIA earnings call transcripts.
    2. Preprocess transcripts into cleaned prepared remarks / Q&A.
    3. Run sentiment analysis across quarters.
    4. Run LLM-based strategic focus extraction.
    5. Build quarterly cross-call sentiment shift data.
    6. Generate an LLM summary of the quarterly sentiment shifts.
    
    This function assumes the corresponding scripts live in the same
    backend package and write outputs into DATA_DIR / PROCESSED_DIR.
    """
    # Import inside the function to avoid running heavy code on startup
    from .utils import fetch_transcripts
    from .utils import preprocess_transcripts
    from .utils import sentiment
    from .utils import quarterly_shift_summary
    from .utils import llm_theme_extraction

    _set_pipeline_status("Pipeline started. Fetching latest transcripts...", "running")
    try:
        # 1) Fetch the latest transcripts (async)
        _set_pipeline_status("Fetching latest NVIDIA earnings call transcripts...", "running")
        asyncio.run(fetch_transcripts.main())

        # 2) Preprocess transcripts
        _set_pipeline_status("Preprocessing transcripts (cleaning, splitting management/Q&A)...", "running")
        preprocess_transcripts.process_all_transcripts()

        # 3) Run sentiment analysis
        _set_pipeline_status("Analyzing sentiment across all quarters with FinBERT...", "running")
        sentiment.process_all_transcripts()

        # 4) Run LLM-based strategic focus extraction.
        _set_pipeline_status("Extracting strategic focuses with llama3...", "running")
        llm_theme_extraction.extract_themes_for_all_transcripts()

        # 5) Build quarterly cross-call sentiment shift data
        _set_pipeline_status("Building quarterly cross-call sentiment shift data...", "running")
        quarterly_shift.write_quarterly_shift_json()

        # 6) Generate an LLM-written summary of the quarterly shifts
        _set_pipeline_status("Summarizing quarterly sentiment shifts with llama3...", "running")
        quarterly_shift_summary.main()

        _set_pipeline_status("Pipeline completed successfully. Click “Reload data” to see updated results.", "done")
    except Exception as e:
        # Record the failure in the status file so the frontend can display it
        _set_pipeline_status(f"Pipeline failed: {e}", "error")
        # Optionally re-raise or just swallow; for a background task it's often fine to swallow
        # raise


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
    path = os.path.join(DATA_DIR, "sentiment_results.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="sentiment_results.json not found")
    with open(path) as f:
        return json.load(f)


@app.get("/strategic_focuses")
def get_strategic_focuses():
    path = os.path.join(DATA_DIR, "strategic_focuses.json")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="strategic_focuses.json not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
    

@app.get("/quarterly_shift")
def get_quarterly_shift():
    path = os.path.join(DATA_DIR, "quarterly_shift.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="quarterly_shift.json not found")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/summaries/quarterly_shift")
def get_quarterly_shift_summary():
    if not os.path.isdir(SUMMARIES_DIR):
        raise HTTPException(status_code=404, detail="Summaries directory not found")

    path = os.path.join(SUMMARIES_DIR, "quarterly_shift_summary.txt")
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="quarterly_shift_summary.txt not found")

    with open(path, "r", encoding="utf-8") as f:
        return {"filename": "quarterly_shift_summary.txt", "content": f.read()}


@app.get("/pipeline/status")
def get_pipeline_status():
    """
    Return the current pipeline status message and state so the frontend
    can show live progress updates.
    """
    if not os.path.exists(PIPELINE_STATUS_PATH):
        return {"state": "idle", "message": "Pipeline has not been run yet."}
    try:
        with open(PIPELINE_STATUS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Pipeline status file is corrupted")


# Endpoint to trigger the full pipeline in the background
@app.post("/pipeline/refresh")
def refresh_pipeline(background_tasks: BackgroundTasks):
    """
    Trigger the full pipeline (fetch, preprocess, sentiment, themes)
    in the background.
    """
    # Reset the pipeline status immediately so the frontend does not see
    # a stale "done" state from the previous run on the first poll.
    _set_pipeline_status("Pipeline requested. Waiting to start…", "running")
    background_tasks.add_task(run_full_pipeline)
    return {"status": "started"}