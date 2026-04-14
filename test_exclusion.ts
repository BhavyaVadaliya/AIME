import { isInternalAccount } from './services/l2-ingestion/src/ingestion/tiktok/internal_exclusion';

const testCases = [
    { name: 'Internal Account (Username)', author: '@gimacademy', expected: true },
    { name: 'Internal Account (Short Username)', author: 'gimacademy', expected: true },
    { name: 'Internal Account (User ID)', author: { id: '1234567890' }, expected: true },
    { name: 'External Account (Username)', author: '@fitness_expert', expected: false },
    { name: 'External Account (Object)', author: { uniqueId: 'random_user', id: '9999' }, expected: false }
];

console.log("--- Internal Exclusion Logic Test ---");
testCases.forEach(tc => {
    const result = isInternalAccount(tc.author);
    const pass = result === tc.expected;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${tc.name}: result=${result}`);
});
