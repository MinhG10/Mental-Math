import { element } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';
const width = 500;
const height = 208;
const plot = { left: 80, right: 472, top: 18, bottom: 168 };
function svgElement(tag, attributes, value) {
  const node = document.createElementNS(NS, tag);
  for (const [name, attribute] of Object.entries(attributes)) node.setAttribute(name, attribute);
  if (value !== undefined) node.textContent = value;
  return node;
}

export function chartCard(title, data, { format, max, bars = false, integers = false } = {}) {
  const card = element('section', 'card');
  card.append(element('h2', '', title));
  const visible = data.filter(point => point.value !== null);
  if (!visible.length) {
    card.append(element('p', 'muted field-help', 'Chưa có dữ liệu để vẽ biểu đồ.'));
    return card;
  }
  const chart = svgElement('svg', { class: 'chart', viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': title });
  const observedMax = Math.max(...visible.map(point => point.value));
  const upper = max ?? (integers ? Math.max(4, Math.ceil(observedMax / 4) * 4) : observedMax || 1);
  const y = value => plot.bottom - value / upper * (plot.bottom - plot.top);
  const span = plot.right - plot.left;
  const x = index => bars ? plot.left + (index + .5) * span / data.length
    : data.length === 1 ? plot.left + span / 2 : plot.left + span * index / (data.length - 1);
  for (let step = 0; step <= 4; step++) {
    const value = upper * step / 4;
    const row = y(value);
    chart.append(svgElement('line', { x1: plot.left, x2: plot.right, y1: row, y2: row, class: 'grid' }),
      svgElement('text', { x: plot.left - 8, y: row + 5, 'text-anchor': 'end' }, format(value)));
  }
  let path = '';
  let previous = false;
  data.forEach(({ value, label, axisLabel }, index) => {
    const column = x(index);
    if (bars || index === 0 || index === data.length - 1) {
      const anchor = !bars && data.length > 1 ? (index === 0 ? 'start' : 'end') : 'middle';
      chart.append(svgElement('text', { x: column, y: 191, 'text-anchor': anchor }, axisLabel));
    }
    if (value === null) {
      previous = false;
      return;
    }
    const row = y(value);
    path += `${previous ? 'L' : 'M'}${column},${row} `;
    previous = true;
    const barWidth = Math.min(35, span / data.length * .55);
    const point = bars
      ? svgElement('rect', { x: column - barWidth / 2, y: row, width: barWidth, height: Math.max(1, plot.bottom - row), rx: 4, class: 'bar' })
      : svgElement('circle', { cx: column, cy: row, r: 4, class: 'point' });
    point.append(svgElement('title', {}, `${label} · ${format(value)}`));
    chart.append(point);
  });
  if (!bars) chart.insertBefore(svgElement('path', { d: path, class: 'series' }), chart.children[10] ?? null);
  const details = element('details', 'chart-values');
  details.append(element('summary', '', 'Xem giá trị'));
  const values = element('ol');
  for (const { label, value } of data) values.append(element('li', '', `${label} · ${value === null ? '—' : format(value)}`));
  details.append(values);
  card.append(chart, details);
  return card;
}
