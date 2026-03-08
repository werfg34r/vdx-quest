// 3D World Builder for VDX Quest - Optimized with GLTF buildings
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// ==================== COLOR PALETTE ====================
const C = {
  grass:     0x5BB55F,
  darkGrass: 0x3D8B40,
  tallGrass: 0x72C976,
  path:      0x9B7B5B,
  water:     0x3B9BD9,
  waterDeep: 0x1A6FA0,
  sand:      0xE8D5A3,
  mountain:  0x7A8B96,
  mountainSnow: 0xD8E0E8,
  trunk:     0x6B4226,
  foliage:   0x2D7D32,
  foliage2:  0x4AA050,
  foliage3:  0x1B5E20,
  pine:      0x1B5E20,
  stone:     0xC8C0B8,
  stoneD:    0xA09890,
  stoneDark: 0x686058,
  wood:      0x8B6E4E,
  woodDark:  0x5B3E1E,
  door:      0x5B3E1E,
  fence:     0x8B6848,
  flower1:   0xE8406A,
  flower2:   0xF5D742,
  flower3:   0xAA44CC,
  flower4:   0xFF8855,
  roofR1:    0xA06040,
  roofR2:    0x2B6AAA,
  roofR3:    0x993333,
}

const GROUND_COLOR = {
  0: C.grass, 1: C.path, 2: C.water, 3: C.grass, 5: C.mountain,
  6: C.grass, 7: C.path, 8: C.grass, 9: C.darkGrass, 10: C.sand,
  11: C.grass, 12: C.grass, 13: C.grass, 14: C.grass,
  17: C.tallGrass, 20: C.grass, 21: C.grass, 22: C.grass, 23: C.grass,
}

function tileHeight(t, x, z) {
  if (t === 2) return -0.35
  if (t === 1) return -0.03
  if (t === 10) return -0.05
  if (t === 7) return 0.06
  return Math.sin(x * 1.7 + z * 0.3) * Math.cos(z * 1.3 + x * 0.5) * 0.05
}

// ==================== GLTF MODEL CACHE ====================
const modelCache = {}
const loader = new GLTFLoader()

function loadModel(path) {
  if (modelCache[path]) return modelCache[path]
  modelCache[path] = new Promise((resolve, reject) => {
    loader.load(path, gltf => resolve(gltf.scene), undefined, reject)
  })
  return modelCache[path]
}

const BUILDING_MODELS = [
  'building_tavern_blue',
  'building_home_A_blue',
  'building_church_blue',
  'building_blacksmith_blue',
  'building_castle_blue',
  'building_market_blue',
  'building_tower_A_blue',
  'building_home_A_blue',
  'building_tavern_blue',
  'building_castle_blue',
  'building_church_blue',
  'building_blacksmith_blue',
]

// ==================== TERRAIN ====================
export function buildTerrain(scene, map) {
  const ROWS = map.length, COLS = map[0].length
  const verts = [], cols = []
  const wVerts = []

  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[z][x]
      const baseColor = new THREE.Color(GROUND_COLOR[t] || C.grass)
      const variation = Math.sin(x * 7.3 + z * 11.1) * 0.03
      const color = baseColor.clone()
      color.r = Math.max(0, Math.min(1, color.r + variation))
      color.g = Math.max(0, Math.min(1, color.g + variation * 0.5))
      color.b = Math.max(0, Math.min(1, color.b + variation))
      const y = tileHeight(t, x, z)

      if (t === 2) {
        wVerts.push(x,-0.2,z, x+1,-0.2,z, x+1,-0.2,z+1, x,-0.2,z, x+1,-0.2,z+1, x,-0.2,z+1)
        // River bed underneath
        const dc = new THREE.Color(0x1a3a2a)
        verts.push(x,-0.4,z, x+1,-0.4,z, x+1,-0.4,z+1, x,-0.4,z, x+1,-0.4,z+1, x,-0.4,z+1)
        for (let i = 0; i < 6; i++) cols.push(dc.r, dc.g, dc.b)
        continue
      }

      verts.push(x,y,z, x+1,y,z, x+1,y,z+1, x,y,z, x+1,y,z+1, x,y,z+1)
      for (let i = 0; i < 6; i++) cols.push(color.r, color.g, color.b)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  geo.computeVertexNormals()
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.92, metalness: 0.0,
  }))
  ground.receiveShadow = true
  scene.add(ground)

  // Water
  let water = null
  if (wVerts.length > 0) {
    const wg = new THREE.BufferGeometry()
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wVerts, 3))
    wg.computeVertexNormals()
    water = new THREE.Mesh(wg, new THREE.MeshPhysicalMaterial({
      color: C.water,
      transparent: true,
      opacity: 0.65,
      roughness: 0.05,
      metalness: 0.1,
    }))
    water.receiveShadow = true
    scene.add(water)
  }

  return { ground, water }
}

