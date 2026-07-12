// ──── PDF Report Generator ────
// Design system: consistent colors, fonts, spacing throughout

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const BOTTOM_MARGIN = 18;
const USABLE_W = PAGE_W - MARGIN * 2;

const COLORS = {
  primary:   [100, 70, 230],
  primaryLight: [180, 160, 240],
  secondary: [60, 150, 220],
  success:   [22, 163, 74],
  warning:   [234, 179, 8],
  danger:    [239, 68, 68],
  text:      [50, 50, 50],
  textMuted: [140, 140, 150],
  bgCard:    [248, 248, 253],
  bgStripe:  [249, 249, 253],
  border:    [220, 215, 235],
};

const FS = { h1: 20, h2: 14, h3: 11, body: 9, small: 7, micro: 6 };
const LH = { body: 5.5, small: 4, tight: 3.5, section: 8 };

function hexRgb(h) { const s = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h; return [parseInt(s.slice(1,3),16)||0, parseInt(s.slice(3,5),16)||0, parseInt(s.slice(5,7),16)||0]; }

function loadImg(src) { return new Promise(r => { const i = new Image(); i.crossOrigin='anonymous'; i.onload=()=>{ const c=document.createElement('canvas'); c.width=i.naturalWidth;c.height=i.naturalHeight; c.getContext('2d').drawImage(i,0,0); r(c.toDataURL('image/jpeg')); }; i.onerror=()=>r(null); i.src=src; }); }

function shortInst(name) {
  if (!name) return '-';
  const m = {
    'Indian Institute of Science':'IISc',
    'Indian Institute of Technology Bombay':'IIT Bombay',
    'Indian Institute of Technology Delhi':'IIT Delhi',
    'Indian Institute of Technology Madras':'IIT Madras',
    'Indian Institute of Technology Kanpur':'IIT Kanpur',
    'Indian Institute of Technology Kharagpur':'IIT Kharagpur',
    'Indian Institute of Technology Roorkee':'IIT Roorkee',
    'Indian Institute of Technology Guwahati':'IIT Guwahati',
    'Indian Institute of Technology Hyderabad':'IIT Hyderabad',
    'Indian Institute of Technology BHU':'IIT BHU',
    'Indian Institute of Technology Indore':'IIT Indore',
    'Indian Institute of Technology Mandi':'IIT Mandi',
    'Indian Institute of Technology Ropar':'IIT Ropar',
    'Indian Institute of Technology Patna':'IIT Patna',
    'Indian Institute of Technology Gandhinagar':'IIT Gandhinagar',
    'Indian Institute of Technology Jodhpur':'IIT Jodhpur',
    'Indian Institute of Technology Bhilai':'IIT Bhilai',
    'Indian Institute of Technology Goa':'IIT Goa',
    'Indian Institute of Technology Jammu':'IIT Jammu',
    'Indian Institute of Technology Dharwad':'IIT Dharwad',
    'Indian Institute of Technology Palakkad':'IIT Palakkad',
    'Indian Institute of Technology Tirupati':'IIT Tirupati',
    'Indian Institute of Technology Bhubaneswar':'IIT Bhubaneswar',
    'Indian Institute of Technology Dhanbad':'IIT Dhanbad',
  };
  if (m[name]) return m[name];
  return name.replace('Indian Institute of Technology ','IIT ').replace('National Institute of Technology ','NIT ').replace('Indian Institute of Information Technology ','IIIT ').replace('Sardar Vallabhbhai ','').replace('Dr. B R Ambedkar ','');
}

function shortProg(name, max) {
  if (!name) return '-';
  let s = name.replace('Computer Science & Engineering','CSE').replace('Computer Science and Engineering','CSE').replace('Artificial Intelligence','AI').replace('Machine Learning','ML').replace('Data Science','DS').replace('and ','& ').replace('Information Technology','IT').replace('VLSI Design','VLSI').replace('Signal Processing','Signal Proc.').replace('Electrical Engineering','EE').replace('Mechanical Engineering','ME').replace('Communication Engineering','Comm.').replace('Microelectronics','Microelect.').replace('Nanotechnology','Nanotech').replace('Computational','Comp.').replace('Cyber Security','CyberSec').replace('Design & Manufacturing','Dsn&Mfg').replace('Design and','Dsn &');
  if (max && s.length > max) s = s.substring(0, max - 2);
  return s;
}

