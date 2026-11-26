import { evaluateExpression, valueToken } from '../js/core/expression-evaluator.js';
import { Fraction } from '../js/utils/math-utils.js';
import { equal, test, throws } from './harness.js';

const tokens = (...parts) => parts.map(value => typeof value === 'number' ? valueToken(value) : value);
const integer = (...parts) => evaluateExpression(tokens(...parts), { integersOnly: true }).decimal();

test('Evaluator áp dụng ưu tiên, ngoặc và phép toán cùng mức từ trái qua phải', () => {
  equal(integer(59, '+', 65, '*', 90, '-', 98), '5811');
  equal(integer(96, '/', 12, '*', 6, '/', 4), '12');
  equal(integer(12, '-', 9, '+', 4), '7');
  equal(integer('(', 2, '+', 3, ')', '*', 4), '20');
  equal(integer(1, '-', 3), '-2');
});
test('Evaluator từ chối chia cho 0, chia không nguyên, cú pháp lỗi và tràn số', () => {
  throws(() => integer(1, '/', 0), /chia cho 0/);
  throws(() => integer(3, '/', 2, '*', 2), /số nguyên an toàn/);
  throws(() => integer(Number.MAX_SAFE_INTEGER, '+', 1), /số nguyên an toàn/);
  throws(() => integer('(', 3, '+', 2), /không hợp lệ/);
  throws(() => integer(4, '+', '*', 2), /không hợp lệ/);
  throws(() => integer(...Array(17).fill('('), 1, ...Array(17).fill(')')), /lồng nhau/);
  throws(() => integer(...Array(129).fill(1)), /Kích thước/);
});
test('Phân số tính thập phân, tỷ lệ và làm tròn chính xác', () => {
  equal(evaluateExpression(tokens(.1, '+', .2)).decimal(), '0.3');
  equal(evaluateExpression(tokens(12.6, '/', .3)).decimal(), '42');
  equal(evaluateExpression(tokens(.125, '*', 800)).decimal(), '100');
  equal(Fraction.parse('-1.005').round(2), '-1.01');
  equal(new Fraction(2, 3).decimal(), null);
  equal(new Fraction(2, 3).round(3), '0.667');
});
