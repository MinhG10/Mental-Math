import { formatDuration, formatPercent } from '../utils/format-utils.js';
import { element, setText } from './dom.js';

export function sessionMetrics(stats, elapsed) {
  return [
    ['Completed', stats.total], ['Correct', stats.correct, 'correct'], ['Incorrect', stats.incorrect, 'incorrect'],
    ['Skipped', stats.skipped], ['Timed out', stats.timeout, 'timeout'], ['Accuracy', formatPercent(stats.accuracy)],
    ['Total time', formatDuration(elapsed)], ['Avg. answer time', formatDuration(stats.averageMs)],
    ['Fastest answer', formatDuration(stats.fastestMs)], ['Slowest answer', formatDuration(stats.slowestMs)],
    ['Current streak', stats.currentStreak], ['Best streak', stats.bestStreak],
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
