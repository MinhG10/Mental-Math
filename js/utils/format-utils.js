const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const timeFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const formatDate = value => dateFormat.format(new Date(value));
export const formatPercent = value => numberFormat.format(value) + '%';
export const formatDuration = value => {
  if (value === null || value === undefined) return '—';
  const minutes = Math.floor(value / 60_000);
  const seconds = (value % 60_000) / 1000;
  return (minutes ? `${minutes}m ` : '') + timeFormat.format(seconds) + 's';
};

export const percentagePrompts = {
  of: (percent, base) => `${percent}% of ${base}`,
  ratio: (part, total) => `What percentage of ${total} is ${part}?`,
  increase: (base, percent) => `Increase ${base} by ${percent}%`,
  decrease: (base, percent) => `Decrease ${base} by ${percent}%`,
};

// Older sessions stored Vietnamese percentage prompts as text. Translate them at display time.
const legacyPercentagePrompts = [
  [/^([\d.]+)% của ([\d.]+)$/, percentagePrompts.of],
  [/^([\d.]+) chiếm bao nhiêu % của ([\d.]+)\?$/, percentagePrompts.ratio],
  [/^Tăng ([\d.]+) thêm ([\d.]+)%$/, percentagePrompts.increase],
  [/^Giảm ([\d.]+) đi ([\d.]+)%$/, percentagePrompts.decrease],
];

export function formatHistoricalExpression(expression) {
  for (const [pattern, format] of legacyPercentagePrompts) {
    const match = pattern.exec(expression);
    if (match) return format(match[1], match[2]);
  }
  return expression;
}
