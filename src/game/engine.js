// VDX Quest RPG Engine - Real tileset based rendering

const TILE = 16
const COLS = 50
const ROWS = 40

// Tile types
const T = {
  GRASS: 0, PATH: 1, WATER: 2, TREE: 3, ZONE: 4, MOUNTAIN: 5,
  FLOWER: 6, BRIDGE: 7, FENCE: 8, DARK_GRASS: 9, SAND: 10,
  ROOF: 11, WALL: 12, DOOR: 13, SIGN: 14, CHEST: 15,
  STONE_PATH: 16, TALL_GRASS: 17, WATER_EDGE: 18, HOUSE_WALL: 19,
  ROOF_L: 20, ROOF_R: 21, WALL_L: 22, WALL_R: 23,
}

const SOLID = new Set([T.WATER, T.TREE, T.MOUNTAIN, T.FENCE, T.WALL, T.ROOF, T.HOUSE_WALL, T.WATER_EDGE, T.ROOF_L, T.ROOF_R, T.WALL_L, T.WALL_R])

// Zone definitions (12 weeks)
const ZONES = [
  { id: 1, x: 8, y: 35, label: 'S1', name: 'Cabane de la Verite', region: 1 },
  { id: 2, x: 16, y: 33, label: 'S2', name: 'Tour du Choix', region: 1 },
  { id: 3, x: 25, y: 35, label: 'S3', name: 'Forge de l\'Offre', region: 1 },
  { id: 4, x: 35, y: 32, label: 'S4', name: 'Place Publique', region: 1 },
  { id: 5, x: 40, y: 25, label: 'S5', name: 'Arene des Voix', region: 2 },
  { id: 6, x: 33, y: 20, label: 'S6', name: 'Guilde du Courage', region: 2 },
  { id: 7, x: 24, y: 22, label: 'S7', name: 'Epreuve du Reel', region: 2 },
  { id: 8, x: 14, y: 20, label: 'S8', name: 'Bibliotheque Vivante', region: 2 },
  { id: 9, x: 10, y: 13, label: 'S9', name: 'Atelier de la Boucle', region: 3 },
  { id: 10, x: 20, y: 10, label: 'S10', name: 'Temple de la Constance', region: 3 },
  { id: 11, x: 32, y: 12, label: 'S11', name: 'Phare de la Posture', region: 3 },
  { id: 12, x: 25, y: 4, label: 'S12', name: 'Sommet VDX', region: 3 },
]

// NPCs
const NPCS = [
  {
    id: 'mentor', x: 8, y: 37, sprite: 'mentor', name: 'Laurent',
    dialog: [
      'Bienvenue, aventurier.',
      'Je suis Laurent, maitre de la methodologie Vendeur d\'Exception.',
      'Tu es ici pour une raison : transformer ton potentiel en realite.',
      'Devant toi s\'etend le Monde VDX. 3 regions, 12 epreuves, 90 jours.',
      'Commence par la Cabane de la Verite, juste au nord.',
      'Appuie sur ESPACE devant chaque batiment pour entrer.',
      'Bonne route, entrepreneur.',
    ]
  },
  {
    id: 'guide1', x: 12, y: 34, sprite: 'villager', name: 'Elise',
    dialog: [
      'Salut ! Ici c\'est la Plaine de la Clarte.',
      'Les 4 premiers batiments t\'aideront a sortir de ta tete.',
      'Prends le temps de faire chaque quete.',
    ]
  },
  {
    id: 'guide2', x: 37, y: 22, sprite: 'warrior', name: 'Marc',
    dialog: [
      'Tu es arrive a la Cite du Courage. Bien joue.',
      'Ici, tu vas parler a de vrais humains, proposer ton offre.',
      'C\'est la que la plupart abandonnent. Pas toi.',
    ]
  },
  {
    id: 'guide3', x: 15, y: 12, sprite: 'sage', name: 'Sophie',
    dialog: [
      'Bienvenue au Sommet de la Structure.',
      'Il reste a transformer tout ca en systeme repetable.',
      'Tu n\'es plus un reveur. Tu es un entrepreneur.',
    ]
  },
  {
    id: 'old1', x: 20, y: 36, sprite: 'old', name: 'Ancien',
    dialog: [
      'Beaucoup passent par ici... peu vont jusqu\'au bout.',
      'Le secret ? La constance bat le talent.',
    ]
  },
  {
    id: 'trader', x: 30, y: 24, sprite: 'trader', name: 'Vendeur',
    dialog: [
      'Tu veux un conseil gratuit ? Propose. Annonce ton prix.',
      'Le marche repond aux propositions, pas aux idees.',
    ]
  },
]

