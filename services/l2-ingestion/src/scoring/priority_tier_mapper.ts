import * as fs from 'fs';
import * as path from 'path';
import { SignalClassification } from '../types';

export type PriorityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityConfig {
    high: {
        category_and_type: [string, string[]][];
        type_override: string[];
    };
    medium: {
        category_and_type: [string, string[]][];
        category_minimum: string[];
    };
    low: {
        categories: string[];
        generic_content_cap: boolean;
    };
    score_thresholds: {
        high: number;
        medium: number;
    };
}

/**
 * Priority Tier Mapper (S10-T14).
 * Assigns a deterministic priority tier to every signal based on classification attributes.
 * No filtering or thresholds.
 */
export class PriorityTierMapper {
    private config: PriorityConfig;

    constructor() {
        let currentPath = __dirname;
        while (!fs.existsSync(path.join(currentPath, 'config')) && currentPath !== path.parse(currentPath).root) {
            currentPath = path.dirname(currentPath);
        }
        const configPath = path.join(currentPath, 'config', 'scoring', 'priority_tier_mapping.json');
        
        try {
            if (fs.existsSync(configPath)) {
                this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } else {
                throw new Error(`Priority mapping config not found at ${configPath}`);
            }
        } catch (e: any) {
            // Default robust fallback
            this.config = {
                high: { category_and_type: [], type_override: ["Problem"] },
                medium: { category_and_type: [], category_minimum: ["Monetization"] },
                low: { categories: ["Lifestyle"], generic_content_cap: true },
                score_thresholds: { high: 8, medium: 5 }
            };
        }
    }

    /**
     * Maps classification context and score to a deterministic priority tier.
     * Logic:
     * 1. If score >= HIGH threshold -> HIGH
     * 2. If score >= MEDIUM threshold -> MEDIUM
     * 3. Fallback to category/type rules
     */
    mapTier(signalId: string, classification: SignalClassification, score?: number): PriorityTier {
        // 1. Score-based Thresholds (Priority)
        if (score !== undefined) {
            if (score >= this.config.score_thresholds.high) {
                return 'HIGH';
            }
            if (score >= this.config.score_thresholds.medium) {
                return 'MEDIUM';
            }
        }

        const cat = classification.primary_category;
        const type = classification.signal_type;
        
        let tier: PriorityTier = 'LOW'; // Default baseline

        // 1. Mandatory Problem Override (ALWAYS HIGH)
        if (this.config.high.type_override.includes(type)) {
            tier = 'HIGH';
        } 
        
        // 2. High Priority Category + Type specific combinations
        if (tier !== 'HIGH') {
            const isHighCombo = this.config.high.category_and_type.some(([c, types]) => 
                c === cat && types.includes(type)
            );
            if (isHighCombo) tier = 'HIGH';
        }

        // 3. Medium Priority Rules & Minimums
        if (tier === 'LOW') {
            const isMedCombo = this.config.medium.category_and_type.some(([c, types]) => 
                c === cat && types.includes(type)
            );
            const isMinMed = this.config.medium.category_minimum.includes(cat);
            
            if (isMedCombo || isMinMed) {
                tier = 'MEDIUM';
            }
        }

        // 4. Low Priority Category Rules (Lifestyle / Promotion)
        if (tier === 'LOW') {
            if (this.config.low.categories.includes(cat)) {
                tier = 'LOW';
            }
        }

        // 5. Generic Content Capping
        if (type === 'Content' && tier !== 'MEDIUM' && tier !== 'HIGH') {
            tier = 'LOW';
        }

        // Traceability Logging
        console.log(JSON.stringify({
            event: "priority_tier_mapped",
            timestamp: new Date().toISOString(),
            signal_id: signalId,
            priority_tier: tier,
            primary_category: cat,
            signal_type: type,
            status: "ok"
        }));

        return tier;
    }
}
