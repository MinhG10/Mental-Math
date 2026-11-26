import { LIMITS, STATUS } from '../config.js';
import { summarizeQuestions } from '../services/statistics-service.js';
import { formatDuration } from '../utils/format-utils.js';
import { byId, message, setText } from './dom.js';
import { renderMetrics, sessionMetrics } from './metrics-ui.js';

const labels = { idle: 'Ready', question: 'In progress', feedback: 'Feedback', paused: 'Paused', finished: 'Finished' };
const emptyStats = summarizeQuestions([]);
const seconds = ms => `${Math.ceil(ms / 1000)}s`;
const feedbackText = feedback => `Correct answer: ${feedback.question.correctAnswer}${feedback.question.metadata?.percent ? '%' : ''}`;

export function setupPractice(engine, levelLabel) {
  const answer = byId('answer');
  const questionTimer = byId('question-timer');
  const form = byId('answer-form');
  const panes = Object.fromEntries(['idle', 'question', 'feedback', 'paused', 'summary'].map(name => [name, byId('play-' + name)]));
  let shownQuestionId;
  let state;
  answer.maxLength = LIMITS.answerChars;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (state === 'question') engine.submit(answer.value, shownQuestionId);
  });
  byId('toggle-negative').addEventListener('click', () => {
    answer.value = answer.value.startsWith('-') ? answer.value.slice(1) : '-' + answer.value.replace(/^\+/, '');
    answer.focus();
  });
  byId('skip').addEventListener('click', () => engine.skip(shownQuestionId));
  byId('pause').addEventListener('click', () => engine.pause());
  byId('resume').addEventListener('click', () => engine.resume());
  byId('finish').addEventListener('click', () => engine.finish());

  return snapshot => {
    const { active, session, question, feedback, result } = snapshot;
    const previous = state;
    state = snapshot.state;
    const visible = state === 'finished' ? 'summary' : state;
    for (const [name, pane] of Object.entries(panes)) pane.hidden = name !== visible;
    setText(byId('practice-state'), labels[state]);
    byId('settings-fields').disabled = active;
    const layout = document.querySelector('.practice-layout');
    layout.classList.toggle('is-active', active);
    layout.classList.toggle('is-finished', state === 'finished');
    byId('play-controls').hidden = !active;
    byId('skip').hidden = state === 'paused';
    byId('skip').disabled = state !== 'question';
    byId('pause').hidden = state === 'paused';
    byId('resume').hidden = state !== 'paused';
    const sessionTimer = byId('session-timer');
    message(sessionTimer, active && snapshot.sessionRemaining !== null
      ? `${seconds(snapshot.sessionRemaining)} left in this session` : '');
    questionTimer.hidden = !question || snapshot.questionRemaining === null;
    if (!questionTimer.hidden) {
      const max = session.timers.questionSeconds * 1000;
      byId('question-progress').max = max;
      byId('question-progress').value = snapshot.questionRemaining;
      setText(byId('question-countdown'), seconds(snapshot.questionRemaining));
      questionTimer.classList.toggle('warning', snapshot.questionRemaining <= Math.min(5000, max * .25));
    }
    if (question && (shownQuestionId !== question.id || previous !== 'question')) {
      if (shownQuestionId !== question.id) answer.value = '';
      shownQuestionId = question.id;
      const expression = byId('expression');
      setText(expression, question.expression);
      expression.classList.toggle('long', question.expression.length > 24);
      setText(byId('question-number'), `QUESTION ${session.stats.total + 1}`);
      const rounding = question.metadata?.rounding;
      message(byId('question-hint'), rounding !== undefined ? `Round to ${rounding} decimal ${rounding === 1 ? 'place' : 'places'}.`
        : question.metadata?.percent ? 'Enter your answer as a percentage.' : '');
      if (!byId('practice').hidden) answer.focus({ preventScroll: previous === 'question' });
    }
    message(byId('answer-error'), snapshot.inputError);
    answer.setAttribute('aria-invalid', snapshot.inputError ? 'true' : 'false');
    if (feedback && state === 'feedback') {
      const title = byId('feedback-title');
      title.className = feedback.status;
      setText(title, STATUS[feedback.status]);
      setText(byId('feedback-answer'), feedbackText(feedback));
    }
    if (result && previous !== 'finished') {
      setText(byId('summary-caption'), snapshot.error || (result.reason === 'challenge'
        ? 'The session time limit has been reached.' : 'Your practice results are below.'));
      message(byId('summary-feedback'), result.reason === 'challenge' && feedback?.status === 'timeout' ? feedbackText(feedback) : '');
      renderMetrics(byId('summary-metrics'), sessionMetrics(result.stats, result.durationMs));
      if (!byId('practice').hidden) byId('restart').focus({ preventScroll: true });
    }
    if (state === 'paused' && previous !== 'paused' && !byId('practice').hidden) byId('resume').focus();
    setText(byId('live-level'), session ? levelLabel(session.levelId) : 'No session started');
    renderMetrics(byId('live-metrics'), sessionMetrics(session?.stats ?? emptyStats, snapshot.elapsed));
  };
}
