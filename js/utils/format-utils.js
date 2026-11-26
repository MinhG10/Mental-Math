const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
const numberFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const timeFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export const formatDate = value => dateFormat.format(new Date(value));
export const formatPercent = value => numberFormat.format(value) + '%';
export const formatDuration = value => {
  if (value === null || value === undefined) return '—';
  const minutes = Math.floor(value / 60_000);
  const seconds = (value % 60_000) / 1000;
  return (minutes ? `${minutes}p ` : '') + timeFormat.format(seconds) + 's';
};
