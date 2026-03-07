// Sprite Atlas Generator - Pre-renders all tiles and sprites to offscreen canvases
// This runs ONCE at startup for maximum performance and visual quality

const TS = 32 // tile render size

// Create a small offscreen canvas for rendering a single tile
function makeTileCanvas() {
  const c = document.createElement('canvas')
  c.width = TS
  c.height = TS
  return c
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

// ============ TILE RENDERERS ============

function renderGrass(variant = 0) {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Base gradient
  const grad = g.createLinearGradient(0, 0, 0, TS)
  if (variant === 0) {
    grad.addColorStop(0, '#5eae3a')
    grad.addColorStop(1, '#4a9530')
  } else {
    grad.addColorStop(0, '#52a236')
    grad.addColorStop(1, '#429028')
  }
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  // Grass texture dots/blades
  g.fillStyle = 'rgba(80,180,50,0.5)'
  const seed = variant * 137
  for (let i = 0; i < 6; i++) {
    const x = ((seed + i * 73) % 28) + 2
    const y = ((seed + i * 47) % 26) + 3
    g.fillRect(x, y, 1, 2)
  }
  g.fillStyle = 'rgba(40,120,25,0.4)'
  for (let i = 0; i < 4; i++) {
    const x = ((seed + i * 91) % 26) + 3
    const y = ((seed + i * 59) % 24) + 4
    g.fillRect(x, y, 1, 3)
  }

  return c
}

function renderDarkGrass(variant = 0) {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  const grad = g.createLinearGradient(0, 0, 0, TS)
  grad.addColorStop(0, '#3d8228')
  grad.addColorStop(1, '#2d6a1e')
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  g.fillStyle = 'rgba(55,140,35,0.5)'
  const seed = variant * 171
  for (let i = 0; i < 5; i++) {
    const x = ((seed + i * 67) % 28) + 2
    const y = ((seed + i * 43) % 26) + 3
    g.fillRect(x, y, 1, 3)
  }

  return c
}

function renderTallGrass(frame = 0) {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Base grass
  const grad = g.createLinearGradient(0, 0, 0, TS)
  grad.addColorStop(0, '#5eae3a')
  grad.addColorStop(1, '#4a9530')
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  // Tall swaying blades
  const sway = Math.sin(frame * 0.8) * 2
  const bladeColors = ['#2d7a1e', '#389025', '#2a7020', '#348a22', '#3a9028']
  for (let i = 0; i < 7; i++) {
    const bx = 2 + i * 4 + sway * (i % 2 === 0 ? 1 : -0.5)
    g.fillStyle = bladeColors[i % bladeColors.length]
    g.fillRect(bx, 2, 2, TS - 6)
    // Blade tip highlight
    g.fillStyle = '#50c838'
    g.fillRect(bx, 1, 2, 3)
  }
  // Lighter overlay blades
  g.fillStyle = 'rgba(80,200,55,0.3)'
  for (let i = 0; i < 4; i++) {
    const bx = 4 + i * 7 + sway * 0.7
    g.fillRect(bx, 4, 1, TS - 10)
  }

  return c
}

function renderPath(variant = 0) {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Sandy path with gradient
  const grad = g.createLinearGradient(0, 0, TS, TS)
  grad.addColorStop(0, '#dcc080')
  grad.addColorStop(0.5, '#d4b878')
  grad.addColorStop(1, '#c8a868')
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  // Subtle stone/pebble texture
  g.fillStyle = 'rgba(180,150,90,0.5)'
  const seed = variant * 113
  for (let i = 0; i < 4; i++) {
    const x = ((seed + i * 83) % 26) + 3
    const y = ((seed + i * 53) % 24) + 4
    g.beginPath()
    g.ellipse(x, y, 2 + (i % 2), 1.5, 0, 0, Math.PI * 2)
    g.fill()
  }

  // Dark grain
  g.fillStyle = 'rgba(140,110,60,0.3)'
  for (let i = 0; i < 3; i++) {
    const x = ((seed + i * 97) % 28) + 2
    const y = ((seed + i * 61) % 28) + 2
    g.fillRect(x, y, 2, 1)
  }

  return c
}

function renderWater(frame = 0) {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Deep water gradient
  const grad = g.createLinearGradient(0, 0, 0, TS)
  grad.addColorStop(0, '#2878b8')
  grad.addColorStop(0.5, '#3088cc')
  grad.addColorStop(1, '#2575b5')
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  // Wave lines
  const wo = Math.sin(frame * 0.6) * 3
  g.strokeStyle = 'rgba(80,180,255,0.4)'
  g.lineWidth = 1.5
  g.beginPath()
  g.moveTo(0, 10 + wo)
  g.bezierCurveTo(8, 8 + wo, 16, 12 + wo, TS, 10 + wo)
  g.stroke()

  g.strokeStyle = 'rgba(60,160,240,0.35)'
  g.beginPath()
  g.moveTo(0, 22 - wo * 0.7)
  g.bezierCurveTo(10, 20 - wo * 0.7, 20, 24 - wo * 0.7, TS, 22 - wo * 0.7)
  g.stroke()

  // Highlight shimmer
  g.fillStyle = 'rgba(150,220,255,0.3)'
  const sx = ((frame * 3) % 24) + 4
  const sy = ((frame * 7) % 20) + 6
  g.fillRect(sx, sy, 2, 1)

  // Sparkle
  if (frame % 4 === 0) {
    g.fillStyle = 'rgba(255,255,255,0.6)'
    g.fillRect(12 + wo, 6, 1, 1)
  }

  return c
}

function renderTree() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Grass base
  const baseGrad = g.createLinearGradient(0, 0, 0, TS)
  baseGrad.addColorStop(0, '#5eae3a')
  baseGrad.addColorStop(1, '#4a9530')
  g.fillStyle = baseGrad
  g.fillRect(0, 0, TS, TS)

  // Ground shadow
  g.fillStyle = 'rgba(0,0,0,0.15)'
  g.beginPath()
  g.ellipse(16, 28, 10, 4, 0, 0, Math.PI * 2)
  g.fill()

  // Trunk with gradient
  const trunkGrad = g.createLinearGradient(12, 16, 20, 16)
  trunkGrad.addColorStop(0, '#5a3818')
  trunkGrad.addColorStop(0.4, '#7a5230')
  trunkGrad.addColorStop(1, '#5a3818')
  g.fillStyle = trunkGrad
  g.fillRect(13, 16, 6, 14)

  // Trunk bark detail
  g.fillStyle = 'rgba(40,25,10,0.3)'
  g.fillRect(14, 18, 1, 3)
  g.fillRect(16, 22, 1, 4)

  // Canopy - multiple overlapping circles with gradients
  // Shadow layer
  g.fillStyle = 'rgba(20,80,15,0.8)'
  g.beginPath()
  g.arc(16, 14, 12, 0, Math.PI * 2)
  g.fill()

  // Main canopy
  const canopyGrad = g.createRadialGradient(14, 10, 2, 16, 13, 12)
  canopyGrad.addColorStop(0, '#48c838')
  canopyGrad.addColorStop(0.4, '#38a828')
  canopyGrad.addColorStop(1, '#228818')
  g.fillStyle = canopyGrad
  g.beginPath()
  g.arc(16, 12, 11, 0, Math.PI * 2)
  g.fill()

  // Highlight cluster
  const hiGrad = g.createRadialGradient(12, 8, 1, 13, 9, 6)
  hiGrad.addColorStop(0, '#60e048')
  hiGrad.addColorStop(1, 'rgba(56,168,40,0)')
  g.fillStyle = hiGrad
  g.beginPath()
  g.arc(13, 9, 6, 0, Math.PI * 2)
  g.fill()

  // Leaf highlight dots
  g.fillStyle = 'rgba(100,220,70,0.6)'
  g.fillRect(10, 7, 2, 2)
  g.fillRect(18, 5, 2, 2)
  g.fillRect(8, 13, 2, 2)
  g.fillRect(21, 10, 2, 2)

  return c
}

