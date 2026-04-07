import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function validateScoring() {
    load_gime_v0_1();
    
    const samples: L2IngestRequest[] = [
        {
            correlation_id: "test-mon-cta",
            signal_id: "sig-1",
            source: "tiktok",
            raw_text: "how much is the course discount? buy now" // Monetization + CTA
        },
        {
            correlation_id: "test-prof-edu",
            signal_id: "sig-2",
            source: "tiktok",
            raw_text: "dietitians needing clinical nutrition certification credits" // Prof Pathway + Education context
        },
        {
            correlation_id: "test-life",
            signal_id: "sig-3",
            source: "tiktok",
            raw_text: "day in the life of a balanced eater" // Lifestyle + Content
        },
        {
            correlation_id: "test-unclassified",
            signal_id: "sig-4",
            source: "tiktok",
            raw_text: "totally unrelated noise" // UNCLASSIFIED
        }
    ];

    console.log("=== GIME Signal Scoring Validation (S10-T13) ===");

    samples.forEach((sample, index) => {
        const bundle1 = processL2Request(sample);
        const bundle2 = processL2Request(sample);
        const sp = bundle1.structured_post;

        console.log(`\nSample ${index + 1}: "${sample.raw_text}"`);
        console.log(`-> Primary Category: ${sp?.classification.primary_category}`);
        console.log(`-> Signal Type:     ${sp?.classification.signal_type}`);
        
        if (sp?.signal_score) {
            const { score, category_weight, type_adjustment, pattern_boost } = sp.signal_score;
            const isDeterministic = JSON.stringify(bundle1.structured_post?.signal_score) === JSON.stringify(bundle2.structured_post?.signal_score);

            console.log(`-> Score Breakdown:  Sum=${score} (Cat=${category_weight}, Type=${type_adjustment}, Boost=${pattern_boost})`);
            console.log(`-> Deterministic:    ${isDeterministic ? 'PASS' : 'FAIL'}`);
            
            // Logic Check (Visual Verification based on config)
            if (index === 0) console.log(`   (Expected for Mon+CTA: 3+2+2 = 7)`);
            if (index === 1) console.log(`   (Expected for Prof+Edu: 3+1+1 = 5)`);
            if (index === 2) console.log(`   (Expected for Life+Cont: 1+1+0 = 2)`);
        } else {
            console.log(`-> Signal Score Missing: FAIL`);
        }
    });

    // Check schema integrity 
    const finalBundle = processL2Request(samples[0]);
    console.log(`\n--- Schema Integrity Check ---`);
    console.log(`structured_post exists: ${!!finalBundle.structured_post ? 'PASS' : 'FAIL'}`);
    console.log(`signal_score inside sp:  ${!!finalBundle.structured_post?.signal_score ? 'PASS' : 'FAIL'}`);
    console.log(`classification preserved: ${!!finalBundle.structured_post?.classification ? 'PASS' : 'FAIL'}`);
}

validateScoring().catch(e => console.error(e));
