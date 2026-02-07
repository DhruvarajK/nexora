import os
from dotenv import load_dotenv

load_dotenv()

# Model Names
CHAT_MODEL = os.getenv("CHAT_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
IMAGE_MODEL = os.getenv("IMAGE_MODEL", "black-forest-labs/FLUX.1-schnell")
REASONING_MODEL = os.getenv("REASONING_MODEL", "deepseek/deepseek-r1-0528-qwen3-8b:free")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen/qwen2.5-vl-32b-instruct:free")
