// 3D World Builder for VDX Quest - Enhanced with GLTF models
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
  11: C.path, 12: C.path, 13: C.path, 14: C.path,
  17: C.tallGrass, 20: C.path, 21: C.path, 22: C.path, 23: C.path,
}

function tileHeight(t, x, z) {
  if (t === 2) return -0.35
  if (t === 1) return -0.03
  if (t === 10) return -0.05
  if (t === 7) return 0.06
  if ([11,12,13,14,20,21,22,23].includes(t)) return -0.03
  // Gentle terrain noise
  return Math.sin(x * 1.7 + z * 0.3) * Math.cos(z * 1.3 + x * 0.5) * 0.05
}

// ==================== TERRAIN ====================
export function buildTerrain(scene, map) {
  const ROWS = map.length, COLS = map[0].length
  const verts = [], cols = [], uvs = []
  const wVerts = [], wUvs = []

  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[z][x]
      const baseColor = new THREE.Color(GROUND_COLOR[t] || C.grass)
      // Subtle color variation per tile
      const variation = (Math.sin(x * 7.3 + z * 11.1) * 0.03)
      const color = baseColor.clone()
      color.r = Math.max(0, Math.min(1, color.r + variation))
      color.g = Math.max(0, Math.min(1, color.g + variation * 0.5))
      color.b = Math.max(0, Math.min(1, color.b + variation))
      const y = tileHeight(t, x, z)

      if (t === 2) {
        wVerts.push(x,-0.2,z, x+1,-0.2,z, x+1,-0.2,z+1, x,-0.2,z, x+1,-0.2,z+1, x,-0.2,z+1)
        for (let i = 0; i < 6; i++) wUvs.push(x/COLS, z/ROWS)
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

  // Water with custom shader material for better look
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
      transmission: 0.3,
      thickness: 0.5,
    }))
    water.receiveShadow = true
    scene.add(water)
  }

  return { ground, water }
}

// ==================== GRASS BLADES (3D details on grass) ====================
export function buildGrassBlades(scene, map) {
  const bladeGeo = new THREE.BufferGeometry()
  // Triangular blade shape
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
        // 3-5 blades per grass tile
        const count = t === 17 ? 5 : 3
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

// Building model assignments per zone index
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

// ==================== TREES (GLTF models) ====================
export async function buildTrees(scene, map) {
  const treePos = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 3) treePos.push([x + 0.5, z + 0.5])

  if (!treePos.length) return

  // Load both tree models
  let treeA, treeB
  try {
    [treeA, treeB] = await Promise.all([
      loadModel('/assets/models/nature/tree_single_A.gltf'),
      loadModel('/assets/models/nature/tree_single_B.gltf'),
    ])
  } catch {
    // Fallback to procedural if models fail
    buildTreesFallback(scene, treePos)
    return
  }

  treePos.forEach(([x, z], i) => {
    const template = i % 3 === 0 ? treeB : treeA
    const tree = template.clone()
    const s = 1.8 + Math.sin(x * 3.7 + z * 2.1) * 0.6
    tree.scale.set(s, s, s)
    tree.position.set(x, 0, z)
    tree.rotation.y = Math.sin(x * 5 + z * 7) * Math.PI
    tree.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(tree)
  })
}

function buildTreesFallback(scene, treePos) {
  const trunkGeo = new THREE.CylinderGeometry(0.05, 0.1, 0.6, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ color: C.trunk, roughness: 0.95 })
  const canopyGeo = new THREE.IcosahedronGeometry(0.4, 1)
  const canopyMat = new THREE.MeshStandardMaterial({ color: C.foliage, roughness: 0.85, flatShading: true })

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePos.length)
  const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treePos.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()

  treePos.forEach(([x, z], i) => {
    const s = 0.8 + (Math.sin(x * 3.7 + z * 2.1) * 0.5 + 0.5) * 0.6
    m.compose(new THREE.Vector3(x, 0.3 * s, z), q, new THREE.Vector3(s, s, s))
    trunks.setMatrixAt(i, m)
    canopies.setColorAt(i, new THREE.Color([C.foliage, C.foliage2, C.foliage3][i % 3]))
    m.compose(new THREE.Vector3(x, 0.7 * s, z), q, new THREE.Vector3(s * 0.95, s * 0.85, s * 0.95))
    canopies.setMatrixAt(i, m)
  })

  trunks.castShadow = true
  canopies.castShadow = true
  if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true
  scene.add(trunks)
  scene.add(canopies)
}