function renderMountain() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Dark grass base
  g.fillStyle = '#2d6a1e'
  g.fillRect(0, 0, TS, TS)

  // Mountain body - gradient
  const mtnGrad = g.createLinearGradient(16, 0, 16, TS)
  mtnGrad.addColorStop(0, '#a8a8b8')
  mtnGrad.addColorStop(0.3, '#8888a0')
  mtnGrad.addColorStop(1, '#686880')
  g.fillStyle = mtnGrad
  g.beginPath()
  g.moveTo(-2, TS)
  g.lineTo(16, -2)
  g.lineTo(TS + 2, TS)
  g.closePath()
  g.fill()

  // Light side
  g.fillStyle = 'rgba(200,200,220,0.3)'
  g.beginPath()
  g.moveTo(16, -2)
  g.lineTo(TS + 2, TS)
  g.lineTo(16, TS)
  g.closePath()
  g.fill()

  // Snow cap with gradient
  const snowGrad = g.createLinearGradient(16, 0, 16, 12)
  snowGrad.addColorStop(0, '#f0f4ff')
  snowGrad.addColorStop(1, 'rgba(220,225,240,0)')
  g.fillStyle = snowGrad
  g.beginPath()
  g.moveTo(10, 10)
  g.lineTo(16, -2)
  g.lineTo(22, 10)
  g.closePath()
  g.fill()

  // Rock detail
  g.strokeStyle = 'rgba(60,60,80,0.3)'
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(8, 20)
  g.lineTo(14, 18)
  g.stroke()
  g.beginPath()
  g.moveTo(18, 22)
  g.lineTo(25, 24)
  g.stroke()

  return c
}

