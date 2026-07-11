const fs = require('fs');
const content = fs.readFileSync('C:/Users/purru/OneDrive/gate2027/frontend/src/components/predictor/PredictionReportModal.jsx', 'utf8');
let parenLvl = 0, brackLvl = 0, braceLvl = 0;
let inStr = null;
for (let i = 0; i < content.length; i++) {
  const ch = content[i];
  const prev = i > 0 ? content[i-1] : '';
  if (inStr) {
    if (ch === '\\' && prev === '\\') {}
    else if (ch === inStr && prev !== '\\') inStr = null;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
  if (ch === '(') parenLvl++;
  if (ch === ')') parenLvl--;
  if (ch === '[') brackLvl++;
  if (ch === ']') brackLvl--;
  if (ch === '{') braceLvl++;
  if (ch === '}') braceLvl--;
}
console.log('paren=' + parenLvl + ' brack=' + brackLvl + ' brace=' + braceLvl);

// Report lines with issues
if (braceLvl !== 0) {
  const lines = content.split('\n');
  let ln = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '{') ln++;
      if (line[j] === '}') ln--;
    }
  }
}