// ==================== GRASS BLADES (InstancedMesh - fast) ====================
export function buildGrassBlades(scene, map) {
  const bladeGeo = new THREE.BufferGeometry()
  const bverts = new Float32Array([
    -0.02, 0, 0,  0.02, 0, 0,  0, 0.15, 0.01,
  ])
  bladeGeo.setAttribute('position', new THREE.BufferAttribute(bverts, 3))
  bladeGeo.computeVertexNormals()

  const positions = []
  for (let z = 0; z < map.length; z++) {
    for (let x = 0; x < map[0].length; x++) {
      const t = map[z][x]
      if (t === 0 || t === 9 || t === 17) {
        const count = t === 17 ? 3 : 2
        for (let i = 0; i < count; i++) {
          const bx = x + Math.sin(x * 7.1 + z * 3.3 + i * 5.7) * 0.4 + 0.5
          const bz = z + Math.cos(x * 4.3 + z * 8.1 + i * 2.3) * 0.4 + 0.5
          const h = t === 17 ? 0.18 : (t === 9 ? 0.1 : 0.12)
          positions.push([bx, bz, h, t])
        }
      }
    }
  }

  if (!positions.length) return

  const mat = new THREE.MeshStandardMaterial({
    color: C.grass, roughness: 0.8, side: THREE.DoubleSide,
  })
  const mesh = new THREE.InstancedMesh(bladeGeo, mat, positions.length)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const euler = new THREE.Euler()

  positions.forEach(([x, z, h, t], i) => {
    const rot = Math.sin(x * 11 + z * 7) * Math.PI
    const scale = 0.7 + Math.sin(x * 5 + z * 3 + i) * 0.3
    euler.set(0, rot, Math.sin(x * 3 + z * 5) * 0.3)
    q.setFromEuler(euler)
    m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(scale, h / 0.15 * scale, scale))
    mesh.setMatrixAt(i, m)
    const gc = t === 9 ? C.darkGrass : t === 17 ? C.tallGrass : C.grass
    const variation = Math.sin(x * 13 + z * 7 + i * 3) * 0.05
    const c = new THREE.Color(gc)
    c.r += variation; c.g += variation * 0.5
    mesh.setColorAt(i, c)
  })

  mesh.instanceColor.needsUpdate = true
  scene.add(mesh)
}

