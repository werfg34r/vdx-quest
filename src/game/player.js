import { PLAYER_SPEED, ROOM_W, ROOM_H } from './constants.js';

export function createPlayer() {
  return {
    // Start near center of the map (in original pixel coordinates)
    x: ROOM_W / 2,
    y: ROOM_H / 2,
    direction: 'down',
    moving: false,
  };
}

export function updatePlayer(player, keys) {
  let dx = 0, dy = 0;

  if (keys.ArrowLeft  || keys.KeyA || keys.KeyQ) { dx = -PLAYER_SPEED; player.direction = 'left'; }
  if (keys.ArrowRight || keys.KeyD)               { dx =  PLAYER_SPEED; player.direction = 'right'; }
  if (keys.ArrowUp    || keys.KeyW || keys.KeyZ)  { dy = -PLAYER_SPEED; player.direction = 'up'; }
  if (keys.ArrowDown  || keys.KeyS)               { dy =  PLAYER_SPEED; player.direction = 'down'; }

  player.moving = dx !== 0 || dy !== 0;

  // Move with bounds checking (stay within room)
  const margin = 8;
  player.x = Math.max(margin, Math.min(ROOM_W - margin, player.x + dx));
  player.y = Math.max(margin, Math.min(ROOM_H - margin, player.y + dy));
}
