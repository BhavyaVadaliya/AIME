import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function validateDevPackage() {
    load_gime_v0_1();
    
    const samples: L2IngestRequest[] = [
        // 1. Informational -> Education
        { correlation_id: "test", signal_id: "info-1", source: "tiktok", raw_text: "Science Behind Intermittent Fasting Explained" },
        { correlation_id: "test", signal_id: "info-2", source: "tiktok", raw_text: "Tips for improving gut health naturally" },
        { correlation_id: "test", signal_id: "info-3", source: "tiktok", raw_text: "How to understand nutrition labels" },
        
        // 2. Questions -> Question type
        { correlation_id: "test", signal_id: "quest-1", source: "tiktok", raw_text: "How do I calculate macros for weight loss?" },
        { correlation_id: "test", signal_id: "quest-2", source: "tiktok", raw_text: "What’s a nutritionist?" },
        { correlation_id: "test", signal_id: "quest-3", source: "tiktok", raw_text: "Is hiring a health coach worth it?" },
        
        // 3. Drift Check
        { correlation_id: "test", signal_id: "drift-1", source: "tiktok", raw_text: "how much does it cost?" },
        { correlation_id: "test", signal_id: "drift-2", source: "tiktok", raw_text: "how do I become a dietitian?" },
        { correlation_id: "test", signal_id: "drift-3", source: "tiktok", raw_text: "daily wellness routine tips" }
    ];

    console.log("--- DEV PACKAGE VALIDATION ---");
    
    // suppress internal logging
    const originalLog = console.log;
    console.log = function() {};

    let summary = "";
    samples.forEach(sample => {
        const bundle = processL2Request(sample);
        summary += `[${sample.signal_id}] "${sample.raw_text}"\n`;
        summary += ` -> Category: ${bundle.classification?.primary_category}\n`;
        summary += ` -> Type: ${bundle.classification?.signal_type}\n`;
        summary += ` -> Priority: ${bundle.structured_post?.priority_tier}\n\n`;
    });
    
    console.log = originalLog;
    console.log(summary);
}

validateDevPackage().catch(e => console.error(e));
