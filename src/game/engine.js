// ============================================================
// VDX Quest — Game Engine (Written from scratch)
// ============================================================
// Map generation, collision, zones, NPCs, wandering AI

const TILE = 16
const COLS = 40
const ROWS = 32

// ============================================================
// TILE TYPES
// ============================================================
const T = {
  GRASS: 0, PATH: 1, WATER: 2, TREE: 3,
  FLOWER: 4, FENCE: 5, BRIDGE: 6, SAND: 7,
  DARK_GRASS: 8, BUSH: 9, MOUNTAIN: 10,
  TALL_GRASS: 11, SIGN: 14,
  // House footprint (3 wide × 4 tall)
  H_TL: 20, H_TC: 21, H_TR: 22,
  H_ML: 23, H_MC: 24, H_MR: 25,
  H_BL: 26, H_WIN: 27, H_BR: 28,
  H_DL: 29, H_DOOR: 30, H_DR: 31,
}

const SOLID = new Set([
  T.WATER, T.TREE, T.MOUNTAIN, T.FENCE, T.BUSH,
  T.H_TL, T.H_TC, T.H_TR, T.H_ML, T.H_MC, T.H_MR,
  T.H_BL, T.H_WIN, T.H_BR, T.H_DL, T.H_DR,
])

// ============================================================
// ZONES — 3 houses, each is a quest
// ============================================================
const ZONES = [
  {
    id: 1, weekId: 1, questId: 'w1q1', requiredQuest: null,
    houseX: 8, houseY: 5, name: 'Cabane de la Verite', region: 1,
    desc: 'Ecrire noir sur blanc : ta raison profonde.',
    guardian: {
      sprite: 'old', name: 'Gardien Alain',
      dialog: [
        'Felicitations, aventurier !',
        'Tu as ecrit ta verite. Ce texte, c\'est ton ancre.',
        'Quand le doute arrivera — et il arrivera — relis ce que tu as ecrit.',
        'Voici ton Badge de Verite. +100 XP.',
        'Continue. La clarte est un muscle.',
      ],
      badge: 'Badge de Verite', xpReward: 100,
    },
    interiorNpcs: [
      { id: 'h1_sage', x: 4, y: 7, sprite: 'sage', name: 'Maeva', dialog: [
        'Bienvenue dans la Cabane de la Verite.',
        'Ta premiere mission : ecrire pourquoi tu veux entreprendre.',
        '5 blocs : ta raison reelle, ce que tu refuses, tes plus jamais, ta honte silencieuse, ta promesse.',
        'Ecris en "je". Mets des exemples concrets.',
        'Termine par : "Je fais ca parce que..."',
      ]},
      { id: 'h1_warrior', x: 9, y: 7, sprite: 'warrior', name: 'Victor', dialog: [
        'Tant que tu restes dans le mental, tu es intouchable.',
        'Des que tu ecris vrai, tu deviens responsable.',
        'Accepte de ne plus chercher la reponse parfaite.',
      ]},
      { id: 'h1_helper', x: 9, y: 9, sprite: 'villager', name: 'Camille', dialog: [
        'Ton livrable : un document de minimum 2 pages.',
        'Une phrase de synthese : "Je fais ca parce que..."',
        'Et une liste "plus jamais" de 10 lignes.',
        'Va a l\'autel pour valider ta mission quand c\'est fait.',
      ]},
    ],
  },
  {
    id: 2, weekId: 1, questId: 'w1q2', requiredQuest: 'w1q1',
    houseX: 26, houseY: 5, name: 'Tour de l\'Inventaire', region: 1,
    desc: 'Inventaire honnete : ce que tu sais faire.',
    guardian: {
      sprite: 'trader', name: 'Gardien Selma',
      dialog: [
        'Bravo ! Tu as fait l\'inventaire de tes competences.',
        'Tu sais maintenant ce que tu SAIS faire.',
        'Voici ton Badge d\'Inventaire. +100 XP.',
        'La prochaine maison t\'attend.',
      ],
      badge: 'Badge d\'Inventaire', xpReward: 100,
    },
    interiorNpcs: [
      { id: 'h2_sage', x: 4, y: 7, sprite: 'sage', name: 'Raphael', dialog: [
        'Bienvenue dans la Tour de l\'Inventaire.',
        'Ta mission : inventorier ce que tu sais VRAIMENT faire.',
        '4 listes : techniques, humaines, experiences, ce qu\'on cherche chez toi.',
        'Tu ecris TOUT. Meme ce que tu juges banal.',
      ]},
      { id: 'h2_warrior', x: 9, y: 7, sprite: 'warrior', name: 'Nadia', dialog: [
        'Le banal, quand c\'est maitrise, devient monetisable.',
        '"Je sais organiser" → "J\'ai coordonne une equipe de 3 pendant 6 mois."',
        'Tu veux de la matiere qui resiste a la realite.',
      ]},
      { id: 'h2_helper', x: 9, y: 9, sprite: 'villager', name: 'Theo', dialog: [
        'A la fin, extrais 3 piliers de valeur :',
        '1. Ce que tu maitrises et peux delivrer vite.',
        '2. Ce que tu comprends profondement.',
        '3. Ce que tu as deja resolu et peux reproduire.',
      ]},
    ],
  },
  {
    id: 3, weekId: 1, questId: 'w1q3', requiredQuest: 'w1q2',
    houseX: 17, houseY: 18, name: 'Forge du Silence', region: 1,
    desc: '7 jours sans surconsommation.',
    guardian: {
      sprite: 'sage', name: 'Gardien Yuki',
      dialog: [
        'Impressionnant. 7 jours de silence.',
        'Ton esprit est plus clair maintenant.',
        'Voici ton Badge du Silence. +100 XP.',
        'La Semaine 1 est terminee. Tu as prouve que tu peux agir.',
      ],
      badge: 'Badge du Silence', xpReward: 100,
    },
    interiorNpcs: [
      { id: 'h3_sage', x: 4, y: 7, sprite: 'sage', name: 'Eliane', dialog: [
        'Bienvenue dans la Forge du Silence.',
        'Ta mission : 7 jours de silence informationnel.',
        'Bloque YouTube, les formations, les podcasts business.',
        'Ton energie va dans la production, pas dans l\'absorption.',
      ]},
      { id: 'h3_warrior', x: 9, y: 7, sprite: 'warrior', name: 'Axel', dialog: [
        'La clarte arrive quand le bruit descend.',
        'Tu recuperes ton attention.',
        'Et ton attention, c\'est ton actif le plus precieux.',
      ]},
      { id: 'h3_helper', x: 9, y: 9, sprite: 'villager', name: 'Ines', dialog: [
        'Remplace la consommation par un rituel :',
        '30 min/jour : ecrire, clarifier, structurer.',
        '15 min/jour : relire et surligner les phrases vraies.',
        'Tracking : 7 cases a cocher.',
      ]},
    ],
  },
]

