// ═══════════════════════════════════════════════════════
// GAME ENGINE - Main loop & system integration
// ═══════════════════════════════════════════════════════
import {
  MODE, TILE, SCALE, RS, HOUSES, TOOLS, SHOP_ITEMS, ITEM_TYPES,
  TIME_SPEED, SKELETON, DAWN_START, DAY_START, DUSK_START, NIGHT_START,
} from './constants.js';
import { loadAssets } from './assets.js';
import {
  renderWorld, renderInterior, renderDialogue, renderInventory,
  renderHUD, renderShop, renderDeathScreen, renderDayNight,
  renderEnemies, renderWorldObjects, renderFarmPlots,
} from './renderer.js';
import {
  createPlayer, updatePlayer, getNearbyHouse, isAtInteriorDoor,
  isNearBed, damagePlayer, useStamina, restPlayer, respawnPlayer,
} from './player.js';
import { createNPCs, updateNPCs, getNearbyNPC } from './npc.js';
import {
  createInventory, getSelectedTool, addItem, addTool, hasTool,
  removeItem, hasItem, sellItem, seedToCrop, getFirstSeed, getItemCount,
} from './inventory.js';
import {
  createDialogueState, startDialogue, advanceDialogue,
  updateDialogue, closeShop,
} from './dialogue.js';
import {
  createEnemies, spawnEnemies, updateEnemies,
  damageEnemy, getAttackingEnemy, getEnemyInRange,
} from './combat.js';
import {
  createFarmPlots, tillPlot, plantCrop, waterPlot,
  growCrops, harvestCrop, getNearbyPlot,
} from './farming.js';
import {
  createWorldObjects, hitObject, updateWorldObjects, getNearbyObject,
} from './world-objects.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ── Game State ──
  let mode = MODE.WORLD;
  let player = createPlayer();
  let npcs = createNPCs();
  let inventory = createInventory();
  let dialogue = createDialogueState();
  let enemies = createEnemies();
  let farmPlots = createFarmPlots();
  let worldObjects = createWorldObjects();
  let currentHouse = null;
  let frame = 0;
  let keys = {};
  let raf = null;
  let transitioning = false;
  let notifications = [];
  let screenShake = 0;

  // Time system
  let gameTime = { hour: 8, minute: 0, day: 1 };
  let lastTimestamp = 0;

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

  // ── Input ──
  function onDown(e) {
    keys[e.code] = true;

    // Tool selection with number keys
    if (e.code >= 'Digit1' && e.code <= 'Digit9') {
      const idx = parseInt(e.code.replace('Digit', '')) - 1;
      if (idx < inventory.tools.length) {
        inventory.selectedTool = idx;
      }
    }

    if (e.code === 'KeyI' || e.code === 'KeyE') {
      e.preventDefault();
      if (dialogue.shopOpen) return;
      inventory.open = !inventory.open;
      return;
    }

    if (e.code === 'Escape') {
      if (dialogue.shopOpen) { closeShop(dialogue); return; }
      if (inventory.open) { inventory.open = false; return; }
      if (dialogue.active) { dialogue.active = false; return; }
    }

    // Shop navigation
    if (dialogue.shopOpen) {
      e.preventDefault();
      handleShopInput(e.code);
      return;
    }

    // Death screen
    if (player.dead && player.deathTimer > 60 && e.code === 'Space') {
      respawnPlayer(player);
      mode = MODE.WORLD;
      enemies.length = 0;
      notify('Vous vous reveillez...', '#aaa');
      return;
    }

    if (e.code === 'Space' && !transitioning && !player.dead) {
      e.preventDefault();

      if (dialogue.active) {
        advanceDialogue(dialogue);
        return;
      }
      if (inventory.open) { inventory.open = false; return; }

      if (mode === MODE.WORLD) {
        handleWorldAction();
      } else if (mode === MODE.INTERIOR) {
        handleInteriorAction();
      }
    }
  }

  function onUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  // ── Shop Input ──
  function handleShopInput(code) {
    if (code === 'ArrowUp' || code === 'KeyW' || code === 'KeyZ') {
      dialogue.shopCursor = Math.max(0, dialogue.shopCursor - 1);
    }
    if (code === 'ArrowDown' || code === 'KeyS') {
      const maxItems = dialogue.shopTab === 'buy'
        ? SHOP_ITEMS.length - 1
        : inventory.items.length - 1;
      dialogue.shopCursor = Math.min(Math.max(0, maxItems), dialogue.shopCursor + 1);
    }
    if (code === 'Tab' || code === 'ArrowLeft' || code === 'ArrowRight') {
      dialogue.shopTab = dialogue.shopTab === 'buy' ? 'sell' : 'buy';
      dialogue.shopCursor = 0;
    }
    if (code === 'Space' || code === 'Enter') {
      if (dialogue.shopTab === 'buy') {
        const item = SHOP_ITEMS[dialogue.shopCursor];
        if (item && player.gold >= item.price) {
          if (item.type === 'tool') {
            if (hasTool(inventory, item.id)) {
              notify('Vous avez deja cet outil !', '#f44336');
            } else {
              player.gold -= item.price;
              addTool(inventory, item.id);
              notify(`Achete: ${item.name}`, '#4CAF50');
            }
          } else {
            player.gold -= item.price;
            addItem(inventory, item.id, item.count || 1);
            notify(`Achete: ${item.name}`, '#4CAF50');
          }
        } else if (item) {
          notify('Pas assez d\'or !', '#f44336');
        }
      } else {
        // Sell
        const slot = inventory.items[dialogue.shopCursor];
        if (slot) {
          const earned = sellItem(inventory, player, slot.type);
          if (earned > 0) {
            notify(`Vendu pour ${earned}G`, '#FFD700');
            if (dialogue.shopCursor >= inventory.items.length) {
              dialogue.shopCursor = Math.max(0, inventory.items.length - 1);
            }
          }
        }
      }
    }
  }

  // ── World Action (SPACE) ──
  function handleWorldAction() {
    // 1. NPC interaction
    const npc = getNearbyNPC(npcs, player.x, player.y);
    if (npc) {
      startDialogue(dialogue, npc);
      return;
    }

    // 2. House door
    const h = getNearbyHouse(player);
    if (h) {
      enterHouse(h);
      return;
    }

    // 3. Tool-based actions
    const toolId = getSelectedTool(inventory);
    if (!toolId) {
      notify('Selectionnez un outil (1-6)', '#aaa');
      return;
    }

    const toolDef = TOOLS[toolId];
    if (!toolDef) return;

    // Check stamina
    if (!useStamina(player, toolDef.staminaCost)) {
      notify('Pas assez d\'energie ! Dormez dans un lit.', '#f44336');
      return;
    }

    // Set action animation
    player.actionSprite = toolDef.action;
    player.actionTimer = toolDef.frames;

    // Sword → attack enemies
    if (toolId === 'sword') {
      const enemy = getEnemyInRange(enemies, player.x, player.y, player.direction);
      if (enemy) {
        const result = damageEnemy(enemy, toolDef.damage);
        if (result) {
          screenShake = 8;
          for (const drop of result.drops) {
            addItem(inventory, drop.item, drop.count);
            notify(`+${drop.count} ${ITEM_TYPES[drop.item]?.name || drop.item}`, '#4CAF50');
          }
          if (result.gold > 0) {
            player.gold += result.gold;
            notify(`+${result.gold}G`, '#FFD700');
          }
        }
      } else {
        notify('Attaque !', '#f44336');
      }
      return;
    }

    // Axe/Pickaxe/Rod → world objects
    if (toolId === 'axe' || toolId === 'pickaxe' || toolId === 'rod') {
      const obj = getNearbyObject(worldObjects, player.x, player.y, toolId);
      if (obj) {
        const result = hitObject(obj, toolId);
        if (result && result.item) {
          addItem(inventory, result.item, result.count);
          notify(`+${result.count} ${ITEM_TYPES[result.item]?.name || result.item}`, '#4CAF50');
          screenShake = 4;
        } else if (result) {
          notify('Encore un coup...', '#aaa');
        }
      } else {
        const objName = toolId === 'axe' ? 'arbre' : toolId === 'pickaxe' ? 'rocher' : "point d'eau";
        notify(`Pas de ${objName} a portee`, '#aaa');
      }
      return;
    }

    // Shovel → till farm plot
    if (toolId === 'shovel') {
      const plot = getNearbyPlot(farmPlots, player.x, player.y);
      if (plot) {
        if (tillPlot(plot)) {
          notify('Terre labouree !', '#8B5E3C');
        } else if (plot.state === 'tilled') {
          // Try to plant if we have seeds
          const seed = getFirstSeed(inventory);
          if (seed) {
            const cropType = seedToCrop(seed.type);
            if (cropType && plantCrop(plot, cropType)) {
              removeItem(inventory, seed.type, 1);
              notify(`${ITEM_TYPES[seed.type]?.name} plantee !`, '#4CAF50');
            }
          } else {
            notify('Pas de graines. Achetez-en chez Sophie !', '#aaa');
          }
        } else if (plot.state === 'harvestable') {
          const result = harvestCrop(plot);
          if (result) {
            addItem(inventory, result.item, result.count);
            notify(`Recolte: +${result.count} ${ITEM_TYPES[result.item]?.name}`, '#FFD700');
          }
        } else {
          notify('Cette parcelle pousse...', '#aaa');
        }
      } else {
        notify('Pas de parcelle a portee', '#aaa');
      }
      return;
    }

    // Watering can → water plot
    if (toolId === 'water') {
      const plot = getNearbyPlot(farmPlots, player.x, player.y);
      if (plot && waterPlot(plot)) {
        notify('Arrose !', '#2196F3');
      } else if (plot && plot.state === 'harvestable') {
        const result = harvestCrop(plot);
        if (result) {
          addItem(inventory, result.item, result.count);
          notify(`Recolte: +${result.count} ${ITEM_TYPES[result.item]?.name}`, '#FFD700');
        }
      } else {
        notify('Rien a arroser ici', '#aaa');
      }
      return;
    }
  }

  // ── Interior Action ──
  function handleInteriorAction() {
    if (isAtInteriorDoor(player)) {
      exitHouse();
      return;
    }
    if (isNearBed(player)) {
      restPlayer(player);
      // Advance time to morning
      gameTime.hour = 7;
      gameTime.minute = 0;
      gameTime.day++;
      notify('Bonne nuit... Jour ' + gameTime.day, '#9C27B0');
      notify('Vie et energie restaurees !', '#4CAF50');
      return;
    }
  }

  function enterHouse(h) {
    transitioning = true;
    currentHouse = h;
    mode = MODE.INTERIOR;
    player.interiorX = 4 * TILE;
    player.interiorY = 5 * TILE;
    player.direction = 'up';
    notify(h.name);
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

  // ── Touch controls ──
  let touchStartX = 0, touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX; touchStartY = t.clientY;
    if (e.timeStamp - (canvas._lastTap || 0) < 300) {
      onDown({ code: 'Space', preventDefault() {} });
      setTimeout(() => onUp({ code: 'Space' }), 100);
    }
    canvas._lastTap = e.timeStamp;
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
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
  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    frame++;

    // ── Time ──
    if (mode === MODE.WORLD) {
      const minutesPassed = dt * TIME_SPEED;
      gameTime.minute += minutesPassed;
      while (gameTime.minute >= 60) {
        gameTime.minute -= 60;
        gameTime.hour++;
        if (gameTime.hour >= 24) {
          gameTime.hour = 0;
          gameTime.day++;
        }
      }

      // Grow crops
      growCrops(farmPlots, minutesPassed);
    }

    // ── Update dialogue ──
    updateDialogue(dialogue);

    // ── Update player ──
    if (!dialogue.active && !dialogue.shopOpen && !inventory.open && !player.dead) {
      updatePlayer(player, keys, mode);
    } else {
      player.moving = false;
    }

    // ── Death ──
    if (player.dead) {
      player.deathTimer++;
    }

    // ── World updates ──
    if (mode === MODE.WORLD && !player.dead) {
      updateNPCs(npcs, player.x, player.y);
      spawnEnemies(enemies, gameTime.hour, player.x, player.y);
      updateEnemies(enemies, player.x, player.y);
      updateWorldObjects(worldObjects);

      // Enemy damage to player
      const attacker = getAttackingEnemy(enemies, player.x, player.y);
      if (attacker) {
        const died = damagePlayer(player, SKELETON.damage, attacker.x, attacker.y);
        if (died) {
          mode = MODE.WORLD; // stay in world for death screen
        } else if (player.invulnTimer === TILE) { // just got hit
          screenShake = 6;
          notify(`-${SKELETON.damage} PV !`, '#f44336');
        }
      }
    }

    // Screen shake decay
    if (screenShake > 0) screenShake--;

    // Notifications
    for (const n of notifications) n.age++;
    notifications = notifications.filter(n => n.age < n.duration);

    // ═════════ RENDER ═════════
    ctx.save();
    if (screenShake > 0) {
      ctx.translate(
        Math.random() * screenShake * 2 - screenShake,
        Math.random() * screenShake * 2 - screenShake
      );
    }

    if (mode === MODE.WORLD || player.dead) {
      const cam = renderWorld(ctx, canvas, player, npcs, frame);

      // Render farm plots
      renderFarmPlots(ctx, farmPlots, cam.cameraX, cam.cameraY, frame);

      // Render world objects (trees, rocks)
      renderWorldObjects(ctx, worldObjects, cam.cameraX, cam.cameraY, frame);

      // Render enemies
      renderEnemies(ctx, enemies, cam.cameraX, cam.cameraY, frame);

      // Day/night overlay
      renderDayNight(ctx, canvas, gameTime);

      // Prompts
      if (!dialogue.active && !dialogue.shopOpen && !inventory.open && !player.dead) {
        const nearNPC = getNearbyNPC(npcs, player.x, player.y);
        if (nearNPC) {
          drawPrompt(ctx,
            nearNPC.currentX * SCALE - cam.cameraX + RS / 2,
            nearNPC.currentY * SCALE - cam.cameraY - 20,
            `ESPACE - ${nearNPC.isShop ? 'Boutique' : 'Parler'}: ${nearNPC.name}`
          );
        }
        for (const h of HOUSES) {
          const ptx = player.x / TILE, pty = player.y / TILE;
          if (Math.abs(ptx - h.doorX) < 1.8 && Math.abs(pty - h.doorY) < 1.8) {
            drawPrompt(ctx,
              h.doorX * TILE * SCALE - cam.cameraX,
              h.doorY * TILE * SCALE - cam.cameraY - 40,
              `ESPACE - Entrer`
            );
          }
        }
      }
    } else if (mode === MODE.INTERIOR) {
      const intOff = renderInterior(ctx, canvas, player, currentHouse, frame);
      if (isAtInteriorDoor(player)) {
        drawPrompt(ctx, canvas.width / 2, intOff.offsetY + 8 * RS + 20, 'ESPACE - Sortir');
      }
      if (isNearBed(player)) {
        drawPrompt(ctx, canvas.width / 2, intOff.offsetY - 10, 'ESPACE - Dormir (restaurer vie)');
      }
    }

    ctx.restore();

    // UI layers (not affected by screen shake)
    renderDialogue(ctx, canvas, dialogue);
    if (dialogue.shopOpen) {
      renderShop(ctx, canvas, dialogue, inventory, player);
    }
    renderInventory(ctx, canvas, inventory);
    renderHUD(ctx, canvas, mode, currentHouse, inventory, player, gameTime, notifications);

    if (player.dead) {
      renderDeathScreen(ctx, canvas, player);
    }

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

  // ── Start ──
  loadAssets().then(() => {
    notify('Sunnyside World - Jour 1', '#FFD700');
    notify('Fleches/ZQSD = deplacer | ESPACE = agir | 1-6 = outil', '#aaa');
    notify('I = inventaire | Shift = courir', '#aaa');
    requestAnimationFrame(loop);
  });

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    if (raf) cancelAnimationFrame(raf);
  };
}
