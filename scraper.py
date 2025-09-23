import os
import random
import ssl
import aiohttp
import certifi
import asyncio
import json

from aiohttp import ClientSession, TCPConnector
from bs4 import BeautifulSoup
from openai import OpenAI

# Use DDGS (duckduckgo) only for searching links
try:
    from ddgs import DDGS
except Exception:
    DDGS = None

from tiktoken import get_encoding


def truncate_prompt_text(prompt_text, max_tokens=24000):
    enc = get_encoding("cl100k_base")
    tokens = enc.encode(prompt_text)
    if len(tokens) > max_tokens:
        tokens = tokens[:max_tokens]
    return enc.decode(tokens)


# --- Configuration Variables ---
API_KEY = "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"
QUERY = "what is cispr in medical"  # This is a placeholder, actual query comes from req.message
NUM_LINKS = 5
LINK_CHAR_LIMIT = 5000
LLM_MODEL = "qwen/qwen2.5-vl-32b-instruct:free"
SYSTEM_PROMPT = (
    "You are a hybrid assistant that can do two things depending on the user input:\n\n"
    "1. **If the user input is a search query** (e.g., 'Top programming languages for data science in 2025'), "
    "extract and structure ONLY the most relevant content from search results. "
    "For EACH result, show reference as plain text: '|#n|(URL)'.eg:  |#1|(https://examle.com)"
    "After the URL, output scraped key findings in a structured format using headings, bullets, numbered lists, or tables. "
    "Do NOT include irrelevant site navigation, ads, or filler phrases.\n\n"
    "2. **If the user input is a question or conversational query** (e.g., 'Is Hamster Kombat a Bitcoin?'), "
    "respond naturally in a concise chatbot style, confirming or correcting the user's assumption. "
    "Your reply should be friendly, conversational, and directly answer the question.\n\n"
    "Always preserve meaning and clarity, and choose the output style automatically based on the input."
)






# --- Windows / Python 3.10 workaround ---
if os.name == "nt":
    from asyncio import WindowsSelectorEventLoopPolicy
    asyncio.set_event_loop_policy(WindowsSelectorEventLoopPolicy())

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0",
    "Mozilla/5.0 (Linux; Android 10; Pixel 4 XL Build/QQ1B.200205.002) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.3; Win64; x64; Trident/7.0; AS; rv:11.0) like Gecko",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (Linux; Android 9; Mi A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
    "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; AS; rv:11.0) like Gecko"
]

HEADERS_LIST = [
    {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.bing.com",
        "Connection": "keep-alive"
    },
    {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-GB,en;q=0.8",
        "Referer": "https://www.yahoo.com",
        "Connection": "keep-alive"
    },
    {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-CA,en;q=0.7",
        "Referer": "https://duckduckgo.com",
        "Connection": "keep-alive"
    },
    {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.google.co.jp",
        "Connection": "keep-alive"
    }
]


def _ddg_search_query(query, max_results):
    """Perform a DuckDuckGo text search using DDGS and return a list of result dicts."""
    if DDGS is None:
        print("DDGS (duckduckgo-search) is not installed. Install with: pip install ddgs")
        return []

    try:
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results)) or []
    except Exception as e:
        print(f"DuckDuckGo search error: {e}")
        return []


def get_search_links(query, num_links=NUM_LINKS):
    """Fetches search links using DuckDuckGo (DDGS) only."""
    print(f"Fetching {num_links} links for query: '{query}' using DDGS...")

    links = []
    results = _ddg_search_query(query, max_results=num_links * 2)
    for r in results:
        # handle different key names across versions
        url = r.get("href") or r.get("url") or r.get("link")
        if url and url.startswith(("http://", "https://")) and url not in links:
            links.append(url)
        if len(links) >= num_links:
            break

    if not links:
        print("No links found via DDGS.")
    else:
        print(f"Fetched {len(links)} links from DDGS.")

    return links[:num_links]


async def extract_content_from_url(url, session, timeout=10):
    """Asynchronously fetches and extracts paragraph text from a single URL."""
    headers = random.choice(HEADERS_LIST)
    try:
        async with session.get(url, headers=headers, timeout=timeout) as resp:
            if resp.status != 200:
                print(f"Failed to fetch {url} with status: {resp.status}")
                return None
            html = await resp.text()
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None
    
    soup = BeautifulSoup(html, "html.parser")
    return "\n".join(p.get_text(strip=True) for p in soup.find_all("p"))

from hashlib import sha256
async def scrape_links_content_async(links, limit_chars=LINK_CHAR_LIMIT):
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    connector = TCPConnector(ssl=ssl_ctx)
    timeout = aiohttp.ClientTimeout(total=15)
    results = []

    async with ClientSession(connector=connector, timeout=timeout) as session:
        tasks = [extract_content_from_url(url, session) for url in links]
        contents = await asyncio.gather(*tasks, return_exceptions=True)

    seen_hashes = set()
    for url, content in zip(links, contents):
        # Skip errors or empty content
        if isinstance(content, Exception) or not content:
            continue

        # Deduplicate content
        h = sha256(content.encode('utf-8')).hexdigest()
        if h in seen_hashes:
            continue
        seen_hashes.add(h)

        snippet = (content[:limit_chars] + "…" if len(content) > limit_chars else content)
        results.append({"url": url, "content": snippet})
    
    return results


def get_content_from_links(links, limit_chars=LINK_CHAR_LIMIT):

    if not links:
        print("No links provided to scrape.")
        return []

    print(f"Scraping content from {len(links)} links...")
    scraped_data = asyncio.run(scrape_links_content_async(links, limit_chars))
    print("Scraping complete.")
    return scraped_data



# Initialize OpenAI client
def create_openai_client(api_key, base_url="https://openrouter.ai/api/v1"):
    return OpenAI(base_url=base_url, api_key=api_key)


# Example of the new workflow
if __name__ == '__main__':
    # 1. Call the first function to get links immediately.
    search_query = "latest news in english kannur"
    retrieved_links = get_search_links(search_query, num_links=NUM_LINKS)
    print(retrieved_links)
    results = get_content_from_links(retrieved_links)
    prompt_parts = [f"[#{i+1}]({res['url']})\n{res.get('content', '<No content>')}\n" for i, res in enumerate(results)]
    # formatted_source_links = " ".join([f"[[!]]({link})" for link in retrieved_links])
    # links_src=f':::(src){formatted_source_links}:::(src)'
    # print(f"event: bot\ndata: {json.dumps(links_src)}\n\n")
    print(results)
