import 'dotenv/config';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN
});

async function main() {
    console.log("Testing with common hashtag #nutrition");
    try {
        const input = {
            hashtags: ["nutrition"],
            resultsPerPage: 5,
            shouldScrapeComments: false
        };
        const run = await client.actor("clockworks/tiktok-scraper").call(input);
        console.log(`Run finished: ${run.id}`);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log(`Retrieved ${items.length} items`);
        if (items.length > 0) {
            console.log("First item sample:", JSON.stringify(items[0], null, 2));
        }
    } catch (e) {
        console.error("FAILED:", e);
    }
}

main();
