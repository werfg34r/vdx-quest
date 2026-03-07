// 3D World Builder for VDX Quest
// Uses Three.js to create an isometric-style 3D RPG world

import * as THREE from 'three'

// ==================== COLOR PALETTE ====================
const C = {
  grass:     0x4CAF50,
  darkGrass: 0x388E3C,
  tallGrass: 0x66BB6A,
  path:      0x8D6E63,
  water:     0x2196F3,
  sand:      0xFFCC80,
  mountain:  0x78909C,
  trunk:     0x5D4037,
  foliage:   0x2E7D32,
  foliage2:  0x43A047,
  stone:     0xBDBDBD,
  stoneD:    0x9E9E9E,
  door:      0x4E342E,
  fence:     0x795548,
  flower1:   0xE91E63,
  flower2:   0xFFEB3B,
  flower3:   0x9C27B0,
  roofR1:    0x8D6E63,
  roofR2:    0x1565C0,
  roofR3:    0xB71C1C,
}

// Tile type to ground color
const GROUND_COLOR = {
  0: C.grass, 1: C.path, 2: C.water, 3: C.grass, 5: C.mountain,
  6: C.grass, 7: C.path, 8: C.grass, 9: C.darkGrass, 10: C.sand,
  11: C.path, 12: C.path, 13: C.path, 14: C.path,
  17: C.tallGrass, 20: C.path, 21: C.path, 22: C.path, 23: C.path,
}

// Height per tile type
function tileHeight(t, x, z) {
  if (t === 2) return -0.35
  if (t === 1) return -0.02
  if (t === 10) return -0.04
  if (t === 7) return 0.08
  if ([11,12,13,14,20,21,22,23].includes(t)) return -0.02
  return Math.sin(x * 1.7 + z * 0.3) * Math.cos(z * 1.3 + x * 0.5) * 0.04
}

// ==================== TERRAIN ====================
export function buildTerrain(scene, map) {
  const ROWS = map.length, COLS = map[0].length
  const verts = [], cols = []
  const wVerts = []

  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[z][x]
      const color = new THREE.Color(GROUND_COLOR[t] || C.grass)
      const y = tileHeight(t, x, z)

      if (t === 2) {
        // Water tiles collected separately
        wVerts.push(x,-0.25,z, x+1,-0.25,z, x+1,-0.25,z+1, x,-0.25,z, x+1,-0.25,z+1, x,-0.25,z+1)
        // Still add ground below water (dark)
        const dc = new THREE.Color(0x1a3a1a)
        verts.push(x,-0.4,z, x+1,-0.4,z, x+1,-0.4,z+1, x,-0.4,z, x+1,-0.4,z+1, x,-0.4,z+1)
        for (let i = 0; i < 6; i++) cols.push(dc.r, dc.g, dc.b)
        continue
      }

      verts.push(x,y,z, x+1,y,z, x+1,y,z+1, x,y,z, x+1,y,z+1, x,y,z+1)
      for (let i = 0; i < 6; i++) cols.push(color.r, color.g, color.b)
    }
  }

  // Ground mesh
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  geo.computeVertexNormals()
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.9, metalness: 0.0,
  }))
  ground.receiveShadow = true
  scene.add(ground)

  // Water mesh
  let water = null
  if (wVerts.length > 0) {
    const wg = new THREE.BufferGeometry()
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wVerts, 3))
    wg.computeVertexNormals()
    water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({
      color: C.water, transparent: true, opacity: 0.7,
      roughness: 0.1, metalness: 0.3,
    }))
    water.receiveShadow = true
    scene.add(water)
  }

  return { ground, water }
}

