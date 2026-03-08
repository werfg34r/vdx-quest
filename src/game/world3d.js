// 3D World Builder for VDX Quest - Enhanced with procedural details
import * as THREE from 'three'

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

// ==================== TREES (mixed types) ====================
export function buildTrees(scene, map) {
  const treePos = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 3) treePos.push([x + 0.5, z + 0.5])

  if (!treePos.length) return

  // Deciduous trees (round canopy)
  const trunkGeo = new THREE.CylinderGeometry(0.05, 0.1, 0.6, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ color: C.trunk, roughness: 0.95 })

  const canopyGeo = new THREE.IcosahedronGeometry(0.4, 1)
  const canopyMat = new THREE.MeshStandardMaterial({ color: C.foliage, roughness: 0.85, flatShading: true })

  // Pine trees (cone)
  const pineGeo = new THREE.ConeGeometry(0.35, 0.9, 6)
  const pineMat = new THREE.MeshStandardMaterial({ color: C.pine, roughness: 0.85, flatShading: true })

  const deciduous = treePos.filter((_, i) => i % 3 !== 0)
  const pines = treePos.filter((_, i) => i % 3 === 0)

  // Deciduous trees
  const dTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, deciduous.length)
  const dCanopies = new THREE.InstancedMesh(canopyGeo, canopyMat, deciduous.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()

  deciduous.forEach(([x, z], i) => {
    const s = 0.8 + (Math.sin(x * 3.7 + z * 2.1) * 0.5 + 0.5) * 0.6
    m.compose(new THREE.Vector3(x, 0.3 * s, z), q, new THREE.Vector3(s, s, s))
    dTrunks.setMatrixAt(i, m)
    const c = [C.foliage, C.foliage2, C.foliage3][i % 3]
    dCanopies.setColorAt(i, new THREE.Color(c))
    m.compose(new THREE.Vector3(x, 0.7 * s, z), q, new THREE.Vector3(s * 0.95, s * 0.85, s * 0.95))
    dCanopies.setMatrixAt(i, m)
  })

  dTrunks.castShadow = true
  dCanopies.castShadow = true
  if (dCanopies.instanceColor) dCanopies.instanceColor.needsUpdate = true
  scene.add(dTrunks)
  scene.add(dCanopies)

  // Pine trees
  if (pines.length) {
    const pTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, pines.length)
    const pCanopies = new THREE.InstancedMesh(pineGeo, pineMat, pines.length)

    pines.forEach(([x, z], i) => {
      const s = 0.9 + Math.sin(x * 5.1 + z * 3.3) * 0.3
      m.compose(new THREE.Vector3(x, 0.3 * s, z), q, new THREE.Vector3(s * 0.7, s, s * 0.7))
      pTrunks.setMatrixAt(i, m)
      const pc = i % 2 === 0 ? C.pine : C.foliage3
      pCanopies.setColorAt(i, new THREE.Color(pc))
      m.compose(new THREE.Vector3(x, 0.8 * s, z), q, new THREE.Vector3(s, s, s))
      pCanopies.setMatrixAt(i, m)
    })

    pTrunks.castShadow = true
    pCanopies.castShadow = true
    if (pCanopies.instanceColor) pCanopies.instanceColor.needsUpdate = true
    scene.add(pTrunks)
    scene.add(pCanopies)
  }
}

// ==================== MOUNTAINS (craggy rocks) ====================
export function buildMountains(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++)
      if (map[z][x] === 5) positions.push([x + 0.5, z + 0.5])

  if (!positions.length) return

  // Use dodecahedron for more organic rock shape
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
    const rotY = Math.sin(x * 3 + z * 5) * 0.5
    euler.set(0, rotY, 0)
    q.setFromEuler(euler)
    m.compose(new THREE.Vector3(x, h * 0.4, z), q, new THREE.Vector3(0.8, h, 0.8))
    mesh.setMatrixAt(i, m)
    // Snow on tall mountains
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

