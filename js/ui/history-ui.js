import { STATUS } from '../config.js';
import { formatDate, formatDuration, formatPercent } from '../utils/format-utils.js';
import { byId, element } from './dom.js';
import { renderMetrics, sessionMetrics } from './metrics-ui.js';

function historyTable() {
  const scroll = element('div', 'table-scroll');
  scroll.tabIndex = 0;
  scroll.setAttribute('aria-label', 'Chi tiết các câu hỏi');
  const table = element('table');
  const header = table.createTHead().insertRow();
  for (const label of ['Câu hỏi', 'Đáp án đúng', 'Bạn nhập', 'Kết quả', 'Thời gian']) {
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
      : typeof value === 'boolean' ? (value ? 'Có' : 'Không') : field.options?.[value] ?? value;
    return `${field.label} · ${formatted ?? '—'}`;
  });
  const { timedQuestion, questionSeconds, sessionSeconds, feedbackMs } = session.timers;
  const timers = `Mỗi câu · ${timedQuestion ? questionSeconds + ' giây' : 'Không giới hạn'} | Thử thách · ${sessionSeconds ? sessionSeconds + ' giây' : 'Không giới hạn'} | Phản hồi · ${feedbackMs} ms`;
  const metrics = element('div', 'metrics');
  renderMetrics(metrics, sessionMetrics(session.stats, session.durationMs));
  const label = element('label', 'option');
  const filter = element('input');
  filter.type = 'checkbox';
  label.append(filter, document.createTextNode('Chỉ hiện câu trả lời sai'));
  const { scroll, tbody } = historyTable();
  function renderRows() {
    tbody.replaceChildren();
    for (const question of session.questions) {
      if (filter.checked && question.status !== 'incorrect') continue;
      const row = tbody.insertRow();
      const suffix = question.metadata?.percent ? '%' : '';
      const hint = question.metadata?.rounding === undefined ? '' : ` (làm tròn ${question.metadata.rounding} chữ số)`;
      const cells = [
        question.expression + hint, question.correctAnswer + suffix, question.userAnswer ?? '—',
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
      cell.textContent = 'Không có câu trả lời sai.';
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
  if (!sessions.length) list.append(element('p', 'card muted', 'Chưa có phiên luyện tập nào được lưu.'));
  for (const session of sessions) {
    const entry = element('details', 'card history-entry');
    entry.dataset.sessionId = session.id;
    const header = element('summary');
    header.append(element('strong', '', levelLabel(session.levelId)),
      element('small', '', formatDate(session.startedAt)),
      element('small', '', `${session.stats.correct}/${session.stats.total} đúng · ${formatPercent(session.stats.accuracy)}`));
    const detail = element('div', 'history-details');
    entry.append(header, detail);
    entry.addEventListener('toggle', () => {
      if (entry.open && !detail.children.length) renderDetails(detail, session, registry);
    });
    entry.open = open.has(session.id);
    list.append(entry);
  }
}
