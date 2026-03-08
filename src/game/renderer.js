import { TILE, SCALE, RS, MAP_W, MAP_H, ROOM_W, ROOM_H } from './constants.js';
import { getImg, getMeta } from './assets.js';
import { SEA_W, SEA_H, getSeaTile, placedAssets } from './maps.js';

// ════════════════════════════════════════════════════════
// SUNNYSIDE WORLD TILESET
// 1024x1024 PNG, 16px grid = 64 columns x 64 rows
// Tile ID → col = id % 64, row = Math.floor(id / 64)
// ════════════════════════════════════════════════════════

const TILESET_COLS = 64;

function tileToXY(tileId) {
  // Strip any GM flags (high bits used for flip/rotate in GM)
  const id = tileId & 0x0FFFFFFF; // Remove flags
  const col = id % TILESET_COLS;
  const row = Math.floor(id / TILESET_COLS);
  return { col, row };
}

// Draw a single tile from the main tileset
function drawTile(ctx, tileId, dx, dy) {
  if (tileId === 0) return;
  const img = getImg('tileset');
  if (!img) return;

  const { col, row } = tileToXY(tileId);

  // Check for GM tile flags (flip, mirror, rotate)
  const flipH = (tileId & 0x10000000) !== 0;
  const flipV = (tileId & 0x20000000) !== 0;
  const rotate = (tileId & 0x40000000) !== 0;

  if (flipH || flipV || rotate) {
    ctx.save();
    ctx.translate(dx + RS / 2, dy + RS / 2);
    if (rotate) ctx.rotate(Math.PI / 2);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    ctx.drawImage(img,
      col * TILE, row * TILE, TILE, TILE,
      -RS / 2, -RS / 2, RS, RS
    );
    ctx.restore();
  } else {
    ctx.drawImage(img,
      col * TILE, row * TILE, TILE, TILE,
      dx, dy, RS, RS
    );
  }
}

// ════════════════════════════════════════════════════════
// SPRITE RENDERING
// Draw a placed sprite asset with origin, scale, rotation
// ════════════════════════════════════════════════════════

function drawSprite(ctx, asset, camX, camY, frame) {
  const img = getImg(asset.sprite);
  if (!img) return;

  const meta = getMeta(asset.sprite);
  const { w, h, ox, oy, frames } = meta;

  // Calculate frame for animated sprites
  let srcX = 0;
  if (frames > 1) {
    // Single PNG = first frame only (we only copied frame 0)
    // If the PNG is a strip (wider than single frame), use frame animation
    if (img.width > w) {
      const animFrame = Math.floor(frame / 10) % frames;
      srcX = animFrame * w;
    }
  }

  // Position: GM places sprites at (x,y) where origin is the anchor point
  // So the top-left of the sprite is at (x - ox, y - oy)
  const dx = (asset.x - ox) * SCALE - camX;
  const dy = (asset.y - oy) * SCALE - camY;
  const dw = w * SCALE;
  const dh = h * SCALE;

  // Quick cull
  if (dx + dw < -100 || dy + dh < -100) return;
  if (dx > ctx.canvas.width + 100 || dy > ctx.canvas.height + 100) return;

  const sx = asset.scaleX;
  const sy = asset.scaleY;
  const rot = asset.rotation;

  if (sx !== 1 || sy !== 1 || rot !== 0) {
    ctx.save();
    // Translate to the origin point in screen space
    const pivotX = asset.x * SCALE - camX;
    const pivotY = asset.y * SCALE - camY;
    ctx.translate(pivotX, pivotY);
    if (rot !== 0) ctx.rotate(rot * Math.PI / 180);
    ctx.scale(sx, sy);
    ctx.drawImage(img,
      srcX, 0, w, h,
      -ox * SCALE, -oy * SCALE, dw, dh
    );
    ctx.restore();
  } else {
    ctx.drawImage(img,
      srcX, 0, w, h,
      dx, dy, dw, dh
    );
  }
}

// ════════════════════════════════════════════════════════
// PLAYER RENDERING
// ════════════════════════════════════════════════════════

const PLAYER_ROW = { down: 0, left: 1, right: 2, up: 3 };

