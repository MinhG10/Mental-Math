import { STATUS } from '../config.js';
import { formatDate, formatDuration, formatHistoricalExpression, formatPercent } from '../utils/format-utils.js';
import { byId, element } from './dom.js';
import { renderMetrics, sessionMetrics } from './metrics-ui.js';

function historyTable() {
  const scroll = element('div', 'table-scroll');
  scroll.tabIndex = 0;
  scroll.setAttribute('aria-label', 'Question details');
  const table = element('table');
  const header = table.createTHead().insertRow();
  for (const label of ['Question', 'Correct answer', 'Your answer', 'Result', 'Time']) {
    const cell = element('th', '', label);
    cell.scope = 'col';
    header.append(cell);
  }
  scroll.append(table);
  return { scroll, tbody: table.createTBody() };
}

function renderDetails(container, session, registry) {
  const settings = registry.list().find(level => level.id === session.levelId)?.getSettingsSchema() ?? [];
  const values = settings.map(field => {
    const value = session.settings[field.key];
    const formatted = Array.isArray(value) ? value.map(item => field.options?.[item] ?? item).join(', ')
      : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : field.options?.[value] ?? value;
    return `${field.label} · ${formatted ?? '—'}`;
  });
  const { timedQuestion, questionSeconds, sessionSeconds, feedbackMs } = session.timers;
  const timers = `Per question · ${timedQuestion ? questionSeconds + 's' : 'No limit'} | Session · ${sessionSeconds ? sessionSeconds + 's' : 'No limit'} | Feedback · ${feedbackMs} ms`;
  const metrics = element('div', 'metrics');
  renderMetrics(metrics, sessionMetrics(session.stats, session.durationMs));
  const label = element('label', 'option');
  const filter = element('input');
  filter.type = 'checkbox';
  label.append(filter, document.createTextNode('Show incorrect answers only'));
  const { scroll, tbody } = historyTable();
  function renderRows() {
    tbody.replaceChildren();
    for (const question of session.questions) {
      if (filter.checked && question.status !== 'incorrect') continue;
      const row = tbody.insertRow();
      const suffix = question.metadata?.percent ? '%' : '';
      const rounding = question.metadata?.rounding;
      const hint = rounding === undefined ? '' : ` (round to ${rounding} decimal ${rounding === 1 ? 'place' : 'places'})`;
      const cells = [
        formatHistoricalExpression(question.expression) + hint, question.correctAnswer + suffix, question.userAnswer ?? '—',
        STATUS[question.status], formatDuration(question.responseMs),
      ];
      cells.forEach((text, index) => {
        const cell = row.insertCell();
        cell.textContent = text;
        if (index === 3) cell.className = question.status;
      });
    }
    if (!tbody.rows.length) {
      const cell = tbody.insertRow().insertCell();
      cell.colSpan = 5;
      cell.textContent = 'No incorrect answers.';
    }
  }
  filter.addEventListener('change', renderRows);
  renderRows();
  container.append(element('p', 'muted', values.join(' | ')), element('p', 'muted', timers), metrics, label, scroll);
}

export function renderHistory(sessions, registry, levelLabel) {
  const list = byId('history-content');
  const open = new Set([...list.querySelectorAll('details[open]')].map(item => item.dataset.sessionId));
  list.replaceChildren();
  if (!sessions.length) list.append(element('p', 'card muted', 'No saved practice sessions yet.'));
  for (const session of sessions) {
    const entry = element('details', 'card history-entry');
    entry.dataset.sessionId = session.id;
    const header = element('summary');
    header.append(element('strong', '', levelLabel(session.levelId)),
      element('small', '', formatDate(session.startedAt)),
      element('small', '', `${session.stats.correct}/${session.stats.total} correct · ${formatPercent(session.stats.accuracy)}`));
    const detail = element('div', 'history-details');
    entry.append(header, detail);
    entry.addEventListener('toggle', () => {
      if (entry.open && !detail.children.length) renderDetails(detail, session, registry);
    });
    entry.open = open.has(session.id);
    list.append(entry);
  }
}
