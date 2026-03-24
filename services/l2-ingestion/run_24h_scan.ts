import 'dotenv/config';

// 24-HOUR CONTINUOUS SCAN PIPELINE
// Runs: TikTok Harvest -> Normalize -> Route -> L2 -> RTCE
// Constraint: Max 25 signals per batch (controlled by tiktok_scope.json)

const INTERVAL_MS = 60 * 60 * 1000; // Run every 1 hour
const DURATION_MS = 24 * 60 * 60 * 1000; // Stop after 24 hours

async function triggerHarvest() {
    try {
        console.log(`[${new Date().toISOString()}] Triggering TikTok harvest batch...`);
        const response = await fetch('http://localhost:3001/v1/ingestion/tiktok/harvest', {
            method: 'POST'
        });
        const data = await response.json();
        console.log(`[${new Date().toISOString()}] Response:`, data);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Harvest trigger failed:`, error.message);
    }
}

async function start24HourScan() {
    console.log("=====================================");
    console.log("🚀 STARTING 24-HOUR SIGNAL DISCOVERY SCAN");
    console.log("=====================================");
    
    // First run immediately
    await triggerHarvest();
    
    // Schedule subsequent runs
    const intervalId = setInterval(async () => {
        await triggerHarvest();
    }, INTERVAL_MS);
    
    // Stop after 24 hours
    setTimeout(() => {
        clearInterval(intervalId);
        console.log("=====================================");
        console.log("✅ 24-HOUR SCAN COMPLETE");
        console.log("=====================================");
        process.exit(0);
    }, DURATION_MS);
}

start24HourScan();
