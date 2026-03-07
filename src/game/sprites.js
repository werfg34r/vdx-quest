// Sprite Atlas - Loads real PNG tilesets (ArMM1998 Zelda-like, CC0)
// Overworld.png: 640x576, 16x16 tiles (40 cols x 36 rows)
// character.png: 272x256, 16x16 frames, characters are 16x32 (2 rows)

const S = 16 // source tile size

// All coordinates verified as FULLY OPAQUE (0 transparent pixels)
// or marked as needing a base tile underneath
const TILE_COORDS = {
  // Grass (fully opaque greens)
  grass: [
    { x: 0, y: 0 },   // rgb=(60,190,65) - standard green
    { x: 0, y: 7 },   // rgb=(126,211,88) - lighter green
    { x: 1, y: 7 },   // rgb=(130,214,90) - light green variant
    { x: 5, y: 9 },   // rgb=(62,190,66) - medium green
  ],
  // Dark grass (fully opaque, darker shades)
  darkGrass: [
    { x: 4, y: 11 },  // rgb=(66,149,64) - dark green
    { x: 5, y: 11 },  // rgb=(59,164,63) - dark green variant
    { x: 6, y: 11 },  // rgb=(62,157,64) - dark green variant
  ],
  // Tall grass (green, fully opaque)
  tallGrass: [
    { x: 0, y: 4 },   // rgb=(96,204,78) - bright textured green
    { x: 2, y: 4 },   // rgb=(99,204,78) - variant
  ],
  // Path (fully opaque brown/tan)
  path: [
    { x: 7, y: 1 },   // rgb=(136,108,86) - brown path
    { x: 9, y: 1 },   // rgb=(136,107,86) - variant
  ],
  // Water (fully opaque blue)
  water: [
    { x: 17, y: 0 },  // rgb=(32,126,186) - deep blue
    { x: 18, y: 0 },  // rgb=(32,126,187) - variant
    { x: 19, y: 0 },  // rgb=(32,126,187) - variant
    { x: 17, y: 1 },  // rgb=(32,126,187) - variant
  ],
  // Tree (has transparency - needs grass base)
  tree: { x: 1, y: 15, needsBase: 'grass' },
  // Mountain / stone (fully opaque gray)
  mountain: [
    { x: 22, y: 1 },  // rgb=(182,185,190) - light gray
    { x: 24, y: 1 },  // rgb=(194,196,199) - lighter gray
  ],
  // Flower (fully opaque bright green)
  flower: [
    { x: 15, y: 6 },  // rgb=(182,236,118) - bright yellow-green
    { x: 17, y: 6 },  // rgb=(185,237,117) - variant
    { x: 1, y: 4 },   // rgb=(200,248,114) - very bright
  ],
  // Bridge (has transparency - needs water base)
  bridge: { x: 34, y: 2, needsBase: 'water' },
  // Fence (has transparency - needs grass base)
  fence: { x: 6, y: 3, needsBase: 'grass' },
  // Building roof (slight transparency - needs grass base)
  roof: { x: 8, y: 0, needsBase: 'grass' },
  // Building wall (fully opaque)
  wall: { x: 8, y: 1 },
  // Building door (fully opaque)
  door: { x: 8, y: 2 },
  // Sign (has transparency - needs path base)
  sign: { x: 30, y: 0, needsBase: 'path' },
  // Sand (fully opaque)
  sand: [
    { x: 28, y: 1 },  // rgb=(198,200,202) - light
    { x: 29, y: 1 },  // rgb=(188,191,195)
  ],
}

// Character walking directions (rows in character.png, 16x32 sprites)
const CHAR_LAYOUT = {
  down:  { topRow: 0, frames: [0, 1, 2] },
  right: { topRow: 2, frames: [0, 1, 2] },
  up:    { topRow: 4, frames: [0, 1, 2] },
  left:  { topRow: 6, frames: [0, 1, 2] },
}

