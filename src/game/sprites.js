// VDX Quest — Sprite System (Complete Rewrite)
// Assets: sunnyside_tiles.png (terrain), house_*.png (buildings),
//         npc_*.png (Tuxemon characters 48x128), sunnyside_tileset.png (furniture)

const S = 16
const CHAR_W = 16
const CHAR_H = 32

// ==================== TILE COORDINATES (sunnyside_tiles.png 256x128, 16x8 grid) ====================
const TC = {
  grass:     [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }],
  darkGrass: [{ x: 6, y: 0 }, { x: 7, y: 0 }],
  tallGrass: [{ x: 8, y: 0 }, { x: 9, y: 0 }],
  path:      [{ x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 }],
  sand:      [{ x: 13, y: 0 }, { x: 14, y: 0 }],
  bridge:    { x: 15, y: 0 },
  tree:      [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  water:     [{ x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }],
  fence:     { x: 7, y: 1 },
  sign:      { x: 8, y: 1 },
  mountain:  [{ x: 9, y: 1 }, { x: 10, y: 1 }],
  flower:    [{ x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }],
}

// Interior tile coordinates (sunnyside_tiles.png rows 4-5)
const ITC = {
  floor:     [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
  wall:      [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }],
  table:     { x: 6, y: 4 },
  table2:    { x: 7, y: 4 },
  chair:     { x: 8, y: 4 },
  bookshelf: { x: 9, y: 4 },
  bookshelf2:{ x: 10, y: 4 },
  barrel:    { x: 11, y: 4 },
  chest:     { x: 12, y: 4 },
  bed:       { x: 13, y: 4 },
  pot:       { x: 14, y: 4 },
  carpet:    { x: 15, y: 4 },
  torch:     { x: 0, y: 5 },
  doormat:   { x: 1, y: 5 },
  altar:     { x: 2, y: 5 },
}

// ==================== TUXEMON SPRITE DIRECTION MAPPING ====================
// Tuxemon sprites are 48x128 = 3 columns x 4 rows of 16x32 frames
// Row 0 = front (down/facing camera), Row 1 = left, Row 2 = right, Row 3 = back (up)
const TUXEMON_DIR = { down: 0, left: 1, right: 2, up: 3 }

// NPC sprite file mapping
const NPC_SPRITES = {
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

// House sprite mapping
const HOUSE_SPRITES = { 1: 'house_red', 2: 'house_blue', 3: 'house_brown' }

// ==================== ASSET LOADING ====================
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => { console.warn(`Failed to load: ${src}`); resolve(null) }
    img.src = src
  })
}

export async function loadSpriteAtlas() {
  // Load all images in parallel
  const [tileset, player, houseRed, houseBlue, houseBrown, ...npcImgs] = await Promise.all([
    loadImage('/assets/sunnyside_tiles.png'),
    loadImage('/assets/npc_adventurer.png'),
    loadImage('/assets/house_red.png'),
    loadImage('/assets/house_blue.png'),
    loadImage('/assets/house_brown.png'),
    ...Object.values(NPC_SPRITES).map(name => loadImage(`/assets/${name}.png`)),
  ])

  const houses = { 1: houseRed, 2: houseBlue, 3: houseBrown }
  const npcSprites = {}
  const npcKeys = Object.keys(NPC_SPRITES)
  npcKeys.forEach((key, i) => { npcSprites[key] = npcImgs[i] })

  return { tileset, player, houses, npcSprites, S }
}

// ==================== TILE DRAWING HELPERS ====================
function tileHash(px, py) {
  return ((Math.floor(px) * 374761 + Math.floor(py) * 668265) % 997 + 997) % 997
}

