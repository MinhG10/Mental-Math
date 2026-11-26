import { LIMITS } from '../config.js';
import { valueToken } from '../core/expression-evaluator.js';
import { pick, randomInt } from '../utils/random-utils.js';
import { defineLevel, expressionQuestion, negativeField, operandField } from './level-helpers.js';

const schema = [
  operandField,
  { key: 'count', label: 'Number of operands', type: 'range', presets: [3, 4, 5, 6], min: 3, max: LIMITS.mixedOperands },
  negativeField,
];
const operators = ['+', '-', '*', '/'];

export function generateMixed(settings, rng) {
  const { count, limit, allowNegative } = settings;
  for (let attempt = 0; attempt < LIMITS.generationAttempts; attempt++) {
    const first = randomInt(0, limit, rng);
    const tokens = [valueToken(first)];
    // Track the current additive term so every division is exact at its execution point.
    let term = first;
    let factor = first;
    let valid = true;
    for (let i = 1; i < count; i++) {
      const operator = pick(operators, rng);
      let operand = randomInt(0, limit, rng);
      if (operator === '*') {
        operand = randomInt(Math.min(2, limit), limit, rng);
        term *= operand;
        factor = operand;
        if (!Number.isSafeInteger(term)) {
          valid = false;
          break;
        }
      } else if (operator === '/') {
        const candidates = [factor, 2, 3, 5, 7, 10]
          .filter(candidate => candidate > 1 && candidate <= limit && term % candidate === 0);
        operand = candidates.length ? pick(candidates, rng) : 1;
        term /= operand;
        factor = term <= limit ? term : 1;
      } else {
        term = operand;
        factor = operand;
      }
      tokens.push(operator, valueToken(operand));
    }
    if (valid) {
      try {
        const question = expressionQuestion(tokens, { integersOnly: true });
        if (allowNegative || question.result.n >= 0n) return question;
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
      }
    }
  }
  throw new RangeError('Could not generate an expression. Lower the maximum operand or use fewer operands.');
}

export const level11 = defineLevel({
  id: '1.1', name: 'Mixed Arithmetic', description: 'Practice the order of operations.',
}, schema, { limit: 99, count: 4, allowNegative: false }, generateMixed);
