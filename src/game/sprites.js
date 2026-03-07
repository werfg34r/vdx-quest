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

  // Stone castle building tiles (cols 26-28, rows 23-26)
  stoneRoofL:  { x: 26, y: 23, needsBase: 'grass' },
  stoneRoofC:  { x: 27, y: 23, needsBase: 'grass' },
  stoneRoofR:  { x: 28, y: 23, needsBase: 'grass' },
  stoneWallL:  { x: 26, y: 24 },
  stoneWallC:  { x: 27, y: 24 },
  stoneWallR:  { x: 28, y: 24 },
  stoneWall2L: { x: 26, y: 25 },
  stoneWall2C: { x: 27, y: 25 },
  stoneWall2R: { x: 28, y: 25 },
  stoneDoorL:  { x: 26, y: 26 },
  stoneDoorC:  { x: 27, y: 26 },
  stoneDoorR:  { x: 28, y: 26 },

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

    // Stone building tiles
    case 11: // ROOF (center)
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.stoneRoofC, px, py)
      break
    case 20: // ROOF_L
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.stoneRoofL, px, py)
      break
    case 21: // ROOF_R
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.stoneRoofR, px, py)
      break
    case 12: // WALL (center)
      blitTile(ctx, img, tc.stoneWallC, px, py)
      break
    case 22: // WALL_L
      blitTile(ctx, img, tc.stoneWallL, px, py)
      break
    case 23: // WALL_R
      blitTile(ctx, img, tc.stoneWallR, px, py)
      break
    case 13: // DOOR (dark stone entrance)
      blitTile(ctx, img, tc.stoneDoorC, px, py)
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
export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick) {
  const charDef = NPC_CHARS[spriteType]
  if (!charDef) {
    // Fallback: draw as player facing down
    drawPlayerSprite(ctx, atlas, 'down', 0, px, py)
    return
  }

  const img = atlas.character

  // Idle animation: slight bob between frame 0 and 1
  const frameIdx = Math.floor(tick / 30) % 2 === 0 ? 0 : 1

  const sx = (charDef.startCol + frameIdx) * S
  // NPCs face down by default
  const syTop = charDef.baseRow * S
  const syBot = (charDef.baseRow + 1) * S

  ctx.drawImage(img, sx, syTop, S, S, Math.floor(px), Math.floor(py) - S, S, S)
  ctx.drawImage(img, sx, syBot, S, S, Math.floor(px), Math.floor(py), S, S)
}

export { S }
