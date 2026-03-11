# AIME JavaScript Deployment Starter (Node + React)
This pack provides a **Node (Express + TypeScript)** backend and a **React (Vite)** admin UI skeleton.

## Prereqs
- Node 18+ and npm
- Git repo for AIME (private, staging-safe)
- `.env` created from `server/.env.example`

## Quick Start (staging)
```
# 1) Backend
cd server
cp .env.example .env             # edit flags for staging
npm i
npm run dev                      # or: npm run build && npm start

# 2) Frontend
cd ../web
npm i
npm run dev                      # open http://localhost:5173
```
## Feature Flags
In `server/.env`:
FEATURE_ADMIN_ONLY=true
FEATURE_PARTNER=false
FEATURE_MEMBERS=false
FEATURE_SIGNAL_NETWORK=false  # turn true only after Trigger Map QA complete

## Smoke Test
POST /api/smoke/core -> expect ok:true

## Signal Network Simulation
POST /api/signal/simulate (requires FEATURE_SIGNAL_NETWORK=true)
