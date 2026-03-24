import 'dotenv/config';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN
});

async function main() {
    try {
        console.log("Fetching past runs...");
        const runs = await client.actor("clockworks/tiktok-scraper").runs().list({ limit: 10 });
        const successfulRuns = runs.items.filter((r: any) => r.status === 'SUCCEEDED' && r.defaultDatasetId);
        
        let allItems: any[] = [];
        for (const run of successfulRuns) {
            console.log("Fetching dataset for run:", run.id);
            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            allItems = allItems.concat(items);
        }
        
        console.log("Saved items count:", allItems.length);
        
        const fs = require('fs');
        fs.writeFileSync('cached_items.json', JSON.stringify(allItems, null, 2));
        console.log("Saved to cached_items.json");
    } catch (e) {
        console.error(e);
    }
}

main();