function renderFlower(variant = 0) {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Grass base
  const grad = g.createLinearGradient(0, 0, 0, TS)
  grad.addColorStop(0, '#5eae3a')
  grad.addColorStop(1, '#4a9530')
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  // Flower stems
  g.strokeStyle = '#3a8825'
  g.lineWidth = 1.5
  g.beginPath()
  g.moveTo(10, 22)
  g.lineTo(10, 14)
  g.stroke()
  g.beginPath()
  g.moveTo(22, 24)
  g.lineTo(22, 16)
  g.stroke()

  // Flower colors based on variant
  const flowerSets = [
    ['#f06070', '#ffdd50'],
    ['#f090c0', '#fff080'],
    ['#60b0ff', '#ffe060'],
    ['#f09040', '#ffee80'],
    ['#d070e0', '#ffe888'],
    ['#ff5050', '#fff060'],
  ]
  const [petal, center] = flowerSets[variant % flowerSets.length]

  // Flower 1
  g.fillStyle = petal
  for (let a = 0; a < 5; a++) {
    const angle = (a / 5) * Math.PI * 2 - Math.PI / 2
    g.beginPath()
    g.arc(10 + Math.cos(angle) * 3, 12 + Math.sin(angle) * 3, 2.5, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = center
  g.beginPath()
  g.arc(10, 12, 2, 0, Math.PI * 2)
  g.fill()

  // Flower 2 (different color)
  const [petal2, center2] = flowerSets[(variant + 3) % flowerSets.length]
  g.fillStyle = petal2
  for (let a = 0; a < 5; a++) {
    const angle = (a / 5) * Math.PI * 2
    g.beginPath()
    g.arc(22 + Math.cos(angle) * 2.5, 14 + Math.sin(angle) * 2.5, 2, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = center2
  g.beginPath()
  g.arc(22, 14, 1.5, 0, Math.PI * 2)
  g.fill()

  return c
}

function renderBridge() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Water underneath
  const waterGrad = g.createLinearGradient(0, 0, 0, TS)
  waterGrad.addColorStop(0, '#2878b8')
  waterGrad.addColorStop(1, '#2575b5')
  g.fillStyle = waterGrad
  g.fillRect(0, 0, TS, TS)

  // Bridge planks
  const plankGrad = g.createLinearGradient(0, 0, TS, 0)
  plankGrad.addColorStop(0, '#a07838')
  plankGrad.addColorStop(0.5, '#c09048')
  plankGrad.addColorStop(1, '#a07838')
  g.fillStyle = plankGrad
  g.fillRect(0, 2, TS, TS - 4)

  // Plank lines
  g.strokeStyle = 'rgba(80,50,20,0.4)'
  g.lineWidth = 1
  for (let y = 4; y < TS - 4; y += 5) {
    g.beginPath()
    g.moveTo(2, y)
    g.lineTo(TS - 2, y)
    g.stroke()
  }

  // Wood grain
  g.strokeStyle = 'rgba(120,80,30,0.3)'
  g.beginPath()
  g.moveTo(8, 4)
  g.lineTo(10, TS - 4)
  g.stroke()
  g.beginPath()
  g.moveTo(22, 4)
  g.lineTo(20, TS - 4)
  g.stroke()

  // Rails with shadow
  g.fillStyle = '#6a4820'
  g.fillRect(0, 1, 3, TS - 2)
  g.fillRect(TS - 3, 1, 3, TS - 2)
  g.fillStyle = '#8a6830'
  g.fillRect(1, 1, 2, TS - 2)
  g.fillRect(TS - 2, 1, 1, TS - 2)

  return c
}

function renderFence() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Grass base
  const grad = g.createLinearGradient(0, 0, 0, TS)
  grad.addColorStop(0, '#5eae3a')
  grad.addColorStop(1, '#4a9530')
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  // Fence posts with gradient
  const postGrad = g.createLinearGradient(0, 0, 4, 0)
  postGrad.addColorStop(0, '#8a6838')
  postGrad.addColorStop(1, '#a88048')
  g.fillStyle = postGrad
  g.fillRect(4, 6, 4, 22)
  g.fillRect(24, 6, 4, 22)

  // Horizontal bars
  const barGrad = g.createLinearGradient(0, 0, 0, 3)
  barGrad.addColorStop(0, '#b89048')
  barGrad.addColorStop(1, '#987038')
  g.fillStyle = barGrad
  g.fillRect(0, 10, TS, 3)
  g.fillRect(0, 20, TS, 3)

  // Post tops
  g.fillStyle = '#c0a058'
  g.fillRect(4, 5, 4, 2)
  g.fillRect(24, 5, 4, 2)

  return c
}

function renderRoof() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Sky/grass behind
  g.fillStyle = '#5eae3a'
  g.fillRect(0, 0, TS, TS)

  // Roof body with gradient (3D effect)
  const roofGrad = g.createLinearGradient(0, TS, TS, 0)
  roofGrad.addColorStop(0, '#a83020')
  roofGrad.addColorStop(0.4, '#c84830')
  roofGrad.addColorStop(0.7, '#d85838')
  roofGrad.addColorStop(1, '#e06840')
  g.fillStyle = roofGrad

  g.beginPath()
  g.moveTo(-4, TS + 2)
  g.lineTo(16, -2)
  g.lineTo(TS + 4, TS + 2)
  g.closePath()
  g.fill()

  // Roof highlight edge
  g.strokeStyle = 'rgba(255,200,150,0.3)'
  g.lineWidth = 1.5
  g.beginPath()
  g.moveTo(16, -2)
  g.lineTo(TS + 4, TS + 2)
  g.stroke()

  // Tile lines on roof
  g.strokeStyle = 'rgba(100,30,15,0.3)'
  g.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const y = i * 8
    const x1 = 16 - (y / TS) * 20
    const x2 = 16 + (y / TS) * 20
    g.beginPath()
    g.moveTo(x1, y)
    g.lineTo(x2, y)
    g.stroke()
  }

  return c
}

