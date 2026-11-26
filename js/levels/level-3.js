import { valueToken } from '../core/expression-evaluator.js';
import { randomInt } from '../utils/random-utils.js';
import { defineLevel, expressionQuestion, operandField } from './level-helpers.js';

const schema = [
  { key: 'mode', label: 'Dạng bài', type: 'select', options: { both: 'Kết hợp cả hai', square: 'Bình phương', root: 'Căn bậc hai' } },
  { ...operandField, label: 'Giới hạn cơ số hoặc căn', presets: [20, 50, 100, 200] },
];

export function generateSquare({ mode, limit }, rng) {
  const n = randomInt(1, limit, rng);
  const square = n * n;
  const isSquare = mode === 'square' || (mode === 'both' && rng() < 0.5);
  const token = isSquare ? valueToken(square, `${n}²`) : valueToken(n, `√${square}`);
  return expressionQuestion([token], { integersOnly: true, metadata: { base: n, kind: isSquare ? 'square' : 'root' } });
}

export const level3 = defineLevel({
  id: '3', name: 'Square & Square Root', title: 'Bình phương và căn', description: 'Tính bình phương và căn bậc hai của số chính phương.',
}, schema, { mode: 'both', limit: 50 }, generateSquare);
