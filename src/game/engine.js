import { MODE, TILE, HOUSES } from './constants.js';
import { loadAssets } from './assets.js';
import { renderWorld, renderInterior, renderPlayer } from './renderer.js';
import { createPlayer, updatePlayer, getNearbyHouse, isAtInteriorDoor } from './player.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let mode = MODE.WORLD;
  let player = createPlayer();
  let currentHouse = null;
  let frame = 0;
  let keys = {};
  let raf = null;
  let transitioning = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Keyboard ──
  function onDown(e) {
    keys[e.code] = true;
    if (e.code === 'Space' && !transitioning) {
      e.preventDefault();
      if (mode === MODE.WORLD) {
        const h = getNearbyHouse(player);
        if (h) enterHouse(h);
      } else if (mode === MODE.INTERIOR && isAtInteriorDoor(player)) {
        exitHouse();
      }
    }
  }
  function onUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  function enterHouse(h) {
    transitioning = true;
    currentHouse = h;
    mode = MODE.INTERIOR;
    player.interiorX = 4 * TILE;
    player.interiorY = 5 * TILE;
    player.direction = 'up';
    setTimeout(() => { transitioning = false; }, 300);
  }

  function exitHouse() {
    transitioning = true;
    mode = MODE.WORLD;
    if (currentHouse) {
      player.x = currentHouse.spawnX;
      player.y = currentHouse.spawnY;
    }
    player.direction = 'down';
    currentHouse = null;
    setTimeout(() => { transitioning = false; }, 300);
  }

  // ── Touch ──
  let touchX = 0, touchY = 0;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchX = t.clientX; touchY = t.clientY;
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchX, dy = t.clientY - touchY;
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) keys.ArrowRight = true;
      if (dx < -20) keys.ArrowLeft = true;
    } else {
      if (dy > 20) keys.ArrowDown = true;
      if (dy < -20) keys.ArrowUp = true;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => {
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false;
  });

  // ── Game Loop ──
  function loop() {
    frame++;
    updatePlayer(player, keys, mode);

    if (mode === MODE.WORLD) {
      const cam = renderWorld(ctx, canvas, player, frame);

      // Draw door prompts near houses
      for (const h of HOUSES) {
        const ptx = player.x / TILE;
        const pty = player.y / TILE;
        const dx = Math.abs(ptx - h.doorX);
        const dy = Math.abs(pty - h.doorY);
        if (dx < 1.8 && dy < 1.8) {
          drawPrompt(ctx,
            h.doorX * TILE * 2 - cam.cameraX,
            h.doorY * TILE * 2 - cam.cameraY - 40,
            `ESPACE — Entrer dans ${h.name}`
          );
        }
      }

      renderPlayer(ctx, player, cam.cameraX, cam.cameraY, frame, mode);
    } else {
      const intOff = renderInterior(ctx, canvas, player, currentHouse, frame);
      // Exit prompt
      if (isAtInteriorDoor(player)) {
        drawPrompt(ctx, canvas.width / 2, intOff.offsetY + 8 * TILE * 2 + 20, 'ESPACE — Sortir');
      }
    }

    drawHUD(ctx, canvas, mode, currentHouse);
    raf = requestAnimationFrame(loop);
  }

  function drawHUD(ctx, canvas, mode, house) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, 38);
    ctx.fillStyle = '#c7b777';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('SUNNYSIDE WORLD', 14, 25);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    const loc = mode === MODE.WORLD ? 'Village — Explorez le monde' : (house?.name || 'Intérieur');
    ctx.fillText(loc, 200, 25);

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    ctx.fillStyle = '#888';
    ctx.font = '11px monospace';
    ctx.fillText('Flèches / ZQSD = déplacer  |  ESPACE = interagir', 14, canvas.height - 10);
  }

  function drawPrompt(ctx, cx, cy, text) {
    ctx.font = 'bold 12px monospace';
    const tw = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(cx - tw / 2, cy - 4, tw, 24);
    ctx.strokeStyle = '#c7b777';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - tw / 2, cy - 4, tw, 24);
    ctx.fillStyle = '#c7b777';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + 13);
    ctx.textAlign = 'left';
  }

  // Load then start
  loadAssets().then(() => { loop(); });

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    if (raf) cancelAnimationFrame(raf);
  };
}
