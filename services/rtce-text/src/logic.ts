import { RTCEDecideRequest, RouteDecision } from './types';

export const processRTCEDecision = (req: RTCEDecideRequest): RouteDecision => {
    const { l2_bundle } = req;
    const rationale_tags: string[] = [];
    const matched_rules: string[] = [];
    let route = "defer"; // default
    let notes = "Default route";

    // Rule 1: Policy Risk
    if (l2_bundle.flags.includes("policy_risk_high")) {
        route = "reject_policy";
        matched_rules.push("rule_policy_risk_high");
        rationale_tags.push("risk_detected");
        notes = "Flagged as high risk by L2.";
    }
    // Rule 2: Health -> Escalate
    else if (l2_bundle.topics.includes("health")) {
        route = "escalate_human";
        matched_rules.push("rule_topic_health");
        rationale_tags.push("sensitive_topic");
        notes = "Health topics require human review.";
    }
    // Rule 3: Safety -> Clarify
    else if (l2_bundle.topics.includes("safety")) {
        route = "clarify";
        matched_rules.push("rule_topic_safety");
        rationale_tags.push("safety_check");
        notes = "Safety queries need clarification.";
    }
    // Rule 4: General -> Educate
    else {
        route = "educate";
        matched_rules.push("rule_default_educate");
        rationale_tags.push("informational");
        notes = "Standard educational response.";
    }

    return {
        correlation_id: req.correlation_id,
        signal_id: req.signal_id,
        rtce_version: "v0",
        route,
        rationale_tags,
        decision_trace: {
            matched_rules,
            notes
        }
    };
};
