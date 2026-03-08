import { MODE, TILE } from './constants.js';
import { loadAssets } from './assets.js';
import { renderVillage, renderInterior, renderPlayer } from './renderer.js';
import { createPlayer, updatePlayer, getNearbyHouse, isAtDoor } from './player.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let mode = MODE.VILLAGE;
  let player = createPlayer();
  let house = null;
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
      if (mode === MODE.VILLAGE) {
        const h = getNearbyHouse(player);
        if (h) enterHouse(h);
      } else if (mode === MODE.INTERIOR && isAtDoor(player)) {
        exitHouse();
      }
    }
  }
  function onUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  function enterHouse(h) {
    transitioning = true;
    house = h;
    mode = MODE.INTERIOR;
    player.interiorX = 4 * TILE;
    player.interiorY = 5 * TILE;
    player.direction = 'up';
    setTimeout(() => { transitioning = false; }, 250);
  }

  function exitHouse() {
    transitioning = true;
    mode = MODE.VILLAGE;
    if (house) {
      player.x = house.doorX * TILE;
      player.y = (house.doorY + 1) * TILE;
    }
    player.direction = 'down';
    house = null;
    setTimeout(() => { transitioning = false; }, 250);
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

    let cam = { cameraX: 0, cameraY: 0 };
    let intOff = { offsetX: 0, offsetY: 0 };

    if (mode === MODE.VILLAGE) {
      cam = renderVillage(ctx, canvas, player, frame);
      renderPlayer(ctx, player, cam.cameraX, cam.cameraY, mode, intOff, frame);
    } else {
      intOff = renderInterior(ctx, canvas, player, house, frame);
      renderPlayer(ctx, player, 0, 0, mode, intOff, frame);
    }

    drawHUD(ctx, canvas, mode, house);
    raf = requestAnimationFrame(loop);
  }

  // ── HUD ──
  function drawHUD(ctx, canvas, mode, house) {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, 40);
    ctx.fillStyle = '#c7b777';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('VDX QUEST', 14, 26);
    ctx.fillStyle = '#999';
    ctx.font = '12px monospace';
    ctx.fillText(
      mode === MODE.VILLAGE ? 'Village de Départ — Semaine 1' : (house?.name || 'Intérieur'),
      150, 26
    );

    // Bottom bar
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, canvas.height - 32, canvas.width, 32);
    ctx.fillStyle = '#777';
    ctx.font = '11px monospace';
    ctx.fillText('Flèches / ZQSD pour se déplacer  │  ESPACE pour interagir', 14, canvas.height - 12);
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
