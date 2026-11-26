import { LIMITS } from '../config.js';
import { Fraction } from '../utils/math-utils.js';

export function validateAnswer(input, question) {
  const raw = String(input).trim();
  if (!raw) return { valid: false, message: 'Enter an answer to continue.' };
  const normalized = question.metadata?.percent ? raw.replace(/\s*%$/, '') : raw;
  const answer = normalized.length <= LIMITS.answerChars ? Fraction.parse(normalized) : null;
  if (!answer || (question.answerType === 'integer' && answer.d !== 1n)) {
    return { valid: false, message: question.answerType === 'integer'
      ? 'Enter a whole number.' : 'Enter a number using a decimal point or comma.' };
  }
  return { valid: true, correct: answer.equals(Fraction.parse(question.correctAnswer)), input: raw };
}
