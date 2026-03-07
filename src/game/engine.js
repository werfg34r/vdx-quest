// VDX Quest RPG Engine - Modern pixel art style

const TILE = 16
const COLS = 60
const ROWS = 50

// Tile types
const T = {
  GRASS: 0, PATH: 1, WATER: 2, TREE: 3, ZONE: 4, MOUNTAIN: 5,
  FLOWER: 6, BRIDGE: 7, FENCE: 8, DARK_GRASS: 9, SAND: 10,
  ROOF: 11, WALL: 12, DOOR: 13, SIGN: 14, CHEST: 15,
  STONE_PATH: 16, TALL_GRASS: 17, WATER_EDGE: 18, HOUSE_WALL: 19,
}

const SOLID = new Set([T.WATER, T.TREE, T.MOUNTAIN, T.FENCE, T.WALL, T.ROOF, T.HOUSE_WALL, T.WATER_EDGE])

// Color palette - warm, rich, Stardew Valley inspired
const PAL = {
  grass1: '#5da13a', grass2: '#4e9030', grass3: '#6db848', grassDark1: '#3d7a28', grassDark2: '#4a8832',
  path1: '#d4b87a', path2: '#c4a868', path3: '#bfa060', pathEdge: '#b09050',
  water1: '#3988c9', water2: '#4a9ae0', water3: '#5aacf0', waterDeep: '#2870a8',
  tree1: '#2d7a22', tree2: '#38902a', tree3: '#45a535', trunk: '#7a5230', trunkDark: '#5a3a1e',
  mtn1: '#7a7a8e', mtn2: '#9090a2', mtn3: '#a8a8b8', mtnSnow: '#e8eef8',
  wall1: '#f0e8d0', wall2: '#e0d4b8', wallShade: '#c8bca0',
  roof1: '#c04828', roof2: '#d85838', roof3: '#a83820',
  door: '#6a4422', doorLight: '#8a5a30',
  skin: '#f8d8a0', skinShade: '#e0c088',
  gold: '#c7b777', goldLight: '#e0d9a8', goldDark: '#a89858',
}

// Zone definitions (12 weeks)
const ZONES = [
  { id: 1, x: 10, y: 42, label: 'S1', name: 'Cabane de la Verite', region: 1 },
  { id: 2, x: 20, y: 40, label: 'S2', name: 'Tour du Choix', region: 1 },
  { id: 3, x: 30, y: 42, label: 'S3', name: 'Forge de l\'Offre', region: 1 },
  { id: 4, x: 42, y: 38, label: 'S4', name: 'Place Publique', region: 1 },
  { id: 5, x: 48, y: 30, label: 'S5', name: 'Arene des Voix', region: 2 },
  { id: 6, x: 40, y: 24, label: 'S6', name: 'Guilde du Courage', region: 2 },
  { id: 7, x: 28, y: 26, label: 'S7', name: 'Epreuve du Reel', region: 2 },
  { id: 8, x: 16, y: 24, label: 'S8', name: 'Bibliotheque Vivante', region: 2 },
  { id: 9, x: 12, y: 16, label: 'S9', name: 'Atelier de la Boucle', region: 3 },
  { id: 10, x: 24, y: 13, label: 'S10', name: 'Temple de la Constance', region: 3 },
  { id: 11, x: 38, y: 15, label: 'S11', name: 'Phare de la Posture', region: 3 },
  { id: 12, x: 30, y: 5, label: 'S12', name: 'Sommet VDX', region: 3 },
]

