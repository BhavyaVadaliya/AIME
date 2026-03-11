# L2 Ingestion Service

## Overview
L2 Ingestion Service (HTTP API) responsible for normalizing input signals into a structured `L2Bundle`.
Part of Sprint 7 Build.

## API
- `POST /v1/l2/ingest`: Accepts raw text, returns L2Bundle.
- `GET /health`: Health check.

## Running Locally
```bash
npm install
npm run dev
# Port: 3001
```

## Docker
```bash
docker build -t l2-ingestion:v0 .
```
