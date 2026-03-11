# RTCE Text Service

## Overview
RTCE (Real-Time Context Engine) Text Service (HTTP API) responsible for making routing decisions based on L2 Bundles.
Part of Sprint 7 Build.

## API
- `POST /v1/rtce/decide`: Accepts L2Bundle, returns RouteDecision.
- `GET /health`: Health check.

## Running Locally
```bash
npm install
npm run dev
# Port: 3002
```

## Docker
```bash
docker build -t rtce-text:v0 .
```
