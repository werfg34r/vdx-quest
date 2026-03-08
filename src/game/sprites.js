// Sprite Atlas - Loads real PNG tilesets (ArMM1998 Zelda-like, CC0)
// Overworld.png: 640x576, 16x16 tiles (40 cols x 36 rows)
// character.png: 272x256, 16x16 frames, 8 distinct characters

const S = 16 // source tile size

// Tile coordinates verified via pixel analysis
const TILE_COORDS = {
  grass: [
    { x: 0, y: 0 },
    { x: 0, y: 7 },
    { x: 1, y: 7 },
    { x: 5, y: 9 },
  ],
  darkGrass: [
    { x: 4, y: 11 },
    { x: 5, y: 11 },
    { x: 6, y: 11 },
  ],
  tallGrass: [
    { x: 0, y: 4 },
    { x: 2, y: 4 },
  ],
  path: [
    { x: 7, y: 1 },
    { x: 9, y: 1 },
  ],
  water: [
    { x: 17, y: 0 },
    { x: 18, y: 0 },
    { x: 19, y: 0 },
    { x: 17, y: 1 },
  ],
  tree: { x: 1, y: 15, needsBase: 'grass' },
  mountain: [
    { x: 22, y: 1 },
    { x: 24, y: 1 },
  ],
  flower: [
    { x: 15, y: 6 },
    { x: 17, y: 6 },
    { x: 1, y: 4 },
  ],
  bridge: { x: 34, y: 2, needsBase: 'water' },
  fence: { x: 6, y: 3, needsBase: 'grass' },

  // Wooden house tiles from the large house in tileset
  // Row 0 of house: Roof top (cols 3-5 of the big house, rows 0-1)
  houseRoofTL:  { x: 3, y: 0 },
  houseRoofTC:  { x: 4, y: 0 },
  houseRoofTR:  { x: 5, y: 0 },
  // Row 1: Roof middle
  houseRoofML:  { x: 3, y: 1 },
  houseRoofMC:  { x: 4, y: 1 },
  houseRoofMR:  { x: 5, y: 1 },
  // Row 2: Wall with windows
  houseWallL:   { x: 3, y: 2 },
  houseWallWin: { x: 4, y: 2 },
  houseWallR:   { x: 5, y: 2 },
  // Row 3: Wall with door
  houseWallDL:  { x: 3, y: 3 },
  houseDoor:    { x: 4, y: 3 },
  houseWallDR:  { x: 5, y: 3 },

  sign: { x: 30, y: 0, needsBase: 'path' },
  sand: [
    { x: 28, y: 1 },
    { x: 29, y: 1 },
  ],
}

// 8 distinct characters in character.png for NPCs
// Each character: 3 columns (walk frames) x 8 rows (4 directions x 2 rows)
// Top block (rows 0-7): 5 characters at cols 0,3,6,9,12
// Bottom block (rows 8-15): 3 characters at cols 0,3,6
const NPC_CHARS = {
  // Player uses cols 0-2, rows 0-7
  mentor:   { startCol: 3,  baseRow: 0 },  // Different outfit
  villager: { startCol: 0,  baseRow: 8 },  // Gray/blue outfit (bottom block)
  warrior:  { startCol: 9,  baseRow: 0 },  // Distinct character
  sage:     { startCol: 12, baseRow: 0 },  // Another character
  old:      { startCol: 6,  baseRow: 8 },  // Brown outfit (bottom block)
  trader:   { startCol: 3,  baseRow: 8 },  // Dark outfit (bottom block)
}

// Direction offsets within a character block (each direction = 2 rows)
const DIR_ROWS = { down: 0, right: 2, up: 4, left: 6 }

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function loadSpriteAtlas() {
  const [overworld, character] = await Promise.all([
    loadImage('/assets/overworld.png'),
    loadImage('/assets/character.png'),
  ])
  return { overworld, character, S }
}

function tileHash(px, py) {
  return ((Math.floor(px) * 374761 + Math.floor(py) * 668265) % 997 + 997) % 997
}

