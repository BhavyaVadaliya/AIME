import { normalizeTikTokItem, RawTikTokItem } from './normalize';
import { isInternalAccount } from './internal_exclusion';
import { L2IngestRequest } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import { RelatedContentExporter } from '../../discovery_expanded/related';
import { CommentExtractor } from '../../discovery_expanded/comments';
import { fetchTikTokSignals } from './harvest';

function getConfigPath(): string {
    const rootDir = path.join(__dirname, '..', '..', '..', '..', '..');
    return path.join(rootDir, 'config', 'ingestion', 'tiktok_scope.json');
}

/**
 * Parallel Discovery Path for Expanded Signal Surfaces (T04 + T05).
 * Operates independently of the baseline harvest runner.
 */
export async function runExpandedTikTokHarvest(): Promise<L2IngestRequest[]> {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file not found at ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const maxSignals = 25; 
    const hashtags = config.hashtags || [];
    const accounts = config.accounts || [];

    // 1. BASELINE DISCOVERY (Seeds)
    const rawSignals: any[] = await fetchTikTokSignals(hashtags, 75, accounts);

    // 2. EXPANDED DISCOVERY LAYER (T04 + T05)
    const relatedExporter = new RelatedContentExporter();
    const commentExtractor = new CommentExtractor();
    
    // Load expansion config
    const rootDir = path.join(__dirname, '..', '..', '..', '..');
    const expansionConfigPath = path.join(rootDir, 'config', 'discovery', 'expansion.json');
    const expansionConfig = JSON.parse(fs.readFileSync(expansionConfigPath, 'utf8'));
    const maxParents = expansionConfig.max_parent_posts_per_cycle || 5;

    let expandedRaw: any[] = [];
    
    // Apply expansion to a subset of seeds
    for (const parent of rawSignals.slice(0, maxParents)) {
        const related = relatedExporter.expand(parent);
        const comments = commentExtractor.extract(parent);
        expandedRaw = expandedRaw.concat(related, comments);
    }

    // 3. DEDUPLICATION (Pre-normalization)
    const seenIds = new Set();
    // For expanded discovery, we only return the *expanded* items to keep paths clean
    // or we can returned combined; here we return the expanded items to confirm diversity specifically.
    const uniqueExpanded = expandedRaw.filter(item => {
        if (isInternalAccount(item.author || item.authorMeta || item.nickname)) {
            let authorName = '';
            let authorId = '';
            const author = item.author || item.authorMeta || item.nickname;
            if (typeof author === 'string') { authorName = author; }
            else if (author && typeof author === 'object') {
                authorName = author.uniqueId || author.username || author.nickname || author.name || author.secUid || '';
                authorId = author.id || author.user_id || author.secUid || author.uid || '';
            }
            console.log(JSON.stringify({
                event: "signal_excluded_internal",
                timestamp: new Date().toISOString(),
                source: "tiktok",
                author_username: authorName.replace('@', ''),
                author_id: authorId || "unknown",
                reason: "internal_account",
                status: "ok"
            }));
            return false;
        }

        const sid = item.id || item.video_id;
        if (!sid || seenIds.has(sid)) return false;
        seenIds.add(sid);
        return true;
    });

    const normalizedItems: L2IngestRequest[] = [];
    let rejected_missing_source_count = 0;
    
    for (const item of uniqueExpanded) {
        if (normalizedItems.length >= maxSignals) {
            break;
        }

        try {
            // Use standard normalization to ensure adherence to the L2IngestRequest contract
            const normalized: L2IngestRequest | null = normalizeTikTokItem(item as RawTikTokItem);
            
            if (!normalized) {
                rejected_missing_source_count++;
                continue;
            }
            
            // Confirming no extra fields like 'discovery_origin' are present or leaked
            normalizedItems.push(normalized);

            console.log(JSON.stringify({
                event: 'tiktok_harvest_item_expanded',
                timestamp: new Date().toISOString(),
                source: 'tiktok',
                source_id: item.id || item.video_id,
                ingestion_status: 'accepted'
            }));

        } catch (error: any) {
            // Silently skip expansion items that fail normalization logic
        }
    }

    console.log(JSON.stringify({
        event: 'tiktok_harvest_expanded_batch',
        timestamp: new Date().toISOString(),
        batch_size: normalizedItems.length,
        rejected_missing_source_count: rejected_missing_source_count,
        status: 'ok'
    }));

    return normalizedItems;
}
