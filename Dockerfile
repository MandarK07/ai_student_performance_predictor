FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

ARG REPOSITORY_URL=https://github.com/example/example
LABEL org.opencontainers.image.source=$REPOSITORY_URL

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-deploy.txt ./

RUN pip install --upgrade pip \
    && pip install -r requirements-deploy.txt

COPY src ./src
COPY database ./database
COPY models ./models
COPY .env.example ./

EXPOSE 10000

CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
