import * as fs from 'fs';
import * as path from 'path';
import { processL2Request } from './logic';
import { normalizeTikTokItem } from './ingestion/tiktok/normalize';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';

async function runSourceVisibilityTest() {
    load_gime_v0_1();
    
    const logsPath = path.resolve(__dirname, '..', 'l2_logs.txt');
    // Clear existing logs
    fs.writeFileSync(logsPath, '');

    console.log("=== STARTING SOURCE VISIBILITY GATE TEST (10 SIGNALS) ===");

    const sampleMetadata = [
        { id: "735829104", author: "clinical_jenny", text: "How to become a dietitian?", webVideoUrl: "https://www.tiktok.com/@clinical_jenny/video/735829104" },
        { id: "735829205", author: "nurse_practitioner_hub", text: "Bedside nursing vs Clinical nutrition salary.", webVideoUrl: "https://www.tiktok.com/@nurse_practitioner_hub/video/735829205" },
        { id: "735829306", author: "rd_exam_prep", text: "Study with me for the RD exam!", webVideoUrl: "https://www.tiktok.com/@rd_exam_prep/video/735829306" },
        { id: "735829407", author: "dietetic_intern_life", text: "Day in the life in the ICU.", webVideoUrl: "https://www.tiktok.com/@dietetic_intern_life/video/735829407" },
        { id: "735829508", author: "nutrition_career_coach", text: "Is the CNS certification worth it?", webVideoUrl: "https://www.tiktok.com/@nutrition_career_coach/video/735829508" },
        // Construct URL for these
        { id: "735829609", author: "medical_student_tips", text: "Clinical rotations 101." },
        { id: "735829710", nickname: "specialty_nurse", text: "Travel nursing rates in 2024.", id_custom: "735829710" },
        { id: "735829811", authorMeta: { name: "healthcare_academy" }, text: "Enroll in our certification program today!", video_id: "735829811" },
        { id: "735829912", author: "nutrition_student_101", text: "Clinical nutrition textbook recommendations." },
        { id: "735830013", author: { uniqueId: "rdn_career_path" }, text: "Transitioning to private practice." }
    ];

    for (let i = 0; i < sampleMetadata.length; i++) {
        const raw = sampleMetadata[i] as any;
        
        // Use normalizeTikTokItem to ensure it matches the real pipeline
        const request = normalizeTikTokItem(raw);
        const bundle = processL2Request(request);

        // Standard Lifecycle Reporting
        const logEntry = {
            event: "signal_lifecycle_report",
            timestamp: new Date().toISOString(),
            signal_id: bundle.signal_id,
            correlation_id: bundle.correlation_id,
            structured_post: bundle.structured_post
        };

        fs.appendFileSync(logsPath, JSON.stringify(logEntry) + "\n");
        console.log(`[Test] Injected signal ${bundle.signal_id} with source URL: ${bundle.structured_post?.source?.source_url}`);
    }

    console.log("=== SOURCE VISIBILITY GATE TEST COMPLETE. ===");
}

runSourceVisibilityTest().catch(e => console.error(e));