function blitTile(ctx, img, coord, px, py) {
  ctx.drawImage(img, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

function pickCoord(coords, px, py) {
  if (Array.isArray(coords)) {
    return coords[tileHash(px, py) % coords.length]
  }
  return coords
}

function drawBase(ctx, img, baseType, px, py) {
  const baseCoords = {
    grass: TILE_COORDS.grass[0],
    water: TILE_COORDS.water[0],
    path: TILE_COORDS.path[0],
  }
  const base = baseCoords[baseType]
  if (base) blitTile(ctx, img, base, px, py)
}

export function drawSpriteTile(ctx, atlas, tileType, px, py, tick) {
  const img = atlas.overworld
  const tc = TILE_COORDS

  switch (tileType) {
    case 0: // GRASS
      blitTile(ctx, img, pickCoord(tc.grass, px, py), px, py)
      break
    case 9: // DARK_GRASS
      blitTile(ctx, img, pickCoord(tc.darkGrass, px, py), px, py)
      break
    case 17: // TALL_GRASS
      blitTile(ctx, img, pickCoord(tc.tallGrass, px, py), px, py)
      break
    case 1: // PATH
      blitTile(ctx, img, pickCoord(tc.path, px, py), px, py)
      break
    case 2: { // WATER (animated)
      const frame = Math.floor(tick / 15) % tc.water.length
      blitTile(ctx, img, tc.water[frame], px, py)
      break
    }
    case 3: // TREE
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.tree, px, py)
      break
    case 5: // MOUNTAIN
      blitTile(ctx, img, pickCoord(tc.mountain, px, py), px, py)
      break
    case 6: // FLOWER
      blitTile(ctx, img, pickCoord(tc.flower, px, py), px, py)
      break
    case 7: // BRIDGE
      drawBase(ctx, img, 'water', px, py)
      blitTile(ctx, img, tc.bridge, px, py)
      break
    case 8: // FENCE
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.fence, px, py)
      break

    // House tiles (wooden house from tileset)
    case 30: // HOUSE_ROOF_TL
      blitTile(ctx, img, tc.houseRoofTL, px, py)
      break
    case 31: // HOUSE_ROOF_TC
      blitTile(ctx, img, tc.houseRoofTC, px, py)
      break
    case 32: // HOUSE_ROOF_TR
      blitTile(ctx, img, tc.houseRoofTR, px, py)
      break
    case 33: // HOUSE_ROOF_ML
      blitTile(ctx, img, tc.houseRoofML, px, py)
      break
    case 34: // HOUSE_ROOF_MC
      blitTile(ctx, img, tc.houseRoofMC, px, py)
      break
    case 35: // HOUSE_ROOF_MR
      blitTile(ctx, img, tc.houseRoofMR, px, py)
      break
    case 36: // HOUSE_WALL_L
      blitTile(ctx, img, tc.houseWallL, px, py)
      break
    case 37: // HOUSE_WALL_WIN
      blitTile(ctx, img, tc.houseWallWin, px, py)
      break
    case 38: // HOUSE_WALL_R
      blitTile(ctx, img, tc.houseWallR, px, py)
      break
    case 39: // HOUSE_WALL_DL
      blitTile(ctx, img, tc.houseWallDL, px, py)
      break
    case 40: // HOUSE_DOOR
      blitTile(ctx, img, tc.houseDoor, px, py)
      break
    case 41: // HOUSE_WALL_DR
      blitTile(ctx, img, tc.houseWallDR, px, py)
      break

    case 14: // SIGN
      drawBase(ctx, img, 'path', px, py)
      blitTile(ctx, img, tc.sign, px, py)
      break
    case 10: // SAND
      blitTile(ctx, img, pickCoord(tc.sand, px, py), px, py)
      break
    default:
      blitTile(ctx, img, tc.grass[0], px, py)
  }
}

// Draw player (16x32 character, cols 0-2 of character.png)
export function drawPlayerSprite(ctx, atlas, direction, frame, px, py) {
  const img = atlas.character
  const frameIdx = frame % 3
  const dirOffset = DIR_ROWS[direction] || 0

  const sx = frameIdx * S
  const syTop = dirOffset * S
  const syBot = (dirOffset + 1) * S

  ctx.drawImage(img, sx, syTop, S, S, Math.floor(px), Math.floor(py) - S, S, S)
  ctx.drawImage(img, sx, syBot, S, S, Math.floor(px), Math.floor(py), S, S)
}

