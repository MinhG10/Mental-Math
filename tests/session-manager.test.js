import { DEFAULT_TIMERS } from '../js/config.js';
import { SessionManager } from '../js/core/session-manager.js';
import { PracticeEngine } from '../js/core/practice-engine.js';
import { QuestionEngine } from '../js/core/question-engine.js';
import { LevelRegistry } from '../js/core/level-registry.js';
import { summarizeHistory } from '../js/services/statistics-service.js';
import { equal, test, throws } from './harness.js';

export function sampleSession(index = 0, results = [['correct', 500]]) {
  const manager = new SessionManager('1', { limit: 99 }, DEFAULT_TIMERS);
  manager.session.startedAt = new Date(2025, 0, 1, 0, 0, index).toISOString();
  const question = { id: 'q', expression: '1 + 1', correctAnswer: '2' };
  for (const [status, ms] of results) manager.record(question, status, status === 'correct' ? '2' : null, ms);
  return manager.finish(2000, 'finished');
}

test('Session and aggregate statistics use the correct denominators for accuracy and response time', () => {
  const session = sampleSession(0, [['correct', 500], ['correct', 1000], ['incorrect', 1500], ['skipped', 2000], ['timeout', 3000]]);
  const second = sampleSession(1, [['correct', 2000]]);
  equal(session.stats.total, 5);
  equal(session.stats.accuracy, 40);
  equal(session.stats.averageMs, 1000);
  equal(session.stats.fastestMs, 500);
  equal(session.stats.slowestMs, 1500);
  equal(session.stats.currentStreak, 0);
  equal(session.stats.bestStreak, 2);
  const aggregate = summarizeHistory([session, second]);
  equal(aggregate.accuracy, 50);
  equal(aggregate.averageMs, 1250);
  equal(aggregate.correct, 3);
  equal(aggregate.timeout, 1);
  equal(aggregate.skipped, 1);
  equal(aggregate.bestStreak, 2);
});

test('A new level and its custom validator work with the existing practice engine', () => {
  const level = {
    id: '4', name: 'Sample fractions', getDefaultSettings: () => ({}), getSettingsSchema: () => [],
    validateSettings: settings => settings,
    generateQuestion: () => ({ expression: '1 ÷ 2', correctAnswer: '0.5', answerType: 'decimal', metadata: {} }),
    validateAnswer: input => ({ valid: true, correct: input === '1/2', input }),
  };
  const registry = new LevelRegistry().register(level);
  throws(() => registry.register(level), /already registered/);
  const engine = new PracticeEngine(new QuestionEngine(registry), { now: () => 42, schedule: () => 1, cancel: () => {} });
  engine.start('4', {}, DEFAULT_TIMERS);
  engine.submit('1/2');
  engine.finish();
  equal(engine.result.stats.correct, 1);
  equal(engine.result.levelId, '4');
});
