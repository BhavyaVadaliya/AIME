const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, 'l2_logs.txt');

const signals = [
    {
        event: "signal_lifecycle_report",
        timestamp: new Date().toISOString(),
        signal_id: "tk_valid_1",
        correlation_id: "corr-1",
        structured_post: {
            raw_text: "Great TikTok content about coding!",
            classification: { primary_category: "Education", signal_type: "Content" },
            governance_route: { queue: "low_risk" },
            signal_score: { score: 8 },
            priority_tier: "MEDIUM",
            source: {
                platform: "tiktok",
                username: "coding_wiz",
                author_id: "123",
                source_url: "https://www.tiktok.com/@coding_wiz/video/123456789",
                timestamp: new Date().toISOString()
            }
        }
    },
    {
        event: "signal_lifecycle_report",
        timestamp: new Date().toISOString(),
        signal_id: "tk_mismatch_1",
        correlation_id: "corr-2",
        structured_post: {
            raw_text: "Wait, the username doesn't match the URL!",
            classification: { primary_category: "Education", signal_type: "Content" },
            governance_route: { queue: "low_risk" },
            signal_score: { score: 5 },
            priority_tier: "LOW",
            source: {
                platform: "tiktok",
                username: "hacker_guy",
                author_id: "456",
                source_url: "https://www.tiktok.com/@someone_else/video/987654321",
                timestamp: new Date().toISOString()
            }
        }
    },
    {
        event: "signal_lifecycle_report",
        timestamp: new Date().toISOString(),
        signal_id: "tk_invalid_url",
        correlation_id: "corr-3",
        structured_post: {
            raw_text: "This link is totally wrong.",
            classification: { primary_category: "Education", signal_type: "Content" },
            governance_route: { queue: "low_risk" },
            signal_score: { score: 2 },
            priority_tier: "LOW",
            source: {
                platform: "tiktok",
                username: "confused_user",
                author_id: "789",
                source_url: "https://not-tiktok.com/oops",
                timestamp: new Date().toISOString()
            }
        }
    }
];

signals.forEach(s => {
    fs.appendFileSync(logPath, JSON.stringify(s) + "\n");
});

console.log("Appended 3 test signals to l2_logs.txt");
