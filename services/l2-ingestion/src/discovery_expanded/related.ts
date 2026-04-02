import * as fs from 'fs';
import * as path from 'path';

export interface RelatedSignalExpansion {
    expand(seedSignal: any): any[];
}

/**
 * S10-T04: Related Content Expansion
 * Retrieves adjacent or related content from discovered seed signals.
 */
export class RelatedContentExporter implements RelatedSignalExpansion {
    private maxRelated: number;

    constructor() {
        // Load config-driven limits from project root
        const configPath = path.join(__dirname, '..', '..', '..', '..', 'config', 'discovery', 'expansion.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.maxRelated = config.max_related_per_seed || 5;
    }

    /**
     * Extracts related content from the raw signal metadata.
     * Note: This acts on current platform-supported metadata structures
     * (e.g. suggested videos, mentioned creators, adjacent thread content).
     */
    expand(seedSignal: any): any[] {
        const relatedItems: any[] = [];
        const parentId = seedSignal.id;

        // Platform-supported expansion: extract from 'relatedVideos' or 'suggested_vids'
        const rawRelated = seedSignal.suggested_vids || seedSignal.relatedVideos || [];
        
        // Simulating the retrieval if literal data isn't in this specific schema but exists for the surface
        // In this implementation, we pick from verified raw metadata paths only.
        for (const item of rawRelated.slice(0, this.maxRelated)) {
            relatedItems.push({
                ...item,
                discovery_origin: 'related_expansion',
                parent_id: parentId
            });
        }

        if (relatedItems.length > 0) {
            console.log(JSON.stringify({
                event: "expanded_related_content",
                parent_signal_id: parentId,
                related_found: relatedItems.length,
                timestamp: new Date().toISOString(),
                status: "ok"
            }));
        }

        return relatedItems;
    }
}
