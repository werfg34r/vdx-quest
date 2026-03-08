// ============================================================
// VDX Quest — Main Game Canvas (Written from scratch)
// ============================================================
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  TILE, COLS, ROWS, ZONES, NPCS,
  generateMap, drawZoneLabel, drawNPCLabel,
  getAdjacentZone, getAdjacentNPC, getAdjacentInteriorNPC, canMove, updateNPCs,
} from '../game/engine'
import {
  loadSpriteAtlas, drawTile, drawTree, drawTreeShadow,
  drawHouse, drawHouseShadow, drawWindowGlow,
  drawPlayer, drawNPC, drawShadow,
  drawInteriorTile, generateInterior, canMoveInterior, IT,
} from '../game/sprites'
import {
  ParticleSystem, DayNightCycle, Minimap, MINIMAP_TILE_COLORS, renderVignette,
} from '../game/particles'
import { useGameState } from '../hooks/useGameState'

const SCALE = 3
const MOVE_FRAMES = 8
const ANIM_SPEED = 8
const TEXT_SPEED = 0.6
const FADE_FRAMES = 30

const INTRO = [
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
  const dlgTextRef = useRef(null)
  const dlgNameRef = useRef(null)
  const introRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let dead = false, raf

    ctx.imageSmoothingEnabled = false
    const map = generateMap()
    let atlas = null

    const particles = new ParticleSystem()
    const dayNight = new DayNightCycle()
    const minimap = new Minimap(COLS, ROWS)
    particles.setWeather('leaves')

    // ==================== GAME STATE ====================
    const g = {
      px: 18, py: 16, tx: 18, ty: 16,
      ox: 0, oy: 0, moveFrame: 0, moving: false,
      dir: 'down', wf: 0, wt: 0, lastFoot: 0,
      keys: {}, tick: 0, camX: 0, camY: 0,
      scene: 'overworld',
      fadeDir: 'in', fadeFrame: 0, fadeCb: null,
      interior: null, iZone: null, saved: null,
      guardOn: false, guardDone: false,
      dlg: null, intro: true, introIdx: 0, introChar: 0,
    }
    gameRef.current = g

    loadSpriteAtlas().then(a => {
      atlas = a
      minimap.generate(map, ZONES, MINIMAP_TILE_COLORS)
      setLoading(false)
    })

    function resize() {
      const p = canvas.parentElement
      canvas.width = p.clientWidth; canvas.height = p.clientHeight
      ctx.imageSmoothingEnabled = false
    }
    resize()
    window.addEventListener('resize', resize)

    // ==================== INPUT ====================
    function kd(e) {
      g.keys[e.key] = true
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); interact() }
      if (e.key.startsWith('Arrow')) e.preventDefault()
    }
    function ku(e) { g.keys[e.key] = false }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    // ==================== SCENE TRANSITIONS ====================
    function fade(dir, cb) { g.scene = 'transition'; g.fadeDir = dir; g.fadeFrame = 0; g.fadeCb = cb }

    function enterHouse(zone) {
      if (zone.requiredQuest && !qpRef.current[zone.requiredQuest]) {
        const req = ZONES.find(z => z.questId === zone.requiredQuest)
        g.dlg = { speaker: '', lines: ['Cette maison est encore verrouillee.', `Complete d'abord "${req?.name || 'la maison precedente'}".`], li: 0, ci: 0 }
        setShowDialog(true); return
      }
      fade('in', () => {
        g.saved = { px: g.px, py: g.py, dir: g.dir }
        const int = generateInterior(zone)
        g.interior = int; g.iZone = zone
        g.px = int.spawnX; g.py = int.spawnY; g.dir = 'up'
        g.moving = false; g.ox = 0; g.oy = 0
        g.guardOn = false; g.guardDone = false
        g.scene = 'transition'; g.fadeDir = 'out'; g.fadeFrame = 0
        g.fadeCb = () => { g.scene = 'interior' }
      })
    }

    function exitHouse() {
      fade('in', () => {
        g.px = g.saved.px; g.py = g.saved.py; g.dir = g.saved.dir
        g.interior = null; g.iZone = null; g.moving = false; g.ox = 0; g.oy = 0
        g.scene = 'transition'; g.fadeDir = 'out'; g.fadeFrame = 0
        g.fadeCb = () => { g.scene = 'overworld' }
      })
    }

    // ==================== INTERACTION ====================
    function interact() {
      if (g.scene === 'transition') return

      if (g.intro) {
        if (g.introChar < INTRO[g.introIdx].text.length) g.introChar = INTRO[g.introIdx].text.length
        else { g.introIdx++; g.introChar = 0; if (g.introIdx >= INTRO.length) { g.intro = false; setShowIntro(false) } }
        return
      }
      if (g.dlg) {
        const line = g.dlg.lines[g.dlg.li]
        if (g.dlg.ci < line.length) g.dlg.ci = line.length
        else { g.dlg.li++; g.dlg.ci = 0; if (g.dlg.li >= g.dlg.lines.length) { g.dlg = null; setShowDialog(false) } }
        return
      }

      if (g.scene === 'interior') {
        const im = g.interior.map, zone = g.iZone
        const intNpc = getAdjacentInteriorNPC(g.px, g.py, zone.interiorNpcs)
        if (intNpc) { g.dlg = { speaker: intNpc.name, lines: intNpc.dialog, li: 0, ci: 0 }; setShowDialog(true); return }

        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const cx = g.px + dx, cy = g.py + dy
          if (cy >= 0 && cy < g.interior.height && cx >= 0 && cx < g.interior.width && im[cy][cx] === IT.ALTAR) {
            const wid = zone.weekId || zone.id
            if (wpRef.current[wid]?.unlocked) {
              onOpenZone(wid)
              setTimeout(() => { if (zone.questId && qpRef.current[zone.questId] && !g.guardDone) g.guardOn = true }, 500)
            } else { g.dlg = { speaker: '', lines: ['Cette epreuve est encore verrouillee.'], li: 0, ci: 0 }; setShowDialog(true) }
            return
          }
        }

        if (im[g.py]?.[g.px] === IT.DOOR_MAT) {
          if ((g.guardOn || (zone.questId && qpRef.current[zone.questId])) && !g.guardDone && zone.guardian) {
            g.guardOn = true
            g.dlg = { speaker: zone.guardian.name, lines: zone.guardian.dialog, li: 0, ci: 0 }
            setShowDialog(true); g.guardDone = true; return
          }
          exitHouse()
        }
        return
      }

      const zone = getAdjacentZone(g.px, g.py)
      if (zone) { enterHouse(zone); return }
      const npc = getAdjacentNPC(g.px, g.py)
      if (npc) { g.dlg = { speaker: npc.name, lines: npc.dialog, li: 0, ci: 0 }; setShowDialog(true) }
    }

    // ==================== GAME LOOP ====================
    function loop() {
      if (dead) return
      raf = requestAnimationFrame(loop)
      if (!atlas) return

      g.tick++
      const vw = canvas.width, vh = canvas.height

      // Transition
      if (g.scene === 'transition') {
        g.fadeFrame++
        if (g.fadeFrame >= FADE_FRAMES) { const cb = g.fadeCb; g.fadeCb = null; if (cb) cb() }
      }

      // Movement
      const play = (g.scene === 'overworld' || g.scene === 'interior') && !g.intro && !g.dlg
      if (play) {
        if (g.moving) {
          g.moveFrame++
          const p = g.moveFrame / MOVE_FRAMES
          g.ox = (g.tx - g.px) * TILE * SCALE * p
          g.oy = (g.ty - g.py) * TILE * SCALE * p
          g.wt++
          if (g.wt % ANIM_SPEED === 0) g.wf = (g.wf + 1) % 3
          if (g.moveFrame >= MOVE_FRAMES) {
            g.px = g.tx; g.py = g.ty; g.ox = 0; g.oy = 0; g.moving = false; g.moveFrame = 0
            if (g.scene === 'overworld' && g.tick - g.lastFoot > 4 && map[g.py]?.[g.px] === 1) {
              particles.spawnFootstepDust(g.px * TILE + 8, g.py * TILE + 12, g.dir); g.lastFoot = g.tick
            }
          }
        }
        if (!g.moving) {
          let dx = 0, dy = 0
          if (g.keys.ArrowUp || g.keys.z || g.keys.w) { dy = -1; g.dir = 'up' }
          else if (g.keys.ArrowDown || g.keys.s) { dy = 1; g.dir = 'down' }
          else if (g.keys.ArrowLeft || g.keys.q || g.keys.a) { dx = -1; g.dir = 'left' }
          else if (g.keys.ArrowRight || g.keys.d) { dx = 1; g.dir = 'right' }
          if (dx || dy) {
            const nx = g.px + dx, ny = g.py + dy
            let ok = g.scene === 'interior'
              ? canMoveInterior(g.interior.map, nx, ny, g.iZone?.interiorNpcs)
              : canMove(map, nx, ny)
            if (ok && g.scene === 'interior' && g.guardOn && !g.guardDone && g.iZone?.guardian) {
              if (nx === g.interior.spawnX && ny === g.interior.height - 2) ok = false
            }
            if (ok) { g.tx = nx; g.ty = ny; g.moving = true; g.moveFrame = 0 }
          } else g.wf = 0
        }
        // Prompts
        if (g.scene === 'overworld') {
          const z = getAdjacentZone(g.px, g.py), n = getAdjacentNPC(g.px, g.py)
          if (z) setPromptText(z.requiredQuest && !qpRef.current[z.requiredQuest] ? '[ ESPACE ] Verrouillee' : '[ ESPACE ] Entrer')
          else if (n) setPromptText('[ ESPACE ] Parler')
          else setPromptText(null)
        } else if (g.scene === 'interior') {
          const im = g.interior.map
          const n2 = getAdjacentInteriorNPC(g.px, g.py, g.iZone?.interiorNpcs)
          let altar = false
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const cx = g.px + dx, cy = g.py + dy
            if (cy >= 0 && cy < g.interior.height && cx >= 0 && cx < g.interior.width && im[cy][cx] === IT.ALTAR) altar = true
          }
          if (im[g.py]?.[g.px] === IT.DOOR_MAT) setPromptText(g.guardOn && !g.guardDone ? '[ ESPACE ] Parler au Gardien' : '[ ESPACE ] Sortir')
          else if (n2) setPromptText('[ ESPACE ] Parler')
          else if (altar) setPromptText('[ ESPACE ] Valider la mission')
          else setPromptText(null)
        }
      }

      // Guardian check
      if (g.scene === 'interior' && g.iZone && !g.guardOn && !g.guardDone) {
        if (g.iZone.questId && qpRef.current[g.iZone.questId] && g.iZone.guardian) g.guardOn = true
      }

      // Dialog text
      if (g.dlg) {
        const line = g.dlg.lines[g.dlg.li]
        if (g.dlg.ci < line.length) g.dlg.ci = Math.min(g.dlg.ci + TEXT_SPEED, line.length)
        if (dlgTextRef.current) dlgTextRef.current.textContent = line.substring(0, Math.floor(g.dlg.ci))
        if (dlgNameRef.current) dlgNameRef.current.textContent = g.dlg.speaker || 'VDX'
      }
      if (g.intro && g.introIdx < INTRO.length) {
        const t = INTRO[g.introIdx].text
        if (g.introChar < t.length) g.introChar = Math.min(g.introChar + TEXT_SPEED, t.length)
        if (introRef.current) introRef.current.textContent = t.substring(0, Math.floor(g.introChar))
      }

      // ==================== SYSTEMS UPDATE ====================
      if (g.scene === 'overworld' && !g.dlg && !g.intro) updateNPCs(map, g.px, g.py)
      particles.update()
      dayNight.update()

      // Particles
      if ((g.scene === 'overworld' || g.scene === 'interior') && g.tick % 3 === 0) {
        if (g.scene === 'overworld') {
          particles.spawnAmbient(g.camX / SCALE, g.camY / SCALE, vw / SCALE, vh / SCALE, dayNight.getTimePeriod())
          if (g.tick % 8 === 0) for (const z of ZONES) particles.spawnChimneySmoke(z.houseX * TILE, z.houseY * TILE, TILE)
          if (g.tick % 12 === 0) for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
            const wx = g.px + dx, wy = g.py + dy
            if (wx >= 0 && wy >= 0 && wx < COLS && wy < ROWS && map[wy][wx] === 2) {
              if (Math.random() > 0.7) particles.spawnWaterRipple(wx * TILE, wy * TILE, TILE)
              if (Math.random() > 0.85) particles.spawnWaterShimmer(wx * TILE, wy * TILE, TILE, dayNight.getLightLevel())
            }
          }
        }
        if (g.scene === 'interior' && g.interior) {
          const im = g.interior.map
          for (let y = 0; y < g.interior.height; y++) for (let x = 0; x < g.interior.width; x++) {
            if (im[y][x] === IT.TORCH) particles.spawnTorchFlame(x * TILE, y * TILE, TILE)
            if (im[y][x] === IT.ALTAR) particles.spawnAltarGlow(x * TILE, y * TILE, TILE, wpRef.current[g.iZone?.weekId || g.iZone?.id]?.unlocked)
          }
        }
      }
      if (g.scene === 'overworld') particles.spawnWeather(vw, vh)

      // ==================== RENDER ====================
      const shake = particles.getScreenShake()
      ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, vw, vh)
      ctx.save(); ctx.translate(shake.x, shake.y)

      if (g.scene === 'overworld' || (g.scene === 'transition' && !g.interior && g.fadeDir === 'in') ||
          (g.scene === 'transition' && g.interior && g.fadeDir === 'out' && g.saved)) {
        if (g.scene !== 'transition' || !g.interior) renderWorld(ctx, vw, vh)
      }
      if ((g.scene === 'interior' || (g.scene === 'transition' && g.interior)) && g.interior) renderInside(ctx, vw, vh)

      ctx.restore()

      if (g.scene === 'overworld' || (g.scene === 'transition' && !g.interior)) dayNight.render(ctx, vw, vh)
      if (g.scene === 'overworld' || g.scene === 'interior') renderVignette(ctx, vw, vh, g.scene === 'interior' ? 0.5 : 0.3)
      if (g.scene === 'overworld') particles.renderWeather(ctx, vw, vh)
      particles.renderScreenEffects(ctx, vw, vh)

      if (g.scene === 'transition') {
        const pr = Math.min(g.fadeFrame / FADE_FRAMES, 1)
        const t = g.fadeDir === 'in' ? pr : (1 - pr)
        const maxR = Math.sqrt(vw * vw + vh * vh) / 2
        ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath()
        ctx.rect(0, 0, vw, vh); ctx.arc(vw / 2, vh / 2, Math.max(0, maxR * (1 - t)), 0, Math.PI * 2, true)
        ctx.fill(); ctx.restore()
      }

      if (g.scene === 'overworld' && !g.intro && !g.dlg) minimap.render(ctx, g.px, g.py, NPCS, vw - 140, 50)
    }

    // ==================== OVERWORLD RENDER ====================
    function renderWorld(ctx, vw, vh) {
      const ppx = g.px * TILE * SCALE + g.ox, ppy = g.py * TILE * SCALE + g.oy
      const tcx = ppx + TILE * SCALE / 2 - vw / 2, tcy = ppy + TILE * SCALE / 2 - vh / 2
      const mw = COLS * TILE * SCALE, mh = ROWS * TILE * SCALE
      g.camX += (Math.max(0, Math.min(tcx, mw - vw)) - g.camX) * 0.15
      g.camY += (Math.max(0, Math.min(tcy, mh - vh)) - g.camY) * 0.15
      const cx = Math.round(g.camX), cy = Math.round(g.camY)
      const sc = Math.max(0, Math.floor(cx / (TILE * SCALE)) - 1)
      const ec = Math.min(COLS, Math.ceil((cx + vw) / (TILE * SCALE)) + 1)
      const sr = Math.max(0, Math.floor(cy / (TILE * SCALE)) - 1)
      const er = Math.min(ROWS, Math.ceil((cy + vh) / (TILE * SCALE)) + 1)

      ctx.save(); ctx.translate(-cx, -cy)
      ctx.save(); ctx.scale(SCALE, SCALE)

      // Ground tiles
      for (let r = sr; r < er; r++) for (let c = sc; c < ec; c++) drawTile(ctx, atlas, map[r][c], c * TILE, r * TILE, g.tick)

      // Tree shadows, then trees (as 32x32 sprites)
      for (let r = sr; r < er; r++) for (let c = sc; c < ec; c++) {
        if (map[r][c] === 3) drawTreeShadow(ctx, c, r)
      }

      // House shadows + sprites
      for (const z of ZONES) {
        if (z.houseX >= sc - 3 && z.houseX <= ec + 3 && z.houseY >= sr - 3 && z.houseY <= er + 3) {
          drawHouseShadow(ctx, z.houseX, z.houseY)
          drawHouse(ctx, atlas, z.id, z.houseX, z.houseY)
        }
      }

      // Night glow
      const ni = dayNight.getTimePeriod() === 'Nuit' ? 1 : dayNight.getTimePeriod() === 'Crepuscule' ? 0.5 : 0
      if (ni > 0) for (const z of ZONES) {
        drawWindowGlow(ctx, (z.houseX + 1) * TILE, (z.houseY + 2) * TILE, ni)
        drawWindowGlow(ctx, (z.houseX + 1) * TILE, (z.houseY + 3) * TILE, ni * 0.4)
      }

      // Trees (drawn AFTER houses so forest overlaps correctly)
      for (let r = sr; r < er; r++) for (let c = sc; c < ec; c++) {
        if (map[r][c] === 3) drawTree(ctx, atlas, c, r)
      }

      // NPCs
      for (const n of NPCS) {
        if (n.x >= sc - 2 && n.x <= ec + 2 && n.y >= sr - 2 && n.y <= er + 2) {
          const nx = n.x * TILE + (n.ox || 0), ny = n.y * TILE + (n.oy || 0)
          drawShadow(ctx, nx, ny, 10, 0.2)
          let d = n.direction || 'down'
          if (!n.moving) {
            const ddx = g.px - n.x, ddy = g.py - n.y
            if (Math.abs(ddx) + Math.abs(ddy) <= 3) d = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up')
          }
          drawNPC(ctx, atlas, n.sprite, d, n.walkFrame || 0, nx, ny)
        }
      }

      // Particles
      particles.render(ctx, true)

      // Player
      const pdx = g.px * TILE + g.ox / SCALE, pdy = g.py * TILE + g.oy / SCALE
      drawShadow(ctx, pdx, pdy, 12, 0.25)
      drawPlayer(ctx, atlas, g.dir, g.wf, pdx, pdy)

      ctx.restore() // scale

      // Labels
      const wp = wpRef.current, qp = qpRef.current
      for (const z of ZONES) {
        if (z.houseX >= sc - 3 && z.houseX <= ec + 3 && z.houseY >= sr - 3 && z.houseY <= er + 3) {
          const wid = z.weekId || z.id
          const unlk = wp[wid]?.unlocked && (!z.requiredQuest || qp[z.requiredQuest])
          drawZoneLabel(ctx, z, z.houseX * TILE * SCALE, z.houseY * TILE * SCALE, unlk, z.questId ? qp[z.questId] : wp[wid]?.completed)
        }
      }
      for (const n of NPCS) {
        if (n.x >= sc - 1 && n.x <= ec + 1 && n.y >= sr - 1 && n.y <= er + 1) {
          drawNPCLabel(ctx, n, (n.x * TILE + (n.ox || 0)) * SCALE, (n.y * TILE + (n.oy || 0)) * SCALE, g.tick)
        }
      }

      // Time
      ctx.fillStyle = 'rgba(5,5,15,0.7)'; ctx.beginPath(); ctx.roundRect(vw - 146, 30, 38, 16, 3); ctx.fill()
      ctx.fillStyle = '#c7b777'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
      ctx.fillText(dayNight.getTimeLabel(), vw - 127, 41)

      ctx.restore() // camera
    }

    // ==================== INTERIOR RENDER ====================
    function renderInside(ctx, vw, vh) {
      const int = g.interior, zone = g.iZone
      const iw = int.width * TILE * SCALE, ih = int.height * TILE * SCALE
      const ox = Math.round((vw - iw) / 2), oy = Math.round((vh - ih) / 2)

      ctx.save(); ctx.translate(ox, oy)
      ctx.save(); ctx.scale(SCALE, SCALE)

      for (let r = 0; r < int.height; r++) for (let c = 0; c < int.width; c++) drawInteriorTile(ctx, atlas, int.map[r][c], c * TILE, r * TILE, g.tick)

      particles.render(ctx, true)

      if (zone.interiorNpcs) for (const n of zone.interiorNpcs) {
        drawShadow(ctx, n.x * TILE, n.y * TILE, 10, 0.2)
        let d = 'down'
        const ddx = g.px - n.x, ddy = g.py - n.y
        if (Math.abs(ddx) + Math.abs(ddy) <= 3) d = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up')
        drawNPC(ctx, atlas, n.sprite, d, 0, n.x * TILE, n.y * TILE)
      }

      if (g.guardOn && !g.guardDone && zone.guardian) {
        const gx = int.spawnX, gy = int.height - 2
        drawShadow(ctx, gx * TILE, gy * TILE, 10, 0.2)
        drawNPC(ctx, atlas, zone.guardian.sprite, 'up', 0, gx * TILE, gy * TILE)
      }

      const pdx = g.px * TILE + g.ox / SCALE, pdy = g.py * TILE + g.oy / SCALE
      drawShadow(ctx, pdx, pdy, 12, 0.25)
      drawPlayer(ctx, atlas, g.dir, g.wf, pdx, pdy)

      ctx.restore() // scale

      // Interior NPC labels
      if (zone.interiorNpcs) for (const n of zone.interiorNpcs) {
        const npx = n.x * TILE * SCALE, npy = n.y * TILE * SCALE
        const bob = Math.sin(g.tick * 0.05 + n.x) * 2
        ctx.fillStyle = '#c7b777'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('!', npx + TILE * SCALE / 2, npy - 4 + bob)
        const nw = n.name.length * 5 + 10, nx = npx + TILE * SCALE / 2 - nw / 2, ny = npy - 16 + bob
        ctx.fillStyle = 'rgba(5,5,15,0.8)'; ctx.beginPath(); ctx.roundRect(nx, ny, nw, 12, 3); ctx.fill()
        ctx.fillStyle = '#c7b777'; ctx.font = '8px monospace'
        ctx.fillText(n.name, npx + TILE * SCALE / 2, ny + 9)
      }

      if (g.guardOn && !g.guardDone && zone.guardian) {
        const gx = int.spawnX * TILE * SCALE, gy = (int.height - 2) * TILE * SCALE
        const bob = Math.sin(g.tick * 0.06) * 2
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('!', gx + TILE * SCALE / 2, gy - 6 + bob)
        const gn = zone.guardian.name, gnw = gn.length * 5 + 12
        const gnx = gx + TILE * SCALE / 2 - gnw / 2, gny = gy - 20 + bob
        ctx.fillStyle = 'rgba(5,5,15,0.85)'; ctx.beginPath(); ctx.roundRect(gnx, gny, gnw, 12, 3); ctx.fill()
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 8px monospace'
        ctx.fillText(gn, gx + TILE * SCALE / 2, gny + 9)
      }

      ctx.fillStyle = 'rgba(10,10,25,0.85)'; ctx.beginPath(); ctx.roundRect(iw / 2 - 100, -30, 200, 24, 6); ctx.fill()
      ctx.strokeStyle = '#c7b777'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(iw / 2 - 100, -30, 200, 24, 6); ctx.stroke()
      ctx.fillStyle = '#c7b777'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
      ctx.fillText(zone.name, iw / 2, -14)

      ctx.restore() // translate
    }

    raf = requestAnimationFrame(loop)
    return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', resize) }
  }, [onOpenZone])

  const pressKey = useCallback((k, v) => { if (gameRef.current) gameRef.current.keys[k] = v }, [])
  const mobileAct = useCallback(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })) }, [])

  return (
    <div className="w-full h-full relative bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f] z-50">
          <div className="text-[#c7b777] font-mono text-lg animate-pulse">Chargement...</div>
        </div>
      )}

      <div className="absolute top-3 left-3 z-10">
        <div className="bg-gradient-to-b from-[#1a1a2e]/95 to-[#0a0a1a]/95 border border-[#c7b777]/60 rounded-lg px-4 py-2.5 shadow-lg shadow-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c7b777] to-[#a89a5e] flex items-center justify-center text-[#0a0a0f] text-xs font-bold shadow-inner">V</div>
            <div className="text-[#c7b777] font-mono text-sm font-bold tracking-wide">VDX Quest <span className="text-[#c7b777]/50 text-xs ml-1.5 font-normal">Niv.0</span></div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[#c7b777]/60 text-xs font-mono">XP</span>
            <div className="w-24 h-2.5 bg-black/60 rounded-full border border-[#c7b777]/20 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#c7b777] to-[#e0d9a8] rounded-full transition-all duration-500" style={{ width: '30%' }} />
            </div>
            <span className="text-[#c7b777]/50 text-xs font-mono">300</span>
          </div>
        </div>
      </div>

      {promptText && !showDialog && !showIntro && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="bg-gradient-to-b from-[#1a1a2e]/95 to-[#0a0a1a]/95 border border-[#c7b777]/70 rounded-lg px-5 py-2 shadow-lg backdrop-blur-sm">
            <span className="text-[#c7b777] font-mono font-bold text-sm">{promptText}</span>
          </div>
        </div>
      )}

      {showDialog && (
        <div className="absolute bottom-4 left-4 right-4 max-w-2xl mx-auto z-30">
          <div className="bg-gradient-to-b from-[#12122a]/97 to-[#0a0a1a]/97 border-2 border-[#c7b777]/80 rounded-xl p-5 backdrop-blur-sm shadow-2xl">
            <div className="bg-gradient-to-r from-[#c7b777] to-[#d4c888] text-[#0a0a0f] font-mono font-bold px-3 py-1 rounded-md inline-block -mt-9 mb-3 text-sm">
              <span ref={dlgNameRef}>...</span>
            </div>
            <p ref={dlgTextRef} className="text-white/90 font-mono text-sm leading-relaxed min-h-[3em]" />
            <div className="text-[#c7b777]/40 text-xs mt-2 text-right font-mono animate-pulse">ESPACE ...</div>
          </div>
        </div>
      )}

      {showIntro && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#0a0a1a]/85 to-black/80 flex flex-col items-center justify-center z-40">
          <div className="mb-1 text-[#c7b777]/30 font-mono text-xs tracking-[0.3em] uppercase">Bienvenue dans</div>
          <h1 className="text-[#c7b777] font-mono text-5xl font-bold mb-1 tracking-wider drop-shadow-[0_0_20px_rgba(199,183,119,0.3)]">VDX QUEST</h1>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#c7b777]/60 to-transparent mb-2" />
          <p className="text-[#a89a5e]/80 font-mono text-sm mb-10 tracking-wide">Vendeur d'Exception - Niveau 0</p>
          <div className="bg-gradient-to-b from-[#12122a]/97 to-[#0a0a1a]/97 border-2 border-[#c7b777]/80 rounded-xl p-5 max-w-lg w-full mx-4 backdrop-blur-sm shadow-2xl">
            <div className="bg-gradient-to-r from-[#c7b777] to-[#d4c888] text-[#0a0a0f] font-mono font-bold px-3 py-1 rounded-md inline-block -mt-9 mb-3 text-sm">VDX</div>
            <p ref={introRef} className="text-white/90 font-mono text-sm leading-relaxed min-h-[2em]" />
            <div className="text-[#c7b777]/40 text-xs mt-3 text-right font-mono animate-pulse">ESPACE ...</div>
          </div>
        </div>
      )}

      <MobileControls pressKey={pressKey} onAction={mobileAct} />
    </div>
  )
}

function MobileControls({ pressKey, onAction }) {
  const btn = (key, label) => (
    <button
      className="w-14 h-14 bg-gradient-to-b from-[#1a1a2e]/90 to-[#0a0a1a]/90 border border-[#c7b777]/40 rounded-xl text-[#c7b777]/80 text-xl font-bold active:bg-[#c7b777]/20 select-none touch-none shadow-md"
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
        <div />{btn('ArrowUp', '\u25B2')}<div />
        {btn('ArrowLeft', '\u25C0')}<div className="w-14 h-14" />{btn('ArrowRight', '\u25B6')}
        <div />{btn('ArrowDown', '\u25BC')}<div />
      </div>
      <div className="flex items-center pointer-events-auto">
        <button className="w-16 h-16 bg-gradient-to-b from-[#c7b777] to-[#a89a5e] border-2 border-[#e0d9a8] rounded-full text-[#0a0a0f] text-sm font-bold select-none touch-none shadow-lg"
          onTouchStart={e => { e.preventDefault(); onAction() }} onClick={onAction}>A</button>
      </div>
    </div>
  )
}
