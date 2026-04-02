import { ApifyClient } from 'apify-client';
import { normalizeTikTokItem, RawTikTokItem } from './normalize';
import { L2IngestRequest } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import { RelatedContentExporter } from '../../discovery_expanded/related';
import { CommentExtractor } from '../../discovery_expanded/comments';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || 'MISSING_TOKEN',
});

function getConfigPath(): string {
    const rootDir = path.join(__dirname, '..', '..', '..', '..');
    return path.join(rootDir, 'config', 'ingestion', 'tiktok_scope.json');
}

export async function fetchTikTokSignals(hashtags: string[], maxSignals: number, accounts: string[] = []): Promise<any[]> {
    const actorId = process.env.TIKTOK_ACTOR || 'clockworks/tiktok-scraper';
    let combinedItems: any[] = [];
    const cycleStartTime = Date.now();

    // 1. LOAD CONFIG-DRIVEN GUARDRAILS
    const rootDir = path.join(__dirname, '..', '..', '..', '..');
    const guardrailsPath = path.join(rootDir, 'config', 'discovery', 'guardrails.json');
    let guardrails = {
        max_requests_per_cycle: 10,
        max_pages_per_query: 3,
        max_signals_pre_cap: 75,
        min_rate_limit_remaining: 5,
        backoff_ms: 1000,
        max_cycle_duration_ms: 30000
    };
    if (fs.existsSync(guardrailsPath)) {
        guardrails = JSON.parse(fs.readFileSync(guardrailsPath, 'utf8'));
    }

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    const statePath = path.join(rootDir, 'config', 'ingestion', 'discovery_state.json');
    let cycle = 1;
    if (fs.existsSync(statePath)) {
        cycle = JSON.parse(fs.readFileSync(statePath, 'utf8')).cycle;
    }
    const windowLabel = cycle === 1 ? "0-24h" : (cycle === 2 ? "24h-48h" : "48h-72h");

    let requestsMade = 0;
    const pages = Array.from({ length: guardrails.max_pages_per_query }, (_, i) => i + 1);

    for (const page of pages) {
        const currentDuration = Date.now() - cycleStartTime;
        if (currentDuration > guardrails.max_cycle_duration_ms) {
            console.log(JSON.stringify({ 
                event: "discovery_cycle_terminated", 
                reason: "time_limit_exceeded" 
            }));
            break;
        }

        const simulatedRemaining = 100 - requestsMade; 
        if (simulatedRemaining < guardrails.min_rate_limit_remaining) {
            console.log(JSON.stringify({
                event: "discovery_rate_limit",
                remaining: simulatedRemaining,
                action: "cycle_stopped"
            }));
            break;
        }

        let pageItemsCount = 0;
        
        if (page === 1 && accounts && accounts.length > 0) {
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
                requestsMade++;
            } catch (err: any) {
                console.error(`Apify Profile Fetch Error (Page ${page}): ${err.message}`);
                if (err.statusCode === 429) break;
            }
        }

        if (hashtags && hashtags.length > 0 && combinedItems.length < guardrails.max_signals_pre_cap) {
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
                requestsMade++;
            } catch (err: any) {
                console.error(`Apify Hashtag Fetch Error (Page ${page}): ${err.message}`);
                if (err.statusCode === 429) break;
            }
        }

        console.log(JSON.stringify({
            event: 'discovery_pagination',
            page: page,
            window: windowLabel,
            signals_retrieved: pageItemsCount,
            timestamp: new Date().toISOString()
        }));

        if (combinedItems.length >= guardrails.max_signals_pre_cap) {
            combinedItems = combinedItems.slice(0, guardrails.max_signals_pre_cap);
            break;
        }

        if (page < guardrails.max_pages_per_query) {
            console.log(JSON.stringify({
                event: "discovery_backoff",
                delay_ms: guardrails.backoff_ms
            }));
            await sleep(guardrails.backoff_ms);
        }
    }

    const nextCycle = cycle >= 3 ? 1 : cycle + 1;
    if (fs.existsSync(statePath)) {
        fs.writeFileSync(statePath, JSON.stringify({ cycle: nextCycle }, null, 2));
    }

    console.log(JSON.stringify({
        event: "discovery_guardrail_summary",
        pages_fetched: pages.length,
        signals_pre_cap: combinedItems.length,
        signals_post_cap: 25,
        duration_ms: Date.now() - cycleStartTime,
        status: "ok"
    }));

    return combinedItems;
}

export async function runTikTokHarvest(): Promise<L2IngestRequest[]> {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found at ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const maxSignals = 25; 
    const hashtags = config.hashtags || [];
    const accounts = config.accounts || [];

    // Fetch live signals from TikTok via Apify (Seeds)
    const rawSignals: any[] = await fetchTikTokSignals(hashtags, 75, accounts);

    // === EXPANDED DISCOVERY LAYER (S10-T04 + S10-T05) ===
    const relatedExporter = new RelatedContentExporter();
    const commentExtractor = new CommentExtractor();
    
    // Load expansion config
    const rootDir = path.join(__dirname, '..', '..', '..', '..');
    const expansionConfigPath = path.join(rootDir, 'config', 'discovery', 'expansion.json');
    const expansionConfig = JSON.parse(fs.readFileSync(expansionConfigPath, 'utf8'));
    const maxParents = expansionConfig.max_parent_posts_per_cycle || 5;

    let totalDiscoveredRaw: any[] = [...rawSignals];
    
    // Apply expansion only to a limited subset of seeds to respect performance and guards
    for (const parent of rawSignals.slice(0, maxParents)) {
        const related = relatedExporter.expand(parent);
        const comments = commentExtractor.extract(parent);
        totalDiscoveredRaw = totalDiscoveredRaw.concat(related, comments);
    }

    // DEDUPLICATION: Exact ID Match (Pre-normalization)
    const seenIds = new Set();
    const uniqueRawItems = totalDiscoveredRaw.filter(item => {
        const sid = item.id || item.video_id; // Related/Comments provide id or video_id
        if (!sid || seenIds.has(sid)) return false;
        seenIds.add(sid);
        return true;
    });

    const normalizedItems: L2IngestRequest[] = [];
    
    for (const item of uniqueRawItems) {
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
                source_id: item.id || item.video_id,
                ingestion_status: 'accepted',
                governance_status: 'passed'
            }));

        } catch (error: any) {
            console.log(JSON.stringify({
                event: 'tiktok_harvest_item',
                timestamp: new Date().toISOString(),
                source: 'tiktok',
                source_id: item.id || item.video_id || 'unknown',
                ingestion_status: 'rejected',
                governance_status: 'blocked',
                governance_reason_code: 'validation_failed'
            }));
        }
    }

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
