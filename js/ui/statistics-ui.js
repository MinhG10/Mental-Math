import { summarizeHistory } from '../services/statistics-service.js';
import { formatDate, formatDuration, formatPercent } from '../utils/format-utils.js';
import { byId, element, fillOptions } from './dom.js';
import { renderMetrics } from './metrics-ui.js';
import { chartCard } from './chart-ui.js';

export function setupStatistics(registry, onFilter) {
  const filter = byId('stats-filter');
  fillOptions(filter, [['', 'All levels'], ...registry.list().map(level => [level.id, `Level ${level.id}`])]);
  filter.addEventListener('change', onFilter);
}

export function renderStatistics(sessions, registry, levelLabel) {
  const filter = byId('stats-filter').value;
  const filtered = filter ? sessions.filter(session => session.levelId === filter) : sessions;
  const totals = summarizeHistory(filtered);
  const metrics = element('div', 'metrics');
  renderMetrics(metrics, [
    ['Saved sessions', totals.sessions], ['Completed', totals.total], ['Correct', totals.correct, 'correct'],
    ['Incorrect', totals.incorrect, 'incorrect'], ['Skipped', totals.skipped], ['Timed out', totals.timeout, 'timeout'],
    ['Accuracy', formatPercent(totals.accuracy)], ['Avg. answer time', formatDuration(totals.averageMs)], ['Best streak', totals.bestStreak],
  ]);
  const chronological = [...filtered].reverse();
  const points = key => chronological.map((session, index) => ({
    label: formatDate(session.startedAt), axisLabel: `Session ${index + 1}`, value: session.stats[key],
  }));
  const ids = filter ? [filter] : [...new Set([...registry.list().map(level => level.id), ...filtered.map(session => session.levelId)])];
  const byLevel = ids.map(id => ({ id, ...summarizeHistory(filtered.filter(session => session.levelId === id)) }));
  const charts = element('div', 'chart-grid');
  charts.append(
    chartCard('Accuracy over time', points('accuracy'), { format: formatPercent, max: 100 }),
    chartCard('Answer time over time', points('averageMs'), { format: value => `${(value / 1000).toFixed(2)}s` }),
    chartCard('Correct answers per session', points('correct'), { format: String, integers: true }),
    chartCard('Accuracy by level', byLevel.map(row => ({
      label: levelLabel(row.id), axisLabel: row.id, value: row.total ? row.accuracy : null,
    })), { format: formatPercent, max: 100, bars: true }),
  );
  const breakdown = element('section', 'card level-table');
  const scroll = element('div', 'table-scroll');
  scroll.tabIndex = 0;
  scroll.setAttribute('aria-label', 'Results by level');
  const table = element('table');
  const headings = table.createTHead().insertRow();
  for (const label of ['Level', 'Sessions', 'Completed', 'Correct', 'Incorrect', 'Skipped', 'Timed out', 'Accuracy', 'Avg. answer time', 'Best streak']) {
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
  breakdown.append(element('h2', '', 'Results by level'), scroll);
  byId('statistics-content').replaceChildren(metrics, charts, breakdown);
}
