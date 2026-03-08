import { MODE, TILE, HOUSES } from './constants.js';
import { loadAssets } from './assets.js';
import { renderWorld, renderInterior, renderDialogue, renderInventory, renderHUD } from './renderer.js';
import { createPlayer, updatePlayer, getNearbyHouse, isAtInteriorDoor } from './player.js';
import { createNPCs, updateNPCs, getNearbyNPC } from './npc.js';
import { createInventory, addItem, hasItem, getEquippedTool } from './inventory.js';
import { createDialogueState, startDialogue, advanceDialogue, updateDialogue } from './dialogue.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let mode = MODE.WORLD;
  let player = createPlayer();
  let npcs = createNPCs();
  let inventory = createInventory();
  let dialogue = createDialogueState();
  let currentHouse = null;
  let frame = 0;
  let keys = {};
  let raf = null;
  let transitioning = false;
  let notifications = [];

  // Give player starter items
  addItem(inventory, 'axe');
  addItem(inventory, 'sword');

  function notify(text, color = '#c7b777') {
    notifications.push({ text, color, age: 0, duration: 180 });
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Keyboard ──
  function onDown(e) {
    keys[e.code] = true;

    // Number keys for inventory slot selection
    if (e.code >= 'Digit1' && e.code <= 'Digit6') {
      inventory.selectedSlot = parseInt(e.code.replace('Digit', '')) - 1;
    }

    // I key toggles inventory
    if (e.code === 'KeyI' || e.code === 'KeyE') {
      e.preventDefault();
      inventory.open = !inventory.open;
      return;
    }

    // Close inventory if open
    if (e.code === 'Escape') {
      if (inventory.open) { inventory.open = false; return; }
      if (dialogue.active) { dialogue.active = false; return; }
    }

    if (e.code === 'Space' && !transitioning) {
      e.preventDefault();

      // If dialogue active, advance it
      if (dialogue.active) {
        advanceDialogue(dialogue);
        return;
      }

      // If inventory open, close it
      if (inventory.open) {
        inventory.open = false;
        return;
      }

      if (mode === MODE.WORLD) {
        // Check NPC interaction first
        const npc = getNearbyNPC(npcs, player.x, player.y);
        if (npc) {
          startDialogue(dialogue, npc);
          return;
        }

        // Check house door
        const h = getNearbyHouse(player);
        if (h) {
          enterHouse(h);
          return;
        }

        // Check world object interaction (trees, rocks)
        tryWorldInteraction();
      } else if (mode === MODE.INTERIOR && isAtInteriorDoor(player)) {
        exitHouse();
      }
    }
  }
  function onUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  function tryWorldInteraction() {
    const tool = getEquippedTool(inventory);
    const ptx = Math.round(player.x / TILE);
    const pty = Math.round(player.y / TILE);

    // For now, just show what tool is equipped
    if (tool === 'axe') {
      player.actionSprite = 'spr_axe';
      player.actionTimer = 30;
      notify('Coup de hache !', '#8BC34A');
      // Collect wood from nearby area
      addItem(inventory, 'wood', 1);
    } else if (tool === 'sword') {
      player.actionSprite = 'spr_attack';
      player.actionTimer = 20;
      notify('Attaque !', '#f44336');
    } else {
      notify('Rien \u00e0 utiliser ici. S\u00e9lectionnez un outil (1-6)', '#aaa');
    }
  }

  function enterHouse(h) {
    transitioning = true;
    currentHouse = h;
    mode = MODE.INTERIOR;
    player.interiorX = 4 * TILE;
    player.interiorY = 5 * TILE;
    player.direction = 'up';
    notify(`Entr\u00e9e dans ${h.name}`);
    setTimeout(() => { transitioning = false; }, 300);
  }

  function exitHouse() {
    transitioning = true;
    mode = MODE.WORLD;
    if (currentHouse) {
      player.x = currentHouse.spawnX;
      player.y = currentHouse.spawnY;
    }
    player.direction = 'down';
    currentHouse = null;
    setTimeout(() => { transitioning = false; }, 300);
  }

  // ── Touch ──
  let touchX = 0, touchY = 0;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchX = t.clientX; touchY = t.clientY;

    // Double tap = interact
    if (e.timeStamp - (canvas._lastTap || 0) < 300) {
      onDown({ code: 'Space', preventDefault() {} });
      setTimeout(() => onUp({ code: 'Space' }), 100);
    }
    canvas._lastTap = e.timeStamp;
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchX, dy = t.clientY - touchY;
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20) keys.ArrowRight = true;
      if (dx < -20) keys.ArrowLeft = true;
    } else {
      if (dy > 20) keys.ArrowDown = true;
      if (dy < -20) keys.ArrowUp = true;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => {
    keys.ArrowLeft = keys.ArrowRight = keys.ArrowUp = keys.ArrowDown = false;
  });

  // ── Game Loop ──
  function loop() {
    frame++;

    // Update dialogue typewriter
    updateDialogue(dialogue);

    // Don't move if dialogue or inventory is open
    if (!dialogue.active && !inventory.open) {
      updatePlayer(player, keys, mode);
    } else {
      player.moving = false;
    }

    // Action timer (axe swing, attack, etc.)
    if (player.actionTimer > 0) {
      player.actionTimer--;
      if (player.actionTimer <= 0) {
        player.actionSprite = null;
      }
    }

    // Update NPCs in world mode
    if (mode === MODE.WORLD) {
      updateNPCs(npcs, player.x, player.y);
    }

    // Update notifications
    for (const n of notifications) n.age++;
    notifications = notifications.filter(n => n.age < n.duration);

    // ── RENDER ──
    if (mode === MODE.WORLD) {
      const cam = renderWorld(ctx, canvas, player, npcs, frame);

      // Door prompts
      if (!dialogue.active && !inventory.open) {
        // NPC prompt
        const nearNPC = getNearbyNPC(npcs, player.x, player.y);
        if (nearNPC) {
          const nsx = nearNPC.currentX * SCALE - cam.cameraX + RS / 2;
          const nsy = nearNPC.currentY * SCALE - cam.cameraY - 20;
          drawPrompt(ctx, nsx, nsy, `ESPACE \u2014 Parler \u00e0 ${nearNPC.name}`);
        }

        // House door prompts
        for (const h of HOUSES) {
          const ptx = player.x / TILE;
          const pty = player.y / TILE;
          const dx = Math.abs(ptx - h.doorX);
          const dy = Math.abs(pty - h.doorY);
          if (dx < 1.8 && dy < 1.8) {
            drawPrompt(ctx,
              h.doorX * TILE * 2 - cam.cameraX,
              h.doorY * TILE * 2 - cam.cameraY - 40,
              `ESPACE \u2014 Entrer dans ${h.name}`
            );
          }
        }
      }
    } else {
      const intOff = renderInterior(ctx, canvas, player, currentHouse, frame);
      if (isAtInteriorDoor(player)) {
        drawPrompt(ctx, canvas.width / 2, intOff.offsetY + 8 * TILE * 2 + 20, 'ESPACE \u2014 Sortir');
      }
    }

    // UI layers
    renderDialogue(ctx, canvas, dialogue);
    renderInventory(ctx, canvas, inventory);
    renderHUD(ctx, canvas, mode, currentHouse, inventory, notifications);

    raf = requestAnimationFrame(loop);
  }

  function drawPrompt(ctx, cx, cy, text) {
    ctx.font = 'bold 11px monospace';
    const tw = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(cx - tw / 2, cy - 4, tw, 22);
    ctx.strokeStyle = '#c7b777';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - tw / 2, cy - 4, tw, 22);
    ctx.fillStyle = '#c7b777';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + 11);
    ctx.textAlign = 'left';
  }

  // Load then start
  loadAssets().then(() => {
    notify('Bienvenue dans Sunnyside World !', '#FFD700');
    notify('Utilisez les fl\u00e8ches ou ZQSD pour vous d\u00e9placer', '#aaa');
    loop();
  });

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    if (raf) cancelAnimationFrame(raf);
  };
}
