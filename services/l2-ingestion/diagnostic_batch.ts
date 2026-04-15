import { classifySignal } from './src/classification/signal_classifier';
const signals = [
    "What is intermittent fasting?",
    "Become a certified nutritionist today",
    "How much does it cost?",
    "Daily wellness routine tips",
    "Random text with no keywords"
];

signals.forEach(s => {
    console.log(`[${s}] -> ${classifySignal(s).primary_category}`);
});