function renderWall() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Wall base with gradient
  const wallGrad = g.createLinearGradient(0, 0, 0, TS)
  wallGrad.addColorStop(0, '#f4ece0')
  wallGrad.addColorStop(1, '#e0d4c0')
  g.fillStyle = wallGrad
  g.fillRect(0, 0, TS, TS)

  // Brick lines
  g.strokeStyle = 'rgba(180,160,130,0.6)'
  g.lineWidth = 1
  // Horizontal
  g.beginPath(); g.moveTo(0, 8); g.lineTo(TS, 8); g.stroke()
  g.beginPath(); g.moveTo(0, 16); g.lineTo(TS, 16); g.stroke()
  g.beginPath(); g.moveTo(0, 24); g.lineTo(TS, 24); g.stroke()
  // Vertical (staggered)
  g.beginPath(); g.moveTo(16, 0); g.lineTo(16, 8); g.stroke()
  g.beginPath(); g.moveTo(8, 8); g.lineTo(8, 16); g.stroke()
  g.beginPath(); g.moveTo(24, 8); g.lineTo(24, 16); g.stroke()
  g.beginPath(); g.moveTo(16, 16); g.lineTo(16, 24); g.stroke()
  g.beginPath(); g.moveTo(8, 24); g.lineTo(8, 32); g.stroke()
  g.beginPath(); g.moveTo(24, 24); g.lineTo(24, 32); g.stroke()

  // Window with glass reflection
  g.fillStyle = '#78b8e0'
  g.fillRect(10, 3, 12, 10)

  // Glass reflection gradient
  const glassGrad = g.createLinearGradient(10, 3, 22, 13)
  glassGrad.addColorStop(0, 'rgba(160,220,255,0.6)')
  glassGrad.addColorStop(0.5, 'rgba(100,180,230,0)')
  glassGrad.addColorStop(1, 'rgba(140,200,240,0.3)')
  g.fillStyle = glassGrad
  g.fillRect(10, 3, 12, 10)

  // Window frame
  g.strokeStyle = '#8a7a5a'
  g.lineWidth = 1.5
  g.strokeRect(10, 3, 12, 10)
  // Cross
  g.beginPath(); g.moveTo(16, 3); g.lineTo(16, 13); g.stroke()
  g.beginPath(); g.moveTo(10, 8); g.lineTo(22, 8); g.stroke()

  // Window sill shadow
  g.fillStyle = 'rgba(0,0,0,0.1)'
  g.fillRect(9, 13, 14, 2)

  return c
}