function blit(ctx, img, coord, px, py) {
  ctx.drawImage(img, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

function blitVariant(ctx, img, variants, px, py) {
  const h = tileHash(px, py)
  blit(ctx, img, variants[h % variants.length], px, py)
}

// ==================== TERRAIN TILE RENDERING ====================
export function drawSpriteTile(ctx, atlas, tileType, px, py, tick) {
  const ts = atlas.tileset

  switch (tileType) {
    case 0:  blitVariant(ctx, ts, TC.grass, px, py); break
    case 9:  blitVariant(ctx, ts, TC.darkGrass, px, py); break
    case 17: blitVariant(ctx, ts, TC.tallGrass, px, py); break
    case 1:  blitVariant(ctx, ts, TC.path, px, py); break
    case 2: {
      const frame = Math.floor(tick / 20) % 4
      blit(ctx, ts, TC.water[frame], px, py)
      break
    }
    case 3:  blitVariant(ctx, ts, TC.tree, px, py); break
    case 5:  blitVariant(ctx, ts, TC.mountain, px, py); break
    case 6:  blitVariant(ctx, ts, TC.flower, px, py); break
    case 7:  blit(ctx, ts, TC.bridge, px, py); break
    case 8:  blit(ctx, ts, TC.fence, px, py); break
    case 10: blitVariant(ctx, ts, TC.sand, px, py); break
    case 14: blit(ctx, ts, TC.sign, px, py); break
    // House tiles: draw grass underneath (house sprite is drawn separately)
    case 30: case 31: case 32: case 33: case 34: case 35:
    case 36: case 37: case 38: case 39: case 40: case 41:
      blitVariant(ctx, ts, TC.grass, px, py)
      break
    default: blitVariant(ctx, ts, TC.grass, px, py)
  }
}

// ==================== HOUSE RENDERING ====================
export function drawHouseSprite(ctx, atlas, zoneId, houseX, houseY) {
  const houseImg = atlas.houses[zoneId]
  if (!houseImg) return
  // House sprite is 80x64 (5x4 tiles). Center on 3-tile footprint.
  const offsetX = -S
  ctx.drawImage(houseImg, Math.floor(houseX * S + offsetX), Math.floor(houseY * S), 80, 64)
}

export function drawHouseShadow(ctx, houseX, houseY) {
  const px = houseX * S
  const py = houseY * S
  ctx.save()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#000'
  ctx.fillRect(px + S * 3 + 2, py + S, 6, S * 3)
  ctx.fillRect(px - 4, py + S * 4, S * 3 + 12, 4)
  ctx.restore()
}

// ==================== CHARACTER RENDERING ====================
function drawTuxemonSprite(ctx, spriteImg, direction, frame, px, py) {
  if (!spriteImg) return
  const frameIdx = frame % 3
  const dirRow = TUXEMON_DIR[direction] ?? TUXEMON_DIR.down
  const sx = frameIdx * CHAR_W
  const sy = dirRow * CHAR_H
  // Draw with feet aligned to bottom of tile
  const drawX = Math.floor(px)
  const drawY = Math.floor(py) - CHAR_H + S
  ctx.drawImage(spriteImg, sx, sy, CHAR_W, CHAR_H, drawX, drawY, CHAR_W, CHAR_H)
}

export function drawPlayerSprite(ctx, atlas, direction, frame, px, py) {
  drawTuxemonSprite(ctx, atlas.player, direction, frame, px, py)
}

export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick, direction, walkFrame) {
  const spriteImg = atlas.npcSprites[spriteType]
  const frame = walkFrame ?? 0
  if (spriteImg) {
    drawTuxemonSprite(ctx, spriteImg, direction || 'down', frame, px, py)
  } else {
    drawTuxemonSprite(ctx, atlas.player, direction || 'down', frame, px, py)
  }
}

export function drawCharacterShadow(ctx, px, py, width, alpha) {
  const w = width || 12
  const h = w * 0.4
  const cx = Math.floor(px) + S / 2
  const cy = Math.floor(py) + S - 1
  ctx.save()
  ctx.globalAlpha = alpha || 0.3
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawTreeShadow(ctx, px, py) {
  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#1A3A0A'
  ctx.beginPath()
  ctx.ellipse(Math.floor(px) + S + 3, Math.floor(py) + S - 1, 7, 3, 0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawWindowGlow(ctx, px, py, intensity) {
  if (intensity <= 0) return
  ctx.save()
  ctx.globalAlpha = intensity * 0.6
  const cx = Math.floor(px) + S / 2
  const cy = Math.floor(py) + S / 2
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, S * 0.8)
  grad.addColorStop(0, '#ffcc44')
  grad.addColorStop(0.5, 'rgba(255,200,60,0.3)')
  grad.addColorStop(1, 'rgba(255,200,60,0)')
  ctx.fillStyle = grad
  ctx.fillRect(px - 4, py - 4, S + 8, S + 8)
  ctx.restore()
}

// ==================== INTERIOR TILE RENDERING ====================
export const IT = {
  FLOOR: 50, WALL: 51, TABLE: 52, CHAIR: 53, BOOKSHELF: 54,
  CARPET: 55, ALTAR: 56, BARREL: 57, BED: 58, DOOR_MAT: 59,
  TORCH: 60, POT: 61, CHEST: 62,
}

const SOLID_INTERIOR = new Set([IT.WALL, IT.TABLE, IT.BOOKSHELF, IT.BARREL, IT.BED, IT.TORCH, IT.POT, IT.CHEST])

export function drawInteriorTile(ctx, atlas, tileType, px, py, tick) {
  const ts = atlas && atlas.tileset

  function floorBg() {
    if (ts) {
      blitVariant(ctx, ts, ITC.floor, px, py)
    } else {
      ctx.fillStyle = '#B88060'
      ctx.fillRect(px, py, S, S)
    }
  }

  switch (tileType) {
    case IT.FLOOR: floorBg(); break

    case IT.WALL:
      if (ts) blitVariant(ctx, ts, ITC.wall, px, py)
      else { ctx.fillStyle = '#786A5E'; ctx.fillRect(px, py, S, S) }
      break

    case IT.TABLE:
      floorBg()
      if (ts) blit(ctx, ts, tileHash(px, py) % 2 === 0 ? ITC.table : ITC.table2, px, py)
      break

    case IT.CHAIR:
      floorBg()
      if (ts) blit(ctx, ts, ITC.chair, px, py)
      break

    case IT.BOOKSHELF:
      if (ts) {
        blitVariant(ctx, ts, ITC.wall, px, py)
        blit(ctx, ts, tileHash(px, py) % 2 === 0 ? ITC.bookshelf : ITC.bookshelf2, px, py)
      } else { ctx.fillStyle = '#786A5E'; ctx.fillRect(px, py, S, S) }
      break

    case IT.CARPET:
      floorBg()
      if (ts) blit(ctx, ts, ITC.carpet, px, py)
      break

    case IT.ALTAR: {
      floorBg()
      if (ts) blit(ctx, ts, ITC.altar, px, py)
      const glow = 0.5 + Math.sin(tick * 0.08) * 0.3
      ctx.save()
      ctx.globalAlpha = glow * 0.3
      ctx.fillStyle = '#FFE0A0'
      ctx.beginPath()
      ctx.arc(px + S / 2, py + S / 2, S * 0.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      if (Math.sin(tick * 0.12) > 0.3) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(px + 3, py + 1, 1, 1)
        ctx.fillRect(px + 11, py + 2, 1, 1)
      }
      break
    }

    case IT.BARREL: floorBg(); if (ts) blit(ctx, ts, ITC.barrel, px, py); break
    case IT.BED:    floorBg(); if (ts) blit(ctx, ts, ITC.bed, px, py); break
    case IT.DOOR_MAT: floorBg(); if (ts) blit(ctx, ts, ITC.doormat, px, py); break

    case IT.TORCH: {
      if (ts) {
        blitVariant(ctx, ts, ITC.wall, px, py)
        blit(ctx, ts, ITC.torch, px, py)
      } else { ctx.fillStyle = '#786A5E'; ctx.fillRect(px, py, S, S) }
      ctx.save()
      const pulse = 0.3 + Math.sin(tick * 0.1 + px) * 0.1
      ctx.globalAlpha = pulse
      const g = ctx.createRadialGradient(px + 8, py + 5, 0, px + 8, py + 5, 10)
      g.addColorStop(0, '#FF882244')
      g.addColorStop(1, 'rgba(255,136,34,0)')
      ctx.fillStyle = g
      ctx.fillRect(px - 4, py - 4, S + 8, S + 8)
      ctx.restore()
      const fl = Math.sin(tick * 0.15 + px) * 0.8
      ctx.fillStyle = '#FF4400'
      ctx.fillRect(px + 5 + fl, py + 3, 6, 5)
      ctx.fillStyle = '#FF8833'
      ctx.fillRect(px + 6, py + 3, 4, 4)
      ctx.fillStyle = '#FFDD44'
      ctx.fillRect(px + 7, py + 4, 2, 2)
      break
    }

    case IT.POT:   floorBg(); if (ts) blit(ctx, ts, ITC.pot, px, py); break
    case IT.CHEST:  floorBg(); if (ts) blit(ctx, ts, ITC.chest, px, py); break
    default: floorBg()
  }
}

export function canMoveInterior(interiorMap, x, y, interiorNpcs) {
  if (x < 0 || y < 0 || y >= interiorMap.length || x >= interiorMap[0].length) return false
  if (SOLID_INTERIOR.has(interiorMap[y][x])) return false
  if (interiorNpcs) {
    for (const npc of interiorNpcs) {
      if (npc.x === x && npc.y === y) return false
    }
  }
  return true
}

// ==================== INTERIOR GENERATION ====================
export function generateInterior(zone) {
  const W = 14, H = 12
  const m = Array.from({ length: H }, () => Array(W).fill(IT.FLOOR))

  // Walls
  for (let x = 0; x < W; x++) { m[0][x] = IT.WALL; m[H - 1][x] = IT.WALL }
  for (let y = 0; y < H; y++) { m[y][0] = IT.WALL; m[y][W - 1] = IT.WALL }

  // Door
  m[H - 1][6] = IT.DOOR_MAT; m[H - 1][7] = IT.DOOR_MAT

  // Torches on walls
  m[0][2] = IT.TORCH; m[0][W - 3] = IT.TORCH
  m[4][0] = IT.TORCH; m[4][W - 1] = IT.TORCH
  m[8][0] = IT.TORCH; m[8][W - 1] = IT.TORCH

  // Central altar with carpet aisle
  m[2][6] = IT.ALTAR; m[2][7] = IT.ALTAR
  for (let y = 3; y <= H - 2; y++) { m[y][6] = IT.CARPET; m[y][7] = IT.CARPET }

  // Zone-specific furniture
  if (zone.id === 1) {
    // Cabane de la Vérité — bibliothèque / writing room
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][3] = IT.BOOKSHELF
    m[1][W - 2] = IT.BOOKSHELF; m[1][W - 3] = IT.BOOKSHELF; m[1][W - 4] = IT.BOOKSHELF
    m[3][2] = IT.TABLE; m[3][3] = IT.TABLE; m[4][2] = IT.CHAIR; m[4][3] = IT.CHAIR
    m[3][W - 3] = IT.TABLE; m[3][W - 4] = IT.TABLE; m[4][W - 3] = IT.CHAIR; m[4][W - 4] = IT.CHAIR
    m[7][1] = IT.BED; m[8][1] = IT.CHEST; m[6][1] = IT.POT; m[9][W - 2] = IT.POT
    m[9][1] = IT.BARREL; m[9][2] = IT.BARREL; m[7][W - 2] = IT.BARREL
    m[6][2] = IT.BOOKSHELF; m[6][3] = IT.BOOKSHELF
  } else if (zone.id === 2) {
    // Tour de l'Inventaire — storage/inventory room
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][W - 2] = IT.BOOKSHELF; m[1][W - 3] = IT.BOOKSHELF
    m[3][1] = IT.CHEST; m[3][2] = IT.CHEST; m[5][1] = IT.CHEST
    m[3][W - 2] = IT.CHEST; m[3][W - 3] = IT.CHEST; m[5][W - 2] = IT.CHEST
    m[5][4] = IT.TABLE; m[5][5] = IT.TABLE; m[5][8] = IT.TABLE; m[5][9] = IT.TABLE
    m[6][4] = IT.CHAIR; m[6][5] = IT.CHAIR; m[6][8] = IT.CHAIR; m[6][9] = IT.CHAIR
    m[8][1] = IT.POT; m[9][1] = IT.BARREL; m[8][W - 2] = IT.POT; m[9][W - 2] = IT.BARREL
    m[8][2] = IT.BOOKSHELF; m[8][3] = IT.BOOKSHELF; m[8][W - 3] = IT.BOOKSHELF; m[8][W - 4] = IT.BOOKSHELF
  } else if (zone.id === 3) {
    // Forge du Silence — meditation/forge room
    m[1][1] = IT.BOOKSHELF; m[1][W - 2] = IT.BOOKSHELF
    m[2][4] = IT.POT; m[2][9] = IT.POT; m[3][1] = IT.POT; m[3][W - 2] = IT.POT
    m[5][2] = IT.TABLE; m[5][3] = IT.TABLE; m[6][2] = IT.CHAIR
    m[8][W - 2] = IT.BED; m[8][W - 3] = IT.BED
    m[9][1] = IT.BARREL; m[9][2] = IT.BARREL; m[9][W - 2] = IT.BARREL
    m[7][1] = IT.CHEST
  } else {
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF; m[1][W - 2] = IT.BOOKSHELF; m[1][W - 3] = IT.BOOKSHELF
    m[3][2] = IT.TABLE; m[4][2] = IT.CHAIR; m[3][W - 3] = IT.TABLE; m[4][W - 3] = IT.CHAIR
    m[7][1] = IT.BARREL; m[7][W - 2] = IT.POT
  }

  return { map: m, width: W, height: H, spawnX: 6, spawnY: H - 2 }
}

export { S }
