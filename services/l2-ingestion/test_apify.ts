import 'dotenv/config';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN
});

async function test() {
    try {
        console.log("Testing Apify token...");
        const me = await client.user().get();
        console.log("Token Valid. User ID:", me.id);
    } catch (e: any) {
        console.error("Token Invalid:", e.message);
    }
}
test();
