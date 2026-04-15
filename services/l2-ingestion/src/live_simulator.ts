import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import * as fs from 'fs';
import * as path from 'path';

const patterns = [
    { text: "Best plant-based protein sources for muscle recovery", authorId: "nutrition_pro", cat: "Education", type: "Content" },
    { text: "Best plant-based protein sources for muscle recovery", authorId: "nutrition_pro", cat: "Education", type: "Content" }, // Duplicate
    { text: "How much does a private nutrition consultation cost?", authorId: "wellness_seeker", cat: "Monetization", type: "Question" },
    { text: "How much does a private nutrition consultation cost?", authorId: "wellness_seeker", cat: "Monetization", type: "Question" }, // Duplicate
    { text: "Latest studies on vitamin D and immune function", authorId: "science_daily", cat: "Education", type: "Content" },
    { text: "Latest studies on vitamin D and immune function", authorId: "science_daily", cat: "Education", type: "Content" }, // Duplicate
    { text: "What is the best way to become a pediatric dietitian?", authorId: "student_rd", cat: "Professional Pathway", type: "Question" },
    { text: "What is the best way to become a pediatric dietitian?", authorId: "student_rd", cat: "Professional Pathway", type: "Question" }, // Duplicate
    { text: "Sign up for our clinical nutrition webinar this Friday", authorId: "academy_hub", cat: "Monetization", type: "Offer" },
    { text: "Sign up for our clinical nutrition webinar this Friday", authorId: "academy_hub", cat: "Monetization", type: "Offer" }  // Duplicate
];

async function runSimulator() {
    load_gime_v0_1();
    const logPath = path.resolve(path.join(__dirname, "..", "..", "..", "l2_logs.txt"));
    
    console.log("=== TikTok Shadow Stream Simulator (UNIQUE WAVE) ===");
    console.log("Generating 50 unique signals for presentation...");

    const uniqueTopics = [
        "Metabolic health research", "Clinical nutrition case study", "Pediatric dietetics pathway",
        "Sports nutrition recovery tips", "Gut-brain axis explained", "Intermittent fasting methodology",
        "Hormonal health and diet", "Inflammation reduction strategies", "Medication-nutrient interactions",
        "Community health outreach program"
    ];

    let count = 0;
    while (count < 50) {
        const topic = uniqueTopics[count % uniqueTopics.length];
        const id = `live-wave5-${Date.now()}-${count}`;
        
        // Ensure text is unique by appending the count
        const text = `${topic} - Update #${count + 1}: Comprehensive analysis of new clinical findings.`;
        
        const sample: L2IngestRequest = {
            correlation_id: `corr-${id}`,
            signal_id: id,
            source: "tiktok",
            raw_text: text,
            metadata: {
                author_id: `presenter_user_${count}`,
                author: `Scientific Observer ${count + 1}`
            }
        };

        const bundle = processL2Request(sample);
        console.log(`[UNIQUE] Pushed: ${id} - Unique Signal #${count + 1}`);
        
        count++;
    }
}

runSimulator().catch(e => console.error(e));
