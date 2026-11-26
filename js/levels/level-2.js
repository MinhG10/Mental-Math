import { valueToken } from '../core/expression-evaluator.js';
import { LIMITS } from '../config.js';
import { Fraction, formatScaled } from '../utils/math-utils.js';
import { pick, randomInt } from '../utils/random-utils.js';
import { defineLevel, difficultyField, expressionQuestion, operandField } from './level-helpers.js';

export const percentageGroups = {
  of: 'Phần trăm của một số', ratio: 'Tìm tỷ lệ phần trăm', change: 'Tăng hoặc giảm', decimal: 'Phép tính thập phân',
};
const schema = [
  { key: 'groups', label: 'Nhóm bài tập', type: 'multi', options: percentageGroups },
  operandField,
  { key: 'places', label: 'Số chữ số thập phân tối đa', type: 'integer', min: 0, max: LIMITS.decimalPlaces },
  difficultyField,
];
const common = [5, 10, 20, 25, 50, 75];
const hard = [3.75, 6.25, 7.5, 12.5, 17.5, 22.5, 33.25, 37.5, 62.5, 87.5];

function percentage(settings, cap, rng) {
  let pool = common;
  if (settings.difficulty === 'medium') pool = Array.from({ length: 100 }, (_, i) => i + 1);
  if (settings.difficulty === 'hard') {
    pool = hard.filter(value => String(value).split('.')[1].length <= settings.places);
    if (!pool.some(value => value <= cap)) return randomInt(1, cap, rng);
  }
  const available = pool.filter(value => value <= cap);
  return available.length ? pick(available, rng) : 1;
}

export function generatePercentage(group, settings, rng) {
  const { limit, places, difficulty } = settings;
  const baseCap = Math.min(limit, { easy: 500, medium: 3000, hard: limit }[difficulty]);
  const percent = percentage(settings, group === 'ratio' ? 100 : Math.min(100, limit), rng);
  const rate = Fraction.parse(percent).divide(new Fraction(100));
  const percentageToken = valueToken(rate, `${percent}%`);
  const scale = 10 ** places;
  if (group === 'ratio') {
    // Pick a scaled base divisible by the rate denominator for an exact displayed part.
    const multiple = Number(rate.d);
    const maxMultiplier = Math.floor(baseCap * scale / multiple);
    const ratio = maxMultiplier ? rate : new Fraction(1);
    const base = maxMultiplier ? multiple * randomInt(1, maxMultiplier, rng) : scale;
    const total = valueToken(formatScaled(base, places));
    const part = valueToken(total.value.multiply(ratio).decimal());
    return expressionQuestion([part, '/', total, '*', valueToken(100)], {
      expression: `${part.label} chiếm bao nhiêu % của ${total.label}?`,
      metadata: { group, percent: true },
    });
  }
  const step = Number(rate.d);
  const base = valueToken(step <= baseCap
    ? step * randomInt(1, Math.floor(baseCap / step), rng)
    : randomInt(1, baseCap, rng));
  const product = [percentageToken, '*', base];
  if (group === 'of') return expressionQuestion(product, {
    expression: `${percent}% của ${base.label}`, metadata: { group },
  });
  const increase = rng() < 0.5;
  return expressionQuestion([base, increase ? '+' : '-', ...product], {
    expression: increase ? `Tăng ${base.label} thêm ${percent}%` : `Giảm ${base.label} đi ${percent}%`,
    metadata: { group },
  });
}

export function generateDecimal(settings, rng) {
  const places = Math.min(settings.places, { easy: 1, medium: 2, hard: settings.places }[settings.difficulty]);
  const cap = Math.min(settings.limit, { easy: 25, medium: 250, hard: settings.limit }[settings.difficulty]);
  const maxScaled = cap * 10 ** places;
  const operator = pick(['+', '-', '*', '/'], rng);
  let a = randomInt(1, maxScaled, rng);
  let b = randomInt(1, maxScaled, rng);
  if (operator === '/') {
    const quotient = randomInt(1, Math.min(maxScaled, 25), rng);
    b = randomInt(1, Math.floor(maxScaled / quotient), rng);
    a = b * quotient;
    // Scale down the dividend when possible, giving exact fractional quotients too.
    if (places && a % 10 === 0 && rng() < 0.5) a /= 10;
  }
  return expressionQuestion([valueToken(formatScaled(a, places)), operator, valueToken(formatScaled(b, places))], {
    metadata: { group: 'decimal' },
  });
}

export const level2 = defineLevel({
  id: '2', name: 'Percentage & Decimal', title: 'Phần trăm và thập phân', description: 'Tỷ lệ, tăng giảm và số thập phân.',
}, schema, { groups: Object.keys(percentageGroups), limit: 999, places: 2, difficulty: 'medium' },
(settings, rng) => {
  const group = pick(settings.groups, rng);
  return group === 'decimal' ? generateDecimal(settings, rng) : generatePercentage(group, settings, rng);
});