// Seeded random
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateMap() {
  const rng = seededRandom(42)
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS))

  // Region 3: darker grass
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < COLS; x++) {
      map[y][x] = rng() > 0.7 ? T.DARK_GRASS : T.GRASS
    }
  }

  // Flowers in region 1
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(rng() * COLS)
    const y = 26 + Math.floor(rng() * 14)
    if (y < ROWS && map[y][x] === T.GRASS) map[y][x] = T.FLOWER
  }

  // Tall grass patches
  for (const [cx, cy] of [[5, 30], [30, 28], [42, 18], [8, 16], [38, 8]]) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.3) {
          if (map[ny][nx] === T.GRASS || map[ny][nx] === T.DARK_GRASS) map[ny][nx] = T.TALL_GRASS
        }
      }
    }
  }

  // Water
  const lake = [[2, 30], [3, 30], [4, 30], [2, 31], [3, 31], [4, 31], [5, 31], [3, 32], [4, 32]]
  for (const [lx, ly] of lake) {
    if (ly < ROWS && lx < COLS) map[ly][lx] = T.WATER
  }
  for (let x = 0; x < 12; x++) {
    map[26][x] = T.WATER
    map[27][x] = T.WATER
  }
  map[26][12] = T.BRIDGE
  map[27][12] = T.BRIDGE
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      map[6 + dy][40 + dx] = T.WATER
    }
  }

  // Mountains
  for (const [mx, my, mw, mh] of [[0, 0, 6, 3], [44, 0, 6, 5], [0, 0, 3, 8], [47, 0, 3, 10], [35, 2, 4, 3]]) {
    for (let dy = 0; dy < mh; dy++) {
      for (let dx = 0; dx < mw; dx++) {
        const nx = mx + dx, ny = my + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) map[ny][nx] = T.MOUNTAIN
      }
    }
  }

  // Trees
  for (let x = 0; x < COLS; x++) {
    if (rng() > 0.2) map[ROWS - 1][x] = T.TREE
    if (rng() > 0.4 && map[0][x] !== T.MOUNTAIN) map[0][x] = T.TREE
  }
  for (let y = 0; y < ROWS; y++) {
    if (rng() > 0.2 && map[y][0] !== T.MOUNTAIN) map[y][0] = T.TREE
    if (rng() > 0.2 && map[y][COLS - 1] !== T.MOUNTAIN) map[y][COLS - 1] = T.TREE
  }
  for (const [fx, fy, r] of [[44, 30, 3], [1, 18, 3], [45, 15, 2], [38, 35, 3], [20, 28, 2]]) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = fx + dx, ny = fy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.25) {
          map[ny][nx] = T.TREE
        }
      }
    }
  }

  // Fences
  for (let x = 6; x <= 10; x++) { map[38][x] = T.FENCE }
  for (let y = 36; y <= 38; y++) { map[y][6] = T.FENCE; map[y][10] = T.FENCE }

  // Paths between zones
  const waypoints = [{ x: 8, y: 37 }, ...ZONES.map(z => ({ x: z.x, y: z.y }))]
  for (let i = 0; i < waypoints.length - 1; i++) {
    drawPath(map, waypoints[i], waypoints[i + 1], rng)
  }

  // Place zone buildings (3 wide x 3 tall with proper edges)
  for (const zone of ZONES) {
    // Clear area around building
    for (let dy = -2; dy <= 3; dy++) {
      for (let dx = -2; dx <= 4; dx++) {
        const nx = zone.x + dx, ny = zone.y + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) map[ny][nx] = T.PATH
      }
    }
    // Roof row (3 wide)
    map[zone.y - 1][zone.x - 1] = T.ROOF_L
    map[zone.y - 1][zone.x] = T.ROOF
    map[zone.y - 1][zone.x + 1] = T.ROOF
    map[zone.y - 1][zone.x + 2] = T.ROOF_R
    // Wall row (3 wide)
    map[zone.y][zone.x - 1] = T.WALL_L
    map[zone.y][zone.x] = T.WALL
    map[zone.y][zone.x + 1] = T.WALL
    map[zone.y][zone.x + 2] = T.WALL_R
    // Door row
    map[zone.y + 1][zone.x - 1] = T.WALL_L
    map[zone.y + 1][zone.x] = T.DOOR
    map[zone.y + 1][zone.x + 1] = T.WALL
    map[zone.y + 1][zone.x + 2] = T.WALL_R
    // Sign next to building
    if (zone.x + 3 < COLS) map[zone.y + 1][zone.x + 3] = T.SIGN
  }

  // Add sand shores around water
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      if (map[y][x] !== T.WATER) continue
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx, ny = y + dy
          if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
            const t = map[ny][nx]
            if (t === T.GRASS || t === T.DARK_GRASS || t === T.FLOWER || t === T.TALL_GRASS) {
              map[ny][nx] = T.SAND
            }
          }
        }
      }
    }
  }

  // Add extra flower clusters for beauty
  for (const [cx, cy, r] of [[12, 36], [22, 33], [40, 30], [18, 15], [28, 8], [36, 6]]) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = (cx || 0) + dx, ny = (cy || 0) + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.4) {
          if (map[ny][nx] === T.GRASS || map[ny][nx] === T.DARK_GRASS) map[ny][nx] = T.FLOWER
        }
      }
    }
  }

  for (const npc of NPCS) {
    if (map[npc.y][npc.x] !== T.PATH) map[npc.y][npc.x] = T.PATH
  }

  return map
}