// NPCs
const NPCS = [
  {
    id: 'mentor', x: 10, y: 44, sprite: 'mentor', name: 'Laurent',
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
    id: 'guide1', x: 15, y: 41, sprite: 'villager', name: 'Elise',
    dialog: [
      'Salut ! Ici c\'est la Plaine de la Clarte.',
      'Les 4 premiers batiments t\'aideront a sortir de ta tete.',
      'Prends le temps de faire chaque quete.',
    ]
  },
  {
    id: 'guide2', x: 44, y: 27, sprite: 'warrior', name: 'Marc',
    dialog: [
      'Tu es arrive a la Cite du Courage. Bien joue.',
      'Ici, tu vas parler a de vrais humains, proposer ton offre.',
      'C\'est la que la plupart abandonnent. Pas toi.',
    ]
  },
  {
    id: 'guide3', x: 18, y: 15, sprite: 'sage', name: 'Sophie',
    dialog: [
      'Bienvenue au Sommet de la Structure.',
      'Il reste a transformer tout ca en systeme repetable.',
      'Tu n\'es plus un reveur. Tu es un entrepreneur.',
    ]
  },
  {
    id: 'old1', x: 25, y: 43, sprite: 'old', name: 'Ancien',
    dialog: [
      'Beaucoup passent par ici... peu vont jusqu\'au bout.',
      'Le secret ? La constance bat le talent.',
    ]
  },
  {
    id: 'trader', x: 35, y: 28, sprite: 'trader', name: 'Vendeur',
    dialog: [
      'Tu veux un conseil gratuit ? Propose. Annonce ton prix.',
      'Le marche repond aux propositions, pas aux idees.',
    ]
  },
]

// Seeded random for consistent map
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Generate the map
function generateMap() {
  const rng = seededRandom(42)
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS))

  // Region 3 (top, y 0-18): darker grass
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < COLS; x++) {
      map[y][x] = rng() > 0.6 ? T.DARK_GRASS : T.GRASS
    }
  }

  // Scatter flowers in region 1
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(rng() * COLS)
    const y = 30 + Math.floor(rng() * 18)
    if (y < ROWS && map[y][x] === T.GRASS) map[y][x] = T.FLOWER
  }

  // Tall grass patches
  const tallGrassAreas = [[6, 36], [35, 34], [50, 22], [10, 20], [45, 10], [8, 8], [52, 36]]
  for (const [cx, cy] of tallGrassAreas) {
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && rng() > 0.25) {
          if (map[ny][nx] === T.GRASS || map[ny][nx] === T.DARK_GRASS) map[ny][nx] = T.TALL_GRASS
        }
      }
    }
  }

  // Water - river winding through the map
  // Main river separating region 1 and 2
  for (let x = 0; x < COLS; x++) {
    const ry = 28 + Math.floor(Math.sin(x * 0.15) * 2)
    for (let dy = 0; dy < 3; dy++) {
      if (ry + dy >= 0 && ry + dy < ROWS) map[ry + dy][x] = T.WATER
    }
  }
  // Bridge crossings
  for (let dy = 0; dy < 3; dy++) {
    map[28 + dy][14] = T.BRIDGE; map[28 + dy][15] = T.BRIDGE
    map[28 + dy][34] = T.BRIDGE; map[28 + dy][35] = T.BRIDGE
    map[29 + dy][48] = T.BRIDGE; map[29 + dy][49] = T.BRIDGE
  }

  // Small lake in region 1
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy * 1.5)
      if (dist < 3) {
        const nx = 4 + dx, ny = 38 + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) map[ny][nx] = T.WATER
      }
    }
  }

  // Pond in region 3
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy * 2)
      if (dist < 2.2) {
        const nx = 48 + dx, ny = 8 + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) map[ny][nx] = T.WATER
      }
    }
  }

  // Mountains - region 3 top borders
  const mtns = [[0, 0, 8, 4], [52, 0, 8, 6], [0, 0, 3, 10], [57, 0, 3, 12], [42, 2, 5, 4]]
  for (const [mx, my, mw, mh] of mtns) {
    for (let dy = 0; dy < mh; dy++) {
      for (let dx = 0; dx < mw; dx++) {
        const nx = mx + dx, ny = my + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) map[ny][nx] = T.MOUNTAIN
      }
    }
  }

  // Trees - borders
  for (let x = 0; x < COLS; x++) {
    if (rng() > 0.15) map[ROWS - 1][x] = T.TREE
    if (rng() > 0.15) map[ROWS - 2][x] = T.TREE
    if (rng() > 0.4 && map[0][x] !== T.MOUNTAIN) map[0][x] = T.TREE
  }
  for (let y = 0; y < ROWS; y++) {
    if (rng() > 0.15 && map[y][0] !== T.MOUNTAIN) map[y][0] = T.TREE
    if (rng() > 0.3 && map[y][1] !== T.MOUNTAIN) map[y][1] = T.TREE
    if (rng() > 0.15 && map[y][COLS - 1] !== T.MOUNTAIN) map[y][COLS - 1] = T.TREE
    if (rng() > 0.3 && map[y][COLS - 2] !== T.MOUNTAIN) map[y][COLS - 2] = T.TREE
  }

  // Forest clusters
  const forests = [[54, 36, 4], [2, 22, 3], [54, 18, 3], [46, 42, 4], [25, 34, 3], [56, 8, 3], [3, 12, 3]]
  for (const [fx, fy, r] of forests) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy)
        const nx = fx + dx, ny = fy + dy
        if (nx > 1 && ny > 1 && nx < COLS - 2 && ny < ROWS - 2 && dist < r + 0.5 && rng() > 0.2) {
          map[ny][nx] = T.TREE
        }
      }
    }
  }

  // Fences
  for (let x = 8; x <= 13; x++) { map[46][x] = T.FENCE }
  for (let y = 44; y <= 46; y++) { map[y][8] = T.FENCE; map[y][13] = T.FENCE }

  // Draw paths between zones
  const waypoints = [
    { x: 10, y: 44 },
    ...ZONES.map(z => ({ x: z.x, y: z.y + 2 })),
  ]
  for (let i = 0; i < waypoints.length - 1; i++) {
    drawPath(map, waypoints[i], waypoints[i + 1], rng)
  }
  // Extra paths for connectivity
  drawPath(map, { x: 10, y: 44 }, { x: 10, y: 42 }, rng)
  drawPath(map, { x: 42, y: 40 }, { x: 48, y: 32 }, rng)
  drawPath(map, { x: 16, y: 26 }, { x: 12, y: 18 }, rng)

  // Place zone buildings (3 wide, 3 tall)
  for (const zone of ZONES) {
    // Clear 5x5 area
    for (let dy = -2; dy <= 3; dy++) {
      for (let dx = -1; dx <= 3; dx++) {
        const nx = zone.x + dx, ny = zone.y + dy
        if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
          map[ny][nx] = T.PATH
        }
      }
    }
    // Building: 3 wide
    map[zone.y - 1][zone.x] = T.ROOF
    map[zone.y - 1][zone.x + 1] = T.ROOF
    map[zone.y - 1][zone.x + 2] = T.ROOF
    map[zone.y][zone.x] = T.WALL
    map[zone.y][zone.x + 1] = T.WALL
    map[zone.y][zone.x + 2] = T.WALL
    map[zone.y + 1][zone.x] = T.WALL
    map[zone.y + 1][zone.x + 1] = T.DOOR
    map[zone.y + 1][zone.x + 2] = T.WALL
    // Sign
    if (zone.x + 3 < COLS) map[zone.y + 1][zone.x + 3] = T.SIGN
  }

  // Clear NPC positions
  for (const npc of NPCS) {
    if (map[npc.y] && map[npc.y][npc.x] && map[npc.y][npc.x] !== T.PATH) {
      map[npc.y][npc.x] = T.PATH
    }
  }

  return map
}

