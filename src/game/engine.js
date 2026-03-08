import { loadAssets } from './assets.js';
import { renderWorld } from './renderer.js';
import { createPlayer, updatePlayer } from './player.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let player = createPlayer();
  let frame = 0;
  let keys = {};
  let raf = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Keyboard ──
  function onDown(e) { keys[e.code] = true; }
  function onUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

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
    updatePlayer(player, keys);

    const cam = renderWorld(ctx, canvas, player, frame);

    // HUD
    drawHUD(ctx, canvas);

    raf = requestAnimationFrame(loop);
  }

  function drawHUD(ctx, canvas) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, 36);
    ctx.fillStyle = '#c7b777';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('SUNNYSIDE WORLD', 14, 24);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText('Flèches / ZQSD pour se déplacer', 200, 24);
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
