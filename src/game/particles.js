// VDX Quest - Particle & Effects System
// Handles torch flames, altar glow, ambient particles, weather, screen effects

const MAX_PARTICLES = 300

export class ParticleSystem {
  constructor() {
    this.particles = []
    this.screenEffects = []
    this.weatherParticles = []
    this.ambientTick = 0
  }

  // Spawn a single particle
  spawn(config) {
    if (this.particles.length >= MAX_PARTICLES) return
    this.particles.push({
      x: config.x,
      y: config.y,
      vx: config.vx || 0,
      vy: config.vy || 0,
      life: config.life || 60,
      maxLife: config.life || 60,
      size: config.size || 2,
      color: config.color || '#ffaa33',
      type: config.type || 'generic',
      alpha: config.alpha || 1,
      gravity: config.gravity || 0,
      friction: config.friction || 1,
      shrink: config.shrink !== undefined ? config.shrink : true,
      glow: config.glow || false,
      glowSize: config.glowSize || 0,
    })
  }

  // Spawn torch flame particles at a tile position
  spawnTorchFlame(tileX, tileY, tileSize) {
    const cx = tileX + tileSize / 2
    const cy = tileY + tileSize * 0.3

    // Core flame
    this.spawn({
      x: cx + (Math.random() - 0.5) * 4,
      y: cy + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.4 - Math.random() * 0.6,
      life: 15 + Math.random() * 15,
      size: 1.5 + Math.random() * 1.5,
      color: Math.random() > 0.4 ? '#ffaa33' : '#ff6600',
      type: 'flame',
      shrink: true,
      glow: true,
      glowSize: 4,
    })

    // Ember sparks
    if (Math.random() > 0.85) {
      this.spawn({
        x: cx + (Math.random() - 0.5) * 6,
        y: cy,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1 - Math.random() * 1.5,
        life: 20 + Math.random() * 20,
        size: 0.5 + Math.random() * 0.8,
        color: '#ffdd44',
        type: 'ember',
        gravity: -0.02,
        shrink: true,
      })
    }
  }

  // Spawn altar glow particles
  spawnAltarGlow(tileX, tileY, tileSize, unlocked) {
    const cx = tileX + tileSize / 2
    const cy = tileY + tileSize / 2
    const color = unlocked ? '#c7b777' : '#444466'

    // Rising glow motes
    this.spawn({
      x: cx + (Math.random() - 0.5) * tileSize,
      y: cy + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.3 - Math.random() * 0.4,
      life: 30 + Math.random() * 30,
      size: 1 + Math.random() * 2,
      color: color,
      type: 'glow',
      shrink: true,
      glow: true,
      glowSize: 6,
      alpha: 0.7,
    })

    // Ground shimmer
    if (Math.random() > 0.7) {
      this.spawn({
        x: cx + (Math.random() - 0.5) * tileSize * 1.5,
        y: cy + tileSize * 0.3 + Math.random() * 4,
        vx: 0,
        vy: -0.1,
        life: 20 + Math.random() * 20,
        size: 0.5 + Math.random(),
        color: unlocked ? '#e0d9a8' : '#555577',
        type: 'shimmer',
        shrink: false,
        alpha: 0.5,
      })
    }
  }