// ==================== MOUNTAINS (GLTF + fallback) ====================
export async function buildMountains(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 5) positions.push([x + 0.5, z + 0.5])

  if (!positions.length) return

  let mountainModel
  try {
    mountainModel = await loadModel('/assets/models/nature/mountain_A_grass_trees.gltf')
  } catch {
    // Fallback to procedural
  }

  if (mountainModel) {
    // Group adjacent mountain tiles and place one model per cluster center
    const visited = new Set()
    const clusters = []
    for (const [x, z] of positions) {
      const key = `${x},${z}`
      if (visited.has(key)) continue
      visited.add(key)
      clusters.push([x, z])
    }

    // Place mountain model every few tiles to avoid too many instances
    clusters.filter((_, i) => i % 4 === 0).forEach(([x, z], i) => {
      const mt = mountainModel.clone()
      const s = 3.0 + Math.sin(x * 2.3 + z * 1.7) * 1.0
      mt.scale.set(s, s * 1.2, s)
      mt.position.set(x, -0.2, z)
      mt.rotation.y = Math.sin(x * 3 + z * 5) * Math.PI
      mt.traverse(child => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true }
      })
      scene.add(mt)
    })

    // Fill remaining with rocks
    let rockModels
    try {
      const [rA, rB, rC] = await Promise.all([
        loadModel('/assets/models/nature/rock_single_A.gltf'),
        loadModel('/assets/models/nature/rock_single_B.gltf'),
        loadModel('/assets/models/nature/rock_single_C.gltf'),
      ])
      rockModels = [rA, rB, rC]
    } catch { /* ignore */ }

    if (rockModels) {
      clusters.filter((_, i) => i % 4 !== 0).forEach(([x, z], i) => {
        const template = rockModels[i % 3]
        const rock = template.clone()
        const s = 4.0 + Math.sin(x * 5 + z * 3) * 1.5
        rock.scale.set(s, s * 1.5, s)
        rock.position.set(x, 0, z)
        rock.rotation.y = Math.sin(x * 7 + z * 3) * Math.PI
        rock.traverse(child => {
          if (child.isMesh) { child.castShadow = true; child.receiveShadow = true }
        })
        scene.add(rock)
      })
    }
    return
  }

  // Procedural fallback
  const rockGeo = new THREE.DodecahedronGeometry(0.6, 0)
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