// NPC layout in npc.png (64x128 = 4 cols x 8 rows at 16x16)
const NPC_LAYOUT = {
  mentor:   { col: 0, topRow: 0 },
  villager: { col: 1, topRow: 0 },
  warrior:  { col: 2, topRow: 0 },
  sage:     { col: 3, topRow: 0 },
  old:      { col: 0, topRow: 2 },
  trader:   { col: 1, topRow: 2 },
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function loadSpriteAtlas() {
  const [overworld, character, npc] = await Promise.all([
    loadImage('/assets/overworld.png'),
    loadImage('/assets/character.png'),
    loadImage('/assets/npc.png'),
  ])

  return { overworld, character, npc, S }
}

// Deterministic hash for tile variation
function tileHash(px, py) {
  return ((Math.floor(px) * 374761 + Math.floor(py) * 668265) % 997 + 997) % 997
}

// Draw a single 16x16 tile from the overworld spritesheet
function blitTile(ctx, img, coord, px, py) {
  ctx.drawImage(img, coord.x * S, coord.y * S, S, S, Math.floor(px), Math.floor(py), S, S)
}

// Pick from array or return single coord
function pickCoord(coords, px, py) {
  if (Array.isArray(coords)) {
    return coords[tileHash(px, py) % coords.length]
  }
  return coords
}

// Draw base tile (for transparent overlays)
function drawBase(ctx, img, baseType, px, py) {
  const baseCoords = {
    grass: TILE_COORDS.grass[0],
    water: TILE_COORDS.water[0],
    path: TILE_COORDS.path[0],
  }
  const base = baseCoords[baseType]
  if (base) {
    blitTile(ctx, img, base, px, py)
  }
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
    case 2: { // WATER (animated - cycle through variants)
      const waterCoords = tc.water
      const frame = Math.floor(tick / 15) % waterCoords.length
      blitTile(ctx, img, waterCoords[frame], px, py)
      break
    }
    case 3: // TREE (transparent - needs grass base)
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.tree, px, py)
      break
    case 5: // MOUNTAIN
      blitTile(ctx, img, pickCoord(tc.mountain, px, py), px, py)
      break
    case 6: // FLOWER
      blitTile(ctx, img, pickCoord(tc.flower, px, py), px, py)
      break
    case 7: // BRIDGE (transparent - needs water base)
      drawBase(ctx, img, 'water', px, py)
      blitTile(ctx, img, tc.bridge, px, py)
      break
    case 8: // FENCE (transparent - needs grass base)
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.fence, px, py)
      break
    case 11: // ROOF (slight transparency - needs grass base)
      drawBase(ctx, img, 'grass', px, py)
      blitTile(ctx, img, tc.roof, px, py)
      break
    case 12: // WALL
      blitTile(ctx, img, tc.wall, px, py)
      break
    case 13: // DOOR
      blitTile(ctx, img, tc.door, px, py)
      break
    case 14: // SIGN (transparent - needs path base)
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

// Draw player (16x32, 2 rows from spritesheet)
export function drawPlayerSprite(ctx, atlas, direction, frame, px, py) {
  const layout = CHAR_LAYOUT[direction] || CHAR_LAYOUT.down
  const frameIdx = layout.frames[frame % layout.frames.length]
  const img = atlas.character

  const sx = frameIdx * S
  const syTop = layout.topRow * S
  const syBot = (layout.topRow + 1) * S

  // Draw 16x32 character (top half above, bottom half at tile position)
  ctx.drawImage(img, sx, syTop, S, S, Math.floor(px), Math.floor(py) - S, S, S)
  ctx.drawImage(img, sx, syBot, S, S, Math.floor(px), Math.floor(py), S, S)
}

// Draw NPC (16x32 from npc.png)
export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick) {
  const layout = NPC_LAYOUT[spriteType]
  if (layout) {
    const img = atlas.npc
    const sx = layout.col * S
    const syTop = layout.topRow * S
    const syBot = (layout.topRow + 1) * S
    ctx.drawImage(img, sx, syTop, S, S, Math.floor(px), Math.floor(py) - S, S, S)
    ctx.drawImage(img, sx, syBot, S, S, Math.floor(px), Math.floor(py), S, S)
  } else {
    // Fallback to player sprite
    drawPlayerSprite(ctx, atlas, 'down', 0, px, py)
  }
}

export { S }