// ==================== TREES (InstancedMesh - fast) ====================
export function buildTrees(scene, map) {
  const treePos = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 3) treePos.push([x + 0.5, z + 0.5])

  if (!treePos.length) return

  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.12, 0.7, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ color: C.trunk, roughness: 0.95 })

  const canopyGeo = new THREE.IcosahedronGeometry(0.45, 1)
  const canopyMat = new THREE.MeshStandardMaterial({ color: C.foliage, roughness: 0.85, flatShading: true })

  const pineGeo = new THREE.ConeGeometry(0.35, 1.0, 6)
  const pineMat = new THREE.MeshStandardMaterial({ color: C.pine, roughness: 0.85, flatShading: true })

  const deciduous = treePos.filter((_, i) => i % 3 !== 0)
  const pines = treePos.filter((_, i) => i % 3 === 0)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()

  // Deciduous
  const dTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, deciduous.length)
  const dCanopies = new THREE.InstancedMesh(canopyGeo, canopyMat, deciduous.length)
  deciduous.forEach(([x, z], i) => {
    const s = 0.8 + (Math.sin(x * 3.7 + z * 2.1) * 0.5 + 0.5) * 0.6
    m.compose(new THREE.Vector3(x, 0.35 * s, z), q, new THREE.Vector3(s, s, s))
    dTrunks.setMatrixAt(i, m)
    dCanopies.setColorAt(i, new THREE.Color([C.foliage, C.foliage2, C.foliage3][i % 3]))
    m.compose(new THREE.Vector3(x, 0.75 * s, z), q, new THREE.Vector3(s, s * 0.85, s))
    dCanopies.setMatrixAt(i, m)
  })
  dTrunks.castShadow = true
  dCanopies.castShadow = true
  if (dCanopies.instanceColor) dCanopies.instanceColor.needsUpdate = true
  scene.add(dTrunks)
  scene.add(dCanopies)

  // Pines
  if (pines.length) {
    const pTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, pines.length)
    const pCanopies = new THREE.InstancedMesh(pineGeo, pineMat, pines.length)
    pines.forEach(([x, z], i) => {
      const s = 0.9 + Math.sin(x * 5.1 + z * 3.3) * 0.3
      m.compose(new THREE.Vector3(x, 0.35 * s, z), q, new THREE.Vector3(s * 0.7, s, s * 0.7))
      pTrunks.setMatrixAt(i, m)
      pCanopies.setColorAt(i, new THREE.Color(i % 2 === 0 ? C.pine : C.foliage3))
      m.compose(new THREE.Vector3(x, 0.85 * s, z), q, new THREE.Vector3(s, s, s))
      pCanopies.setMatrixAt(i, m)
    })
    pTrunks.castShadow = true
    pCanopies.castShadow = true
    if (pCanopies.instanceColor) pCanopies.instanceColor.needsUpdate = true
    scene.add(pTrunks)
    scene.add(pCanopies)
  }
}

// ==================== MOUNTAINS (InstancedMesh - fast) ====================
export function buildMountains(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 5) positions.push([x + 0.5, z + 0.5])

  if (!positions.length) return

  const rockGeo = new THREE.DodecahedronGeometry(0.6, 1)
  const rockMat = new THREE.MeshStandardMaterial({
    color: C.mountain, roughness: 0.9, flatShading: true,
  })
  const mesh = new THREE.InstancedMesh(rockGeo, rockMat, positions.length)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const euler = new THREE.Euler()

  positions.forEach(([x, z], i) => {
    const h = 0.6 + (Math.sin(x * 2.3 + z * 1.7) * 0.5 + 0.5) * 1.0
    euler.set(0, Math.sin(x * 3 + z * 5) * 0.5, 0)
    q.setFromEuler(euler)
    m.compose(new THREE.Vector3(x, h * 0.4, z), q, new THREE.Vector3(0.8, h, 0.8))
    mesh.setMatrixAt(i, m)
    const isSnowy = h > 1.2
    const shade = isSnowy ? 0.85 : (0.45 + Math.sin(x + z) * 0.1)
    mesh.setColorAt(i, new THREE.Color(shade, shade, shade + (isSnowy ? 0 : 0.03)))
  })

  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.instanceColor.needsUpdate = true
  scene.add(mesh)
}

// ==================== FLOWERS ====================
export function buildFlowers(scene, map) {
  const positions = []
  const flowerColors = [C.flower1, C.flower2, C.flower3, C.flower4]
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 6) {
        for (let f = 0; f < 3; f++) {
          const fx = x + 0.2 + Math.sin(x*7+z*3+f*4) * 0.3
          const fz = z + 0.2 + Math.cos(x*3+z*7+f*4) * 0.3
          positions.push([fx, fz, flowerColors[(x+z+f) % 4]])
        }
      }

  if (!positions.length) return

  const headGeo = new THREE.SphereGeometry(0.06, 5, 4)
  const headMat = new THREE.MeshStandardMaterial({ roughness: 0.5 })
  const heads = new THREE.InstancedMesh(headGeo, headMat, positions.length)

  const stemGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.12, 4)
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3D8B40 })
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, positions.length)

  const m = new THREE.Matrix4()
  positions.forEach(([x, z, color], i) => {
    const h = 0.06 + Math.sin(x * 9 + z * 7) * 0.02
    m.makeTranslation(x, h + 0.08, z)
    heads.setMatrixAt(i, m)
    heads.setColorAt(i, new THREE.Color(color))
    m.makeTranslation(x, h, z)
    stems.setMatrixAt(i, m)
  })
  heads.instanceColor.needsUpdate = true
  scene.add(heads)
  scene.add(stems)
}

