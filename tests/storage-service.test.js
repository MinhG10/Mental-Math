import { DEFAULT_TIMERS } from '../js/config.js';
import { keys, schemaVersion, StorageService } from '../js/services/storage-service.js';
import { equal, test, throws } from './harness.js';
import { sampleSession } from './session-manager.test.js';

class MemoryStorage {
  data = new Map();
  full = false;
  getItem(key) { return this.data.get(key) ?? null; }
  removeItem(key) { this.data.delete(key); }
  setItem(key, value) {
    if (this.full) throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
    this.data.set(key, value);
  }
}

test('Storage starts empty and restores saved settings and history in a new instance', () => {
  const adapter = new MemoryStorage();
  const service = new StorageService(adapter);
  equal(service.readHistory().length, 0);
  equal(service.readSettings(), null);
  service.saveSettings({ levelId: '3.1', levels: { '3.1': { mode: 'mixed' } }, timers: DEFAULT_TIMERS });
  service.saveSession(sampleSession());
  const fresh = new StorageService(adapter);
  equal(fresh.readSettings().levelId, '3.1');
  equal(fresh.readHistory()[0].questions[0].correctAnswer, '2');
  equal(JSON.parse(adapter.getItem(keys.history)).schemaVersion, schemaVersion);
});

test('Storage keeps the 30 most recent sessions and omits sessions without completed questions', () => {
  const service = new StorageService(new MemoryStorage());
  service.saveSession(sampleSession(0, []));
  equal(service.readHistory().length, 0);
  for (let i = 0; i < 31; i++) service.saveSession(sampleSession(i));
  equal(service.readHistory().length, 30);
  equal(new Date(service.readHistory()[0].startedAt).getSeconds(), 30);
  equal(new Date(service.readHistory().at(-1).startedAt).getSeconds(), 1);
  const tied = sampleSession(30);
  service.saveSession(tied);
  equal(service.readHistory()[0].id, tied.id);
  service.clearHistory();
  equal(service.readHistory().length, 0);
});

test('Storage reports invalid JSON, unsupported versions, quota errors, and blocked access', () => {
  const adapter = new MemoryStorage();
  const service = new StorageService(adapter);
  adapter.setItem(keys.history, '{');
  throws(() => service.readHistory(), /JSON/);
  throws(() => service.saveSession(sampleSession()), /JSON/);
  equal(adapter.getItem(keys.history), '{');
  adapter.removeItem(keys.history);
  adapter.full = true;
  throws(() => service.retry(), /storage is full/);
  equal(service.pending.size, 1);
  equal(service.readHistory().length, 0);
  adapter.full = false;
  service.retry();
  equal(service.readHistory().length, 1);
  adapter.setItem(keys.settings, '{"schemaVersion":99,"value":null}');
  throws(() => service.readSettings(), /storage version/);
  const blocked = new StorageService({ setItem() { throw new Error('blocked'); } });
  throws(() => blocked.saveSettings({}), /Could not write/);
});
