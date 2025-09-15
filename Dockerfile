# Use Ubuntu 22.04 as the base image
FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Install system dependencies: Pandoc, TeX Live, and Python
RUN apt-get update && apt-get install -y \
    pandoc \
    texlive \
    texlive-latex-extra \
    texlive-fonts-recommended \
    python3 \
    python3-pip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*


# Install Python dependencies from requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Expose port for FastAPI
EXPOSE 8000

# Command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