// Door positions (bottom-center of house)
ZONES.forEach(z => { z.doorX = z.houseX + 1; z.doorY = z.houseY + 3 })

// ============================================================
// OVERWORLD NPCs
// ============================================================
const NPCS = [
  { id: 'mentor', x: 19, y: 14, sprite: 'mentor', name: 'Laurent', wander: 2,
    dialog: [
      'Bienvenue, aventurier. Je suis Laurent, ton guide.',
      'L\'objectif : passer de quelqu\'un qui pense... a quelqu\'un qui agit.',
      'Tu as 3 missions. Chaque maison contient une epreuve.',
      'Cabane de la Verite : ecrire ta raison profonde.',
      'Tour de l\'Inventaire : identifier ce que tu sais faire.',
      'Forge du Silence : couper le bruit pendant 7 jours.',
      'Entre dans chaque maison, parle aux conseillers, valide ta mission.',
      'Bonne route, entrepreneur.',
    ] },
  { id: 'guide1', x: 14, y: 10, sprite: 'villager', name: 'Elise', wander: 3,
    dialog: [
      'Salut ! Bienvenue dans le Village de la Clarte.',
      'Chaque maison a des conseillers qui t\'expliquent ta mission.',
      'Parle-leur, puis va a l\'autel pour valider.',
    ] },
  { id: 'old1', x: 30, y: 12, sprite: 'old', name: 'Ancien', wander: 1,
    dialog: [
      'Beaucoup passent par ici... peu vont jusqu\'au bout.',
      'Le secret ? La constance bat le talent.',
      'Reste concentre. Une mission a la fois.',
    ] },
  { id: 'trader1', x: 24, y: 14, sprite: 'trader', name: 'Marc', wander: 2,
    dialog: [
      'Je suis Marc, ancien entrepreneur.',
      'Le passage a l\'action bat la reflexion.',
      'Chaque echec est une donnee. Pas un verdict.',
    ] },
  { id: 'villager2', x: 10, y: 24, sprite: 'florist', name: 'Sophie', wander: 3,
    dialog: [
      'Tu vois ce jardin ? Je l\'ai plante graine par graine.',
      'L\'entrepreneuriat, c\'est pareil. Une action a la fois.',
    ] },
  { id: 'warrior1', x: 22, y: 22, sprite: 'warrior', name: 'Karim', wander: 2,
    dialog: [
      'J\'etais paralyse par la peur de me tromper.',
      'Puis j\'ai compris : ne rien faire, c\'est deja se tromper.',
      'Le courage, c\'est le choix d\'avancer malgre la peur.',
    ] },
  { id: 'sage1', x: 33, y: 16, sprite: 'sage', name: 'Aiko', wander: 2,
    dialog: [
      'L\'eau de ce lac est calme... comme ton esprit devrait l\'etre.',
      'La clarte vient quand tu arretes de fuir le silence.',
      'Pose-toi. Ecris. Observe ce qui monte.',
    ] },
]