// ==================== FLOWERS (stem + petals) ====================
export function buildFlowers(scene, map) {
  const positions = []
  const flowerColors = [C.flower1, C.flower2, C.flower3, C.flower4]
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 6) {
        // Multiple flowers per tile
        for (let f = 0; f < 3; f++) {
          const fx = x + 0.2 + Math.sin(x*7+z*3+f*4) * 0.3
          const fz = z + 0.2 + Math.cos(x*3+z*7+f*4) * 0.3
          positions.push([fx, fz, flowerColors[(x+z+f) % 4]])
        }
      }

  if (!positions.length) return

  // Flower head (small sphere)
  const headGeo = new THREE.SphereGeometry(0.06, 5, 4)
  const headMat = new THREE.MeshStandardMaterial({ roughness: 0.5 })
  const heads = new THREE.InstancedMesh(headGeo, headMat, positions.length)

  // Stem (thin cylinder)
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

  // Fence post + rail
  const postGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 5)
  const railGeo = new THREE.BoxGeometry(0.9, 0.06, 0.04)
  const fenceMat = new THREE.MeshStandardMaterial({ color: C.fence, roughness: 0.9 })

  const posts = new THREE.InstancedMesh(postGeo, fenceMat, positions.length * 2)
  const rails = new THREE.InstancedMesh(railGeo, fenceMat, positions.length * 2)

  const m = new THREE.Matrix4()
  positions.forEach(([x, z], i) => {
    // Two posts per fence segment
    m.makeTranslation(x - 0.35, 0.3, z)
    posts.setMatrixAt(i * 2, m)
    m.makeTranslation(x + 0.35, 0.3, z)
    posts.setMatrixAt(i * 2 + 1, m)
    // Two rails
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

// ==================== BUILDINGS (GLTF models) ====================
export async function buildBuildings(scene, zones) {
  const buildings = []

  // Try to load all building models
  const modelNames = [...new Set(BUILDING_MODELS)]
  const loadedModels = {}

  try {
    const results = await Promise.all(
      modelNames.map(name =>
        loadModel(`/assets/models/buildings/${name}.gltf`)
          .catch(() => null)
      )
    )
    modelNames.forEach((name, i) => {
      if (results[i]) loadedModels[name] = results[i]
    })
  } catch { /* continue with whatever loaded */ }

  // Also try loading decoration models
  let torchModel = null
  let barrelModel = null
  try {
    [torchModel, barrelModel] = await Promise.all([
      loadModel('/assets/models/buildings/torch_lit.glb').catch(() => null),
      loadModel('/assets/models/buildings/barrel_large.glb').catch(() => null),
    ])
  } catch { /* ignore */ }

  for (let zi = 0; zi < zones.length; zi++) {
    const zone = zones[zi]
    const group = new THREE.Group()
    const cx = zone.x + 0.5
    const cz = zone.y - 0.5

    const modelName = BUILDING_MODELS[zi % BUILDING_MODELS.length]
    const template = loadedModels[modelName]

    if (template) {
      // Use GLTF model
      const building = template.clone()
      // Scale model to fit ~4 tile width (models are ~0.8-1.4 units)
      const s = 3.8
      building.scale.set(s, s, s)
      building.position.set(cx, 0, cz)
      // Face the building toward the player path (front facing +Z)
      building.rotation.y = Math.PI
      building.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      group.add(building)

      // Add decorations around the building
      if (torchModel) {
        for (const dx of [-2.2, 2.2]) {
          const torch = torchModel.clone()
          torch.scale.set(2.5, 2.5, 2.5)
          torch.position.set(cx + dx, 0, cz + 2.2)
          torch.traverse(child => { if (child.isMesh) child.castShadow = true })
          group.add(torch)

          // Torch light
          const tLight = new THREE.PointLight(0xFF8833, 0.5, 4)
          tLight.position.set(cx + dx, 1.8, cz + 2.3)
          group.add(tLight)
        }
      }

      if (barrelModel && zi % 3 === 0) {
        for (let bi = 0; bi < 2; bi++) {
          const barrel = barrelModel.clone()
          barrel.scale.set(2.0, 2.0, 2.0)
          barrel.position.set(cx + 2.5, 0, cz - 1 + bi * 0.8)
          barrel.rotation.y = Math.sin(zi + bi) * 0.5
          barrel.traverse(child => { if (child.isMesh) child.castShadow = true })
          group.add(barrel)
        }
      }
    } else {
      // Fallback to procedural building
      buildProceduralBuilding(group, cx, cz, zone)
    }

    // Window point light (warm glow) - always add for ambiance
    const light = new THREE.PointLight(0xFFAA33, 0.6, 5)
    light.position.set(cx, 2.0, cz + 2.5)
    group.add(light)

    scene.add(group)
    buildings.push({ group, zone })
  }

  return buildings
}

function buildProceduralBuilding(group, cx, cz, zone) {
  const baseGeo = new THREE.BoxGeometry(4.6, 0.4, 4.6)
  const baseMat = new THREE.MeshStandardMaterial({ color: C.stoneD, roughness: 0.95 })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.set(cx, 0.2, cz)
  base.receiveShadow = true
  group.add(base)

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

// ==================== DECORATIVE ROCKS (GLTF) ====================
export async function buildRocks(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++) {
      const t = map[z][x]
      if ((t === 1 || t === 10) && Math.sin(x * 13.7 + z * 7.3) > 0.85) {
        positions.push([x + 0.3 + Math.sin(x*5)*0.4, z + 0.3 + Math.cos(z*5)*0.4])
      }
    }

  if (!positions.length) return

  let rockModels
  try {
    const [rA, rB, rC] = await Promise.all([
      loadModel('/assets/models/nature/rock_single_A.gltf'),
      loadModel('/assets/models/nature/rock_single_B.gltf'),
      loadModel('/assets/models/nature/rock_single_C.gltf'),
    ])
    rockModels = [rA, rB, rC]
  } catch { /* fallback */ }

  if (rockModels) {
    positions.forEach(([x, z], i) => {
      const template = rockModels[i % 3]
      const rock = template.clone()
      const s = 2.0 + Math.sin(x * 11 + z * 7) * 1.0
      rock.scale.set(s, s * 0.8, s)
      rock.position.set(x, 0, z)
      rock.rotation.y = Math.sin(x * 7 + z * 3) * Math.PI
      rock.traverse(child => {
        if (child.isMesh) child.receiveShadow = true
      })
      scene.add(rock)
    })
    return
  }

  // Procedural fallback
  const geo = new THREE.DodecahedronGeometry(0.08, 0)
  const mat = new THREE.MeshStandardMaterial({ color: 0x888580, roughness: 0.95, flatShading: true })
  const mesh = new THREE.InstancedMesh(geo, mat, positions.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const euler = new THREE.Euler()
  positions.forEach(([x, z], i) => {
    const s = 0.5 + Math.sin(x * 11 + z * 7) * 0.4
    euler.set(Math.sin(x*3)*0.5, Math.sin(z*5)*1, 0)
    q.setFromEuler(euler)
    m.compose(new THREE.Vector3(x, 0.04 * s, z), q, new THREE.Vector3(s, s * 0.7, s))
    mesh.setMatrixAt(i, m)
  })
  scene.add(mesh)
}

// ==================== CHARACTER MODEL ====================
export function createCharacter(bodyColor, headColor, scale = 1) {
  const group = new THREE.Group()

  // Body
  const bodyGeo = new THREE.CapsuleGeometry(0.18 * scale, 0.35 * scale, 4, 8)
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.65 })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.4 * scale
  body.castShadow = true
  group.add(body)

  // Head
  const headGeo = new THREE.SphereGeometry(0.16 * scale, 8, 6)
  const headMat = new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.55 })
  const head = new THREE.Mesh(headGeo, headMat)
  head.position.y = 0.78 * scale
  head.castShadow = true
  group.add(head)

  // Eyes
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

