export const LIMITS = Object.freeze({
  history: 30, operand: 99_999, mixedOperands: 10, decimalPlaces: 4,
  questionSeconds: 3600, sessionSeconds: 86_400, feedbackMs: 5000,
  answerChars: 64, expressionTokens: 128, expressionDepth: 16,
  generationAttempts: 80, repeatAttempts: 20,
});

export const DEFAULT_TIMERS = Object.freeze({
  timedQuestion: false, questionSeconds: 20, sessionSeconds: 0, feedbackMs: 1000,
});

export const OPERATORS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
export const STATUS = { correct: 'Đúng', incorrect: 'Sai', skipped: 'Bỏ qua', timeout: 'Hết giờ' };
