// ═══════════════════════════════════════════════════════
// WORLD OBJECTS - Trees, Rocks, Fishing Spots
// ═══════════════════════════════════════════════════════
import { TILE, WORLD_TREES, WORLD_ROCKS, FISHING_SPOTS } from './constants.js';

export function createWorldObjects() {
  const objects = [];

  for (let i = 0; i < WORLD_TREES.length; i++) {
    const t = WORLD_TREES[i];
    objects.push({
      id: `tree_${i}`,
      type: 'tree',
      tileX: t.x, tileY: t.y,
      x: t.x * TILE, y: t.y * TILE,
      hp: 3, maxHp: 3,
      alive: true,
      respawnTimer: 0,
      respawnTime: 600, // ~10 seconds at 60fps
      drop: 'wood', dropCount: 2,
      shakeTimer: 0,
    });
  }

  for (let i = 0; i < WORLD_ROCKS.length; i++) {
    const r = WORLD_ROCKS[i];
    objects.push({
      id: `rock_${i}`,
      type: 'rock',
      tileX: r.x, tileY: r.y,
      x: r.x * TILE, y: r.y * TILE,
      hp: 2, maxHp: 2,
      alive: true,
      respawnTimer: 0,
      respawnTime: 900, // ~15 seconds
      drop: 'rock', dropCount: 3,
      shakeTimer: 0,
    });
  }

  for (let i = 0; i < FISHING_SPOTS.length; i++) {
    const f = FISHING_SPOTS[i];
    objects.push({
      id: `fish_${i}`,
      type: 'fishing',
      tileX: f.x, tileY: f.y,
      x: f.x * TILE, y: f.y * TILE,
      hp: 1, maxHp: 1,
      alive: true,
      respawnTimer: 0,
      respawnTime: 300, // ~5 seconds
      drop: 'fish', dropCount: 1,
      shakeTimer: 0,
    });
  }

  return objects;
}

// Try to interact with a world object using a tool
// Returns { drop, count } or null
export function hitObject(obj, toolType) {
  if (!obj.alive) return null;

  // Check correct tool
  if (obj.type === 'tree' && toolType !== 'axe') return null;
  if (obj.type === 'rock' && toolType !== 'pickaxe') return null;
  if (obj.type === 'fishing' && toolType !== 'rod') return null;

  obj.hp--;
  obj.shakeTimer = 15;

  if (obj.hp <= 0) {
    obj.alive = false;
    obj.respawnTimer = obj.respawnTime;
    return { item: obj.drop, count: obj.dropCount };
  }
  return { item: null, count: 0 }; // Hit but not destroyed yet
}

// Update objects (respawn timers, shake)
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

// Find the nearest alive object of matching type within range
export function getNearbyObject(objects, px, py, toolType) {
  const range = 2.2 * TILE;
  let best = null;
  let bestDist = range;

  const wantType = toolType === 'axe' ? 'tree'
    : toolType === 'pickaxe' ? 'rock'
    : toolType === 'rod' ? 'fishing'
    : null;

  if (!wantType) return null;

  for (const obj of objects) {
    if (!obj.alive || obj.type !== wantType) continue;
    const dist = Math.hypot(obj.x + TILE / 2 - px, obj.y + TILE / 2 - py);
    if (dist < bestDist) {
      best = obj;
      bestDist = dist;
    }
  }
  return best;
}
