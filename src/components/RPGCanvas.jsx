import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import {
  TILE, COLS, ROWS, ZONES, NPCS,
  generateMap, getAdjacentZone, getAdjacentNPC, canMove,
} from '../game/engine'
import { buildScene, createCharacter, createTextSprite } from '../game/world3d'
import { useGameState } from '../hooks/useGameState'

// Vignette shader
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 0.95 },
    darkness: { value: 1.2 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vignette = 1.0 - dot(uv, uv);
      texel.rgb *= smoothstep(0.0, 1.0, pow(vignette, darkness));
      gl_FragColor = texel;
    }
  `,
}

const MOVE_SPEED = 0.1
const TEXT_SPEED = 0.6
const CAM_OFFSET = new THREE.Vector3(0, 14, 12)

const NPC_BODY_COLORS = {
  mentor:   0x1565C0,
  villager: 0x7B1FA2,
  warrior:  0xC62828,
  sage:     0x00695C,
  old:      0x455A64,
  trader:   0xF57F17,
}

const INTRO_TEXTS = [
  { speaker: '', text: '...' },
  { speaker: '', text: 'Tu ouvres les yeux.' },
  { speaker: '', text: 'Devant toi, un monde s\'etend. Le Monde VDX.' },
  { speaker: '', text: 'Tu as decide de changer. De passer du reve a l\'action.' },
  { speaker: '', text: '90 jours. 12 epreuves. 3 regions.' },
  { speaker: '', text: 'Ton aventure commence maintenant.' },
]

export default function RPGCanvas({ onOpenZone }) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const { weekProgress } = useGameState()
  const wpRef = useRef(weekProgress)
  useEffect(() => { wpRef.current = weekProgress }, [weekProgress])

  const [promptText, setPromptText] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const dialogTextRef = useRef(null)
  const dialogSpeakerRef = useRef(null)
  const introTextRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let cancelled = false
    let animId

    // ==================== THREE.JS SETUP ====================
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xB8D8F0, 0.016)

    // Gradient sky (sphere with shader)
    const skyGeo = new THREE.SphereGeometry(100, 16, 12)
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x4488CC) },
        bottomColor: { value: new THREE.Color(0xC8E0F0) },
        horizonColor: { value: new THREE.Color(0xF0E8D0) },
        offset: { value: 10 },
        exponent: { value: 0.5 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          vec3 sky = mix(horizonColor, topColor, t);
          float b = max(pow(max(-h, 0.0), 0.8), 0.0);
          sky = mix(sky, bottomColor, b);
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    })
    scene.add(new THREE.Mesh(skyGeo, skyMat))

    const camera = new THREE.PerspectiveCamera(
      50, mount.clientWidth / mount.clientHeight, 0.1, 200
    )
    camera.position.set(8 + CAM_OFFSET.x, CAM_OFFSET.y, 38 + CAM_OFFSET.z)
    camera.lookAt(8, 0, 38)

    // ==================== POST-PROCESSING ====================
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.3,  // strength
      0.4,  // radius
      0.85  // threshold
    )
    composer.addPass(bloomPass)

    const vignettePass = new ShaderPass(VignetteShader)
    composer.addPass(vignettePass)

    // ==================== LIGHTING ====================
    const ambient = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambient)

    const hemi = new THREE.HemisphereLight(0x88BBDD, 0x446633, 0.4)
    scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xFFEECC, 1.0)
    sun.position.set(20, 30, 15)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -15
    sun.shadow.camera.right = 15
    sun.shadow.camera.top = 15
    sun.shadow.camera.bottom = -15
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 80
    sun.shadow.bias = -0.001
    scene.add(sun)
    scene.add(sun.target)

    // Subtle fill light from opposite side
    const fill = new THREE.DirectionalLight(0x8899BB, 0.3)
    fill.position.set(-15, 10, -10)
    scene.add(fill)

    // ==================== BUILD WORLD ====================
    const map = generateMap()
    let worldObjects = { water: null, buildings: null, labels: null, particles: null }

    // Player and NPCs are created immediately (sync)
    const playerMesh = createCharacter(0xE53935, 0xFFCC80)
    playerMesh.position.set(8 + 0.5, 0, 38 + 0.5)
    scene.add(playerMesh)

    const npcMeshes = NPCS.map(npc => {
      const bodyColor = NPC_BODY_COLORS[npc.sprite] || 0x666666
      const mesh = createCharacter(bodyColor, 0xFFCC80)
      mesh.position.set(npc.x + 0.5, 0, npc.y + 0.5)
      scene.add(mesh)

      const label = createTextSprite(npc.name, { fontSize: 22 })
      label.position.set(npc.x + 0.5, 1.5, npc.y + 0.5)
      scene.add(label)

      const excl = createTextSprite('!', {
        fontSize: 36, bgColor: 'rgba(199,183,119,0.95)', textColor: '#0a0a0f',
      })
      excl.position.set(npc.x + 0.5, 2.0, npc.y + 0.5)
      scene.add(excl)

      return { mesh, label, excl }
    })

    // Load GLTF models async (scene renders progressively)
    buildScene(scene, map, ZONES).then(objects => {
      worldObjects = objects
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load 3D models:', err)
      setLoading(false)
    })

    // ==================== GAME STATE ====================
    const game = {
      px: 8 + 0.5, pz: 38 + 0.5,
      tileX: 8, tileY: 38,
      targetTX: 8, targetTY: 38,
      direction: 'down',
      moving: false,
      keys: {},
      tick: 0,
      dialog: null,
      intro: true,
      introStep: 0,
      introCharIdx: 0,
    }
    gameRef.current = game

    // ==================== INPUT ====================
    function onKeyDown(e) {
      game.keys[e.key] = true
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleInteract()
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
    }
    function onKeyUp(e) { game.keys[e.key] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    function handleInteract() {
      // Intro
      if (game.intro) {
        if (game.introCharIdx < INTRO_TEXTS[game.introStep].text.length) {
          game.introCharIdx = INTRO_TEXTS[game.introStep].text.length
        } else {
          game.introStep++
          game.introCharIdx = 0
          if (game.introStep >= INTRO_TEXTS.length) {
            game.intro = false
            setShowIntro(false)
          }
        }
        return
      }
      // Dialog
      if (game.dialog) {
        const line = game.dialog.lines[game.dialog.lineIdx]
        if (game.dialog.charIdx < line.length) {
          game.dialog.charIdx = line.length
        } else {
          game.dialog.lineIdx++
          game.dialog.charIdx = 0
          if (game.dialog.lineIdx >= game.dialog.lines.length) {
            game.dialog = null
            setShowDialog(false)
          }
        }
        return
      }
      // Zone
      const zone = getAdjacentZone(game.tileX, game.tileY)
      if (zone) {
        const wp = wpRef.current
        if (wp[zone.id]?.unlocked) {
          onOpenZone(zone.id)
        } else {
          game.dialog = {
            speaker: '', lines: ['Cette epreuve est encore verrouillee. Complete la precedente d\'abord.'],
            lineIdx: 0, charIdx: 0,
          }
          setShowDialog(true)
        }
        return
      }
      // NPC
      const npc = getAdjacentNPC(game.tileX, game.tileY)
      if (npc) {
        game.dialog = { speaker: npc.name, lines: npc.dialog, lineIdx: 0, charIdx: 0 }
        setShowDialog(true)
      }
    }

    // ==================== CAMERA HELPERS ====================
    const camTarget = new THREE.Vector3()
    const desiredPos = new THREE.Vector3()
    const clock = new THREE.Clock()

    // ==================== GAME LOOP ====================
    function animate() {
      if (cancelled) return
      const dt = clock.getDelta()
      game.tick++

      // Movement (only when not in dialog/intro)
      if (!game.intro && !game.dialog) {
        if (!game.moving) {
          let dx = 0, dz = 0
          if (game.keys['ArrowUp'] || game.keys['z'] || game.keys['w']) { dz = -1; game.direction = 'up' }
          else if (game.keys['ArrowDown'] || game.keys['s']) { dz = 1; game.direction = 'down' }
          else if (game.keys['ArrowLeft'] || game.keys['q'] || game.keys['a']) { dx = -1; game.direction = 'left' }
          else if (game.keys['ArrowRight'] || game.keys['d']) { dx = 1; game.direction = 'right' }

          if (dx !== 0 || dz !== 0) {
            const ntx = game.tileX + dx
            const nty = game.tileY + dz
            if (canMove(map, ntx, nty)) {
              game.targetTX = ntx
              game.targetTY = nty
              game.moving = true
            }
          }
        }

        if (game.moving) {
          const tx = game.targetTX + 0.5
          const tz = game.targetTY + 0.5
          const ddx = tx - game.px
          const ddz = tz - game.pz
          const dist = Math.sqrt(ddx * ddx + ddz * ddz)
          if (dist < MOVE_SPEED) {
            game.px = tx; game.pz = tz
            game.tileX = game.targetTX; game.tileY = game.targetTY
            game.moving = false
          } else {
            game.px += (ddx / dist) * MOVE_SPEED
            game.pz += (ddz / dist) * MOVE_SPEED
          }
        }

        // Proximity checks
        const zone = getAdjacentZone(game.tileX, game.tileY)
        const npc = getAdjacentNPC(game.tileX, game.tileY)
        if (zone) {
          const wp = wpRef.current
          setPromptText(wp[zone.id]?.unlocked ? '[ ESPACE ] Entrer' : 'Verrouillee')
        } else if (npc) {
          setPromptText('[ ESPACE ] Parler')
        } else {
          setPromptText(null)
        }
      }

      // Dialog text animation
      if (game.dialog) {
        const line = game.dialog.lines[game.dialog.lineIdx]
        if (game.dialog.charIdx < line.length) {
          game.dialog.charIdx = Math.min(game.dialog.charIdx + TEXT_SPEED, line.length)
        }
        if (dialogTextRef.current) {
          dialogTextRef.current.textContent = line.substring(0, Math.floor(game.dialog.charIdx))
        }
        if (dialogSpeakerRef.current) {
          dialogSpeakerRef.current.textContent = game.dialog.speaker || 'VDX'
        }
      }

      // Intro text animation
      if (game.intro && game.introStep < INTRO_TEXTS.length) {
        const text = INTRO_TEXTS[game.introStep].text
        if (game.introCharIdx < text.length) {
          game.introCharIdx = Math.min(game.introCharIdx + TEXT_SPEED, text.length)
        }
        if (introTextRef.current) {
          introTextRef.current.textContent = text.substring(0, Math.floor(game.introCharIdx))
        }
      }

      // ==================== UPDATE 3D ====================

      // Player position & rotation
      const dirAngles = { down: Math.PI, left: Math.PI / 2, up: 0, right: -Math.PI / 2 }
      playerMesh.position.set(game.px, game.moving ? Math.sin(game.tick * 0.3) * 0.05 : 0, game.pz)
      playerMesh.rotation.y = dirAngles[game.direction] || 0

      // NPC idle animation
      npcMeshes.forEach(({ mesh, label, excl }, i) => {
        const bob = Math.sin(game.tick * 0.02 + i * 2.5) * 0.04
        mesh.position.y = bob
        label.position.y = 1.5 + bob
        excl.position.y = 2.0 + Math.sin(game.tick * 0.05 + i) * 0.08
      })

      // Camera follow
      camTarget.set(game.px, 0, game.pz)
      desiredPos.copy(camTarget).add(CAM_OFFSET)
      const lerpFactor = 1 - Math.pow(0.02, dt)
      camera.position.lerp(desiredPos, lerpFactor)
      camera.lookAt(camTarget)

      // Sun follows player for proper shadows
      sun.position.set(game.px + 15, 30, game.pz + 10)
      sun.target.position.set(game.px, 0, game.pz)

      // Animate particles
      if (worldObjects.particles) {
        const pArr = worldObjects.particles.geometry.attributes.position.array
        for (let i = 0; i < pArr.length; i += 3) {
          pArr[i + 1] += Math.sin(game.tick * 0.01 + pArr[i] * 0.5) * 0.002
          if (pArr[i + 1] > 5) pArr[i + 1] = 0.5
        }
        worldObjects.particles.geometry.attributes.position.needsUpdate = true
      }

      composer.render()
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    // ==================== RESIZE ====================
    function onResize() {
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      composer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelled = true
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [onOpenZone])

  const pressKey = useCallback((key, down) => {
    if (gameRef.current) gameRef.current.keys[key] = down
  }, [])

  const mobileInteract = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
  }, [])

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f] z-50">
          <div className="text-gold font-mono text-lg animate-pulse">Chargement du monde 3D...</div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-3 left-3 bg-black/80 border border-gold/50 rounded-lg px-4 py-2 z-10">
        <div className="text-[#c7b777] font-mono text-sm font-bold">VDX N0
          <span className="text-[#c7b777]/60 text-xs ml-2">Niv. 0</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-20 h-2 bg-black/60 rounded-full border border-[#c7b777]/30">
            <div className="h-full bg-[#c7b777] rounded-full" style={{ width: '30%' }} />
          </div>
          <span className="text-[#c7b777]/70 text-xs">300 XP</span>
        </div>
      </div>

      {/* Prompt */}
      {promptText && !showDialog && !showIntro && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/85 border-2 border-[#c7b777] rounded-xl px-6 py-2 z-20">
          <span className="text-[#c7b777] font-mono font-bold text-sm">{promptText}</span>
        </div>
      )}

      {/* Dialog Box */}
      {showDialog && (
        <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto z-30">
          <div className="bg-[#0a0a19]/95 border-2 border-[#c7b777] rounded-xl p-5 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-[#c7b777] to-[#d4c888] text-[#0a0a0f] font-mono font-bold px-3 py-1 rounded-md inline-block -mt-9 mb-3 text-sm">
              <span ref={dialogSpeakerRef}>...</span>
            </div>
            <p ref={dialogTextRef} className="text-white font-mono text-sm leading-relaxed min-h-[3em]" />
            <div className="text-[#c7b777]/50 text-xs mt-2 text-right font-mono">ESPACE pour continuer</div>
          </div>
        </div>
      )}

      {/* Intro Overlay */}
      {showIntro && (
        <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-40">
          <h1 className="text-[#c7b777] font-mono text-4xl font-bold mb-2 tracking-wider">VDX QUEST</h1>
          <p className="text-[#a89a5e] font-mono text-sm mb-12">Vendeur d'Exception - Niveau 0</p>
          <div className="bg-[#0a0a19]/95 border-2 border-[#c7b777] rounded-xl p-5 max-w-lg w-full mx-4 backdrop-blur-sm">
            <div className="bg-gradient-to-r from-[#c7b777] to-[#d4c888] text-[#0a0a0f] font-mono font-bold px-3 py-1 rounded-md inline-block -mt-9 mb-3 text-sm">
              VDX
            </div>
            <p ref={introTextRef} className="text-white font-mono text-sm leading-relaxed min-h-[2em]" />
            <div className="text-[#c7b777]/50 text-xs mt-3 text-right font-mono">ESPACE pour continuer</div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <MobileControls pressKey={pressKey} onAction={mobileInteract} />
    </div>
  )
}

function MobileControls({ pressKey, onAction }) {
  const btn = (key, label, extra) => (
    <button
      className={`w-14 h-14 bg-black/70 border-2 border-[#c7b777]/50 rounded-xl text-[#c7b777] text-xl font-bold active:bg-[#c7b777]/30 select-none touch-none ${extra || ''}`}
      onTouchStart={e => { e.preventDefault(); pressKey(key, true) }}
      onTouchEnd={e => { e.preventDefault(); pressKey(key, false) }}
      onMouseDown={() => pressKey(key, true)}
      onMouseUp={() => pressKey(key, false)}
      onMouseLeave={() => pressKey(key, false)}
    >{label}</button>
  )

  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 lg:hidden pointer-events-none z-30">
      <div className="grid grid-cols-3 gap-1 pointer-events-auto">
        <div />
        {btn('ArrowUp', '\u25B2')}
        <div />
        {btn('ArrowLeft', '\u25C0')}
        <div className="w-14 h-14" />
        {btn('ArrowRight', '\u25B6')}
        <div />
        {btn('ArrowDown', '\u25BC')}
        <div />
      </div>
      <div className="flex items-center pointer-events-auto">
        <button
          className="w-16 h-16 bg-[#c7b777]/80 border-2 border-[#c7b777] rounded-full text-[#0a0a0f] text-sm font-bold active:bg-[#c7b777] select-none touch-none shadow-lg shadow-[#c7b777]/30"
          onTouchStart={e => { e.preventDefault(); onAction() }}
          onClick={onAction}
        >A</button>
      </div>
    </div>
  )
}
