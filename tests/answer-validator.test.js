import { validateAnswer } from '../js/core/answer-validator.js';
import { equal, test } from './harness.js';

test('Đáp án tương đương, dấu phẩy, số âm và tỷ lệ có dấu %', () => {
  const decimal = { answerType: 'decimal', correctAnswer: '2.5' };
  for (const input of [' 2.5 ', '2.50', '2.500', '2,5', '+2.50']) equal(validateAnswer(input, decimal).correct, true);
  equal(validateAnswer('−10,0', { answerType: 'integer', correctAnswer: '-10' }).correct, true);
  equal(validateAnswer('2,500 %', { ...decimal, metadata: { percent: true } }).correct, true);
  equal(validateAnswer('2.5000000001', decimal).correct, false);
});
test('Từ chối đáp án trống, biểu thức, ký tự, số quá dài và thập phân ở Level nguyên', () => {
  const question = { answerType: 'integer', correctAnswer: '4' };
  for (const input of ['', ' ', '1+3', '1e3', 'NaN', '1,234.0', '2%', '2.5', '9'.repeat(90)]) {
    equal(validateAnswer(input, question).valid, false);
  }
  equal(validateAnswer('3', question).correct, false);
});