// ============================================================
// NPC WANDERING AI
// ============================================================
NPCS.forEach(npc => {
  npc.homeX = npc.x; npc.homeY = npc.y
  npc.direction = 'down'; npc.walkFrame = 0; npc.walkTick = 0
  npc.moving = false; npc.tx = npc.x; npc.ty = npc.y
  npc.moveFrame = 0; npc.ox = 0; npc.oy = 0
  npc.wanderTimer = Math.floor(Math.random() * 120) + 60
})

const NPC_SPEED = 12
const WDIRS = [{ dx: 0, dy: -1, d: 'up' }, { dx: 0, dy: 1, d: 'down' }, { dx: -1, dy: 0, d: 'left' }, { dx: 1, dy: 0, d: 'right' }]

function updateNPCs(map, px, py) {
  for (const n of NPCS) {
    if (n.moving) {
      n.moveFrame++
      const p = n.moveFrame / NPC_SPEED
      n.ox = (n.tx - n.x) * TILE * p
      n.oy = (n.ty - n.y) * TILE * p
      n.walkTick++
      if (n.walkTick % 6 === 0) n.walkFrame = (n.walkFrame + 1) % 3
      if (n.moveFrame >= NPC_SPEED) {
        n.x = n.tx; n.y = n.ty; n.ox = 0; n.oy = 0
        n.moving = false; n.moveFrame = 0
        n.wanderTimer = 40 + Math.floor(Math.random() * 100)
      }
    } else {
      n.walkFrame = 0; n.wanderTimer--
      if (n.wanderTimer <= 0 && n.wander) {
        const d = WDIRS[Math.floor(Math.random() * 4)]
        const nx = n.x + d.dx, ny = n.y + d.dy
        if (Math.abs(nx - n.homeX) + Math.abs(ny - n.homeY) <= n.wander &&
            canMove(map, nx, ny) && (nx !== px || ny !== py) &&
            !NPCS.some(o => o !== n && o.x === nx && o.y === ny)) {
          n.direction = d.d; n.tx = nx; n.ty = ny
          n.moving = true; n.moveFrame = 0
        }
        n.wanderTimer = 60 + Math.floor(Math.random() * 120)
      }
    }
  }
}