function renderDoor() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Wall background
  const wallGrad = g.createLinearGradient(0, 0, 0, TS)
  wallGrad.addColorStop(0, '#f4ece0')
  wallGrad.addColorStop(1, '#e0d4c0')
  g.fillStyle = wallGrad
  g.fillRect(0, 0, TS, TS)

  // Door frame shadow
  g.fillStyle = 'rgba(0,0,0,0.15)'
  g.fillRect(7, 2, 20, TS - 2)

  // Door with wood gradient
  const doorGrad = g.createLinearGradient(8, 0, 24, 0)
  doorGrad.addColorStop(0, '#5a3818')
  doorGrad.addColorStop(0.3, '#7a5230')
  doorGrad.addColorStop(0.7, '#7a5230')
  doorGrad.addColorStop(1, '#5a3818')
  g.fillStyle = doorGrad
  g.fillRect(8, 3, 16, TS - 3)

  // Door panels
  g.strokeStyle = 'rgba(90,50,20,0.5)'
  g.lineWidth = 1
  g.strokeRect(10, 5, 12, 10)
  g.strokeRect(10, 18, 12, 10)

  // Panel inner highlight
  g.fillStyle = 'rgba(140,90,40,0.3)'
  g.fillRect(11, 6, 10, 8)
  g.fillRect(11, 19, 10, 8)

  // Door knob with metallic gradient
  const knobGrad = g.createRadialGradient(21, 18, 0, 21, 18, 2.5)
  knobGrad.addColorStop(0, '#f0e0a0')
  knobGrad.addColorStop(0.5, '#c7b777')
  knobGrad.addColorStop(1, '#a08838')
  g.fillStyle = knobGrad
  g.beginPath()
  g.arc(21, 18, 2, 0, Math.PI * 2)
  g.fill()

  // Stone step
  const stepGrad = g.createLinearGradient(0, TS - 3, 0, TS)
  stepGrad.addColorStop(0, '#c0b098')
  stepGrad.addColorStop(1, '#a89878')
  g.fillStyle = stepGrad
  g.fillRect(4, TS - 3, 24, 3)

  return c
}