function drawPath(map, from, to, rng) {
  let x = from.x, y = from.y
  const maxSteps = 300
  let steps = 0
  while ((x !== to.x || y !== to.y) && steps++ < maxSteps) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      const t = map[y][x]
      if (t !== T.ROOF && t !== T.WALL && t !== T.DOOR && t !== T.WATER && t !== T.BRIDGE) {
        map[y][x] = T.PATH
        // Wider path
        if (y + 1 < ROWS && map[y + 1][x] !== T.WATER && map[y + 1][x] !== T.BRIDGE && map[y + 1][x] !== T.WALL && map[y + 1][x] !== T.ROOF && map[y + 1][x] !== T.DOOR) {
          map[y + 1][x] = T.PATH
        }
      }
    }
    if (rng() > 0.4) {
      if (x < to.x) x++; else if (x > to.x) x--
      else if (y < to.y) y++; else if (y > to.y) y--
    } else {
      if (y < to.y) y++; else if (y > to.y) y--
      else if (x < to.x) x++; else if (x > to.x) x--
    }
  }
}

// ============ RENDERING ============

// Noise function for grass variation
function tileNoise(px, py, seed) {
  return ((px * 374761 + py * 668265 + seed) % 1000) / 1000
}

function drawTile(ctx, type, px, py, tick) {
  const s = TILE
  const n = tileNoise(px, py, 0)
  const n2 = tileNoise(px, py, 99)

  switch (type) {
    case T.GRASS: {
      ctx.fillStyle = n > 0.5 ? PAL.grass1 : PAL.grass2
      ctx.fillRect(px, py, s, s)
      // Grass blades
      ctx.fillStyle = PAL.grass3
      if (n > 0.3) { ctx.fillRect(px + 3, py + 5, 1, 3) }
      if (n2 > 0.4) { ctx.fillRect(px + 10, py + 2, 1, 2) }
      if (n > 0.6) { ctx.fillRect(px + 7, py + 10, 1, 2) }
      break
    }
    case T.DARK_GRASS: {
      ctx.fillStyle = n > 0.5 ? PAL.grassDark1 : PAL.grassDark2
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = PAL.grassDark2
      if (n > 0.4) ctx.fillRect(px + 5, py + 4, 1, 3)
      if (n2 > 0.5) ctx.fillRect(px + 12, py + 9, 1, 2)
      break
    }
    case T.TALL_GRASS: {
      ctx.fillStyle = PAL.grass1
      ctx.fillRect(px, py, s, s)
      // Animated tall grass blades
      ctx.fillStyle = '#3a7825'
      for (let i = 0; i < 4; i++) {
        const gx = px + 1 + i * 4
        const sway = Math.sin(tick * 0.04 + i * 1.5 + px * 0.2) * 1.5
        ctx.fillRect(gx + sway, py, 2, s - 2)
      }
      ctx.fillStyle = PAL.grass3
      for (let i = 0; i < 3; i++) {
        const gx = px + 2 + i * 5
        const sway = Math.sin(tick * 0.04 + i * 2 + px * 0.2) * 1.5
        ctx.fillRect(gx + sway, py + 1, 1, s - 4)
      }
      break
    }
    case T.PATH: {
      ctx.fillStyle = PAL.path1
      ctx.fillRect(px, py, s, s)
      // Texture dots
      ctx.fillStyle = PAL.path2
      if (n > 0.3) ctx.fillRect(px + 2, py + 2, 2, 2)
      if (n2 > 0.5) ctx.fillRect(px + 9, py + 10, 3, 2)
      ctx.fillStyle = PAL.path3
      if (n > 0.7) ctx.fillRect(px + 6, py + 6, 2, 2)
      break
    }
    case T.WATER: {
      ctx.fillStyle = PAL.water1
      ctx.fillRect(px, py, s, s)
      // Animated waves
      const wo = Math.sin(tick * 0.05 + px * 0.3) * 2
      const wo2 = Math.sin(tick * 0.05 + px * 0.3 + 2) * 2
      ctx.fillStyle = PAL.water2
      ctx.fillRect(px + 1 + wo, py + 4, 6, 1)
      ctx.fillRect(px + 8 + wo2, py + 10, 5, 1)
      ctx.fillStyle = PAL.water3
      ctx.fillRect(px + 4 + wo, py + 2, 3, 1)
      ctx.fillRect(px + 10 + wo2, py + 8, 4, 1)
      // Sparkle
      if (Math.sin(tick * 0.08 + px * 0.5 + py * 0.5) > 0.8) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(px + 6, py + 6, 1, 1)
      }
      break
    }
    case T.TREE: {
      // Ground under tree
      ctx.fillStyle = PAL.grass1
      ctx.fillRect(px, py, s, s)
      // Shadow on ground
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.beginPath()
      ctx.ellipse(px + s / 2, py + s - 2, 6, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      // Trunk
      ctx.fillStyle = PAL.trunk
      ctx.fillRect(px + 6, py + 8, 4, 8)
      ctx.fillStyle = PAL.trunkDark
      ctx.fillRect(px + 6, py + 8, 1, 8)
      // Canopy layers
      ctx.fillStyle = PAL.tree1
      ctx.beginPath()
      ctx.arc(px + s / 2, py + 6, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = PAL.tree2
      ctx.beginPath()
      ctx.arc(px + s / 2 - 1, py + 4, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = PAL.tree3
      ctx.beginPath()
      ctx.arc(px + s / 2 + 1, py + 3, 3, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case T.MOUNTAIN: {
      ctx.fillStyle = PAL.grassDark1
      ctx.fillRect(px, py, s, s)
      // Mountain shape
      ctx.fillStyle = PAL.mtn1
      ctx.beginPath()
      ctx.moveTo(px - 1, py + s)
      ctx.lineTo(px + s / 2, py - 2)
      ctx.lineTo(px + s + 1, py + s)
      ctx.fill()
      ctx.fillStyle = PAL.mtn2
      ctx.beginPath()
      ctx.moveTo(px + 3, py + s)
      ctx.lineTo(px + s / 2, py + 2)
      ctx.lineTo(px + s - 2, py + s)
      ctx.fill()
      // Snow
      ctx.fillStyle = PAL.mtnSnow
      ctx.beginPath()
      ctx.moveTo(px + s / 2 - 3, py + 5)
      ctx.lineTo(px + s / 2, py - 2)
      ctx.lineTo(px + s / 2 + 3, py + 5)
      ctx.fill()
      break
    }
    case T.FLOWER: {
      ctx.fillStyle = PAL.grass1
      ctx.fillRect(px, py, s, s)
      // Stems
      ctx.fillStyle = '#4a9030'
      ctx.fillRect(px + 4, py + 7, 1, 5)
      ctx.fillRect(px + 11, py + 9, 1, 4)
      // Flowers with variety
      const colors = ['#f06070', '#f0d040', '#f090c0', '#60b0f0', '#f09040', '#d070e0']
      ctx.fillStyle = colors[Math.floor(n * colors.length)]
      ctx.fillRect(px + 3, py + 5, 3, 3)
      ctx.fillStyle = colors[Math.floor(n2 * colors.length)]
      ctx.fillRect(px + 10, py + 7, 3, 3)
      // Centers
      ctx.fillStyle = '#ffe060'
      ctx.fillRect(px + 4, py + 6, 1, 1)
      ctx.fillRect(px + 11, py + 8, 1, 1)
      break
    }
    case T.BRIDGE: {
      ctx.fillStyle = PAL.water1
      ctx.fillRect(px, py, s, s)
      // Planks
      ctx.fillStyle = '#a07838'
      ctx.fillRect(px, py + 1, s, s - 2)
      ctx.fillStyle = '#b88840'
      ctx.fillRect(px + 1, py + 2, s - 2, 2)
      ctx.fillRect(px + 1, py + 6, s - 2, 2)
      ctx.fillRect(px + 1, py + 10, s - 2, 2)
      // Rails
      ctx.fillStyle = '#705020'
      ctx.fillRect(px, py + 1, 2, s - 2)
      ctx.fillRect(px + s - 2, py + 1, 2, s - 2)
      break
    }
    case T.FENCE: {
      ctx.fillStyle = PAL.grass1
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#b08848'
      ctx.fillRect(px, py + 5, s, 2)
      ctx.fillRect(px, py + 11, s, 2)
      ctx.fillStyle = '#906830'
      ctx.fillRect(px + 2, py + 3, 2, 12)
      ctx.fillRect(px + 12, py + 3, 2, 12)
      break
    }
    case T.ROOF: {
      ctx.fillStyle = PAL.grass1
      ctx.fillRect(px, py, s, s)
      // Roof triangle
      ctx.fillStyle = PAL.roof3
      ctx.beginPath()
      ctx.moveTo(px - 2, py + s)
      ctx.lineTo(px + s / 2, py + 1)
      ctx.lineTo(px + s + 2, py + s)
      ctx.fill()
      ctx.fillStyle = PAL.roof1
      ctx.beginPath()
      ctx.moveTo(px, py + s)
      ctx.lineTo(px + s / 2, py + 3)
      ctx.lineTo(px + s, py + s)
      ctx.fill()
      // Highlight
      ctx.fillStyle = PAL.roof2
      ctx.beginPath()
      ctx.moveTo(px + s / 2, py + 3)
      ctx.lineTo(px + s - 1, py + s)
      ctx.lineTo(px + s / 2 + 1, py + s)
      ctx.fill()
      break
    }
    case T.WALL: {
      ctx.fillStyle = PAL.wall1
      ctx.fillRect(px, py, s, s)
      // Brick pattern
      ctx.fillStyle = PAL.wall2
      ctx.fillRect(px, py + 4, s, 1)
      ctx.fillRect(px, py + 10, s, 1)
      ctx.fillRect(px + 8, py, 1, 4)
      ctx.fillRect(px + 4, py + 5, 1, 5)
      ctx.fillRect(px + 12, py + 5, 1, 5)
      ctx.fillRect(px + 8, py + 11, 1, 5)
      // Window
      ctx.fillStyle = '#88c8f0'
      ctx.fillRect(px + 5, py + 2, 6, 4)
      ctx.fillStyle = '#a0d8ff'
      ctx.fillRect(px + 6, py + 2, 2, 4)
      ctx.fillStyle = PAL.wallShade
      ctx.fillRect(px + 5, py + 2, 6, 1)
      break
    }
    case T.DOOR: {
      ctx.fillStyle = PAL.wall1
      ctx.fillRect(px, py, s, s)
      // Door
      ctx.fillStyle = PAL.door
      ctx.fillRect(px + 4, py + 2, 8, s - 2)
      ctx.fillStyle = PAL.doorLight
      ctx.fillRect(px + 5, py + 3, 6, s - 4)
      // Knob
      ctx.fillStyle = PAL.gold
      ctx.fillRect(px + 10, py + 9, 1, 1)
      // Step
      ctx.fillStyle = PAL.wallShade
      ctx.fillRect(px + 2, py + s - 2, 12, 2)
      break
    }
    case T.SIGN: {
      ctx.fillStyle = PAL.path1
      ctx.fillRect(px, py, s, s)
      // Post
      ctx.fillStyle = '#6a4a2a'
      ctx.fillRect(px + 7, py + 8, 2, 8)
      // Board
      ctx.fillStyle = '#c4a45a'
      ctx.fillRect(px + 3, py + 3, 10, 7)
      ctx.fillStyle = '#a08838'
      ctx.fillRect(px + 3, py + 3, 10, 1)
      ctx.fillRect(px + 3, py + 9, 10, 1)
      ctx.fillRect(px + 3, py + 3, 1, 7)
      ctx.fillRect(px + 12, py + 3, 1, 7)
      // Exclamation
      ctx.fillStyle = '#4a3a1a'
      ctx.fillRect(px + 8, py + 5, 1, 3)
      ctx.fillRect(px + 8, py + 9, 1, 1)
      break
    }
    case T.SAND: {
      ctx.fillStyle = '#e8d8a0'
      ctx.fillRect(px, py, s, s)
      ctx.fillStyle = '#d8c890'
      if (n > 0.3) ctx.fillRect(px + 3, py + 3, 2, 1)
      if (n2 > 0.5) ctx.fillRect(px + 10, py + 11, 3, 1)
      break
    }
    default:
      ctx.fillStyle = PAL.grass1
      ctx.fillRect(px, py, s, s)
  }
}

// ============ CHARACTER SPRITES ============

function drawCharBody(ctx, px, py, dir, frame, colors) {
  const { skin, shirt, pants, hair, shirtLight } = colors
  const s = TILE

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath()
  ctx.ellipse(px + s / 2, py + s - 1, 5, 2, 0, 0, Math.PI * 2)
  ctx.fill()

  const legOff = frame === 1 ? 1 : frame === 2 ? -1 : 0

  // Legs
  ctx.fillStyle = pants
  ctx.fillRect(px + 5, py + 11, 2, 3 + legOff)
  ctx.fillRect(px + 9, py + 11, 2, 3 - legOff)
  // Shoes
  ctx.fillStyle = '#5a3a1a'
  ctx.fillRect(px + 4, py + 13 + legOff, 3, 2)
  ctx.fillRect(px + 9, py + 13 - legOff, 3, 2)

  // Body/shirt
  ctx.fillStyle = shirt
  ctx.fillRect(px + 4, py + 6, 8, 6)
  ctx.fillStyle = shirtLight || shirt
  ctx.fillRect(px + 5, py + 6, 6, 1)

  // Arms
  ctx.fillStyle = shirt
  const armY = frame === 1 ? 1 : frame === 2 ? -1 : 0
  if (dir === 'left') {
    ctx.fillRect(px + 2, py + 7 + armY, 2, 4)
    ctx.fillStyle = skin
    ctx.fillRect(px + 2, py + 10 + armY, 2, 1)
  } else if (dir === 'right') {
    ctx.fillRect(px + 12, py + 7 + armY, 2, 4)
    ctx.fillStyle = skin
    ctx.fillRect(px + 12, py + 10 + armY, 2, 1)
  } else {
    ctx.fillRect(px + 2, py + 7 - armY, 2, 4)
    ctx.fillRect(px + 12, py + 7 + armY, 2, 4)
    ctx.fillStyle = skin
    ctx.fillRect(px + 2, py + 10 - armY, 2, 1)
    ctx.fillRect(px + 12, py + 10 + armY, 2, 1)
  }

  // Head
  ctx.fillStyle = skin
  ctx.fillRect(px + 5, py + 1, 6, 6)

  // Hair
  ctx.fillStyle = hair
  if (dir === 'up') {
    ctx.fillRect(px + 4, py, 8, 5)
  } else {
    ctx.fillRect(px + 4, py, 8, 3)
    ctx.fillRect(px + 4, py + 3, 1, 2)
    ctx.fillRect(px + 11, py + 3, 1, 2)
  }

  // Face
  if (dir !== 'up') {
    ctx.fillStyle = '#1a1a2a'
    if (dir === 'down') {
      ctx.fillRect(px + 6, py + 3, 1, 1)
      ctx.fillRect(px + 9, py + 3, 1, 1)
      ctx.fillRect(px + 7, py + 5, 2, 1)
    } else if (dir === 'left') {
      ctx.fillRect(px + 5, py + 3, 1, 1)
      ctx.fillRect(px + 5, py + 5, 2, 1)
    } else {
      ctx.fillRect(px + 10, py + 3, 1, 1)
      ctx.fillRect(px + 9, py + 5, 2, 1)
    }
  }
}

const playerColors = {
  skin: PAL.skin, shirt: PAL.gold, shirtLight: PAL.goldLight,
  pants: '#2a2a4a', hair: '#3a2818',
}

const CHAR_FRAMES = {
  down: [
    (ctx, px, py) => drawCharBody(ctx, px, py, 'down', 0, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'down', 1, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'down', 2, playerColors),
  ],
  up: [
    (ctx, px, py) => drawCharBody(ctx, px, py, 'up', 0, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'up', 1, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'up', 2, playerColors),
  ],
  left: [
    (ctx, px, py) => drawCharBody(ctx, px, py, 'left', 0, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'left', 1, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'left', 2, playerColors),
  ],
  right: [
    (ctx, px, py) => drawCharBody(ctx, px, py, 'right', 0, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'right', 1, playerColors),
    (ctx, px, py) => drawCharBody(ctx, px, py, 'right', 2, playerColors),
  ],
}

const npcColors = {
  mentor: { skin: '#d4a060', shirt: '#c7b777', shirtLight: '#e0d9a8', pants: '#2a2a5a', hair: '#888' },
  villager: { skin: '#f0c880', shirt: '#55aa55', shirtLight: '#68c068', pants: '#5555aa', hair: '#8a4a2a' },
  warrior: { skin: '#c8a060', shirt: '#aa3333', shirtLight: '#cc4444', pants: '#3a3a3a', hair: '#1a1a1a' },
  sage: { skin: '#f0d0a0', shirt: '#6644aa', shirtLight: '#7755cc', pants: '#4a4a4a', hair: '#eee' },
  old: { skin: '#d8b888', shirt: '#7a7a6a', shirtLight: '#8a8a7a', pants: '#4a4a3a', hair: '#ccc' },
  trader: { skin: '#e0b878', shirt: '#cc8833', shirtLight: '#e0a040', pants: '#5a3a2a', hair: '#4a3a1a' },
}

function drawNPC(ctx, npc, px, py, tick) {
  const c = npcColors[npc.sprite] || npcColors.villager
  drawCharBody(ctx, px, py, 'down', 0, c)

  // Floating indicator
  const bob = Math.sin(tick * 0.06) * 2
  ctx.fillStyle = PAL.gold
  ctx.fillRect(px + 7, py - 5 + bob, 2, 3)
  ctx.fillRect(px + 7, py - 1 + bob, 2, 1)

  // Name tag
  ctx.fillStyle = 'rgba(5,5,15,0.7)'
  const nameW = npc.name.length * 4 + 6
  ctx.fillRect(px + TILE / 2 - nameW / 2, py - 10 + bob, nameW, 7)
  ctx.fillStyle = PAL.gold
  ctx.font = '5px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(npc.name, px + TILE / 2, py - 5 + bob)
}

// ============ ZONE LABELS ============

function drawZoneLabel(ctx, zone, px, py, unlocked, completed) {
  const nameW = zone.name.length * 3.5 + 12
  const bx = px + TILE / 2 - nameW / 2
  const by = py - 16

  ctx.fillStyle = completed ? 'rgba(199,183,119,0.9)' : unlocked ? 'rgba(20,20,30,0.85)' : 'rgba(10,10,15,0.6)'
  ctx.strokeStyle = completed ? PAL.goldLight : unlocked ? PAL.gold : '#444'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(bx, by, nameW, 12, 3)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = completed ? '#1a1a2a' : unlocked ? PAL.gold : '#555'
  ctx.font = 'bold 5px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(zone.name, px + TILE / 2, by + 8)

  if (!unlocked) {
    ctx.fillStyle = '#666'
    ctx.font = '6px sans-serif'
    ctx.fillText('\u{1F512}', px + TILE / 2, by - 2)
  }
  if (completed) {
    ctx.fillStyle = '#2a6a1e'
    ctx.font = 'bold 7px sans-serif'
    ctx.fillText('\u2713', px + TILE / 2, by - 1)
  }
}

// ============ DIALOG BOX ============

function drawDialogBox(ctx, viewW, viewH, speaker, text, charIndex) {
  const boxH = 100
  const boxY = viewH - boxH - 10
  const boxX = 10
  const boxW = viewW - 20

  // Box background with gradient feel
  ctx.fillStyle = 'rgba(8,8,20,0.94)'
  ctx.strokeStyle = PAL.gold
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 12)
  ctx.fill()
  ctx.stroke()

  // Inner border
  ctx.strokeStyle = 'rgba(199,183,119,0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10, 8)
  ctx.stroke()

  // Corner decorations
  const cd = 6
  ctx.fillStyle = PAL.gold
  ctx.fillRect(boxX + 8, boxY + 8, cd, 2)
  ctx.fillRect(boxX + 8, boxY + 8, 2, cd)
  ctx.fillRect(boxX + boxW - 8 - cd, boxY + 8, cd, 2)
  ctx.fillRect(boxX + boxW - 10, boxY + 8, 2, cd)
  ctx.fillRect(boxX + 8, boxY + boxH - 10, cd, 2)
  ctx.fillRect(boxX + 8, boxY + boxH - 10 - cd + 2, 2, cd)
  ctx.fillRect(boxX + boxW - 8 - cd, boxY + boxH - 10, cd, 2)
  ctx.fillRect(boxX + boxW - 10, boxY + boxH - 10 - cd + 2, 2, cd)

  // Speaker name plate
  if (speaker) {
    const nameW = speaker.length * 8 + 20
    ctx.fillStyle = PAL.gold
    ctx.beginPath()
    ctx.roundRect(boxX + 14, boxY - 14, nameW, 22, 6)
    ctx.fill()
    ctx.fillStyle = '#0a0a0f'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(speaker, boxX + 24, boxY + 2)
  }

  // Text with typewriter
  const visibleText = text.substring(0, charIndex)
  ctx.fillStyle = '#f0f0f0'
  ctx.font = '13px monospace'
  ctx.textAlign = 'left'

  const maxW = boxW - 40
  const words = visibleText.split(' ')
  let line = ''
  let lineY = boxY + 30
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

  // Blinking cursor at end of text
  if (charIndex < text.length) {
    const cursorX = boxX + 20 + ctx.measureText(line).width + 2
    if (Math.sin(Date.now() * 0.01) > 0) {
      ctx.fillStyle = PAL.gold
      ctx.fillRect(cursorX, lineY - 10, 7, 12)
    }
  }

  // Continue arrow
  if (charIndex >= text.length) {
    const blink = Math.sin(Date.now() * 0.008) > 0
    if (blink) {
      ctx.fillStyle = PAL.gold
      ctx.beginPath()
      ctx.moveTo(boxX + boxW - 28, boxY + boxH - 22)
      ctx.lineTo(boxX + boxW - 22, boxY + boxH - 14)
      ctx.lineTo(boxX + boxW - 16, boxY + boxH - 22)
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
    const dx = Math.abs(tileX - (zone.x + 1))
    const dy = Math.abs(tileY - (zone.y + 2))
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
  generateMap, drawTile, drawZoneLabel, drawNPC, drawDialogBox,
  CHAR_FRAMES, getCamera, getAdjacentZone, getAdjacentNPC, canMove,
}
