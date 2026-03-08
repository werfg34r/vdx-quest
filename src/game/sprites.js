// ============================================================
// VDX Quest — Sprites & Rendering (FROM ABSOLUTE ZERO)
// ============================================================
// Only: terrain tiles, animated trees, houses, player, interiors
// No NPCs, no particles, no minimap, no HUD

const S = 16

// ============================================================
// ASSET LOADING — only what we need
// ============================================================
function img(src) {
  return new Promise(resolve => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => { console.warn('Failed:', src); resolve(null) }
    i.src = src
  })
}

export async function loadAssets() {
  const [tiles, tree1, tree2, houseR, houseB, houseBr, player] = await Promise.all([
    img('/assets/sunnyside_tiles.png'),
    img('/assets/spr_deco_tree_01_strip4.png'),
    img('/assets/spr_deco_tree_02_strip4.png'),
    img('/assets/house_red.png'),
    img('/assets/house_blue.png'),
    img('/assets/house_brown.png'),
    img('/assets/npc_adventurer.png'),
  ])
  return {
    tiles,
    tree1: { img: tree1, fw: tree1 ? Math.floor(tree1.width / 4) : 32, fh: tree1 ? tree1.height : 32 },
    tree2: { img: tree2, fw: tree2 ? Math.floor(tree2.width / 4) : 24, fh: tree2 ? tree2.height : 28 },
    houses: { 1: houseR, 2: houseB, 3: houseBr },
    player,
  }
}

