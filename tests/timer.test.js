import { DEFAULT_TIMERS } from '../js/config.js';
import { PracticeEngine } from '../js/core/practice-engine.js';
import { QuestionEngine } from '../js/core/question-engine.js';
import { Timer } from '../js/core/timer.js';
import { validateTimers } from '../js/utils/validation-utils.js';
import { levelRegistry } from '../js/levels/index.js';
import { assert, equal, seededRandom, test, throws } from './harness.js';

function scenario(overrides = {}, registry = levelRegistry, id = '1') {
  let time = 0;
  let next = 0;
  let snapshot;
  const callbacks = new Map();
  const engine = new PracticeEngine(new QuestionEngine(registry, seededRandom(221)), {
    now: () => time,
    schedule: callback => { callbacks.set(++next, callback); return next; },
    cancel: key => callbacks.delete(key),
    onChange: state => { snapshot = state; },
  });
  engine.start(id, registry.get(id).getDefaultSettings(), { ...DEFAULT_TIMERS, ...overrides });
  return {
    engine, callbacks, get snapshot() { return snapshot; },
    move(ms, tick = true) { time += ms; if (tick) engine.tick(); },
  };
}

test('Timer đo bằng timestamp, giới hạn và loại thời gian Pause', () => {
  const timer = new Timer(0, 1000);
  equal(timer.elapsed(723), 723);
  timer.pause(800);
  equal(timer.remaining(10_000), 200);
  timer.resume(10_000);
  equal(timer.deadline(), 10_200);
  equal(timer.elapsed(20_000), 1000);
  equal(new Timer(0).remaining(999), null);
  for (const time of ['', -1, 0, 'abc', 3601]) {
    throws(() => validateTimers({ ...DEFAULT_TIMERS, timedQuestion: true, questionSeconds: time }), /số nguyên/);
  }
});

test('Submit đúng tại deadline, nhấn liên tiếp và callback trễ chỉ ghi một Timeout', () => {
  const run = scenario({ timedQuestion: true, questionSeconds: 1, sessionSeconds: 3 });
  const q = run.snapshot.question;
  run.move(1000, false);
  run.engine.submit(q.correctAnswer, q.id);
  run.engine.submit(q.correctAnswer, q.id);
  run.engine.skip(q.id);
  equal(run.snapshot.session.stats.timeout, 1);
  equal(run.snapshot.session.stats.total, 1);
  equal(run.snapshot.session.questions[0].responseMs, 1000);
  equal(run.callbacks.size, 1);
  run.move(10_000);
  equal(run.snapshot.result.durationMs, 3000);
  equal(run.snapshot.result.stats.total, 1);
  equal(run.callbacks.size, 0);
});

test('Challenge tự kết thúc dù trình duyệt trì hoãn, có hoặc không có timer từng câu', () => {
  for (const timedQuestion of [true, false]) {
    const run = scenario({ timedQuestion, questionSeconds: 5, sessionSeconds: 2 });
    run.move(12_500);
    equal(run.snapshot.state, 'finished');
    equal(run.snapshot.result.durationMs, 2000);
    equal(run.snapshot.result.questions[0].responseMs, 2000);
    equal(run.snapshot.result.stats.timeout, 1);
  }
});

test('Pause và Resume đóng băng cả hai timer, ẩn câu và ngăn ghi kết quả', () => {
  const run = scenario({ timedQuestion: true, questionSeconds: 2, sessionSeconds: 9 });
  const q = run.snapshot.question;
  run.move(500);
  run.engine.pause();
  equal(run.callbacks.size, 0);
  equal(run.snapshot.question, null);
  run.move(12_000);
  run.engine.submit(q.correctAnswer, q.id);
  equal(run.snapshot.session.stats.total, 0);
  equal(run.snapshot.sessionRemaining, 8500);
  run.engine.resume();
  equal(run.snapshot.questionRemaining, 1500);
  run.move(400);
  run.engine.submit(q.correctAnswer, q.id);
  equal(run.snapshot.session.stats.averageMs, 900);
  run.engine.pause();
  run.move(10_000);
  run.engine.resume();
  run.move(1000);
  equal(run.snapshot.state, 'question');
  run.move(100);
  run.engine.skip();
  equal(run.snapshot.session.questions[1].responseMs, 100);
  equal(run.snapshot.session.stats.averageMs, 900);
});

test('Submit lỗi, câu cũ, hết phản hồi và Finish bảo toàn kết quả', () => {
  const run = scenario({ feedbackMs: 0 });
  const q = run.snapshot.question;
  run.engine.submit('');
  assert(run.snapshot.inputError);
  equal(run.snapshot.session.stats.total, 0);
  run.move(99, false);
  run.engine.submit(q.correctAnswer, q.id);
  run.engine.submit(q.correctAnswer, q.id);
  assert(run.snapshot.question.id !== q.id);
  equal(run.snapshot.session.stats.total, 1);
  run.engine.finish();
  run.engine.finish();
  equal(run.snapshot.result.stats.total, 1);
  equal(run.snapshot.result.stats.averageMs, 99);
  equal(run.callbacks.size, 0);
});
