const http = require('http');

const HARVEST_URL = 'http://localhost:3001/v1/ingestion/tiktok/harvest';
const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const DURATION_MS = 15 * 60 * 1000; // 15 minutes

function triggerHarvest() {
    console.log(`[${new Date().toISOString()}] Triggering TikTok harvest...`);
    return new Promise((resolve, reject) => {
        const req = http.request(HARVEST_URL, { method: 'POST' }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`[${new Date().toISOString()}] Harvest response (${res.statusCode}):`, data);
                resolve();
            });
        });
        req.on('error', (err) => {
            console.error(`[${new Date().toISOString()}] Harvest failed:`, err.message);
            resolve(); // Don't crash
        });
        req.end();
    });
}

async function runDiscovery() {
    console.log(`Starting 15-minute discovery scan at ${new Date().toISOString()}`);
    
    // Run immediately
    await triggerHarvest();

    const startTime = Date.now();
    const interval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= DURATION_MS) {
            console.log(`Discovery scan completed at ${new Date().toISOString()}`);
            clearInterval(interval);
            process.exit(0);
        }
        await triggerHarvest();
    }, INTERVAL_MS);
}

runDiscovery();