// ==================== PARTICLES (atmospheric) ====================
export function createParticles(scene) {
  const count = 200
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

// ==================== CLOUDS (GLTF) ====================
async function buildClouds(scene) {
  let cloudModel
  try {
    cloudModel = await loadModel('/assets/models/nature/cloud_big.gltf')
  } catch { return [] }

  const clouds = []
  for (let i = 0; i < 8; i++) {
    const cloud = cloudModel.clone()
    const s = 2.5 + Math.sin(i * 7.3) * 1.5
    cloud.scale.set(s, s * 0.6, s)
    cloud.position.set(
      Math.sin(i * 4.7) * 25 + 25,
      12 + Math.sin(i * 2.3) * 3,
      Math.cos(i * 3.1) * 20 + 20
    )
    cloud.rotation.y = Math.sin(i * 5.1) * Math.PI
    // Make clouds semi-transparent white
    cloud.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7,
          roughness: 1.0,
        })
      }
    })
    scene.add(cloud)
    clouds.push(cloud)
  }
  return clouds
}

// ==================== BUILD FULL SCENE ====================
export async function buildScene(scene, map, zones) {
  // Build synchronous elements first (terrain appears immediately)
  const { water } = buildTerrain(scene, map)
  buildGrassBlades(scene, map)
  buildFlowers(scene, map)
  buildFences(scene, map)
  const particles = createParticles(scene)

  // Zone labels
  const labels = zones.map(zone => {
    const label = createTextSprite(zone.name)
    label.position.set(zone.x + 0.5, 6, zone.y - 0.5)
    scene.add(label)
    return label
  })

  // Load GLTF models in parallel
  const [buildings, , , , clouds] = await Promise.all([
    buildBuildings(scene, zones),
    buildTrees(scene, map),
    buildMountains(scene, map),
    buildRocks(scene, map),
    buildClouds(scene),
  ])

  return { water, buildings, labels, particles, clouds }
}