function fmt(v, u) {
  if (v == null || v === '') return '--';
  if (u === 'L') return 'Rs' + (typeof v === 'number' ? (v/100000).toFixed(1) : v) + 'L';
  if (u === 'LPA') return 'Rs' + v + 'L';
  if (u === 'pct') return v + '%';
  return String(v);
}

async function generatePredictionReport({ result, compareList, choiceOrder, predId, candName }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const opps = result?.opportunities || [];
  let y = MARGIN;
  let pageNum = 1;

  const logos = await Promise.all([loadImg('/icons/APP ICON.jpeg'), loadImg('/icons/WORDMARK.jpeg')]);
  const appIcon = logos[0];
  const wordmark = logos[1];

  // ──── Page helpers ────
  function water() {
    if (!appIcon) return;
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.03 }));
    doc.addImage(appIcon, 'JPEG', 105 - 28, 148.5 - 28, 56, 56);
    doc.restoreGraphicsState();
  }

  function newPage() {
    doc.addPage(); pageNum++; y = MARGIN + 8;
    water();
  }

  function ensure(h) { if (y + h > PAGE_H - BOTTOM_MARGIN) newPage(); }

  function lineY() { doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.2); doc.line(MARGIN, y, PAGE_W - MARGIN, y); }

  function secHdr(title) {
    ensure(20);
    doc.setFontSize(FS.h2); doc.setTextColor(...COLORS.primary); doc.text(title, MARGIN, y); y += LH.section;
    lineY(); y += 5;
  }

  function txt(str, x, sz, clr) {
    doc.setFontSize(sz||FS.body);
    const c = clr || COLORS.text;
    doc.setTextColor(c[0], c[1], c[2]);
    doc.text(String(str), x||MARGIN, y);
  }

  function rr(x, w, str, sz, clr, align) {
    doc.setFontSize(sz || FS.body);
    const c = clr || COLORS.text;
    doc.setTextColor(c[0], c[1], c[2]);
    const tw = doc.getTextWidth(String(str));
    if (align === 'right') doc.text(String(str), x + w - tw, y);
    else if (align === 'center') doc.text(String(str), x + (w - tw) / 2, y);
    else doc.text(String(str), x, y);
  }

  // ═══════════ COVER PAGE ═══════════
  doc.setFillColor(12, 6, 36); doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  water();

  if (appIcon) { doc.addImage(appIcon, 'JPEG', 105 - 13, 25, 26, 26); }
  else { doc.setFontSize(30); doc.setTextColor(139,92,246); doc.text('N', 105, 44, { align:'center' }); }

  doc.setFontSize(22); doc.setTextColor(255,255,255); doc.text('GateNexa AI', 105, 62, { align:'center' });
  doc.setFontSize(12); doc.setTextColor(180,160,240); doc.text('M.Tech Admission Report', 105, 74, { align:'center' });

  y = 85;
  doc.setDrawColor(...COLORS.primary); doc.setLineWidth(0.5); doc.line(45, y, 165, y); y += 9;

  const airStr = result.airRange ? `${result.airRange.best}'-'${result.airRange.worst}` : 'N/A';
  doc.setFillColor(20,13,50); doc.setDrawColor(90,70,190);
  doc.roundedRect(30, y, 150, 38, 4, 4, 'FD');
  let iy = y + 9;
  doc.setFontSize(11); doc.setTextColor(225,225,240);
  doc.text(`Candidate: ${candName}`, 48, iy);
  doc.setFontSize(10); doc.setTextColor(200,200,230);
  doc.text(`Score: ${result.predictedScore||'N/A'}   AIR: ${airStr}   Confidence: ${result.confidenceScore||'N/A'}%`, 48, iy+8);
  doc.setFontSize(7); doc.setTextColor(160,140,210);
  doc.text(`Qualified: ${result.isQualified?'YES':'NO'}  |  ${result.databaseCoverage||opps.length||'N/A'} Programmes  |  Category: General`, 48, iy+17);
  y += 46;

  doc.setDrawColor(...COLORS.primary); doc.setLineWidth(0.5); doc.line(45, y, 165, y); y += 8;
  doc.setFontSize(8); doc.setTextColor(140,120,200);
  doc.text('Database: CCMT 2025', 105, y, { align:'center' }); y += 4;
  doc.text('Prediction ID: GTX-26-' + predId, 105, y, { align:'center' }); y += 4;
  doc.text('Generated by GateNexa AI v2.0', 105, y, { align:'center' });
  doc.setFontSize(6); doc.setTextColor(100,80,160);
  doc.text('CONFIDENTIAL', 105, 285, { align:'center' });

  // ═══════════ PAGE 2+ ═══════════
  newPage();

  // ──── EXECUTIVE SUMMARY ────
  secHdr('Executive Summary');
  const air = result.airRange ? `${result.airRange.best}'-'${result.airRange.worst}` : 'N/A';
  let aP = ''; if (result.airRange?.average) { const p = Math.max(0,Math.min(99.99,100-(result.airRange.average/150000)*100)); aP = ` (Top ${p.toFixed(1)}%)`; }
  txt(`Score ${result.predictedScore||'N/A'}  |  AIR ${air}${aP}  |  Qualified: ${result.isQualified?'YES':'NO'}  |  Confidence: ${result.confidenceScore||'N/A'}%`, MARGIN, FS.body, COLORS.text); y += LH.body + 1;
  const dI = opps.filter(o=>o.collegeType==='IIT').length, dN = opps.filter(o=>o.collegeType==='NIT').length, dS = opps.filter(o=>o.probability>=70).length;
  txt(`${dI} IIT  |  ${dN} NIT  |  ${dS} Safe (>=70%)  |  ${opps.length} Total`, MARGIN+2, FS.small, COLORS.textMuted); y += LH.small + 3;

  // ──── KPI ROW ────
  secHdr('Profile');
  const kpi = [
    { l:'Score', v:String(result.predictedScore||'N/A') },
    { l:'AIR Range', v:air+(aP||'') },
    { l:'Qualified', v:result.isQualified?'YES':'NO' },
    { l:'Confidence', v:String(result.confidenceScore||'N/A')+'%' },
    { l:'Programmes', v:String(opps.length) },
  ];
  const kpiW = Math.floor(USABLE_W / kpi.length) - 2;
  ensure(18);
  kpi.forEach((k,i) => {
    const cx = MARGIN + i*(kpiW+2);
    doc.setFillColor(...COLORS.bgCard); doc.setDrawColor(...COLORS.border);
    doc.roundedRect(cx, y, kpiW, 15, 3, 3, 'FD');
    rr(cx, kpiW, String(k.v).substring(0, 14), 10, COLORS.primary, 'center');
    doc.setFontSize(7); doc.setTextColor(...COLORS.textMuted);
    doc.text(k.l, cx + kpiW/2, y + 13, { align: 'center' });
  });
  y += 20;

  // ──── CONFIDENCE ────
  secHdr('Confidence Analysis');
  const hasSeat = opps.some(o=>o.seats!=null&&o.seats>0);
  const hasTrends = (result.airRange?.uncertaintyPct||100)<60;
  const cRows = [
    ['Historical Cutoffs','Yes - Available'],
    ['Seat Matrix',hasSeat?'Yes - Partial':'No  - Not Available'],
    ['Multi-Year Trends',hasTrends?'Yes - Available':'No  - In Progress'],
    ['Category Matching','Yes - Complete'],
    ['Score vs Cutoff',result.isQualified?'Yes - Available':'No  - Below Cutoff'],
  ];
  doc.setFontSize(FS.small); doc.setTextColor(...COLORS.text);
  cRows.forEach((r,i) => {
    const cx = MARGIN + (i%2===0?0:92);
    doc.text(`${r[0].padEnd(18,' ')} ${r[1]}`, cx, y + Math.floor(i/2)*5);
  });
  y += 11;
  if (result.airRange?.uncertaintyPct!==undefined) { txt(`Uncertainty: ${Math.round(result.airRange.uncertaintyPct)}%`, MARGIN, FS.micro, COLORS.textMuted); y += LH.tight; }

  // ──── ELIGIBILITY ────
  secHdr('Eligibility Summary');
  const pBands = [
    { l:'Safe', c:opps.filter(o=>o.probability>=85).length, clr:'#16A34A' },
    { l:'High', c:opps.filter(o=>{const p=o.probability||0;return p>=65&&p<85;}).length, clr:'#3B82F6' },
    { l:'Moderate', c:opps.filter(o=>{const p=o.probability||0;return p>=35&&p<65;}).length, clr:'#EAB308' },
    { l:'Ambitious', c:opps.filter(o=>{const p=o.probability||0;return p>=15&&p<35;}).length, clr:'#F97316' },
    { l:'Dream', c:opps.filter(o=>{const p=o.probability||0;return p<15;}).length, clr:'#EF4444' },
  ];
  let mx = MARGIN;
  pBands.forEach(b => {
    const rgb = hexRgb(b.clr);
    doc.setFillColor(250, 250, 255); doc.setDrawColor(rgb[0],rgb[1],rgb[2]);
    doc.roundedRect(mx, y-1, 35, 7, 3, 3, 'FD');
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.06 }));
    doc.setFillColor(rgb[0],rgb[1],rgb[2]);
    doc.roundedRect(mx, y-1, 35, 7, 3, 3, 'F');
    doc.restoreGraphicsState();
    doc.setFontSize(FS.small); doc.setTextColor(rgb[0],rgb[1],rgb[2]);
    doc.text(`${b.l}  ${b.c}`, mx+5, y+4);
    mx += 37;
  });
  y += 10;
  const types = {}; opps.forEach(o=>{ types[o.collegeType]=(types[o.collegeType]||0)+1; });
  const tStr = Object.entries(types).map(([t,c])=>`${t}: ${c}`).join('  |  ');
  txt(tStr, MARGIN, FS.small, COLORS.textMuted); y += LH.tight;

  // ──── RECOMMENDATIONS TABLE ────
  secHdr('Top Recommendations');
  const BLK = { dream_elite:0, high_chance_iit:1, safe_nit:2, backup:3 };
  const srt = [...opps].sort((a,b)=>{ const pa=BLK[a.collegeBlock]??99,pb=BLK[b.collegeBlock]??99; if(pa!==pb)return pa-pb; return (b.probability||0)-(a.probability||0); });

  // Column widths: rank(6) inst(54) prog(46) adm(14) cutoff(12) fees(16) pkg(16) = 164 total, fits in 182
  const cW = [8, 54, 46, 14, 13, 18, 18];
  const cH = ['#','Institute','Program','Adm','Cutoff','Fees','Pkg'];
  let cx = MARGIN;
  ensure(10);
  doc.setFontSize(FS.small); doc.setTextColor(...COLORS.primary);
  cH.forEach((h,i) => { doc.text(h, cx, y); cx += cW[i]; });
  y += 4; lineY(); y += 3;

  function tableRow(item, rank, clr) {
    ensure(8); if (y+7 > PAGE_H - BOTTOM_MARGIN) { newPage(); y += 2;
      cx=MARGIN; doc.setFontSize(FS.small); doc.setTextColor(...COLORS.primary);
      cH.forEach((h,i)=>{ doc.text(h,cx,y); cx+=cW[i]; }); y+=4; lineY(); y+=3;
    }
    const rgb = hexRgb(clr);
    if (rank%2===0) { doc.setFillColor(...COLORS.bgStripe); doc.rect(MARGIN, y-1, USABLE_W, 6, 'F'); }
    let X = MARGIN;
    rr(X, cW[0], String(rank), FS.small, rgb, 'right'); X += cW[0];
    rr(X, cW[1], shortInst(item.college||'-'), FS.small, COLORS.text); X += cW[1];
    rr(X, cW[2], shortProg(item.program||'', 30), FS.micro, COLORS.textMuted); X += cW[2];
    rr(X, cW[3], (item.probability||0)+'%', FS.small, rgb, 'right'); X += cW[3];
    rr(X, cW[4], item.closingScore?String(item.closingScore):'--', FS.micro, COLORS.textMuted, 'right'); X += cW[4];
    rr(X, cW[5], fmt(item.fees,'L'), FS.micro, COLORS.textMuted, 'right'); X += cW[5];
    rr(X, cW[6], fmt(item.avgPlacement,'LPA'), FS.micro, COLORS.textMuted, 'right');
    y += 6;
  }

  const iits = srt.filter(o=>o.collegeType==='IIT');
  const nits = srt.filter(o=>o.collegeType!=='IIT');

  if (iits.length>0) {
    ensure(8); doc.setFontSize(FS.h3); doc.setTextColor(...COLORS.primary);
    doc.text(`IIT Programmes  (${iits.length})`, MARGIN, y); y += 7;
    iits.slice(0,25).forEach((o,i)=>tableRow(o,i+1,'#8B5CF6'));
    if (iits.length>25) { txt(`+ ${iits.length-25} more IIT programmes in CSV`, MARGIN, FS.micro, COLORS.textMuted); y += LH.tight; }
    y += 2;
  }

  if (nits.length>0) {
    ensure(8); doc.setFontSize(FS.h3); doc.setTextColor(...COLORS.secondary);
    doc.text(`NIT / IIIT / GFTI Programmes  (${nits.length})`, MARGIN, y); y += 7;
    nits.slice(0,10).forEach((o,i)=>tableRow(o,i+1,'#3C96DC'));
    if (nits.length>10) { txt(`+ ${nits.length-10} more programmes in CSV`, MARGIN, FS.micro, COLORS.textMuted); y += LH.tight; }
  }

  y += 2; txt(`Export CSV for all ${opps.length} programmes with full details.`, MARGIN, FS.micro, COLORS.textMuted); y += LH.tight;

  // ──── COMPARISON ────
  if (compareList && compareList.length>=2) {
    secHdr('College Comparison');
    const cm = compareList.slice(0,5);
    const ccW = [50,16,14,12,16,14,12];
    const ccH = ['College','Avg Pkg','High','Place%','Fees','ROI','Rating'];
    let cx2 = MARGIN; doc.setFontSize(FS.small); doc.setTextColor(...COLORS.primary);
    ccH.forEach((h,i)=>{ doc.text(h,cx2,y); cx2+=ccW[i]; }); y+=4; lineY(); y+=3;
    cm.forEach(o=>{
      ensure(7);
      let X2 = MARGIN;
      [shortInst(o.college||'-'), fmt(o.avgPlacement,'LPA'), fmt(o.highestPlacement,'LPA'), o.placementPercentage?o.placementPercentage+'%':'--', fmt(o.fees,'L'), o.roiScore||'--', o.academicsRating||'--'].forEach((v,j)=>{ doc.setFontSize(FS.micro); doc.setTextColor(...COLORS.text); doc.text(String(v),X2,y); X2+=ccW[j]; });
      y+=5;
    });
  }

  // ──── CHOICE ORDER ────
  if (choiceOrder && choiceOrder.length>0) {
    secHdr('CCMT Choice Order (Top 20)');
    const co = choiceOrder.slice(0,20);
    const coW = [6,50,32,12,11,12,14,12];
    const coH = ['#','College','Program','Chance','Cutoff','Place','Fees','Type'];
    let cx3 = MARGIN; doc.setFontSize(FS.small); doc.setTextColor(...COLORS.primary);
    coH.forEach((h,i)=>{ doc.text(h,cx3,y); cx3+=coW[i]; }); y+=4; lineY(); y+=3;
    co.forEach((o,i)=>{
      ensure(7);
      let X3 = MARGIN;
      [String(o.rank||i+1),shortInst(o.college||'-'),shortProg(o.program||'',16),o.probability?o.probability+'%':'--',String(o.closingScore||'--'),fmt(o.avgPlacement,'LPA'),fmt(o.fees,'L'),o.collegeType||'--'].forEach((v,j)=>{ doc.setFontSize(FS.micro); doc.setTextColor(...COLORS.text); doc.text(String(v),X3,y); X3+=coW[j]; });
      y+=5;
    });
  }

  // ──── COUNSELLING STRATEGY ────
  secHdr('Counselling Strategy');
  const ii = opps.filter(o=>o.collegeType==='IIT').length;
  const ni = opps.filter(o=>o.collegeType==='NIT').length;
  const ii2 = opps.filter(o=>o.collegeType==='IIIT').length;
  const gi = opps.filter(o=>o.collegeType==='GFTI').length;
  const sc = opps.filter(o=>(o.probability||0)>=80).length;
  const tc = opps.filter(o=>{const p=o.probability||0;return p>=60&&p<80;}).length;
  const dc = opps.filter(o=>(o.probability||0)<40).length;

  txt(`Safe (>=80%): ${sc}   |   Target (60-79%): ${tc}   |   Dream (<40%): ${dc}`, MARGIN, FS.body, COLORS.text); y += LH.body + 2;
  txt('Suggested Choice Filling:', MARGIN, FS.body, COLORS.text); y += LH.body;

  const strategy = [
    { l:'Dream IITs', c:Math.min(ii,10), d:'Top-tier -- aspirational' },
    { l:'Strong IITs', c:Math.max(0,Math.min(ii-10,10)), d:'Mid-tier -- achievable' },
    { l:'Tier-1 NITs', c:Math.min(ni,10), d:'Top NITs -- solid options' },
    { l:'Safe NITs', c:Math.max(0,Math.min(ni-10,10)), d:'Reliable backup' },
    { l:'IIITs & GFTIs', c:Math.min(ii2+gi,10), d:'Specialized institutes' },
  ].filter(r=>r.c>0);

  let start = 1;
  strategy.forEach(r => {
    ensure(6);
    const end = start + r.c - 1;
    const rangeStr = start === end ? String(start) : `${start}'-'${end}`;
    doc.setFontSize(FS.small); doc.setTextColor(...COLORS.primary);
    doc.text(`${rangeStr}.  ${r.l}`, MARGIN, y); y += LH.tight;
    doc.setFontSize(FS.micro); doc.setTextColor(...COLORS.textMuted);
    doc.text(`     ${r.d}`, MARGIN, y); y += LH.tight + 1;
    start += r.c;
  });

  y += 3;
  txt(`Total recommended: ${Math.min(sc+tc+dc,100)}+ programmes. Verify with official CCMT/COAP guidelines.`, MARGIN, FS.micro, COLORS.textMuted); y += LH.tight;

  // ──── FOOTER ────
  ensure(12);
  lineY(); y += 4;
  doc.setFontSize(FS.micro); doc.setTextColor(...COLORS.textMuted);
  doc.text(`GateNexa AI  |  Pred ID: GTX-26-${predId}  |  Database: CCMT 2025 (${result.databaseCoverage||opps.length} programmes)  |  gateenexa.vercel.app`, MARGIN, y);

  // ──── WATERMARK ALL PAGES ────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    water();
  }

  doc.save('GateNexa-Admission-Report.pdf');
}

export { generatePredictionReport };
