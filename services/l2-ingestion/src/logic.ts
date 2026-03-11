import { L2IngestRequest, L2Bundle } from './types';
import { getActiveMapping } from './lens/gime_mapping_loader';

export const processL2Request = (req: L2IngestRequest): L2Bundle => {
    const text = req.raw_text.toLowerCase();
    const mapping = getActiveMapping();
    const topics: string[] = [];
    const subtopics: string[] = [];
    const flags: string[] = [];
    let context_summary = "General inquiry";
    let matched = false;

    if (text.includes("tired") || text.includes("fatigue")) {
        topics.push("health");
        subtopics.push("fatigue");
        context_summary = "User reports feeling tired.";
        matched = true;
    }

    if (text.includes("safe") || text.includes("medication") || text.includes("take")) {
        topics.push("safety");
        subtopics.push("medication_safety");
        context_summary = "User asking about medication safety.";
        matched = true;
    }

    // Fallback
    if (!matched) {
        topics.push("general");
        context_summary = "General unlabeled query.";
    }

    // Apply active mapping topics
    if (mapping && mapping.topics) {
        topics.push(...mapping.topics);
    }

    // Policy Flags
    if (text.includes("kill") || text.includes("harm") || text.includes("suicide")) {
        flags.push("policy_risk_high");
    }

    return {
        correlation_id: req.correlation_id,
        signal_id: req.signal_id,
        l2_version: "v0",
        topics,
        subtopics,
        context_summary,
        entities: [],
        confidence: 1.0,
        flags
    };
};
