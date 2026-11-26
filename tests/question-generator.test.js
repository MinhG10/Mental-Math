import { levelRegistry } from '../js/levels/index.js';
import { QuestionEngine } from '../js/core/question-engine.js';
import { formatHistoricalExpression } from '../js/utils/format-utils.js';
import { assert, equal, seededRandom, test, throws } from './harness.js';

const values = question => question.tokens.filter(token => typeof token === 'object');
function generate(id, settings, count, check, seed = 13) {
  const level = levelRegistry.get(id);
  const config = level.validateSettings({ ...level.getDefaultSettings(), ...settings });
  const rng = seededRandom(seed);
  for (let i = 0; i < count; i++) check(level.generateQuestion(config, rng));
}

test('Level 1: 4,500 questions across all four operations and boundary limits', () => {
  for (const limit of [1, 99, 999, 9999, 99999]) {
    const seen = new Set();
    generate('1', { limit }, 900, question => {
      const [a, b] = values(question).map(token => Number(token.label));
      const op = question.tokens[1];
      seen.add(op);
      assert([a, b].every(n => Number.isInteger(n) && n >= 0 && n <= limit));
      if (op === '/') assert(b > 0 && a % b === 0 && (limit < 2 || b > 1));
      if (op === '*' && limit >= 2) assert(a >= 2 && b >= 2);
      const expected = { '+': () => a + b, '-': () => a - b, '*': () => a * b, '/': () => a / b };
      equal(Number(question.correctAnswer), expected[op]());
      assert(Number(question.correctAnswer) >= 0);
    });
    equal(seen.size, 4);
  }
});

test('Level 1.1: 4,500 expressions checked independently for precedence and integer division', () => {
  for (const [limit, count, allowNegative] of [[1, 3, false], [99, 4, false], [999, 5, true], [9999, 6, false], [99999, 10, true]]) {
    generate('1.1', { limit, count, allowNegative }, 900, question => {
      const operands = values(question).map(token => Number(token.label));
      equal(operands.length, count);
      equal(question.tokens.length, count * 2 - 1);
      assert(operands.every(n => Number.isInteger(n) && n >= 0 && n <= limit));
      let term = operands[0];
      let sum = 0;
      let sign = 1;
      operands.slice(1).forEach((operand, index) => {
        const op = question.tokens[index * 2 + 1];
        if (op === '*') term *= operand;
        else if (op === '/') {
          assert(operand > 0 && term % operand === 0);
          term /= operand;
        } else {
          sum += sign * term;
          term = operand;
          sign = op === '+' ? 1 : -1;
        }
        assert(Number.isSafeInteger(term) && Number.isSafeInteger(sum));
      });
      equal(Number(question.correctAnswer), sum + sign * term);
      assert(allowNegative || Number(question.correctAnswer) >= 0);
    }, limit);
  }
});

test('Level 2: 4,800 questions across every question type and difficulty', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (const group of ['of', 'ratio', 'change', 'decimal']) {
      for (const [limit, places] of [[1, 0], [999, 2], [99999, 4]]) {
        generate('2', { difficulty, groups: [group], limit, places }, limit === 99999 ? 134 : 133, question => {
          equal(question.metadata.group, group);
          const input = values(question).map(token => Number(token.label.replace('%', '')));
          assert(input.slice(0, group === 'ratio' ? 2 : input.length).every(n => n >= 0 && n <= limit));
          const [a, b, c] = input;
          const op = question.tokens[1];
          let expected;
          if (group === 'of') expected = a * b / 100;
          else if (group === 'ratio') expected = a * 100 / b;
          else if (group === 'change') expected = a + (op === '+' ? 1 : -1) * b * c / 100;
          else expected = { '+': a + b, '-': a - b, '*': a * b, '/': a / b }[op];
          assert(Math.abs(Number(question.correctAnswer) - expected) <= 1e-12 * Math.max(1, Math.abs(expected)));
          assert(/^[-]?\d+(?:\.\d+)?$/.test(question.correctAnswer));
        }, limit);
      }
    }
  }
});

test('Level 3: 2,000 questions covering notation, operand limits, and perfect squares', () => {
  for (const mode of ['square', 'root']) {
    generate('3', { mode, limit: 200 }, 1000, question => {
      const n = question.metadata.base;
      assert(n >= 0 && n <= 200);
      equal(question.expression, mode === 'square' ? `${n}²` : `√${n * n}`);
      equal(Number(question.correctAnswer), mode === 'square' ? n * n : n);
    });
  }
});

test('Level 3.1: 6,000 questions across both modes, every difficulty, and valid topics', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (const mode of ['random', 'mixed']) {
      const groups = new Set();
      generate('3.1', { difficulty, mode }, 1000, question => {
        const result = question.result.decimal();
        equal(question.correctAnswer, result);
        if (mode === 'mixed') {
          const selected = new Set(question.metadata.groups);
          assert(selected.size >= 2);
          for (const group of selected) groups.add(group);
        }
      }, 881);
      if (mode === 'mixed') equal(groups.size, 6);
    }
  }
  generate('3.1', { mode: 'mixed', groups: ['root'] }, 20, question => {
    assert(question.metadata.groups.every(group => group === 'root'));
  });
});

test('Invalid settings are rejected and generation attempts are bounded', () => {
  const basic = levelRegistry.get('1');
  for (const limit of ['abc', 'NaN', 0, -1, 100000, '1e3', '2.5']) {
    throws(() => basic.validateSettings({ ...basic.getDefaultSettings(), limit }), /whole number/);
  }
  throws(() => basic.validateSettings({ ...basic.getDefaultSettings(), operators: [] }), /at least one/);
  const mixed = levelRegistry.get('1.1');
  throws(() => mixed.validateSettings({ ...mixed.getDefaultSettings(), count: 11 }), /whole number/);
  throws(() => mixed.generateQuestion({ count: 10, limit: 99999, allowNegative: true }, () => .65), /Lower the maximum operand/);
});

test('Avoids repeat questions where possible and stops trying when the pool is too small', () => {
  const engine = new QuestionEngine(levelRegistry, seededRandom(16));
  const settings = levelRegistry.get('1').getDefaultSettings();
  equal(new Set(Array.from({ length: 100 }, () => engine.generate('1', settings).expression)).size, 100);
  const small = { limit: 1, mode: 'root' };
  equal(engine.generate('3', small).expression, engine.generate('3', small).expression);
});

test('Saved percentage prompts display in English without altering arithmetic or English prompts', () => {
  equal(formatHistoricalExpression('12.5% của 800'), '12.5% of 800');
  equal(formatHistoricalExpression('45 chiếm bao nhiêu % của 180?'), 'What percentage of 180 is 45?');
  equal(formatHistoricalExpression('Tăng 250 thêm 20%'), 'Increase 250 by 20%');
  equal(formatHistoricalExpression('Giảm 800 đi 15%'), 'Decrease 800 by 15%');
  equal(formatHistoricalExpression('20% of 100'), '20% of 100');
  equal(formatHistoricalExpression('√144 × 5'), '√144 × 5');
});
