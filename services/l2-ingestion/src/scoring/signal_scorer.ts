import * as fs from 'fs';
import * as path from 'path';
import { SignalClassification } from '../types';

export interface SignalScore {
    score: number;
    category_weight: number;
    type_adjustment: number;
    pattern_boost: number;
}

export interface ScoringConfig {
    category_weights: Record<string, number>;
    type_adjustments: Record<string, number>;
    pattern_boosts: Record<string, number>;
}

/**
 * Deterministic Signal Scorer.
 * computes a numeric score for every signal based on existing classification data.
 * No filtering, thresholds, or decision logic.
 */
export class SignalScorer {
    private config: ScoringConfig;

    constructor() {
        let currentPath = __dirname;
        while (!fs.existsSync(path.join(currentPath, 'config')) && currentPath !== path.parse(currentPath).root) {
            currentPath = path.dirname(currentPath);
        }
        const configPath = path.join(currentPath, 'config', 'scoring', 'signal_scoring.json');
        
        try {
            if (fs.existsSync(configPath)) {
                this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } else {
                throw new Error(`Scoring config not found at ${configPath}`);
            }
        } catch (e: any) {
            // Default fallback if config fails to load
            this.config = {
                category_weights: { "Monetization": 4, "Professional Pathway": 4, "Education": 2, "Engagement": 2, "Lifestyle": 1, "Promotion": 1, "UNCLASSIFIED": 0 },
                type_adjustments: { "Problem": 3, "Offer": 3, "Question": 2, "CTA": 2, "Content": 1 },
                pattern_boosts: { "monetization_cta": 2, "monetization_problem": 2, "professional_education": 1, "engagement_monetization": 1 }
            };
        }
    }

    /**
     * computes a signal score deterministically.
     */
    computeScore(signalId: string, classification: SignalClassification): SignalScore {
        const cat = classification.primary_category;
        const type = classification.signal_type;
        const tags = classification.context_tags || [];

        // 1. BASE CATEGORY WEIGHT
        const category_weight = this.config.category_weights[cat] ?? 0;

        // 2. SIGNAL TYPE ADJUSTMENT
        const type_adjustment = this.config.type_adjustments[type] ?? 0;

        // 3. PATTERN BOOST
        let pattern_boost = 0;
        
        // Exact Pattern Matches (Normalized to snake_case for config matching)
        const combo_tag = `${cat.toLowerCase()}_${type.toLowerCase()}`;
        if (this.config.pattern_boosts[combo_tag]) {
            pattern_boost += this.config.pattern_boosts[combo_tag];
        }

        // Contextual Logic for Contextual Pattern Boosts (e.g. Professional Pathway + Education-related)
        if (cat === 'Professional Pathway' && tags.some(t => t.includes('Education') || t.includes('Professional'))) {
            pattern_boost += this.config.pattern_boosts['professional_education'] ?? 0;
        }

        // Engagement + Monetization-context boost
        if (cat === 'Engagement' && tags.includes('Coaching')) {
            pattern_boost += this.config.pattern_boosts['engagement_monetization'] ?? 0;
        }

        const score = category_weight + type_adjustment + pattern_boost;

        // Traceability Logging
        console.log(JSON.stringify({
            event: "signal_scored",
            timestamp: new Date().toISOString(),
            signal_id: signalId,
            score,
            category_weight,
            type_adjustment,
            pattern_boost,
            status: "ok"
        }));

        return {
            score,
            category_weight,
            type_adjustment,
            pattern_boost
        };
    }
}
