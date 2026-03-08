// ═══════════════════════════════════════════════════════
// VDX QUEST - Player Movement & Collision
// ═══════════════════════════════════════════════════════
import { TILE, PLAYER_SPEED, PLAYER_START_X, PLAYER_START_Y } from './constants.js';
import collisionData from '../data/collision.json';

const COL_W = collisionData.width;
const COL_H = collisionData.height;
const colMap = collisionData.data;

function getCollision(col, row) {
  if (col < 0 || col >= COL_W || row < 0 || row >= COL_H) return 0;
  return colMap[row * COL_W + col];
}

export function createPlayer() {
  return {
    x: PLAYER_START_X * TILE,
    y: PLAYER_START_Y * TILE,
    direction: 'down',
    moving: false,
    actionSprite: null,
    actionTimer: 0,
    selectedTool: 0,
  };
}

export function updatePlayer(player, keys) {
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
