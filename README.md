# NVIDIA Earnings Call Dashboard

An end-to-end dashboard for exploring **NVIDIA (NVDA) earnings call transcripts** across quarters.  

The app:

- Ingests and cleans last four quarterly earnings call transcripts from NVIDIA.
- Splits transcripts into **Management** and **Q&A** sections.
- Runs **sentiment analysis** per section and quarter using FinBERT.
- Extracts **3–5 strategic focuses** per call with llama3.
- Aggregates results into **cross-quarter sentiment trends**, stacked bar charts, heatmaps, and summaries.
- Exposes everything through a **React + Vite** web UI with interactive Plotly charts.

---

## What the app does

**Backend (FastAPI)**

- Provides API endpoints to:
  - Discover and/or load NVDA earnings call transcripts.
  - Run a full **NLP pipeline**:
    - Clean raw transcripts.
    - Split into management remarks vs Q&A.
    - Compute sentiment distributions (positive / neutral / negative) for each section.
    - Generate **strategic focuses** (short themes + summaries) for each call using an LLM.
    - Compute **quarterly shift** metrics (net sentiment by quarter, section).
    - Write results to JSON / text files under the backend data directory.
  - Serve:
    - Sentiment results.
    - Strategic focuses.
    - Quarterly shift JSON.
    - Cross-quarter textual summary.
    - Transcript lists and per-section transcript text.

**Frontend (React + Vite + Plotly)**

- Shows a **top row** of available transcripts (Q1/Q2/Q3/Q4 YYYY style labels).
- For the selected call:
  - Left side: full transcript split into **Management** and **Q&A** text panes.
  - Right side:
    - **Pie charts** for sentiment breakdown (positive / neutral / negative) for Management and Q&A.
    - **Strategic focuses** list (theme + short summary).
- “Cross-Quarter Analysis” view:
  - **Stacked bar + line charts** of sentiment shift over multiple quarters for Management and Q&A.
  - **Heatmap-style tables** of sentiment proportions by quarter.
  - A **text summary tile** with the quarterly shift narrative.
- A **pipeline status indicator** shows live backend messages while the pipeline runs.

---

## How to run it locally

### 1. Prerequisites

- Python 3.10+  
- Node.js 18+ and npm
- Git
- (Optional but recommended) `conda` or `venv` for Python environments
- Any additional tools required by your NLP stack (e.g. [Ollama](https://ollama.com) if you’re using local LLMs)

Clone the repo:

```bash
git clone https://github.com/<your-username>/nvda-earnings-call-signal-extraction.git
cd nvda-earnings-call-signal-extraction