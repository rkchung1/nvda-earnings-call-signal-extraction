import os
import asyncio
from urllib.parse import urljoin
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

BASE_URL = "https://www.fool.com"
NVDA_PAGE = "https://www.fool.com/quote/nasdaq/nvda/"
BUTTON_TEXT = "View More NVDA Earnings Transcripts"

async def find_nvda_transcript_urls(count: int = 4):
    """
    Opens NVIDIA's Motley Fool page, clicks 'View More NVDA Earnings Transcripts'
    until all transcripts are visible, and returns the latest `count` URLs.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print(f"Opening {NVDA_PAGE}")
        await page.goto(NVDA_PAGE, timeout=90000)
        await page.wait_for_load_state("domcontentloaded")

        # Keep clicking "View More NVDA Earnings Transcripts" until it's gone
        while True:
            try:
                button = await page.query_selector(f"button:has-text('{BUTTON_TEXT}')")
                if not button:
                    break
                print("Clicking 'View More NVDA Earnings Transcripts'...")
                await button.scroll_into_view_if_needed()
                await button.click()
                await page.wait_for_timeout(2500)  # wait for new content to load
            except Exception as e:
                print(f"Could not click button or none left: {e}")
                break

        html = await page.content()
        await browser.close()

    # Parse all transcript links
    soup = BeautifulSoup(html, "html.parser")
    urls = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/earnings/call-transcripts/" in href.lower() and "nvidia-nvda-" in href.lower():
            full_url = urljoin(BASE_URL, href)
            if full_url not in urls:
                urls.append(full_url)

    urls = urls[:count]
    print(f"Found {len(urls)} NVDA transcript URLs:")
    for u in urls:
        print(u)
    return urls


async def fetch_transcript(url: str, output_dir: str = "transcripts"):
    """
    Fetch and save a Motley Fool transcript as a .txt file.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print(f"Fetching transcript: {url}")
        await page.goto(url, timeout=90000)
        await page.wait_for_load_state("domcontentloaded")

        try:
            await page.wait_for_selector("div.article-body, article", timeout=15000)
        except:
            print("Could not find main content container, continuing...")

        html = await page.content()
        await browser.close()

    soup = BeautifulSoup(html, "html.parser")
    article = soup.find("div", class_="article-body") or soup.find("article")
    if not article:
        print(f"No transcript found for {url}")
        os.makedirs(output_dir, exist_ok=True)
        debug_path = os.path.join(output_dir, "debug_" + url.split("/")[-2] + ".html")
        with open(debug_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Saved debug HTML to {debug_path}")
        return

    text = article.get_text(separator="\n", strip=True)
    fname = url.rstrip("/").split("/")[-1] + ".txt"
    os.makedirs(output_dir, exist_ok=True)
    outpath = os.path.join(output_dir, fname)
    with open(outpath, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"Saved transcript to {outpath}")


async def main():
    output_dir = "../data/transcripts"
    urls = await find_nvda_transcript_urls(count=4)
    for u in urls:
        await fetch_transcript(u, output_dir)


if __name__ == "__main__":
    asyncio.run(main())