import os
import json

# Paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # .../backend/utils
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))  # .../backend/data
SENTIMENT_FILE = os.path.join(DATA_DIR, "sentiment_results.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "quarterly_shift.json")


def load_sentiment_data():
    """Load sentiment_results.json from backend/data."""
    with open(SENTIMENT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def prepare_sentiment_data(data, section: str = "management"):
    """
    Prepare per-quarter sentiment series for a given section.

    section: "management" or "qa"
    Returns:
        quarters, positive[], neutral[], negative[], net_sentiment[]
    """
    quarters = []
    pos, neu, neg, net_sentiment = [], [], [], []

    for d in data:
        q = d["quarter"]
        scores = d[f"{section}_scores"]
        total = sum(scores.values()) or 1e-6  # avoid division by zero

        quarters.append(q)
        pos.append(scores["positive"] / total)
        neu.append(scores["neutral"] / total)
        neg.append(scores["negative"] / total)
        net_sentiment.append(scores["positive"] - scores["negative"])

    return quarters, pos, neu, neg, net_sentiment


def compute_quarterly_shift():
    """
    Compute quarterly sentiment shift for management and Q&A sections
    based on sentiment_results.json, and return a JSON-serializable dict.
    """
    data = load_sentiment_data()

    # Management section
    q_m, pos_m, neu_m, neg_m, net_m = prepare_sentiment_data(
        data, section="management"
    )
    # Q&A section
    q_q, pos_q, neu_q, neg_q, net_q = prepare_sentiment_data(
        data, section="qa"
    )

    return {
        "management": {
            "quarters": q_m,
            "positive": pos_m,
            "neutral": neu_m,
            "negative": neg_m,
            "net_sentiment": net_m,
        },
        "qa": {
            "quarters": q_q,
            "positive": pos_q,
            "neutral": neu_q,
            "negative": neg_q,
            "net_sentiment": net_q,
        },
    }


def write_quarterly_shift_json():
    """
    Compute quarterly shift and write it to backend/data/quarterly_shift.json.
    """
    result = compute_quarterly_shift()
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    return OUTPUT_FILE


if __name__ == "__main__":
    # Allow running this file directly to regenerate quarterly_shift.json
    path = write_quarterly_shift_json()
    print(f"Wrote quarterly shift data to: {path}")