// ==================== TREES ====================
export function buildTrees(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 3) positions.push([x + 0.5, z + 0.5])

  if (!positions.length) return

  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.1, 0.6, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ color: C.trunk, roughness: 0.9 })
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, positions.length)

  const canopyGeo = new THREE.SphereGeometry(0.38, 7, 5)
  const canopyMat = new THREE.MeshStandardMaterial({ color: C.foliage, roughness: 0.8 })
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, positions.length)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()

  positions.forEach(([x, z], i) => {
    const s = 0.8 + (Math.sin(x * 3.7 + z * 2.1) * 0.5 + 0.5) * 0.5
    m.compose(new THREE.Vector3(x, 0.3 * s, z), q, new THREE.Vector3(s, s, s))
    trunks.setMatrixAt(i, m)
    const foliageColor = (i % 3 === 0) ? C.foliage2 : C.foliage
    canopies.setColorAt(i, new THREE.Color(foliageColor))
    m.compose(new THREE.Vector3(x, 0.65 * s, z), q, new THREE.Vector3(s, s * 0.9, s))
    canopies.setMatrixAt(i, m)
  })

  trunks.castShadow = true
  canopies.castShadow = true
  canopies.instanceColor.needsUpdate = true
  scene.add(trunks)
  scene.add(canopies)
}

// ==================== MOUNTAINS ====================
export function buildMountains(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 5) positions.push([x + 0.5, z + 0.5])

  if (!positions.length) return

  const geo = new THREE.BoxGeometry(1, 1.5, 1)
  const mat = new THREE.MeshStandardMaterial({ color: C.mountain, roughness: 0.85 })
  const mesh = new THREE.InstancedMesh(geo, mat, positions.length)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()

  positions.forEach(([x, z], i) => {
    const h = 0.8 + (Math.sin(x * 2.3 + z * 1.7) * 0.5 + 0.5) * 0.8
    m.compose(new THREE.Vector3(x, h * 0.5, z), q, new THREE.Vector3(1, h, 1))
    mesh.setMatrixAt(i, m)
    const shade = 0.6 + Math.sin(x + z) * 0.15
    mesh.setColorAt(i, new THREE.Color(shade, shade, shade + 0.05))
  })

  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.instanceColor.needsUpdate = true
  scene.add(mesh)
}

// ==================== FLOWERS ====================
export function buildFlowers(scene, map) {
  const positions = []
  const flowerColors = [C.flower1, C.flower2, C.flower3]
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 6) positions.push([x + 0.3 + Math.sin(x*5)*0.3, z + 0.3 + Math.cos(z*5)*0.3, flowerColors[(x+z)%3]])

  if (!positions.length) return

  const geo = new THREE.SphereGeometry(0.08, 5, 4)
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.6 })
  const mesh = new THREE.InstancedMesh(geo, mat, positions.length)

  const m = new THREE.Matrix4()
  positions.forEach(([x, z, color], i) => {
    m.makeTranslation(x, 0.1, z)
    mesh.setMatrixAt(i, m)
    mesh.setColorAt(i, new THREE.Color(color))
  })
  mesh.instanceColor.needsUpdate = true
  scene.add(mesh)
}

// ==================== FENCES ====================
export function buildFences(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 8) positions.push([x + 0.5, z + 0.5])

  if (!positions.length) return

  const geo = new THREE.BoxGeometry(0.9, 0.5, 0.1)
  const mat = new THREE.MeshStandardMaterial({ color: C.fence, roughness: 0.9 })
  const mesh = new THREE.InstancedMesh(geo, mat, positions.length)

  const m = new THREE.Matrix4()
  positions.forEach(([x, z], i) => {
    m.makeTranslation(x, 0.25, z)
    mesh.setMatrixAt(i, m)
  })
  mesh.castShadow = true
  scene.add(mesh)
}

