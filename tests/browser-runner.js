import { runTests } from './suite.js';

const results = runTests();
const list = document.querySelector('#results');
for (const { name, passed, error } of results) {
  const item = document.createElement('li');
  item.textContent = `${passed ? 'PASS' : 'FAIL'} · ${name}`;
  if (!passed) {
    const details = document.createElement('pre');
    details.textContent = error;
    item.append(details);
  }
  list.append(item);
}
const summary = document.querySelector('#summary');
const count = results.filter(item => item.passed).length;
summary.textContent = `${count}/${results.length} tests passed`;
summary.dataset.complete = count === results.length ? 'pass' : 'fail';
