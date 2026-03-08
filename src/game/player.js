// ═══════════════════════════════════════════════════════
// PLAYER - Movement, Stats, Collision
// ═══════════════════════════════════════════════════════
import {
  TILE, PLAYER_SPEED, PLAYER_MAX_HP, PLAYER_MAX_STAMINA,
  PLAYER_START_GOLD, PLAYER_START_X, PLAYER_START_Y,
  PLAYER_INVULN_FRAMES, MODE, HOUSES
} from './constants.js';
import collisionData from '../data/collision.json';

const COL_W = collisionData.width;
const COL_H = collisionData.height;
const colMap = collisionData.data;

function getCollision(col, row) {
  if (col < 0 || col >= COL_W || row < 0 || row >= COL_H) return 0;
  return colMap[row * COL_W + col];
}

// Interior layout
const IW = 0, IF = 1, IT = 2, IC = 3, IB = 4, IK = 5, IX = 6, ID = 7, IR = 8, IP = 9, IL = 10, IQ = 11;

export const interiorMap = [
  [IW, IW, IW, IW, IW, IW, IW, IW, IW, IW],
  [IW, IK, IF, IF, IP, IF, IF, IF, IK, IW],
  [IW, IF, IF, IF, IF, IF, IF, IF, IF, IW],
  [IW, IF, IT, IT, IF, IF, IB, IB, IF, IW],
  [IW, IF, IC, IC, IF, IF, IF, IF, IF, IW],
  [IW, IF, IF, IF, IR, IR, IF, IL, IQ, IW],
  [IW, IX, IF, IF, IR, IR, IF, IF, IF, IW],
  [IW, IW, IW, IW, ID, ID, IW, IW, IW, IW],
];

export const INTERIOR_BLOCKED = new Set([IW, IT, IB, IK, IX, IP, IL, IQ]);

export function createPlayer() {
  return {
    x: PLAYER_START_X * TILE,
    y: PLAYER_START_Y * TILE,
    direction: 'down',
    moving: false,
    interiorX: 4 * TILE, interiorY: 5 * TILE,
    screenX: 0, screenY: 0,
    hp: PLAYER_MAX_HP, maxHp: PLAYER_MAX_HP,
    stamina: PLAYER_MAX_STAMINA, maxStamina: PLAYER_MAX_STAMINA,
    gold: PLAYER_START_GOLD,
    actionSprite: null, actionTimer: 0,
    invulnTimer: 0,
    knockbackX: 0, knockbackY: 0,
    dead: false, deathTimer: 0,
  };
}

export function updatePlayer(player, keys, mode) {
  if (player.invulnTimer > 0) player.invulnTimer--;

  // Knockback
  if (player.knockbackX !== 0 || player.knockbackY !== 0) {
    if (mode === MODE.WORLD) {
      player.x += player.knockbackX;
      player.y += player.knockbackY;
    }
    player.knockbackX *= 0.8;
    player.knockbackY *= 0.8;
    if (Math.abs(player.knockbackX) < 0.1) player.knockbackX = 0;
    if (Math.abs(player.knockbackY) < 0.1) player.knockbackY = 0;
  }

  if (player.actionTimer > 0) {
    player.actionTimer--;
    if (player.actionTimer <= 0) player.actionSprite = null;
    player.moving = false;
    return;
  }

  let dx = 0, dy = 0;
  if (keys.ArrowLeft  || keys.KeyA || keys.KeyQ) { dx = -PLAYER_SPEED; player.direction = 'left'; }
  if (keys.ArrowRight || keys.KeyD)               { dx =  PLAYER_SPEED; player.direction = 'right'; }
  if (keys.ArrowUp    || keys.KeyW || keys.KeyZ)  { dy = -PLAYER_SPEED; player.direction = 'up'; }
  if (keys.ArrowDown  || keys.KeyS)               { dy =  PLAYER_SPEED; player.direction = 'down'; }

  if (keys.ShiftLeft || keys.ShiftRight) { dx *= 1.5; dy *= 1.5; }

  player.moving = dx !== 0 || dy !== 0;

  if (mode === MODE.WORLD) {
    moveWorld(player, dx, dy);
  } else if (mode === MODE.INTERIOR) {
    moveInterior(player, dx, dy);
  }

  if (!player.moving && player.stamina < player.maxStamina) {
    player.stamina = Math.min(player.maxStamina, player.stamina + 0.05);
  }
}