// ============================================================
// MAP GENERATION
// ============================================================
function rng(seed) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function generateMap() {
  const r = rng(42)
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS))

  // --- FOREST BORDER (dense, 2–3 tiles thick) ---
  for (let x = 0; x < COLS; x++) {
    m[0][x] = T.TREE; m[1][x] = T.TREE
    if (r() > 0.3) m[2][x] = T.TREE
    m[ROWS - 1][x] = T.TREE; m[ROWS - 2][x] = T.TREE
    if (r() > 0.3) m[ROWS - 3][x] = T.TREE
  }
  for (let y = 0; y < ROWS; y++) {
    m[y][0] = T.TREE; m[y][1] = T.TREE
    if (r() > 0.3) m[y][2] = T.TREE
    m[y][COLS - 1] = T.TREE; m[y][COLS - 2] = T.TREE
    if (r() > 0.3) m[y][COLS - 3] = T.TREE
  }

  // --- INNER TREE CLUSTERS ---
  const clusters = [[35, 5, 2], [4, 14, 2], [36, 22, 2], [35, 14, 2], [4, 26, 2], [14, 28, 1], [28, 28, 1], [6, 13, 1], [34, 9, 1]]
  for (const [cx, cy, rad] of clusters) {
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const nx = cx + dx, ny = cy + dy
        if (nx > 2 && ny > 2 && nx < COLS - 3 && ny < ROWS - 3 && r() > 0.15) m[ny][nx] = T.TREE
      }
    }
  }

  // --- SCATTERED BUSHES ---
  for (let i = 0; i < 30; i++) {
    const x = 3 + Math.floor(r() * (COLS - 6)), y = 3 + Math.floor(r() * (ROWS - 6))
    if (m[y][x] === T.GRASS) m[y][x] = T.BUSH
  }

  // --- FLOWERS & VARIETY ---
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(r() * COLS), y = Math.floor(r() * ROWS)
    if (m[y][x] === T.GRASS) m[y][x] = T.FLOWER
  }
  for (const [cx, cy] of [[10, 20], [30, 8], [24, 24], [6, 8], [32, 26]]) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && m[ny][nx] === T.GRASS && r() > 0.4) m[ny][nx] = T.DARK_GRASS
    }
  }
  for (const [cx, cy] of [[5, 16], [33, 6], [25, 27], [12, 3]]) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1 && (m[ny][nx] === T.GRASS || m[ny][nx] === T.DARK_GRASS) && r() > 0.3) m[ny][nx] = T.TALL_GRASS
    }
  }

  // --- LAKE (east side) ---
  const lx = 31, ly = 16
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    if (Math.sqrt(dx * dx * 0.7 + dy * dy * 1.3) < 3.2) {
      const nx = lx + dx, ny = ly + dy
      if (nx > 3 && ny > 3 && nx < COLS - 3 && ny < ROWS - 3) m[ny][nx] = T.WATER
    }
  }
  // Stream south from lake
  for (let y = 19; y <= 24; y++) { m[y][30] = T.WATER; if (r() > 0.5) m[y][31] = T.WATER }
  // Sand shores
  for (let y = 3; y < ROWS - 3; y++) for (let x = 3; x < COLS - 3; x++) {
    if (m[y][x] !== T.WATER) continue
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) {
        const t = m[ny][nx]
        if (t === T.GRASS || t === T.FLOWER || t === T.DARK_GRASS || t === T.TALL_GRASS) m[ny][nx] = T.SAND
      }
    }
  }
  // Bridge
  for (let bx = 29; bx <= 32; bx++) { m[20][bx] = T.BRIDGE; m[21][bx] = T.BRIDGE }
  m[19][29] = T.FENCE; m[19][32] = T.FENCE; m[22][29] = T.FENCE; m[22][32] = T.FENCE

  // --- MOUNTAINS (NE corner) ---
  for (const [mx, my] of [[35, 4], [36, 4], [35, 5], [36, 5], [34, 5]]) {
    if (mx < COLS - 3 && my > 2) m[my][mx] = T.MOUNTAIN
  }

  // --- MAIN PATH NETWORK ---
  // Horizontal road
  for (let x = 3; x < COLS - 3; x++) { m[12][x] = T.PATH; m[13][x] = T.PATH }
  // Vertical road
  for (let y = 3; y < ROWS - 3; y++) { m[y][18] = T.PATH; m[y][19] = T.PATH }
  // Village square
  for (let x = 15; x <= 22; x++) { m[10][x] = T.PATH; m[15][x] = T.PATH }
  for (let y = 10; y <= 15; y++) { m[y][15] = T.PATH; m[y][22] = T.PATH }
  // Square decorations
  for (const [fx, fy] of [[16, 11], [17, 11], [20, 11], [21, 11], [16, 14], [17, 14], [20, 14], [21, 14]]) m[fy][fx] = T.FLOWER
  // Fences near square
  for (let x = 12; x <= 14; x++) m[10][x] = T.FENCE
  for (let x = 23; x <= 25; x++) m[10][x] = T.FENCE

  // Paths to each house
  for (const z of ZONES) {
    const dx = z.doorX, dy = z.doorY + 1
    // Vertical to main road
    for (let y = Math.min(dy, 12); y <= Math.max(dy, 13); y++) {
      if (m[y][dx] !== T.PATH && !SOLID.has(m[y][dx])) m[y][dx] = T.PATH
    }
    // Horizontal to main road
    for (let x = Math.min(dx, 18); x <= Math.max(dx, 19); x++) {
      if (m[dy][x] !== T.PATH && !SOLID.has(m[dy][x])) m[dy][x] = T.PATH
    }
  }

  // --- GARDEN (south) ---
  for (let y = 23; y <= 26; y++) for (let x = 7; x <= 14; x++) {
    if (m[y][x] === T.GRASS || m[y][x] === T.DARK_GRASS) m[y][x] = r() > 0.35 ? T.FLOWER : T.GRASS
  }
  for (let x = 6; x <= 15; x++) { m[22][x] = T.FENCE; m[27][x] = T.FENCE }
  for (let y = 22; y <= 27; y++) { m[y][6] = T.FENCE; m[y][15] = T.FENCE }
  m[22][10] = T.PATH; m[22][11] = T.PATH; m[27][10] = T.PATH; m[27][11] = T.PATH

  // --- PLACE HOUSES ---
  for (const z of ZONES) {
    const hx = z.houseX, hy = z.houseY
    // Clear area
    for (let dy = -1; dy <= 5; dy++) for (let dx = -2; dx <= 4; dx++) {
      const nx = hx + dx, ny = hy + dy
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && m[ny][nx] !== T.PATH) m[ny][nx] = T.GRASS
    }
    // House footprint 3×4
    m[hy][hx] = T.H_TL;     m[hy][hx+1] = T.H_TC;   m[hy][hx+2] = T.H_TR
    m[hy+1][hx] = T.H_ML;   m[hy+1][hx+1] = T.H_MC; m[hy+1][hx+2] = T.H_MR
    m[hy+2][hx] = T.H_BL;   m[hy+2][hx+1] = T.H_WIN; m[hy+2][hx+2] = T.H_BR
    m[hy+3][hx] = T.H_DL;   m[hy+3][hx+1] = T.H_DOOR; m[hy+3][hx+2] = T.H_DR
    // Path at door + sign
    m[hy+4][hx+1] = T.PATH
    if (hx + 3 < COLS) m[hy+3][hx+3] = T.SIGN
    // Flowers around house
    for (const [fx, fy] of [[-1, 1], [-1, 2], [3, 1], [3, 2]]) {
      const nx = hx + fx, ny = hy + fy
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && m[ny][nx] === T.GRASS) m[ny][nx] = T.FLOWER
    }
  }

  // Ensure NPC positions are walkable
  for (const n of NPCS) {
    if (n.y < ROWS && n.x < COLS && SOLID.has(m[n.y][n.x])) m[n.y][n.x] = T.PATH
  }

  return m
}

