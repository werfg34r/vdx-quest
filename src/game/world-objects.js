// ═══════════════════════════════════════════════════════
// VDX QUEST - World Objects - Trees & Rocks
// ═══════════════════════════════════════════════════════
import { TILE, WORLD_TREES, WORLD_ROCKS } from './constants.js';

export function createWorldObjects() {
  const objects = [];

  for (let i = 0; i < WORLD_TREES.length; i++) {
    const t = WORLD_TREES[i];
    objects.push({
      id: `tree_${i}`, type: 'tree',
      tileX: t.x, tileY: t.y,
      x: t.x * TILE, y: t.y * TILE,
      hp: 3, maxHp: 3,
      alive: true,
      respawnTimer: 0, respawnTime: 600,
      drop: 'wood', dropCount: 2,
      shakeTimer: 0,
    });
  }

  for (let i = 0; i < WORLD_ROCKS.length; i++) {
    const r = WORLD_ROCKS[i];
    objects.push({
      id: `rock_${i}`, type: 'rock',
      tileX: r.x, tileY: r.y,
      x: r.x * TILE, y: r.y * TILE,
      hp: 2, maxHp: 2,
      alive: true,
      respawnTimer: 0, respawnTime: 900,
      drop: 'rock', dropCount: 2,
      shakeTimer: 0,
    });
  }

  return objects;
}

export function hitObject(obj, toolType) {
  if (!obj.alive) return null;
  if (obj.type === 'tree' && toolType !== 'axe') return null;
  if (obj.type === 'rock' && toolType !== 'pickaxe') return null;

  obj.hp--;
  obj.shakeTimer = 15;

  if (obj.hp <= 0) {
    obj.alive = false;
    obj.respawnTimer = obj.respawnTime;
    return { item: obj.drop, count: obj.dropCount };
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

export function getNearbyObject(objects, px, py, toolType) {
  const range = 2.2 * TILE;
  let best = null;
  let bestDist = range;

  const wantType = toolType === 'axe' ? 'tree' : toolType === 'pickaxe' ? 'rock' : null;
  if (!wantType) return null;

  for (const obj of objects) {
    if (!obj.alive || obj.type !== wantType) continue;
    const dist = Math.hypot(obj.x + TILE / 2 - px, obj.y + TILE / 2 - py);
    if (dist < bestDist) { best = obj; bestDist = dist; }
  }
  return best;
}