// ==================== FENCES ====================
export function buildFences(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 8) positions.push([x + 0.5, z + 0.5])

  if (!positions.length) return

  const postGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 5)
  const railGeo = new THREE.BoxGeometry(0.9, 0.06, 0.04)
  const fenceMat = new THREE.MeshStandardMaterial({ color: C.fence, roughness: 0.9 })

  const posts = new THREE.InstancedMesh(postGeo, fenceMat, positions.length * 2)
  const rails = new THREE.InstancedMesh(railGeo, fenceMat, positions.length * 2)

  const m = new THREE.Matrix4()
  positions.forEach(([x, z], i) => {
    m.makeTranslation(x - 0.35, 0.3, z)
    posts.setMatrixAt(i * 2, m)
    m.makeTranslation(x + 0.35, 0.3, z)
    posts.setMatrixAt(i * 2 + 1, m)
    m.makeTranslation(x, 0.2, z)
    rails.setMatrixAt(i * 2, m)
    m.makeTranslation(x, 0.4, z)
    rails.setMatrixAt(i * 2 + 1, m)
  })
  posts.castShadow = true
  rails.castShadow = true
  scene.add(posts)
  scene.add(rails)
}

// ==================== DECORATIVE ROCKS (InstancedMesh) ====================
export function buildRocks(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++) {
      const t = map[z][x]
      if ((t === 1 || t === 10) && Math.sin(x * 13.7 + z * 7.3) > 0.9) {
        positions.push([x + 0.3 + Math.sin(x*5)*0.4, z + 0.3 + Math.cos(z*5)*0.4])
      }
    }

  if (!positions.length) return

  const geo = new THREE.DodecahedronGeometry(0.08, 0)
  const mat = new THREE.MeshStandardMaterial({ color: 0x888580, roughness: 0.95, flatShading: true })
  const mesh = new THREE.InstancedMesh(geo, mat, positions.length)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const euler = new THREE.Euler()
  positions.forEach(([x, z], i) => {
    const s = 0.5 + Math.sin(x * 11 + z * 7) * 0.3
    euler.set(Math.sin(x*3)*0.3, Math.sin(z*5)*1, 0)
    q.setFromEuler(euler)
    m.compose(new THREE.Vector3(x, 0.03 * s, z), q, new THREE.Vector3(s, s * 0.6, s))
    mesh.setMatrixAt(i, m)
  })
  scene.add(mesh)
}

