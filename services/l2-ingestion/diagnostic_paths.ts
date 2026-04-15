import { classifySignal } from './src/classification/signal_classifier';
import * as path from 'path';

console.log("CWD:", process.cwd());
console.log("Config Path expected by classifier:", path.resolve(process.cwd(), 'config', 'classification', 'question_category_mapping.json'));

const testSignal = "What is intermittent fasting?";
const result = classifySignal(testSignal);

console.log("\nSignal:", testSignal);
console.log("Result:", JSON.stringify(result, null, 2));
