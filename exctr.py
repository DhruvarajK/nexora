import re
import subprocess
import tempfile
import sys
import os
import shlex
import uuid
from pathlib import Path
from openai import OpenAI
import requests
import mimetypes
from dotenv import load_dotenv

load_dotenv()

API_KEY = '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'
if not API_KEY:
    print("[ERROR] Please set your OPENAI_API_KEY environment variable before running.")
    sys.exit(1)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=API_KEY,
)

# MODEL_NAME = "qwen/qwen-2.5-coder-32b-instruct:free"
MODEL_NAME = "qwen/qwen-2.5-72b-instruct:free"

OUTPUT_DIR = Path("./outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

INPUT_DIR = Path("./input")
INPUT_DIR.mkdir(exist_ok=True)

INPUT_BACKUP_DIR = Path("./input_backups")
INPUT_BACKUP_DIR.mkdir(exist_ok=True)

OUTPUT_BACKUP_DIR = Path("./output_backups")
OUTPUT_BACKUP_DIR.mkdir(exist_ok=True)


def upload_file_to_supabase(file_path, bucket_name="nexora-ai"):
    file_path = Path(file_path)
    if not file_path.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")
    with file_path.open('rb') as f:
        file_bytes = f.read()
    extension = file_path.suffix
    filename = f"{uuid.uuid4().hex}{extension}"
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = "application/octet-stream"  
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{bucket_name}/{filename}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": mime_type
    }
    response = requests.post(upload_url, data=file_bytes, headers=headers)
    if response.status_code not in [200, 201]:
        raise Exception(f"Upload failed with status code {response.status_code}: {response.text}")
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{filename}"
    return public_url



def extract_pip_commands(text: str) -> list[str]:
    """
    Extracts all pip install commands from the input text.
    Matches:
      - Lines inside ```bash fences
      - Standalone lines like "pip install package"
      - Comments like "# pip install package"
    Returns a list of unique pip command strings.
    """
    pip_commands = set()

    # 1) Inside ```bash … ``` fences
    bash_fence_pattern = re.compile(r"```bash\s*(.*?)```", re.DOTALL | re.IGNORECASE)
    for block in bash_fence_pattern.findall(text):
        for line in block.splitlines():
            line = line.strip()
            if line.lower().startswith("pip install"):
                pip_commands.add(line)

    # 2) Inline or standalone “pip install …” lines
    inline_pattern = re.compile(r"(?m)^[ \t]*(pip\s+install\s+[^\n\r]+)")
    for match in inline_pattern.findall(text):
        pip_commands.add(match.strip())

    # 3) Comments like "# pip install …"
    comment_pattern = re.compile(r"(?m)^[ \t]*#\s*pip\s+install\s+([^\n\r]+)", re.IGNORECASE)
    for pkg in comment_pattern.findall(text):
        pip_commands.add(f"pip install {pkg.strip()}")

    return sorted(pip_commands)


def extract_python_code(text: str) -> str:
    python_blocks = []
    pattern = re.compile(r"```python\s*(.*?)```", re.DOTALL | re.IGNORECASE)

    for block in pattern.findall(text):
        python_blocks.append(block.strip())

    return "\n\n".join(python_blocks) if python_blocks else ""


DANGEROUS_SHELL_WORDS = [
    r"\brm\s", r"\brm -", r"\bshutdown\b", r"\breboot\b", r"\bpoweroff\b",
    r":\s*>",   # e.g. “> /dev/sda”
    r"mkfs\b", r"dd\b", r"\bformat\b"
]

DANGEROUS_PYTHON_PATTERNS = [
    r"import\s+os", r"os\.system\s*\(", r"subprocess\.Popen\s*\(",
    r"subprocess\.call\s*\(", r"eval\s*\(", r"exec\s*\("
]


def is_shell_command_safe(cmd: str) -> bool:
    """
    Returns False if any dangerous pattern appears in cmd.
    """
    lowered = cmd.lower()
    for pat in DANGEROUS_SHELL_WORDS:
        if re.search(pat, lowered):
            return False
    return True


