// src/utils/exportUtils.js – PDF report, CSV & Excel export
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { computePyqStats, computeReadinessScore, computeCompletionForecast, predictAIR } from './gateUtils';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCsv(payload) {
  const rows = [];
  const bom = '\uFEFF';

  rows.push(['Section', 'Title', 'Subject', 'Status', 'Extra']);
  payload.topics.forEach((t) => {
    rows.push(['Topic', t.name, t.subject, t.done ? 'Completed' : 'Pending', '']);
  });
  payload.notes.forEach((n) => {
    rows.push(['Note', n.title, n.subject, 'Saved', n.date || '']);
  });
  payload.pyqs.forEach((p) => {
    const status = p.solved ? 'Solved' : p.revisionNeeded ? 'Revision Needed' : 'Unsolved';
    rows.push(['PYQ', p.title, p.subject, status, `GATE ${p.year} · ${p.difficulty}${p.bookmarked ? ' · ★' : ''}`]);
  });
  payload.mocks.forEach((m) => {
    rows.push(['Mock Test', m.name, '', `Score: ${m.score}`, `Rank: ${m.rank ?? 'N/A'} · ${m.date}`]);
  });

  const csv = bom + rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `gate2027-export-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function exportToExcel(payload) {
  const wb = XLSX.utils.book_new();

  const summary = [
    ['GATE 2027 Progress Report'],
    ['Student', payload.user?.name || 'Student'],
    ['Email', payload.user?.email || '—'],
    ['Exported', new Date().toLocaleString('en-IN')],
    [],
    ['Metric', 'Value'],
    ['Topics Completed', `${payload.topics.filter((t) => t.done).length} / ${payload.topics.length}`],
    ['PYQs Solved', `${payload.pyqs.filter((p) => p.solved).length} / ${payload.pyqs.length}`],
    ['Mock Tests', payload.mocks.length],
    ['Study Hours (Week)', payload.studyStats?.weekHours ?? 0],
    ['Streak', `${payload.studyStats?.streak?.current ?? 0} days`],
    ['XP / Level', `${payload.gamification?.xp ?? 0} / Lv.${payload.gamification?.level ?? 1}`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

  const topicRows = [['Topic', 'Subject', 'Status']];
  payload.topics.forEach((t) => topicRows.push([t.name, t.subject, t.done ? 'Completed' : 'Pending']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topicRows), 'Topics');

  const pyqRows = [['Title', 'Subject', 'Year', 'Difficulty', 'Solved', 'Bookmarked', 'Revision Needed']];
  payload.pyqs.forEach((p) => pyqRows.push([p.title, p.subject, p.year, p.difficulty, p.solved ? 'Yes' : 'No', p.bookmarked ? 'Yes' : 'No', p.revisionNeeded ? 'Yes' : 'No']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pyqRows), 'PYQs');

  const mockRows = [['Name', 'Date', 'Score', 'Rank', 'Notes']];
  payload.mocks.forEach((m) => mockRows.push([m.name, m.date, m.score, m.rank ?? '', m.notes ?? '']));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mockRows), 'Mock Tests');

  const subjectRows = [['Subject', 'Progress %']];
  (payload.studyStats?.subjects || []).forEach((s) => subjectRows.push([s.name, s.progress]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(subjectRows), 'Subjects');

  XLSX.writeFile(wb, `gate2027-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function generateProgressPdf(payload) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  let y = margin;

  const addLine = (text, size = 10, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, 174);
    lines.forEach((line) => {
      if (y > 275) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += size * 0.45;
    });
    y += 2;
  };

  doc.setFillColor(79, 141, 255);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('GATE 2027 Progress Report', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, 22);

  y = 36;
  addLine(`Student: ${payload.user?.name || 'Student'}`, 11, true);
  addLine(`Email: ${payload.user?.email || '—'}`, 9);

  const stats = payload.studyStats || {};
  const topicDone = payload.topics.filter((t) => t.done).length;
  const pyqSolved = payload.pyqs.filter((p) => p.solved).length;
  const mockScores = payload.mocks.map((m) => m.score);
  const bestMock = mockScores.length ? Math.max(...mockScores) : 0;
  const avgMock = mockScores.length ? (mockScores.reduce((a, b) => a + b, 0) / mockScores.length).toFixed(1) : 0;
  const overallSubject = stats.subjects?.length
    ? Math.round(stats.subjects.reduce((s, x) => s + x.progress, 0) / stats.subjects.length)
    : 0;
  const readiness = computeReadinessScore(payload.topics, payload.pyqs, payload.mocks, payload.gateFeatures?.streak);
  const forecast = computeCompletionForecast(payload.topics, payload.gateFeatures);
  const air = predictAIR(bestMock);

  y += 4;
  addLine('Summary', 12, true, [79, 141, 255]);
  addLine(`Overall Subject Progress: ${overallSubject}%`);
  addLine(`Readiness Score: ${readiness}/100`);
  addLine(`Topics Completed: ${topicDone} / ${payload.topics.length}`);
  addLine(`PYQs Solved: ${pyqSolved} / ${payload.pyqs.length}`);
  addLine(`Study Hours (Today): ${stats.todayHours ?? 0}h · This Week: ${stats.weekHours ?? 0}h`);
  addLine(`Streak: ${stats.streak?.current ?? 0} days (Best: ${stats.streak?.longest ?? 0})`);
  addLine(`Mock Tests: ${payload.mocks.length} · Best: ${bestMock} · Avg: ${avgMock}`);
  addLine(`Predicted AIR: ~${air.air.toLocaleString('en-IN')} (${air.percentile} percentile)`);
  addLine(`Completion Forecast: ${forecast.remaining} topics left · ETA ${forecast.forecastDate}`);

  y += 4;
  addLine('Subject-wise Progress', 12, true, [79, 141, 255]);
  (stats.subjects || []).forEach((s) => {
    addLine(`${s.icon || ''} ${s.name}: ${s.progress}%`);
    if (y > 270) { doc.addPage(); y = margin; }
    const barX = margin;
    const barW = 174;
    const barH = 4;
    doc.setFillColor(30, 30, 40);
    doc.roundedRect(barX, y, barW, barH, 2, 2, 'F');
    const fillW = Math.max(0, (s.progress / 100) * barW);
    if (fillW > 0) {
      doc.setFillColor(79, 141, 255);
      doc.roundedRect(barX, y, fillW, barH, 2, 2, 'F');
    }
    y += barH + 4;
  });

  y += 4;
  addLine('Recent Mock Scores', 12, true, [79, 141, 255]);
  const recentMocks = payload.mocks.slice(-5);
  if (recentMocks.length > 0) {
    const chartX = margin;
    const chartW = 174;
    const chartH = 36;
    const barGap = 4;
    const barW = Math.max(8, (chartW - barGap * (recentMocks.length - 1)) / recentMocks.length);
    const maxScore = Math.max(...recentMocks.map((m) => m.score), 100);
    doc.setFillColor(20, 22, 35);
    doc.roundedRect(chartX, y, chartW, chartH, 3, 3, 'F');
    recentMocks.forEach((m, i) => {
      const bx = chartX + i * (barW + barGap);
      const bh = Math.max(2, (m.score / maxScore) * (chartH - 10));
      const by = y + chartH - 4 - bh;
      const hue = m.score >= 70 ? [34, 211, 238] : m.score >= 40 ? [251, 191, 36] : [244, 114, 182];
      doc.setFillColor(...hue);
      doc.roundedRect(bx, by, barW, bh, 1.5, 1.5, 'F');
      doc.setFontSize(6);
      doc.setTextColor(180);
      doc.text(String(m.score), bx + barW / 2, y + chartH - 1, { align: 'center' });
    });
    y += chartH + 4;
  }
  recentMocks.forEach((m) => {
    addLine(`${m.name} — ${m.score} marks (${m.date})`);
  });

  if (payload.gamification?.badges?.length) {
    y += 4;
    addLine('Achievements', 12, true, [79, 141, 255]);
    addLine(`Badges: ${payload.gamification.badges.join(', ')}`);
    addLine(`XP: ${payload.gamification.xp} · Level ${payload.gamification.level}`);
  }

  doc.save(`gate2027-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateDetailedReport(payload) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  let y = margin;
  let page = 1;

  const addLine = (text, size = 10, bold = false, color = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, 174);
    lines.forEach((line) => {
      if (y > 275) { doc.addPage(); page++; y = margin; doc.setFontSize(8); doc.setTextColor(150); doc.text(`Page ${page}`, 180, 290); }
      doc.text(line, margin, y);
      y += size * 0.45;
    });
    y += 2;
  };

  doc.setFillColor(79, 141, 255);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Performance Report', margin, 16);
  doc.setFontSize(9);
  doc.text(`GATE CSE 2027 · ${new Date().toLocaleDateString('en-IN')}`, margin, 26);

  y = 40;
  const pyqStats = computePyqStats(payload.pyqs);
  const readiness = computeReadinessScore(payload.topics, payload.pyqs, payload.mocks, payload.gateFeatures?.streak);

  addLine('Performance Overview', 14, true, [79, 141, 255]);
  addLine(`Readiness Score: ${readiness}/100`);
  addLine(`Weekly Study Hours: ${payload.studyStats?.weekHours ?? 0}h`);
  addLine(`XP Earned: ${payload.gamification?.xp ?? 0} (Level ${payload.gamification?.level ?? 1})`);

  addLine('PYQ Analysis', 14, true, [79, 141, 255]);
  addLine(`Total: ${pyqStats.total} · Solved: ${pyqStats.solved} · Bookmarked: ${pyqStats.bookmarked}`);
  addLine(`Revision Needed: ${pyqStats.revisionNeeded} · Marked Difficult: ${pyqStats.difficult}`);
  Object.entries(pyqStats.bySubject).forEach(([sub, s]) => {
    addLine(`${sub}: ${s.solved}/${s.total} solved (${Math.round((s.solved / s.total) * 100)}%)`);
  });

  addLine('Topic Breakdown', 14, true, [79, 141, 255]);
  const bySubject = {};
  payload.topics.forEach((t) => {
    if (!bySubject[t.subject]) bySubject[t.subject] = { done: 0, total: 0 };
    bySubject[t.subject].total++;
    if (t.done) bySubject[t.subject].done++;
  });
  Object.entries(bySubject).forEach(([sub, s]) => {
    addLine(`${sub}: ${s.done}/${s.total} completed`);
  });

  addLine('Mock Test History', 14, true, [79, 141, 255]);
  payload.mocks.forEach((m) => {
    const air = predictAIR(m.score);
    addLine(`${m.name} (${m.date}): ${m.score} marks · Rank ${m.rank ?? 'N/A'} · AIR ~${air.air.toLocaleString('en-IN')}`);
    if (m.notes) addLine(`  Notes: ${m.notes}`, 9);
  });

  if (payload.revisionSchedule?.length) {
    addLine('Revision Schedule', 14, true, [79, 141, 255]);
    payload.revisionSchedule.forEach((r) => {
      addLine(`${r.topicName} (${r.subject}) — Due: ${r.dueDate} [${r.status}]`);
    });
  }

  doc.save(`gate2027-detailed-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
