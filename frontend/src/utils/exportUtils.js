// src/utils/exportUtils.js – CSV & Excel export
import * as XLSX from 'xlsx';

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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gate2027-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