function renderSign() {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  // Path base
  const pathGrad = g.createLinearGradient(0, 0, TS, TS)
  pathGrad.addColorStop(0, '#dcc080')
  pathGrad.addColorStop(1, '#c8a868')
  g.fillStyle = pathGrad
  g.fillRect(0, 0, TS, TS)

  // Post with gradient
  const postGrad = g.createLinearGradient(14, 0, 18, 0)
  postGrad.addColorStop(0, '#5a3a1a')
  postGrad.addColorStop(1, '#7a5a2a')
  g.fillStyle = postGrad
  g.fillRect(14, 16, 4, 14)

  // Sign board with shadow
  g.fillStyle = 'rgba(0,0,0,0.15)'
  g.fillRect(5, 7, 22, 13)

  const boardGrad = g.createLinearGradient(4, 5, 28, 18)
  boardGrad.addColorStop(0, '#dcc070')
  boardGrad.addColorStop(0.5, '#c8aa55')
  boardGrad.addColorStop(1, '#b89840')
  g.fillStyle = boardGrad
  g.fillRect(4, 5, 24, 13)

  // Board border
  g.strokeStyle = '#7a5a2a'
  g.lineWidth = 1.5
  g.strokeRect(4, 5, 24, 13)

  // Exclamation mark
  g.fillStyle = '#4a3010'
  g.font = 'bold 10px sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('!', 16, 12)

  return c
}

function renderSand(variant = 0) {
  const c = makeTileCanvas()
  const g = c.getContext('2d')

  const grad = g.createLinearGradient(0, 0, TS, TS)
  grad.addColorStop(0, '#ecd8a0')
  grad.addColorStop(1, '#dcc890')
  g.fillStyle = grad
  g.fillRect(0, 0, TS, TS)

  g.fillStyle = 'rgba(200,170,100,0.4)'
  const seed = variant * 131
  for (let i = 0; i < 3; i++) {
    const x = ((seed + i * 71) % 26) + 3
    const y = ((seed + i * 53) % 26) + 3
    g.fillRect(x, y, 3, 1)
  }

  return c
}

// ============ CHARACTER RENDERER ============

