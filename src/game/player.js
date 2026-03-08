import { TILE_SIZE, PLAYER_SPEED, RENDER_SIZE, GAME_STATE } from './constants.js';
import {
  villageMap, houses, interiorMap, INTERIOR_COLS, INTERIOR_ROWS,
  isBlocked, isHouseTile, isInteriorBlocked, isInteriorDoor,
} from './maps.js';

export function createPlayer() {
  return {
    // Position in tile-pixel space (not screen space)
    x: 10 * TILE_SIZE,
    y: 10 * TILE_SIZE,
    direction: 'down',
    moving: false,
    // Interior position
    interiorX: 4 * TILE_SIZE,
    interiorY: 5 * TILE_SIZE,
  };
}

export function updatePlayer(player, keys, gameState) {
  let dx = 0;
  let dy = 0;

  if (keys.ArrowLeft || keys.KeyA) { dx = -PLAYER_SPEED; player.direction = 'left'; }
  if (keys.ArrowRight || keys.KeyD) { dx = PLAYER_SPEED; player.direction = 'right'; }
  if (keys.ArrowUp || keys.KeyW) { dy = -PLAYER_SPEED; player.direction = 'up'; }
  if (keys.ArrowDown || keys.KeyS) { dy = PLAYER_SPEED; player.direction = 'down'; }

  player.moving = dx !== 0 || dy !== 0;

  if (gameState === GAME_STATE.VILLAGE) {
    moveInVillage(player, dx, dy);
  } else {
    moveInInterior(player, dx, dy);
  }
}

function moveInVillage(player, dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  // Check collision at corners of player hitbox
  const hitboxPad = 4;
  const tileLeft = Math.floor((newX + hitboxPad) / TILE_SIZE);
  const tileRight = Math.floor((newX + TILE_SIZE - hitboxPad) / TILE_SIZE);
  const tileTop = Math.floor((newY + hitboxPad) / TILE_SIZE);
  const tileBottom = Math.floor((newY + TILE_SIZE - hitboxPad) / TILE_SIZE);

  // Check X movement
  if (dx !== 0) {
    const checkCol = dx > 0 ? tileRight : tileLeft;
    const curTileTop = Math.floor((player.y + hitboxPad) / TILE_SIZE);
    const curTileBot = Math.floor((player.y + TILE_SIZE - hitboxPad) / TILE_SIZE);

    let canMoveX = true;
    for (let r = curTileTop; r <= curTileBot; r++) {
      const tile = villageMap[r]?.[checkCol];
      if (tile === undefined || isBlocked(tile) || isHouseTile(tile)) {
        canMoveX = false;
        break;
      }
    }
    if (canMoveX) player.x = newX;
  }

  // Check Y movement
  if (dy !== 0) {
    const curTileLeft = Math.floor((player.x + hitboxPad) / TILE_SIZE);
    const curTileRight = Math.floor((player.x + TILE_SIZE - hitboxPad) / TILE_SIZE);
    const checkRow = dy > 0 ? tileBottom : tileTop;

    let canMoveY = true;
    for (let c = curTileLeft; c <= curTileRight; c++) {
      const tile = villageMap[checkRow]?.[c];
      if (tile === undefined || isBlocked(tile) || isHouseTile(tile)) {
        canMoveY = false;
        break;
      }
    }
    if (canMoveY) player.y = player.y + dy;
  }
}

function moveInInterior(player, dx, dy) {
  const newX = player.interiorX + dx;
  const newY = player.interiorY + dy;

  const hitboxPad = 4;

  // Check X
  if (dx !== 0) {
    const checkCol = dx > 0
      ? Math.floor((newX + TILE_SIZE - hitboxPad) / TILE_SIZE)
      : Math.floor((newX + hitboxPad) / TILE_SIZE);
    const curTop = Math.floor((player.interiorY + hitboxPad) / TILE_SIZE);
    const curBot = Math.floor((player.interiorY + TILE_SIZE - hitboxPad) / TILE_SIZE);

    let canMove = true;
    for (let r = curTop; r <= curBot; r++) {
      const tile = interiorMap[r]?.[checkCol];
      if (tile === undefined || isInteriorBlocked(tile)) {
        canMove = false;
        break;
      }
    }
    if (canMove) player.interiorX = newX;
  }

  // Check Y
  if (dy !== 0) {
    const checkRow = dy > 0
      ? Math.floor((newY + TILE_SIZE - hitboxPad) / TILE_SIZE)
      : Math.floor((newY + hitboxPad) / TILE_SIZE);
    const curLeft = Math.floor((player.interiorX + hitboxPad) / TILE_SIZE);
    const curRight = Math.floor((player.interiorX + TILE_SIZE - hitboxPad) / TILE_SIZE);

    let canMove = true;
    for (let c = curLeft; c <= curRight; c++) {
      const tile = interiorMap[checkRow]?.[c];
      if (tile === undefined || isInteriorBlocked(tile)) {
        canMove = false;
        break;
      }
    }
    if (canMove) player.interiorY = newY;
  }
}

// Check if player is near a house door
export function getNearbyHouse(player) {
  for (const house of houses) {
    const dx = Math.abs(player.x / TILE_SIZE - house.doorX);
    const dy = Math.abs(player.y / TILE_SIZE - house.doorY);
    if (dx < 1.5 && dy < 1.5) {
      return house;
    }
  }
  return null;
}

// Check if player is at the interior door
export function isAtInteriorDoor(player) {
  const tileCol = Math.floor((player.interiorX + TILE_SIZE / 2) / TILE_SIZE);
  const tileRow = Math.floor((player.interiorY + TILE_SIZE / 2) / TILE_SIZE);
  const tile = interiorMap[tileRow]?.[tileCol];
  return isInteriorDoor(tile);
}
