# ── Prophet Predictive Service ───────────────────────────────────────────────
# Python 3.11 slim + dependências de compilação para pystan/Prophet
FROM python:3.11-slim

# Dependências de sistema necessárias para compilar Prophet/pystan
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências Python primeiro (cache de layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia código
COPY main.py .

EXPOSE 8000

# Inicia com uvicorn (1 worker — Prophet fit é CPU-bound, escala via réplicas)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
