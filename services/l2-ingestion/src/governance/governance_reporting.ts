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
                    timestamp: now
                }
            }
        };
    }

    /**
     * Logs the full lifecycle report for audit purposes.
     */
    logLifecycle(bundle: L2Bundle): void {
        try {
            const report = this.generateReport(bundle);
            console.log(JSON.stringify({
                event: "signal_lifecycle_report",
                timestamp: new Date().toISOString(),
                ...report
            }));
        } catch (e) {
            // Silently fail logging if report cannot be generated
        }
    }
}
