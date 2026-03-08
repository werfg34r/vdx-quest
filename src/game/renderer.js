import { TILE, SCALE, RS, MAP_W, MAP_H, ROOM_W, ROOM_H } from './constants.js';
import { getImg, getMeta } from './assets.js';
import { tileLayerNames, tileLayers, getTile, placedAssets } from './maps.js';

// ════════════════════════════════════════════════════════
// SUNNYSIDE WORLD TILESET
// 1024x1024 PNG, 16px grid = 64 columns x 64 rows
// Tile ID → col = id % 64, row = Math.floor(id / 64)
// Flip flags in upper bits of tile ID
// ════════════════════════════════════════════════════════

const TILESET_COLS = 64;
const FLIP_H = 0x10000000;  // Bit 28
const FLIP_V = 0x20000000;  // Bit 29
const ROTATE = 0x40000000;  // Bit 30
const TILE_MASK = 0x0FFFFFFF;

function drawTileFromTileset(ctx, tileId, dx, dy, tileSize, renderSize, tilesetKey) {
  if (tileId === 0) return;
  const img = getImg(tilesetKey);
  if (!img) return;

  const id = tileId & TILE_MASK;
  const cols = tilesetKey === 'forest' ? 10 : TILESET_COLS;
  const col = id % cols;
  const row = Math.floor(id / cols);

  const fh = (tileId & FLIP_H) !== 0;
  const fv = (tileId & FLIP_V) !== 0;
  const rot = (tileId & ROTATE) !== 0;

  if (fh || fv || rot) {
    ctx.save();
    ctx.translate(dx + renderSize / 2, dy + renderSize / 2);
    if (rot) ctx.rotate(Math.PI / 2);
    if (fh) ctx.scale(-1, 1);
    if (fv) ctx.scale(1, -1);
    ctx.drawImage(img,
      col * tileSize, row * tileSize, tileSize, tileSize,
      -renderSize / 2, -renderSize / 2, renderSize, renderSize
    );
    ctx.restore();
  } else {
    ctx.drawImage(img,
      col * tileSize, row * tileSize, tileSize, tileSize,
      dx, dy, renderSize, renderSize
    );
  }
}

// ════════════════════════════════════════════════════════
// SPRITE RENDERING
// ════════════════════════════════════════════════════════

