import { runTests } from './suite.js';

const results = runTests();
for (const { name, passed, error } of results) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  if (!passed) console.error(error);
}
const passed = results.filter(item => item.passed).length;
console.log(`${passed}/${results.length} passed`);
process.exitCode = Number(passed !== results.length);
