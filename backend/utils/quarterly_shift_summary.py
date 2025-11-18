import os
import json
from typing import Dict, Any
from ollama import chat


MODEL = "llama3"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # .../backend/utils
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))  # .../backend/data
OUTPUT_FILE = os.path.join(DATA_DIR, "quarterly_shift.json")
SUMMARY_FILE = os.path.join(DATA_DIR, "summaries", "quarterly_shift_summary.txt")


def load_quarterly_shift(path: str = OUTPUT_FILE) -> Dict[str, Any]:
    """
    Load the quarterly_shift.json data.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"quarterly shift file not found at {path}")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_summary_prompt(shift_data: Dict[str, Any]) -> str:
    """
    Build a compact textual representation of the quarterly shift data
    for the LLM to summarize.
    """
    parts = []

    mgmt = shift_data.get("management", {})
    qa = shift_data.get("qa", {})

    def section_to_lines(label: str, section: Dict[str, Any]) -> str:
        quarters = section.get("quarters") or []
        pos = section.get("positive") or []
        neu = section.get("neutral") or []
        neg = section.get("negative") or []
        net = section.get("net") or []

        def fmt(v: Any) -> str:
            if v is None:
                return "N/A"
            try:
                return f"{float(v):.3f}"
            except (TypeError, ValueError):
                return str(v)

        lines = [label]
        for i, q in enumerate(quarters):
            p = pos[i] if i < len(pos) else None
            n0 = neu[i] if i < len(neu) else None
            ng = neg[i] if i < len(neg) else None
            nt = net[i] if i < len(net) else None
            lines.append(
                f"  {q}: positive={fmt(p)} neutral={fmt(n0)} negative={fmt(ng)} net={fmt(nt)}"
            )
        return "\n".join(lines)

    if mgmt:
        parts.append(section_to_lines("Management sentiment by quarter:", mgmt))
    if qa:
        parts.append(section_to_lines("Q&A sentiment by quarter:", qa))

    return "\n\n".join(parts)


def summarize_quarterly_shift(shift_data: Dict[str, Any]) -> str:
    """
    Call Llama3 to produce a natural-language summary of cross-quarter sentiment.
    """
    content = build_summary_prompt(shift_data)

    system_msg = (
        "You are an expert financial analyst. "
        "You analyze sentiment trends from earnings call data across quarters. "
        "Given structured sentiment scores for management remarks and Q&A, "
        "write a concise, plain-English summary of the key trends. "
        "Highlight changes in overall sentiment, notable improvements or "
        "deteriorations, and any divergence between management and Q&A. "
        "Keep the summary under 250 words and avoid repeating the raw numbers."
    )

    user_msg = (
        "Here is the structured sentiment data across quarters. "
        "Please summarize the key cross‑quarter sentiment shifts.\n\n"
        f"{content}"
    )

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]

    response = chat(
        model=MODEL,
        messages=messages,
    )
    
    summary = response["message"]["content"].strip()
    return summary


def write_summary(summary: str, path: str = SUMMARY_FILE) -> None:
    """
    Write the generated summary to a text file in the data directory.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(summary)


def main() -> None:
    """
    Entry point: load quarterly_shift.json, summarize it with llama3,
    and write the summary to quarterly_shift_summary.txt.
    """
    shift_data = load_quarterly_shift()
    summary = summarize_quarterly_shift(shift_data)
    write_summary(summary)
    print(f"Quarterly shift summary written to {SUMMARY_FILE}")


if __name__ == "__main__":
    main()