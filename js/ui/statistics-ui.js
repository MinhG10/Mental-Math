import { summarizeHistory } from '../services/statistics-service.js';
import { formatDate, formatDuration, formatPercent } from '../utils/format-utils.js';
import { byId, element, fillOptions } from './dom.js';
import { renderMetrics } from './metrics-ui.js';
import { chartCard } from './chart-ui.js';

export function setupStatistics(registry, onFilter) {
  const filter = byId('stats-filter');
  fillOptions(filter, [['', 'Tất cả Level'], ...registry.list().map(level => [level.id, `Level ${level.id}`])]);
  filter.addEventListener('change', onFilter);
}

export function renderStatistics(sessions, registry, levelLabel) {
  const filter = byId('stats-filter').value;
  const filtered = filter ? sessions.filter(session => session.levelId === filter) : sessions;
  const totals = summarizeHistory(filtered);
  const metrics = element('div', 'metrics');
  renderMetrics(metrics, [
    ['Phiên đã lưu', totals.sessions], ['Đã làm', totals.total], ['Đúng', totals.correct, 'correct'],
    ['Sai', totals.incorrect, 'incorrect'], ['Bỏ qua', totals.skipped], ['Hết giờ', totals.timeout, 'timeout'],
    ['Chính xác', formatPercent(totals.accuracy)], ['TB trả lời', formatDuration(totals.averageMs)], ['Chuỗi tốt nhất', totals.bestStreak],
  ]);
  const chronological = [...filtered].reverse();
  const points = key => chronological.map((session, index) => ({
    label: formatDate(session.startedAt), axisLabel: `Phiên ${index + 1}`, value: session.stats[key],
  }));
  const ids = filter ? [filter] : [...new Set([...registry.list().map(level => level.id), ...filtered.map(session => session.levelId)])];
  const byLevel = ids.map(id => ({ id, ...summarizeHistory(filtered.filter(session => session.levelId === id)) }));
  const charts = element('div', 'chart-grid');
  charts.append(
    chartCard('Tiến độ chính xác', points('accuracy'), { format: formatPercent, max: 100 }),
    chartCard('Tiến độ thời gian trả lời', points('averageMs'), { format: value => `${(value / 1000).toFixed(2)}s` }),
    chartCard('Câu đúng theo phiên', points('correct'), { format: String, integers: true }),
    chartCard('Độ chính xác theo Level', byLevel.map(row => ({
      label: levelLabel(row.id), axisLabel: row.id, value: row.total ? row.accuracy : null,
    })), { format: formatPercent, max: 100, bars: true }),
  );
  const breakdown = element('section', 'card level-table');
  const scroll = element('div', 'table-scroll');
  scroll.tabIndex = 0;
  scroll.setAttribute('aria-label', 'Kết quả theo Level');
  const table = element('table');
  const headings = table.createTHead().insertRow();
  for (const label of ['Level', 'Phiên', 'Đã làm', 'Đúng', 'Sai', 'Bỏ qua', 'Hết giờ', 'Chính xác', 'TB trả lời', 'Chuỗi tốt nhất']) {
    const cell = element('th', '', label);
    cell.scope = 'col';
    headings.append(cell);
  }
  const body = table.createTBody();
  for (const row of byLevel) {
    const cells = [levelLabel(row.id), row.sessions, row.total, row.correct, row.incorrect, row.skipped,
      row.timeout, formatPercent(row.accuracy), formatDuration(row.averageMs), row.bestStreak];
    const tr = body.insertRow();
    for (const value of cells) tr.insertCell().textContent = value;
  }
  scroll.append(table);
  breakdown.append(element('h2', '', 'Kết quả theo Level'), scroll);
  byId('statistics-content').replaceChildren(metrics, charts, breakdown);
}
