$ErrorActionPreference = "Stop"

Write-Host ">>> PHASE 1: CI BUILD & ARTIFACT GENERATION (NATIVE FALLBACK) <<<" -ForegroundColor Cyan

# 1. Build L2
Write-Host "Building L2 Ingestion Service..."
cd services/l2-ingestion
npm install --silent
npm run build
if (-Not (Test-Path "dist/index.js")) { Write-Error "L2 Build Failed" }
# Simulate Artifact Packaging
Compress-Archive -Path dist, package.json -DestinationPath ..\..\artifacts\l2-ingestion-v0.zip -Force
$l2Hash = Get-FileHash ..\..\artifacts\l2-ingestion-v0.zip -Algorithm SHA256
Write-Host "ARTIFACT: l2-ingestion-v0.zip | DIGEST: $($l2Hash.Hash)" -ForegroundColor Green
cd ../..

# 2. Build RTCE
Write-Host "Building RTCE Text Service..."
cd services/rtce-text
npm install --silent
npm run build
if (-Not (Test-Path "dist/index.js")) { Write-Error "RTCE Build Failed" }
# Simulate Artifact Packaging
Compress-Archive -Path dist, package.json -DestinationPath ..\..\artifacts\rtce-text-v0.zip -Force
$rtceHash = Get-FileHash ..\..\artifacts\rtce-text-v0.zip -Algorithm SHA256
Write-Host "ARTIFACT: rtce-text-v0.zip    | DIGEST: $($rtceHash.Hash)" -ForegroundColor Green
cd ../..

Write-Host "`n>>> PHASE 2: STAGING DEPLOY (PORTS 4001, 4002) <<<" -ForegroundColor Cyan
# Start L2
$env:PORT=4001
$env:NODE_ENV="staging"
$l2Process = Start-Process -FilePath "node" -ArgumentList "services/l2-ingestion/dist/index.js" -PassThru -NoNewWindow
Write-Host "L2 Staging started locally on PID $($l2Process.Id)"

# Start RTCE
$env:PORT=4002
$env:NODE_ENV="staging"
$rtceProcess = Start-Process -FilePath "node" -ArgumentList "services/rtce-text/dist/index.js" -PassThru -NoNewWindow
Write-Host "RTCE Staging started locally on PID $($rtceProcess.Id)"

Start-Sleep -Seconds 5

Write-Host "`n>>> PHASE 3: HARNESS EXECUTION (STAGING) <<<" -ForegroundColor Cyan
$env:L2_URL="http://localhost:4001"
$env:RTCE_URL="http://localhost:4002"

cd harness
npm run test
$harnessExit = $LASTEXITCODE

# Cleanup
Stop-Process -Id $l2Process.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $rtceProcess.Id -Force -ErrorAction SilentlyContinue

if ($harnessExit -eq 0) {
    Write-Host "`nHARNESS PASS (STAGING)" -ForegroundColor Green
} else {
    Write-Error "HARNESS FAILED IN STAGING"
}
