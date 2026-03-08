import { TILE, PLAYER_SPEED, MODE } from './constants.js';
import {
  villageMap, houses, interiorMap, INT_W, INT_H,
  isBlocked, isInteriorBlocked, isInteriorDoor, H,
} from './maps.js';

export function createPlayer() {
  return {
    x: 10 * TILE,
    y: 10 * TILE,
    direction: 'down',
    moving: false,
    interiorX: 4 * TILE,
    interiorY: 5 * TILE,
  };
}

export function updatePlayer(player, keys, mode) {
  let dx = 0, dy = 0;

  if (keys.ArrowLeft  || keys.KeyA || keys.KeyQ) { dx = -PLAYER_SPEED; player.direction = 'left'; }
  if (keys.ArrowRight || keys.KeyD)               { dx =  PLAYER_SPEED; player.direction = 'right'; }
  if (keys.ArrowUp    || keys.KeyW || keys.KeyZ)  { dy = -PLAYER_SPEED; player.direction = 'up'; }
  if (keys.ArrowDown  || keys.KeyS)               { dy =  PLAYER_SPEED; player.direction = 'down'; }

  player.moving = dx !== 0 || dy !== 0;

  if (mode === MODE.VILLAGE) {
    moveVillage(player, dx, dy);
  } else {
    moveInterior(player, dx, dy);
  }
}

function moveVillage(player, dx, dy) {
  const pad = 4;

  if (dx !== 0) {
    const nx = player.x + dx;
    const checkCol = dx > 0
      ? Math.floor((nx + TILE - pad) / TILE)
      : Math.floor((nx + pad) / TILE);
    const rTop = Math.floor((player.y + pad) / TILE);
    const rBot = Math.floor((player.y + TILE - pad) / TILE);

    let ok = true;
    for (let r = rTop; r <= rBot; r++) {
      const t = villageMap[r]?.[checkCol];
      if (t === undefined || isBlocked(t)) { ok = false; break; }
    }
    if (ok) player.x = nx;
  }

  if (dy !== 0) {
    const ny = player.y + dy;
    const checkRow = dy > 0
      ? Math.floor((ny + TILE - pad) / TILE)
      : Math.floor((ny + pad) / TILE);
    const cLeft  = Math.floor((player.x + pad) / TILE);
    const cRight = Math.floor((player.x + TILE - pad) / TILE);

    let ok = true;
    for (let c = cLeft; c <= cRight; c++) {
      const t = villageMap[checkRow]?.[c];
      if (t === undefined || isBlocked(t)) { ok = false; break; }
    }
    if (ok) player.y = ny;
  }
}

function moveInterior(player, dx, dy) {
  const pad = 4;

  if (dx !== 0) {
    const nx = player.interiorX + dx;
    const checkCol = dx > 0
      ? Math.floor((nx + TILE - pad) / TILE)
      : Math.floor((nx + pad) / TILE);
    const rTop = Math.floor((player.interiorY + pad) / TILE);
    const rBot = Math.floor((player.interiorY + TILE - pad) / TILE);

    let ok = true;
    for (let r = rTop; r <= rBot; r++) {
      const t = interiorMap[r]?.[checkCol];
      if (t === undefined || isInteriorBlocked(t)) { ok = false; break; }
    }
    if (ok) player.interiorX = nx;
  }

  if (dy !== 0) {
    const ny = player.interiorY + dy;
    const checkRow = dy > 0
      ? Math.floor((ny + TILE - pad) / TILE)
      : Math.floor((ny + pad) / TILE);
    const cL = Math.floor((player.interiorX + pad) / TILE);
    const cR = Math.floor((player.interiorX + TILE - pad) / TILE);

    let ok = true;
    for (let c = cL; c <= cR; c++) {
      const t = interiorMap[checkRow]?.[c];
      if (t === undefined || isInteriorBlocked(t)) { ok = false; break; }
    }
    if (ok) player.interiorY = ny;
  }
}

export function getNearbyHouse(player) {
  for (const h of houses) {
    const dx = Math.abs(player.x / TILE - h.doorX);
    const dy = Math.abs(player.y / TILE - h.doorY);
    if (dx < 1.5 && dy < 1.5) return h;
  }
  return null;
}

export function isAtDoor(player) {
  const col = Math.floor((player.interiorX + TILE / 2) / TILE);
  const row = Math.floor((player.interiorY + TILE / 2) / TILE);
  return isInteriorDoor(interiorMap[row]?.[col]);
}
