import * as fs from 'fs';
import * as path from 'path';
import { processL2Request } from './logic';
import { L2IngestRequest } from './types';
import { load_gime_v0_1 } from './lens/gime_mapping_loader';
import { refineIntent } from './ingestion/tiktok/intent_refinement';

async function runSyntheticScan() {
    load_gime_v0_1();
    
    const logsPath = path.resolve(__dirname, '..', 'l2_logs.txt');
    // Clear existing logs
    fs.writeFileSync(logsPath, '');

    console.log("=== STARTING CALIBRATED SYNTHETIC SCAN (50 SIGNALS) ===");

    const professionalTemplates = [
        "How do I become a registered dietitian in {state}? #rd2be #dietetics",
        "Clinical rotation day in the life! Today we are in the ICU. #dieteticintern #clinicalnutrition",
        "Is it worth it to get a MS in Clinical Nutrition? #nutritionstudent #rd2be",
        "What does it cost to enroll in the {program} certification? #nutritioncertification",
        "Spend the day with me as I study for my RD exam! #rdexam #dietitianstudent",
        "GRWM while I talk about my first job as a clinical dietitian. #rdcareer #dietitian",
        "7 non-bedside jobs for nurses that actually pay well! #nursecareer #nurselife",
        "How much does a traveling nurse make in 2024? #nursesalary #travelnurse",
        "My favorite continuing education units (CEU) for healthcare professionals. #ceu #professionaldevelopment",
        "Should I become a health coach or a nutritionist? #healthcoach #nutritionist",
        "Highest paying nursing specialties for {year}. #nursecareer #salarytips",
        "Tips for the Dietetic Internship (DI) match day! #dimatch #rd2be",
        "Working as a {specialty} nurse is so rewarding but stressful. #nurselife #healthcare",
        "How to transition from bedside nursing to clinical nutrition. #careertransition",
        "Is the {cert_name} certification worth the money? #careeradvice #nutrition"
    ];

    const states = ["California", "Texas", "New York", "Florida", "Illinois"];
    const programs = ["AIME Nutrition", "GIME Clinical", "NYS Health", "Precision Nut"];
    const specialties = ["ICU", "Pediatric", "Oncology", "Dialysis"];
    const certs = ["CNS", "RDN", "LDN", "CDCES"];

    for (let i = 1; i <= 50; i++) {
        const template = professionalTemplates[Math.floor(Math.random() * professionalTemplates.length)];
        const rawText = template
            .replace("{state}", states[Math.floor(Math.random() * states.length)])
            .replace("{program}", programs[Math.floor(Math.random() * programs.length)])
            .replace("{specialty}", specialties[Math.floor(Math.random() * specialties.length)])
            .replace("{cert_name}", certs[Math.floor(Math.random() * certs.length)])
            .replace("{year}", "2024");

        const signalId = `synth-tk-${Date.now()}-${i}`;
        const correlationId = `corr-synthetic-${i}`;

        // 1. Refine Intent (Simulate Discovery Stage)
        const intent = refineIntent(rawText, signalId);

        if (intent.category === 'excluded_low_intent') {
            console.log(`[Scan] Excluded low intent: ${rawText.substring(0, 30)}...`);
            continue;
        }

        const sample: L2IngestRequest = {
            correlation_id: correlationId,
            signal_id: signalId,
            source: "tiktok",
            raw_text: rawText,
            metadata: {
                author: "synthetic_user_" + i,
                source_url: `https://www.tiktok.com/@synthetic_user_${i}/video/${Date.now()}_${i}`
            }
        };

        // 2. Process
        const bundle = processL2Request(sample);


        // 3. Log to l2_logs.txt (Lifecycle Report format)
        const logEntry = {
            event: "signal_lifecycle_report",
            timestamp: new Date().toISOString(),
            signal_id: signalId,
            correlation_id: correlationId,
            lifecycle: {
                ingestion: { event: "signal_ingested", status: "ok", timestamp: new Date().toISOString() },
                classification: { 
                    event: "signal_classified", 
                    primary_category: bundle.structured_post?.classification.primary_category,
                    signal_type: bundle.structured_post?.classification.signal_type,
                    timestamp: new Date().toISOString() 
                },
                routing: { 
                    event: "governance_queue_routed", 
                    queue: bundle.structured_post?.governance_route.queue, 
                    timestamp: new Date().toISOString() 
                },
                structured_post: {
                    event: "structured_post_created",
                    status: "ok",
                    timestamp: new Date().toISOString(),
                    data: bundle.structured_post
                }
            }
        };

        fs.appendFileSync(logsPath, JSON.stringify(logEntry) + "\n");
        
        if (i % 10 === 0) console.log(`[Scan] Processed ${i}/50 signals...`);
    }

    console.log("=== SYNTHETIC SCAN COMPLETE. 50 SIGNALS INJECTED. ===");
}

runSyntheticScan().catch(e => console.error(e));