export function renderPlayer(ctx, player, camX, camY, frame) {
  // Use base_idle or base_walk sprite
  const spriteName = player.moving ? 'base_walk_strip8' : 'base_idle_strip9';
  const img = getImg(spriteName);
  if (!img) return;

  const meta = getMeta(spriteName);
  const fw = meta.w;  // 96 for base sprites
  const fh = meta.h;  // 64
  const nFrames = meta.frames;

  // GM base sprites are facing right by default
  // For animation: cycle through frames
  const animFrame = player.moving
    ? Math.floor(frame / 8) % nFrames
    : Math.floor(frame / 12) % nFrames;

  // Shadow
  const sx = player.x * SCALE - camX;
  const sy = player.y * SCALE - camY;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 4, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw player - origin is (48, 32) = center-bottom in 96x64 frame
  const drawW = fw * SCALE * 0.35;  // Scale down the 96x64 sprite to look right
  const drawH = fh * SCALE * 0.35;

  ctx.save();
  ctx.translate(sx, sy);

  // Flip based on direction
  if (player.direction === 'left') {
    ctx.scale(-1, 1);
  }

  // Source frame from strip image
  const srcX = animFrame * fw;

  ctx.drawImage(img,
    srcX, 0, fw, fh,
    -drawW / 2, -drawH + 4, drawW, drawH
  );
  ctx.restore();
}

// ════════════════════════════════════════════════════════
// MAIN WORLD RENDER
// Renders: sea tiles → placed sprites (in y-order) → player
// ════════════════════════════════════════════════════════

// Pre-sort assets by y position for correct depth ordering
const sortedAssets = [...placedAssets].sort((a, b) => {
  // Assets_2 renders below Assets_1
  if (a.layer !== b.layer) return a.layer === 'Assets_2' ? -1 : 1;
  return a.y - b.y;
});

// Separate into layers for proper rendering
const bgAssets = sortedAssets.filter(a => {
  // Background sprites: shadows, beams, windmill shadows
  const s = a.sprite;
  return s === 'spr_deco_charactershadow' ||
         s === 'spr_deco_shadow' ||
         s === 'spr_deco_beam' ||
         s === 'spr_deco_windmillshadow';
});

const fgAssets = sortedAssets.filter(a => {
  const s = a.sprite;
  return s !== 'spr_deco_charactershadow' &&
         s !== 'spr_deco_shadow' &&
         s !== 'spr_deco_beam' &&
         s !== 'spr_deco_windmillshadow';
});

export function renderWorld(ctx, canvas, player, frame) {
  // Camera centered on player
  const camX = Math.max(0, Math.min(
    player.x * SCALE - canvas.width / 2,
    ROOM_W * SCALE - canvas.width
  ));
  const camY = Math.max(0, Math.min(
    player.y * SCALE - canvas.height / 2,
    ROOM_H * SCALE - canvas.height
  ));

  // Clear with ocean blue
  ctx.fillStyle = '#3a7ecf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── Layer 1: Sea tiles ──
  const sc = Math.max(0, Math.floor(camX / RS) - 1);
  const sr = Math.max(0, Math.floor(camY / RS) - 1);
  const ec = Math.min(SEA_W, Math.ceil((camX + canvas.width) / RS) + 1);
  const er = Math.min(SEA_H, Math.ceil((camY + canvas.height) / RS) + 1);

  for (let row = sr; row < er; row++) {
    for (let col = sc; col < ec; col++) {
      const tileId = getSeaTile(col, row);
      if (tileId !== 0) {
        drawTile(ctx, tileId, col * RS - camX, row * RS - camY);
      }
    }
  }

  // ── Layer 2: Background sprites (shadows, beams) ──
  for (const asset of bgAssets) {
    drawSprite(ctx, asset, camX, camY, frame);
  }

  // ── Layer 3: Foreground sprites sorted by Y (depth) ──
  // Insert player at correct Y position
  const playerDrawn = { done: false };
  for (const asset of fgAssets) {
    // Draw player when we reach sprites below them
    if (!playerDrawn.done && asset.y > player.y) {
      renderPlayer(ctx, player, camX, camY, frame);
      playerDrawn.done = true;
    }
    drawSprite(ctx, asset, camX, camY, frame);
  }
  if (!playerDrawn.done) {
    renderPlayer(ctx, player, camX, camY, frame);
  }

  return { cameraX: camX, cameraY: camY };
}
