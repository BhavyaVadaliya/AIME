import 'dotenv/config';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN
});

async function main() {
    try {
        const input = {
            hashtags: ["nutrition"],
            resultsPerPage: 1,
            shouldScrapeComments: false
        };
        const run = await client.actor("clockworks/tiktok-scraper").call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        if (items.length > 0) {
            console.log("ITEM KEYS:", Object.keys(items[0]).join(', '));
            console.log("Item ID:", items[0].id);
            console.log("Item Text/Desc fields:", 
                `text: ${!!items[0].text}, description: ${!!items[0].description}, videoDescription: ${!!items[0].videoDescription}, contents: ${!!items[0].contents}`);
            console.log("Author fields:", 
                `authorMeta: ${!!items[0].authorMeta}, nickname: ${!!items[0].nickname}, uniqueId: ${!!items[0].uniqueId}`);
            console.log("URL fields:", 
                `webVideoUrl: ${!!items[0].webVideoUrl}, videoUrl: ${!!items[0].videoUrl}, tiktokLink: ${!!items[0].tiktokLink}`);
            console.log("Metrics fields:", 
                `diggCount: ${!!items[0].diggCount}, commentCount: ${!!items[0].commentCount}, stats: ${!!items[0].stats}`);
        }
    } catch (e) {
        console.error(e);
    }
}

main();
