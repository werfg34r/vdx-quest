// ============================================================
// VDX Quest — Sprite & Rendering System (Written from scratch)
// ============================================================
// Assets used:
//   sunnyside_tiles.png  (256x128) — terrain tiles 16x16
//   sunnyside_tileset.png (1024x1024) — decorations, furniture, flowers
//   tree_buch.png (32x32) — beautiful tree sprite
//   house_red/blue/brown.png (80x64) — pre-made house sprites
//   npc_*.png (48x128) — Tuxemon character sprites
//   buildings.png (320x544) — interior furniture details

const S = 16 // base tile size

// ============================================================
// TUXEMON SPRITE DIRECTION MAP
// 48x128 sheets = 3 cols × 4 rows at 16×32 each
//   Row 0 = facing DOWN  (front, face visible)
//   Row 1 = facing LEFT  (left profile)
//   Row 2 = facing RIGHT (right profile)
//   Row 3 = facing UP    (back, hair visible)
// ============================================================
const DIR = { down: 0, left: 1, right: 2, up: 3 }
const CHAR_W = 16
const CHAR_H = 32

// ============================================================
// TERRAIN TILE COORDS — sunnyside_tiles.png (16 cols × 8 rows)
// ============================================================
const TC = {
  grass:     [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  darkGrass: [{ x: 6, y: 0 }, { x: 7, y: 0 }],
  tallGrass: [{ x: 8, y: 0 }, { x: 9, y: 0 }],
  path:      [{ x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 }],
  sand:      [{ x: 13, y: 0 }, { x: 14, y: 0 }],
  bridge:    { x: 15, y: 0 },
  water:     [{ x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }],
  fence:     { x: 7, y: 1 },
  sign:      { x: 8, y: 1 },
  mountain:  [{ x: 9, y: 1 }, { x: 10, y: 1 }],
  flower:    [{ x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }],
  bush:      [{ x: 0, y: 1 }, { x: 1, y: 1 }],
}

// ============================================================
// INTERIOR TILE COORDS — sunnyside_tiles.png rows 4–5
// ============================================================
const IC = {
  floor:      [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
  wall:       [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }],
  table:      [{ x: 6, y: 4 }, { x: 7, y: 4 }],
  chair:      { x: 8, y: 4 },
  bookshelf:  [{ x: 9, y: 4 }, { x: 10, y: 4 }],
  barrel:     { x: 11, y: 4 },
  chest:      { x: 12, y: 4 },
  bed:        { x: 13, y: 4 },
  pot:        { x: 14, y: 4 },
  carpet:     { x: 15, y: 4 },
  torch:      { x: 0, y: 5 },
  doormat:    { x: 1, y: 5 },
  altar:      { x: 2, y: 5 },
}

// NPC sprite filename mapping
const NPC_FILES = {
  mentor:   'npc_boss',
  villager: 'npc_girl',
  warrior:  'npc_knight',
  sage:     'npc_sage',
  old:      'npc_bob',
  trader:   'npc_shopkeeper',
  florist:  'npc_florist',
  barmaid:  'npc_barmaid',
  heroine:  'npc_heroine',
  catgirl:  'npc_catgirl',
}

// ============================================================
// ASSET LOADING
// ============================================================
function img(src) {
  return new Promise(resolve => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => { console.warn('Failed:', src); resolve(null) }
    i.src = src
  })
}

export async function loadSpriteAtlas() {
  const keys = Object.keys(NPC_FILES)
  const [tiles, bigTiles, treeBuch, houseR, houseB, houseBr, player, ...npcImgs] =
    await Promise.all([
      img('/assets/sunnyside_tiles.png'),
      img('/assets/sunnyside_tileset.png'),
      img('/assets/tree_buch.png'),
      img('/assets/house_red.png'),
      img('/assets/house_blue.png'),
      img('/assets/house_brown.png'),
      img('/assets/npc_adventurer.png'),
      ...keys.map(k => img(`/assets/${NPC_FILES[k]}.png`)),
    ])

  const npcSprites = {}
  keys.forEach((k, i) => { npcSprites[k] = npcImgs[i] })

  return {
    tiles,       // sunnyside_tiles.png (terrain)
    bigTiles,    // sunnyside_tileset.png (decorations)
    treeBuch,    // tree_buch.png 32x32
    houses: { 1: houseR, 2: houseB, 3: houseBr },
    player,
    npcSprites,
    S,
  }
}

