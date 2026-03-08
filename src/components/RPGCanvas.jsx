// ============================================================
// VDX Quest — Game Canvas (FROM ABSOLUTE ZERO)
// ============================================================
// Standalone: just a village with 3 houses, beautiful trees, player
// No NPCs, no quests, no minimap, no HUD, no particles

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadAssets, drawGround, drawTree, drawTreeShadow, drawHouse, drawHouseShadow, drawPlayer, drawShadow, drawInterior, isInteriorSolid, IT, S } from '../game/sprites'
import { COLS, ROWS, T, HOUSES, TREES, generateMap, canMove, getHouseAt, isNearDoor, generateInterior } from '../game/engine'

const SCALE = 3
const MOVE_SPEED = 8
const FADE_FRAMES = 25

export default function RPGCanvas() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    let dead = false, raf

    const map = generateMap()
    let assets = null

    // Game state — zero external dependencies
    const g = {
      px: 14, py: 11, tx: 14, ty: 11,
      ox: 0, oy: 0, moveFrame: 0, moving: false,
      dir: 'down', wf: 0, wt: 0,
      camX: 0, camY: 0,
      keys: {},
      tick: 0,
      scene: 'overworld',
      fadeDir: 'none', fadeFrame: 0, fadeCb: null,
      interior: null, currentHouse: null, savedPos: null,
    }
    gameRef.current = g

    loadAssets().then(a => { assets = a; setLoading(false) })

    // Resize
    function resize() {
      const p = canvas.parentElement
      canvas.width = p.clientWidth; canvas.height = p.clientHeight
      ctx.imageSmoothingEnabled = false
    }
    resize()
    window.addEventListener('resize', resize)

    // Input
    function kd(e) {
      g.keys[e.key] = true
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); interact() }
      if (e.key.startsWith('Arrow')) e.preventDefault()
    }
    function ku(e) { g.keys[e.key] = false }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    // ==================== TRANSITIONS ====================
    function fade(dir, cb) {
      g.scene = 'transition'; g.fadeDir = dir; g.fadeFrame = 0; g.fadeCb = cb
    }

    function enterHouse(house) {
      fade('in', () => {
        g.savedPos = { px: g.px, py: g.py, dir: g.dir }
        const int = generateInterior(house)
        g.interior = int; g.currentHouse = house
        g.px = int.spawnX; g.py = int.spawnY; g.dir = 'up'
        g.moving = false; g.ox = 0; g.oy = 0
        fade('out', () => { g.scene = 'interior' })
      })
    }

    function exitHouse() {
      fade('in', () => {
        g.px = g.savedPos.px; g.py = g.savedPos.py; g.dir = g.savedPos.dir
        g.interior = null; g.currentHouse = null; g.savedPos = null
        g.moving = false; g.ox = 0; g.oy = 0
        fade('out', () => { g.scene = 'overworld' })
      })
    }

    // ==================== INTERACTION ====================
    function interact() {
      if (g.scene === 'transition') return

      if (g.scene === 'overworld') {
        // Check if standing on door or adjacent to door
        let h = getHouseAt(g.px, g.py)
        if (!h) h = isNearDoor(g.px, g.py)
        if (h) { enterHouse(h); return }
      }

      if (g.scene === 'interior') {
        const im = g.interior.map
        if (im[g.py]?.[g.px] === IT.DOORMAT) { exitHouse(); return }
      }
    }

    // ==================== GAME LOOP ====================
    function loop() {
      if (dead) return
      raf = requestAnimationFrame(loop)
      if (!assets) return

      g.tick++
      const vw = canvas.width, vh = canvas.height

      // Transition
      if (g.scene === 'transition') {
        g.fadeFrame++
        if (g.fadeFrame >= FADE_FRAMES) {
          const cb = g.fadeCb; g.fadeCb = null; if (cb) cb()
        }
      }

      // Movement
      const canPlay = g.scene === 'overworld' || g.scene === 'interior'
      if (canPlay) {
        if (!g.moving) {
          let dx = 0, dy = 0
          if (g.keys.ArrowUp || g.keys.z || g.keys.w) { dy = -1; g.dir = 'up' }
          else if (g.keys.ArrowDown || g.keys.s) { dy = 1; g.dir = 'down' }
          else if (g.keys.ArrowLeft || g.keys.q || g.keys.a) { dx = -1; g.dir = 'left' }
          else if (g.keys.ArrowRight || g.keys.d) { dx = 1; g.dir = 'right' }

          if (dx || dy) {
            const nx = g.px + dx, ny = g.py + dy
            let ok = false
            if (g.scene === 'overworld') ok = canMove(map, nx, ny)
            else {
              const im = g.interior
              ok = nx >= 0 && ny >= 0 && nx < im.width && ny < im.height && !isInteriorSolid(im.map[ny][nx])
            }
            if (ok) { g.tx = nx; g.ty = ny; g.moving = true; g.moveFrame = 0 }
          } else {
            g.wf = 0
          }
        }

        if (g.moving) {
          g.moveFrame++
          g.ox = (g.tx - g.px) * S * SCALE * (g.moveFrame / MOVE_SPEED)
          g.oy = (g.ty - g.py) * S * SCALE * (g.moveFrame / MOVE_SPEED)
          g.wt++
          if (g.wt % 6 === 0) g.wf = (g.wf + 1) % 3
          if (g.moveFrame >= MOVE_SPEED) {
            g.px = g.tx; g.py = g.ty
            g.ox = 0; g.oy = 0; g.moving = false; g.moveFrame = 0
          }
        }
      }

      // ==================== RENDER ====================
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(0, 0, vw, vh)

      if (g.scene === 'overworld' || (g.scene === 'transition' && !g.interior)) {
        renderOverworld(ctx, vw, vh)
      }
      if (g.scene === 'interior' || (g.scene === 'transition' && g.interior)) {
        renderInterior(ctx, vw, vh)
      }

      // Fade overlay
      if (g.scene === 'transition') {
        const p = Math.min(g.fadeFrame / FADE_FRAMES, 1)
        const alpha = g.fadeDir === 'in' ? p : (1 - p)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, vw, vh)
        ctx.restore()
      }

      // Prompt
      if (canPlay) {
        let prompt = null
        if (g.scene === 'overworld') {
          let h = getHouseAt(g.px, g.py)
          if (!h) h = isNearDoor(g.px, g.py)
          if (h) prompt = '[ ESPACE ] Entrer dans ' + h.name
        }
        if (g.scene === 'interior' && g.interior.map[g.py]?.[g.px] === IT.DOORMAT) {
          prompt = '[ ESPACE ] Sortir'
        }
        if (prompt) {
          const tw = prompt.length * 7 + 30
          const bx = vw / 2 - tw / 2, by = vh - 70
          ctx.fillStyle = 'rgba(10,10,25,0.88)'
          ctx.beginPath(); ctx.roundRect(bx, by, tw, 30, 6); ctx.fill()
          ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.roundRect(bx, by, tw, 30, 6); ctx.stroke()
          ctx.fillStyle = '#c7b777'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'
          ctx.fillText(prompt, vw / 2, by + 20)
        }
      }
    }

    // ==================== OVERWORLD RENDER ====================
    function renderOverworld(ctx, vw, vh) {
      // Camera follows player
      const ppx = g.px * S * SCALE + g.ox
      const ppy = g.py * S * SCALE + g.oy
      const tcx = ppx + S * SCALE / 2 - vw / 2
      const tcy = ppy + S * SCALE / 2 - vh / 2
      const mw = COLS * S * SCALE, mh = ROWS * S * SCALE
      g.camX += (Math.max(0, Math.min(tcx, mw - vw)) - g.camX) * 0.15
      g.camY += (Math.max(0, Math.min(tcy, mh - vh)) - g.camY) * 0.15
      const cx = Math.round(g.camX), cy = Math.round(g.camY)

      // Visible tile range
      const sc = Math.max(0, Math.floor(cx / (S * SCALE)) - 1)
      const ec = Math.min(COLS, Math.ceil((cx + vw) / (S * SCALE)) + 1)
      const sr = Math.max(0, Math.floor(cy / (S * SCALE)) - 1)
      const er = Math.min(ROWS, Math.ceil((cy + vh) / (S * SCALE)) + 1)

      ctx.save()
      ctx.translate(-cx, -cy)
      ctx.save()
      ctx.scale(SCALE, SCALE)

      // 1. Ground tiles (including grass under houses/trees)
      for (let r = sr; r < er; r++) {
        for (let c = sc; c < ec; c++) {
          const t = map[r][c]
          if (t === T.TREE || t === T.HOUSE) drawGround(ctx, assets, T.GRASS, c * S, r * S, g.tick)
          else if (t === T.DOOR) drawGround(ctx, assets, T.PATH, c * S, r * S, g.tick)
          else drawGround(ctx, assets, t, c * S, r * S, g.tick)
        }
      }

      // 2. House shadows + sprites
      for (const h of HOUSES) {
        if (h.x >= sc - 5 && h.x <= ec + 5 && h.y >= sr - 4 && h.y <= er + 4) {
          drawHouseShadow(ctx, h.x, h.y)
          drawHouse(ctx, assets, h.id, h.x, h.y)
        }
      }

      // 3. Tree shadows
      for (const t of TREES) {
        if (t.x >= sc - 2 && t.x <= ec + 2 && t.y >= sr - 2 && t.y <= er + 2) {
          drawTreeShadow(ctx, t)
        }
      }

      // 4. Y-sorted: trees + player
      // Player's "base" Y = row where feet are
      const playerBaseY = g.py + (g.moving ? (g.ty - g.py) * (g.moveFrame / MOVE_SPEED) : 0)

      // Trees behind player (tree base = tree.y + 2)
      for (const t of TREES) {
        if (t.x >= sc - 2 && t.x <= ec + 2 && t.y >= sr - 3 && t.y <= er + 2) {
          if (t.y + 2 <= playerBaseY) drawTree(ctx, assets, t, g.tick)
        }
      }

      // Player
      const pdx = g.px * S + g.ox / SCALE
      const pdy = g.py * S + g.oy / SCALE
      drawShadow(ctx, pdx, pdy)
      drawPlayer(ctx, assets, g.dir, g.wf, pdx, pdy)

      // Trees in front of player
      for (const t of TREES) {
        if (t.x >= sc - 2 && t.x <= ec + 2 && t.y >= sr - 3 && t.y <= er + 2) {
          if (t.y + 2 > playerBaseY) drawTree(ctx, assets, t, g.tick)
        }
      }

      ctx.restore() // scale

      // House labels
      for (const h of HOUSES) {
        if (h.x >= sc - 5 && h.x <= ec + 5 && h.y >= sr - 4 && h.y <= er + 4) {
          const lx = (h.x + 2.5) * S * SCALE - cx
          const ly = h.y * S * SCALE - cy - 10
          const name = h.name
          const tw = name.length * 5 + 20
          ctx.fillStyle = 'rgba(10,10,25,0.88)'
          ctx.beginPath(); ctx.roundRect(lx - tw / 2, ly, tw, 18, 5); ctx.fill()
          ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.roundRect(lx - tw / 2, ly, tw, 18, 5); ctx.stroke()
          ctx.fillStyle = '#c7b777'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'
          ctx.fillText(name, lx, ly + 13)
        }
      }

      ctx.restore() // translate
    }

    // ==================== INTERIOR RENDER ====================
    function renderInterior(ctx, vw, vh) {
      const int = g.interior
      const iw = int.width * S * SCALE
      const ih = int.height * S * SCALE
      const ox = Math.round((vw - iw) / 2)
      const oy = Math.round((vh - ih) / 2)

      ctx.save()
      ctx.translate(ox, oy)
      ctx.save()
      ctx.scale(SCALE, SCALE)

      // Tiles
      for (let r = 0; r < int.height; r++) {
        for (let c = 0; c < int.width; c++) {
          drawInterior(ctx, assets, int.map[r][c], c * S, r * S, g.tick)
        }
      }

      // Player
      const pdx = g.px * S + g.ox / SCALE
      const pdy = g.py * S + g.oy / SCALE
      drawShadow(ctx, pdx, pdy)
      drawPlayer(ctx, assets, g.dir, g.wf, pdx, pdy)

      ctx.restore() // scale

      // House name banner
      const name = g.currentHouse.name
      const tw = name.length * 7 + 24
      ctx.fillStyle = 'rgba(10,10,25,0.9)'
      ctx.beginPath(); ctx.roundRect(iw / 2 - tw / 2, -30, tw, 24, 6); ctx.fill()
      ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.roundRect(iw / 2 - tw / 2, -30, tw, 24, 6); ctx.stroke()
      ctx.fillStyle = '#c7b777'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
      ctx.fillText(name, iw / 2, -13)

      ctx.restore() // translate
    }

    raf = requestAnimationFrame(loop)

    return () => {
      dead = true; cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Mobile controls helpers
  const pressKey = useCallback((k, v) => { if (gameRef.current) gameRef.current.keys[k] = v }, [])
  const act = useCallback(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })) }, [])

  return (
    <div className="w-full h-full relative bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f] z-50">
          <div className="text-[#c7b777] font-mono text-lg animate-pulse">Chargement du village...</div>
        </div>
      )}

      {/* Mobile D-Pad + Action */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 lg:hidden pointer-events-none z-30">
        <div className="grid grid-cols-3 gap-1 pointer-events-auto">
          <div />
          <MBtn k="ArrowUp" l={'\u25B2'} p={pressKey} />
          <div />
          <MBtn k="ArrowLeft" l={'\u25C0'} p={pressKey} />
          <div className="w-14 h-14" />
          <MBtn k="ArrowRight" l={'\u25B6'} p={pressKey} />
          <div />
          <MBtn k="ArrowDown" l={'\u25BC'} p={pressKey} />
          <div />
        </div>
        <div className="flex items-center pointer-events-auto">
          <button
            className="w-16 h-16 bg-gradient-to-b from-[#c7b777] to-[#a89a5e] border-2 border-[#e0d9a8] rounded-full text-[#0a0a0f] text-sm font-bold select-none touch-none shadow-lg"
            onTouchStart={e => { e.preventDefault(); act() }}
            onClick={act}
          >A</button>
        </div>
      </div>
    </div>
  )
}

function MBtn({ k, l, p }) {
  return (
    <button
      className="w-14 h-14 bg-gradient-to-b from-[#1a1a2e]/90 to-[#0a0a1a]/90 border border-[#c7b777]/40 rounded-xl text-[#c7b777]/80 text-xl font-bold active:bg-[#c7b777]/20 select-none touch-none shadow-md"
      onTouchStart={e => { e.preventDefault(); p(k, true) }}
      onTouchEnd={e => { e.preventDefault(); p(k, false) }}
      onMouseDown={() => p(k, true)}
      onMouseUp={() => p(k, false)}
      onMouseLeave={() => p(k, false)}
    >{l}</button>
  )
}
