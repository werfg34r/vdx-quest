import { useEffect, useRef, useState, useCallback } from 'react'
import {
  TILE, COLS, ROWS, ZONES,
  generateMap, drawTile, drawCharacter, drawZoneLabel,
  getCamera, getAdjacentZone, canMove,
} from '../game/engine'
import { useGameState } from '../hooks/useGameState'

export default function RPGCanvas({ onOpenZone }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    charX: 6, charY: 27,
    direction: 'down',
    frame: 0,
    map: null,
    keys: {},
    moveTimer: 0,
  })
  const { weekProgress } = useGameState()
  const weekProgressRef = useRef(weekProgress)

  useEffect(() => {
    weekProgressRef.current = weekProgress
  }, [weekProgress])

  const [nearZone, setNearZone] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const state = stateRef.current

    state.map = generateMap()

    function resize() {
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Key handling
    function onKeyDown(e) {
      state.keys[e.key] = true
      if (e.key === ' ' || e.key === 'Enter') {
        const zone = getAdjacentZone(state.charX, state.charY)
        if (zone) {
          const wp = weekProgressRef.current
          if (wp[zone.id]?.unlocked) {
            onOpenZone(zone.id)
          }
        }
        e.preventDefault()
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }
    }
    function onKeyUp(e) {
      state.keys[e.key] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    let animId
    let lastTime = 0
    const MOVE_DELAY = 120

    function gameLoop(time) {
      const dt = time - lastTime

      // Movement
      if (dt - state.moveTimer > MOVE_DELAY) {
        let dx = 0, dy = 0
        if (state.keys['ArrowUp'] || state.keys['z'] || state.keys['w']) { dy = -1; state.direction = 'up' }
        else if (state.keys['ArrowDown'] || state.keys['s']) { dy = 1; state.direction = 'down' }
        else if (state.keys['ArrowLeft'] || state.keys['q'] || state.keys['a']) { dx = -1; state.direction = 'left' }
        else if (state.keys['ArrowRight'] || state.keys['d']) { dx = 1; state.direction = 'right' }

        if (dx !== 0 || dy !== 0) {
          const nx = state.charX + dx
          const ny = state.charY + dy
          if (canMove(state.map, nx, ny)) {
            state.charX = nx
            state.charY = ny
            state.frame++
          }
          state.moveTimer = dt
        } else {
          state.direction = 'idle'
        }

        // Check zone proximity
        const zone = getAdjacentZone(state.charX, state.charY)
        setNearZone(zone)
      }

      // Render
      const viewW = canvas.width
      const viewH = canvas.height
      const cam = getCamera(state.charX, state.charY, viewW, viewH)

      ctx.fillStyle = '#1a3d12'
      ctx.fillRect(0, 0, viewW, viewH)

      // Draw visible tiles
      const startCol = Math.floor(cam.x / TILE)
      const startRow = Math.floor(cam.y / TILE)
      const endCol = Math.min(startCol + Math.ceil(viewW / TILE) + 2, COLS)
      const endRow = Math.min(startRow + Math.ceil(viewH / TILE) + 2, ROWS)

      for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            const px = x * TILE - cam.x
            const py = y * TILE - cam.y
            drawTile(ctx, state.map[y][x], px, py)
          }
        }
      }

      // Draw zone labels
      const wp = weekProgressRef.current
      for (const zone of ZONES) {
        const px = zone.x * TILE - cam.x
        const py = zone.y * TILE - cam.y
        const unlocked = wp[zone.id]?.unlocked || false
        const completed = wp[zone.id]?.completed || false
        drawZoneLabel(ctx, zone, px, py, unlocked, completed)
      }

      // Draw character
      const charPx = state.charX * TILE - cam.x
      const charPy = state.charY * TILE - cam.y
      drawCharacter(ctx, charPx, charPy, state.direction, state.frame)

      // Interaction prompt
      if (nearZone) {
        const wp2 = weekProgressRef.current
        const unlocked = wp2[nearZone.id]?.unlocked
        if (unlocked) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)'
          ctx.strokeStyle = '#c7b777'
          ctx.lineWidth = 2
          const promptW = 200
          const promptH = 36
          const px = viewW / 2 - promptW / 2
          const py = viewH - 60
          ctx.beginPath()
          ctx.roundRect(px, py, promptW, promptH, 8)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = '#c7b777'
          ctx.font = 'bold 13px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('Appuie ESPACE pour entrer', viewW / 2, py + 22)
        }
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

  // Public method for mobile controls
  const pressKey = useCallback((key, down) => {
    stateRef.current.keys[key] = down
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
      <MobileControls pressKey={pressKey} onAction={() => {
        const state = stateRef.current
        const zone = getAdjacentZone(state.charX, state.charY)
        if (zone && weekProgressRef.current[zone.id]?.unlocked) {
          onOpenZone(zone.id)
        }
      }} />
    </>
  )
}

function MobileControls({ pressKey, onAction }) {
  const btn = (key, label, className) => (
    <button
      className={`w-14 h-14 bg-black/60 border-2 border-gold/40 rounded-xl text-gold text-xl font-bold active:bg-gold/20 select-none ${className}`}
      onTouchStart={(e) => { e.preventDefault(); pressKey(key, true) }}
      onTouchEnd={(e) => { e.preventDefault(); pressKey(key, false) }}
      onMouseDown={() => pressKey(key, true)}
      onMouseUp={() => pressKey(key, false)}
      onMouseLeave={() => pressKey(key, false)}
    >
      {label}
    </button>
  )

  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 lg:hidden pointer-events-none">
      {/* D-pad */}
      <div className="grid grid-cols-3 gap-1 pointer-events-auto">
        <div />
        {btn('ArrowUp', '\u25B2', '')}
        <div />
        {btn('ArrowLeft', '\u25C0', '')}
        <div />
        {btn('ArrowRight', '\u25B6', '')}
        <div />
        {btn('ArrowDown', '\u25BC', '')}
        <div />
      </div>

      {/* Action button */}
      <div className="flex items-center pointer-events-auto">
        <button
          className="w-16 h-16 bg-gold/80 border-2 border-gold rounded-full text-dark text-sm font-bold active:bg-gold select-none"
          onTouchStart={(e) => { e.preventDefault(); onAction() }}
          onClick={onAction}
        >
          OK
        </button>
      </div>
    </div>
  )
}