// ============================================================
// HELPERS
// ============================================================
function hash(a, b) {
  return ((Math.floor(a) * 374761 + Math.floor(b) * 668265) % 997 + 997) % 997
}

function blit(ctx, sheet, coord, px, py) {
  ctx.drawImage(sheet, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

function blitVar(ctx, sheet, arr, px, py) {
  blit(ctx, sheet, arr[hash(px, py) % arr.length], px, py)
}

// ============================================================
// TERRAIN TILE RENDERING
// ============================================================
export function drawTile(ctx, atlas, type, px, py, tick) {
  const t = atlas.tiles
  switch (type) {
    case 0:  blitVar(ctx, t, TC.grass, px, py); break          // GRASS
    case 1:  blitVar(ctx, t, TC.path, px, py); break           // PATH
    case 2: {                                                    // WATER (animated)
      const f = Math.floor(tick / 20) % TC.water.length
      blit(ctx, t, TC.water[f], px, py)
      break
    }
    case 4:  blitVar(ctx, t, TC.flower, px, py); break         // FLOWER
    case 5:  blit(ctx, t, TC.fence, px, py); break             // FENCE
    case 6:  blit(ctx, t, TC.bridge, px, py); break            // BRIDGE
    case 7:  blitVar(ctx, t, TC.sand, px, py); break           // SAND
    case 8:  blitVar(ctx, t, TC.darkGrass, px, py); break      // DARK GRASS
    case 9:  blitVar(ctx, t, TC.bush, px, py); break           // BUSH
    case 10: blitVar(ctx, t, TC.mountain, px, py); break       // MOUNTAIN
    case 11: blitVar(ctx, t, TC.tallGrass, px, py); break      // TALL GRASS
    case 14: blit(ctx, t, TC.sign, px, py); break              // SIGN
    // House footprint tiles — draw grass (house sprite drawn as overlay)
    case 20: case 21: case 22: case 23: case 24: case 25:
    case 26: case 27: case 28: case 29:
      blitVar(ctx, t, TC.grass, px, py); break
    // Tree tiles — draw grass (tree sprite drawn separately)
    case 3:  blitVar(ctx, t, TC.grass, px, py); break
    default: blitVar(ctx, t, TC.grass, px, py)
  }
}

// ============================================================
// TREE RENDERING — 32×32 tree_buch.png
// ============================================================
export function drawTree(ctx, atlas, col, row) {
  if (!atlas.treeBuch) return
  const px = col * S
  const py = row * S
  // Draw 32x32 tree centered on the 16x16 tile
  // Tree trunk at bottom, canopy extends up and to sides
  ctx.drawImage(atlas.treeBuch, 0, 0, 32, 32, px - 8, py - 16, 32, 32)
}

export function drawTreeShadow(ctx, col, row) {
  ctx.save()
  ctx.globalAlpha = 0.2
  ctx.fillStyle = '#0A2A00'
  ctx.beginPath()
  ctx.ellipse(col * S + S / 2 + 3, row * S + S - 1, 9, 4, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ============================================================
// HOUSE RENDERING — 80×64 pre-made sprites
// ============================================================
export function drawHouse(ctx, atlas, zoneId, houseX, houseY) {
  const h = atlas.houses[zoneId]
  if (!h) return
  // 80x64 sprite = 5×4 tiles. Center on 3-tile-wide footprint → offset 1 tile left
  ctx.drawImage(h, Math.floor(houseX * S - S), Math.floor(houseY * S), 80, 64)
}

export function drawHouseShadow(ctx, houseX, houseY) {
  ctx.save()
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#000'
  const px = houseX * S, py = houseY * S
  ctx.fillRect(px + S * 3 + 2, py + S, 6, S * 3)
  ctx.fillRect(px - 4, py + S * 4, S * 3 + 12, 5)
  ctx.restore()
}

export function drawWindowGlow(ctx, px, py, intensity) {
  if (intensity <= 0) return
  ctx.save()
  ctx.globalAlpha = intensity * 0.5
  const cx = px + S / 2, cy = py + S / 2
  const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, S)
  g.addColorStop(0, '#ffcc44')
  g.addColorStop(0.5, 'rgba(255,200,60,0.3)')
  g.addColorStop(1, 'rgba(255,200,60,0)')
  ctx.fillStyle = g
  ctx.fillRect(px - 4, py - 4, S + 8, S + 8)
  ctx.restore()
}

// ============================================================
// CHARACTER RENDERING — Tuxemon 48×128 sprites
// ============================================================
function drawSprite(ctx, sheet, direction, frame, px, py) {
  if (!sheet) return
  const col = frame % 3
  const row = DIR[direction] ?? DIR.down
  const sx = col * CHAR_W
  const sy = row * CHAR_H
  // Feet align with bottom of tile
  ctx.drawImage(sheet, sx, sy, CHAR_W, CHAR_H,
    Math.floor(px), Math.floor(py) - CHAR_H + S, CHAR_W, CHAR_H)
}

export function drawPlayer(ctx, atlas, direction, frame, px, py) {
  drawSprite(ctx, atlas.player, direction, frame, px, py)
}

export function drawNPC(ctx, atlas, spriteKey, direction, frame, px, py) {
  const sheet = atlas.npcSprites[spriteKey] || atlas.player
  drawSprite(ctx, sheet, direction || 'down', frame || 0, px, py)
}

export function drawShadow(ctx, px, py, w, a) {
  const sz = w || 12
  ctx.save()
  ctx.globalAlpha = a || 0.25
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(Math.floor(px) + S / 2, Math.floor(py) + S - 1, sz / 2, sz * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ============================================================
// INTERIOR TILE TYPES & RENDERING
// ============================================================
export const IT = {
  FLOOR: 50, WALL: 51, TABLE: 52, CHAIR: 53, BOOKSHELF: 54,
  CARPET: 55, ALTAR: 56, BARREL: 57, BED: 58, DOOR_MAT: 59,
  TORCH: 60, POT: 61, CHEST: 62,
}

const SOLID_INT = new Set([IT.WALL, IT.TABLE, IT.BOOKSHELF, IT.BARREL, IT.BED, IT.TORCH, IT.POT, IT.CHEST])

function drawFloor(ctx, ts, px, py) {
  if (ts) blitVar(ctx, ts, IC.floor, px, py)
  else { ctx.fillStyle = '#B88060'; ctx.fillRect(px, py, S, S) }
}

export function drawInteriorTile(ctx, atlas, type, px, py, tick) {
  const ts = atlas?.tiles

  switch (type) {
    case IT.FLOOR: drawFloor(ctx, ts, px, py); break

    case IT.WALL:
      if (ts) blitVar(ctx, ts, IC.wall, px, py)
      else { ctx.fillStyle = '#786A5E'; ctx.fillRect(px, py, S, S) }
      break

    case IT.TABLE:
      drawFloor(ctx, ts, px, py)
      if (ts) blit(ctx, ts, IC.table[hash(px, py) % 2], px, py)
      break

    case IT.CHAIR:
      drawFloor(ctx, ts, px, py)
      if (ts) blit(ctx, ts, IC.chair, px, py)
      break

    case IT.BOOKSHELF:
      if (ts) {
        blitVar(ctx, ts, IC.wall, px, py)
        blit(ctx, ts, IC.bookshelf[hash(px, py) % 2], px, py)
      } else { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(px, py, S, S) }
      break

    case IT.CARPET: drawFloor(ctx, ts, px, py); if (ts) blit(ctx, ts, IC.carpet, px, py); break

    case IT.ALTAR: {
      drawFloor(ctx, ts, px, py)
      if (ts) blit(ctx, ts, IC.altar, px, py)
      // Glow
      const g = 0.5 + Math.sin(tick * 0.08) * 0.3
      ctx.save()
      ctx.globalAlpha = g * 0.35
      ctx.fillStyle = '#FFE0A0'
      ctx.beginPath()
      ctx.arc(px + S / 2, py + S / 2, S * 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      // Sparkle
      if (Math.sin(tick * 0.12) > 0.3) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(px + 3, py + 1, 1, 1)
        ctx.fillRect(px + 11, py + 3, 1, 1)
      }
      break
    }

    case IT.BARREL: drawFloor(ctx, ts, px, py); if (ts) blit(ctx, ts, IC.barrel, px, py); break
    case IT.BED:    drawFloor(ctx, ts, px, py); if (ts) blit(ctx, ts, IC.bed, px, py); break
    case IT.DOOR_MAT: drawFloor(ctx, ts, px, py); if (ts) blit(ctx, ts, IC.doormat, px, py); break

    case IT.TORCH: {
      if (ts) { blitVar(ctx, ts, IC.wall, px, py); blit(ctx, ts, IC.torch, px, py) }
      else { ctx.fillStyle = '#786A5E'; ctx.fillRect(px, py, S, S) }
      // Flame glow
      ctx.save()
      ctx.globalAlpha = 0.3 + Math.sin(tick * 0.1 + px) * 0.1
      const gg = ctx.createRadialGradient(px + 8, py + 4, 0, px + 8, py + 4, 12)
      gg.addColorStop(0, 'rgba(255,136,34,0.4)')
      gg.addColorStop(1, 'rgba(255,136,34,0)')
      ctx.fillStyle = gg
      ctx.fillRect(px - 4, py - 6, S + 8, S + 12)
      ctx.restore()
      // Animated flame
      const fl = Math.sin(tick * 0.15 + px) * 0.8
      ctx.fillStyle = '#FF4400'; ctx.fillRect(px + 5 + fl, py + 2, 6, 5)
      ctx.fillStyle = '#FF8833'; ctx.fillRect(px + 6, py + 2, 4, 4)
      ctx.fillStyle = '#FFDD44'; ctx.fillRect(px + 7, py + 3, 2, 2)
      break
    }

    case IT.POT:   drawFloor(ctx, ts, px, py); if (ts) blit(ctx, ts, IC.pot, px, py); break
    case IT.CHEST: drawFloor(ctx, ts, px, py); if (ts) blit(ctx, ts, IC.chest, px, py); break
    default: drawFloor(ctx, ts, px, py)
  }
}

export function canMoveInterior(imap, x, y, npcs) {
  if (x < 0 || y < 0 || y >= imap.length || x >= imap[0].length) return false
  if (SOLID_INT.has(imap[y][x])) return false
  if (npcs) for (const n of npcs) { if (n.x === x && n.y === y) return false }
  return true
}

// ============================================================
// INTERIOR MAP GENERATION
// ============================================================
export function generateInterior(zone) {
  const W = 14, H = 12
  const m = Array.from({ length: H }, () => Array(W).fill(IT.FLOOR))

  // Walls
  for (let x = 0; x < W; x++) { m[0][x] = IT.WALL; m[H - 1][x] = IT.WALL }
  for (let y = 0; y < H; y++) { m[y][0] = IT.WALL; m[y][W - 1] = IT.WALL }

  // Door
  m[H - 1][6] = IT.DOOR_MAT; m[H - 1][7] = IT.DOOR_MAT

  // Torches
  m[0][2] = IT.TORCH; m[0][W - 3] = IT.TORCH
  m[4][0] = IT.TORCH; m[4][W - 1] = IT.TORCH
  m[8][0] = IT.TORCH; m[8][W - 1] = IT.TORCH

  // Central altar + carpet aisle
  m[2][6] = IT.ALTAR; m[2][7] = IT.ALTAR
  for (let y = 3; y <= H - 2; y++) { m[y][6] = IT.CARPET; m[y][7] = IT.CARPET }

  // Zone-specific furniture layouts
  if (zone.id === 1) {
    // Cabane de la Vérité — writing/library room
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][3] = IT.BOOKSHELF; m[1][4] = IT.BOOKSHELF
    m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF; m[1][W-4] = IT.BOOKSHELF; m[1][W-5] = IT.BOOKSHELF
    m[3][2] = IT.TABLE; m[3][3] = IT.TABLE; m[4][2] = IT.CHAIR; m[4][3] = IT.CHAIR
    m[3][W-3] = IT.TABLE; m[3][W-4] = IT.TABLE; m[4][W-3] = IT.CHAIR; m[4][W-4] = IT.CHAIR
    m[6][1] = IT.POT; m[6][2] = IT.BOOKSHELF; m[6][3] = IT.BOOKSHELF
    m[7][1] = IT.BED; m[8][1] = IT.CHEST; m[9][1] = IT.BARREL; m[9][2] = IT.BARREL
    m[7][W-2] = IT.BARREL; m[8][W-2] = IT.POT; m[9][W-2] = IT.POT
    // Extra carpet near tables
    m[3][4] = IT.CARPET; m[3][5] = IT.CARPET; m[3][8] = IT.CARPET; m[3][9] = IT.CARPET
  } else if (zone.id === 2) {
    // Tour de l'Inventaire — storage/treasure room
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF
    m[3][1] = IT.CHEST; m[3][2] = IT.CHEST; m[3][3] = IT.CHEST
    m[3][W-2] = IT.CHEST; m[3][W-3] = IT.CHEST; m[3][W-4] = IT.CHEST
    m[5][1] = IT.CHEST; m[5][W-2] = IT.CHEST
    m[5][4] = IT.TABLE; m[5][5] = IT.TABLE; m[5][8] = IT.TABLE; m[5][9] = IT.TABLE
    m[6][4] = IT.CHAIR; m[6][5] = IT.CHAIR; m[6][8] = IT.CHAIR; m[6][9] = IT.CHAIR
    m[8][1] = IT.BARREL; m[8][2] = IT.BARREL; m[9][1] = IT.POT
    m[8][W-2] = IT.BARREL; m[8][W-3] = IT.BARREL; m[9][W-2] = IT.POT
    m[8][4] = IT.BOOKSHELF; m[8][5] = IT.BOOKSHELF; m[8][8] = IT.BOOKSHELF; m[8][9] = IT.BOOKSHELF
  } else if (zone.id === 3) {
    // Forge du Silence — meditation room (more open, fewer objects)
    m[1][1] = IT.BOOKSHELF; m[1][W-2] = IT.BOOKSHELF
    m[1][4] = IT.POT; m[1][W-5] = IT.POT
    m[3][1] = IT.BED; m[3][2] = IT.BED
    m[5][2] = IT.TABLE; m[5][3] = IT.TABLE; m[6][2] = IT.CHAIR; m[6][3] = IT.CHAIR
    m[5][W-3] = IT.TABLE; m[5][W-4] = IT.TABLE; m[6][W-3] = IT.CHAIR; m[6][W-4] = IT.CHAIR
    m[8][1] = IT.BARREL; m[8][2] = IT.POT
    m[8][W-2] = IT.BED; m[8][W-3] = IT.BED
    m[9][1] = IT.BARREL; m[9][W-2] = IT.BARREL
    m[7][1] = IT.CHEST; m[7][W-2] = IT.CHEST
    // Wide carpet for meditation space
    for (let y = 4; y <= 9; y++) { m[y][5] = IT.CARPET; m[y][8] = IT.CARPET }
  }

  return { map: m, width: W, height: H, spawnX: 6, spawnY: H - 2 }
}

export { S }
