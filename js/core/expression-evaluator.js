import { LIMITS, OPERATORS } from '../config.js';
import { Fraction } from '../utils/math-utils.js';

const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
const operations = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
const maxInteger = BigInt(Number.MAX_SAFE_INTEGER);

// Value tokens may carry a display label (e.g. √144) independently of their exact value.
export function valueToken(value, label = String(value)) {
  return { value: value instanceof Fraction ? value : Fraction.parse(value), label };
}

export function displayExpression(tokens) {
  return tokens.map(token => typeof token === 'object' ? token.label : OPERATORS[token] ?? token)
    .join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
}

export function evaluateExpression(tokens, { integersOnly = false } = {}) {
  if (!tokens.length || tokens.length > LIMITS.expressionTokens) throw new RangeError('Invalid expression length.');
  const values = [];
  const operators = [];
  let needsValue = true;
  let depth = 0;
  const malformed = () => new SyntaxError('Invalid expression.');
  function checked(value) {
    if (integersOnly && (value.d !== 1n || value.n > maxInteger || value.n < -maxInteger)) {
      throw new RangeError('Intermediate results must be safe integers.');
    }
    return value;
  }
  function reduceOperator() {
    const method = operations[operators.pop()];
    const right = values.pop();
    const left = values.pop();
    values.push(checked(left[method](right)));
  }
  // Reduce equal precedence before pushing the next operator for left associativity.
  for (const token of tokens) {
    if (token === '(' && needsValue) {
      if (++depth > LIMITS.expressionDepth) throw new RangeError('The expression has too many nested parentheses.');
      operators.push(token);
    } else if (token === ')' && !needsValue && depth) {
      while (operators.at(-1) !== '(') reduceOperator();
      operators.pop();
      depth--;
    } else if (typeof token === 'string' && Object.hasOwn(precedence, token) && !needsValue) {
      while (precedence[operators.at(-1)] >= precedence[token]) reduceOperator();
      operators.push(token);
      needsValue = true;
    } else if (needsValue && token?.value instanceof Fraction) {
      values.push(checked(token.value));
      needsValue = false;
    } else {
      throw malformed();
    }
  }
  if (needsValue || depth) throw malformed();
  while (operators.length) reduceOperator();
  return values[0];
}
