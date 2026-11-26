import { LevelRegistry } from '../core/level-registry.js';
import { level1 } from './level-1.js';
import { level11 } from './level-1-1.js';
import { level2 } from './level-2.js';
import { level3 } from './level-3.js';
import { level31 } from './level-3-1.js';

export const levelRegistry = new LevelRegistry()
  .register(level1).register(level11).register(level2).register(level3).register(level31);
