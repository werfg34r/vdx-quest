// ═══════════════════════════════════════════════════════
// VDX QUEST - World Objects (trees, rocks)
// ═══════════════════════════════════════════════════════
import { TILE, FOREST_TREES, ROCK_POSITIONS } from './constants.js';

export function createWorldObjects() {
  const objects = [];

  for (let i = 0; i < FOREST_TREES.length; i++) {
    const t = FOREST_TREES[i];
    objects.push({
      id: `tree_${i}`, type: 'tree',
      tileX: t.x, tileY: t.y,
      x: t.x * TILE, y: t.y * TILE,
      hp: 2, maxHp: 2,
      alive: true,
      respawnTimer: 0, respawnTime: 600,
      shakeTimer: 0,
    });
  }

  for (let i = 0; i < ROCK_POSITIONS.length; i++) {
    const r = ROCK_POSITIONS[i];
    objects.push({
      id: `rock_${i}`, type: 'rock',
      tileX: r.x, tileY: r.y,
      x: r.x * TILE, y: r.y * TILE,
      hp: 2, maxHp: 2,
      alive: true,
      respawnTimer: 0, respawnTime: 900,
      shakeTimer: 0,
    });
  }

  return objects;
}

export function hitObject(obj) {
  if (!obj.alive) return null;
  obj.hp--;
  obj.shakeTimer = 15;
  if (obj.hp <= 0) {
    obj.alive = false;
    obj.respawnTimer = obj.respawnTime;
    return { item: obj.type === 'tree' ? 'wood' : 'rock', count: obj.type === 'tree' ? 1 : 1 };
  }
  return { item: null, count: 0 };
}

export function updateWorldObjects(objects) {
  for (const obj of objects) {
    if (obj.shakeTimer > 0) obj.shakeTimer--;
    if (!obj.alive) {
      obj.respawnTimer--;
      if (obj.respawnTimer <= 0) {
        obj.alive = true;
        obj.hp = obj.maxHp;
      }
    }
  }
}

export function getNearbyObject(objects, px, py) {
  const range = 2.5 * TILE;
  let best = null;
  let bestDist = range;
  for (const obj of objects) {
    if (!obj.alive) continue;
    const dist = Math.hypot(obj.x + TILE / 2 - px - TILE / 2, obj.y + TILE / 2 - py - TILE / 2);
    if (dist < bestDist) {
      best = obj;
      bestDist = dist;
    }
  }
  return best;
}
