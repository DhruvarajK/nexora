# Nexora

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/Framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

Nexora is a sophisticated multimodal AI assistant designed to provide a comprehensive suite of tools for automation, content generation, and intelligent information retrieval. Built with a focus on versatility, it integrates advanced language models, real-time web search, and automated code execution to streamline complex workflows.

## Key Features

The platform offers a unified interface for interacting with various AI capabilities:

- **Multimodal Interaction**: Engage in seamless conversations using both text and image inputs.
- **High-Fidelity Image Generation**: Create visual assets directly within the application using integrated models like FLUX.
- **Real-Time Web Intelligence**: Access the latest information through dynamic web searching and automated content extraction.
- **Secure Code Execution**: Run Python scripts in a sandboxed environment for data processing, visualization, and file manipulation.
- **Professional Document Generation**: Programmatically create and edit PDF, DOCX, XLSX, and PPTX files.
- **Persistent AI Agents**: Deploy and schedule specialized agents to handle recurring tasks and provide notifications.

## Technical Foundation

Nexora is built on a modern technology stack to ensure performance and scalability:

- **Core Engine**: Developed using FastAPI and Python for efficient asynchronous processing.
- **Data Management**: Utilizes SQLite for local interaction history and Supabase for robust cloud storage.
- **AI Ecosystem**: Leverages OpenRouter and HuggingFace to provide access to a diverse range of generative models.
- **Connectivity**: Integrated support for Web Push notifications and Progressive Web App (PWA) standards.

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Required API credentials for OpenRouter, HuggingFace, and Supabase

### Installation

1. Clone the repository and navigate to the project directory:

   ```bash
   git clone https://github.com/DhruvarajK/nexora.git
   cd nexora
   ```

2. Install the necessary dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Configure your environment:
   Create a `.env` file in the root directory and populate it with the required API keys and configuration constants.

4. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

## License

This project is distributed under the Apache License 2.0. Detailed information can be found in the [LICENSE](LICENSE) file.