// Draw NPC using character.png (different character slots)
export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick, direction) {
  const charDef = NPC_CHARS[spriteType]
  if (!charDef) {
    drawPlayerSprite(ctx, atlas, direction || 'down', 0, px, py)
    return
  }

  const img = atlas.character
  // NPCs stand still (frame 0 only) - no walk animation
  const frameIdx = 0

  const sx = (charDef.startCol + frameIdx) * S
  const dirOffset = DIR_ROWS[direction || 'down'] || 0
  const syTop = (charDef.baseRow + dirOffset) * S
  const syBot = (charDef.baseRow + dirOffset + 1) * S

  ctx.drawImage(img, sx, syTop, S, S, Math.floor(px), Math.floor(py) - S, S, S)
  ctx.drawImage(img, sx, syBot, S, S, Math.floor(px), Math.floor(py), S, S)
}

// ==================== INTERIOR TILES ====================
const INTERIOR_COLORS = {
  floor:     '#8B7355',
  floorDark: '#7A6548',
  wall:      '#5C5040',
  wallTop:   '#6B5E4E',
  carpet:    '#8B2252',
  carpetB:   '#A0284E',
  table:     '#6B4226',
  tableLeg:  '#5B3216',
  chair:     '#8B6E4E',
  shelf:     '#6B4226',
  shelfItem: '#C7B777',
  book1:     '#C0392B',
  book2:     '#2E86C1',
  book3:     '#27AE60',
  barrel:    '#8B6848',
  barrelBand:'#555',
  bed:       '#C8B8A0',
  bedBlanket:'#2B6AAA',
  torch:     '#FF8833',
  torchBase: '#555',
  chest:     '#DAA520',
  chestBand: '#8B6914',
  altar:     '#C7B777',
  altarGlow: '#FFE0A0',
  pot:       '#AA7744',
  rug:       '#993333',
}

