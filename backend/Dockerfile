FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /install /usr/local

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libxcb1 \
    libx11-xcb1 \
    libxcb-xinerama0 \
    && rm -rf /var/lib/apt/lists/*

COPY . .

# Create non-root user for security
RUN groupadd -r ishkeen && useradd -r -g ishkeen ishkeen
RUN mkdir -p /app/private_uploads && chown -R ishkeen:ishkeen /app

USER ishkeen

# Fail fast configuration
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PORT=8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:$PORT/health || exit 1

EXPOSE $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips='*'"]