// ==================== BUILDINGS (enhanced) ====================
export function buildBuildings(scene, zones) {
  const buildings = []

  for (const zone of zones) {
    const group = new THREE.Group()
    const cx = zone.x + 0.5
    const cz = zone.y - 0.5

    // Stone base
    const baseGeo = new THREE.BoxGeometry(4.6, 0.4, 4.6)
    const baseMat = new THREE.MeshStandardMaterial({ color: C.stoneD, roughness: 0.95 })
    const base = new THREE.Mesh(baseGeo, baseMat)
    base.position.set(cx, 0.2, cz)
    base.receiveShadow = true
    group.add(base)

    // Main walls
    const wallGeo = new THREE.BoxGeometry(4, 3, 4)
    const wallMat = new THREE.MeshStandardMaterial({ color: C.stone, roughness: 0.8 })
    const walls = new THREE.Mesh(wallGeo, wallMat)
    walls.position.set(cx, 1.9, cz)
    walls.castShadow = true
    walls.receiveShadow = true
    group.add(walls)

    // Timber frame details (cross beams)
    const beamMat = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.9 })
    const hBeamGeo = new THREE.BoxGeometry(4.1, 0.12, 0.12)
    const vBeamGeo = new THREE.BoxGeometry(0.12, 3.1, 0.12)
    for (const bz of [cz + 2.01, cz - 2.01]) {
      // Horizontal beams
      const hb1 = new THREE.Mesh(hBeamGeo, beamMat)
      hb1.position.set(cx, 1.2, bz)
      group.add(hb1)
      const hb2 = new THREE.Mesh(hBeamGeo, beamMat)
      hb2.position.set(cx, 2.5, bz)
      group.add(hb2)
      // Vertical beams
      for (const bx of [cx - 1.5, cx, cx + 1.5]) {
        const vb = new THREE.Mesh(vBeamGeo, beamMat)
        vb.position.set(bx, 1.9, bz)
        group.add(vb)
      }
    }

    // Roof (pyramid)
    const roofColor = zone.region === 1 ? C.roofR1 : zone.region === 2 ? C.roofR2 : C.roofR3
    const roofGeo = new THREE.ConeGeometry(3.3, 2.2, 4)
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.75, flatShading: true })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.set(cx, 4.5, cz)
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    group.add(roof)

    // Roof overhang (slightly larger flat ring)
    const overhangGeo = new THREE.BoxGeometry(4.6, 0.12, 4.6)
    const overhangMat = new THREE.MeshStandardMaterial({ color: C.woodDark || C.wood })
    const overhang = new THREE.Mesh(overhangGeo, overhangMat)
    overhang.position.set(cx, 3.4, cz)
    group.add(overhang)

    // Door (arched)
    const doorGeo = new THREE.BoxGeometry(0.85, 1.7, 0.15)
    const doorMat = new THREE.MeshStandardMaterial({ color: C.door })
    const door = new THREE.Mesh(doorGeo, doorMat)
    door.position.set(cx, 1.25, cz + 2.04)
    group.add(door)

    // Door arch
    const archGeo = new THREE.TorusGeometry(0.43, 0.08, 6, 8, Math.PI)
    const archMat = new THREE.MeshStandardMaterial({ color: C.stoneDark })
    const arch = new THREE.Mesh(archGeo, archMat)
    arch.position.set(cx, 2.1, cz + 2.03)
    arch.rotation.x = -Math.PI / 2
    arch.rotation.z = Math.PI
    group.add(arch)

    // Windows (with glow)
    const winGeo = new THREE.BoxGeometry(0.5, 0.55, 0.15)
    const winMat = new THREE.MeshStandardMaterial({
      color: 0xFFE0A0, emissive: 0xFFAA33, emissiveIntensity: 0.4,
    })
    for (const dx of [-1.2, 1.2]) {
      const win = new THREE.Mesh(winGeo, winMat)
      win.position.set(cx + dx, 2.0, cz + 2.04)
      group.add(win)
      // Window frame
      const frameMat = new THREE.MeshStandardMaterial({ color: C.wood })
      const fh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.16), frameMat)
      fh.position.set(cx + dx, 2.0, cz + 2.05)
      group.add(fh)
      const fv = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.16), frameMat)
      fv.position.set(cx + dx, 2.0, cz + 2.05)
      group.add(fv)
    }

    // Chimney
    const chimGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4)
    const chimMat = new THREE.MeshStandardMaterial({ color: C.stoneD })
    const chimney = new THREE.Mesh(chimGeo, chimMat)
    chimney.position.set(cx + 1.2, 4.5, cz - 0.8)
    chimney.castShadow = true
    group.add(chimney)

    // Window point light (warm glow)
    const light = new THREE.PointLight(0xFFAA33, 0.6, 5)
    light.position.set(cx, 2.0, cz + 2.5)
    group.add(light)

    scene.add(group)
    buildings.push({ group, zone })
  }

  return buildings
}

// ==================== DECORATIVE ROCKS ====================
export function buildRocks(scene, map) {
  const positions = []
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[0].length; x++) {
      const t = map[z][x]
      // Scatter rocks near paths and sand
      if ((t === 1 || t === 10) && Math.sin(x * 13.7 + z * 7.3) > 0.85) {
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

// ==================== BUILD FULL SCENE ====================
export function buildScene(scene, map, zones) {
  const { water } = buildTerrain(scene, map)
  buildGrassBlades(scene, map)
  buildTrees(scene, map)
  buildMountains(scene, map)
  buildFlowers(scene, map)
  buildFences(scene, map)
  buildRocks(scene, map)
  const buildings = buildBuildings(scene, zones)
  const particles = createParticles(scene)

  // Zone labels
  const labels = zones.map(zone => {
    const label = createTextSprite(zone.name)
    label.position.set(zone.x + 0.5, 6, zone.y - 0.5)
    scene.add(label)
    return label
  })

  return { water, buildings, labels, particles }
}
