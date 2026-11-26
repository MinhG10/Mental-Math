export function summarizeQuestions(questions) {
  const stats = {
    total: 0, correct: 0, incorrect: 0, skipped: 0, timeout: 0, accuracy: 0,
    responseCount: 0, responseTotalMs: 0, averageMs: null, fastestMs: null, slowestMs: null,
    currentStreak: 0, bestStreak: 0,
  };
  for (const question of questions) addResult(stats, question);
  return stats;
}

export function addResult(stats, { status, responseMs }) {
  stats.total++;
  stats[status]++;
  stats.accuracy = stats.correct / stats.total * 100;
  stats.currentStreak = status === 'correct' ? stats.currentStreak + 1 : 0;
  stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  if (status === 'correct' || status === 'incorrect') {
    stats.responseCount++;
    stats.responseTotalMs += responseMs;
    stats.averageMs = stats.responseTotalMs / stats.responseCount;
    stats.fastestMs = Math.min(stats.fastestMs ?? responseMs, responseMs);
    stats.slowestMs = Math.max(stats.slowestMs ?? responseMs, responseMs);
  }
}

export function summarizeHistory(sessions) {
  const totals = {
    sessions: sessions.length, total: 0, correct: 0, incorrect: 0, skipped: 0, timeout: 0,
    accuracy: 0, responseCount: 0, responseTotalMs: 0, averageMs: null, bestStreak: 0,
  };
  for (const session of sessions) {
    const stats = session.stats;
    for (const key of ['total', 'correct', 'incorrect', 'skipped', 'timeout', 'responseCount', 'responseTotalMs']) {
      totals[key] += stats[key];
    }
    totals.bestStreak = Math.max(totals.bestStreak, stats.bestStreak);
  }
  if (totals.total) totals.accuracy = totals.correct / totals.total * 100;
  if (totals.responseCount) totals.averageMs = totals.responseTotalMs / totals.responseCount;
  return totals;
}