function drawPath(map, from, to, rng) {
  let x = from.x, y = from.y
  while (x !== to.x || y !== to.y) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      const t = map[y][x]
      if (t !== T.ROOF && t !== T.WALL && t !== T.DOOR && t !== T.WATER && t !== T.BRIDGE) {
        map[y][x] = T.PATH
      }
    }
    if (rng() > 0.35) {
      if (x < to.x) x++; else if (x > to.x) x--
      else if (y < to.y) y++; else if (y > to.y) y--
    } else {
      if (y < to.y) y++; else if (y > to.y) y--
      else if (x < to.x) x++; else if (x > to.x) x--
    }
  }
}

// ============ ZONE LABELS ============

function drawZoneLabel(ctx, zone, px, py, unlocked, completed) {
  const bw = zone.name.length * 4.5 + 16
  const bx = px + TILE / 2 - bw / 2
  const by = py - 22

  ctx.fillStyle = completed ? 'rgba(199,183,119,0.92)' : unlocked ? 'rgba(12,12,25,0.88)' : 'rgba(10,10,15,0.65)'
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, 16, 4)
  ctx.fill()

  ctx.strokeStyle = completed ? '#e0d9a8' : unlocked ? '#c7b777' : '#444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, 16, 4)
  ctx.stroke()

  ctx.fillStyle = completed ? '#1a1a2a' : unlocked ? '#c7b777' : '#555'
  ctx.font = 'bold 7px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(zone.name, px + TILE / 2, by + 11)

  if (!unlocked) {
    ctx.fillStyle = '#666'
    ctx.font = '8px sans-serif'
    ctx.fillText('\u{1F512}', px + TILE / 2, by - 2)
  }
  if (completed) {
    ctx.fillStyle = '#2a6a1e'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('\u2713', px + TILE / 2, by - 1)
  }
}

// ============ NPC LABEL ============