// ============================================================
// LABELS
// ============================================================
function drawZoneLabel(ctx, zone, px, py, unlocked, completed) {
  const tileS = TILE * 3
  const cx = px + tileS * 1.5
  const bw = zone.name.length * 4.5 + 16
  const bx = cx - bw / 2, by = py - 12

  ctx.fillStyle = completed ? 'rgba(199,183,119,0.92)' : unlocked ? 'rgba(12,12,25,0.88)' : 'rgba(10,10,15,0.65)'
  ctx.beginPath(); ctx.roundRect(bx, by, bw, 16, 4); ctx.fill()
  ctx.strokeStyle = completed ? '#e0d9a8' : unlocked ? '#c7b777' : '#444'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect(bx, by, bw, 16, 4); ctx.stroke()
  ctx.fillStyle = completed ? '#1a1a2a' : unlocked ? '#c7b777' : '#555'
  ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center'
  ctx.fillText(zone.name, cx, by + 11)
  if (!unlocked) { ctx.fillStyle = '#666'; ctx.font = '8px sans-serif'; ctx.fillText('\u{1F512}', cx, by - 2) }
  if (completed) { ctx.fillStyle = '#2a6a1e'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('\u2713', cx, by - 1) }
}

function drawNPCLabel(ctx, npc, px, py, tick) {
  const tileS = TILE * 3
  const cx = px + tileS / 2
  const bob = Math.sin(tick * 0.05) * 2

  ctx.fillStyle = '#c7b777'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText('!', cx, py - 6 + bob)

  const nw = npc.name.length * 4.5 + 8
  const nx = cx - nw / 2, ny = py - 16 + bob
  ctx.fillStyle = 'rgba(5,5,15,0.75)'
  ctx.beginPath(); ctx.roundRect(nx, ny, nw, 10, 3); ctx.fill()
  ctx.fillStyle = '#c7b777'; ctx.font = '6px monospace'
  ctx.fillText(npc.name, cx, ny + 7)
}

// ============================================================
// COLLISION & PROXIMITY
// ============================================================
function canMove(map, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false
  if (SOLID.has(map[y][x])) return false
  return !NPCS.some(n => n.x === x && n.y === y)
}

function getAdjacentZone(tx, ty) {
  for (const z of ZONES) {
    if (Math.abs(tx - z.doorX) <= 1 && ty - z.doorY >= 0 && ty - z.doorY <= 2) return z
  }
  return null
}

function getAdjacentNPC(tx, ty) {
  for (const n of NPCS) { if (Math.abs(tx - n.x) <= 1 && Math.abs(ty - n.y) <= 1) return n }
  return null
}

function getAdjacentInteriorNPC(tx, ty, npcs) {
  if (!npcs) return null
  for (const n of npcs) { if (Math.abs(tx - n.x) <= 1 && Math.abs(ty - n.y) <= 1) return n }
  return null
}

export {
  TILE, COLS, ROWS, T, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel,
  getAdjacentZone, getAdjacentNPC, getAdjacentInteriorNPC, canMove, updateNPCs,
}
