import { useEffect, useRef, useState, useCallback } from 'react'
import {
  TILE, COLS, ROWS, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel,
  getAdjacentZone, getAdjacentNPC, getAdjacentInteriorNPC, canMove,
} from '../game/engine'
import {
  loadSpriteAtlas, drawSpriteTile, drawPlayerSprite, drawNPCSprite,
  drawInteriorTile, generateInterior, canMoveInterior, IT,
} from '../game/sprites'
import {
  ParticleSystem, DayNightCycle, Minimap, MINIMAP_TILE_COLORS,
} from '../game/particles'
import { useGameState } from '../hooks/useGameState'

const SCALE = 3
const MOVE_FRAMES = 8
const ANIM_SPEED = 8
const TEXT_SPEED = 0.6
const TRANSITION_FRAMES = 30

const INTRO_TEXTS = [
  { speaker: '', text: '...' },
  { speaker: '', text: 'Tu ouvres les yeux.' },
  { speaker: '', text: 'Devant toi, un monde s\'etend. Le Monde VDX.' },
  { speaker: '', text: 'Tu as decide de changer. De passer du reve a l\'action.' },
  { speaker: '', text: '90 jours. 12 epreuves. 3 regions.' },
  { speaker: '', text: 'Ton aventure commence maintenant.' },
]

