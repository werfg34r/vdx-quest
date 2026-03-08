// ═══════════════════════════════════════════════════════
// VDX QUEST - Village 1 Map
// ═══════════════════════════════════════════════════════
import { VILLAGE1_MAP, MAP_COLS, MAP_ROWS } from './constants.js';

const WALKABLE = new Set([1, 2, 3, 5, 6, 7, 8]);

export function getTerrain(col, row) {
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return 0;
  return VILLAGE1_MAP[row][col];
}

export function isWalkable(col, row) {
  return WALKABLE.has(getTerrain(col, row));
}

export function isBuildingPlot(col, row) {
  return getTerrain(col, row) === 5;
}
