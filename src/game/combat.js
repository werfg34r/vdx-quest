// ═══════════════════════════════════════════════════════
// COMBAT SYSTEM - Skeleton enemies
// ═══════════════════════════════════════════════════════
import { TILE, SKELETON, SKELETON_SPAWNS, MAX_SKELETONS, NIGHT_START, DAWN_START } from './constants.js';
import collisionData from '../data/collision.json';

const COL_W = collisionData.width;
const colMap = collisionData.data;

function isWalkable(col, row) {
  if (col < 0 || col >= COL_W || row < 0 || row >= collisionData.height) return false;
  return colMap[row * COL_W + col] === 1;
}

export function createEnemies() {
  return [];
}

export function shouldSpawnEnemies(hour) {
  return hour >= NIGHT_START || hour < DAWN_START;
}

export function spawnEnemies(enemies, hour, playerX, playerY) {
  if (!shouldSpawnEnemies(hour)) {
    // Daytime: despawn all enemies
    for (const e of enemies) {
      if (e.state !== 'dying') e.state = 'dying';
    }
    return;
  }

  if (enemies.filter(e => e.state !== 'dead').length >= MAX_SKELETONS) return;

  // Try to spawn at a random spawn point far from player
  const candidates = SKELETON_SPAWNS.filter(sp => {
    const dist = Math.hypot(sp.x * TILE - playerX, sp.y * TILE - playerY);
    return dist > 8 * TILE && isWalkable(sp.x, sp.y);
  });

  if (candidates.length === 0) return;

  // 1% chance per frame to spawn (roughly every 1.7 seconds)
  if (Math.random() > 0.01) return;

  const sp = candidates[Math.floor(Math.random() * candidates.length)];
  enemies.push({
    x: sp.x * TILE,
    y: sp.y * TILE,
    hp: SKELETON.hp,
    maxHp: SKELETON.hp,
    direction: 'left',
    state: 'idle',     // idle, patrol, chase, attack, hurt, dying, dead
    moving: false,
    attackTimer: 0,
    hurtTimer: 0,
    deathTimer: 0,
    stateTimer: 0,
    targetX: sp.x * TILE,
    targetY: sp.y * TILE,
  });
}

export function updateEnemies(enemies, playerX, playerY) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (e.state === 'dead') {
      enemies.splice(i, 1);
      continue;
    }

    if (e.state === 'dying') {
      e.deathTimer++;
      e.moving = false;
      if (e.deathTimer > 40) {
        e.state = 'dead';
      }
      continue;
    }

    if (e.state === 'hurt') {
      e.hurtTimer--;
      e.moving = false;
      if (e.hurtTimer <= 0) e.state = 'chase';
      continue;
    }

    // Attack cooldown
    if (e.attackTimer > 0) e.attackTimer--;

    const dist = Math.hypot(e.x - playerX, e.y - playerY);

    // State transitions
    if (e.state === 'attack') {
      e.stateTimer--;
      e.moving = false;
      if (e.stateTimer <= 0) e.state = 'chase';
      continue;
    }

    if (dist < SKELETON.attackRange && e.attackTimer <= 0) {
      e.state = 'attack';
      e.stateTimer = 20;
      e.attackTimer = SKELETON.attackCooldown;
      e.moving = false;
      e.direction = playerX > e.x ? 'right' : 'left';
      continue;
    }

    if (dist < SKELETON.chaseRange) {
      e.state = 'chase';
    } else if (e.state === 'chase') {
      e.state = 'patrol';
      e.stateTimer = 120 + Math.random() * 120;
    }

    // Movement
    if (e.state === 'chase') {
      moveToward(e, playerX, playerY, SKELETON.speed);
    } else if (e.state === 'patrol') {
      e.stateTimer--;
      if (e.stateTimer <= 0) {
        // Pick new patrol target
        e.targetX = e.x + (Math.random() - 0.5) * 4 * TILE;
        e.targetY = e.y + (Math.random() - 0.5) * 4 * TILE;
        e.stateTimer = 120 + Math.random() * 120;
      }
      const tdist = Math.hypot(e.x - e.targetX, e.y - e.targetY);
      if (tdist > 2) {
        moveToward(e, e.targetX, e.targetY, SKELETON.speed * 0.5);
      } else {
        e.moving = false;
      }
    } else {
      // idle
      e.stateTimer--;
      e.moving = false;
      if (e.stateTimer <= 0) {
        e.state = 'patrol';
        e.stateTimer = 60;
      }
    }
  }
}

function moveToward(e, tx, ty, speed) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) { e.moving = false; return; }

  const mx = (dx / dist) * speed;
  const my = (dy / dist) * speed;
  const pad = 3;

  // X
  if (mx !== 0) {
    const nx = e.x + mx;
    const checkCol = mx > 0
      ? Math.floor((nx + TILE - pad) / TILE)
      : Math.floor((nx + pad) / TILE);
    const rTop = Math.floor((e.y + pad) / TILE);
    const rBot = Math.floor((e.y + TILE - pad) / TILE);
    let ok = true;
    for (let r = rTop; r <= rBot; r++) {
      if (!isWalkable(checkCol, r)) { ok = false; break; }
    }
    if (ok) e.x = nx;
  }

  // Y
  if (my !== 0) {
    const ny = e.y + my;
    const checkRow = my > 0
      ? Math.floor((ny + TILE - pad) / TILE)
      : Math.floor((ny + pad) / TILE);
    const cL = Math.floor((e.x + pad) / TILE);
    const cR = Math.floor((e.x + TILE - pad) / TILE);
    let ok = true;
    for (let c = cL; c <= cR; c++) {
      if (!isWalkable(c, checkRow)) { ok = false; break; }
    }
    if (ok) e.y = ny;
  }

  e.moving = true;
  if (Math.abs(dx) > Math.abs(dy)) {
    e.direction = dx > 0 ? 'right' : 'left';
  } else {
    e.direction = dy > 0 ? 'down' : 'up';
  }
}

// Player attacks an enemy - returns true if hit
export function damageEnemy(enemy, damage) {
  if (enemy.state === 'dying' || enemy.state === 'dead') return null;
  enemy.hp -= damage;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.state = 'dying';
    enemy.deathTimer = 0;
    // Generate loot
    const drops = [];
    for (const loot of SKELETON.loot) {
      if (Math.random() < loot.chance) {
        drops.push({ item: loot.item, count: loot.count });
      }
    }
    // Always drop a bit of gold
    return { drops, gold: 5 + Math.floor(Math.random() * 10) };
  }
  enemy.state = 'hurt';
  enemy.hurtTimer = 15;
  return { drops: [], gold: 0 };
}

// Check if enemy is attacking and in range to deal damage
export function getAttackingEnemy(enemies, playerX, playerY) {
  for (const e of enemies) {
    if (e.state === 'attack' && e.stateTimer > 10) {
      const dist = Math.hypot(e.x - playerX, e.y - playerY);
      if (dist < SKELETON.attackRange * 1.5) return e;
    }
  }
  return null;
}

// Find enemy near player for sword attacks
export function getEnemyInRange(enemies, px, py, dir) {
  const range = 2 * TILE;
  let best = null;
  let bestDist = range;
  for (const e of enemies) {
    if (e.state === 'dying' || e.state === 'dead') continue;
    const dist = Math.hypot(e.x - px, e.y - py);
    if (dist < bestDist) {
      best = e;
      bestDist = dist;
    }
  }
  return best;
}
