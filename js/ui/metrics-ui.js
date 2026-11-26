import { formatDuration, formatPercent } from '../utils/format-utils.js';
import { element, setText } from './dom.js';

export function sessionMetrics(stats, elapsed) {
  return [
    ['Đã làm', stats.total], ['Đúng', stats.correct, 'correct'], ['Sai', stats.incorrect, 'incorrect'],
    ['Bỏ qua', stats.skipped], ['Hết giờ', stats.timeout, 'timeout'], ['Chính xác', formatPercent(stats.accuracy)],
    ['Tổng thời gian', formatDuration(elapsed)], ['TB trả lời', formatDuration(stats.averageMs)],
    ['Nhanh nhất', formatDuration(stats.fastestMs)], ['Chậm nhất', formatDuration(stats.slowestMs)],
    ['Chuỗi hiện tại', stats.currentStreak], ['Chuỗi tốt nhất', stats.bestStreak],
  ];
}

export function renderMetrics(container, metrics) {
  if (!container.children.length) {
    container.replaceChildren(...metrics.map(([label, value, tone]) => {
      const metric = element('div', 'metric');
      metric.append(element('span', '', label), element('strong', tone, value));
      return metric;
    }));
  } else {
    metrics.forEach(([, value], index) => setText(container.children[index].lastElementChild, String(value)));
  }
}
