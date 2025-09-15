
import base64
from io import BytesIO
import os
import platform
import re
import sqlite3
import json
import subprocess
from fastapi import Body, Depends, FastAPI, HTTPException, Request,Form
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx
from pydantic import BaseModel
from scraper import get_content_from_links,SYSTEM_PROMPT,LLM_MODEL, get_search_links, truncate_prompt_text
import os
from io import BytesIO
import shutil
import time
import logging
import tempfile
from exctr import executer_v3,execute_pip_commands,execute_python_code
from openai import OpenAI
from passlib.context import CryptContext
from typing import Optional
from starlette.middleware.sessions import SessionMiddleware
import os

DB_PATH = "chat_history.db"
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

class CodeSnippet(BaseModel):
    filename: str
    code: str
    

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_keys = [os.getenv(f"key{i}") for i in range(1, 5) if os.getenv(f"key{i}")]
logger.info(f"Loaded API keys: {api_keys}")
clients = [
    OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=key
    ) for key in api_keys
]
logger.info(f"Created {len(clients)} clients")

client_index = 0

def get_next_client():
    global client_index
    client = clients[client_index]
    client_index = (client_index + 1) % len(clients)
    return client
cursor.execute("PRAGMA foreign_keys = ON;")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    date_of_birth DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()

cursor.execute("""
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    user_text TEXT NOT NULL,
    bot_text TEXT NOT NULL,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats (id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory TEXT NOT NULL,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

conn.commit()

cursor.execute("""
CREATE TABLE IF NOT EXISTS code_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
""")
conn.commit()


def get_user_by_email(email: str):
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
    return cursor.fetchone()

def get_user_by_id(user_id: int):
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    return cursor.fetchone()

def create_user(username: str, email: str, password: str, dob: str | None):
    password_hash = pwd_context.hash(password)
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, date_of_birth) VALUES (?, ?, ?, ?)",
        (username, email.lower(), password_hash, dob)
    )
    conn.commit()
    return cursor.lastrowid

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False

# ---------- Auth helpers ----------
def get_current_user(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return get_user_by_id(user_id)

EMAIL_RE = re.compile(r"^[^@]+@[^@]+\.[^@]+$")



def get_current_user_id(request: Request) -> Optional[int]:
    user_id = request.session.get("user_id")
    if not user_id:
        return None

    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if row:
        return row["id"] if isinstance(row, sqlite3.Row) else row[0]
    # invalid session (user deleted) -> clean up session and return None
    request.session.pop("user_id", None)
    return None

# --- MODIFIED: add_history ---
def add_history(chat_id: int, user: str, bot: str):
    cursor.execute(
        "INSERT INTO history (chat_id, user_text, bot_text) VALUES (?, ?, ?)",
        (chat_id, user, bot)
    )
    conn.commit()
    

# --- MODIFIED: get_last_history ---
def get_last_history(chat_id: int, n: int = 15):
    cursor.execute(
        "SELECT user_text, bot_text FROM history WHERE chat_id = ? ORDER BY id DESC LIMIT ?",
        (chat_id, n)
    )
    rows = cursor.fetchall()
    return list(reversed(rows))  # chronological order

def add_memory(memory_text: str):
    cursor.execute("INSERT INTO memory (memory) VALUES (?)", (memory_text,))
    conn.commit()


def get_all_memories(): 
    cursor.execute("SELECT memory FROM memory ORDER BY id ASC")
    rows = cursor.fetchall()
    memories = [row["memory"] for row in rows if row["memory"] is not None]
    return ", ".join(memories)





# ─── FASTAPI + OPENROUTER CLIENT SETUP ───────────────────────────────────────

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")





# Use a strong secret key in production (e.g. from env var)
SESSION_SECRET = os.getenv("SESSION_SECRET", "dev_secret_key_change_me")
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)


@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def home(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    # pass user to index.html; templates may use user['username'], user['email'], etc.
    return templates.TemplateResponse("index.html", {"request": request, "current_user": user})


@app.post("/register")
async def register_post(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    date_of_birth: str = Form(None)  # expected YYYY-MM-DD or blank
):
    email_norm = email.strip().lower()
    if not EMAIL_RE.match(email_norm):
        return templates.TemplateResponse("register.html", {"request": request, "error": "Invalid email.", "form": {"username": username, "email": email, "date_of_birth": date_of_birth}})
    if len(password) < 6:
        return templates.TemplateResponse("register.html", {"request": request, "error": "Password must be at least 6 characters.", "form": {"username": username, "email": email, "date_of_birth": date_of_birth}})
    if get_user_by_email(email_norm):
        return templates.TemplateResponse("register.html", {"request": request, "error": "Email already registered.", "form": {"username": username, "email": email, "date_of_birth": date_of_birth}})
    try:
        user_id = create_user(username.strip(), email_norm, password, date_of_birth)
    except Exception as e:
        logger.exception("Error creating user")
        return templates.TemplateResponse("register.html", {"request": request, "error": "Internal error creating user.", "form": {"username": username, "email": email, "date_of_birth": date_of_birth}})
    # set session and redirect to home
    request.session["user_id"] = user_id
    return RedirectResponse(url="/", status_code=302)

# ---------- Login ----------
@app.get("/login")
async def login_get(request: Request):
    # If already logged in, redirect to home
    if get_current_user(request):
        return RedirectResponse(url="/", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request, "error": None})

@app.post("/login")
async def login_post(request: Request, email: str = Form(...), password: str = Form(...)):
    user = get_user_by_email(email.strip().lower())
    if not user:
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials."})
    if not verify_password(password, user["password_hash"]):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials."})
    # login success
    request.session["user_id"] = user["id"]
    return RedirectResponse(url="/", status_code=302)

# ---------- Logout ----------
@app.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=302)



class ChatRequest(BaseModel):
    message: str
    chat_id: int | None = None 


@app.post("/save_code")
async def save_code(data: dict = Body(...)):
    fname = data.get("filename", "snippet.txt")
    code = data.get("code", "")
    save_path = os.path.join("saved_snippets", fname)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "w", encoding="utf-8") as f:
        f.write(code)
    return {"status": "ok", "path": save_path}



def strip_first_think_block(text: str) -> str:

    cleaned_text = re.sub(r"<think>[\s\S]*?</think>", "", text, count=1)
    return re.sub(r"###CODE_EXEC[\s\S]*?###CODE_EXEC", "", cleaned_text)

@app.get("/chats")
async def get_user_chats(request:Request):
    user_id = get_current_user_id(request)
    cursor.execute(
        "SELECT id, title, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    chats = cursor.fetchall()
    return [{"id": r["id"], "title": r["title"]} for r in chats]

from nameSuggester import suggest_chat_name


class ChatCreateRequest(BaseModel):
    message: str

@app.post("/chats")
async def create_chat(request: ChatCreateRequest, user_id: int = Depends(get_current_user_id)):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Use the first 50 characters of the message as the title
    title = (request.message[:50] + '...') if len(request.message) > 50 else request.message

    title = suggest_chat_name(title)
    cursor.execute(
        "INSERT INTO chats (user_id, title) VALUES (?, ?)",
        (user_id, title)
    )
    conn.commit()
    new_chat_id = cursor.lastrowid
    return {"id": new_chat_id, "title": title}

@app.get("/chats/{chat_id}/history")
async def get_chat_history(chat_id: int):
    cursor.execute(
        "SELECT id, user_text, bot_text, ts FROM history WHERE chat_id = ? ORDER BY id ASC",
        (chat_id,)
    )
    return [
        {"id": r["id"], "user": r["user_text"], "bot": r["bot_text"], "ts": r["ts"]}
        for r in cursor.fetchall()
    ]

def download_and_convert_image(url: str) -> str | None:
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(url)
            if res.status_code == 200:
                content_type = res.headers.get("Content-Type", "image/jpeg")
                encoded = base64.b64encode(res.content).decode("utf-8")
                return f"data:{content_type};base64,{encoded}"
            else:
                print(f"Failed to fetch image: {url} — status {res.status_code}")
    except Exception as e:
        print(f"Error downloading image from {url}: {e}")
    return None


def parse_message_with_images(message: str):
    pattern = r"<up-img>(.*?)</up-img>"
    parts = re.split(pattern, message)
    content = []

    for i, part in enumerate(parts):
        if i % 2 == 0:
            if part.strip():
                content.append({"type": "text", "text": part.strip()})
        else:
            data_uri = download_and_convert_image(part.strip())
            if data_uri:
                content.append({
                "type": "image_url",
                "image_url": {"url": data_uri}
                })
    return content if content else [{"type": "text", "text": message.strip()}]

@app.post("/chat")
async def chat_stream(req: ChatRequest):
    user_msg = req.message
    chat_id = req.chat_id
    client= get_next_client()
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required.")

    def event_generator():
        yield f"event: user\ndata: {json.dumps(user_msg)}\n\n"

        history = get_last_history(chat_id, 15)
        memories = get_all_memories() # Per-chat memories
        messages = [
            {"role": "system", "content": "your name is zodio"},
            {"role": "system", "content": memories},
        ]
        for exchange in history:
            messages.append({"role": "user", "content": parse_message_with_images(exchange["user_text"])})
            cleaned = strip_first_think_block(exchange["bot_text"])
            messages.append({"role": "assistant", "content": cleaned})
            
        parsed_content = parse_message_with_images(user_msg)
        messages.append({"role": "user", "content": parsed_content})

        bot_buffer = ""
        resp_stream = client.chat.completions.create(
            model="qwen/qwen2.5-vl-32b-instruct:free",
            stream=True,
            messages=messages,
        )

        for chunk in resp_stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                bot_buffer += delta
                yield f"event: bot\ndata: {json.dumps(delta)}\n\n"

        add_history(chat_id, user_msg, bot_buffer)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/exec-chat")
async def chat_stream_exec(req: ChatRequest):  
    user_msg = req.message
    chat_id = req.chat_id
    client= get_next_client()
    pip_cmds,py_code=executer_v3(user_msg)
    if pip_cmds:
        print(pip_cmds)
        execute_pip_commands(pip_cmds)
    if py_code:
        output, public_urls = execute_python_code(py_code)
        print(output)
        print(public_urls)
    ops_gen="here is the output"+output
    if public_urls:
        urls_as_string = ", ".join(public_urls)
        ops_gen="the link generated:"+urls_as_string
        print(ops_gen)
    
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required.")

    def event_generator():
        yield f"event: user\ndata: {json.dumps(user_msg)}\n\n"

        links_src=f'###CODE_EXEC{py_code}###CODE_EXEC\n'
        yield f"event: bot\ndata: {json.dumps(links_src)}\n\n"
        
        history = get_last_history(chat_id, 15)
        memories = get_all_memories() # Per-chat memories
        mn_prompt = (
    f"You are Nexora, a large language model developed by Dhruvaraj. "
    f"Your role is to act as a message passer, providing clear, concise, and formally worded responses. "
    f"Deliver the following output to the user: '{ops_gen}' "
    f"for the given user prompt: '{user_msg}'. "
    f"Whenever a link is included, present it as a clickable Markdown link in the format: "
    f"[Descriptive Text](URL) "
    f"Responses must be free of any code, programming syntax, or code-like formatting, including inline backticks. "
    f"Responses may use multiple lines and paragraphs when appropriate for clarity."
)


        messages = [
            {"role": "system", "content": mn_prompt},
        ]

        for exchange in history:
            messages.append({"role": "user", "content": exchange["user_text"]})
            cleaned = strip_first_think_block(exchange["bot_text"])
            messages.append({"role": "assistant", "content": cleaned})

        messages.append({"role": "user", "content": user_msg})

        bot_buffer = ""
        resp_stream = client.chat.completions.create(
            model="qwen/qwen2.5-vl-32b-instruct:free",
            stream=True,
            messages=messages,
            max_tokens=150,          # limits output length
            temperature=0.3,         # makes output more focused & less random
            top_p=0.8,               # slightly narrows choice distribution
            presence_penalty=0.0,    # avoids unnecessary expansion
            frequency_penalty=0.5    # discourages repetition
        )


        for chunk in resp_stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                bot_buffer += delta
                yield f"event: bot\ndata: {json.dumps(delta)}\n\n"

        add_history(chat_id, user_msg, links_src+bot_buffer)

    return StreamingResponse(event_generator(), media_type="text/event-stream")



class SaveCodeRequest(BaseModel):
    filename: str
    code: str

# --- NEW: Model for canvas chat ---
class CanvasChatRequest(BaseModel):
    prompt: str
    code: str


@app.post("/code-files")
async def save_code_file(req: SaveCodeRequest,request:Request):
    user_id = get_current_user_id(request)
    cursor.execute(
        "INSERT INTO code_files (user_id, filename, code) VALUES (?, ?, ?)",
        (user_id, req.filename, req.code)
    )
    conn.commit()
    new_file_id = cursor.lastrowid
    return {"status": "ok", "id": new_file_id, "filename": req.filename}

# --- NEW: Endpoint to get all of a user's code files (latest version of each) ---
@app.get("/code-files")
async def get_user_code_files(request: Request):
    user_id = get_current_user_id(request)
    # This query gets the most recent version of each file for the user
    cursor.execute("""
        SELECT id, filename, code, MAX(created_at) as last_saved
        FROM code_files
        WHERE user_id = ?
        GROUP BY filename
        ORDER BY last_saved DESC
    """, (user_id,))
    files = cursor.fetchall()
    return [{"id": r["id"], "filename": r["filename"], "code": r["code"]} for r in files]

# --- NEW: Endpoint to get a specific code file by its ID ---
@app.get("/code-files/{file_id}")
async def get_code_file(file_id: int):
    user_id = get_current_user_id()
    cursor.execute(
        "SELECT id, filename, code, created_at FROM code_files WHERE id = ? AND user_id = ?",
        (file_id, user_id)
    )
    file = cursor.fetchone()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return {"id": file["id"], "filename": file["filename"], "code": file["code"], "created_at": file["created_at"]}



# --- NEW: Endpoint for AI chat within the canvas ---
@app.post("/canvas-chat")
async def canvas_chat_stream(req: CanvasChatRequest):
    client= get_next_client()
    system_prompt = "You are an expert coding assistant. A user will provide you with their current code and a prompt. You must only respond with the raw code that should be added or changed. The code should be enclosed in a single markdown code block (e.g., ```python ... ```). Do not add explanations or any other text outside the code block."
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Here is my current code:\n\n```\n{req.code}\n```\n\nMy request is: {req.prompt}"}
    ]

    def event_generator():
        try:
            # Note: Ensure your client call is appropriate (sync/async)
            resp_stream = client.chat.completions.create(
                model="qwen/qwen2.5-vl-32b-instruct:free", # Or your preferred model
                stream=True,
                messages=messages,
            )

            buffer = ""
            in_code_block = False
            
            for chunk in resp_stream:
                delta = chunk.choices[0].delta.content or ""
                if not delta:
                    continue

                buffer += delta
                
                # Continuously process the buffer to find and stream code
                while True:
                    # State 1: Looking for the start of the code block "```"
                    if not in_code_block:
                        start_pos = buffer.find("```")
                        if start_pos != -1:
                            # Found the start fence, now find the end of that line
                            end_of_header_line = buffer.find('\n', start_pos)
                            if end_of_header_line != -1:
                                # We're officially inside the code block
                                in_code_block = True
                                # The actual code starts after this header line
                                buffer = buffer[end_of_header_line + 1:]
                                # Loop again immediately to process the new buffer content
                            else:
                                break # Partial header, wait for more data
                        else:
                            break # No header yet, wait for more data
                    
                    # State 2: Inside the code block, streaming content
                    if in_code_block:
                        end_pos = buffer.find("```")
                        if end_pos != -1:
                            # Found the closing fence "```"
                            final_chunk = buffer[:end_pos]
                            if final_chunk:
                                yield f"data: {json.dumps(final_chunk)}\n\n"
                            # Stream is finished, exit the generator
                            return
                        else:
                            # Closing fence not found yet, send the whole buffer
                            if buffer:
                                yield f"data: {json.dumps(buffer)}\n\n"
                            buffer = ""
                            break # Wait for the next chunk from the model
        except Exception as e:
            # Log the error and notify the frontend
            print(f"Error during AI stream generation: {e}")
            error_data = {"error": "An error occurred during AI generation."}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- MODIFIED: Search-chat endpoint (assuming it should also be chat-specific) ---
@app.post("/search-chat")
async def search_chat_stream(req: ChatRequest):
    query = req.message
    chat_id = req.chat_id
    num_links = 5
    client= get_next_client()
    if not chat_id:
        raise HTTPException(status_code=400, detail="chat_id is required.")

    def event_generator():
        # First, immediately yield the user's query
        yield f"event: user\ndata: {json.dumps(query)}\n\n"

        retrieved_links = get_search_links(query,num_links)
        formatted_source_links = " ".join([f"[[!]]({link})" for link in retrieved_links])
        links_src=f':::(src){formatted_source_links}:::(src)\n'
        yield f"event: bot\ndata: {json.dumps(links_src)}\n\n"
        results = get_content_from_links(retrieved_links)
        
        # Prepare the prompt for the LLM using the scraped content
        prompt_parts = [f"[#{i+1}]({res['url']})\n{res.get('content', '<No content>')}\n" for i, res in enumerate(results)]
        prompt_text = truncate_prompt_text("\n".join(prompt_parts), max_tokens=24000)


        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Search results for '{query}':\n{prompt_text}"}
        ]
        
        bot_buffer = ""
        bot_buffer = links_src
        stream = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            stream=True,
            max_tokens=4000,
        )
        link_pass=True
        
        # Stream the LLM's response
        for chunk in stream:
            delta = chunk.choices[0].delta
            if hasattr(delta, "content") and delta.content:
                bot_buffer += delta.content
                yield f"event: bot\ndata: {json.dumps(delta.content)}\n\n"
        
        # Add the search result to the specific chat's history
        add_history(chat_id, query, bot_buffer)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/reasonchat")
async def chat_reason(req: ChatRequest):
    user_msg = req.message
    chat_id = req.chat_id
    client=get_next_client()
    def event_generator():
        # 1) Echo user
        yield f"event: user\ndata: {json.dumps(user_msg)}\n\n"
        history = get_last_history(chat_id, 15)
        memories = get_all_memories() 
        # For reasoning endpoint, we may choose different system prompts or include memories if needed
        # Here, we pass prior chat context but strip think blocks
        messages = []
        for exchange in history:
            messages.append({"role": "user", "content": exchange["user_text"]})
            cleaned = strip_first_think_block(exchange["bot_text"])
            messages.append({"role": "assistant", "content": cleaned})
        # Finally, current user message
        messages.append({"role": "user", "content": user_msg})

        bot_response = ""
        thinking_open = False
        try:
            stream = client.chat.completions.create(
                model="deepseek/deepseek-r1-0528-qwen3-8b:free",
                stream=True,
                messages=messages,
                reasoning_effort="high",
                extra_headers={
                    "HTTP-Referer": "<YOUR_SITE_URL>",
                    "X-Title": "<YOUR_SITE_NAME>",
                },
            )

            for chunk in stream:
                delta = chunk.choices[0].delta
                # Handle reasoning tokens
                if getattr(delta, "reasoning", None):
                    reasoning = delta.reasoning
                    if not thinking_open:
                        yield f"event: bot\ndata: {json.dumps('<think>')}\n\n"
                        bot_response += "<think>"
                        thinking_open = True
                    yield f"event: bot\ndata: {json.dumps(reasoning)}\n\n"
                    bot_response += reasoning
                # Handle final content tokens
                if getattr(delta, "content", None):
                    content = delta.content
                    if thinking_open:
                        yield f"event: bot\ndata: {json.dumps('</think>')}\n\n"
                        bot_response += "</think>"
                        thinking_open = False
                    yield f"event: bot\ndata: {json.dumps(content)}\n\n"
                    bot_response += content

            # 3) Persist history
            add_history(chat_id, user_msg, bot_response)

        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            yield f"event: error\ndata: {json.dumps(error_msg)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")




class ChatRenameRequest(BaseModel):
    title: str

@app.post("/chats/{chat_id}/rename")
async def rename_chat(chat_id: int, data: ChatRenameRequest):
    cursor.execute("UPDATE chats SET title = ? WHERE id = ?", (data.title, chat_id))
    conn.commit()
    return {"status": "ok"}

@app.delete("/chats/{chat_id}")
async def delete_chat(chat_id: int):
    cursor.execute("DELETE FROM history WHERE chat_id = ?", (chat_id,))
    cursor.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    conn.commit()
    return {"status": "deleted"}






def get_language_from_filename(filename):
    extension_to_language_map = {
        ".py": "python",
        ".java": "java",
        ".js": "javascript",
        ".html": "html",
        ".css": "css",
        ".json": "json",
        ".xml": "xml",
        ".md": "markdown",
        ".txt": "text",
        ".c": "c",
        ".cpp": "cpp",
        ".h": "c_header",
        ".hpp": "cpp_header",
        ".sh": "shell",
        ".rb": "ruby",
        ".php": "php",
        ".go": "go",
        ".swift": "swift",
        ".kt": "kotlin",
        ".ts": "typescript",
        ".jsx": "react_jsx",
        ".tsx": "react_tsx",
        ".vue": "vue",
        ".yml": "yaml",
        ".yaml": "yaml"
    }

    match = re.search(r"(\.[^.]+)$", filename)

    if match:
        extension = match.group(1)
        return extension_to_language_map.get(extension.lower(), filename)
    else:
        return filename

class RunCodeRequest(BaseModel):
    code: str
    language: str

class RunCodeResponse(BaseModel):
    status: str
    output: str
    error: str

@app.post("/run_code", response_model=RunCodeResponse)
async def run_code(req: RunCodeRequest):
    code = req.code
    language = req.language
    language=get_language_from_filename(language)
    temp_file_path = None 
    print(language)

    ALLOWED_COMMANDS = {
        "python": ["python"],
        "javascript": ["node"],
        "java": ["javac", "java"]
    }

    if language not in ALLOWED_COMMANDS:
        raise HTTPException(status_code=400, detail=f"Unsupported or unsafe language for execution: {language}")

    process = None # Initialize process to None for finally block cleanup
    try:
        with tempfile.NamedTemporaryFile(delete=False, mode='w+', encoding='utf-8', suffix=f".{language}") as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name

        command = []
        
        if language == "python":
            command = ALLOWED_COMMANDS["python"] + [temp_file_path]
        elif language == "javascript":
            command = ALLOWED_COMMANDS["javascript"] + [temp_file_path]
        elif language == "java":
            class_name = "Main"
            java_compile_command = ALLOWED_COMMANDS["java"][0] + [temp_file_path]
            
            # Compile Java code
            compile_process = subprocess.run(
                java_compile_command,
                capture_output=True, # This is fine for subprocess.run
                text=True,
                timeout=10,
                cwd=os.path.dirname(temp_file_path)
            )

            if compile_process.returncode != 0:
                return RunCodeResponse(status="error", output=compile_process.stdout, error=f"Compilation failed: {compile_process.stderr}")
            
            command = ALLOWED_COMMANDS["java"][1] + ["-cp", os.path.dirname(temp_file_path), class_name]
        
        # Execute the command using Popen for better timeout handling and termination control
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE, # Capture stdout
            stderr=subprocess.PIPE, # Capture stderr
            text=True # Decode stdout/stderr as text (UTF-8 by default)
        )

        try:
            # Use communicate with timeout on the Popen object
            output, error = process.communicate(timeout=10)

            if process.returncode != 0:
                full_error_output = f"Execution failed with exit code {process.returncode}.\n"
                if output:
                    full_error_output += f"STDOUT:\n{output}\n"
                if error:
                    full_error_output += f"STDERR:\n{error}"
                return RunCodeResponse(status="error", output=output, error=full_error_output)
            else:
                return RunCodeResponse(status="success", output=output, error=error)

        except subprocess.TimeoutExpired:
            # Attempt to terminate the process
            if platform.system() == "Windows":
                # Use taskkill to terminate the process by its PID
                try:
                    subprocess.run(["taskkill", "/F", "/PID", str(process.pid)], capture_output=True, text=True, check=True)
                except subprocess.CalledProcessError as e:
                    # Log or handle if taskkill itself fails (e.g., process already gone)
                    print(f"Warning: taskkill failed: {e.stderr}")
            else:
                # For Unix-like systems, send SIGTERM, then SIGKILL if needed
                process.terminate() # Send SIGTERM
                try:
                    process.wait(timeout=1) # Wait for it to terminate
                except subprocess.TimeoutExpired:
                    process.kill() # If still running, send SIGKILL

            # Read any output that might have been produced before termination
            # communicate() here will also close the pipes.
            output, error = process.communicate() 
            return RunCodeResponse(status="error", output=output, error="Code execution timed out after 10 seconds. The process was terminated.")
        
    except Exception as e:
        # Catch other potential errors during file operations or command preparation
        return RunCodeResponse(status="error", output="", error=f"Failed to run code: {str(e)}")
    finally:
        # Clean up the temporary file and compiled Java class files if they exist
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        # Ensure the process is cleaned up, even if an exception occurred earlier
        if process and process.poll() is None: # If process is still running
            process.kill() # Forcefully terminate
            process.wait() # Wait for cleanup

        if language == "java" and temp_file_path:
            class_file_path = os.path.join(os.path.dirname(temp_file_path), "Main.class")
            if os.path.exists(class_file_path):
                try:
                    os.unlink(class_file_path)
                except OSError as e:
                    print(f"Warning: Could not delete Java class file {class_file_path}: {e}")
                    


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


LOGO_FILE_PATH = os.path.join("assets", "nex.jpeg")

@app.post("/export_pdf")
async def export_pdf(data: dict):
    start_time = time.time()
    content = data.get("content", "")
    chat_id = data.get("chat_id", "new_chat")
    
    if not content:
        logger.error("No content provided for PDF export")
        raise HTTPException(status_code=400, detail="No content provided")
    
    # Check for dependencies early
    if not shutil.which("pandoc") or not shutil.which("pdflatex"):
        detail = "Pandoc and/or pdfLaTeX is not installed or not in PATH."
        logger.error(detail)
        raise HTTPException(status_code=500, detail=detail)
        
    # --- Start: Emoji Stripping Logic ---
    # This regex attempts to match a wide range of Unicode emoji characters.
    # It might not catch ALL emojis, especially newer ones, but it's a good start.
    # For a more comprehensive solution, consider a dedicated library like 'emoji'.
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    content = emoji_pattern.sub(r'', content)
    logger.info("Emojis stripped from content.")
    # --- End: Emoji Stripping Logic ---

    # Use a temporary directory which is automatically cleaned up
    with tempfile.TemporaryDirectory() as tmpdir:
        md_file = os.path.join(tmpdir, "content.md")
        pdf_file = os.path.join(tmpdir, "output.pdf")
        
        logger.info(f"Processing content (length: {len(content)} chars, chat_id: {chat_id})")
        
        # Write the markdown content to a temporary file
        try:
            with open(md_file, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info(f"Markdown file written: {md_file}")
        except Exception as e:
            logger.error(f"Failed to write markdown file: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to write markdown file")
            
        # Base Pandoc command
        pandoc_cmd = [
            "pandoc", md_file, "-o", pdf_file,
            "--pdf-engine=pdflatex",
            "-V", "geometry:margin=1in"
        ]
        
        # --- Logic to add footer with logo ---
        if os.path.exists(LOGO_FILE_PATH):
            logo_filename = os.path.basename(LOGO_FILE_PATH)
            header_file = os.path.join(tmpdir, "header.tex")

            # 1. Copy logo into the temp directory so LaTeX can find it
            shutil.copy(LOGO_FILE_PATH, os.path.join(tmpdir, logo_filename))

            # 2. Create the LaTeX header file with footer commands
            # This uses the 'fancyhdr' package to customize footers
            latex_header = f"""
\\usepackage{{fancyhdr}}
\\usepackage{{graphicx}} % Required for including images
\\pagestyle{{fancy}}
\\fancyhf{{}} % Clear all header and footer fields
\\renewcommand{{\\headrulewidth}}{{0pt}} % No line at the header
\\renewcommand{{\\footrulewidth}}{{0.4pt}} % A line at the footer
\\fancyfoot[L]{{\\includegraphics[height=0.8cm]{{{logo_filename}}}}} % Logo on the left
\\fancyfoot[R]{{Page \\thepage}} % Page number on the right
"""
            with open(header_file, "w", encoding="utf-8") as f:
                f.write(latex_header)

            # 3. Add the header include flag to the Pandoc command
            pandoc_cmd.extend(["-H", header_file])
            logger.info("Logo and footer configuration will be applied.")
        else:
            logger.warning(f"Logo file not found at {LOGO_FILE_PATH}. PDF will be generated without a logo.")

        # --- Run Pandoc to generate the PDF ---
        try:
            logger.info(f"Running Pandoc command: {' '.join(pandoc_cmd)}")
            result = subprocess.run(  # Capture output for debugging
                pandoc_cmd,
                check=True,
                capture_output=True,
                text=True,
                cwd=tmpdir,  # Crucial: run from tmpdir to find logo and header
                timeout=60
            )
            logger.info(f"Pandoc completed in {time.time() - start_time:.2f} seconds")
            logger.debug(f"Pandoc stdout: {result.stdout}") # Log stdout for success cases
            
            with open(pdf_file, "rb") as f:
                pdf_content = f.read()
            logger.info(f"PDF file read, size: {len(pdf_content)} bytes")
            
            return StreamingResponse(
                BytesIO(pdf_content),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=chat_{chat_id}.pdf"}
            )
            
        except subprocess.TimeoutExpired:
            logger.error("Pandoc timed out after 60 seconds")
            raise HTTPException(status_code=500, detail="PDF generation timed out")
        except subprocess.CalledProcessError as e:
            # Provide the actual error from LaTeX for easier debugging
            error_details = f"Pandoc/LaTeX Error:\nSTDOUT: {e.stdout}\nSTDERR: {e.stderr}"
            logger.error(error_details)
            raise HTTPException(status_code=500, detail=error_details)
        except Exception as e:
            logger.error(f"Unexpected error during PDF generation: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate PDF")





