import { GAME_STATE, TILE_SIZE } from './constants.js';
import { loadTileset, renderVillage, renderInterior, renderPlayer } from './renderer.js';
import { createPlayer, updatePlayer, getNearbyHouse, isAtInteriorDoor } from './player.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');

  // Disable image smoothing for pixel art
  ctx.imageSmoothingEnabled = false;

  let gameState = GAME_STATE.VILLAGE;
  let player = createPlayer();
  let currentHouse = null;
  let frame = 0;
  let keys = {};
  let animFrameId = null;
  let transitioning = false;

  // Resize canvas to fill window
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener('resize', resize);

  // Keyboard input
  function onKeyDown(e) {
    keys[e.code] = true;

    // Space to enter/exit houses
    if (e.code === 'Space' && !transitioning) {
      e.preventDefault();

      if (gameState === GAME_STATE.VILLAGE) {
        const house = getNearbyHouse(player);
        if (house) {
          transitioning = true;
          currentHouse = house;
          gameState = GAME_STATE.INTERIOR;
          // Place player near interior door
          player.interiorX = 4 * TILE_SIZE;
          player.interiorY = 5 * TILE_SIZE;
          player.direction = 'up';
          setTimeout(() => { transitioning = false; }, 300);
        }
      } else if (gameState === GAME_STATE.INTERIOR) {
        if (isAtInteriorDoor(player)) {
          transitioning = true;
          gameState = GAME_STATE.VILLAGE;
          // Place player in front of the house door
          if (currentHouse) {
            player.x = currentHouse.doorX * TILE_SIZE;
            player.y = (currentHouse.doorY + 1) * TILE_SIZE;
          }
          player.direction = 'down';
          currentHouse = null;
          setTimeout(() => { transitioning = false; }, 300);
        }
      }
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Mobile touch controls
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.ArrowDown = false;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) keys.ArrowRight = true;
      if (dx < -20) keys.ArrowLeft = true;
    } else {
      if (dy > 20) keys.ArrowDown = true;
      if (dy < -20) keys.ArrowUp = true;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.ArrowDown = false;

    // Tap to interact (like space)
    if (gameState === GAME_STATE.VILLAGE) {
      const house = getNearbyHouse(player);
      if (house && !transitioning) {
        transitioning = true;
        currentHouse = house;
        gameState = GAME_STATE.INTERIOR;
        player.interiorX = 4 * TILE_SIZE;
        player.interiorY = 5 * TILE_SIZE;
        player.direction = 'up';
        setTimeout(() => { transitioning = false; }, 300);
      }
    } else if (gameState === GAME_STATE.INTERIOR && isAtInteriorDoor(player)) {
      if (!transitioning) {
        transitioning = true;
        gameState = GAME_STATE.VILLAGE;
        if (currentHouse) {
          player.x = currentHouse.doorX * TILE_SIZE;
          player.y = (currentHouse.doorY + 1) * TILE_SIZE;
        }
        player.direction = 'down';
        currentHouse = null;
        setTimeout(() => { transitioning = false; }, 300);
      }
    }
  });

  // Game loop
  function gameLoop() {
    frame++;
    updatePlayer(player, keys, gameState);

    let camera = { cameraX: 0, cameraY: 0 };
    let interiorOffset = { offsetX: 0, offsetY: 0 };

    if (gameState === GAME_STATE.VILLAGE) {
      camera = renderVillage(ctx, canvas, player, frame);
      renderPlayer(ctx, player, camera.cameraX, camera.cameraY, gameState, interiorOffset);
    } else {
      interiorOffset = renderInterior(ctx, canvas, player, currentHouse, frame);
      renderPlayer(ctx, player, 0, 0, gameState, interiorOffset);
    }

    // HUD
    drawHUD(ctx, canvas, gameState, currentHouse);

    animFrameId = requestAnimationFrame(gameLoop);
  }

  // Load assets then start
  loadTileset().then(() => {
    gameLoop();
  });

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (animFrameId) cancelAnimationFrame(animFrameId);
  };
}

function drawHUD(ctx, canvas, gameState, currentHouse) {
  // Title bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, 44);

  ctx.fillStyle = '#c7b777';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('VDX QUEST', 16, 28);

  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';

  if (gameState === GAME_STATE.VILLAGE) {
    ctx.fillText('Village de Départ — Semaine 1', 160, 28);
  } else {
    ctx.fillText(currentHouse?.name || 'Intérieur', 160, 28);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
  ctx.fillStyle = '#666';
  ctx.font = '11px monospace';
  ctx.fillText('Flèches / ZQSD pour se déplacer   |   ESPACE pour interagir', 16, canvas.height - 14);
}