function moveWorld(player, dx, dy) {
  const pad = 3;
  if (dx !== 0) {
    const nx = player.x + dx;
    const checkCol = dx > 0 ? Math.floor((nx + TILE - pad) / TILE) : Math.floor((nx + pad) / TILE);
    const rTop = Math.floor((player.y + pad) / TILE);
    const rBot = Math.floor((player.y + TILE - pad) / TILE);
    let ok = true;
    for (let r = rTop; r <= rBot; r++) { if (getCollision(checkCol, r) !== 1) { ok = false; break; } }
    if (ok) player.x = nx;
  }
  if (dy !== 0) {
    const ny = player.y + dy;
    const checkRow = dy > 0 ? Math.floor((ny + TILE - pad) / TILE) : Math.floor((ny + pad) / TILE);
    const cL = Math.floor((player.x + pad) / TILE);
    const cR = Math.floor((player.x + TILE - pad) / TILE);
    let ok = true;
    for (let c = cL; c <= cR; c++) { if (getCollision(c, checkRow) !== 1) { ok = false; break; } }
    if (ok) player.y = ny;
  }
}

function moveInterior(player, dx, dy) {
  const pad = 3;
  if (dx !== 0) {
    const nx = player.interiorX + dx;
    const checkCol = dx > 0 ? Math.floor((nx + TILE - pad) / TILE) : Math.floor((nx + pad) / TILE);
    const rTop = Math.floor((player.interiorY + pad) / TILE);
    const rBot = Math.floor((player.interiorY + TILE - pad) / TILE);
    let ok = true;
    for (let r = rTop; r <= rBot; r++) {
      const t = interiorMap[r]?.[checkCol];
      if (t === undefined || INTERIOR_BLOCKED.has(t)) { ok = false; break; }
    }
    if (ok) player.interiorX = nx;
  }
  if (dy !== 0) {
    const ny = player.interiorY + dy;
    const checkRow = dy > 0 ? Math.floor((ny + TILE - pad) / TILE) : Math.floor((ny + pad) / TILE);
    const cL = Math.floor((player.interiorX + pad) / TILE);
    const cR = Math.floor((player.interiorX + TILE - pad) / TILE);
    let ok = true;
    for (let c = cL; c <= cR; c++) {
      const t = interiorMap[checkRow]?.[c];
      if (t === undefined || INTERIOR_BLOCKED.has(t)) { ok = false; break; }
    }
    if (ok) player.interiorY = ny;
  }
}

export function damagePlayer(player, damage, fromX, fromY) {
  if (player.invulnTimer > 0 || player.dead) return false;
  player.hp -= damage;
  player.invulnTimer = PLAYER_INVULN_FRAMES;
  const dx = player.x - fromX;
  const dy = player.y - fromY;
  const dist = Math.hypot(dx, dy) || 1;
  player.knockbackX = (dx / dist) * 3;
  player.knockbackY = (dy / dist) * 3;
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    player.deathTimer = 0;
    return true;
  }
  return false;
}

export function useStamina(player, cost) {
  if (player.stamina < cost) return false;
  player.stamina -= cost;
  return true;
}

export function restPlayer(player) {
  player.hp = player.maxHp;
  player.stamina = player.maxStamina;
}

export function respawnPlayer(player) {
  player.dead = false;
  player.hp = Math.floor(player.maxHp / 2);
  player.stamina = Math.floor(player.maxStamina / 2);
  player.x = PLAYER_START_X * TILE;
  player.y = PLAYER_START_Y * TILE;
  player.invulnTimer = 120;
  player.knockbackX = 0; player.knockbackY = 0;
  player.actionTimer = 0; player.actionSprite = null;
  player.gold = Math.max(0, player.gold - 20);
}

export function getNearbyHouse(player) {
  const ptx = player.x / TILE;
  const pty = player.y / TILE;
  for (const h of HOUSES) {
    if (Math.abs(ptx - h.doorX) < 1.8 && Math.abs(pty - h.doorY) < 1.8) return h;
  }
  return null;
}

export function isAtInteriorDoor(player) {
  const col = Math.floor((player.interiorX + TILE / 2) / TILE);
  const row = Math.floor((player.interiorY + TILE / 2) / TILE);
  return interiorMap[row]?.[col] === ID;
}

export function isNearBed(player) {
  const col = Math.floor((player.interiorX + TILE / 2) / TILE);
  const row = Math.floor((player.interiorY + TILE / 2) / TILE);
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (interiorMap[row + dr]?.[col + dc] === IB) return true;
    }
  }
  return false;
}
