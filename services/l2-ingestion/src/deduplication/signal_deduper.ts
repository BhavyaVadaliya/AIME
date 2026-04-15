import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface DedupeConfig {
    enabled: boolean;
    timestamp_window_minutes: number;
}

// In-memory cache for the current session's deduplication keys.
// For true persistence across restarts, one would need a persistent cache (Redis/DB/File),
// but per requirements, we focus on deterministic window-based suppression.
const dedupeCache = new Set<string>();

/**
 * Loads deduplication configuration.
 */
function loadConfig(): DedupeConfig {
    try {
        const configPath = path.resolve(__dirname, '..', '..', '..', '..', 'config', 'deduplication', 'signal_deduplication.json');
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
    } catch (e) {
        // Silently fallback to default
    }
    return { enabled: true, timestamp_window_minutes: 60 };
}

/**
 * Normalizes text for hashing: lowercase, trim, collapse whitespace, strip noise.
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, ' ') // Collapse repeated whitespace
        .replace(/[^\w\s\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]/g, '') // Strip common punctuation noise
        .trim();
}

/**
 * Generates the 60-minute bucket identifier for a timestamp.
 */
function getTimestampBucket(timestamp: string | number | Date, windowMinutes: number): number {
    const date = new Date(timestamp);
    const ms = windowMinutes * 60 * 1000;
    return Math.floor(date.getTime() / ms);
}

/**
 * Builds the composite deduplication key.
 * platform + author_id + normalized_text_hash + timestamp_window
 */
export function buildDedupeKey(platform: string, authorId: string, text: string, timestamp: string): string {
    const config = loadConfig();
    const normalized = normalizeText(text);
    const textHash = crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
    const bucket = getTimestampBucket(timestamp, config.timestamp_window_minutes);
    
    return `${platform}:${authorId}:${textHash}:${bucket}`;
}

/**
 * Checks if a signal is a duplicate and records it if not.
 * Returns true if duplicate, false otherwise.
 */
export function isDuplicateSignal(platform: string, authorId: string, text: string, timestamp: string): boolean {
    const config = loadConfig();
    if (!config.enabled) return false;

    const key = buildDedupeKey(platform, authorId, text, timestamp);
    
    if (dedupeCache.has(key)) {
        return true;
    }

    dedupeCache.add(key);
    return false;
}

/**
 * Log a deduplication event.
 */
export function logDeduplication(signalId: string, platform: string, authorId: string): void {
    const entry = {
        event: "signal_deduplicated",
        timestamp: new Date().toISOString(),
        signal_id: signalId,
        platform: platform,
        author_id: authorId,
        reason: "composite_key_match",
        status: "ok"
    };
    console.log(JSON.stringify(entry));
}
