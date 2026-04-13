const fs = require('fs');
const content = fs.readFileSync('e:\\aime-demo\\l2_logs.txt', 'utf16le');
if (content.toLowerCase().includes('gimacademy')) {
    console.log('gimacademy FOUND in utf16le');
} else {
    // maybe it is in utf8? test that again.
    const content8 = fs.readFileSync('e:\\aime-demo\\l2_logs.txt', 'utf8');
    if (content8.toLowerCase().includes('gimacademy')) console.log('gimacademy FOUND in utf8');
    else console.log('gimacademy NOT FOUND AT ALL');
}
