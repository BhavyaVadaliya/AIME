import * as fs from 'fs';
import * as path from 'path';
import { SignalClassification } from '../types';

export interface GovernanceRoute {
    queue: 'low_risk' | 'higher_risk';
    routing_basis: {
        primary_category: string;
        signal_type: string;
    };
}

export interface QueueRoutingConfig {
    low_risk: {
        primary_categories: string[];
        signal_types: string[];
    };
    higher_risk: {
        primary_categories: string[];
        signal_types: string[];
    };
}

/**
 * Deterministic Governance Router (S10-T09).
 * Assigns signals to queues based on existing classification.
 * No filtering, scoring, or enforcement actions.
 */
export class GovernanceRouter {
    private config: QueueRoutingConfig;

    constructor() {
        const rootDir = path.join(__dirname, '..', '..', '..', '..');
        const configPath = path.join(rootDir, 'config', 'governance', 'queue_routing.json');
        
        try {
            if (fs.existsSync(configPath)) {
                this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } else {
                throw new Error(`Governance config not found at ${configPath}`);
            }
        } catch (e: any) {
            // Default fallback if config fails to load
            this.config = {
                low_risk: { primary_categories: ["Education", "Lifestyle"], signal_types: ["Content"] },
                higher_risk: { primary_categories: ["Monetization"], signal_types: ["CTA"] }
            };
        }
    }

    /**
     * Assigns a signal to a governance queue deterministically.
     * All signals are preserved; no filtering happens here.
     */
    route(signalId: string, correlationId: string, classification: SignalClassification): GovernanceRoute {
        const { primary_category: cat, signal_type: type } = classification;
        
        let queue: 'low_risk' | 'higher_risk' = 'higher_risk'; // Default to defensive/higher risk

        // Check low_risk triggers
        const isLowRiskCat = this.config.low_risk.primary_categories.includes(cat);
        const isLowRiskType = this.config.low_risk.signal_types.includes(type);

        if (isLowRiskCat || isLowRiskType) {
            queue = 'low_risk';
        }

        const route: GovernanceRoute = {
            queue,
            routing_basis: {
                primary_category: cat,
                signal_type: type
            }
        };

        // Traceability Logging
        console.log(JSON.stringify({
            event: "governance_queue_routed",
            timestamp: new Date().toISOString(),
            signal_id: signalId,
            correlation_id: correlationId,
            queue: route.queue,
            primary_category: cat,
            signal_type: type,
            status: "ok"
        }));

        return route;
    }
}