def is_python_code_safe(code: str) -> bool:
    """
    Returns False if any dangerous Python pattern is detected.
    """
    for pat in DANGEROUS_PYTHON_PATTERNS:
        if re.search(pat, code):
            return False
    return True



PREINSTALLED_PACKAGES = {"aiohappyeyeballs", "aiohttp", "aiosignal", "aiosqlite", "altgraph", "annotated", "anyio", "arrow", "asgiref", "asttokens", "async", "attrs", "bcrypt", "beautifulsoup4", "bidict", "binaryornot", "blinker", "boto3", "botocore", "bottle", "briefcase", "Brotli", "build", "buildozer", "CacheControl", "cachetools", "certifi", "cffi", "cfgv", "chardet", "charset", "click", "clr_loader", "colorama", "comtypes", "contourpy", "cookiecutter", "cryptography", "cssselect2", 
"cycler", "Cython", "databases", "decorator", "deprecation", "diagrams", "diskcache", "distlib", "distro", "Django", "django", "dnspython", "docutils", "docx2pdf", "EasyProcess", "ecdsa", "edge", "email_validator", "entrypoint2", "erd", "erdiagram", "exceptiongroup", "executing", "faiss", "Faker", "fastapi", "fastapi", "filelock", "filetype", "fire", "firebase", "Flask", "flask", "Flask", "Flask", "fonttools", "fpdf", "frozenlist", "fsspec", "geographiclib", "geopy", "gitdb", "GitPython", "google", "google", "google", "google", "google", "google", "google", "google", "google", "googleapis", "googlesearch", "gotrue", 
"gradio_client", "graphviz", "greenlet", "grpcio", "grpcio","PyMuPDF", "h11", "h2", "hpack","sqlite3", "secrets","httpcore", "httplib2", "httptools", "httpx", "huggingface", "hyperframe", "identify", "idna", "iniconfig", "ipython", "itsdangerous", "jedi", "Jinja2", "jiter", "jmespath", "joblib", "jsonpickle", "Kivy", "kivy", "kivy", "kivy_deps", "Kivy", "kivymd", "kiwisolver", "llama_cpp_python", "lxml", "Markdown", "markdown", "MarkupSafe", "matplotlib", "matplotlib", "mdurl", "MouseInfo", "mpmath", "msgpack", "mss", "multidict", "mysqlclient", "networkx", "nodeenv", "numpy", "openai", "opencv", "opencv", "orjson", "packaging", "panda", "pandas", "parso", "passlib", "pdf2docx", "pdfkit", "pefile", "pexpect", "pillow", "pip", "platformdirs", "pluggy", "plyer", "portalocker", "postgrest", "pre_commit", "prompt_toolkit", "propcache", "proto", "protobuf", "proxy_tools", "psutil", "psycopg2", "psycopg2", "ptyprocess", "pure_eval", "pyasn1", "pyasn1_modules", "PyAutoGUI", "pycparser", "pydantic", "pydantic_core", "pydantic", "pydantic", "pydot", "pydub", "pydyf", "PyGetWindow", "Pygments", "pyinstaller", "pyinstaller", "pyjnius", "PyJWT", "pymongo", "PyMsgBox", "PyMuPDF", "PyOpenGL", "pypandoc", "pyparsing", "PyPDF2", "pyperclip", "pyphen", "pypiwin32", "pyproject_hooks", "PyQt5", "PyQt5", "PyQt5_sip", "pyqtdeploy", "PyRect", "pyscreenshot", "PyScreeze", "PySide6", "PySide6_Addons", "PySide6_Essentials", "PySimpleGUI", "pyswisseph", "pytest", "python", "python", "python", "python", "python", "python", "python", "python", "python", "python", "python", "pythonnet", "pytweening", "pytz", "pyvis", "pywebview", "pywin32", "pywin32", "PyYAML", "pyzbar", "qrcode","qrcode[pil]","razorpay", "realtime", "regex", "reportlab", "requests", "rich", "rich", "rsa", "s3transfer", "safetensors", "scikit", "scipy", "sendgrid", "setuptools", "sh", "shellingham", "shiboken6", "simple", "six", "smmap", "sniffio", "soupsieve", "SQLAlchemy", "sqlalchemy_schemadisplay", "sqlparse", "srt", "stack", "starkbank", "starlette", "storage3", "StrEnum", "supabase", "supafunc", "sympy", "tabulate", "telegram", "termcolor", "text", "threadpoolctl", "tinycss2", "tinyhtml5", "tk", "toga", "toga", "toga", "tokenizers", "toml", "tomli", "tomli_w", "torch", "tqdm", "traitlets", "transformers", "travertino", "typer", "types", "typing_extensions", "tzdata", "ujson", "uritemplate", "urllib3", "uvicorn", "virtualenv", "watchfiles", "wcwidth", "weasyprint", "webencodings", "websockets", "Werkzeug", "wheel", "wkhtmltopdf", "wsproto", "XlsxWriter", "yarl", "zopfli","openpyxl","python-pptx","python-docx"}



