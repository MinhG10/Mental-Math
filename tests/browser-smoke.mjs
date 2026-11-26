import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const prefix = '/MentalMath/';
const candidates = [
  process.env.MENTAL_MATH_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const executable = candidates.find(path => path && existsSync(path));
assert(executable, 'Set MENTAL_MATH_BROWSER to the path of a Chromium browser.');

const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png',
};
let offline = false;
let offlineRequests = 0;
let updateWorker = false;
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
  if (offline) { offlineRequests++; response.writeHead(503).end(); return; }
  const file = resolve(root, pathname.slice(prefix.length) || 'index.html');
  if (relative(root, file).startsWith('..')) { response.writeHead(403).end(); return; }
  try {
    let content = await readFile(file);
    if (updateWorker && pathname === prefix + 'sw.js') {
      content = content.toString('utf8').replace(/^const cacheName = prefix \+ '[^']+';/m, "const cacheName = prefix + 'smoke-update';");
    }
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] }).end(content);
  } catch {
    response.writeHead(404).end();
  }
});

async function until(check, label) {
  const end = Date.now() + 12_000;
  while (Date.now() < end) {
    const result = await check();
    if (result) return result;
    await delay(30);
  }
  throw new Error(`Timed out: ${label}`);
}

const profile = await mkdtemp(join(tmpdir(), 'mental-math-browser-'));
let browser;
let socket;
try {
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}${prefix}`;
  browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: 'ignore', windowsHide: true });
  const port = await until(async () => {
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; }
    catch { return null; }
  }, 'Chromium DevTools');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let next = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const packet = JSON.parse(event.data);
    if (packet.method === 'Runtime.exceptionThrown') errors.push(packet.params.exceptionDetails.exception?.description);
    if (packet.method === 'Runtime.consoleAPICalled' && packet.params.type === 'error') {
      errors.push(packet.params.args.map(arg => arg.value ?? arg.description).join(' '));
    }
    if (packet.method === 'Page.javascriptDialogOpening') void send('Page.handleJavaScriptDialog', { accept: true });
    if (pending.has(packet.id)) {
      const { resolve, reject, timer } = pending.get(packet.id);
      clearTimeout(timer);
      pending.delete(packet.id);
      if (packet.error) reject(new Error(packet.error.message));
      else resolve(packet.result);
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`DevTools timed out: ${method}`));
      }, 12_000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(source) {
    const result = await send('Runtime.evaluate', {
      expression: `(async () => { const q = (selector) => document.querySelector(selector); ${source} })()`,
      awaitPromise: true, returnByValue: true, userGesture: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
  async function waitFor(source, label) {
    await until(() => evaluate('return Boolean(' + source + ')'), label);
  }
  async function reloadAndWait() {
    const before = await evaluate('return performance.timeOrigin');
    await send('Page.reload');
    await waitFor(`performance.timeOrigin !== ${before} && q('#level-select')?.options.length === 5`, 'reloaded app');
  }
  const click = id => evaluate(`q(${JSON.stringify('#' + id)}).click();`);
  const control = (id, value) => evaluate(`
    const input = q(${JSON.stringify('#' + id)});
    input[${typeof value === 'boolean' ? "'checked'" : "'value'"}] = ${JSON.stringify(value)};
    input.dispatchEvent(new Event('change', { bubbles: true }));
  `);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: url + 'tests/test-runner.html' });
  await waitFor("q('#summary')?.dataset.complete", 'browser unit tests');
  assert.equal(await evaluate("return q('#summary').dataset.complete"), 'pass');
  assert.equal(await evaluate('return document.documentElement.lang'), 'en');
  console.log('PASS Browser unit test runner under /MentalMath/');

  await send('Page.navigate', { url });
  await waitFor("q('#level-select')?.options.length === 5 && navigator.serviceWorker.controller", 'app and service worker');
  assert.equal(await evaluate('return document.documentElement.lang'), 'en');
  assert.deepEqual(await evaluate("return [...document.querySelectorAll('main h1')].map(heading => heading.textContent)"),
    ['Practice', 'History', 'Statistics']);
  assert.equal(await evaluate("return (await (await fetch('./manifest.json')).json()).lang"), 'en');
  assert.equal(await evaluate("return q('#answer').inputMode"), 'decimal');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width <= 390 });
    assert(await evaluate(`return document.documentElement.scrollWidth <= ${width}`), `practice overflows at ${width}px`);
    assert(await evaluate("return q('.play-card').getBoundingClientRect().width > 250"));
  }
  console.log('PASS Responsive practice layout at 1440, 1024, 768, 390 and 320px');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await control('level-limit', 'custom');
  await control('level-limit-custom', '0');
  await click('start');
  assert(await evaluate("return !q('#settings-error').hidden && !q('#play-idle').hidden"));
  await control('level-limit', '99');
  await evaluate(`
    for (const box of document.querySelectorAll('#level-fields .options input')) box.checked = box.value === '+';
  `);
  await control('timer-feedbackMs', '100');
  await click('start');
  assert.deepEqual(await evaluate("return [document.activeElement.id, q('#settings-fields').disabled, q('#settings-error').textContent]"), ['answer', true, '']);
  await evaluate("q('#answer-form').requestSubmit()");
  assert(await evaluate("return !q('#answer-error').hidden"));
  await click('pause');
  assert(await evaluate("return !q('#play-paused').hidden && q('#play-question').hidden"));
  await click('resume');
  assert(await evaluate("return document.activeElement.id === 'answer'"));
  await evaluate(`
    const answer = q('#expression').textContent.split(' + ').map(Number).reduce((a, b) => a + b);
    q('#answer').value = answer;
  `);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await waitFor("q('#question-number').textContent === 'QUESTION 2'", 'Enter and next question');
  await evaluate("q('#answer').value = '-1'; q('#answer-form').requestSubmit()");
  await waitFor("q('#question-number').textContent === 'QUESTION 3'", 'wrong answer and next question');
  await click('skip');
  await click('finish');
  await click('tab-history');
  await evaluate("q('.history-entry').open = true");
  await waitFor("q('.history-entry tbody')?.rows.length === 3", 'history detail');
  await evaluate("const field = q('.history-details input'); field.click()");
  assert.equal(await evaluate("return q('.history-entry tbody').rows.length"), 1);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  assert(await evaluate('return document.documentElement.scrollWidth <= 390'));
  await click('tab-statistics');
  assert.equal(await evaluate("return document.querySelectorAll('.chart').length"), 4);
  await control('stats-filter', '2');
  assert.equal(await evaluate("return document.querySelectorAll('.chart').length"), 0);
  await control('stats-filter', '1');
  assert.equal(await evaluate("return document.querySelectorAll('.chart').length"), 4);
  assert(await evaluate('return document.documentElement.scrollWidth <= 390'));
  console.log('PASS Practice by keyboard, pause/resume, wrong-answer review and four filtered charts');

  await click('tab-practice');
  await control('timer-timedQuestion', true);
  await control('timer-questionSeconds', 'custom');
  await control('timer-questionSeconds-custom', '1');
  await control('timer-sessionSeconds', 'custom');
  await control('timer-sessionSeconds-custom', '2');
  await click('restart');
  assert(await evaluate("return !q('#question-timer').hidden && !q('#session-timer').hidden"));
  await waitFor("!q('#play-summary').hidden", 'challenge deadline');
  const stored = await evaluate("return JSON.parse(localStorage.getItem('mental-math.history')).value");
  assert.equal(stored.length, 2);
  assert.equal(stored[0].durationMs, 2000);
  assert.equal(stored[0].stats.timeout, 2);
  console.log('PASS Question countdown and independent challenge deadline');

  await reloadAndWait();
  await waitFor("q('#timer-questionSeconds-custom')?.value === '1'", 'saved settings after reload');
  await click('tab-history');
  assert.equal(await evaluate("return document.querySelectorAll('.history-entry').length"), 2);
  const cachedPaths = await evaluate(`
    const name = (await caches.keys()).find(item => item.includes('mental-math:'));
    return (await (await caches.open(name)).keys()).map(item => new URL(item.url).pathname);
  `);
  assert(cachedPaths.includes(prefix + 'assets/icons/apple-touch-icon.png'));
  assert(cachedPaths.includes(prefix + 'js/app.js'));
  const previousCache = await evaluate("return (await caches.keys()).find(name => name.includes('mental-math:'))");
  updateWorker = true;
  await evaluate('await (await navigator.serviceWorker.ready).update()');
  await until(async () => {
    const names = await evaluate('return await caches.keys()');
    return !names.includes(previousCache) && names.some(name => name.endsWith(':smoke-update'));
  }, 'new service worker and cache cleanup');
  console.log('PASS Service Worker update activates and removes the previous cache');

  offline = true;
  await reloadAndWait();
  const blockedAssets = offlineRequests;
  await click('start');
  await waitFor("!q('#play-question').hidden", 'offline practice');
  await click('finish');
  await click('tab-history');
  assert.equal(await evaluate("return document.querySelectorAll('.history-entry').length"), 2);
  await click('clear-history');
  await waitFor("!q('.history-entry')", 'confirmed clear history');
  assert.equal(offlineRequests, blockedAssets);
  assert.deepEqual(errors, []);
  console.log('PASS Saved settings and history survive reload. PWA shell, practice and history work offline.');
} finally {
  socket?.close();
  if (browser?.pid && browser.exitCode === null && browser.signalCode === null) {
    const exit = new Promise(resolve => browser.once('exit', resolve));
    browser.kill();
    await Promise.race([exit, delay(2000)]);
  }
  server.closeAllConnections();
  server.close();
  const child = relative(tmpdir(), profile);
  if (/^mental-math-browser-[a-z0-9]+$/i.test(child)) {
    await rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
  }
}
