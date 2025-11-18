import os, re, json
from tqdm import tqdm
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

# Config
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # .../backend/utils
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))  # .../backend/data
OUTPUT_FILE = os.path.join(DATA_DIR, "sentiment_results.json")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed_transcripts")

MODEL_NAME = "ProsusAI/finbert"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

LABEL_MAP = {0: "negative", 1: "neutral", 2: "positive"}

# Utility Functions
def load_transcript(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def extract_quarter_year(filename):
    """
    Extract quarter and year from filename.
    """
    match = re.search(r"q([1-4])-(\d{4})", filename, re.IGNORECASE)
    if match:
        return f"Q{match.group(1)}_{match.group(2)}"
    year_match = re.search(r"(\d{4})", filename)
    return year_match.group(1) if year_match else "Unknown"

def analyze_sentiment(text):
    """Return sentiment label + average confidence scores across chunks using raw FinBERT logits."""
    if not text.strip():
        return {"label": "N/A", "scores": {"positive": 0, "neutral": 0, "negative": 0}}

    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = [' '.join(sentences[i:i+5]) for i in range(0, len(sentences), 5)]

    scores = {"positive": 0, "neutral": 0, "negative": 0}
    total = 0

    for chunk in chunks[:40]:
        try:
            inputs = tokenizer(chunk[:512], return_tensors="pt", truncation=True)
            with torch.no_grad():
                outputs = model(**inputs)
                probs = F.softmax(outputs.logits, dim=1)[0]
            for i, label in LABEL_MAP.items():
                scores[label] += probs[i].item()
            total += 1
        except Exception:
            continue

    if total > 0:
        for k in scores:
            scores[k] /= total

    dominant_label = max(scores, key=scores.get)
    return {"label": dominant_label, "scores": scores}

# Main Processing
def process_all_transcripts():
    results = []
    # Use processed transcripts created by preprocess_transcripts.py
    processed_dir = PROCESSED_DIR
    if not os.path.isdir(processed_dir):
        print(f"Processed transcripts directory not found: {processed_dir}")
        return

    prepared_files = [f for f in os.listdir(processed_dir) if f.lower().endswith("_prepared.txt")]
    if not prepared_files:
        print(f"No '*_prepared.txt' files found in {processed_dir}. Run preprocess_transcripts.py first.")
        return

    for filename in tqdm(prepared_files, desc="Processing processed transcripts"):
        base = filename[:-len("_prepared.txt")]
        prepared_path = os.path.join(processed_dir, filename)
        qa_path = os.path.join(processed_dir, f"{base}_qa.txt")
        # fallback to combined cleaned file if prepared not present (defensive)
        combined_path = os.path.join(processed_dir, f"{base}_cleaned.txt")

        prepared_text = ""
        qa_text = ""

        try:
            prepared_text = load_transcript(prepared_path)
        except Exception:
            # if prepared missing, try combined
            if os.path.exists(combined_path):
                prepared_text = load_transcript(combined_path)
            else:
                prepared_text = ""

        if os.path.exists(qa_path):
            try:
                qa_text = load_transcript(qa_path)
            except Exception:
                qa_text = ""
        else:
            # if no separate QA file, try to extract from combined cleaned file after a blank line
            if os.path.exists(combined_path):
                combined = load_transcript(combined_path)
                parts = combined.split("\n\n", 1)
                qa_text = parts[1] if len(parts) > 1 else ""

        mgmt_result = analyze_sentiment(prepared_text)
        qa_result = analyze_sentiment(qa_text)
        quarter = extract_quarter_year(base)

        results.append({
            "file": f"{base}",
            "quarter": quarter,
            "management_sentiment": mgmt_result["label"],
            "management_scores": mgmt_result["scores"],
            "qa_sentiment": qa_result["label"],
            "qa_scores": qa_result["scores"]
        })

    # Sort by quarter/year
    def sort_key(r):
        match = re.search(r"Q(\d)_(\d{4})", r["quarter"])
        return (int(match.group(2)), int(match.group(1))) if match else (0, 0)
    results = sorted(results, key=sort_key)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n Sentiment results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    process_all_transcripts()