export function drawInteriorTile(ctx, tileType, px, py, tick) {
  const IC = INTERIOR_COLORS
  const T = S

  switch (tileType) {
    case 50: // FLOOR
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Plank lines
      ctx.strokeStyle = IC.floorDark
      ctx.lineWidth = 0.3
      ctx.beginPath()
      ctx.moveTo(px, py + 4); ctx.lineTo(px + T, py + 4)
      ctx.moveTo(px, py + 10); ctx.lineTo(px + T, py + 10)
      ctx.stroke()
      break

    case 51: // WALL
      ctx.fillStyle = IC.wall
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.wallTop
      ctx.fillRect(px, py, T, 6)
      // Stone lines
      ctx.strokeStyle = '#4A4035'
      ctx.lineWidth = 0.3
      ctx.beginPath()
      ctx.moveTo(px + 8, py); ctx.lineTo(px + 8, py + 6)
      ctx.moveTo(px + 4, py + 6); ctx.lineTo(px + 4, py + T)
      ctx.moveTo(px + 12, py + 6); ctx.lineTo(px + 12, py + T)
      ctx.stroke()
      break

    case 52: // TABLE
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Table top
      ctx.fillStyle = IC.table
      ctx.fillRect(px + 1, py + 3, 14, 10)
      // Legs
      ctx.fillStyle = IC.tableLeg
      ctx.fillRect(px + 2, py + 12, 2, 3)
      ctx.fillRect(px + 12, py + 12, 2, 3)
      break

    case 53: // CHAIR
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.chair
      ctx.fillRect(px + 3, py + 2, 10, 3) // back
      ctx.fillRect(px + 4, py + 5, 8, 7)  // seat
      ctx.fillRect(px + 4, py + 12, 2, 3) // legs
      ctx.fillRect(px + 10, py + 12, 2, 3)
      break

    case 54: // BOOKSHELF
      ctx.fillStyle = IC.wall
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.shelf
      ctx.fillRect(px + 1, py + 1, 14, 14)
      // Shelves
      ctx.fillStyle = IC.floorDark
      ctx.fillRect(px + 1, py + 5, 14, 1)
      ctx.fillRect(px + 1, py + 10, 14, 1)
      // Books
      ctx.fillStyle = IC.book1; ctx.fillRect(px + 2, py + 2, 3, 3)
      ctx.fillStyle = IC.book2; ctx.fillRect(px + 6, py + 2, 3, 3)
      ctx.fillStyle = IC.book3; ctx.fillRect(px + 10, py + 2, 3, 3)
      ctx.fillStyle = IC.book2; ctx.fillRect(px + 2, py + 6, 4, 4)
      ctx.fillStyle = IC.book1; ctx.fillRect(px + 7, py + 6, 3, 4)
      ctx.fillStyle = IC.book3; ctx.fillRect(px + 3, py + 11, 3, 3)
      ctx.fillStyle = IC.shelfItem; ctx.fillRect(px + 8, py + 11, 4, 3)
      break

    case 55: // CARPET
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.carpet
      ctx.fillRect(px + 1, py + 1, 14, 14)
      ctx.fillStyle = IC.carpetB
      ctx.fillRect(px + 3, py + 3, 10, 10)
      // Pattern
      ctx.fillStyle = IC.carpet
      ctx.fillRect(px + 6, py + 4, 4, 8)
      ctx.fillRect(px + 4, py + 6, 8, 4)
      break

    case 56: // QUEST_ALTAR (glowing interaction point)
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Glow effect
      const glow = 0.5 + Math.sin(tick * 0.08) * 0.3
      ctx.fillStyle = `rgba(199,183,119,${glow * 0.3})`
      ctx.fillRect(px - 2, py - 2, T + 4, T + 4)
      // Pedestal
      ctx.fillStyle = '#888'
      ctx.fillRect(px + 2, py + 8, 12, 7)
      ctx.fillStyle = '#999'
      ctx.fillRect(px + 3, py + 4, 10, 6)
      // Glowing book/scroll
      ctx.fillStyle = IC.altarGlow
      ctx.fillRect(px + 4, py + 2, 8, 5)
      ctx.fillStyle = IC.altar
      ctx.fillRect(px + 5, py + 3, 6, 3)
      // Sparkle
      if (Math.sin(tick * 0.1) > 0.3) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(px + 7, py + 1, 2, 2)
      }
      break

    case 57: // BARREL
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.barrel
      ctx.fillRect(px + 3, py + 2, 10, 12)
      ctx.fillStyle = IC.barrelBand
      ctx.fillRect(px + 3, py + 5, 10, 1)
      ctx.fillRect(px + 3, py + 10, 10, 1)
      break

    case 58: // BED
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      // Frame
      ctx.fillStyle = IC.table
      ctx.fillRect(px + 1, py + 1, 14, 14)
      // Pillow
      ctx.fillStyle = IC.bed
      ctx.fillRect(px + 2, py + 2, 12, 4)
      // Blanket
      ctx.fillStyle = IC.bedBlanket
      ctx.fillRect(px + 2, py + 6, 12, 8)
      break

    case 59: // DOOR_MAT (exit point)
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.rug
      ctx.fillRect(px + 2, py + 4, 12, 8)
      ctx.fillStyle = '#AA4444'
      ctx.fillRect(px + 4, py + 6, 8, 4)
      break

    case 60: // TORCH_WALL
      ctx.fillStyle = IC.wall
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.wallTop
      ctx.fillRect(px, py, T, 6)
      // Torch bracket
      ctx.fillStyle = IC.torchBase
      ctx.fillRect(px + 6, py + 7, 4, 6)
      // Flame
      const flicker = Math.sin(tick * 0.15 + px) * 0.5
      ctx.fillStyle = IC.torch
      ctx.fillRect(px + 5 + flicker, py + 3, 6, 5)
      ctx.fillStyle = '#FFCC00'
      ctx.fillRect(px + 6, py + 4, 4, 3)
      break

    case 61: // POT/VASE
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.pot
      ctx.fillRect(px + 4, py + 6, 8, 8)
      ctx.fillRect(px + 5, py + 4, 6, 3)
      ctx.fillStyle = '#996633'
      ctx.fillRect(px + 4, py + 9, 8, 1)
      break

    case 62: // CHEST
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
      ctx.fillStyle = IC.chest
      ctx.fillRect(px + 2, py + 5, 12, 9)
      ctx.fillStyle = IC.chestBand
      ctx.fillRect(px + 2, py + 8, 12, 2)
      ctx.fillRect(px + 6, py + 5, 4, 9)
      // Lock
      ctx.fillStyle = '#FFD700'
      ctx.fillRect(px + 7, py + 7, 2, 3)
      break

    default:
      ctx.fillStyle = IC.floor
      ctx.fillRect(px, py, T, T)
  }
}

