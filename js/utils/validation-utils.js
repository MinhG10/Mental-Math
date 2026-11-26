import { DEFAULT_TIMERS, LIMITS } from '../config.js';

export function boundedInteger(value, min, max, label) {
  const number = typeof value === 'number' ? value : /^\d+$/.test(String(value).trim()) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new RangeError(`${label} phải là số nguyên từ ${min} đến ${max}.`);
  }
  return number;
}

export function validateFields(schema, settings) {
  return Object.fromEntries(schema.map(field => {
    const value = settings?.[field.key];
    let result = value;
    if (field.type === 'range' || field.type === 'integer') {
      result = boundedInteger(value, field.min, field.max, field.label);
    } else if (field.type === 'checkbox') {
      result = value === true;
    } else if (field.type === 'multi') {
      if (!Array.isArray(value) || !value.length || value.some(item => !(item in field.options) || !Object.hasOwn(field.options, item))) {
        throw new RangeError(`Chọn ít nhất một mục hợp lệ trong “${field.label}”.`);
      }
      result = [...new Set(value)];
    } else if (field.type === 'select' && !Object.hasOwn(field.options, value)) {
      throw new RangeError(`Chọn một giá trị hợp lệ cho “${field.label}”.`);
    }
    return [field.key, result];
  }));
}

export function validateTimers(settings = DEFAULT_TIMERS) {
  const timedQuestion = settings.timedQuestion === true;
  return {
    timedQuestion,
    questionSeconds: timedQuestion
      ? boundedInteger(settings.questionSeconds, 1, LIMITS.questionSeconds, 'Thời gian mỗi câu')
      : DEFAULT_TIMERS.questionSeconds,
    sessionSeconds: boundedInteger(settings.sessionSeconds, 0, LIMITS.sessionSeconds, 'Thời gian thử thách'),
    feedbackMs: boundedInteger(settings.feedbackMs, 0, LIMITS.feedbackMs, 'Thời gian hiện phản hồi (ms)'),
  };
}
