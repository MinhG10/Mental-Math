import { pick, randomInt } from '../utils/random-utils.js';
import { level1 } from './level-1.js';
import { level11 } from './level-1-1.js';
import { level2, generatePercentage } from './level-2.js';
import { level3 } from './level-3.js';
import { defineLevel, difficultyField, expressionQuestion } from './level-helpers.js';

const groups = {
  basic: 'Số học cơ bản', mixed: 'Biểu thức phối hợp', percentage: 'Phần trăm',
  decimal: 'Thập phân', square: 'Bình phương', root: 'Căn bậc hai',
};
const schema = [
  { key: 'mode', label: 'Chế độ', type: 'select', options: { random: 'Random Questions', mixed: 'Mixed Expressions' } },
  { key: 'groups', label: 'Nhóm phép toán', type: 'multi', options: groups },
  difficultyField,
];
const scales = {
  easy: { limit: 20, places: 1, count: 3 },
  medium: { limit: 99, places: 2, count: 4 },
  hard: { limit: 250, places: 3, count: 5 },
};

function generateGroup(group, difficulty, rng, inExpression) {
  const { limit, places, count } = scales[difficulty];
  const decimalSettings = { difficulty, limit, places };
  switch (group) {
    case 'basic': return level1.generateQuestion({ ...level1.getDefaultSettings(), limit }, rng);
    case 'mixed': return level11.generateQuestion({ limit, count, allowNegative: true }, rng);
    case 'percentage': return inExpression
      ? generatePercentage('of', decimalSettings, rng)
      : level2.generateQuestion({ ...decimalSettings, groups: ['of', 'ratio', 'change'] }, rng);
    case 'decimal': return level2.generateQuestion({ ...decimalSettings, groups: ['decimal'] }, rng);
    default: return level3.generateQuestion({ mode: group, limit: Math.min(limit, 100) }, rng);
  }
}

export const level31 = defineLevel({
  id: '3.1', name: 'Comprehensive Arithmetic', title: 'Số học tổng hợp', description: 'Trộn các chủ đề hoặc kết hợp chúng trong cùng biểu thức.',
}, schema, { mode: 'random', groups: Object.keys(groups), difficulty: 'medium' }, (settings, rng) => {
  const { mode, difficulty } = settings;
  const first = pick(settings.groups, rng);
  if (mode === 'random') return generateGroup(first, difficulty, rng, false);
  const selected = [first];
  const others = settings.groups.filter(group => group !== first);
  if (others.length) selected.push(others.splice(randomInt(0, others.length - 1, rng), 1)[0]);
  if (selected.length < 2 || difficulty === 'hard') selected.push(pick(others.length ? others : settings.groups, rng));
  const tokens = selected.flatMap((group, i) => {
    const atom = generateGroup(group, difficulty, rng, true);
    const prefix = i ? [pick(['+', '-', '*'], rng)] : [];
    return [...prefix, ...(atom.tokens.length > 1 && group !== 'percentage' ? ['(', ...atom.tokens, ')'] : atom.tokens)];
  });
  return expressionQuestion(tokens, { metadata: { groups: selected } });
});
