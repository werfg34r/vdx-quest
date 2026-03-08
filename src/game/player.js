// ═══════════════════════════════════════════════════════
// VDX QUEST - Player
// ═══════════════════════════════════════════════════════
import { TILE, PLAYER_SPEED, PLAYER_START_X, PLAYER_START_Y } from './constants.js';
import { isWalkable } from './maps.js';

export function createPlayer() {
  return {
    x: PLAYER_START_X * TILE,
    y: PLAYER_START_Y * TILE,
    direction: 'down',
    moving: false,
    actionSprite: null,
    actionTimer: 0,
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
    for (let r = rTop; r <= rBot; r++) { if (!isWalkable(checkCol, r)) { ok = false; break; } }
    if (ok) player.x = nx;
  }
  if (dy !== 0) {
    const ny = player.y + dy;
    const checkRow = dy > 0 ? Math.floor((ny + TILE - pad) / TILE) : Math.floor((ny + pad) / TILE);
    const cL = Math.floor((player.x + pad) / TILE);
    const cR = Math.floor((player.x + TILE - pad) / TILE);
    let ok = true;
    for (let c = cL; c <= cR; c++) { if (!isWalkable(c, checkRow)) { ok = false; break; } }
    if (ok) player.y = ny;
  }
}
