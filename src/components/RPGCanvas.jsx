import { useEffect, useRef, useState, useCallback } from 'react'
import {
  TILE, COLS, ROWS, ZONES, NPCS,
  generateMap, drawTile, drawZoneLabel, drawNPC, drawDialogBox,
  CHAR_FRAMES, getCamera, getAdjacentZone, getAdjacentNPC, canMove,
} from '../game/engine'
import { useGameState } from '../hooks/useGameState'

const MOVE_SPEED = 2.5 // pixels per frame
const TEXT_SPEED = 2 // chars per frame

export default function RPGCanvas({ onOpenZone }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const { weekProgress } = useGameState()
  const wpRef = useRef(weekProgress)
  useEffect(() => { wpRef.current = weekProgress }, [weekProgress])

  const [promptText, setPromptText] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const game = {
      // Character pixel position
      px: 8 * TILE, py: 38 * TILE,
      // Target tile position
      targetTX: 8, targetTY: 38,
      // Current tile
      tileX: 8, tileY: 38,
      direction: 'down',
      moving: false,
      animFrame: 0,
      animTick: 0,
      // Map
      map: generateMap(),
      // Input
      keys: {},
      // Dialog
      dialog: null, // { speaker, lines, lineIndex, charIndex, done }
      // Tick
      tick: 0,
      // Intro
      intro: true,
      introStep: 0,
      introTexts: [
        { speaker: '', text: '...' },
        { speaker: '', text: 'Tu ouvres les yeux.' },
        { speaker: '', text: 'Devant toi, un monde s\'etend. Le Monde VDX.' },
        { speaker: '', text: 'Tu as decide de changer. De passer du reve a l\'action.' },
        { speaker: '', text: '90 jours. 12 epreuves. 3 regions.' },
        { speaker: '', text: 'Ton aventure commence maintenant.' },
      ],
      introCharIdx: 0,
    }
    gameRef.current = game

    function resize() {
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = canvas.parentElement.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function onKeyDown(e) {
      game.keys[e.key] = true

      // Space/Enter = interact or advance dialog
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
      // Intro sequence
      if (game.intro) {
        if (game.introCharIdx < game.introTexts[game.introStep].text.length) {
          game.introCharIdx = game.introTexts[game.introStep].text.length
        } else {
          game.introStep++
          game.introCharIdx = 0
          if (game.introStep >= game.introTexts.length) {
            game.intro = false
          }
        }
        return
      }

      // Dialog active
      if (game.dialog) {
        if (game.dialog.charIndex < game.dialog.lines[game.dialog.lineIndex].length) {
          game.dialog.charIndex = game.dialog.lines[game.dialog.lineIndex].length
        } else {
          game.dialog.lineIndex++
          game.dialog.charIndex = 0
          if (game.dialog.lineIndex >= game.dialog.lines.length) {
            game.dialog = null
          }
        }
        return
      }

      // Check zone interaction
      const zone = getAdjacentZone(game.tileX, game.tileY)
      if (zone) {
        const wp = wpRef.current
        if (wp[zone.id]?.unlocked) {
          onOpenZone(zone.id)
        } else {
          game.dialog = {
            speaker: '',
            lines: ['Cette epreuve est encore verrouillee. Complete la precedente d\'abord.'],
            lineIndex: 0, charIndex: 0,
          }
        }
        return
      }

      // Check NPC interaction
      const npc = getAdjacentNPC(game.tileX, game.tileY)
      if (npc) {
        game.dialog = {
          speaker: npc.name,
          lines: npc.dialog,
          lineIndex: 0, charIndex: 0,
        }
        return
      }
    }

    let animId
    function gameLoop() {
      game.tick++
      const vw = canvas.width
      const vh = canvas.height

      // === UPDATE ===
      if (!game.intro && !game.dialog) {
        if (!game.moving) {
          // Check input for new movement
          let dx = 0, dy = 0
          if (game.keys['ArrowUp'] || game.keys['z'] || game.keys['w']) { dy = -1; game.direction = 'up' }
          else if (game.keys['ArrowDown'] || game.keys['s']) { dy = 1; game.direction = 'down' }
          else if (game.keys['ArrowLeft'] || game.keys['q'] || game.keys['a']) { dx = -1; game.direction = 'left' }
          else if (game.keys['ArrowRight'] || game.keys['d']) { dx = 1; game.direction = 'right' }

          if (dx !== 0 || dy !== 0) {
            const ntx = game.tileX + dx
            const nty = game.tileY + dy
            if (canMove(game.map, ntx, nty)) {
              game.targetTX = ntx
              game.targetTY = nty
              game.moving = true
            }
          }
        }

        if (game.moving) {
          const targetPx = game.targetTX * TILE
          const targetPy = game.targetTY * TILE
          const ddx = targetPx - game.px
          const ddy = targetPy - game.py
          const dist = Math.sqrt(ddx * ddx + ddy * ddy)

          if (dist < MOVE_SPEED) {
            game.px = targetPx
            game.py = targetPy
            game.tileX = game.targetTX
            game.tileY = game.targetTY
            game.moving = false
          } else {
            game.px += (ddx / dist) * MOVE_SPEED
            game.py += (ddy / dist) * MOVE_SPEED
          }

          // Walk animation
          game.animTick++
          if (game.animTick % 8 === 0) {
            game.animFrame = (game.animFrame + 1) % 3
          }
        } else {
          game.animFrame = 0
        }

        // Update prompt
        const zone = getAdjacentZone(game.tileX, game.tileY)
        const npc = getAdjacentNPC(game.tileX, game.tileY)
        if (zone) {
          const wp = wpRef.current
          setPromptText(wp[zone.id]?.unlocked ? '[ ESPACE ] Entrer' : '\u{1F512} Verrouillee')
        } else if (npc) {
          setPromptText('[ ESPACE ] Parler')
        } else {
          setPromptText(null)
        }
      }

      // Dialog text animation
      if (game.dialog) {
        const line = game.dialog.lines[game.dialog.lineIndex]
        if (game.dialog.charIndex < line.length) {
          game.dialog.charIndex = Math.min(game.dialog.charIndex + TEXT_SPEED, line.length)
        }
      }
      if (game.intro && game.introStep < game.introTexts.length) {
        const t = game.introTexts[game.introStep].text
        if (game.introCharIdx < t.length) {
          game.introCharIdx = Math.min(game.introCharIdx + TEXT_SPEED, t.length)
        }
      }

      // === RENDER ===
      const cam = getCamera(game.px + TILE / 2, game.py + TILE / 2, vw, vh)

      // Black background
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, vw, vh)

      // Draw tiles
      const sc = Math.floor(cam.x / TILE)
      const sr = Math.floor(cam.y / TILE)
      const ec = Math.min(sc + Math.ceil(vw / TILE) + 2, COLS)
      const er = Math.min(sr + Math.ceil(vh / TILE) + 2, ROWS)

      for (let y = Math.max(0, sr); y < er; y++) {
        for (let x = Math.max(0, sc); x < ec; x++) {
          drawTile(ctx, game.map[y][x], x * TILE - cam.x, y * TILE - cam.y, game.tick)
        }
      }

      // Draw NPCs
      for (const npc of NPCS) {
        const npx = npc.x * TILE - cam.x
        const npy = npc.y * TILE - cam.y
        if (npx > -TILE && npx < vw + TILE && npy > -TILE && npy < vh + TILE) {
          drawNPC(ctx, npc, npx, npy, game.tick)
        }
      }

      // Draw zone labels
      const wp = wpRef.current
      for (const zone of ZONES) {
        const zpx = zone.x * TILE - cam.x
        const zpy = zone.y * TILE - cam.y
        if (zpx > -100 && zpx < vw + 100 && zpy > -40 && zpy < vh + 40) {
          drawZoneLabel(ctx, zone, zpx, zpy, wp[zone.id]?.unlocked, wp[zone.id]?.completed)
        }
      }

      // Draw character
      const cpx = game.px - cam.x
      const cpy = game.py - cam.y
      const dir = game.moving ? game.direction : game.direction
      const frames = CHAR_FRAMES[dir] || CHAR_FRAMES.down
      frames[game.animFrame](ctx, cpx, cpy)

      // Draw prompt
      if (promptText && !game.dialog && !game.intro) {
        const pw = ctx.measureText(promptText).width + 40
        ctx.fillStyle = 'rgba(5,5,15,0.85)'
        ctx.strokeStyle = '#c7b777'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(vw / 2 - pw / 2, vh - 52, pw, 32, 8)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = '#c7b777'
        ctx.font = 'bold 13px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(promptText, vw / 2, vh - 32)
      }

      // Draw dialog
      if (game.dialog) {
        const line = game.dialog.lines[game.dialog.lineIndex]
        drawDialogBox(ctx, vw, vh, game.dialog.speaker, line, Math.floor(game.dialog.charIndex))
      }

      // Draw intro
      if (game.intro && game.introStep < game.introTexts.length) {
        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillRect(0, 0, vw, vh)

        // Title
        ctx.fillStyle = '#c7b777'
        ctx.font = 'bold 28px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('VDX QUEST', vw / 2, vh / 3)

        ctx.font = '14px monospace'
        ctx.fillStyle = '#a89a5e'
        ctx.fillText('Vendeur d\'Exception - Niveau 0', vw / 2, vh / 3 + 30)

        // Intro text
        const it = game.introTexts[game.introStep]
        drawDialogBox(ctx, vw, vh, it.speaker || 'VDX', it.text, Math.floor(game.introCharIdx))
      }

      animId = requestAnimationFrame(gameLoop)
    }

    animId = requestAnimationFrame(gameLoop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [onOpenZone])

  // Mobile controls
  const pressKey = useCallback((key, down) => {
    if (gameRef.current) gameRef.current.keys[key] = down
  }, [])

  const mobileInteract = useCallback(() => {
    // Simulate space press
    if (gameRef.current) {
      const e = new KeyboardEvent('keydown', { key: ' ' })
      window.dispatchEvent(e)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: 'pixelated' }} />
      <MobileControls pressKey={pressKey} onAction={mobileInteract} />
    </>
  )
}

function MobileControls({ pressKey, onAction }) {
  const btn = (key, label, extra) => (
    <button
      className={`w-14 h-14 bg-black/70 border-2 border-gold/50 rounded-xl text-gold text-xl font-bold active:bg-gold/30 select-none touch-none ${extra || ''}`}
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
          className="w-16 h-16 bg-gold/80 border-2 border-gold rounded-full text-[#0a0a0f] text-sm font-bold active:bg-gold select-none touch-none shadow-lg shadow-gold/30"
          onTouchStart={e => { e.preventDefault(); onAction() }}
          onClick={onAction}
        >A</button>
      </div>
    </div>
  )
}
