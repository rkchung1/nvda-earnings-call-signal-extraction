# NVIDIA Earnings Call Signal Extraction Dashboard

An end-to-end dashboard for exploring **NVIDIA (NVDA) earnings call transcripts** across quarters.

The app:

- Ingests and cleans the last four quarterly earnings call transcripts from NVIDIA.
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
  - Deliver:
    - Sentiment results.
    - Strategic focuses.
    - Quarterly shift data.
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
```

### 2. Backend Setup (FastAPI)

From the repo root:

```bash
cd backend
```

Create and activate a virtual environment (example with venv):

```bash
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the FastAPI app locally:

```bash
uvicorn api:app --reload --port 8000
```

You should now have the API running at:

```bash
http://127.0.0.1:8000
```

### 3. Frontend setup (React + Vite)

In a new terminal window (keep the backend running), from the repo root:

```bash
cd frontend
npm install
```

For local development, create a file:

```bash
# inside frontend/
touch .env.local
```

Add:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

This tells the frontend where to find the backend.

Now start the dev server:

```bash
npm run dev
```

Open the URL printed in the terminal, usually:

```bash
http://localhost:5173
```

You should see the NVIDIA Earnings Call Dashboard.

Workflow in the UI:
	1.	Click “Run Pipeline” to execute the full backend pipeline for new data if available (scraping/processing/inference).
	2.	Wait for the status messages to show completion.
	3.	Click “Reload Data” to pull updated sentiment, strategic focuses, quarterly shift data, and transcripts.

---

## AI / NLP Tools, APIs, and Models Used

The exact tools may vary depending on how you configure the project, but the stack generally includes:

### Large Language Models (LLMs)

- **Ollama** (`ollama` Python client / local HTTP API)  
  - Used to generate **strategic focuses** (themes + summaries) from transcript text when running a local LLM.
  - The backend talks to the Ollama **HTTP API** running on your machine (typically `http://localhost:11434`) via the official Python client.

### Transformers / Deep Learning

- **Hugging Face Transformers** (`transformers`)  
  - Specifically uses FinBert, a pre-trained NLP model to analyze sentiment of financial text.
- **PyTorch** (`torch`)

Used to:

- Perform **sentiment classification** (positive / neutral / negative) on transcript chunks.
- Optionally provide **embeddings** or other NLP features for more advanced analysis.

### Classical NLP / Scraping

- **Scraping and HTTP clients**
  - `playwright` – for scripted, headless browser interactions (e.g., loading dynamic transcript pages).
  - `requests` (and/or similar libraries) – for making HTTP calls to external websites that host transcripts.

- **HTML parsing and text processing**
  - `beautifulsoup4` – for parsing and extracting transcript text from HTML.
  - Standard Python utilities for:
    - Cleaning and normalizing text.
    - Splitting transcripts into **Management** and **Q&A** sections.
    - Formatting intermediate and final outputs into JSON files consumed by the frontend.

---

## Key Assumptions and Limitations

### 1. Domain Scope

- The implementation is focused specifically on **NVIDIA (NVDA)** earnings call transcripts.
- File naming conventions are assumed in parts of the pipeline and frontend.
- Extending to multiple companies or different naming styles will require:
  - Adjusting scraping/ingestion logic.
  - Updating file naming and parsing logic.
  - Updating how the frontend derives display labels from filenames.

### 2. Data Availability

- Web scraping for transcripts currently targets The Motley Fool earnings call pages:
  - Motley Fool does not always have the most recent earnings calls immediately.
  - As a result, last four quarters are not up to date but instead they are the last four quarters available on the website.

### 3. LLM and Model Variability

- Strategic focuses and text summaries depend on LLM outputs:
  - Results may vary slightly between runs.
  - Quality depends on the chosen model, prompts, and parameters (llama3 is not the strongest but free and easy to run locally).
- Sentiment models are not perfect:
  - Earnings calls use nuanced, technical, and sometimes cautious language.
  - Some misclassifications or borderline cases are expected.

### 4. Performance and Cold Starts

- On hosted platforms (e.g. Render for the backend, Vercel for the frontend):
  - The backend may experience cold start delays on the first request after inactivity.
- Running the full pipeline (scraping + model inference + summarization) can be:
  - Slow.
  - Resource-intensive.