const fs = require('fs');
const lines = fs.readFileSync('e:/aime-demo/l2_logs.txt', 'utf8').split('\n').filter(Boolean).slice(-10);
lines.forEach(l => {
    try {
        const o = JSON.parse(l);
        if(o.structured_post && o.structured_post.data) { 
            const d = o.structured_post.data; 
            console.log(`Text: ${d.raw_text}`);
            console.log(`Category: ${d.classification.primary_category} | Type: ${d.classification.signal_type}`);
            console.log(`Priority: ${d.priority_tier} | Route: ${d.governance_route.queue}`);
            console.log(`Score: ${d.signal_score.score}`);
            console.log("---"); 
        }
    } catch(e) {}
});