function renderCharacter(dir, frame, colors) {
  const c = makeCanvas(32, 32)
  const g = c.getContext('2d')
  const { skin, skinShade, shirt, shirtLight, pants, pantsLight, hair, hairLight, shoes } = colors

  const legOff = frame === 1 ? 2 : frame === 2 ? -2 : 0

  // Shadow
  g.fillStyle = 'rgba(0,0,0,0.2)'
  g.beginPath()
  g.ellipse(16, 30, 7, 3, 0, 0, Math.PI * 2)
  g.fill()

  // Legs with gradient
  g.fillStyle = pants
  g.fillRect(9, 21, 5, 7 + legOff)
  g.fillRect(18, 21, 5, 7 - legOff)
  g.fillStyle = pantsLight || pants
  g.fillRect(10, 21, 2, 7 + legOff)
  g.fillRect(19, 21, 2, 7 - legOff)

  // Shoes
  g.fillStyle = shoes || '#4a2a10'
  g.fillRect(8, 27 + legOff, 6, 3)
  g.fillRect(18, 27 - legOff, 6, 3)
  g.fillStyle = 'rgba(255,255,255,0.15)'
  g.fillRect(9, 27 + legOff, 4, 1)
  g.fillRect(19, 27 - legOff, 4, 1)

  // Body/torso with gradient
  const bodyGrad = g.createLinearGradient(8, 12, 24, 12)
  bodyGrad.addColorStop(0, shirt)
  bodyGrad.addColorStop(0.3, shirtLight || shirt)
  bodyGrad.addColorStop(1, shirt)
  g.fillStyle = bodyGrad
  g.fillRect(8, 12, 16, 10)

  // Collar detail
  if (dir === 'down') {
    g.fillStyle = 'rgba(0,0,0,0.1)'
    g.fillRect(12, 12, 8, 2)
  }

  // Arms
  const armY = frame === 1 ? 1 : frame === 2 ? -1 : 0
  g.fillStyle = shirt
  if (dir === 'left') {
    g.fillRect(4, 13 + armY, 4, 9)
    g.fillStyle = skin
    g.fillRect(4, 21 + armY, 4, 2)
  } else if (dir === 'right') {
    g.fillRect(24, 13 + armY, 4, 9)
    g.fillStyle = skin
    g.fillRect(24, 21 + armY, 4, 2)
  } else {
    g.fillRect(4, 13 - armY, 4, 9)
    g.fillRect(24, 13 + armY, 4, 9)
    g.fillStyle = skin
    g.fillRect(4, 21 - armY, 4, 2)
    g.fillRect(24, 21 + armY, 4, 2)
  }

  // Head with skin gradient
  const headGrad = g.createRadialGradient(15, 7, 1, 16, 8, 8)
  headGrad.addColorStop(0, skin)
  headGrad.addColorStop(1, skinShade || skin)
  g.fillStyle = headGrad
  g.beginPath()
  g.arc(16, 8, 7, 0, Math.PI * 2)
  g.fill()

  // Hair
  g.fillStyle = hair
  if (dir === 'up') {
    g.beginPath()
    g.arc(16, 7, 7.5, 0, Math.PI * 2)
    g.fill()
    // Hair highlight
    g.fillStyle = hairLight || hair
    g.fillRect(12, 2, 4, 3)
  } else {
    // Hair top
    g.beginPath()
    g.arc(16, 5, 7.5, Math.PI + 0.4, -0.4)
    g.fill()
    g.fillRect(9, 2, 14, 5)
    // Side hair
    if (dir === 'left') {
      g.fillRect(8, 5, 3, 5)
    } else if (dir === 'right') {
      g.fillRect(21, 5, 3, 5)
    } else {
      g.fillRect(8, 5, 3, 4)
      g.fillRect(21, 5, 3, 4)
    }
    // Hair highlight
    g.fillStyle = hairLight || 'rgba(255,255,255,0.15)'
    g.fillRect(13, 1, 5, 2)
  }

  // Face
  if (dir !== 'up') {
    // Eyes
    g.fillStyle = '#fff'
    if (dir === 'down') {
      g.fillRect(12, 6, 3, 3)
      g.fillRect(18, 6, 3, 3)
      g.fillStyle = '#222'
      g.fillRect(13, 7, 2, 2)
      g.fillRect(19, 7, 2, 2)
      // Eye shine
      g.fillStyle = '#fff'
      g.fillRect(13, 7, 1, 1)
      g.fillRect(19, 7, 1, 1)
      // Mouth
      g.fillStyle = 'rgba(0,0,0,0.3)'
      g.fillRect(14, 11, 4, 1)
    } else if (dir === 'left') {
      g.fillRect(10, 6, 3, 3)
      g.fillStyle = '#222'
      g.fillRect(10, 7, 2, 2)
      g.fillStyle = '#fff'
      g.fillRect(10, 7, 1, 1)
      g.fillStyle = 'rgba(0,0,0,0.3)'
      g.fillRect(10, 11, 3, 1)
    } else {
      g.fillRect(19, 6, 3, 3)
      g.fillStyle = '#222'
      g.fillRect(20, 7, 2, 2)
      g.fillStyle = '#fff'
      g.fillRect(20, 7, 1, 1)
      g.fillStyle = 'rgba(0,0,0,0.3)'
      g.fillRect(19, 11, 3, 1)
    }
  }

  return c
}

// ============ NPC FLOATING INDICATOR ============

function renderIndicator() {
  const c = makeCanvas(12, 16)
  const g = c.getContext('2d')

  // Glowing exclamation mark
  g.fillStyle = 'rgba(199,183,119,0.3)'
  g.beginPath()
  g.arc(6, 8, 6, 0, Math.PI * 2)
  g.fill()

  g.fillStyle = '#c7b777'
  g.font = 'bold 12px sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('!', 6, 7)

  return c
}

// ============ ATLAS BUILDER ============

