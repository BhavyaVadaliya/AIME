$ErrorActionPreference = "Stop"

Write-Host ">>> PHASE 1: CI BUILD & ARTIFACT GENERATION <<<" -ForegroundColor Cyan

# 1. Build L2
Write-Host "Building L2 Ingestion Service..."
docker build -q -t l2-ingestion:sprint7-staging ./services/l2-ingestion
$l2Digest = docker inspect --format='{{.Id}}' l2-ingestion:sprint7-staging
Write-Host "ARTIFACT: l2-ingestion:sprint7-staging | DIGEST: $l2Digest" -ForegroundColor Green

# 2. Build RTCE
Write-Host "Building RTCE Text Service..."
docker build -q -t rtce-text:sprint7-staging ./services/rtce-text
$rtceDigest = docker inspect --format='{{.Id}}' rtce-text:sprint7-staging
Write-Host "ARTIFACT: rtce-text:sprint7-staging    | DIGEST: $rtceDigest" -ForegroundColor Green

Write-Host "`n>>> PHASE 2: STAGING DEPLOY <<<" -ForegroundColor Cyan
docker-compose -f docker-compose.staging.yml up -d --force-recreate
Start-Sleep -Seconds 10 # Wait for health checks

# Check if running
$running = docker-compose -f docker-compose.staging.yml ps -q | Measure-Object | Select-Object -ExpandProperty Count
if ($running -lt 2) {
    Write-Error "Deploy failed. Services not running."
}
Write-Host "STAGING DEPLOY SUCCESSFUL (Ports 8081, 8082)" -ForegroundColor Green

Write-Host "`n>>> PHASE 3: HARNESS EXECUTION (STAGING) <<<" -ForegroundColor Cyan
$env:L2_URL="http://localhost:8081"
$env:RTCE_URL="http://localhost:8082"

cd harness
npm run test
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nHARNESS PASS (STAGING)" -ForegroundColor Green
} else {
    Write-Error "HARNESS FAILED IN STAGING"
}
