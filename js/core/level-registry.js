export class LevelRegistry {
  #levels = new Map();

  register(level) {
    if (!level.id || this.#levels.has(level.id) || !level.name ||
        ['getDefaultSettings', 'getSettingsSchema', 'validateSettings', 'generateQuestion'].some(key => typeof level[key] !== 'function')) {
      throw new TypeError('The level is invalid or already registered.');
    }
    this.#levels.set(level.id, level);
    return this;
  }

  get(id) {
    const level = this.#levels.get(id);
    if (!level) throw new RangeError('This level is not registered.');
    return level;
  }

  list() { return [...this.#levels.values()]; }
}