export function createSpriteAtlas() {
  const atlas = {
    tiles: {},     // tileType -> canvas (or array of canvases for animated)
    chars: {},     // 'player_down_0' -> canvas
    npcChars: {},  // 'mentor_down_0' -> canvas
    indicator: null,
  }

  // Static tiles (with variants)
  atlas.tiles.grass = [renderGrass(0), renderGrass(1), renderGrass(2), renderGrass(3)]
  atlas.tiles.darkGrass = [renderDarkGrass(0), renderDarkGrass(1)]
  atlas.tiles.path = [renderPath(0), renderPath(1), renderPath(2), renderPath(3)]
  atlas.tiles.flower = [renderFlower(0), renderFlower(1), renderFlower(2), renderFlower(3), renderFlower(4), renderFlower(5)]
  atlas.tiles.sand = [renderSand(0), renderSand(1)]
  atlas.tiles.tree = renderTree()
  atlas.tiles.mountain = renderMountain()
  atlas.tiles.bridge = renderBridge()
  atlas.tiles.fence = renderFence()
  atlas.tiles.roof = renderRoof()
  atlas.tiles.wall = renderWall()
  atlas.tiles.door = renderDoor()
  atlas.tiles.sign = renderSign()

  // Animated tiles (8 frames each)
  atlas.tiles.water = []
  atlas.tiles.tallGrass = []
  for (let f = 0; f < 8; f++) {
    atlas.tiles.water.push(renderWater(f))
    atlas.tiles.tallGrass.push(renderTallGrass(f))
  }

  // Player character (4 dirs x 3 frames)
  const playerColors = {
    skin: '#f8d8a0', skinShade: '#e0c088',
    shirt: '#c7b777', shirtLight: '#e0d9a8',
    pants: '#2a2a4a', pantsLight: '#3a3a5a',
    hair: '#3a2818', hairLight: 'rgba(80,50,30,1)',
    shoes: '#4a2a10',
  }
  for (const dir of ['down', 'up', 'left', 'right']) {
    for (let f = 0; f < 3; f++) {
      atlas.chars[`player_${dir}_${f}`] = renderCharacter(dir, f, playerColors)
    }
  }

  // NPC characters
  const npcColorSets = {
    mentor: {
      skin: '#d4a060', skinShade: '#b88848',
      shirt: '#c7b777', shirtLight: '#e0d9a8',
      pants: '#2a2a5a', pantsLight: '#3a3a6a',
      hair: '#888888', hairLight: '#aaa',
      shoes: '#3a2a1a',
    },
    villager: {
      skin: '#f0c880', skinShade: '#d8b070',
      shirt: '#55aa55', shirtLight: '#68c068',
      pants: '#5555aa', pantsLight: '#6666bb',
      hair: '#8a4a2a', hairLight: '#a05a30',
      shoes: '#4a2a10',
    },
    warrior: {
      skin: '#c8a060', skinShade: '#b08848',
      shirt: '#aa3333', shirtLight: '#cc4444',
      pants: '#3a3a3a', pantsLight: '#4a4a4a',
      hair: '#1a1a1a', hairLight: '#333',
      shoes: '#2a1a0a',
    },
    sage: {
      skin: '#f0d0a0', skinShade: '#d8b888',
      shirt: '#6644aa', shirtLight: '#7755cc',
      pants: '#4a4a4a', pantsLight: '#5a5a5a',
      hair: '#dddddd', hairLight: '#fff',
      shoes: '#3a2a1a',
    },
    old: {
      skin: '#d8b888', skinShade: '#c0a070',
      shirt: '#7a7a6a', shirtLight: '#8a8a7a',
      pants: '#4a4a3a', pantsLight: '#5a5a4a',
      hair: '#cccccc', hairLight: '#eee',
      shoes: '#3a2a1a',
    },
    trader: {
      skin: '#e0b878', skinShade: '#c8a060',
      shirt: '#cc8833', shirtLight: '#e0a040',
      pants: '#5a3a2a', pantsLight: '#6a4a3a',
      hair: '#4a3a1a', hairLight: '#5a4a2a',
      shoes: '#3a1a0a',
    },
  }

  for (const [name, colors] of Object.entries(npcColorSets)) {
    atlas.npcChars[name] = renderCharacter('down', 0, colors)
  }

  atlas.indicator = renderIndicator()

  return atlas
}

export { TS }
