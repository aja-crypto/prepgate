const fs = require('fs');
const path = require('path');

const index = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/resource-index.json'), 'utf8'));

// Filter out placeholder stubs (size < 1KB)
const real = index.filter(r => r.size >= 1024);

// Generate the embedded array as a JS constant
const lines = real.map(r => {
  const obj = {
    id: r.id,
    title: r.title,
    subject: r.subject,
    folder: r.folder || '',
    topic: r.topic,
    filePath: r.filePath,
    type: r.type,
    size: r.size,
    updatedAt: r.updatedAt,
  };
  return '  ' + JSON.stringify(obj);
});

const output = `const EMBEDDED_RESOURCES = [\n${lines.join(',\n')}\n];\n`;

fs.writeFileSync(path.join(__dirname, '../src/services/embeddedResources.js'), output);
console.log(`Generated EMBEDDED_RESOURCES with ${real.length} entries (filtered ${index.length - real.length} stubs)`);
console.log(`Output: backend/src/services/embeddedResources.js`);
