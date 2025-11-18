import os, json, re
from ollama import chat
from json_repair import repair_json

# Config
MODEL = "llama3"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # .../backend/utils
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "processed_transcripts"))  # .../backend/data/processed_transcripts
OUTPUT_FILE = os.path.join(BASE_DIR, "..", "data", "strategic_focuses.json")
SUMMARY_DIR = os.path.join(BASE_DIR, "..", "data", "summaries")

def summarize_transcript(text: str) -> str:
    """
    Summarize the transcript to shorten context before analysis.
    """
    prompt = (
        "Summarize the key strategic and business points of NVIDIA's earnings call below "
        "in under 400 words, focusing on growth drivers, initiatives, and major themes.\n\n"
    )

    response = chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt + text[:12000]}],  # limit for speed
    )
    summary = response["message"]["content"].strip()
    return summary

# Helper function to extract themes
def extract_strategic_focuses(text: str, quarter: str):
    """
    Extract 3–5 concise strategic focuses as JSON.
    """
    prompt = f"""
    You are an expert financial analyst reviewing NVIDIA's {quarter} earnings call.

    Identify exactly 3–5 key strategic focuses or initiatives that management emphasized.
    Each item must have:
    - "theme": 2–8 words
    - "summary": one concise paragraph (max 3 sentences) explaining its significance.

    Respond *only* with valid JSON inside <json> tags.
    Do not include markdown, commentary, or explanations.

    Example:
    <json>
    [
    {{
        "theme": "AI Infrastructure Expansion",
        "summary": "NVIDIA emphasized accelerating the build-out of large-scale GPU clusters to meet rising global AI demand. Management highlighted strong hyperscaler investment cycles. The initiative aims to solidify NVIDIA’s position as the backbone of AI compute."
    }},
    {{
        "theme": "Data Center Platform Leadership",
        "summary": "The company reiterated its dominance across both training and inference workloads. NVIDIA noted expanding adoption of its full-stack platform, from GPUs to networking to software. This focus aims to broaden enterprise penetration and defend its competitive moat."
    }}
    ]
    </json>
    """

    response = chat(
        model=MODEL,
        messages=[{"role": "user", "content": prompt + "\n\n" + text}],
    )

    content = response["message"]["content"]

    # Extract only the JSON inside <json> tags if present
    match = re.search(r"<json>(.*?)</json>", content, re.DOTALL)
    if match:
        content = match.group(1).strip()

    # Try parsing JSON, attempt repair if invalid
    try:
        focuses = json.loads(content)
    except Exception:
        try:
            repaired = repair_json(content)
            focuses = json.loads(repaired)
        except Exception:
            focuses = [{"theme": "Parse Error", "summary": content[:600]}]

    return focuses


def extract_themes_for_all_transcripts():
    """
    Extract strategic focuses for all cleaned transcripts
    and save to OUTPUT_PATH as JSON.
    """
    # Run extraction for all transcripts
    results = {}

    # Ensure summary output directory exists
    os.makedirs(SUMMARY_DIR, exist_ok=True)

    for filename in sorted(os.listdir(DATA_DIR)):
        if not filename.endswith("cleaned.txt"):
            continue

        quarter = filename.replace("_cleaned.txt", "").upper()
        path = os.path.join(DATA_DIR, filename)

        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
            # Step 1: Summarize to reduce context length
            summary = summarize_transcript(text)

            # Save summary to a file in SUMMARY_DIR
            summary_filename = filename.replace("_cleaned.txt", "_summary.txt")
            summary_path = os.path.join(SUMMARY_DIR, summary_filename)
            with open(summary_path, "w", encoding="utf-8") as sf:
                sf.write(summary)

            # Step 2: Extract 3–5 key focuses
            focuses = extract_strategic_focuses(summary, quarter)
            results[quarter] = focuses

        # Step 3: Save results
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nStrategic focuses saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    extract_themes_for_all_transcripts()