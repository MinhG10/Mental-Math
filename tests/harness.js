const tests = [];
export const test = (name, run) => tests.push({ name, run });
export function assert(condition, message = 'Điều kiện kiểm thử không đúng') {
  if (!condition) throw new Error(message);
}
export function equal(actual, expected) {
  assert(Object.is(actual, expected), `Nhận ${actual}, mong đợi ${expected}`);
}
export function throws(run, pattern) {
  try { run(); } catch (error) {
    assert(pattern.test(error.message), error.message);
    return;
  }
  throw new Error('Mong đợi một ngoại lệ.');
}
export function runTests() {
  return tests.map(({ name, run }) => {
    try { run(); return { name, passed: true }; }
    catch (error) { return { name, passed: false, error: error.stack }; }
  });
}
export function seededRandom(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
