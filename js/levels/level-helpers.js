import { LIMITS } from '../config.js';
import { displayExpression, evaluateExpression } from '../core/expression-evaluator.js';
import { validateFields } from '../utils/validation-utils.js';

export const operandField = {
  key: 'limit', label: 'Giới hạn toán hạng', type: 'range',
  presets: [99, 999, 9999], min: 1, max: LIMITS.operand,
};

export const negativeField = { key: 'allowNegative', label: 'Cho phép kết quả âm', type: 'checkbox' };

export const difficultyField = {
  key: 'difficulty', label: 'Độ khó', type: 'select',
  options: { easy: 'Easy · Dễ', medium: 'Medium · Vừa', hard: 'Hard · Khó' },
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
  if (correctAnswer === null) throw new RangeError('Kết quả có quá nhiều chữ số thập phân.');
  return {
    expression: options.expression ?? displayExpression(tokens),
    correctAnswer,
    answerType: options.integersOnly ? 'integer' : 'decimal',
    metadata: { ...options.metadata, ...(rounding === undefined ? {} : { rounding }) },
    tokens,
    result,
  };
}
