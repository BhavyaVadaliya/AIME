import { ApifyClient } from "apify-client";
import fs from 'fs';
import path from 'path';
import { L2IngestRequest } from '../../types';
import { normalizeTikTokItem, RawTikTokItem } from './normalize';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN
});

function getConfigPath() {
    let currentPath = __dirname;
    while (!fs.existsSync(path.join(currentPath, 'config')) && currentPath !== path.parse(currentPath).root) {
        currentPath = path.dirname(currentPath);
    }
    return path.join(currentPath, 'config', 'ingestion', 'tiktok_scope.json');
}

export async function fetchTikTokSignals(hashtags: string[], maxSignals: number, accounts: string[] = []): Promise<any[]> {
    const actorId = process.env.TIKTOK_ACTOR || 'clockworks/tiktok-scraper';
    let combinedItems: any[] = [];

    // Load cycle state for rotation
    const configRoot = path.join(__dirname, '..', '..', '..', '..', 'config', 'ingestion');
    const statePath = path.join(configRoot, 'discovery_state.json');
    let cycle = 1;
    if (fs.existsSync(statePath)) {
        cycle = JSON.parse(fs.readFileSync(statePath, 'utf8')).cycle;
    }
    const windowLabel = cycle === 1 ? "0-24h" : (cycle === 2 ? "24h-48h" : "48h-72h");

    // Implement Pagination Expansion (3 pages target, max 75 pre-cap)
    const pages = [1, 2, 3];
    const targetResultsPreCap = 75;

    for (const page of pages) {
        let pageItemsCount = 0;
        
        // Profiles monitoring (Cycle 1 only to ensure focus on discovery surface elsewhere)
        if (page === 1 && cycle === 1 && accounts && accounts.length > 0) {
            const profileInput = {
                profiles: accounts.map(acc => acc.startsWith('@') ? acc : `@${acc.split('@').pop()}`),
                resultsPerPage: 25,
                shouldScrapeComments: true
            };
            try {
                const profileRun = await client.actor(actorId).call(profileInput);
                const { items: profileItems } = await client.dataset(profileRun.defaultDatasetId).listItems();
                combinedItems = combinedItems.concat(profileItems);
                pageItemsCount += profileItems.length;
            } catch (err: any) {
                console.error(`Apify Profile Fetch Error (Page ${page}): ${err.message}`);
            }
        }

        // Hashtag Crawling with Pagination Depth
        if (hashtags && hashtags.length > 0 && combinedItems.length < targetResultsPreCap) {
            const hashtagInput = {
                hashtags: hashtags,
                resultsPerPage: 25,
                page: page,
                shouldScrapeComments: true
            };
            try {
                const hashtagRun = await client.actor(actorId).call(hashtagInput);
                const { items: hashtagItems } = await client.dataset(hashtagRun.defaultDatasetId).listItems();
                combinedItems = combinedItems.concat(hashtagItems);
                pageItemsCount += hashtagItems.length;
            } catch (err: any) {
                console.error(`Apify Hashtag Fetch Error (Page ${page}): ${err.message}`);
            }
        }

        // Discovery Layer Logging: Pagination Depth
        console.log(JSON.stringify({
            event: 'discovery_pagination',
            page: page,
            window: windowLabel,
            signals_retrieved: pageItemsCount,
            timestamp: new Date().toISOString()
        }));

        if (combinedItems.length >= targetResultsPreCap) break;
    }

    // Advance Cycle (Modulo 3-cycle rotation)
    const nextCycle = cycle >= 3 ? 1 : cycle + 1;
    if (fs.existsSync(statePath)) {
        fs.writeFileSync(statePath, JSON.stringify({ cycle: nextCycle }, null, 2));
    }

    return combinedItems;
}

export async function runTikTokHarvest(): Promise<L2IngestRequest[]> {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found at ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const maxSignals = config.max_signals_per_batch || 25;
    const hashtags = config.hashtags || [];
    const accounts = config.accounts || [];

    // Fetch live signals from TikTok via Apify
    const rawItems: any[] = await fetchTikTokSignals(hashtags, maxSignals, accounts);

    // DEDUPLICATION: Exact ID Match (Pre-normalization)
    const seenIds = new Set();
    const uniqueRawItems = rawItems.filter(item => {
        if (!item.id || seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
    });

    const normalizedItems: L2IngestRequest[] = [];
    
    for (const item of uniqueRawItems) {
        // Enforce the hard cap (post-deduplication)
        if (normalizedItems.length >= maxSignals) {
            break;
        }

        try {
            const normalized = normalizeTikTokItem(item as RawTikTokItem);
            normalizedItems.push(normalized);

            console.log(JSON.stringify({
                event: 'tiktok_harvest_item',
                timestamp: new Date().toISOString(),
                source: 'tiktok',
                source_id: item.id,
                ingestion_status: 'accepted',
                governance_status: 'passed'
            }));

        } catch (error: any) {
            console.log(JSON.stringify({
                event: 'tiktok_harvest_item',
                timestamp: new Date().toISOString(),
                source: 'tiktok',
                source_id: item.id || 'unknown',
                ingestion_status: 'rejected',
                governance_status: 'blocked',
                governance_reason_code: 'validation_failed'
            }));
        }
    }

    // Telemetry: Confirming Batch Broadening
    console.log(JSON.stringify({
        event: 'tiktok_harvest_batch',
        timestamp: new Date().toISOString(),
        batch_size: normalizedItems.length,
        max_signals_per_batch: maxSignals,
        unique_signals_found: uniqueRawItems.length,
        status: 'ok'
    }));

    return normalizedItems;
}