// ============================================================
// TERRAIN TILE COORDS — sunnyside_tiles.png (16 cols × 8 rows)
// ============================================================
const TC = {
  grass:     [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  darkGrass: [{ x: 6, y: 0 }, { x: 7, y: 0 }],
  tallGrass: [{ x: 8, y: 0 }, { x: 9, y: 0 }],
  path:      [{ x: 10, y: 0 }, { x: 11, y: 0 }, { x: 12, y: 0 }],
  sand:      [{ x: 13, y: 0 }, { x: 14, y: 0 }],
  water:     [{ x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }],
  fence:     { x: 7, y: 1 },
  flower:    [{ x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }],
  bush:      [{ x: 0, y: 1 }, { x: 1, y: 1 }],
}

// ============================================================
// INTERIOR TILE COORDS — sunnyside_tiles.png rows 4–5
// ============================================================
const IC = {
  floor:     [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
  wall:      [{ x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }],
  table:     [{ x: 6, y: 4 }, { x: 7, y: 4 }],
  chair:     { x: 8, y: 4 },
  bookshelf: [{ x: 9, y: 4 }, { x: 10, y: 4 }],
  barrel:    { x: 11, y: 4 },
  chest:     { x: 12, y: 4 },
  bed:       { x: 13, y: 4 },
  pot:       { x: 14, y: 4 },
  carpet:    { x: 15, y: 4 },
  torch:     { x: 0, y: 5 },
  doormat:   { x: 1, y: 5 },
}

// ============================================================
// HELPERS
// ============================================================
function hash(a, b) { return ((Math.floor(a) * 374761 + Math.floor(b) * 668265) % 997 + 997) % 997 }
function blit(ctx, sheet, c, px, py) { ctx.drawImage(sheet, c.x * S, c.y * S, S, S, px | 0, py | 0, S, S) }
function blitVar(ctx, sheet, arr, px, py) { blit(ctx, sheet, arr[hash(px, py) % arr.length], px, py) }

// ============================================================
// TERRAIN RENDERING
// ============================================================
export function drawGround(ctx, assets, type, px, py, tick) {
  const t = assets.tiles
  if (!t) return
  switch (type) {
    case 0:  blitVar(ctx, t, TC.grass, px, py); break
    case 1:  blitVar(ctx, t, TC.path, px, py); break
    case 2: { const f = Math.floor(tick / 20) % 4; blit(ctx, t, TC.water[f], px, py); break }
    case 4:  blitVar(ctx, t, TC.flower, px, py); break
    case 5:  blit(ctx, t, TC.fence, px, py); break
    case 7:  blitVar(ctx, t, TC.sand, px, py); break
    case 8:  blitVar(ctx, t, TC.darkGrass, px, py); break
    case 9:  blitVar(ctx, t, TC.bush, px, py); break
    case 11: blitVar(ctx, t, TC.tallGrass, px, py); break
    default: blitVar(ctx, t, TC.grass, px, py)
  }
}

// ============================================================
// ANIMATED TREES — spr_deco_tree_01/02_strip4.png
// ============================================================
export function drawTree(ctx, assets, treeObj, tick) {
  const tree = treeObj.type === 2 ? assets.tree2 : assets.tree1
  if (!tree.img) return
  const frame = (Math.floor(tick / 30) + hash(treeObj.x, treeObj.y) % 4) % 4
  const sx = frame * tree.fw
  // Center on 2×2 block, bottom-align with bottom of block
  const px = treeObj.x * S + S - tree.fw / 2
  const py = (treeObj.y + 2) * S - tree.fh
  ctx.drawImage(tree.img, sx, 0, tree.fw, tree.fh, px | 0, py | 0, tree.fw, tree.fh)
}

export function drawTreeShadow(ctx, treeObj) {
  ctx.save()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(treeObj.x * S + S, (treeObj.y + 2) * S - 2, 10, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ============================================================
// HOUSES — 80×64 pre-made sprites (5×4 tiles)
// ============================================================
export function drawHouse(ctx, assets, id, hx, hy) {
  const h = assets.houses[id]
  if (!h) return
  ctx.drawImage(h, hx * S, hy * S, 80, 64)
}

export function drawHouseShadow(ctx, hx, hy) {
  ctx.save()
  ctx.globalAlpha = 0.1
  ctx.fillStyle = '#000'
  ctx.fillRect(hx * S + 82, hy * S + 8, 6, 56)
  ctx.fillRect(hx * S - 2, hy * S + 64, 84, 5)
  ctx.restore()
}

// ============================================================
// PLAYER — Tuxemon 48×128 (3 cols × 4 rows at 16×32)
// Row: 0=down 1=left 2=right 3=up
// ============================================================
const DIR = { down: 0, left: 1, right: 2, up: 3 }

export function drawPlayer(ctx, assets, dir, frame, px, py) {
  if (!assets.player) return
  const col = frame % 3
  const row = DIR[dir] ?? 0
  ctx.drawImage(assets.player, col * 16, row * 32, 16, 32, px | 0, (py | 0) - 32 + S, 16, 32)
}

export function drawShadow(ctx, px, py) {
  ctx.save()
  ctx.globalAlpha = 0.2
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse((px | 0) + S / 2, (py | 0) + S - 1, 6, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ============================================================
// INTERIOR TILES
// ============================================================
export const IT = {
  FLOOR: 50, WALL: 51, TABLE: 52, CHAIR: 53, BOOKSHELF: 54,
  CARPET: 55, BARREL: 57, BED: 58, DOORMAT: 59, TORCH: 60, POT: 61, CHEST: 62,
}

const SOLID_INT = new Set([IT.WALL, IT.TABLE, IT.BOOKSHELF, IT.BARREL, IT.BED, IT.TORCH, IT.POT, IT.CHEST])

export function drawInterior(ctx, assets, type, px, py, tick) {
  const t = assets.tiles
  if (!t) return
  const drawF = () => blitVar(ctx, t, IC.floor, px, py)
  const drawW = () => blitVar(ctx, t, IC.wall, px, py)

  switch (type) {
    case IT.FLOOR:     drawF(); break
    case IT.WALL:      drawW(); break
    case IT.TABLE:     drawF(); blit(ctx, t, IC.table[hash(px, py) % 2], px, py); break
    case IT.CHAIR:     drawF(); blit(ctx, t, IC.chair, px, py); break
    case IT.BOOKSHELF: drawW(); blit(ctx, t, IC.bookshelf[hash(px, py) % 2], px, py); break
    case IT.CARPET:    drawF(); blit(ctx, t, IC.carpet, px, py); break
    case IT.BARREL:    drawF(); blit(ctx, t, IC.barrel, px, py); break
    case IT.BED:       drawF(); blit(ctx, t, IC.bed, px, py); break
    case IT.DOORMAT:   drawF(); blit(ctx, t, IC.doormat, px, py); break
    case IT.TORCH: {
      drawW(); blit(ctx, t, IC.torch, px, py)
      ctx.save()
      ctx.globalAlpha = 0.25 + Math.sin(tick * 0.1 + px) * 0.1
      const g = ctx.createRadialGradient(px + 8, py + 4, 0, px + 8, py + 4, 14)
      g.addColorStop(0, 'rgba(255,136,34,0.5)')
      g.addColorStop(1, 'rgba(255,136,34,0)')
      ctx.fillStyle = g
      ctx.fillRect(px - 4, py - 6, S + 8, S + 12)
      ctx.restore()
      ctx.fillStyle = '#FF8833'; ctx.fillRect(px + 6, py + 2, 4, 4)
      ctx.fillStyle = '#FFDD44'; ctx.fillRect(px + 7, py + 3, 2, 2)
      break
    }
    case IT.POT:   drawF(); blit(ctx, t, IC.pot, px, py); break
    case IT.CHEST: drawF(); blit(ctx, t, IC.chest, px, py); break
    default: drawF()
  }
}

export function isInteriorSolid(type) { return SOLID_INT.has(type) }

export { S }
