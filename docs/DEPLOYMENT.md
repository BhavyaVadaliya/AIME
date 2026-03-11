# Deployment & Release Guide

## 1. Release Strategy
We strictly use **Immutable Artifacts**.
- **Build**: CI builds Docker Image -> Pushes to Registry (ECR/GCR) with unique commit SHA tag.
- **Deploy**: Staging manifests are updated to point to the new specific SHA digest.

## 2. Registry Logs
All release candidates are logged in the `artifacts/registry.json` manifest (Authoritative Record).
*Note: In this Sprint 7 simulation, the Registry is a local JSON file.*

## 3. Deployment Commands (Reference)
*Do not run blindly. These are the standard operating procedures.*

### Staging
```bash
# 1. Login
docker login registry.corp

# 2. Pull
docker pull registry.corp/l2-ingestion:v0.1.0

# 3. Deploy
env $(cat .env.staging) docker run -d -p 3001:3001 registry.corp/l2-ingestion:v0.1.0
```

### Rollback
```bash
# Revert to previous hash
docker stop l2-current
docker run -d -p 3001:3001 registry.corp/l2-ingestion:v0.0.9-known-good
```

## 4. Evidence
- **Build Logs**: `artifacts/ci_run_evidence.log`
- **Registry Record**: `artifacts/registry.json`
- **Rollback Test**: `artifacts/rollback_test.log`
