import { L2IngestRequest, L2Bundle, SignalClassification } from './types';
import { getActiveMapping } from './lens/gime_mapping_loader';
import { classifySignal } from './classification/signal_classifier';
import { GovernanceRouter } from './governance/governance_router';
import { StructuredPostBuilder } from './governance/structured_post_builder';
import { LifecycleReporter } from './governance/governance_reporting';

const govRouter = new GovernanceRouter();
const postBuilder = new StructuredPostBuilder();
const reporter = new LifecycleReporter();

export const processL2Request = (req: L2IngestRequest): L2Bundle => {
    const rawText = req.raw_text;
    const text = rawText.toLowerCase();
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

    // Core Fallback
    if (!matched) {
        topics.push("general");
        context_summary = "General unlabeled query.";
    }

    // Apply active mapping topics conditionally
    if (mapping && mapping.topics) {
        const profKeywords = ['doctor', 'physician', 'nurse', 'pharmacist', 'clinician', 'chiropractor', 'healthcare professional', 'healthcare provider', 'practitioner', 'physical therapist', 'dietitian'];
        const eduKeywords = ['learn', 'study', 'course', 'training', 'certification', 'continuing education', 'program', 'education', 'knowledge'];
        const nutritionKeywords = ['nutrition', 'clinical nutrition', 'nutrition science', 'evidence-based nutrition', 'lifestyle medicine', 'functional nutrition', 'nutrition counseling', 'metabolic health', 'nutrition advice'];
        
        const hasProfContext = profKeywords.some(keyword => text.includes(keyword));
        const hasEduContext = eduKeywords.some(keyword => text.includes(keyword));
        const hasNutritionContext = nutritionKeywords.some(keyword => text.includes(keyword));
 
        if (hasProfContext && hasEduContext) {
            topics.push(...mapping.topics);
            context_summary = "Professional nutrition education inquiry.";
        } else if (hasProfContext && hasNutritionContext && (text.includes('practice') || text.includes('patients') || text.includes('counseling'))) {
            topics.push(...mapping.topics);
            context_summary = "Professional nutrition education inquiry.";
        } else if (hasEduContext && hasNutritionContext) {
           topics.push(...mapping.topics);
           context_summary = "Professional nutrition education inquiry.";
        }
    }

    // Policy Flags
    if (text.includes("kill") || text.includes("harm") || text.includes("suicide")) {
        flags.push("policy_risk_high");
    }

    const classification = classifySignal(rawText);
    
    console.log(JSON.stringify({
        event: "signal_classified",
        timestamp: new Date().toISOString(),
        signal_id: req.signal_id,
        correlation_id: req.correlation_id,
        primary_category: classification.primary_category,
        signal_type: classification.signal_type,
        status: "ok"
    }));

    const governance_route = govRouter.route(req.signal_id, req.correlation_id, classification);

    const bundle: L2Bundle = {
        correlation_id: req.correlation_id,
        signal_id: req.signal_id,
        l2_version: "v0",
        source: req.source,
        metadata: req.metadata,
        topics,
        subtopics,
        context_summary,
        entities: [],
        confidence: 1.0,
        flags,
        classification,
        governance_route
    };

    const finalBundle = postBuilder.build(bundle, rawText);
    reporter.logLifecycle(finalBundle);
    
    return finalBundle;
};
