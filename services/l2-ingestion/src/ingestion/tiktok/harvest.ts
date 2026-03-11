import fs from 'fs';
import path from 'path';
import { L2IngestRequest } from '../../types';
import { normalizeTikTokItem, RawTikTokItem } from './normalize';

function getConfigPath() {
    let currentPath = __dirname;
    while (!fs.existsSync(path.join(currentPath, 'config')) && currentPath !== path.parse(currentPath).root) {
        currentPath = path.dirname(currentPath);
    }
    return path.join(currentPath, 'config', 'ingestion', 'tiktok_scope.json');
}

// Mock function representing external API call
export function _mockFetchTikTok(hashtags: string[], maxSignals: number): Partial<RawTikTokItem>[] {
    const results: Partial<RawTikTokItem>[] = [];

    // Provide more data than max to test enforcement, plus a bad signal
    for (let i = 0; i < maxSignals + 10; i++) {
        results.push({
            id: `tk-mock-${i}`,
            text: `Mock text for hashtags: ${hashtags.join(', ')}`,
            createTime: Date.now(),
            author: 'mock_author',
            stats: {},
            videoUrl: 'http://tiktok.com/mock'
        });
    }

    // Add one invalid item with empty text that should fail normalization
    results.splice(1, 0, {
        id: `tk-mock-invalid`,
        text: '',
    });

    return results;
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

    // "Fetch" the public data
    const rawItems: Partial<RawTikTokItem>[] = _mockFetchTikTok(hashtags, maxSignals);

    const normalizedItems: L2IngestRequest[] = [];
    let rateLimitRemaining = 100; // Simulated
    const minRemainingGuardrail = config.rate_limit_guardrails?.min_remaining || 5;

    for (const item of rawItems) {
        // Enforce the hard cap
        if (normalizedItems.length >= maxSignals) {
            break;
        }

        // Enforce rate limit guardrail
        if (rateLimitRemaining < minRemainingGuardrail) {
            break; // Stop early
        }

        try {
            const normalized = normalizeTikTokItem(item);
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

        rateLimitRemaining--;
    }

    console.log(JSON.stringify({
        event: 'tiktok_harvest_batch',
        timestamp: new Date().toISOString(),
        batch_size: normalizedItems.length,
        max_signals_per_batch: maxSignals,
        hashtags_count: hashtags.length,
        accounts_count: accounts.length,
        rate_limit_remaining: rateLimitRemaining,
        status: 'ok'
    }));

    return normalizedItems;
}
