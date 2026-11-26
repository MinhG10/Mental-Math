import { PracticeEngine } from './core/practice-engine.js';
import { QuestionEngine } from './core/question-engine.js';
import { levelRegistry } from './levels/index.js';
import { keys, StorageService } from './services/storage-service.js';
import { byId, message } from './ui/dom.js';
import { renderHistory } from './ui/history-ui.js';
import { setupPractice } from './ui/practice-ui.js';
import { setupSettings } from './ui/settings-ui.js';
import { renderStatistics, setupStatistics } from './ui/statistics-ui.js';

const storage = new StorageService();
const label = id => {
  const level = levelRegistry.list().find(item => item.id === id);
  return `Level ${id}${level ? ' · ' + (level.title ?? level.name) : ''}`;
};
const notices = new Map();
function notice(key, text = '') {
  if (text) notices.set(key, text);
  else notices.delete(key);
  message(byId('storage-notice'), [...notices.values()].join(' '));
}

let settings;
try { settings = storage.readSettings(); }
catch (error) { notice('settings', `Could not load settings. ${error.message}`); }

let tab = 'practice';
let sessions = [];
const tabs = [...document.querySelectorAll('[role="tab"]')];
function renderTab() {
  if (tab === 'history') renderHistory(sessions, levelRegistry, label);
  if (tab === 'statistics') renderStatistics(sessions, levelRegistry, label);
}
function refreshHistory() {
  try {
    sessions = storage.readHistory();
    notice('history-read');
  } catch (error) {
    notice('history-read', `Could not load history. ${error.message}`);
  }
  byId('clear-history').disabled = !sessions.length && !notices.has('history-read') && !storage.pending.size;
  byId('retry-save').hidden = !storage.pending.size;
  renderTab();
}
function selectTab(value, focus = false) {
  tab = value;
  for (const button of tabs) {
    const selected = button.dataset.tab === value;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    byId(button.dataset.tab).hidden = !selected;
    if (focus && selected) button.focus();
  }
  renderTab();
}
tabs.forEach((button, index) => {
  button.addEventListener('click', () => selectTab(button.dataset.tab));
  button.addEventListener('keydown', event => {
    const targets = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    selectTab(tabs[targets[event.key]].dataset.tab, true);
  });
});
setupStatistics(levelRegistry, renderTab);
byId('clear-history').addEventListener('click', () => {
  if (!globalThis.confirm('Clear all practice history in this browser?')) return;
  try {
    storage.clearHistory();
    notice('history-write');
  } catch (error) { notice('history-write', `Could not clear history. ${error.message}`); }
  refreshHistory();
});
byId('retry-save').addEventListener('click', () => {
  try { storage.retry(); notice('history-write'); }
  catch (error) { notice('history-write', `Could not save the session. ${error.message}`); }
  refreshHistory();
});
window.addEventListener('storage', event => {
  if (event.key === null || event.key === keys.history) refreshHistory();
});

let previousResult;
const engine = new PracticeEngine(new QuestionEngine(levelRegistry), {
  onChange(snapshot) {
    renderPractice(snapshot);
    if (!snapshot.result || snapshot.result === previousResult) return;
    previousResult = snapshot.result;
    try {
      storage.saveSession(snapshot.result);
      if (!storage.pending.size) notice('history-write');
    } catch (error) {
      notice('history-write', `The session could not be saved. Retry from History before closing this page. ${error.message}`);
    }
    refreshHistory();
  },
});
const renderPractice = setupPractice(engine, label);
setupSettings(levelRegistry, settings, {
  onStart: ({ levelId, settings: levelSettings, timers }) => engine.start(levelId, levelSettings, timers),
  onSave(configuration) {
    try { storage.saveSettings(configuration); notice('settings'); }
    catch (error) { notice('settings', `Could not save settings. ${error.message}`); }
  },
});
document.addEventListener('visibilitychange', () => { if (engine.active) engine.tick(); });
window.addEventListener('pageshow', () => { if (engine.active) engine.tick(); });
window.addEventListener('beforeunload', event => {
  if (engine.active || storage.pending.size) {
    event.preventDefault();
    event.returnValue = '';
  }
});
engine.tick();
refreshHistory();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {
    notice('offline', 'Offline mode could not be enabled in this browser.');
  });
}
