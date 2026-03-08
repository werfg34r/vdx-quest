import { useEffect, useRef, useState, useCallback } from 'react'
import {
  TILE, COLS, ROWS, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel,
  getAdjacentZone, getAdjacentNPC, canMove,
} from '../game/engine'
import {
  loadSpriteAtlas, drawSpriteTile, drawPlayerSprite, drawNPCSprite,
  drawInteriorTile, generateInterior, canMoveInterior, IT,
} from '../game/sprites'
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
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let cancelled = false
    let animId

    ctx.imageSmoothingEnabled = false

    const map = generateMap()
    let atlas = null

    // Game state
    const game = {
      // Player position
      px: 14, py: 20,
      tx: 14, ty: 20,
      ox: 0, oy: 0,
      moveFrame: 0,
      moving: false,
      direction: 'down',
      walkFrame: 0,
      walkTick: 0,
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
      // Dialog
      dialog: null,
      intro: true,
      introStep: 0,
      introCharIdx: 0,
    }
    gameRef.current = game

    loadSpriteAtlas().then(a => {
      atlas = a
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

    // Enter a building
    function enterBuilding(zone) {
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
        // Check if near altar
        const { px, py } = game
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const cx = px + dx, cy = py + dy
            if (cy >= 0 && cy < game.interior.height && cx >= 0 && cx < game.interior.width) {
              if (im[cy][cx] === IT.ALTAR) {
                const zone = game.interiorZone
                const wp = wpRef.current
                if (wp[zone.id]?.unlocked) {
                  onOpenZone(zone.id)
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
        // Check if at door mat (exit)
        if (im[py]?.[px] === IT.DOOR_MAT) {
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
          if (game.transitionCallback) {
            game.transitionCallback()
            game.transitionCallback = null
          }
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
            const canMoveHere = game.scene === 'interior'
              ? canMoveInterior(game.interior.map, ntx, nty)
              : canMove(map, ntx, nty)
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
            setPromptText('[ ESPACE ] Entrer')
          } else if (npc) {
            setPromptText('[ ESPACE ] Parler')
          } else {
            setPromptText(null)
          }
        } else if (game.scene === 'interior') {
          // Check near altar
          let nearAltar = false
          let nearDoor = false
          const im = game.interior.map
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const cx = game.px + dx, cy = game.py + dy
              if (cy >= 0 && cy < game.interior.height && cx >= 0 && cx < game.interior.width) {
                if (im[cy][cx] === IT.ALTAR) nearAltar = true
                if (im[cy][cx] === IT.DOOR_MAT) nearDoor = true
              }
            }
          }
          if (im[game.py]?.[game.px] === IT.DOOR_MAT) {
            setPromptText('[ ESPACE ] Sortir')
          } else if (nearAltar) {
            setPromptText('[ ESPACE ] Charger l\'epreuve')
          } else {
            setPromptText(null)
          }
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

      // ==================== RENDER ====================
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, viewW, viewH)

      if (game.scene === 'overworld' || (game.scene === 'transition' && !game.interior && game.transitionDir === 'in') ||
          (game.scene === 'transition' && game.interior && game.transitionDir === 'out' && game.savedPos)) {
        // Only render overworld if we're showing it (not yet switched to interior)
        if (game.scene !== 'transition' || !game.interior) {
          renderOverworld(ctx, viewW, viewH, game, atlas, map)
        }
      }

      if (game.scene === 'interior' || (game.scene === 'transition' && game.interior)) {
        if (game.interior) {
          renderInterior(ctx, viewW, viewH, game, atlas)
        }
      }

      // Transition overlay
      if (game.scene === 'transition') {
        const progress = Math.min(game.transitionFrame / TRANSITION_FRAMES, 1)
        const alpha = game.transitionDir === 'in' ? progress : (1 - progress)
        ctx.fillStyle = `rgba(0,0,0,${alpha})`
        ctx.fillRect(0, 0, viewW, viewH)
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

      // Draw player
      const pDrawX = game.px * TILE + game.ox / SCALE
      const pDrawY = game.py * TILE + game.oy / SCALE
      drawPlayerSprite(ctx, atlas, game.direction, game.walkFrame, pDrawX, pDrawY)

      ctx.restore() // undo scale

      // Labels
      const wp = wpRef.current
      for (const zone of ZONES) {
        if (zone.houseX >= startCol - 3 && zone.houseX <= endCol + 3 && zone.houseY >= startRow - 3 && zone.houseY <= endRow + 3) {
          drawZoneLabel(ctx, zone, zone.houseX * TILE * SCALE, zone.houseY * TILE * SCALE, wp[zone.id]?.unlocked, wp[zone.id]?.completed)
        }
      }
      for (const npc of NPCS) {
        if (npc.x >= startCol - 1 && npc.x <= endCol + 1 && npc.y >= startRow - 1 && npc.y <= endRow + 1) {
          drawNPCLabel(ctx, npc, npc.x * TILE * SCALE, npc.y * TILE * SCALE, game.tick)
        }
      }

      ctx.restore() // undo camera
    }

    function renderInterior(ctx, viewW, viewH, game, atlas) {
      const interior = game.interior
      const iw = interior.width * TILE * SCALE
      const ih = interior.height * TILE * SCALE

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

      // Draw player
      const pDrawX = game.px * TILE + game.ox / SCALE
      const pDrawY = game.py * TILE + game.oy / SCALE
      drawPlayerSprite(ctx, atlas, game.direction, game.walkFrame, pDrawX, pDrawY)

      ctx.restore() // undo scale

      // Zone name header
      const zone = game.interiorZone
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
