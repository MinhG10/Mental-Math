export class Timer {
  constructor(startedAt, limitMs = null) {
    this.limitMs = limitMs;
    this.startedAt = startedAt;
    this.accumulated = 0;
  }

  elapsed(now) {
    const elapsed = this.accumulated + (this.startedAt === null ? 0 : Math.max(0, now - this.startedAt));
    return this.limitMs === null ? elapsed : Math.min(elapsed, this.limitMs);
  }

  remaining(now) {
    return this.limitMs === null ? null : this.limitMs - this.elapsed(now);
  }

  deadline() {
    return this.startedAt === null || this.limitMs === null
      ? Infinity : this.startedAt + this.limitMs - this.accumulated;
  }

  pause(now) {
    this.accumulated = this.elapsed(now);
    this.startedAt = null;
  }

  resume(now) {
    if (this.startedAt === null) this.startedAt = now;
  }
}