function drawSprite(ctx, asset, camX, camY, frame) {
  const img = getImg(asset.sprite);
  if (!img) return;

  const meta = getMeta(asset.sprite);
  const { w, h, ox, oy, frames } = meta;

  // Animation frame
  let srcX = 0;
  if (frames > 1 && img.width > w) {
    const animFrame = Math.floor(frame / 10) % frames;
    srcX = animFrame * w;
  }

  // Position: origin-based
  const dx = (asset.x - ox) * SCALE - camX;
  const dy = (asset.y - oy) * SCALE - camY;
  const dw = w * SCALE;
  const dh = h * SCALE;

  // Cull off-screen
  if (dx + dw < -200 || dy + dh < -200) return;
  if (dx > ctx.canvas.width + 200 || dy > ctx.canvas.height + 200) return;

  const sx = asset.scaleX;
  const sy = asset.scaleY;
  const rot = asset.rotation;

  // Handle alpha from colour (ARGB uint32)
  const colour = asset.colour || 4294967295;
  const alpha = ((colour >>> 24) & 0xFF) / 255;
  const prevAlpha = ctx.globalAlpha;
  if (alpha < 1) ctx.globalAlpha = alpha;

  if (sx !== 1 || sy !== 1 || rot !== 0) {
    ctx.save();
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

  if (alpha < 1) ctx.globalAlpha = prevAlpha;
}

// ════════════════════════════════════════════════════════
// PLAYER
// ════════════════════════════════════════════════════════

export function renderPlayer(ctx, player, camX, camY, frame) {
  const spriteName = player.moving ? 'base_walk_strip8' : 'base_idle_strip9';
  const img = getImg(spriteName);
  if (!img) return;

  const meta = getMeta(spriteName);
  const fw = meta.w;
  const fh = meta.h;
  const nFrames = meta.frames;

  const animFrame = player.moving
    ? Math.floor(frame / 8) % nFrames
    : Math.floor(frame / 12) % nFrames;

  const sx = player.x * SCALE - camX;
  const sy = player.y * SCALE - camY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 4, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player sprite (scale down 96x64 to ~33x22)
  const drawW = fw * SCALE * 0.35;
  const drawH = fh * SCALE * 0.35;

  ctx.save();
  ctx.translate(sx, sy);
  if (player.direction === 'left') ctx.scale(-1, 1);

  const srcX = animFrame * fw;
  ctx.drawImage(img,
    srcX, 0, fw, fh,
    -drawW / 2, -drawH + 4, drawW, drawH
  );
  ctx.restore();
}

// ════════════════════════════════════════════════════════
// MAIN WORLD RENDER
//
// Render order (back to front, matching GM depths):
//   sea (1600) → clouds_02 (1400) → land (1300) → paths (1200) →
//   shadows (1100) → decoration_01 (1000) →
//   Assets_2 (900) → forest (800) → building (700) → walls (600) →
//   decoration_02 (500) → decoration_03 (400) →
//   Assets_1 (300) → cloud_shadow (100) → clouds_01 (0)
// ════════════════════════════════════════════════════════

// Pre-sort assets
const assets2Sorted = placedAssets
  .filter(a => a.layer === 'Assets_2')
  .sort((a, b) => a.y - b.y);

const assets1Sorted = placedAssets
  .filter(a => a.layer === 'Assets_1')
  .sort((a, b) => a.y - b.y);

// Tile layers before Assets_2 (depth > 900)
const tilesBefore2 = ['sea', 'clouds_02', 'land', 'paths', 'shadows', 'decoration_01'];
// Tile layers between Assets_2 and Assets_1 (900 > depth > 300)
const tilesBetween = ['forest', 'building', 'walls', 'decoration_02', 'decoration_03'];
// Tile layers after Assets_1 (depth < 300)
const tilesAfter1 = ['cloud_shadow', 'clouds_01'];

function renderTileLayer(ctx, layerName, camX, camY) {
  const layer = tileLayers[layerName];
  if (!layer || layer.nonEmpty === 0) return;

  const isForest = layerName === 'forest';
  const tileSize = isForest ? 32 : TILE;
  const renderSize = isForest ? 32 * SCALE : RS;
  const tilesetKey = isForest ? 'forest' : 'tileset';
  const gridW = layer.width;
  const gridH = layer.height;

  const sc = Math.max(0, Math.floor(camX / renderSize) - 1);
  const sr = Math.max(0, Math.floor(camY / renderSize) - 1);
  const ec = Math.min(gridW, Math.ceil((camX + ctx.canvas.width) / renderSize) + 1);
  const er = Math.min(gridH, Math.ceil((camY + ctx.canvas.height) / renderSize) + 1);

  for (let row = sr; row < er; row++) {
    for (let col = sc; col < ec; col++) {
      const tileId = layer.tiles[row * gridW + col];
      if (tileId && tileId !== 0) {
        drawTileFromTileset(ctx, tileId, col * renderSize - camX, row * renderSize - camY, tileSize, renderSize, tilesetKey);
      }
    }
  }
}

function renderTileLayers(ctx, layerNames, camX, camY) {
  for (const name of layerNames) {
    renderTileLayer(ctx, name, camX, camY);
  }
}

function renderAssets(ctx, assets, camX, camY, frame) {
  for (const asset of assets) {
    drawSprite(ctx, asset, camX, camY, frame);
  }
}

export function renderWorld(ctx, canvas, player, frame) {
  // Camera centered on player
  const maxCamX = Math.max(0, ROOM_W * SCALE - canvas.width);
  const maxCamY = Math.max(0, ROOM_H * SCALE - canvas.height);
  const camX = Math.max(0, Math.min(player.x * SCALE - canvas.width / 2, maxCamX));
  const camY = Math.max(0, Math.min(player.y * SCALE - canvas.height / 2, maxCamY));

  // Clear
  ctx.fillStyle = '#2a6abf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Tile layers behind Assets_2 (sea, clouds_02, land, paths, shadows, decoration_01)
  renderTileLayers(ctx, tilesBefore2, camX, camY);

  // 2. Assets_2 sprites (beams, chimneys, trees behind buildings, windmill shadows)
  renderAssets(ctx, assets2Sorted, camX, camY, frame);

  // 3. Tile layers between (forest, building, walls, decoration_02, decoration_03)
  renderTileLayers(ctx, tilesBetween, camX, camY);

  // 4. Assets_1 sprites (trees, animals, NPCs, items...) with player interleaved by Y
  let playerDrawn = false;
  for (const asset of assets1Sorted) {
    if (!playerDrawn && asset.y > player.y) {
      renderPlayer(ctx, player, camX, camY, frame);
      playerDrawn = true;
    }
    drawSprite(ctx, asset, camX, camY, frame);
  }
  if (!playerDrawn) {
    renderPlayer(ctx, player, camX, camY, frame);
  }

  // 5. Top tile layers (cloud shadows, clouds)
  renderTileLayers(ctx, tilesAfter1, camX, camY);

  return { cameraX: camX, cameraY: camY };
}
