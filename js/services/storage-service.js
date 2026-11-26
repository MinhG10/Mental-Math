import { LIMITS, STATUS } from '../config.js';
import { summarizeQuestions } from './statistics-service.js';

export const keys = {
  history: 'mental-math.history', settings: 'mental-math.settings',
};
export const schemaVersion = 1;
const byNewest = (a, b) => b.startedAt.localeCompare(a.startedAt);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const validRecord = entry => object(entry) && typeof entry.expression === 'string' &&
  typeof entry.correctAnswer === 'string' && Object.hasOwn(STATUS, entry.status) &&
  (entry.userAnswer == null || typeof entry.userAnswer === 'string') &&
  (entry.metadata?.rounding === undefined || Number.isInteger(entry.metadata.rounding)) &&
  Number.isFinite(entry.responseMs) && entry.responseMs >= 0;
const validSession = entry => object(entry) && typeof entry.id === 'string' &&
  typeof entry.levelId === 'string' && typeof entry.startedAt === 'string' && Number.isFinite(Date.parse(entry.startedAt)) &&
  object(entry.settings) && object(entry.timers) && Number.isFinite(entry.durationMs) && entry.durationMs >= 0 &&
  Array.isArray(entry.questions) && entry.questions.length > 0 && entry.questions.every(validRecord);

export class StorageService {
  constructor(adapter) {
    this.adapter = adapter;
    this.pending = new Map();
  }

  get storage() { return this.adapter ?? globalThis.localStorage; }

  read(key, fallback) {
    const raw = this.storage.getItem(key);
    if (raw === null) return fallback;
    let data;
    try { data = JSON.parse(raw); } catch { throw new Error('Dữ liệu lưu trữ bị hỏng (JSON).'); }
    if (data?.schemaVersion !== schemaVersion || !Object.hasOwn(data, 'value')) {
      throw new Error('Phiên bản dữ liệu lưu trữ không được hỗ trợ.');
    }
    return data.value;
  }

  write(key, value) {
    try {
      this.storage.setItem(key, JSON.stringify({ schemaVersion, value }));
    } catch (error) {
      throw new Error(error.name === 'QuotaExceededError'
        ? 'Bộ nhớ trình duyệt đã đầy. Không thể lưu dữ liệu.'
        : 'Không thể ghi vào bộ nhớ trình duyệt.');
    }
  }

  readHistory() {
    const sessions = this.read(keys.history, []);
    if (!Array.isArray(sessions) || !sessions.every(validSession)) {
      throw new Error('Cấu trúc lịch sử luyện tập bị hỏng.');
    }
    return sessions.sort(byNewest).slice(0, LIMITS.history)
      .map(session => ({ ...session, stats: summarizeQuestions(session.questions) }));
  }

  saveSession(session) {
    if (!session.questions.length) return;
    this.pending.set(session.id, session);
    this.retry();
  }

  retry() {
    if (!this.pending.size) return;
    const entries = new Map([...this.pending].reverse());
    for (const session of this.readHistory()) {
      if (!entries.has(session.id)) entries.set(session.id, session);
    }
    this.write(keys.history, [...entries.values()].sort(byNewest).slice(0, LIMITS.history));
    this.pending.clear();
  }

  clearHistory() {
    this.storage.removeItem(keys.history);
    this.pending.clear();
  }

  readSettings() {
    const settings = this.read(keys.settings, null);
    if (settings !== null && (!object(settings) || !object(settings.levels) || !object(settings.timers))) {
      throw new Error('Cấu trúc cấu hình luyện tập bị hỏng.');
    }
    return settings;
  }

  saveSettings(settings) { this.write(keys.settings, settings); }
}
