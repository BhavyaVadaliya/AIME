import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { L2Bundle } from '../types';

export interface LifecycleReport {
    signal_id: string;
    correlation_id: string;
    lifecycle: {
        ingestion: {
            event: string;
            status: string;
            timestamp: string;
        };
        classification: {
            event: string;
            primary_category: string;
            signal_type: string;
            timestamp: string;
        };
        routing: {
            event: string;
            queue: string;
            timestamp: string;
        };
        structured_post: {
            event: string;
            status: string;
            timestamp: string;
            data?: any; // Include the full structured post map for reporting
        };
    };
}

/**
 * Governance Reporting Module (S10-T12).
 * Assembles a full lifecycle reporting view for a processed signal.
 * Observability only; no behavior changes.
 */
export class LifecycleReporter {
    /**
     * Generates a lifecycle report for a processed signal bundle.
     * This relies on the metadata and structured_post already present in the bundle.
     */
    generateReport(bundle: L2Bundle): LifecycleReport {
        if (!bundle.structured_post) {
            throw new Error("Cannot generate lifecycle report: structured_post missing");
        }

        const now = new Date().toISOString();

        return {
            signal_id: bundle.signal_id,
            correlation_id: bundle.correlation_id,
            lifecycle: {
                ingestion: {
                    event: "signal_ingested",
                    status: "ok",
                    timestamp: now // For reporting purposes, we use the assembly timestamp if exact ingestion time isn't stored in bundle
                },
                classification: {
                    event: "signal_classified",
                    primary_category: bundle.classification?.primary_category || "UNCLASSIFIED",
                    signal_type: bundle.classification?.signal_type || "UNKNOWN",
                    timestamp: now
                },
                routing: {
                    event: "governance_queue_routed",
                    queue: bundle.governance_route?.queue || "higher_risk",
                    timestamp: now
                },
                structured_post: {
                    event: "structured_post_created",
                    status: "ok",
                    timestamp: now,
                    data: bundle.structured_post
                }
            }
        };
    }

    /**
     * Logs the full lifecycle report for audit purposes.
     * In a distributed environment (like Render), this also pushes to the Core API.
     */
    async logLifecycle(bundle: L2Bundle): Promise<void> {
        try {
            const report = this.generateReport(bundle);
            const entry = {
                event: "signal_lifecycle_report",
                timestamp: new Date().toISOString(),
                ...report
            };
            
            // 1. Console Log
            console.log(JSON.stringify(entry));

            // 2. File Log (Local/Container fallback)
            try {
                const logPath = path.resolve(__dirname, "..", "..", "..", "..", "l2_logs.txt");
                fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");
            } catch (fsErr) {
                // Ignore FS errors in read-only environments
            }

            // 3. Distributed PUSH to Core API (Required for live Dashboard Lite)
            const isRender = !!process.env.RENDER;
            const coreUrl = process.env.CORE_API_URL || 
                           (isRender ? 'http://aime-0vwz:4000/api' : 'https://aime-0vwz.onrender.com/api');
            
            await axios.post(`${coreUrl}/admin/signals`, entry, { timeout: 5000 })
                .catch(err => console.warn(`[Reporter] Core API push failed: ${err.message}`));
            
        } catch (e: any) {
            console.error(`Failed to log lifecycle: ${e.message}`);
        }
    }
}