def run_subprocess(cmd_list: list[str]) -> tuple[int, str]:
    output_lines = []
    proc = subprocess.Popen(
        cmd_list,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    for line in iter(proc.stdout.readline, ''):
        print(line.rstrip())
        output_lines.append(line)
    proc.wait()
    return proc.returncode, ''.join(output_lines)

def execute_pip_commands(pip_commands: list[str]) -> None:
    """Executes each pip install command if it passes the safety filter and isn't preinstalled."""
    for raw_cmd in pip_commands:
        print(f"\n🛠️ Found pip command: {raw_cmd}")
        parts = shlex.split(raw_cmd)
        pkg_names = [pkg.lower().split("==")[0].split(">=")[0] for pkg in parts[2:]] if len(parts) > 2 else []
        skip = False
        for pkg in pkg_names:
            if pkg in PREINSTALLED_PACKAGES:
                print(f"[i] Skipping already-installed package: {pkg}")
                skip = True
        if skip:
            continue
        if not is_shell_command_safe(raw_cmd):
            print(f"[!] Skipping unsafe pip command: {raw_cmd}")
            continue
        if parts[0].lower() not in ("pip", "pip3"):
            print(f"[!] Not strictly a pip command? Skipping: {raw_cmd}")
            continue
        print(f"▶️ Executing: {raw_cmd}")
        ret, _ = run_subprocess(parts)
        if ret != 0:
            print(f"[✖️] pip command failed with exit code {ret}: {raw_cmd}")
        else:
            print(f"[✔️] pip command succeeded: {raw_cmd}")



def backup_directory_contents(src_dir: Path, backup_dir: Path) -> None:
    for item in src_dir.iterdir():
        if item.is_file():
            random_prefix = uuid.uuid4().hex[:8]
            dest_name = f"{random_prefix}_{item.name}"
            dest_path = backup_dir / dest_name
            try:
                item.rename(dest_path)
                print(f"Moved {item} to {dest_path}")
            except Exception as e:
                print(f"[!] Failed to backup {item}: {e}")

def execute_python_code(code: str) -> tuple[str, list[str]]:
    if not code.strip():
        return "", []
    if not is_python_code_safe(code):
        print("[!] Python code contains unsafe patterns. Skipping execution.")
        return "[!] Python code contains unsafe patterns. Skipping execution.", []
    with tempfile.NamedTemporaryFile(mode="w+", suffix=".py", delete=False) as tmp:
        tmp.write(code)
        tmp_path = tmp.name
    original_cwd = os.getcwd()
    try:
        os.chdir(str(OUTPUT_DIR))
        ret, output = run_subprocess([sys.executable, tmp_path])
        if ret != 0:
            print(f"[✖️] Python code exited with code {ret}")
        else:
            print(f"[✔️]")
    finally:
        os.chdir(original_cwd)
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
    output_files = list(OUTPUT_DIR.iterdir())
    public_urls = []
    for f in output_files:
        if f.is_file():
            try:
                public_url = upload_file_to_supabase(f)
                public_urls.append(public_url)
            except Exception as e:
                print(f"[!] Failed to upload {f} to Supabase: {e}")
    return output, public_urls

import mimetypes

def extract_upimg_links_and_text(message: str):
    """
    Extracts all URLs between <up-img>...</up-img> tags and
    returns a tuple (list_of_urls, remaining_text).
    """
    pattern = re.compile(r"<up-img>(.*?)</up-img>", re.IGNORECASE | re.DOTALL)
    urls = pattern.findall(message)

    # Remove the tags from message to get the remaining text
    remaining_text = pattern.sub("", message).strip()
    return urls, remaining_text


def safe_filename_from_url(url: str, content_type: str = None) -> str:
    """
    Creates a safe filename from a URL.
    - Keeps original filename if available.
    - Adds guessed extension from Content-Type if missing.
    - Ensures no collisions by prefixing with a short UUID.
    """
    # Extract filename from URL path
    name = url.split("/")[-1].split("?")[0]  # Remove query params
    name = name.strip()

    # Guess extension if missing
    if not name or "." not in name:
        ext = mimetypes.guess_extension(content_type or "")
        name = f"{uuid.uuid4().hex}{ext or ''}"
    else:
        # Just to be safe: if name has no extension, add one
        ext = mimetypes.guess_extension(content_type or "")
        if not os.path.splitext(name)[1] and ext:
            name += ext

    # Prefix with short UUID to avoid collisions
    name = f"{uuid.uuid4().hex[:8]}_{name}"
    return name


def download_files_to_input(urls: list[str], input_dir: Path):
    """
    Downloads each file from the provided URLs into the input_dir.
    Uses MIME detection and safe filename handling.
    """
    for url in urls:
        try:
            response = requests.get(url, stream=True, timeout=15)
            response.raise_for_status()

            # Detect content type from headers
            content_type = response.headers.get("Content-Type", "").split(";")[0]

            # Create a safe filename
            filename = safe_filename_from_url(url, content_type)
            file_path = input_dir / filename

            with open(file_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"[✔] Downloaded: {url} -> {file_path}")

        except Exception as e:
            print(f"[!] Failed to download {url}: {e}")


EXC_SYS = {
    "role": "system",
    "content": (
        "You are a helpful assistant that only outputs valid bash `pip install` commands "
        "or Python code blocks wrapped in proper triple backtick fences. "
        "Do not output anything else. "
        "When Python code involves graph creation or visualization, you MUST use NetworkX and Matplotlib. "
        "Crucial Matplotlib Instruction: NEVER use `plt.show()`. "
        "Instead, ALWAYS save plots to files (e.g., `plt.savefig('my_plot.png')`) because the environment is server-side and lacks a display. "
        "When generating files in PDF, Word (.docx), PowerPoint (.pptx), or Excel (.xlsx) formats, "
        "you MUST use pure Python libraries with no external software dependencies: "
        " - PDF: reportlab "
        " - Word: python-docx "
        " - Excel: openpyxl "
        " - PowerPoint: python-pptx "
        "Always write complete, runnable Python examples for file generation, saving outputs to files."
    )
}

def executer_v3(prompt : str):
    img_urls, clean_prompt = extract_upimg_links_and_text(prompt)
    if img_urls:
        download_files_to_input(img_urls, INPUT_DIR)
    backup_directory_contents(OUTPUT_DIR, OUTPUT_BACKUP_DIR)
    input_files = list(INPUT_DIR.iterdir())
    
    file_info_str = ""
    if input_files:
        info_list = [f"{f.resolve()} ({f.suffix.lower().lstrip('.')})" for f in input_files]
        file_info_str = " The following input files are provided: " + ", ".join(info_list) + "."
        
    user_message_content = clean_prompt + file_info_str + "\n\nPlease reply with any needed `pip install ...` commands inside ```bash``` fences and/or Python code inside ```python``` fences."
    user_message = {"role": "user", "content": user_message_content}

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[EXC_SYS, user_message],
            temperature=0.0,
            max_tokens=1024,
        )
    except Exception as e:
        print(f"[ERROR] Failed to get completion from model: {e}")

    reply = completion.choices[0].message.content
    pip_cmds = extract_pip_commands(reply)
    py_code = extract_python_code(reply)
    
    return pip_cmds,py_code