// ==================== BUILDINGS ====================
export function buildBuildings(scene, zones) {
  const buildings = []

  for (const zone of zones) {
    const group = new THREE.Group()
    const cx = zone.x + 0.5
    const cz = zone.y - 0.5

    // Walls
    const wallGeo = new THREE.BoxGeometry(4.2, 2.8, 4.2)
    const wallMat = new THREE.MeshStandardMaterial({ color: C.stone, roughness: 0.75 })
    const walls = new THREE.Mesh(wallGeo, wallMat)
    walls.position.set(cx, 1.4, cz)
    walls.castShadow = true
    walls.receiveShadow = true
    group.add(walls)

    // Darker base
    const baseGeo = new THREE.BoxGeometry(4.4, 0.3, 4.4)
    const baseMat = new THREE.MeshStandardMaterial({ color: C.stoneD, roughness: 0.9 })
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.set(cx, 0.15, cz)
    group.add(base)

    // Roof (pyramid)
    const roofColor = zone.region === 1 ? C.roofR1 : zone.region === 2 ? C.roofR2 : C.roofR3
    const roofGeo = new THREE.ConeGeometry(3.2, 2, 4)
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.set(cx, 3.8, cz)
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    group.add(roof)

    // Door
    const doorGeo = new THREE.BoxGeometry(0.9, 1.6, 0.15)
    const doorMat = new THREE.MeshStandardMaterial({ color: C.door })
    const door = new THREE.Mesh(doorGeo, doorMat)
    door.position.set(cx, 0.8, cz + 2.13)
    group.add(door)

    // Door frame (lighter stone)
    const frameGeo = new THREE.BoxGeometry(1.2, 1.9, 0.1)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0 })
    const frame = new THREE.Mesh(frameGeo, frameMat)
    frame.position.set(cx, 0.95, cz + 2.12)
    group.add(frame)

    // Windows (two side windows)
    const winGeo = new THREE.BoxGeometry(0.5, 0.5, 0.15)
    const winMat = new THREE.MeshStandardMaterial({ color: 0xBBDEFB, emissive: 0x1565C0, emissiveIntensity: 0.15 })
    const winL = new THREE.Mesh(winGeo, winMat)
    winL.position.set(cx - 1.2, 1.8, cz + 2.13)
    group.add(winL)
    const winR = new THREE.Mesh(winGeo, winMat)
    winR.position.set(cx + 1.2, 1.8, cz + 2.13)
    group.add(winR)

    scene.add(group)
    buildings.push({ group, zone })
  }

  return buildings
}

// ==================== CHARACTER MODEL ====================
export function createCharacter(bodyColor, headColor, scale = 1) {
  const group = new THREE.Group()

  // Body (capsule)
  const bodyGeo = new THREE.CapsuleGeometry(0.18 * scale, 0.35 * scale, 4, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.4 * scale
  body.castShadow = true
  group.add(body)

  // Head
  const headGeo = new THREE.SphereGeometry(0.16 * scale, 8, 6)
  const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.6 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 0.78 * scale
  head.castShadow = true
  group.add(head)

  // Eyes (two small dark spheres)
  const eyeGeo = new THREE.SphereGeometry(0.03 * scale, 4, 4)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
  eyeL.position.set(-0.06 * scale, 0.8 * scale, 0.14 * scale)
  group.add(eyeL)
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat)
  eyeR.position.set(0.06 * scale, 0.8 * scale, 0.14 * scale)
  group.add(eyeR)

  return group
}

// ==================== TEXT LABEL SPRITE ====================
export function createTextSprite(text, options = {}) {
  const {
    fontSize = 28,
    bgColor = 'rgba(10,10,25,0.85)',
    textColor = '#c7b777',
    borderColor = '#c7b777',
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  ctx.font = `bold ${fontSize}px monospace`
  const tw = ctx.measureText(text).width
  const pad = 14

  canvas.width = tw + pad * 2
  canvas.height = fontSize + pad * 2

  // Background
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(0, 0, canvas.width, canvas.height, 8)
  ctx.fill()

  // Border
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, 6)
  ctx.stroke()

  // Text
  ctx.font = `bold ${fontSize}px monospace`
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true })
  const sprite = new THREE.Sprite(material)
  const aspect = canvas.width / canvas.height
  sprite.scale.set(aspect * 1.8, 1.8, 1)

  return sprite
}

// ==================== BUILD FULL SCENE ====================
export function buildScene(scene, map, zones) {
  const { water } = buildTerrain(scene, map)
  buildTrees(scene, map)
  buildMountains(scene, map)
  buildFlowers(scene, map)
  buildFences(scene, map)
  const buildings = buildBuildings(scene, zones)

  // Zone labels (floating above buildings)
  const labels = zones.map(zone => {
    const label = createTextSprite(zone.name)
    label.position.set(zone.x + 0.5, 5.5, zone.y - 0.5)
    scene.add(label)
    return label
  })

  return { water, buildings, labels }
}