function drawNPCLabel(ctx, npc, px, py, tick) {
  const bob = Math.sin(tick * 0.05) * 2

  // Exclamation mark
  ctx.fillStyle = '#c7b777'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('!', px + TILE / 2, py - TILE - 4 + bob)

  // Name tag
  const nameW = npc.name.length * 4.5 + 8
  const nameX = px + TILE / 2 - nameW / 2
  const nameY = py - TILE - 14 + bob

  ctx.fillStyle = 'rgba(5,5,15,0.75)'
  ctx.beginPath()
  ctx.roundRect(nameX, nameY, nameW, 10, 3)
  ctx.fill()

  ctx.fillStyle = '#c7b777'
  ctx.font = '6px monospace'
  ctx.fillText(npc.name, px + TILE / 2, nameY + 7)
}

// ============ DIALOG BOX ============

function drawDialogBox(ctx, viewW, viewH, speaker, text, charIndex) {
  const boxH = 100
  const boxY = viewH - boxH - 10
  const boxX = 10
  const boxW = viewW - 20

  const bgGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH)
  bgGrad.addColorStop(0, 'rgba(10,10,25,0.94)')
  bgGrad.addColorStop(1, 'rgba(5,5,15,0.96)')
  ctx.fillStyle = bgGrad
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 12)
  ctx.fill()

  ctx.strokeStyle = '#c7b777'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 12)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(199,183,119,0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10, 8)
  ctx.stroke()

  if (speaker) {
    const nameW = speaker.length * 8 + 16
    const nameGrad = ctx.createLinearGradient(boxX + 12, boxY - 14, boxX + 12, boxY + 8)
    nameGrad.addColorStop(0, '#d4c888')
    nameGrad.addColorStop(1, '#c7b777')
    ctx.fillStyle = nameGrad
    ctx.beginPath()
    ctx.roundRect(boxX + 12, boxY - 14, nameW, 22, 6)
    ctx.fill()

    ctx.fillStyle = '#0a0a0f'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(speaker, boxX + 20, boxY + 2)
  }

  const visibleText = text.substring(0, charIndex)
  ctx.fillStyle = '#f0f0f0'
  ctx.font = '13px monospace'
  ctx.textAlign = 'left'

  const maxW = boxW - 40
  const words = visibleText.split(' ')
  let line = ''
  let lineY = boxY + 28
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word
    if (ctx.measureText(testLine).width > maxW && line) {
      ctx.fillText(line, boxX + 20, lineY)
      line = word
      lineY += 20
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, boxX + 20, lineY)

  if (charIndex >= text.length) {
    const blink = Math.sin(Date.now() * 0.008) > 0
    if (blink) {
      ctx.fillStyle = '#c7b777'
      ctx.beginPath()
      ctx.moveTo(boxX + boxW - 28, boxY + boxH - 20)
      ctx.lineTo(boxX + boxW - 22, boxY + boxH - 14)
      ctx.lineTo(boxX + boxW - 16, boxY + boxH - 20)
      ctx.fill()
    }
  }
}

// ============ CAMERA & COLLISION ============

function getCamera(charX, charY, viewW, viewH) {
  const mapW = COLS * TILE
  const mapH = ROWS * TILE
  let cx = charX - viewW / 2
  let cy = charY - viewH / 2
  cx = Math.max(0, Math.min(cx, mapW - viewW))
  cy = Math.max(0, Math.min(cy, mapH - viewH))
  return { x: cx, y: cy }
}

function getAdjacentZone(tileX, tileY) {
  for (const zone of ZONES) {
    const dx = Math.abs(tileX - zone.x)
    const dy = Math.abs(tileY - (zone.y + 1))
    if (dx <= 1 && dy <= 1) return zone
  }
  return null
}

function getAdjacentNPC(tileX, tileY) {
  for (const npc of NPCS) {
    const dx = Math.abs(tileX - npc.x)
    const dy = Math.abs(tileY - npc.y)
    if (dx <= 1 && dy <= 1) return npc
  }
  return null
}

function canMove(map, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false
  const tile = map[y][x]
  if (SOLID.has(tile)) return false
  for (const npc of NPCS) {
    if (npc.x === x && npc.y === y) return false
  }
  return true
}

export {
  TILE, COLS, ROWS, T, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel, drawDialogBox,
  getCamera, getAdjacentZone, getAdjacentNPC, canMove,
}
