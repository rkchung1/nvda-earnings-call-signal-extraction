import os
import re
import unicodedata
from tqdm import tqdm

DATA_DIR = os.path.join(os.getcwd(), "../data")
RAW_DIR = os.path.join(DATA_DIR, "transcripts")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed_transcripts")
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Section Split
def split_sections(text):
    """Separate prepared remarks and Q&A sections."""
    qa_marker = re.search(r"Questions & Answers:", text, re.IGNORECASE)
    if qa_marker:
        return text[:qa_marker.start()], text[qa_marker.start():]
    else:
        return text, ""


# Cleaning & Normalization
def clean_text(text: str) -> str:
    """Remove non-content artifacts like metadata, timestamps, headers."""
    text = re.sub(r"Image source:.*?[\r\n]+", "", text)
    text = re.sub(r"Contents:.*?(Prepared Remarks|Questions and Answers)", "", text, flags=re.I|re.S)
    text = re.sub(r"Call Participants.*?(Prepared Remarks:)", "Prepared Remarks:", text, flags=re.I|re.S)
    text = re.sub(r"Duration:.*", "", text)
    text = re.sub(r"More .*analysis.*", "", text)

    # Remove double hyphen lines and metadata
    text = re.sub(r"^\s*--.*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\[.*?\]", "", text)
    text = re.sub(r"\(.*?%?\)", "", text)

    # Remove tickers, timestamps, and extra spacing
    text = re.sub(r"NVDA", "", text)
    text = re.sub(r"\d{1,2}:\d{2}\s*(a\.m\.|p\.m\.)?\s*ET", "", text, flags=re.I)
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


# Remove Operator Intro
def remove_operator_intro(text: str) -> str:
    """Trim opening remarks before the first executive speaker."""
    match = re.search(r"(Colette Kress|Jensen Huang|Simona Jankowski)", text)
    if match:
        return text[match.start():]
    return text


# Remove Call Participants
def remove_call_participants(text: str) -> str:
    """
    Remove trailing 'Call participants' section and any 'More NVDA analysis' footer.
    """
    # Match 'Call participants:' or similar
    text = re.sub(
        r"(Call participants?:.*?$)(.|\n)*",  # capture everything after that heading
        "",
        text,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    return text.strip()


def normalize_text(text: str) -> str:
    """Normalize unicode characters and remove weird symbols."""
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^a-zA-Z0-9.,;:!?'\-\n ]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


# Full Preprocessing
def preprocess_transcript(raw_text: str) -> dict:
    """Split, then clean and normalize each section."""
    prepared_raw, qa_raw = split_sections(raw_text)

    prepared_clean = normalize_text(remove_operator_intro(clean_text(prepared_raw)))
    qa_clean = normalize_text(remove_call_participants(clean_text(qa_raw)))

    return {"prepared": prepared_clean, "qa": qa_clean}


# Process All Files
def process_all_transcripts():
    print("Preprocessing transcripts (split → clean → normalize)...")
    for filename in tqdm(os.listdir(RAW_DIR), desc="Processing transcripts"):
        if not filename.lower().endswith(".txt"):
            continue

        path = os.path.join(RAW_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            raw_text = f.read()

        processed = preprocess_transcript(raw_text)

        base_name = os.path.splitext(filename)[0]
        out_full = os.path.join(PROCESSED_DIR, f"{base_name}_cleaned.txt")
        out_prepared = os.path.join(PROCESSED_DIR, f"{base_name}_prepared.txt")
        out_qa = os.path.join(PROCESSED_DIR, f"{base_name}_qa.txt")

        with open(out_full, "w", encoding="utf-8") as f:
            f.write(processed["prepared"] + "\n\n" + processed["qa"])

        with open(out_prepared, "w", encoding="utf-8") as f:
            f.write(processed["prepared"])

        with open(out_qa, "w", encoding="utf-8") as f:
            f.write(processed["qa"])

    print(f"\nCleaned transcripts saved to: {PROCESSED_DIR}")


if __name__ == "__main__":
    process_all_transcripts()