import { LIMITS } from '../config.js';
import { displayExpression, evaluateExpression } from '../core/expression-evaluator.js';
import { validateFields } from '../utils/validation-utils.js';

export const operandField = {
  key: 'limit', label: 'Maximum operand', type: 'range',
  presets: [99, 999, 9999], min: 1, max: LIMITS.operand,
};

export const negativeField = { key: 'allowNegative', label: 'Allow negative answers', type: 'checkbox' };

export const difficultyField = {
  key: 'difficulty', label: 'Difficulty', type: 'select',
  options: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
};

export function defineLevel(info, schema, defaults, generateQuestion) {
  return {
    ...info,
    getDefaultSettings: () => structuredClone(defaults),
    getSettingsSchema: () => schema,
    validateSettings: settings => validateFields(schema, settings),
    generateQuestion,
  };
}

export function expressionQuestion(tokens, options = {}) {
  const result = evaluateExpression(tokens, options);
  const exact = result.decimal(options.maxPlaces ?? 24);
  const rounding = exact === null ? options.rounding : undefined;
  const correctAnswer = exact ?? (rounding === undefined ? null : result.round(rounding));
  if (correctAnswer === null) throw new RangeError('The result has too many decimal places.');
  return {
    expression: options.expression ?? displayExpression(tokens),
    correctAnswer,
    answerType: options.integersOnly ? 'integer' : 'decimal',
    metadata: { ...options.metadata, ...(rounding === undefined ? {} : { rounding }) },
    tokens,
    result,
  };
}
