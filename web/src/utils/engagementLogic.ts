/**
 * Deterministic Engagement Logic for Sprint 11.
 * Shared between SuggestedReplyPanel, EngagementAnglePanel, and RespondWorkspace.
 */

export interface ReplyVariation {
    label: string;
    text: string;
}

export interface AlternateStrategy {
    angle: string;
    rationale: string;
}

export interface EngagementContext {
    direction: string;
    replies: ReplyVariation[];
    outreach: string;
    primaryAngle: string;
    primaryRationale: string;
    alternates: AlternateStrategy[];
    risk: string;
}

export const getEngagementContext = (category: string = ''): EngagementContext => {
    const cat = category.toUpperCase();

    if (cat.includes('MONETIZATION')) {
        return {
            direction: "Qualify Intent & ROI",
            replies: [
                { label: "Value-First", text: "Many start exactly where you are. Have you looked into the ROI for this specific path?" },
                { label: "Curiosity", text: "Thinking about taking the leap? What's your biggest question about the investment?" }
            ],
            outreach: "Curious what path you're exploring in nutrition. Would love to hear your goals.",
            primaryAngle: "Qualify Intent",
            primaryRationale: "High-intent inquiry detected. Establish goals before offering specific solutions to avoid premature friction.",
            alternates: [
                { angle: "Social Proof", rationale: "Share success stories of others in a similar position." },
                { angle: "Education First", rationale: "Provide value by answering technical aspects before discussing enrollment." }
            ],
            risk: "Avoid pitching too early. Ensure the user feels understood before discussing investment."
        };
    }

    if (cat.includes('PROFESSIONAL_PATHWAY') || cat.includes('CAREER')) {
        return {
            direction: "Offer Guidance / Roadmap",
            replies: [
                { label: "Empathy", text: "The journey to becoming a clinician is rewarding. What part of the process are you in?" },
                { label: "Assistance", text: "I've seen many navigate this transition. Happy to share what the first steps usually look like." }
            ],
            outreach: "Noticed you're looking into the RD path. Happy to connect if you have questions!",
            primaryAngle: "Guide Through Experience",
            primaryRationale: "Career-related query. Shared experience builds authority and trust while humanizing the brand.",
            alternates: [
                { angle: "Invite Conversation", rationale: "Ask about their current professional background to customize advice." },
                { angle: "Roadmap Share", rationale: "Offer a clear PDF or link to the standard pathway." }
            ],
            risk: "Avoid overwhelming with technical details. Keep the roadmap encouraging and digestible."
        };
    }

    if (cat.includes('EDUCATION')) {
        return {
            direction: "Educate & Inform",
            replies: [
                { label: "Science-Oriented", text: "Evidence-based knowledge is key. Have you seen our curriculum breakdown?" },
                { label: "Curiosity", text: "Learning the science is step one. What specific area of nutrition interests you most?" }
            ],
            outreach: "Curiosity is the best start. Are you looking for a formal certification?",
            primaryAngle: "Educate First",
            primaryRationale: "Scientific or educational curiosity detected. High-value knowledge builds top-of-funnel trust.",
            alternates: [
                { angle: "Qualify Interest", rationale: "Probe for specific topics to send more relevant content." },
                { angle: "Pain Point Check", rationale: "Identify if they are struggling with a concept to offer deeper help." }
            ],
            risk: "Ensure information is evidence-based. Avoid marketing language in this touchpoint."
        };
    }

    // Fallback / General
    return {
        direction: "Open Conversation",
        replies: [
            { label: "Engagement", text: "Interesting perspective! How did you first get interested in this topic?" },
            { label: "Value", text: "Thanks for sharing this! Would love to hear more about your thoughts on it." }
        ],
        outreach: "Love your content! Curious to hear more about your nutrition journey.",
        primaryAngle: "Invite Conversation",
        primaryRationale: "Signal level indicates generic interest. Probe for more context via a clarifying question.",
        alternates: [
            { angle: "Educational Pivot", rationale: "Share a related insight to spark deeper interest." }
        ],
        risk: "Conversation-first recommended. Do not lead with a call-to-action."
    };
};