  // Spawn quest completion burst
  spawnCompletionBurst(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 / 30) * i + Math.random() * 0.3
      const speed = 1.5 + Math.random() * 3
      this.spawn({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 30,
        size: 2 + Math.random() * 3,
        color: ['#c7b777', '#e0d9a8', '#ffdd44', '#ffffff'][Math.floor(Math.random() * 4)],
        type: 'burst',
        friction: 0.96,
        gravity: 0.03,
        shrink: true,
        glow: true,
        glowSize: 8,
      })
    }
    this.addScreenEffect('flash', 15)
  }

  // Spawn ambient floating particles (overworld) — changes based on time of day
  spawnAmbient(viewX, viewY, viewW, viewH, timeOfDay) {
    if (this.particles.filter(p => p.type === 'ambient').length > 20) return
    const x = viewX + Math.random() * viewW
    const y = viewY + Math.random() * viewH

    const isNight = timeOfDay === 'Nuit' || timeOfDay === 'Crepuscule'

    if (isNight) {
      // Fireflies at night — warm yellow/green pulsing dots
      this.spawn({
        x, y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        life: 150 + Math.random() * 150,
        size: 1 + Math.random() * 1.5,
        color: Math.random() > 0.4 ? '#ccff44' : '#ffee66',
        type: 'ambient',
        shrink: false,
        alpha: 0.5 + Math.random() * 0.4,
        glow: true,
        glowSize: 5 + Math.random() * 3,
      })
    } else {
      // Daytime — pollen/dust motes
      this.spawn({
        x, y,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.05 - Math.random() * 0.1,
        life: 120 + Math.random() * 120,
        size: 0.8 + Math.random() * 1.2,
        color: Math.random() > 0.5 ? '#c7b777' : '#88aa55',
        type: 'ambient',
        shrink: false,
        alpha: 0.3 + Math.random() * 0.3,
      })
    }
  }

  // Chimney smoke rising from houses
  spawnChimneySmoke(tileX, tileY, tileSize) {
    const cx = tileX + tileSize * 1.5 // center of 3-wide house
    const cy = tileY - 2

    this.spawn({
      x: cx + (Math.random() - 0.5) * 3,
      y: cy,
      vx: 0.1 + Math.random() * 0.15,
      vy: -0.3 - Math.random() * 0.3,
      life: 60 + Math.random() * 40,
      size: 1.5 + Math.random() * 1.5,
      color: '#888888',
      type: 'smoke',
      shrink: false,
      alpha: 0.2 + Math.random() * 0.15,
      gravity: -0.005,
      friction: 0.99,
    })
  }

  // Water shimmer sparkles on water tiles
  spawnWaterShimmer(tileX, tileY, tileSize, lightLevel) {
    if (lightLevel < 0.3) return // no shimmer at night
    const x = tileX + Math.random() * tileSize
    const y = tileY + Math.random() * tileSize

    this.spawn({
      x, y,
      vx: 0, vy: 0,
      life: 8 + Math.random() * 8,
      size: 0.5 + Math.random() * 0.5,
      color: '#ffffff',
      type: 'shimmer',
      shrink: false,
      alpha: 0.4 * lightLevel,
    })
  }

  // Spawn footstep dust
  spawnFootstepDust(x, y, direction) {
    for (let i = 0; i < 3; i++) {
      this.spawn({
        x: x + (Math.random() - 0.5) * 6,
        y: y + 10 + Math.random() * 4,
        vx: (direction === 'left' ? 0.5 : direction === 'right' ? -0.5 : 0) + (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.3,
        life: 10 + Math.random() * 10,
        size: 1 + Math.random() * 1.5,
        color: '#aa9966',
        type: 'dust',
        shrink: true,
        alpha: 0.5,
      })
    }
  }

  // Spawn water ripple effect
  spawnWaterRipple(tileX, tileY, tileSize) {
    const cx = tileX + tileSize / 2
    const cy = tileY + tileSize / 2
    this.spawn({
      x: cx + (Math.random() - 0.5) * tileSize,
      y: cy + (Math.random() - 0.5) * tileSize * 0.5,
      vx: 0, vy: 0,
      life: 25 + Math.random() * 15,
      size: 0.5 + Math.random(),
      color: '#6699cc',
      type: 'ripple',
      shrink: false,
      alpha: 0.4,
    })
  }

  // Screen effects
  addScreenEffect(type, duration) {
    this.screenEffects.push({
      type,
      life: duration,
      maxLife: duration,
    })
  }

  // Weather system
  setWeather(type) {
    this.weatherType = type
  }

  spawnWeather(viewW, viewH) {
    if (!this.weatherType || this.weatherType === 'clear') return
    if (this.weatherParticles.length > 100) return

    if (this.weatherType === 'rain') {
      for (let i = 0; i < 3; i++) {
        this.weatherParticles.push({
          x: Math.random() * viewW,
          y: -10,
          vx: -1,
          vy: 6 + Math.random() * 4,
          life: 80,
          size: 1,
          alpha: 0.3 + Math.random() * 0.2,
        })
      }
    } else if (this.weatherType === 'leaves') {
      if (Math.random() > 0.92) {
        this.weatherParticles.push({
          x: Math.random() * viewW,
          y: -10,
          vx: 0.5 + Math.random(),
          vy: 0.3 + Math.random() * 0.5,
          life: 200 + Math.random() * 200,
          size: 2 + Math.random() * 2,
          alpha: 0.6 + Math.random() * 0.3,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          color: ['#88aa44', '#99bb33', '#77aa55', '#aacc44'][Math.floor(Math.random() * 4)],
        })
      }
    }
  }

  // Update all particles
  update() {
    this.ambientTick++

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life--
      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= p.friction
      p.vy *= p.friction
    }

    // Update screen effects
    for (let i = this.screenEffects.length - 1; i >= 0; i--) {
      this.screenEffects[i].life--
      if (this.screenEffects[i].life <= 0) {
        this.screenEffects.splice(i, 1)
      }
    }

    // Update weather
    for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
      const p = this.weatherParticles[i]
      p.life--
      if (p.life <= 0) {
        this.weatherParticles.splice(i, 1)
        continue
      }
      p.x += p.vx
      p.y += p.vy
      if (p.wobble !== undefined) {
        p.wobble += p.wobbleSpeed
        p.vx += Math.sin(p.wobble) * 0.05
      }
    }
  }

  // Render all particles (called within the scaled context)
  render(ctx, isScaled) {
    for (const p of this.particles) {
      const lifeRatio = p.life / p.maxLife
      const alpha = p.alpha * lifeRatio
      const size = p.shrink ? p.size * lifeRatio : p.size

      if (alpha <= 0 || size <= 0) continue

      ctx.globalAlpha = alpha

      // Glow effect
      if (p.glow && p.glowSize > 0) {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize * lifeRatio)
        gradient.addColorStop(0, p.color + '44')
        gradient.addColorStop(1, p.color + '00')
        ctx.fillStyle = gradient
        ctx.fillRect(p.x - p.glowSize, p.y - p.glowSize, p.glowSize * 2, p.glowSize * 2)
      }

      // Particle body
      ctx.fillStyle = p.color
      if (p.type === 'ripple') {
        ctx.beginPath()
        ctx.arc(p.x, p.y, size * (1 - lifeRatio) * 3 + 0.5, 0, Math.PI * 2)
        ctx.strokeStyle = p.color
        ctx.lineWidth = 0.5
        ctx.globalAlpha = alpha * 0.5
        ctx.stroke()
      } else {
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size)
      }
    }

    ctx.globalAlpha = 1
  }

  // Render weather (called in screen space, not scaled)
  renderWeather(ctx, viewW, viewH) {
    for (const p of this.weatherParticles) {
      const lifeRatio = p.life / (p.life + 50)
      ctx.globalAlpha = p.alpha * lifeRatio

      if (this.weatherType === 'rain') {
        ctx.strokeStyle = '#8899bb'
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2)
        ctx.stroke()
      } else if (this.weatherType === 'leaves') {
        ctx.fillStyle = p.color || '#88aa44'
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.5, p.wobble || 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  // Render screen effects (flash, shake offset)
  getScreenShake() {
    for (const e of this.screenEffects) {
      if (e.type === 'shake') {
        const intensity = (e.life / e.maxLife) * 4
        return {
          x: (Math.random() - 0.5) * intensity,
          y: (Math.random() - 0.5) * intensity,
        }
      }
    }
    return { x: 0, y: 0 }
  }

  renderScreenEffects(ctx, viewW, viewH) {
    for (const e of this.screenEffects) {
      if (e.type === 'flash') {
        const alpha = (e.life / e.maxLife) * 0.6
        ctx.fillStyle = `rgba(199,183,119,${alpha})`
        ctx.fillRect(0, 0, viewW, viewH)
      }
    }
  }
}

// Vignette overlay — darkens edges for cinematic feel
export function renderVignette(ctx, viewW, viewH, intensity) {
  const cx = viewW / 2
  const cy = viewH / 2
  const radius = Math.max(viewW, viewH) * 0.7
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.7, 'rgba(0,0,0,0)')
  grad.addColorStop(1, `rgba(0,0,0,${intensity || 0.4})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, viewW, viewH)
}

// Day/Night cycle system
export class DayNightCycle {
  constructor() {
    this.time = 0.35 // Start at morning (0=midnight, 0.5=noon, 1=midnight)
    this.speed = 0.00005 // Very slow cycle
    this.paused = false
  }

  update() {
    if (this.paused) return
    this.time = (this.time + this.speed) % 1
  }

  // Get the current light level (0=dark, 1=bright)
  getLightLevel() {
    // Sinusoidal curve: peaks at 0.5 (noon), dips at 0/1 (midnight)
    const raw = Math.sin(this.time * Math.PI)
    return Math.max(0.15, raw) // Never fully dark
  }

  // Get overlay color based on time of day
  getOverlay() {
    const t = this.time

    // Dawn (0.2-0.35): warm orange
    if (t >= 0.2 && t < 0.35) {
      const p = (t - 0.2) / 0.15
      return { r: 255, g: 180, b: 100, a: 0.15 * (1 - p) }
    }
    // Day (0.35-0.65): no overlay
    if (t >= 0.35 && t < 0.65) {
      return { r: 0, g: 0, b: 0, a: 0 }
    }
    // Dusk (0.65-0.8): warm orange/red
    if (t >= 0.65 && t < 0.8) {
      const p = (t - 0.65) / 0.15
      return { r: 200, g: 100, b: 50, a: 0.2 * p }
    }
    // Night (0.8-1.0, 0-0.2): dark blue
    let nightProgress
    if (t >= 0.8) nightProgress = (t - 0.8) / 0.2
    else nightProgress = 1 - (t / 0.2)
    return { r: 10, g: 10, b: 40, a: 0.35 * nightProgress }
  }

  // Render the day/night overlay with gradient for sky feel
  render(ctx, viewW, viewH) {
    const overlay = this.getOverlay()
    if (overlay.a <= 0) return

    // Base overlay
    ctx.fillStyle = `rgba(${overlay.r},${overlay.g},${overlay.b},${overlay.a})`
    ctx.fillRect(0, 0, viewW, viewH)

    // Add subtle gradient (darker at top = sky, lighter at bottom = reflected light)
    if (overlay.a > 0.1) {
      const grad = ctx.createLinearGradient(0, 0, 0, viewH)
      grad.addColorStop(0, `rgba(${overlay.r},${overlay.g},${overlay.b},${overlay.a * 0.3})`)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, viewW, viewH)
    }
  }

  // Get time label
  getTimeLabel() {
    const hours = Math.floor(this.time * 24)
    const minutes = Math.floor((this.time * 24 - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  getTimePeriod() {
    const t = this.time
    if (t >= 0.2 && t < 0.35) return 'Aube'
    if (t >= 0.35 && t < 0.65) return 'Jour'
    if (t >= 0.65 && t < 0.8) return 'Crepuscule'
    return 'Nuit'
  }
}

// Minimap renderer
export class Minimap {
  constructor(mapWidth, mapHeight) {
    this.mapW = mapWidth
    this.mapH = mapHeight
    this.canvas = null
    this.ctx = null
    this.generated = false
    this.width = 120
    this.height = 80
  }

  // Generate the minimap texture from the tile map
  generate(map, zones, tileColors) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')

    const scaleX = this.width / this.mapW
    const scaleY = this.height / this.mapH

    // Draw terrain
    for (let y = 0; y < this.mapH; y++) {
      for (let x = 0; x < this.mapW; x++) {
        const tile = map[y][x]
        this.ctx.fillStyle = tileColors[tile] || '#3a6b35'
        this.ctx.fillRect(
          Math.floor(x * scaleX),
          Math.floor(y * scaleY),
          Math.ceil(scaleX) + 1,
          Math.ceil(scaleY) + 1
        )
      }
    }

    // Mark houses
    for (const zone of zones) {
      this.ctx.fillStyle = '#c7b777'
      this.ctx.fillRect(
        Math.floor(zone.houseX * scaleX),
        Math.floor(zone.houseY * scaleY),
        Math.ceil(3 * scaleX),
        Math.ceil(4 * scaleY)
      )
    }

    this.generated = true
  }

  // Render the minimap with player position
  render(ctx, playerX, playerY, npcs, viewX, viewY) {
    if (!this.generated) return

    const mx = viewX
    const my = viewY
    const mw = this.width + 8
    const mh = this.height + 8

    // Background
    ctx.fillStyle = 'rgba(5,5,15,0.85)'
    ctx.beginPath()
    ctx.roundRect(mx, my, mw, mh, 6)
    ctx.fill()

    // Border
    ctx.strokeStyle = '#c7b777'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(mx, my, mw, mh, 6)
    ctx.stroke()

    // Minimap image
    ctx.drawImage(this.canvas, mx + 4, my + 4)

    const scaleX = this.width / this.mapW
    const scaleY = this.height / this.mapH

    // NPC dots
    for (const npc of npcs) {
      ctx.fillStyle = '#88ccff'
      ctx.fillRect(
        mx + 4 + Math.floor(npc.x * scaleX) - 1,
        my + 4 + Math.floor(npc.y * scaleY) - 1,
        2, 2
      )
    }

    // Player dot (blinking)
    const blink = Math.floor(Date.now() / 300) % 2 === 0
    if (blink) {
      ctx.fillStyle = '#ff4444'
    } else {
      ctx.fillStyle = '#ffffff'
    }
    ctx.fillRect(
      mx + 4 + Math.floor(playerX * scaleX) - 2,
      my + 4 + Math.floor(playerY * scaleY) - 2,
      4, 4
    )
  }
}

// Tile color mapping for minimap
export const MINIMAP_TILE_COLORS = {
  0: '#5BB55F',   // GRASS
  1: '#aa9966',   // PATH
  2: '#4488aa',   // WATER
  3: '#2d5a27',   // TREE
  5: '#888888',   // MOUNTAIN
  6: '#88bb55',   // FLOWER
  7: '#8a7a5a',   // BRIDGE
  8: '#6a5a3a',   // FENCE
  9: '#3a7a35',   // DARK_GRASS
  10: '#ccbb88',  // SAND
  17: '#4a8a40',  // TALL_GRASS
  14: '#6a5a3a',  // SIGN
  // House tiles
  30: '#8B4513', 31: '#8B4513', 32: '#8B4513',
  33: '#8B4513', 34: '#8B4513', 35: '#8B4513',
  36: '#D2B48C', 37: '#D2B48C', 38: '#D2B48C',
  39: '#D2B48C', 40: '#5B3E1E', 41: '#D2B48C',
}