// Interior tile constants
export const IT = {
  FLOOR: 50, WALL: 51, TABLE: 52, CHAIR: 53, BOOKSHELF: 54,
  CARPET: 55, ALTAR: 56, BARREL: 57, BED: 58, DOOR_MAT: 59,
  TORCH: 60, POT: 61, CHEST: 62,
}

const SOLID_INTERIOR = new Set([IT.WALL, IT.TABLE, IT.BOOKSHELF, IT.BARREL, IT.BED, IT.TORCH, IT.POT, IT.CHEST])

export function canMoveInterior(interiorMap, x, y) {
  if (x < 0 || y < 0 || y >= interiorMap.length || x >= interiorMap[0].length) return false
  return !SOLID_INTERIOR.has(interiorMap[y][x])
}

// Generate interior map for a zone
export function generateInterior(zone) {
  const W = 12, H = 10
  const m = Array.from({ length: H }, () => Array(W).fill(IT.FLOOR))

  // Walls on all edges
  for (let x = 0; x < W; x++) { m[0][x] = IT.WALL; m[H-1][x] = IT.WALL }
  for (let y = 0; y < H; y++) { m[y][0] = IT.WALL; m[y][W-1] = IT.WALL }

  // Door mat at bottom center
  m[H-1][5] = IT.DOOR_MAT
  m[H-1][6] = IT.DOOR_MAT

  // Torches on walls
  m[0][2] = IT.TORCH
  m[0][W-3] = IT.TORCH

  // Quest altar in center-top
  m[2][5] = IT.ALTAR
  m[2][6] = IT.ALTAR

  // Carpet leading to altar
  for (let y = 3; y <= H-2; y++) {
    m[y][5] = IT.CARPET
    m[y][6] = IT.CARPET
  }

  // Decoration varies by region
  if (zone.region === 1) {
    // Cozy: bookshelves, table, chairs
    m[1][1] = IT.BOOKSHELF; m[1][2] = IT.BOOKSHELF
    m[1][W-2] = IT.BOOKSHELF; m[1][W-3] = IT.BOOKSHELF
    m[3][2] = IT.TABLE; m[3][3] = IT.TABLE
    m[4][2] = IT.CHAIR; m[4][3] = IT.CHAIR
    m[3][W-3] = IT.TABLE; m[3][W-4] = IT.TABLE
    m[4][W-3] = IT.CHAIR; m[4][W-4] = IT.CHAIR
    m[6][1] = IT.POT; m[7][W-2] = IT.POT
    m[7][1] = IT.BARREL
  } else if (zone.region === 2) {
    // Training: barrels, chests, weapons
    m[1][1] = IT.TORCH; m[1][W-2] = IT.TORCH
    m[2][1] = IT.BARREL; m[2][2] = IT.BARREL
    m[2][W-2] = IT.BARREL; m[2][W-3] = IT.BARREL
    m[4][1] = IT.CHEST; m[4][W-2] = IT.CHEST
    m[6][2] = IT.TABLE; m[6][3] = IT.CHAIR
    m[6][W-3] = IT.TABLE; m[6][W-4] = IT.CHAIR
    m[7][1] = IT.POT; m[7][W-2] = IT.POT
  } else {
    // Temple: ornate, symmetric
    m[1][1] = IT.BOOKSHELF; m[1][W-2] = IT.BOOKSHELF
    m[3][1] = IT.CHEST; m[3][W-2] = IT.CHEST
    m[4][2] = IT.POT; m[4][W-3] = IT.POT
    m[6][1] = IT.BED; m[6][W-2] = IT.BED
    m[7][2] = IT.TABLE; m[7][3] = IT.CHAIR
    m[7][W-3] = IT.TABLE; m[7][W-4] = IT.CHAIR
  }

  return { map: m, width: W, height: H, spawnX: 5, spawnY: H - 2 }
}

export { S }
