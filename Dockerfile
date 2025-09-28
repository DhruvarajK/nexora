FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Kolkata

WORKDIR /app

# Use IPv4, retries, no-install-recommends, and a shorter texlive set
RUN apt-get update -o Acquire::Retries=3 -o Acquire::ForceIPv4=true && \
    apt-get install -y --no-install-recommends \
      -o Acquire::Retries=3 -o Acquire::ForceIPv4=true \
      tzdata \
      pandoc \
      texlive-latex-recommended \
      texlive-fonts-recommended \
      texlive-fonts-extra \
      python3 \
      python3-pip && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    dpkg-reconfigure -f noninteractive tzdata && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]