export default function RPGCanvas({ onOpenZone }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const { weekProgress, questProgress } = useGameState()
  const wpRef = useRef(weekProgress)
  const qpRef = useRef(questProgress)
  useEffect(() => { wpRef.current = weekProgress }, [weekProgress])
  useEffect(() => { qpRef.current = questProgress }, [questProgress])

  const [promptText, setPromptText] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const dialogTextRef = useRef(null)
  const dialogSpeakerRef = useRef(null)
  const introTextRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let cancelled = false
    let animId

    ctx.imageSmoothingEnabled = false

    const map = generateMap()
    let atlas = null

    // Systems
    const particles = new ParticleSystem()
    const dayNight = new DayNightCycle()
    const minimap = new Minimap(COLS, ROWS)
    particles.setWeather('leaves') // ambient leaves

    // Game state
    const game = {
      // Player position
      px: 19, py: 24,
      tx: 19, ty: 24,
      ox: 0, oy: 0,
      moveFrame: 0,
      moving: false,
      direction: 'down',
      walkFrame: 0,
      walkTick: 0,
      lastFootstep: 0,
      keys: {},
      tick: 0,
      camX: 0, camY: 0,
      // Scene mode
      scene: 'overworld', // 'overworld' | 'interior' | 'transition'
      transitionDir: 'in', // 'in' (fade to black) | 'out' (fade from black)
      transitionFrame: 0,
      transitionCallback: null,
      // Interior
      interior: null,
      interiorZone: null,
      savedPos: null,
      // Guardian
      guardianActive: false,
      guardianDismissed: false,
      // Dialog
      dialog: null,
      intro: true,
      introStep: 0,
      introCharIdx: 0,
    }
    gameRef.current = game

    loadSpriteAtlas().then(a => {
      atlas = a
      minimap.generate(map, ZONES, MINIMAP_TILE_COLORS)
      setLoading(false)
    })

    function resize() {
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      ctx.imageSmoothingEnabled = false
    }
    resize()
    window.addEventListener('resize', resize)

    // Input
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

    // Start a screen transition (Pokémon-style fade)
    function startTransition(dir, callback) {
      game.scene = 'transition'
      game.transitionDir = dir
      game.transitionFrame = 0
      game.transitionCallback = callback
    }

    // Enter a building (with quest locking check)
    function enterBuilding(zone) {
      // Check if this house requires a previous quest to be completed
      if (zone.requiredQuest) {
        const qp = qpRef.current
        if (!qp[zone.requiredQuest]) {
          // Find the name of the required zone
          const reqZone = ZONES.find(z => z.questId === zone.requiredQuest)
          const reqName = reqZone ? reqZone.name : 'la maison precedente'
          game.dialog = {
            speaker: '',
            lines: [
              'Cette maison est encore verrouillee.',
              `Tu dois d'abord completer la mission de "${reqName}".`,
              'Termine l\'epreuve precedente, puis reviens ici.',
            ],
            lineIdx: 0,
            charIdx: 0,
          }
          setShowDialog(true)
          return
        }
      }

      startTransition('in', () => {
        // Save overworld position
        game.savedPos = { px: game.px, py: game.py, direction: game.direction }
        // Generate interior
        const interior = generateInterior(zone)
        game.interior = interior
        game.interiorZone = zone
        // Place player at door
        game.px = interior.spawnX
        game.py = interior.spawnY
        game.direction = 'up'
        game.moving = false
        game.ox = 0; game.oy = 0
        // Reset guardian state
        game.guardianActive = false
        game.guardianDismissed = false
        game.scene = 'transition'
        game.transitionDir = 'out'
        game.transitionFrame = 0
        game.transitionCallback = () => { game.scene = 'interior' }
      })
    }

    // Exit building
    function exitBuilding() {
      startTransition('in', () => {
        const saved = game.savedPos
        game.px = saved.px
        game.py = saved.py
        game.direction = saved.direction
        game.interior = null
        game.interiorZone = null
        game.moving = false
        game.ox = 0; game.oy = 0
        game.scene = 'transition'
        game.transitionDir = 'out'
        game.transitionFrame = 0
        game.transitionCallback = () => { game.scene = 'overworld' }
      })
    }

    function handleInteract() {
      if (game.scene === 'transition') return

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

      // Interior interactions
      if (game.scene === 'interior') {
        const im = game.interior.map
        const { px, py } = game
        const zone = game.interiorZone

        // Check if near interior NPC
        const intNpc = getAdjacentInteriorNPC(px, py, zone.interiorNpcs)
        if (intNpc) {
          game.dialog = { speaker: intNpc.name, lines: intNpc.dialog, lineIdx: 0, charIdx: 0 }
          setShowDialog(true)
          return
        }

        // Check if near altar
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const cx = px + dx, cy = py + dy
            if (cy >= 0 && cy < game.interior.height && cx >= 0 && cx < game.interior.width) {
              if (im[cy][cx] === IT.ALTAR) {
                const wp = wpRef.current
                const wid = zone.weekId || zone.id
                if (wp[wid]?.unlocked) {
                  onOpenZone(wid)
                  // After opening quest dialog, check if quest will be completed
                  // Guardian activates when player returns from quest dialog
                  setTimeout(() => {
                    const qp = qpRef.current
                    if (zone.questId && qp[zone.questId] && !game.guardianDismissed) {
                      game.guardianActive = true
                    }
                  }, 500)
                } else {
                  game.dialog = {
                    speaker: '', lines: ['Cette epreuve est encore verrouillee.'],
                    lineIdx: 0, charIdx: 0,
                  }
                  setShowDialog(true)
                }
                return
              }
            }
          }
        }

        // Check if at door mat — guardian blocks exit if active
        if (im[py]?.[px] === IT.DOOR_MAT) {
          if (game.guardianActive && !game.guardianDismissed && zone.guardian) {
            // Guardian blocks the exit — must talk first
            game.dialog = {
              speaker: zone.guardian.name,
              lines: zone.guardian.dialog,
              lineIdx: 0,
              charIdx: 0,
            }
            setShowDialog(true)
            game.guardianDismissed = true
            return
          }
          // Check if quest just completed but guardian not yet shown
          const qp = qpRef.current
          if (zone.questId && qp[zone.questId] && !game.guardianDismissed && zone.guardian) {
            game.guardianActive = true
            game.dialog = {
              speaker: zone.guardian.name,
              lines: zone.guardian.dialog,
              lineIdx: 0,
              charIdx: 0,
            }
            setShowDialog(true)
            game.guardianDismissed = true
            return
          }
          exitBuilding()
        }
        return
      }

      // Overworld interactions
      const zone = getAdjacentZone(game.px, game.py)
      if (zone) {
        enterBuilding(zone)
        return
      }
      const npc = getAdjacentNPC(game.px, game.py)
      if (npc) {
        game.dialog = { speaker: npc.name, lines: npc.dialog, lineIdx: 0, charIdx: 0 }
        setShowDialog(true)
      }
    }

    // ==================== GAME LOOP ====================
    function update() {
      if (cancelled) return
      animId = requestAnimationFrame(update)
      if (!atlas) return

      game.tick++
      const viewW = canvas.width
      const viewH = canvas.height

      // Transition
      if (game.scene === 'transition') {
        game.transitionFrame++
        if (game.transitionFrame >= TRANSITION_FRAMES) {
          const cb = game.transitionCallback
          game.transitionCallback = null
          if (cb) cb()
        }
      }

      // Movement (overworld or interior)
      const isPlayable = (game.scene === 'overworld' || game.scene === 'interior') && !game.intro && !game.dialog
      if (isPlayable) {
        if (game.moving) {
          game.moveFrame++
          const progress = game.moveFrame / MOVE_FRAMES
          game.ox = (game.tx - game.px) * TILE * SCALE * progress
          game.oy = (game.ty - game.py) * TILE * SCALE * progress
          game.walkTick++
          if (game.walkTick % ANIM_SPEED === 0) game.walkFrame = (game.walkFrame + 1) % 3

          if (game.moveFrame >= MOVE_FRAMES) {
            game.px = game.tx
            game.py = game.ty
            game.ox = 0
            game.oy = 0
            game.moving = false
            game.moveFrame = 0
            // Footstep dust on overworld paths
            if (game.scene === 'overworld' && game.tick - game.lastFootstep > 4) {
              const tile = map[game.py]?.[game.px]
              if (tile === 1) { // PATH
                particles.spawnFootstepDust(game.px * TILE + 8, game.py * TILE + 12, game.direction)
              }
              game.lastFootstep = game.tick
            }
          }
        }

        if (!game.moving) {
          let dx = 0, dy = 0
          if (game.keys['ArrowUp'] || game.keys['z'] || game.keys['w']) { dy = -1; game.direction = 'up' }
          else if (game.keys['ArrowDown'] || game.keys['s']) { dy = 1; game.direction = 'down' }
          else if (game.keys['ArrowLeft'] || game.keys['q'] || game.keys['a']) { dx = -1; game.direction = 'left' }
          else if (game.keys['ArrowRight'] || game.keys['d']) { dx = 1; game.direction = 'right' }

          if (dx || dy) {
            const ntx = game.px + dx, nty = game.py + dy
            let canMoveHere
            if (game.scene === 'interior') {
              canMoveHere = canMoveInterior(game.interior.map, ntx, nty, game.interiorZone?.interiorNpcs)
              // Guardian blocks the door exit tile
              if (canMoveHere && game.guardianActive && !game.guardianDismissed && game.interiorZone?.guardian) {
                const gx = game.interior.spawnX
                const gy = game.interior.height - 2
                if (ntx === gx && nty === gy) canMoveHere = false
              }
            } else {
              canMoveHere = canMove(map, ntx, nty)
            }
            if (canMoveHere) {
              game.tx = ntx
              game.ty = nty
              game.moving = true
              game.moveFrame = 0
            }
          } else {
            game.walkFrame = 0
          }
        }

        // Proximity prompts
        if (game.scene === 'overworld') {
          const zone = getAdjacentZone(game.px, game.py)
          const npc = getAdjacentNPC(game.px, game.py)
          if (zone) {
            const qpNow = qpRef.current
            const isLocked = zone.requiredQuest && !qpNow[zone.requiredQuest]
            setPromptText(isLocked ? '[ ESPACE ] Verrouillee' : '[ ESPACE ] Entrer')
          } else if (npc) {
            setPromptText('[ ESPACE ] Parler')
          } else {
            setPromptText(null)
          }
        } else if (game.scene === 'interior') {
          // Check proximity to interior elements
          let nearAltar = false
          const im = game.interior.map
          const intNpc = getAdjacentInteriorNPC(game.px, game.py, game.interiorZone?.interiorNpcs)
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const cx = game.px + dx, cy = game.py + dy
              if (cy >= 0 && cy < game.interior.height && cx >= 0 && cx < game.interior.width) {
                if (im[cy][cx] === IT.ALTAR) nearAltar = true
              }
            }
          }
          if (im[game.py]?.[game.px] === IT.DOOR_MAT) {
            if (game.guardianActive && !game.guardianDismissed && game.interiorZone?.guardian) {
              setPromptText('[ ESPACE ] Parler au Gardien')
            } else {
              setPromptText('[ ESPACE ] Sortir')
            }
          } else if (intNpc) {
            setPromptText('[ ESPACE ] Parler')
          } else if (nearAltar) {
            setPromptText('[ ESPACE ] Valider la mission')
          } else {
            setPromptText(null)
          }
        }
      }

      // Check if quest just completed inside a house — activate guardian
      if (game.scene === 'interior' && game.interiorZone && !game.guardianActive && !game.guardianDismissed) {
        const qp = qpRef.current
        const zone = game.interiorZone
        if (zone.questId && qp[zone.questId] && zone.guardian) {
          game.guardianActive = true
        }
      }

      // Dialog animation
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

      // Intro animation
      if (game.intro && game.introStep < INTRO_TEXTS.length) {
        const text = INTRO_TEXTS[game.introStep].text
        if (game.introCharIdx < text.length) {
          game.introCharIdx = Math.min(game.introCharIdx + TEXT_SPEED, text.length)
        }
        if (introTextRef.current) {
          introTextRef.current.textContent = text.substring(0, Math.floor(game.introCharIdx))
        }
      }

      // ==================== UPDATE SYSTEMS ====================
      particles.update()
      dayNight.update()

      // Spawn particles based on scene
      if (game.scene === 'overworld' || game.scene === 'interior') {
        if (game.tick % 3 === 0) {
          if (game.scene === 'overworld') {
            // Spawn ambient particles
            particles.spawnAmbient(
              game.camX / SCALE, game.camY / SCALE,
              viewW / SCALE, viewH / SCALE
            )
            // Water ripples near visible water tiles
            if (game.tick % 12 === 0) {
              const cx = Math.floor(game.px)
              const cy = Math.floor(game.py)
              for (let dy = -5; dy <= 5; dy++) {
                for (let dx = -5; dx <= 5; dx++) {
                  const wx = cx + dx, wy = cy + dy
                  if (wx >= 0 && wy >= 0 && wx < COLS && wy < ROWS && map[wy][wx] === 2) {
                    if (Math.random() > 0.7) {
                      particles.spawnWaterRipple(wx * TILE, wy * TILE, TILE)
                    }
                  }
                }
              }
            }
          }
          if (game.scene === 'interior' && game.interior) {
            // Torch flames in interior
            const im = game.interior.map
            for (let y = 0; y < game.interior.height; y++) {
              for (let x = 0; x < game.interior.width; x++) {
                if (im[y][x] === IT.TORCH) {
                  particles.spawnTorchFlame(x * TILE, y * TILE, TILE)
                }
                if (im[y][x] === IT.ALTAR) {
                  const wp = wpRef.current
                  const wid = game.interiorZone?.weekId || game.interiorZone?.id
                  particles.spawnAltarGlow(x * TILE, y * TILE, TILE, wp[wid]?.unlocked)
                }
              }
            }
          }
        }
        // Weather
        if (game.scene === 'overworld') {
          particles.spawnWeather(viewW, viewH)
        }
      }

      // ==================== RENDER ====================
      const shake = particles.getScreenShake()
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, viewW, viewH)

      ctx.save()
      ctx.translate(shake.x, shake.y)

      if (game.scene === 'overworld' || (game.scene === 'transition' && !game.interior && game.transitionDir === 'in') ||
          (game.scene === 'transition' && game.interior && game.transitionDir === 'out' && game.savedPos)) {
        if (game.scene !== 'transition' || !game.interior) {
          renderOverworld(ctx, viewW, viewH, game, atlas, map)
        }
      }

      if (game.scene === 'interior' || (game.scene === 'transition' && game.interior)) {
        if (game.interior) {
          renderInterior(ctx, viewW, viewH, game, atlas)
        }
      }

      ctx.restore() // undo shake

      // Day/night overlay (overworld only)
      if (game.scene === 'overworld' || (game.scene === 'transition' && !game.interior)) {
        dayNight.render(ctx, viewW, viewH)
      }

      // Weather overlay
      if (game.scene === 'overworld') {
        particles.renderWeather(ctx, viewW, viewH)
      }

      // Screen effects (flash etc)
      particles.renderScreenEffects(ctx, viewW, viewH)

      // Transition overlay
      if (game.scene === 'transition') {
        const progress = Math.min(game.transitionFrame / TRANSITION_FRAMES, 1)
        const alpha = game.transitionDir === 'in' ? progress : (1 - progress)
        ctx.fillStyle = `rgba(0,0,0,${alpha})`
        ctx.fillRect(0, 0, viewW, viewH)
      }

      // Minimap (overworld only, not during dialog/intro)
      if (game.scene === 'overworld' && !game.intro && !game.dialog) {
        minimap.render(ctx, game.px, game.py, NPCS, viewW - 140, 50)
      }
    }

    function renderOverworld(ctx, viewW, viewH, game, atlas, map) {
      const playerPixelX = game.px * TILE * SCALE + game.ox
      const playerPixelY = game.py * TILE * SCALE + game.oy
      const targetCamX = playerPixelX + TILE * SCALE / 2 - viewW / 2
      const targetCamY = playerPixelY + TILE * SCALE / 2 - viewH / 2
      const mapPixelW = COLS * TILE * SCALE
      const mapPixelH = ROWS * TILE * SCALE
      const clampedCamX = Math.max(0, Math.min(targetCamX, mapPixelW - viewW))
      const clampedCamY = Math.max(0, Math.min(targetCamY, mapPixelH - viewH))
      game.camX += (clampedCamX - game.camX) * 0.15
      game.camY += (clampedCamY - game.camY) * 0.15

      const camX = Math.round(game.camX)
      const camY = Math.round(game.camY)

      const startCol = Math.max(0, Math.floor(camX / (TILE * SCALE)) - 1)
      const endCol = Math.min(COLS, Math.ceil((camX + viewW) / (TILE * SCALE)) + 1)
      const startRow = Math.max(0, Math.floor(camY / (TILE * SCALE)) - 1)
      const endRow = Math.min(ROWS, Math.ceil((camY + viewH) / (TILE * SCALE)) + 1)

      ctx.save()
      ctx.translate(-camX, -camY)
      ctx.save()
      ctx.scale(SCALE, SCALE)

      // Draw tiles
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          drawSpriteTile(ctx, atlas, map[row][col], col * TILE, row * TILE, game.tick)
        }
      }

      // Draw NPCs (standing still, facing player direction when close)
      for (const npc of NPCS) {
        if (npc.x >= startCol - 1 && npc.x <= endCol + 1 && npc.y >= startRow - 1 && npc.y <= endRow + 1) {
          // Face toward player if nearby
          let dir = 'down'
          const dx = game.px - npc.x
          const dy = game.py - npc.y
          if (Math.abs(dx) + Math.abs(dy) <= 3) {
            if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left'
            else dir = dy > 0 ? 'down' : 'up'
          }
          drawNPCSprite(ctx, atlas, npc.sprite, npc.x * TILE, npc.y * TILE, game.tick, dir)
        }
      }

      // Overworld particles (in tile-space, scaled)
      particles.render(ctx, true)

      // Draw player
      const pDrawX = game.px * TILE + game.ox / SCALE
      const pDrawY = game.py * TILE + game.oy / SCALE
      drawPlayerSprite(ctx, atlas, game.direction, game.walkFrame, pDrawX, pDrawY)

      ctx.restore() // undo scale

      // Labels
      const wp = wpRef.current
      const qp = qpRef.current
      for (const zone of ZONES) {
        if (zone.houseX >= startCol - 3 && zone.houseX <= endCol + 3 && zone.houseY >= startRow - 3 && zone.houseY <= endRow + 3) {
          const wid = zone.weekId || zone.id
          // A zone is unlocked if the week is unlocked AND the required quest is done (or no requirement)
          const weekUnlocked = wp[wid]?.unlocked
          const questUnlocked = !zone.requiredQuest || qp[zone.requiredQuest]
          const isUnlocked = weekUnlocked && questUnlocked
          const isCompleted = zone.questId ? qp[zone.questId] : wp[wid]?.completed
          drawZoneLabel(ctx, zone, zone.houseX * TILE * SCALE, zone.houseY * TILE * SCALE, isUnlocked, isCompleted)
        }
      }
      for (const npc of NPCS) {
        if (npc.x >= startCol - 1 && npc.x <= endCol + 1 && npc.y >= startRow - 1 && npc.y <= endRow + 1) {
          drawNPCLabel(ctx, npc, npc.x * TILE * SCALE, npc.y * TILE * SCALE, game.tick)
        }
      }

      // Time display
      ctx.fillStyle = 'rgba(5,5,15,0.7)'
      ctx.beginPath()
      ctx.roundRect(viewW - 146, 30, 38, 16, 3)
      ctx.fill()
      ctx.fillStyle = '#c7b777'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(dayNight.getTimeLabel(), viewW - 127, 41)

      ctx.restore() // undo camera
    }

    function renderInterior(ctx, viewW, viewH, game, atlas) {
      const interior = game.interior
      const iw = interior.width * TILE * SCALE
      const ih = interior.height * TILE * SCALE
      const zone = game.interiorZone

      // Center interior on screen
      const offX = Math.round((viewW - iw) / 2)
      const offY = Math.round((viewH - ih) / 2)

      ctx.save()
      ctx.translate(offX, offY)
      ctx.save()
      ctx.scale(SCALE, SCALE)

      // Draw interior tiles
      for (let row = 0; row < interior.height; row++) {
        for (let col = 0; col < interior.width; col++) {
          drawInteriorTile(ctx, interior.map[row][col], col * TILE, row * TILE, game.tick)
        }
      }

      // Interior particles (torch flames, altar glow - in tile space)
      particles.render(ctx, true)

      // Draw interior NPCs
      if (zone.interiorNpcs) {
        for (const npc of zone.interiorNpcs) {
          // Face toward player if nearby
          let dir = 'down'
          const dx = game.px - npc.x
          const dy = game.py - npc.y
          if (Math.abs(dx) + Math.abs(dy) <= 3) {
            if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left'
            else dir = dy > 0 ? 'down' : 'up'
          }
          drawNPCSprite(ctx, atlas, npc.sprite, npc.x * TILE, npc.y * TILE, game.tick, dir)
        }
      }

      // Draw guardian NPC at door if active
      if (game.guardianActive && !game.guardianDismissed && zone.guardian) {
        const gx = interior.spawnX
        const gy = interior.height - 2
        drawNPCSprite(ctx, atlas, zone.guardian.sprite, gx * TILE, gy * TILE, game.tick, 'up')
      }

      // Draw player
      const pDrawX = game.px * TILE + game.ox / SCALE
      const pDrawY = game.py * TILE + game.oy / SCALE
      drawPlayerSprite(ctx, atlas, game.direction, game.walkFrame, pDrawX, pDrawY)

      ctx.restore() // undo scale

      // Interior NPC name labels (above NPCs)
      if (zone.interiorNpcs) {
        for (const npc of zone.interiorNpcs) {
          const npx = npc.x * TILE * SCALE
          const npy = npc.y * TILE * SCALE
          const bob = Math.sin(game.tick * 0.05 + npc.x) * 2

          // Exclamation mark
          ctx.fillStyle = '#c7b777'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('!', npx + TILE * SCALE / 2, npy - 4 + bob)

          // Name background
          const nameW = npc.name.length * 5 + 10
          const nameX = npx + TILE * SCALE / 2 - nameW / 2
          const nameY = npy - 16 + bob
          ctx.fillStyle = 'rgba(5,5,15,0.8)'
          ctx.beginPath()
          ctx.roundRect(nameX, nameY, nameW, 12, 3)
          ctx.fill()

          // Name text
          ctx.fillStyle = '#c7b777'
          ctx.font = '8px monospace'
          ctx.fillText(npc.name, npx + TILE * SCALE / 2, nameY + 9)
        }
      }

      // Guardian name label
      if (game.guardianActive && !game.guardianDismissed && zone.guardian) {
        const gx = interior.spawnX * TILE * SCALE
        const gy = (interior.height - 2) * TILE * SCALE
        const bob = Math.sin(game.tick * 0.06) * 2

        // Exclamation mark
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('!', gx + TILE * SCALE / 2, gy - 6 + bob)

        // Name
        const gname = zone.guardian.name
        const gnameW = gname.length * 5 + 12
        const gnameX = gx + TILE * SCALE / 2 - gnameW / 2
        const gnameY = gy - 20 + bob
        ctx.fillStyle = 'rgba(5,5,15,0.85)'
        ctx.beginPath()
        ctx.roundRect(gnameX, gnameY, gnameW, 12, 3)
        ctx.fill()
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 8px monospace'
        ctx.fillText(gname, gx + TILE * SCALE / 2, gnameY + 9)
      }

      // Zone name header
      ctx.fillStyle = 'rgba(10,10,25,0.85)'
      ctx.beginPath()
      ctx.roundRect(iw / 2 - 100, -30, 200, 24, 6)
      ctx.fill()
      ctx.strokeStyle = '#c7b777'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(iw / 2 - 100, -30, 200, 24, 6)
      ctx.stroke()
      ctx.fillStyle = '#c7b777'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(zone.name, iw / 2, -14)

      ctx.restore() // undo translate
    }

    animId = requestAnimationFrame(update)

    return () => {
      cancelled = true
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', resize)
    }
  }, [onOpenZone])

  const pressKey = useCallback((key, down) => {
    if (gameRef.current) gameRef.current.keys[key] = down
  }, [])

  const mobileInteract = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
  }, [])

  return (
    <div className="w-full h-full relative bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f] z-50">
          <div className="text-[#c7b777] font-mono text-lg animate-pulse">Chargement...</div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-3 left-3 bg-black/80 border border-[#c7b777]/50 rounded-lg px-4 py-2 z-10">
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

      {/* Dialog */}
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

      {/* Intro */}
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
