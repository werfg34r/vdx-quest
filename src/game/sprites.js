// Sprite Atlas - Loads real PNG tilesets (ArMM1998 Zelda-like, CC0)
// Overworld.png: 640x576, 16x16 tiles (40 cols x 36 rows)
// character.png: 272x256, 16x16 frames, characters are 16x32 (2 rows)
// npc.png: 64x128, 16x16 frames

const S = 16 // source tile size

// Tile positions in overworld.png (col, row) -> pixel = (col*16, row*16)
// Based on visual analysis of the ArMM1998 Zelda-like tileset
const TILE_COORDS = {
  // Grass variants (solid green, no edges)
  grass: [
    { x: 0, y: 7 },  // bright green
    { x: 1, y: 7 },  // green with detail
    { x: 0, y: 6 },  // lighter green
  ],
  // Dark grass (from tree/forest area)
  darkGrass: [
    { x: 0, y: 3 },  // dark forest green
    { x: 2, y: 3 },  // dark green variant
  ],
  // Path / dirt (sandy brown)
  path: [
    { x: 31, y: 3 },  // sandy path
    { x: 32, y: 3 },  // sandy path variant
  ],
  // Water (solid blue, center tile)
  water: [
    { x: 19, y: 8 },  // deep blue
    { x: 20, y: 8 },  // deep blue variant
  ],
  // Tree canopy (single tile, green blob)
  tree: { x: 1, y: 15 },
  // Mountain / stone
  mountain: { x: 22, y: 0 },
  // Flower / decorative grass
  flower: [
    { x: 17, y: 7 },  // light green with detail
    { x: 16, y: 7 },  // variant
  ],
  // Bridge (wooden plank)
  bridge: { x: 34, y: 2 },
  // Fence
  fence: { x: 6, y: 3 },
  // Building - Roof (from house at cols 6-10, rows 0-2)
  roof: { x: 8, y: 0 },    // center roof tile
  // Building - Wall
  wall: { x: 8, y: 1 },    // center wall with window
  // Building - Door
  door: { x: 8, y: 2 },    // door tile
  // Sign
  sign: { x: 30, y: 0 },
  // Sand
  sand: { x: 28, y: 0 },
  // Tall grass
  tallGrass: { x: 1, y: 3 },
}

// Character sprite layout in character.png
// Characters are 16x32 (head in row N, body in row N+1)
// Direction mapping (row pairs):
//   Rows 0-1: Down (facing camera)
//   Rows 2-3: Side (right-facing)
//   Rows 4-5: Up (facing away)
//   Rows 6-7: Side variant (left-facing or other)
// Walking frames: 0, 1, 2 (3 frames per direction)
const CHAR_LAYOUT = {
  down:  { topRow: 0, frames: [0, 1, 2] },
  right: { topRow: 2, frames: [0, 1, 2] },
  up:    { topRow: 4, frames: [0, 1, 2] },
  left:  { topRow: 6, frames: [0, 1, 2] },
}

// NPC sprite layout in npc.png (64x128 = 4 cols x 8 rows at 16x16)
// Simple standing sprites, each 16x32 (2 rows)
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

  return {
    overworld,
    character,
    npc,
    tileCoords: TILE_COORDS,
    charLayout: CHAR_LAYOUT,
    npcLayout: NPC_LAYOUT,
    S,
  }
}

// Draw a tile from the overworld spritesheet
export function drawSpriteTile(ctx, atlas, tileType, px, py, tick) {
  const coords = atlas.tileCoords
  const img = atlas.overworld
  const s = atlas.S
  let src

  switch (tileType) {
    case 0: // GRASS
      src = coords.grass[tileHash(px, py) % coords.grass.length]
      break
    case 9: // DARK_GRASS
      src = coords.darkGrass[tileHash(px, py) % coords.darkGrass.length]
      break
    case 17: // TALL_GRASS
      src = coords.tallGrass
      break
    case 1: // PATH
      src = coords.path[tileHash(px, py) % coords.path.length]
      break
    case 2: // WATER
      src = coords.water[Math.floor(tick / 20) % coords.water.length]
      break
    case 3: // TREE
      src = coords.tree
      break
    case 5: // MOUNTAIN
      src = coords.mountain
      break
    case 6: // FLOWER
      src = coords.flower[tileHash(px, py) % coords.flower.length]
      break
    case 7: // BRIDGE
      src = coords.bridge
      break
    case 8: // FENCE
      src = coords.fence
      break
    case 11: // ROOF
      src = coords.roof
      break
    case 12: // WALL
      src = coords.wall
      break
    case 13: // DOOR
      src = coords.door
      break
    case 14: // SIGN
      src = coords.sign
      break
    case 10: // SAND
      src = coords.sand
      break
    default:
      src = coords.grass[0]
  }

  if (src) {
    ctx.drawImage(img, src.x * s, src.y * s, s, s, Math.floor(px), Math.floor(py), s, s)
  }
}

// Draw player character (16x32, using 2 rows from spritesheet)
export function drawPlayerSprite(ctx, atlas, direction, frame, px, py) {
  const layout = atlas.charLayout[direction] || atlas.charLayout.down
  const frameIdx = layout.frames[frame % layout.frames.length]
  const img = atlas.character
  const s = atlas.S

  const sx = frameIdx * s
  const syTop = layout.topRow * s
  const syBot = (layout.topRow + 1) * s

  // Draw top half (head), then bottom half (body)
  // Character is drawn 16px higher to account for 32px tall sprite on 16px grid
  ctx.drawImage(img, sx, syTop, s, s, Math.floor(px), Math.floor(py) - s, s, s)
  ctx.drawImage(img, sx, syBot, s, s, Math.floor(px), Math.floor(py), s, s)
}

// Draw NPC sprite (16x32 from npc.png, or fallback to player with different colors)
export function drawNPCSprite(ctx, atlas, spriteType, px, py, tick) {
  const layout = atlas.npcLayout[spriteType]
  if (layout) {
    const img = atlas.npc
    const s = atlas.S
    const sx = layout.col * s
    const syTop = layout.topRow * s
    const syBot = (layout.topRow + 1) * s
    ctx.drawImage(img, sx, syTop, s, s, Math.floor(px), Math.floor(py) - s, s, s)
    ctx.drawImage(img, sx, syBot, s, s, Math.floor(px), Math.floor(py), s, s)
  } else {
    // Fallback: draw player sprite facing down, frame 0
    drawPlayerSprite(ctx, atlas, 'down', 0, px, py)
  }
}

// Deterministic hash for tile variation
function tileHash(px, py) {
  return ((Math.floor(px) * 374761 + Math.floor(py) * 668265) % 1000 + 1000) % 1000
}

export { S }
