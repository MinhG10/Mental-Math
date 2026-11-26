import { DEFAULT_TIMERS, LIMITS } from '../config.js';
import { boundedInteger, validateTimers } from '../utils/validation-utils.js';
import { byId, element, fillOptions, message } from './dom.js';

function fieldControl(field, initial, prefix) {
  const id = `${prefix}-${field.key}`;
  const node = element(field.type === 'multi' ? 'fieldset' : 'div');
  const input = element('input');
  input.id = id;
  if (field.type === 'checkbox') {
    const label = element('label', 'option');
    input.type = 'checkbox';
    input.checked = initial === true;
    label.append(input, document.createTextNode(field.label));
    node.append(label);
    return { node, read: () => input.checked };
  }
  if (field.type === 'multi') {
    const options = element('div', 'options');
    const checkboxes = Object.entries(field.options).map(([key, label]) => {
      const wrapper = element('label', 'option');
      const checkbox = element('input');
      checkbox.type = 'checkbox';
      checkbox.value = key;
      checkbox.checked = initial?.includes(key) === true;
      wrapper.append(checkbox, document.createTextNode(label));
      options.append(wrapper);
      return checkbox;
    });
    node.append(element('legend', 'field-label', field.label), options);
    return { node, read: () => checkboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value) };
  }
  const label = element('label', 'field-label', field.label);
  label.htmlFor = id;
  node.append(label);
  if (field.type === 'select') {
    const select = element('select');
    select.id = id;
    fillOptions(select, Object.entries(field.options));
    select.value = initial;
    node.append(select);
    return { node, read: () => select.value };
  }
  input.type = 'text';
  input.inputMode = 'numeric';
  input.maxLength = 12;
  input.value = initial ?? '';
  if (field.type === 'integer') {
    node.append(input);
    return { node, read: () => input.value };
  }
  const select = element('select');
  select.id = id;
  fillOptions(select, field.presets.map(value => [value, field.presetLabels?.[value] ?? value]));
  select.add(new Option('Custom', 'custom'));
  select.value = field.presets.includes(initial) ? String(initial) : 'custom';
  input.id = id + '-custom';
  input.setAttribute('aria-label', 'Custom value for ' + field.label.toLowerCase());
  input.placeholder = `${field.customMin ?? field.min}–${field.max}`;
  input.className = 'custom-value';
  const update = () => { input.hidden = select.value !== 'custom'; };
  select.addEventListener('change', update);
  update();
  node.append(select, input);
  return {
    node,
    read: () => {
      if (select.value !== 'custom') return select.value;
      if (field.customMin !== undefined) return boundedInteger(input.value, field.customMin, field.max, field.label);
      return input.value;
    },
  };
}

function buildFields(container, schema, values, prefix) {
  const controls = schema.map(field => [field.key, fieldControl(field, values[field.key], prefix)]);
  container.replaceChildren(...controls.map(([, control]) => control.node));
  return Object.fromEntries(controls);
}

const readFields = controls => Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.read()]));
const timerSchema = [
  { key: 'timedQuestion', label: 'Set a time limit per question', type: 'checkbox' },
  { key: 'questionSeconds', label: 'Time per question (seconds)', type: 'range', presets: [10, 20, 30], min: 1, max: LIMITS.questionSeconds },
  { key: 'sessionSeconds', label: 'Session time limit (seconds)', type: 'range', presets: [0, 30, 60, 120], presetLabels: { 0: 'No limit' }, min: 0, customMin: 1, max: LIMITS.sessionSeconds },
  { key: 'feedbackMs', label: 'Feedback duration (ms)', type: 'integer', min: 0, max: LIMITS.feedbackMs },
];

export function setupSettings(registry, saved, { onStart, onSave }) {
  const form = byId('settings-form');
  const select = byId('level-select');
  const error = byId('settings-error');
  const levels = {};
  for (const level of registry.list()) {
    try { levels[level.id] = level.validateSettings(saved?.levels[level.id]); }
    catch { levels[level.id] = level.getDefaultSettings(); }
  }
  let timers;
  try { timers = validateTimers(saved?.timers); }
  catch { timers = DEFAULT_TIMERS; }
  const timerControls = buildFields(byId('timer-fields'), timerSchema, timers, 'timer');
  let levelId = Object.hasOwn(levels, saved?.levelId) ? saved.levelId : registry.list()[0].id;
  let levelControls;
  fillOptions(select, registry.list().map(level => [level.id, `Level ${level.id} · ${level.title ?? level.name}`]));
  select.value = levelId;
  function renderLevel() {
    const level = registry.get(levelId);
    byId('level-description').textContent = level.description ?? '';
    levelControls = buildFields(byId('level-fields'), level.getSettingsSchema(), levels[levelId], 'level');
  }
  function collect() {
    const settings = registry.get(levelId).validateSettings(readFields(levelControls));
    timers = validateTimers(readFields(timerControls));
    levels[levelId] = settings;
    return { levelId, settings, timers };
  }
  function save() { onSave({ levelId, levels, timers }); }
  function updateTimer() { timerControls.questionSeconds.node.hidden = !timerControls.timedQuestion.read(); }
  renderLevel();
  updateTimer();
  form.addEventListener('change', event => {
    if (event.target === select) {
      levelId = select.value;
      renderLevel();
    }
    updateTimer();
    try {
      collect();
      save();
      message(error, '');
    } catch (exception) { message(error, exception.message); }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (byId('settings-fields').disabled) return;
    try {
      const configuration = collect();
      save();
      onStart(configuration);
      message(error, '');
    } catch (exception) {
      message(error, exception.message);
      error.scrollIntoView({ block: 'nearest' });
    }
  });
}
