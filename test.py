#!/usr/bin/env python3
"""
orchestrator_with_bs.py
A complete example orchestrator:
- Uses a model (deepseek/deepseek-chat-v3.1:free) via OpenRouter-style client
- Implements web_search and fetch_page tools backed by requests + BeautifulSoup
- Enforces strict JSON-only tool-calls from the model
"""

import os
import re
import json
import time
import html
from typing import Optional, List, Dict, Any

import requests
from bs4 import BeautifulSoup

# Replace or keep as-is depending on your SDK. The user example used:
# from openai import OpenAI
# which points to an OpenRouter-like client. Adjust import if needed.
try:
    from openai import OpenAI
except Exception as e:
    raise RuntimeError(
        "Couldn't import OpenAI from 'openai' package. "
        "Ensure you have the same client used earlier (openrouter-compatible)."
    )

# ----------------------------
# Config
# ----------------------------
OPENROUTER_API_KEY = "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"
if not OPENROUTER_API_KEY:
    raise RuntimeError("Set OPENROUTER_API_KEY environment variable before running.")

MODEL_NAME = "mistralai/mistral-small-3.2-24b-instruct:free"  # adjust if needed

# create client (base_url same as your earlier snippet)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# ----------------------------
# Utilities: robust JSON extraction
# ----------------------------
def extract_first_json(text: str) -> Optional[Any]:
    """
    Find the first JSON object in text and return it parsed;
    handles code fences and backticks.
    Returns None if not found or parsing fails.
    """
    if not text:
        return None
    # Normalize common code fences or surrounding Markdown
    cleaned = text.strip()
    # Remove surrounding triple-backtick fences if present (```json ... ```)
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.DOTALL)
    # Remove single-line backticks wrappers
    cleaned = cleaned.strip("` \n\t")

    # Find first '{' and then match braces counting nested braces
    start = cleaned.find("{")
    if start == -1:
        return None

    depth = 0
    for i in range(start, len(cleaned)):
        ch = cleaned[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = cleaned[start:i + 1]
                # attempt parse
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    # Try a relaxed parse: replace single quotes with double quotes
                    try:
                        relaxed = candidate.replace("'", '"')
                        return json.loads(relaxed)
                    except Exception:
                        return None
    return None

# ----------------------------
# Tool: web_search (Bing scraping)
# ----------------------------
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

def perform_web_search(q: str, num_results: int = 5, pause: float = 0.5) -> List[Dict[str, Any]]:
    """
    Scrape Bing search results for query q.
    Returns a list of dicts: {title, snippet, url, source}
    Note: scraping HTML may be affected by Bing markup changes.
    """
    results = []
    # build query URL; encode q
    safe_q = requests.utils.quote(q)
    url = f"https://www.bing.com/search?q={safe_q}"
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    # Bing result blocks are often 'li' with class 'b_algo'
    hits = soup.find_all("li", {"class": "b_algo"})
    for hit in hits[:num_results]:
        title_tag = hit.find("h2")
        a_tag = title_tag.find("a") if title_tag else None
        title = a_tag.get_text(strip=True) if a_tag else (title_tag.get_text(strip=True) if title_tag else "")
        href = a_tag["href"] if a_tag and a_tag.has_attr("href") else ""
        # snippet - look for <p>
        snippet_tag = hit.find("p")
        snippet = snippet_tag.get_text(" ", strip=True) if snippet_tag else ""
        source = ""
        if href:
            # attempt to extract netloc for source
            try:
                from urllib.parse import urlparse
                source = urlparse(href).netloc
            except Exception:
                source = ""
        results.append({
            "title": html.unescape(title),
            "snippet": html.unescape(snippet),
            "url": href,
            "source": source,
        })

    # fallback: if no hits parsed, return an empty list
    time.sleep(pause)
    return results

# ----------------------------
# Tool: fetch_page (extract main text)
# ----------------------------
def fetch_page(url: str, max_paragraphs: int = 5) -> Dict[str, Any]:
    """
    Fetch URL and extract page title, meta description, and top paragraphs.
    Returns a dict with {url, status_code, title, description, paragraphs}
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return {"url": url, "error": str(e)}

    soup = BeautifulSoup(resp.text, "lxml")
    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    # meta description
    desc_tag = soup.find("meta", {"name": "description"}) or soup.find("meta", {"property": "og:description"})
    description = desc_tag["content"].strip() if desc_tag and desc_tag.has_attr("content") else ""

    # collect paragraphs from article/main content heuristics
    paragraphs = []
    # prefer article tag
    main_candidates = soup.find_all(["article", "main"])
    if main_candidates:
        txt_blocks = []
        for cand in main_candidates:
            ps = cand.find_all("p")
            for p in ps:
                text = p.get_text(" ", strip=True)
                if text:
                    txt_blocks.append(text)
        paragraphs = txt_blocks[:max_paragraphs]

    # fallback: use all <p> on page
    if not paragraphs:
        ps = soup.find_all("p")
        for p in ps[:max_paragraphs]:
            text = p.get_text(" ", strip=True)
            if text:
                paragraphs.append(text)

    return {
        "url": url,
        "status_code": resp.status_code,
        "title": html.unescape(title),
        "description": html.unescape(description),
        "paragraphs": paragraphs,
    }

# ----------------------------
# Model call wrapper (deterministic for tool-decisions)
# ----------------------------
def call_model_strict(messages: List[Dict[str, str]], max_tokens: int = 512) -> str:
    """
    Call the model with low temperature to force deterministic tool decisions.
    Returns the assistant content as string.
    """
    resp = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=0.0,
        max_tokens=max_tokens,
    )
    # Depending on client implementation, structure may vary slightly; using resp.choices[0].message.content per example
    return resp.choices[0].message.content

# ----------------------------
# Orchestrator + main loop
# ----------------------------
SYSTEM_PROMPT = """
You are a tool-calling assistant. RULES (must follow exactly):
1) If you require external information, RETURN ONLY a single JSON object and nothing else. Example:
   {"tool":"web_search","args":{"q":"what is X","num_results":5}}
   or
   {"tool":"fetch_page","args":{"url":"https://example.com"}}
