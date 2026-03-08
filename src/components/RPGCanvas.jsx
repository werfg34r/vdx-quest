// VDX Quest — Main Game Canvas (Complete Rewrite)
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  TILE, COLS, ROWS, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel,
  getAdjacentZone, getAdjacentNPC, getAdjacentInteriorNPC, canMove, updateNPCs,
} from '../game/engine'
import {
  loadSpriteAtlas, drawSpriteTile, drawPlayerSprite, drawNPCSprite,
  drawInteriorTile, generateInterior, canMoveInterior, IT,
  drawCharacterShadow, drawTreeShadow, drawHouseShadow, drawHouseSprite, drawWindowGlow,
} from '../game/sprites'
import {
  ParticleSystem, DayNightCycle, Minimap, MINIMAP_TILE_COLORS, renderVignette,
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
    particles.setWeather('leaves')

    // Game state
    const game = {
      px: 19, py: 24, tx: 19, ty: 24,
      ox: 0, oy: 0, moveFrame: 0, moving: false,
      direction: 'down', walkFrame: 0, walkTick: 0, lastFootstep: 0,
      keys: {}, tick: 0, camX: 0, camY: 0,
      scene: 'overworld',
      transitionDir: 'in', transitionFrame: 0, transitionCallback: null,
      interior: null, interiorZone: null, savedPos: null,
      guardianActive: false, guardianDismissed: false,
      dialog: null,
      intro: true, introStep: 0, introCharIdx: 0,
    }
    gameRef.current = game

    loadSpriteAtlas().then(a => {
      atlas = a
      minimap.generate(map, ZONES, MINIMAP_TILE_COLORS)
      setLoading(false)
    })

    // ==================== RESIZE ====================
    function resize() {
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      ctx.imageSmoothingEnabled = false
    }
    resize()
    window.addEventListener('resize', resize)

    // ==================== INPUT ====================
    function onKeyDown(e) {
      game.keys[e.key] = true
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleInteract() }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
    }
    function onKeyUp(e) { game.keys[e.key] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // ==================== TRANSITIONS ====================
    function startTransition(dir, callback) {
      game.scene = 'transition'
      game.transitionDir = dir
      game.transitionFrame = 0
      game.transitionCallback = callback
    }

    function enterBuilding(zone) {
      if (zone.requiredQuest) {
        const qp = qpRef.current
        if (!qp[zone.requiredQuest]) {
          const reqZone = ZONES.find(z => z.questId === zone.requiredQuest)
          const reqName = reqZone ? reqZone.name : 'la maison precedente'
          game.dialog = {
            speaker: '', lineIdx: 0, charIdx: 0,
            lines: ['Cette maison est encore verrouillee.', `Tu dois d'abord completer la mission de "${reqName}".`, 'Termine l\'epreuve precedente, puis reviens ici.'],
          }
          setShowDialog(true)
          return
        }
      }
      startTransition('in', () => {
        game.savedPos = { px: game.px, py: game.py, direction: game.direction }
        const interior = generateInterior(zone)
        game.interior = interior
        game.interiorZone = zone
        game.px = interior.spawnX; game.py = interior.spawnY
        game.direction = 'up'; game.moving = false; game.ox = 0; game.oy = 0
        game.guardianActive = false; game.guardianDismissed = false
        game.scene = 'transition'; game.transitionDir = 'out'; game.transitionFrame = 0
        game.transitionCallback = () => { game.scene = 'interior' }
      })
    }

    function exitBuilding() {
      startTransition('in', () => {
        const saved = game.savedPos
        game.px = saved.px; game.py = saved.py; game.direction = saved.direction
        game.interior = null; game.interiorZone = null
        game.moving = false; game.ox = 0; game.oy = 0
        game.scene = 'transition'; game.transitionDir = 'out'; game.transitionFrame = 0
        game.transitionCallback = () => { game.scene = 'overworld' }
      })
    }

    // ==================== INTERACTION ====================
    function handleInteract() {
      if (game.scene === 'transition') return

      // Intro
      if (game.intro) {
        if (game.introCharIdx < INTRO_TEXTS[game.introStep].text.length) {
          game.introCharIdx = INTRO_TEXTS[game.introStep].text.length
        } else {
          game.introStep++; game.introCharIdx = 0
          if (game.introStep >= INTRO_TEXTS.length) { game.intro = false; setShowIntro(false) }
        }
        return
      }

      // Dialog
      if (game.dialog) {
        const line = game.dialog.lines[game.dialog.lineIdx]
        if (game.dialog.charIdx < line.length) {
          game.dialog.charIdx = line.length
        } else {
          game.dialog.lineIdx++; game.dialog.charIdx = 0
          if (game.dialog.lineIdx >= game.dialog.lines.length) { game.dialog = null; setShowDialog(false) }
        }
        return
      }

      // Interior interactions
      if (game.scene === 'interior') {
        const im = game.interior.map
        const zone = game.interiorZone

        // Interior NPC
        const intNpc = getAdjacentInteriorNPC(game.px, game.py, zone.interiorNpcs)
        if (intNpc) {
          game.dialog = { speaker: intNpc.name, lines: intNpc.dialog, lineIdx: 0, charIdx: 0 }
          setShowDialog(true)
          return
        }

        // Altar
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const cx = game.px + dx, cy = game.py + dy
            if (cy >= 0 && cy < game.interior.height && cx >= 0 && cx < game.interior.width && im[cy][cx] === IT.ALTAR) {
              const wp = wpRef.current
              const wid = zone.weekId || zone.id
              if (wp[wid]?.unlocked) {
                onOpenZone(wid)
                setTimeout(() => {
                  const qp = qpRef.current
                  if (zone.questId && qp[zone.questId] && !game.guardianDismissed) game.guardianActive = true
                }, 500)
              } else {
                game.dialog = { speaker: '', lines: ['Cette epreuve est encore verrouillee.'], lineIdx: 0, charIdx: 0 }
                setShowDialog(true)
              }
              return
            }
          }
        }

        // Door mat
        if (im[game.py]?.[game.px] === IT.DOOR_MAT) {
          if (game.guardianActive && !game.guardianDismissed && zone.guardian) {
            game.dialog = { speaker: zone.guardian.name, lines: zone.guardian.dialog, lineIdx: 0, charIdx: 0 }
            setShowDialog(true)
            game.guardianDismissed = true
            return
          }
          const qp = qpRef.current
          if (zone.questId && qp[zone.questId] && !game.guardianDismissed && zone.guardian) {
            game.guardianActive = true
            game.dialog = { speaker: zone.guardian.name, lines: zone.guardian.dialog, lineIdx: 0, charIdx: 0 }
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
      if (zone) { enterBuilding(zone); return }
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

      // Movement
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
            game.px = game.tx; game.py = game.ty
            game.ox = 0; game.oy = 0; game.moving = false; game.moveFrame = 0
            if (game.scene === 'overworld' && game.tick - game.lastFootstep > 4) {
              if (map[game.py]?.[game.px] === 1) particles.spawnFootstepDust(game.px * TILE + 8, game.py * TILE + 12, game.direction)
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
            let ok
            if (game.scene === 'interior') {
              ok = canMoveInterior(game.interior.map, ntx, nty, game.interiorZone?.interiorNpcs)
              if (ok && game.guardianActive && !game.guardianDismissed && game.interiorZone?.guardian) {
                if (ntx === game.interior.spawnX && nty === game.interior.height - 2) ok = false
              }
            } else {
              ok = canMove(map, ntx, nty)
            }
            if (ok) { game.tx = ntx; game.ty = nty; game.moving = true; game.moveFrame = 0 }
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
            setPromptText(zone.requiredQuest && !qpNow[zone.requiredQuest] ? '[ ESPACE ] Verrouillee' : '[ ESPACE ] Entrer')
          } else if (npc) {
            setPromptText('[ ESPACE ] Parler')
          } else {
            setPromptText(null)
          }
        } else if (game.scene === 'interior') {
          const im = game.interior.map
          const intNpc = getAdjacentInteriorNPC(game.px, game.py, game.interiorZone?.interiorNpcs)
          let nearAltar = false
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const cx = game.px + dx, cy = game.py + dy
              if (cy >= 0 && cy < game.interior.height && cx >= 0 && cx < game.interior.width && im[cy][cx] === IT.ALTAR) nearAltar = true
            }
          }
          if (im[game.py]?.[game.px] === IT.DOOR_MAT) {
            setPromptText(game.guardianActive && !game.guardianDismissed && game.interiorZone?.guardian ? '[ ESPACE ] Parler au Gardien' : '[ ESPACE ] Sortir')
          } else if (intNpc) {
            setPromptText('[ ESPACE ] Parler')
          } else if (nearAltar) {
            setPromptText('[ ESPACE ] Valider la mission')
          } else {
            setPromptText(null)
          }
        }
      }

      // Guardian activation check
      if (game.scene === 'interior' && game.interiorZone && !game.guardianActive && !game.guardianDismissed) {
        const qp = qpRef.current
        const zone = game.interiorZone
        if (zone.questId && qp[zone.questId] && zone.guardian) game.guardianActive = true
      }

      // Dialog text animation
      if (game.dialog) {
        const line = game.dialog.lines[game.dialog.lineIdx]
        if (game.dialog.charIdx < line.length) game.dialog.charIdx = Math.min(game.dialog.charIdx + TEXT_SPEED, line.length)
        if (dialogTextRef.current) dialogTextRef.current.textContent = line.substring(0, Math.floor(game.dialog.charIdx))
        if (dialogSpeakerRef.current) dialogSpeakerRef.current.textContent = game.dialog.speaker || 'VDX'
      }

      // Intro text animation
      if (game.intro && game.introStep < INTRO_TEXTS.length) {
        const text = INTRO_TEXTS[game.introStep].text
        if (game.introCharIdx < text.length) game.introCharIdx = Math.min(game.introCharIdx + TEXT_SPEED, text.length)
        if (introTextRef.current) introTextRef.current.textContent = text.substring(0, Math.floor(game.introCharIdx))
      }

      // ==================== UPDATE SYSTEMS ====================
      if (game.scene === 'overworld' && !game.dialog && !game.intro) updateNPCs(map, game.px, game.py)
      particles.update()
      dayNight.update()

      // Spawn particles
      if ((game.scene === 'overworld' || game.scene === 'interior') && game.tick % 3 === 0) {
        if (game.scene === 'overworld') {
          const timePeriod = dayNight.getTimePeriod()
          particles.spawnAmbient(game.camX / SCALE, game.camY / SCALE, viewW / SCALE, viewH / SCALE, timePeriod)
          if (game.tick % 8 === 0) {
            for (const zone of ZONES) particles.spawnChimneySmoke(zone.houseX * TILE, zone.houseY * TILE, TILE)
          }
          if (game.tick % 12 === 0) {
            for (let dy = -5; dy <= 5; dy++) {
              for (let dx = -5; dx <= 5; dx++) {
                const wx = game.px + dx, wy = game.py + dy
                if (wx >= 0 && wy >= 0 && wx < COLS && wy < ROWS && map[wy][wx] === 2) {
                  if (Math.random() > 0.7) particles.spawnWaterRipple(wx * TILE, wy * TILE, TILE)
                  if (Math.random() > 0.85) particles.spawnWaterShimmer(wx * TILE, wy * TILE, TILE, dayNight.getLightLevel())
                }
              }
            }
          }
        }
        if (game.scene === 'interior' && game.interior) {
          const im = game.interior.map
          for (let y = 0; y < game.interior.height; y++) {
            for (let x = 0; x < game.interior.width; x++) {
              if (im[y][x] === IT.TORCH) particles.spawnTorchFlame(x * TILE, y * TILE, TILE)
              if (im[y][x] === IT.ALTAR) {
                const wp = wpRef.current
                const wid = game.interiorZone?.weekId || game.interiorZone?.id
                particles.spawnAltarGlow(x * TILE, y * TILE, TILE, wp[wid]?.unlocked)
              }
            }
          }
        }
      }
      if (game.scene === 'overworld') particles.spawnWeather(viewW, viewH)

      // ==================== RENDER ====================
      const shake = particles.getScreenShake()
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, viewW, viewH)

      ctx.save()
      ctx.translate(shake.x, shake.y)

      if (game.scene === 'overworld' || (game.scene === 'transition' && !game.interior && game.transitionDir === 'in') ||
          (game.scene === 'transition' && game.interior && game.transitionDir === 'out' && game.savedPos)) {
        if (game.scene !== 'transition' || !game.interior) renderOverworld(ctx, viewW, viewH, game, atlas, map)
      }

      if (game.scene === 'interior' || (game.scene === 'transition' && game.interior)) {
        if (game.interior) renderInterior(ctx, viewW, viewH, game, atlas)
      }

      ctx.restore()

      // Day/night overlay
      if (game.scene === 'overworld' || (game.scene === 'transition' && !game.interior)) dayNight.render(ctx, viewW, viewH)

      // Vignette
      if (game.scene === 'overworld' || game.scene === 'interior') {
        renderVignette(ctx, viewW, viewH, game.scene === 'interior' ? 0.5 : 0.3)
      }

      // Weather overlay
      if (game.scene === 'overworld') particles.renderWeather(ctx, viewW, viewH)

      // Screen effects
      particles.renderScreenEffects(ctx, viewW, viewH)

      // Transition iris wipe
      if (game.scene === 'transition') {
        const progress = Math.min(game.transitionFrame / TRANSITION_FRAMES, 1)
        const t = game.transitionDir === 'in' ? progress : (1 - progress)
        const maxRadius = Math.sqrt(viewW * viewW + viewH * viewH) / 2
        const radius = maxRadius * (1 - t)
        ctx.save()
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.rect(0, 0, viewW, viewH)
        ctx.arc(viewW / 2, viewH / 2, Math.max(0, radius), 0, Math.PI * 2, true)
        ctx.fill()
        ctx.restore()
      }

      // Minimap
      if (game.scene === 'overworld' && !game.intro && !game.dialog) {
        minimap.render(ctx, game.px, game.py, NPCS, viewW - 140, 50)
      }
    }

    // ==================== RENDER OVERWORLD ====================
    function renderOverworld(ctx, viewW, viewH, game, atlas, map) {
      const playerPixelX = game.px * TILE * SCALE + game.ox
      const playerPixelY = game.py * TILE * SCALE + game.oy
      const targetCamX = playerPixelX + TILE * SCALE / 2 - viewW / 2
      const targetCamY = playerPixelY + TILE * SCALE / 2 - viewH / 2
      const mapPixelW = COLS * TILE * SCALE
      const mapPixelH = ROWS * TILE * SCALE
      game.camX += (Math.max(0, Math.min(targetCamX, mapPixelW - viewW)) - game.camX) * 0.15
      game.camY += (Math.max(0, Math.min(targetCamY, mapPixelH - viewH)) - game.camY) * 0.15

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

      // Tiles
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          drawSpriteTile(ctx, atlas, map[row][col], col * TILE, row * TILE, game.tick)
        }
      }

      // Tree shadows
      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          if (map[row][col] === 3) drawTreeShadow(ctx, col * TILE, row * TILE)
        }
      }

      // Houses (shadows + sprites)
      for (const zone of ZONES) {
        if (zone.houseX >= startCol - 3 && zone.houseX <= endCol + 3 && zone.houseY >= startRow - 3 && zone.houseY <= endRow + 3) {
          drawHouseShadow(ctx, zone.houseX, zone.houseY)
          drawHouseSprite(ctx, atlas, zone.id, zone.houseX, zone.houseY)
        }
      }

      // Night window glow
      const nightIntensity = dayNight.getTimePeriod() === 'Nuit' ? 1 : dayNight.getTimePeriod() === 'Crepuscule' ? 0.5 : 0
      if (nightIntensity > 0) {
        for (const zone of ZONES) {
          if (zone.houseX >= startCol - 3 && zone.houseX <= endCol + 3) {
            drawWindowGlow(ctx, (zone.houseX + 1) * TILE, (zone.houseY + 2) * TILE, nightIntensity)
            drawWindowGlow(ctx, (zone.houseX + 1) * TILE, (zone.houseY + 3) * TILE, nightIntensity * 0.4)
          }
        }
      }

      // NPCs (shadow + sprite with wander animation)
      for (const npc of NPCS) {
        if (npc.x >= startCol - 2 && npc.x <= endCol + 2 && npc.y >= startRow - 2 && npc.y <= endRow + 2) {
          const nx = npc.x * TILE + (npc.ox || 0)
          const ny = npc.y * TILE + (npc.oy || 0)
          drawCharacterShadow(ctx, nx, ny, 10, 0.2)
          let dir = npc.direction || 'down'
          if (!npc.moving) {
            const dx = game.px - npc.x, dy = game.py - npc.y
            if (Math.abs(dx) + Math.abs(dy) <= 3) {
              dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
            }
          }
          drawNPCSprite(ctx, atlas, npc.sprite, nx, ny, game.tick, dir, npc.walkFrame || 0)
        }
      }

      // Particles (tile-space)
      particles.render(ctx, true)

      // Player (shadow + sprite)
      const pDrawX = game.px * TILE + game.ox / SCALE
      const pDrawY = game.py * TILE + game.oy / SCALE
      drawCharacterShadow(ctx, pDrawX, pDrawY, 12, 0.25)
      drawPlayerSprite(ctx, atlas, game.direction, game.walkFrame, pDrawX, pDrawY)

      ctx.restore() // undo scale

      // Labels
      const wp = wpRef.current
      const qp = qpRef.current
      for (const zone of ZONES) {
        if (zone.houseX >= startCol - 3 && zone.houseX <= endCol + 3 && zone.houseY >= startRow - 3 && zone.houseY <= endRow + 3) {
          const wid = zone.weekId || zone.id
          const weekUnlocked = wp[wid]?.unlocked
          const questUnlocked = !zone.requiredQuest || qp[zone.requiredQuest]
          drawZoneLabel(ctx, zone, zone.houseX * TILE * SCALE, zone.houseY * TILE * SCALE, weekUnlocked && questUnlocked, zone.questId ? qp[zone.questId] : wp[wid]?.completed)
        }
      }
      for (const npc of NPCS) {
        if (npc.x >= startCol - 1 && npc.x <= endCol + 1 && npc.y >= startRow - 1 && npc.y <= endRow + 1) {
          drawNPCLabel(ctx, npc, (npc.x * TILE + (npc.ox || 0)) * SCALE, (npc.y * TILE + (npc.oy || 0)) * SCALE, game.tick)
        }
      }

      // Time display
      ctx.fillStyle = 'rgba(5,5,15,0.7)'
      ctx.beginPath(); ctx.roundRect(viewW - 146, 30, 38, 16, 3); ctx.fill()
      ctx.fillStyle = '#c7b777'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(dayNight.getTimeLabel(), viewW - 127, 41)

      ctx.restore() // undo camera
    }

    // ==================== RENDER INTERIOR ====================
    function renderInterior(ctx, viewW, viewH, game, atlas) {
      const interior = game.interior
      const iw = interior.width * TILE * SCALE
      const ih = interior.height * TILE * SCALE
      const zone = game.interiorZone
      const offX = Math.round((viewW - iw) / 2)
      const offY = Math.round((viewH - ih) / 2)

      ctx.save()
      ctx.translate(offX, offY)
      ctx.save()
      ctx.scale(SCALE, SCALE)

      // Interior tiles
      for (let row = 0; row < interior.height; row++) {
        for (let col = 0; col < interior.width; col++) {
          drawInteriorTile(ctx, atlas, interior.map[row][col], col * TILE, row * TILE, game.tick)
        }
      }

      // Interior particles
      particles.render(ctx, true)

      // Interior NPCs
      if (zone.interiorNpcs) {
        for (const npc of zone.interiorNpcs) {
          drawCharacterShadow(ctx, npc.x * TILE, npc.y * TILE, 10, 0.2)
          let dir = 'down'
          const dx = game.px - npc.x, dy = game.py - npc.y
          if (Math.abs(dx) + Math.abs(dy) <= 3) {
            dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
          }
          drawNPCSprite(ctx, atlas, npc.sprite, npc.x * TILE, npc.y * TILE, game.tick, dir)
        }
      }

      // Guardian NPC
      if (game.guardianActive && !game.guardianDismissed && zone.guardian) {
        const gx = interior.spawnX, gy = interior.height - 2
        drawCharacterShadow(ctx, gx * TILE, gy * TILE, 10, 0.2)
        drawNPCSprite(ctx, atlas, zone.guardian.sprite, gx * TILE, gy * TILE, game.tick, 'up')
      }

      // Player
      const pDrawX = game.px * TILE + game.ox / SCALE
      const pDrawY = game.py * TILE + game.oy / SCALE
      drawCharacterShadow(ctx, pDrawX, pDrawY, 12, 0.25)
      drawPlayerSprite(ctx, atlas, game.direction, game.walkFrame, pDrawX, pDrawY)

      ctx.restore() // undo scale

      // Interior NPC labels
      if (zone.interiorNpcs) {
        for (const npc of zone.interiorNpcs) {
          const npx = npc.x * TILE * SCALE
          const npy = npc.y * TILE * SCALE
          const bob = Math.sin(game.tick * 0.05 + npc.x) * 2

          ctx.fillStyle = '#c7b777'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('!', npx + TILE * SCALE / 2, npy - 4 + bob)

          const nameW = npc.name.length * 5 + 10
          const nameX = npx + TILE * SCALE / 2 - nameW / 2
          const nameY = npy - 16 + bob
          ctx.fillStyle = 'rgba(5,5,15,0.8)'
          ctx.beginPath(); ctx.roundRect(nameX, nameY, nameW, 12, 3); ctx.fill()
          ctx.fillStyle = '#c7b777'
          ctx.font = '8px monospace'
          ctx.fillText(npc.name, npx + TILE * SCALE / 2, nameY + 9)
        }
      }

      // Guardian label
      if (game.guardianActive && !game.guardianDismissed && zone.guardian) {
        const gx = interior.spawnX * TILE * SCALE
        const gy = (interior.height - 2) * TILE * SCALE
        const bob = Math.sin(game.tick * 0.06) * 2
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('!', gx + TILE * SCALE / 2, gy - 6 + bob)
        const gname = zone.guardian.name
        const gnameW = gname.length * 5 + 12
        const gnameX = gx + TILE * SCALE / 2 - gnameW / 2
        const gnameY = gy - 20 + bob
        ctx.fillStyle = 'rgba(5,5,15,0.85)'
        ctx.beginPath(); ctx.roundRect(gnameX, gnameY, gnameW, 12, 3); ctx.fill()
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 8px monospace'
        ctx.fillText(gname, gx + TILE * SCALE / 2, gnameY + 9)
      }

      // Zone name header
      ctx.fillStyle = 'rgba(10,10,25,0.85)'
      ctx.beginPath(); ctx.roundRect(iw / 2 - 100, -30, 200, 24, 6); ctx.fill()
      ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.roundRect(iw / 2 - 100, -30, 200, 24, 6); ctx.stroke()
      ctx.fillStyle = '#c7b777'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
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
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-gradient-to-b from-[#1a1a2e]/95 to-[#0a0a1a]/95 border border-[#c7b777]/60 rounded-lg px-4 py-2.5 shadow-lg shadow-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c7b777] to-[#a89a5e] flex items-center justify-center text-[#0a0a0f] text-xs font-bold shadow-inner">V</div>
            <div>
              <div className="text-[#c7b777] font-mono text-sm font-bold tracking-wide">VDX Quest
                <span className="text-[#c7b777]/50 text-xs ml-1.5 font-normal">Niv.0</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[#c7b777]/60 text-xs font-mono">XP</span>
            <div className="w-24 h-2.5 bg-black/60 rounded-full border border-[#c7b777]/20 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#c7b777] to-[#e0d9a8] rounded-full transition-all duration-500 shadow-sm shadow-[#c7b777]/30" style={{ width: '30%' }} />
            </div>
            <span className="text-[#c7b777]/50 text-xs font-mono">300</span>
          </div>
        </div>
      </div>

      {/* Prompt */}
      {promptText && !showDialog && !showIntro && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="bg-gradient-to-b from-[#1a1a2e]/95 to-[#0a0a1a]/95 border border-[#c7b777]/70 rounded-lg px-5 py-2 shadow-lg shadow-[#c7b777]/10 backdrop-blur-sm">
            <span className="text-[#c7b777] font-mono font-bold text-sm">{promptText}</span>
          </div>
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto z-30">
          <div className="bg-gradient-to-b from-[#12122a]/97 to-[#0a0a1a]/97 border-2 border-[#c7b777]/80 rounded-xl p-5 backdrop-blur-sm shadow-2xl shadow-black/60">
            <div className="bg-gradient-to-r from-[#c7b777] to-[#d4c888] text-[#0a0a0f] font-mono font-bold px-3 py-1 rounded-md inline-block -mt-9 mb-3 text-sm shadow-md shadow-[#c7b777]/30">
              <span ref={dialogSpeakerRef}>...</span>
            </div>
            <p ref={dialogTextRef} className="text-white/90 font-mono text-sm leading-relaxed min-h-[3em]" />
            <div className="text-[#c7b777]/40 text-xs mt-2 text-right font-mono animate-pulse">ESPACE ...</div>
          </div>
        </div>
      )}

      {/* Intro */}
      {showIntro && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0a0a1a]/85 to-black/80 flex flex-col items-center justify-center z-40">
          <div className="mb-1 text-[#c7b777]/30 font-mono text-xs tracking-[0.3em] uppercase">Bienvenue dans</div>
          <h1 className="text-[#c7b777] font-mono text-5xl font-bold mb-1 tracking-wider drop-shadow-[0_0_20px_rgba(199,183,119,0.3)]">VDX QUEST</h1>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#c7b777]/60 to-transparent mb-2" />
          <p className="text-[#a89a5e]/80 font-mono text-sm mb-10 tracking-wide">Vendeur d'Exception - Niveau 0</p>
          <div className="bg-gradient-to-b from-[#12122a]/97 to-[#0a0a1a]/97 border-2 border-[#c7b777]/80 rounded-xl p-5 max-w-lg w-full mx-4 backdrop-blur-sm shadow-2xl shadow-black/60">
            <div className="bg-gradient-to-r from-[#c7b777] to-[#d4c888] text-[#0a0a0f] font-mono font-bold px-3 py-1 rounded-md inline-block -mt-9 mb-3 text-sm shadow-md shadow-[#c7b777]/30">VDX</div>
            <p ref={introTextRef} className="text-white/90 font-mono text-sm leading-relaxed min-h-[2em]" />
            <div className="text-[#c7b777]/40 text-xs mt-3 text-right font-mono animate-pulse">ESPACE ...</div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <MobileControls pressKey={pressKey} onAction={mobileInteract} />
    </div>
  )
}

function MobileControls({ pressKey, onAction }) {
  const btn = (key, label) => (
    <button
      className="w-14 h-14 bg-gradient-to-b from-[#1a1a2e]/90 to-[#0a0a1a]/90 border border-[#c7b777]/40 rounded-xl text-[#c7b777]/80 text-xl font-bold active:bg-[#c7b777]/20 active:border-[#c7b777]/70 select-none touch-none shadow-md shadow-black/30 transition-colors"
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
          className="w-16 h-16 bg-gradient-to-b from-[#c7b777] to-[#a89a5e] border-2 border-[#e0d9a8] rounded-full text-[#0a0a0f] text-sm font-bold active:from-[#e0d9a8] active:to-[#c7b777] select-none touch-none shadow-lg shadow-[#c7b777]/40 transition-all"
          onTouchStart={e => { e.preventDefault(); onAction() }}
          onClick={onAction}
        >A</button>
      </div>
    </div>
  )
}