// ==================== BUILDINGS (GLTF models - only 12, manageable) ====================
async function buildBuildings(scene, zones) {
  const buildings = []

  // Load all unique building models
  const modelNames = [...new Set(BUILDING_MODELS)]
  const loadedModels = {}

  try {
    const results = await Promise.all(
      modelNames.map(name =>
        loadModel(`/assets/models/buildings/${name}.gltf`).catch(() => null)
      )
    )
    modelNames.forEach((name, i) => {
      if (results[i]) loadedModels[name] = results[i]
    })
  } catch { /* continue */ }

  for (let zi = 0; zi < zones.length; zi++) {
    const zone = zones[zi]
    const group = new THREE.Group()
    const cx = zone.x + 0.5
    const cz = zone.y - 0.5

    const modelName = BUILDING_MODELS[zi % BUILDING_MODELS.length]
    const template = loadedModels[modelName]

    if (template) {
      const building = template.clone()
      const s = 4.0
      building.scale.set(s, s, s)
      building.position.set(cx, 0, cz)
      building.rotation.y = Math.PI
      building.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      group.add(building)
    } else {
      // Procedural fallback
      const wallGeo = new THREE.BoxGeometry(4, 3, 4)
      const wallMat = new THREE.MeshStandardMaterial({ color: C.stone, roughness: 0.8 })
      const walls = new THREE.Mesh(wallGeo, wallMat)
      walls.position.set(cx, 1.9, cz)
      walls.castShadow = true
      walls.receiveShadow = true
      group.add(walls)

      const roofColor = zone.region === 1 ? C.roofR1 : zone.region === 2 ? C.roofR2 : C.roofR3
      const roofGeo = new THREE.ConeGeometry(3.3, 2.2, 4)
      const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.75, flatShading: true })
      const roof = new THREE.Mesh(roofGeo, roofMat)
      roof.position.set(cx, 4.5, cz)
      roof.rotation.y = Math.PI / 4
      roof.castShadow = true
      group.add(roof)

      const doorGeo = new THREE.BoxGeometry(0.85, 1.7, 0.15)
      const doorMat = new THREE.MeshStandardMaterial({ color: C.door })
      const door = new THREE.Mesh(doorGeo, doorMat)
      door.position.set(cx, 1.25, cz + 2.04)
      group.add(door)
    }

    // Warm window glow light
    const light = new THREE.PointLight(0xFFAA33, 0.5, 4)
    light.position.set(cx, 2.0, cz + 2.5)
    group.add(light)

    scene.add(group)
    buildings.push({ group, zone })
  }

  return buildings
}

// ==================== CHARACTER MODEL ====================
export function createCharacter(bodyColor, headColor, scale = 1) {
  const group = new THREE.Group()

  const bodyGeo = new THREE.CapsuleGeometry(0.18 * scale, 0.35 * scale, 4, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.65 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.4 * scale
  body.castShadow = true
  group.add(body)

  const headGeo = new THREE.SphereGeometry(0.16 * scale, 8, 6)
  const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.55 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 0.78 * scale
  head.castShadow = true
  group.add(head)

  const eyeGeo = new THREE.SphereGeometry(0.03 * scale, 4, 4)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  for (const dx of [-0.06, 0.06]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat)
    eye.position.set(dx * scale, 0.8 * scale, 0.14 * scale)
    group.add(eye)
  }

  return group
}

// ==================== TEXT LABEL SPRITE ====================
export function createTextSprite(text, options = {}) {
  const {
    fontSize = 24,
    bgColor = 'rgba(10,10,25,0.88)',
    textColor = '#c7b777',
    borderColor = '#c7b777',
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `bold ${fontSize}px monospace`
  const tw = ctx.measureText(text).width
  const pad = 12
  canvas.width = tw + pad * 2
  canvas.height = fontSize + pad * 2

  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(0, 0, canvas.width, canvas.height, 6)
  ctx.fill()

  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(1, 1, canvas.width - 2, canvas.height - 2, 5)
  ctx.stroke()

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
  sprite.scale.set(aspect * 1.5, 1.5, 1)
  return sprite
}

// ==================== PARTICLES ====================
export function createParticles(scene) {
  const count = 80
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = Math.random() * 50
    positions[i * 3 + 1] = 0.5 + Math.random() * 4
    positions[i * 3 + 2] = Math.random() * 40
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const mat = new THREE.PointsMaterial({
    color: 0xFFFFCC,
    size: 0.08,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  const particles = new THREE.Points(geo, mat)
  scene.add(particles)
  return particles
}

// ==================== BUILD FULL SCENE ====================
export async function buildScene(scene, map, zones) {
  // Build all synchronous elements first (terrain appears immediately)
  const { water } = buildTerrain(scene, map)
  buildGrassBlades(scene, map)
  buildTrees(scene, map)
  buildMountains(scene, map)
  buildFlowers(scene, map)
  buildFences(scene, map)
  buildRocks(scene, map)
  const particles = createParticles(scene)

  // Zone labels
  const labels = zones.map(zone => {
    const label = createTextSprite(zone.name)
    label.position.set(zone.x + 0.5, 6, zone.y - 0.5)
    scene.add(label)
    return label
  })

  // Only buildings use GLTF (12 models = manageable draw calls)
  const buildings = await buildBuildings(scene, zones)

  return { water, buildings, labels, particles }
}
