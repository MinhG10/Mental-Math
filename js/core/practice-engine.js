import { Timer } from './timer.js';
import { SessionManager } from './session-manager.js';

export class PracticeEngine {
  constructor(questions, {
    now = () => performance.now(),
    schedule = (callback, delay) => setTimeout(callback, delay),
    cancel = handle => clearTimeout(handle),
    onChange = () => {},
  } = {}) {
    Object.assign(this, { questions, now, schedule, cancel, onChange, state: 'idle', handle: null });
  }

  get active() { return ['question', 'feedback', 'paused'].includes(this.state); }

  start(levelId, settings, timers) {
    if (this.active) return;
    this.questions.reset();
    const first = this.questions.generate(levelId, settings);
    this.manager = new SessionManager(levelId, settings, timers);
    const time = this.now();
    this.sessionClock = new Timer(time, timers.sessionSeconds ? timers.sessionSeconds * 1000 : null);
    this.error = '';
    this.result = null;
    this.openQuestion(first, time);
    this.publish(time);
  }

  openQuestion(question, time) {
    const { timedQuestion, questionSeconds } = this.manager.session.timers;
    this.question = question;
    this.state = 'question';
    this.phaseClock = new Timer(time, timedQuestion ? questionSeconds * 1000 : null);
    this.feedback = null;
    this.inputError = '';
  }

  record(status, input, time, feedbackAt = time) {
    this.manager.record(this.question, status, input, this.phaseClock.elapsed(time));
    this.state = 'feedback';
    this.feedback = { status, question: this.question };
    this.inputError = '';
    this.phaseClock = new Timer(feedbackAt, this.manager.session.timers.feedbackMs);
  }

  advance(time) {
    if (!this.active || this.state === 'paused') return;
    const sessionEnd = this.sessionClock.deadline();
    // A late browser callback still records the earlier deadline exactly once.
    if (this.state === 'question') {
      const deadline = Math.min(this.phaseClock.deadline(), sessionEnd);
      if (time >= deadline) this.record('timeout', null, deadline, time);
    }
    if (time >= sessionEnd) {
      this.complete(sessionEnd, 'challenge');
    } else if (this.state === 'feedback' && time >= this.phaseClock.deadline()) {
      try {
        const { levelId, settings } = this.manager.session;
        this.openQuestion(this.questions.generate(levelId, settings), this.now());
      } catch (error) {
        this.error = error.message;
        this.complete(time, 'generation-error');
      }
    }
  }

  tick() {
    const time = this.now();
    this.advance(time);
    this.publish(this.now());
  }

  submit(input, questionId = this.question?.id) {
    const time = this.now();
    this.advance(time);
    if (this.state === 'question' && this.question.id === questionId) {
      const answer = this.questions.check(input, this.question, this.manager.session.settings);
      if (answer.valid) this.record(answer.correct ? 'correct' : 'incorrect', answer.input, time);
      else this.inputError = answer.message;
    }
    this.publish(this.now());
  }

  skip(questionId = this.question?.id) {
    const time = this.now();
    this.advance(time);
    if (this.state === 'question' && this.question.id === questionId) this.record('skipped', null, time);
    this.publish(this.now());
  }

  pause() {
    const time = this.now();
    this.advance(time);
    if (this.active && this.state !== 'paused') {
      this.pausedState = this.state;
      this.state = 'paused';
      this.sessionClock.pause(time);
      this.phaseClock.pause(time);
    }
    this.publish(this.now());
  }

  resume() {
    if (this.state !== 'paused') return;
    const time = this.now();
    this.state = this.pausedState;
    this.sessionClock.resume(time);
    this.phaseClock.resume(time);
    this.publish(time);
  }

  finish() {
    const time = this.now();
    if (this.active && this.state !== 'paused' && this.sessionClock.remaining(time) === 0) {
      this.advance(time);
    } else if (this.active) {
      if (this.state === 'question' && this.phaseClock.remaining(time) === 0) {
        this.record('timeout', null, this.phaseClock.deadline());
      }
      this.complete(time, 'finished');
    }
    this.publish(this.now());
  }

  complete(time, reason) {
    this.result = this.manager.finish(this.sessionClock.elapsed(time), reason);
    this.state = 'finished';
  }

  publish(time) {
    if (this.handle !== null) this.cancel(this.handle);
    this.handle = null;
    const running = this.active && this.state !== 'paused';
    if (running) {
      const deadline = Math.min(this.phaseClock.deadline(), this.sessionClock.deadline());
      const delay = Math.max(0, Math.min(100, deadline - time));
      this.handle = this.schedule(() => {
        this.handle = null;
        this.tick();
      }, delay);
    }
    this.onChange({
      state: this.state, active: this.active,
      question: this.state === 'question' ? this.question : null,
      feedback: this.state === 'feedback' || this.state === 'finished' ? this.feedback : null,
      inputError: this.inputError, error: this.error, result: this.result,
      session: this.manager?.session, elapsed: this.active ? this.sessionClock.elapsed(time) : this.result?.durationMs ?? 0,
      sessionRemaining: this.sessionClock?.remaining(time),
      questionRemaining: this.state === 'question' ? this.phaseClock.remaining(time) : null,
    });
  }
}
