import os
import random
import ssl
import aiohttp
import certifi
import asyncio
import json
from googlesearch import search
from aiohttp import ClientSession, TCPConnector
from bs4 import BeautifulSoup
from openai import OpenAI

from tiktoken import get_encoding

def truncate_prompt_text(prompt_text, max_tokens=24000):
    enc = get_encoding("cl100k_base")
    tokens = enc.encode(prompt_text)
    if len(tokens) > max_tokens:
        tokens = tokens[:max_tokens]
    return enc.decode(tokens)


# --- Configuration Variables ---
API_KEY = "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"
QUERY = "what is cispr in medical" # This is a placeholder, actual query comes from req.message
NUM_LINKS = 3
LINK_CHAR_LIMIT = 5000
LLM_MODEL = "qwen/qwen2.5-vl-32b-instruct:free"
SYSTEM_PROMPT = (
    "You are a research assistant that summarizes only the most relevant parts of web search results based on the user's query."
    "Your summaries MUST help the user discover only the content most aligned with their intent."
    "For EACH search result, respond with a structured format beginning EXACTLY as: '|#n|(URL)' — with no spaces between symbols."
    "Immediately follow with a brief but meaningful summary focused ONLY on the relevant content matching the user's query."
    "Avoid summarizing irrelevant parts of a page or generic introductions."
    "If multiple results from the same site exist, summarize them separately."
    "Never list more than 5 key ideas per source. Group ideas if useful."
    "Be concise but precise. Avoid vague phrases like 'many ideas' or 'a variety of topics'."
    "NEVER include introductory or concluding remarks."
    "Examples:"
    "|#1|(https://example.com/page)Includes 3 trending AI-based project ideas for college students, such as an automated resume scanner, a plagiarism detector using BERT, and a chatbot using GPT."
    "|#2|(https://example.edu/ideas)Provides a categorized list of 10 software project ideas, including mobile mental health apps, gamified STEM learning platforms, and AR field trip guides."
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

def get_search_links(query, num_links=NUM_LINKS):
    """
    Performs a Google search and returns a list of valid URLs.
    This function executes first and returns the links before any scraping begins.
    """
    print(f"Fetching {num_links} links for query: '{query}'...")
    try:
        raw_links = list(search(query, num_results=num_links * 2))  # Fetch extra links to ensure we get enough valid ones
        links = [url for url in raw_links if url.startswith(('http://', 'https://'))][:num_links]
        print("Successfully fetched links.")
        return links
    except Exception as e:
        print(f"An error occurred during Google search: {e}")
        return []

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

async def scrape_links_content_async(links, limit_chars=LINK_CHAR_LIMIT):
    """
    Asynchronously scrapes content from a provided list of URLs.
    This function runs all scraping requests concurrently for better performance.
    """
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    connector = TCPConnector(ssl=ssl_ctx)
    timeout = aiohttp.ClientTimeout(total=15) # Increased timeout slightly
    results = []

    async with ClientSession(connector=connector, timeout=timeout) as session:
        # Create a list of tasks to run concurrently
        tasks = [extract_content_from_url(url, session) for url in links]
        # Wait for all tasks to complete
        contents = await asyncio.gather(*tasks, return_exceptions=True)

    for url, content in zip(links, contents):
        if isinstance(content, Exception) or content is None:
            snippet = None
        else:
            snippet = (content[:limit_chars] + "…" if len(content) > limit_chars else content)
        
        results.append({"url": url, "content": snippet})
    
    return results

# STEP 2: Scrape content from the links you received from Step 1.
def get_content_from_links(links, limit_chars=LINK_CHAR_LIMIT):
    """
    Synchronous wrapper that takes a list of links and scrapes their content.
    """
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
    search_query = "what is CRISPR in medicine"
    retrieved_links = get_search_links(search_query, num_links=NUM_LINKS)
    print(retrieved_links)
    formatted_source_links = " ".join([f"[[!]]({link})" for link in retrieved_links])
    links_src=f':::(src){formatted_source_links}:::(src)'
    print(f"event: bot\ndata: {json.dumps(links_src)}\n\n")