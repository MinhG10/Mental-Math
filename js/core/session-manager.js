import { createId } from '../utils/random-utils.js';
import { addResult, summarizeQuestions } from '../services/statistics-service.js';

export class SessionManager {
  constructor(levelId, settings, timers) {
    this.session = {
      id: createId(), startedAt: new Date().toISOString(), levelId,
      settings: structuredClone(settings), timers: { ...timers },
      durationMs: 0, stats: summarizeQuestions([]), questions: [],
    };
  }

  record(question, status, userAnswer, responseMs) {
    // Only the currently displayed question can enter here through Practice Engine.
    const record = {
      id: question.id, expression: question.expression, correctAnswer: question.correctAnswer,
      metadata: question.metadata, userAnswer, status, responseMs: Math.round(responseMs),
    };
    this.session.questions.push(record);
    addResult(this.session.stats, record);
  }

  finish(durationMs, reason) {
    this.session.durationMs = Math.round(durationMs);
    this.session.reason = reason;
    this.session.finishedAt = new Date().toISOString();
    return this.session;
  }
}
