import { LIMITS } from '../config.js';
import { createId } from '../utils/random-utils.js';
import { validateAnswer } from './answer-validator.js';

export class QuestionEngine {
  #seen = new Set();

  constructor(registry, rng = Math.random) {
    this.registry = registry;
    this.rng = rng;
  }

  reset() { this.#seen.clear(); }

  generate(levelId, settings) {
    const level = this.registry.get(levelId);
    let question;
    for (let attempt = 0; attempt < LIMITS.repeatAttempts; attempt++) {
      question = level.generateQuestion(settings, this.rng);
      const key = question.expression;
      if (!this.#seen.has(key)) break;
    }
    this.#seen.add(question.expression);
    return { ...question, id: createId(), levelId };
  }

  check(input, question, settings) {
    const level = this.registry.get(question.levelId);
    return (level.validateAnswer ?? validateAnswer)(input, question, settings);
  }
}