2) If you return any non-JSON text at this stage, it will be treated as the final answer and no tools will be invoked.
3) Valid tools: web_search, fetch_page
4) For web_search use args: { "q": string, "num_results": int (optional) }
   For fetch_page use args: { "url": string }
"""

def ask_with_tools(user_question: str, max_tool_rounds: int = 2) -> str:
    """
    Orchestrates model <-> tool interaction.
    Returns the final assistant text (either synthesized answer or direct model content).
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_question},
    ]

    for round_idx in range(max_tool_rounds + 1):
        model_reply = call_model_strict(messages)
        model_reply_clean = model_reply.strip()
        # Try to parse a JSON tool request
        parsed = extract_first_json(model_reply_clean)

        if parsed and isinstance(parsed, dict) and "tool" in parsed and "args" in parsed:
            tool = parsed["tool"]
            args = parsed["args"]
            # Execute tool
            if tool == "web_search":
                q = args.get("q", "")
                n = int(args.get("num_results", 5))
                print(f"[orchestrator] Tool requested: web_search q={q} num_results={n}")
                try:
                    results = perform_web_search(q, num_results=n)
                except Exception as e:
                    results = {"error": str(e)}
                tool_output = {"type": "web_search_results", "query": q, "results": results}
                # Append tool output into messages and continue
                messages.append({"role": "assistant", "content": json.dumps(tool_output)})
                continue  # let model synthesize using tool_output

            elif tool == "fetch_page":
                url = args.get("url", "")
                print(f"[orchestrator] Tool requested: fetch_page url={url}")
                try:
                    page = fetch_page(url)
                except Exception as e:
                    page = {"error": str(e)}
                tool_output = {"type": "fetch_page_results", "url": url, "results": page}
                messages.append({"role": "assistant", "content": json.dumps(tool_output)})
                continue

            else:
                # Unknown tool: return an error object to model then let it decide
                tool_output = {"error": f"Unknown tool requested: {tool}"}
                messages.append({"role": "assistant", "content": json.dumps(tool_output)})
                continue

        else:
            # No valid tool request found -> treat model_reply as final answer
            return model_reply_clean

    # If we exhausted rounds without final answer, call model one last time
    final = call_model_strict(messages, max_tokens=512)
    return final.strip()

# ----------------------------
# Example usage (main)
# ----------------------------
if __name__ == "__main__":
    # Example question - change as needed
    user_q = "What's the official EPA fuel economy for the 2024 Tesla Model 3 and link to the official spec page?"
    print("User question:", user_q)
    answer = ask_with_tools(user_q)
    print("\n=== FINAL ANSWER FROM MODEL ===\n")
    print(answer)
