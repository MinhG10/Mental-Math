import { valueToken } from '../core/expression-evaluator.js';
import { pick, randomInt } from '../utils/random-utils.js';
import { defineLevel, expressionQuestion, negativeField, operandField } from './level-helpers.js';

const schema = [
  { key: 'operators', label: 'Phép toán', type: 'multi', options: { '+': '+ Cộng', '-': '− Trừ', '*': '× Nhân', '/': '÷ Chia' } },
  operandField, negativeField,
];

export function generateBasic(settings, rng) {
  const { limit, allowNegative, operators } = settings;
  const operator = pick(operators, rng);
  let a = randomInt(0, limit, rng);
  let b = randomInt(0, limit, rng);
  if (operator === '*') {
    const min = Math.min(2, limit);
    a = randomInt(min, limit, rng);
    b = randomInt(min, limit, rng);
  } else if (operator === '/') {
    const min = Math.min(2, limit);
    b = randomInt(min, Math.max(min, Math.floor(limit / 2)), rng);
    const maxQuotient = Math.floor(limit / b);
    a = b * randomInt(Math.min(2, maxQuotient), maxQuotient, rng);
  } else if (operator === '-' && !allowNegative && a < b) {
    [a, b] = [b, a];
  }
  return expressionQuestion([valueToken(a), operator, valueToken(b)], { integersOnly: true });
}

export const level1 = defineLevel({
  id: '1', name: 'Basic Arithmetic', title: 'Số học cơ bản', description: 'Bốn phép tính với số nguyên.',
}, schema, { operators: ['+', '-', '*', '/'], limit: 99, allowNegative: false }, generateBasic);
