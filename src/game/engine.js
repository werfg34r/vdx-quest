// ═══════════════════════════════════════════════════════
// VDX QUEST - Game Engine - Village 1
// ═══════════════════════════════════════════════════════
import {
  TILE, SCALE, RS, TOOLS, ITEM_TYPES, BUILD_PLOT, HOUSE_STAGES, LAURENT,
  PLAYER_SPEED,
} from './constants.js';
import { loadAssets } from './assets.js';
import { renderWorld, renderQuestDialogue, renderHUD, renderPrompts } from './renderer.js';
import { createPlayer, updatePlayer } from './player.js';
import { createInventory, getSelectedTool, addItem, removeItem, getItemCount } from './inventory.js';
import {
  createQuestState, getCurrentQuest, startQuestDialogue,
  advanceQuestDialogue, updateQuestDialogue, checkObjective,
  advanceQuest, getObjectiveProgress,
} from './quests.js';
import {
  createWorldObjects, hitObject, updateWorldObjects, getNearbyObject,
} from './world-objects.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let player = createPlayer();
  let inventory = createInventory();
  let quests = createQuestState();
  let worldObjects = createWorldObjects();
  let houseStage = 0;
  let frame = 0;
  let keys = {};
  let raf = null;
  let notifications = [];
  let screenShake = 0;

  // Laurent NPC state (simple patrol)
  let laurent = {
    x: LAURENT.x,
    y: LAURENT.y,
    direction: 'down',
    moving: false,
    patrolIdx: 0,
    patrolTimer: 0,
  };

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

    // Tool selection
    if (e.code === 'Digit1') inventory.selectedTool = 0;
    if (e.code === 'Digit2' && inventory.tools.length > 1) inventory.selectedTool = 1;

    if (e.code === 'Space') {
      e.preventDefault();

      // Dialogue advance
      if (quests.showingDialogue) {
        const continued = advanceQuestDialogue(quests);
        if (!continued) {
          if (checkObjective(quests, inventory, houseStage)) {
            advanceQuest(quests);
          }
        }
        return;
      }

      handleWorldAction();
    }
  }

  function onUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  function handleWorldAction() {
    // 1. Talk to Laurent
    const distToLaurent = Math.hypot(player.x - laurent.x, player.y - laurent.y);
    if (distToLaurent < TILE * 3) {
      if (quests.needsTalk) {
        startQuestDialogue(quests);
        return;
      }
      if (checkObjective(quests, inventory, houseStage)) {
        advanceQuest(quests);
        startQuestDialogue(quests);
        return;
      }
      const progress = getObjectiveProgress(quests, inventory, houseStage);
      notify(progress, '#aaa');
      return;
    }

    // 2. Building plot
    const ptx = Math.round(player.x / TILE);
    const pty = Math.round(player.y / TILE);
    const bp = BUILD_PLOT;
    if (ptx >= bp.x - 1 && ptx <= bp.x + bp.w && pty >= bp.y - 1 && pty <= bp.y + bp.h) {
      const quest = getCurrentQuest(quests);
      if (quest && quest.objective.type === 'build' && !quests.needsTalk) {
        const stage = HOUSE_STAGES[houseStage + 1];
        if (stage) {
          const hasWood = getItemCount(inventory, 'wood') >= stage.woodCost;
          const hasRock = getItemCount(inventory, 'rock') >= stage.rockCost;
          if (hasWood && hasRock) {
            if (stage.woodCost > 0) removeItem(inventory, 'wood', stage.woodCost);
            if (stage.rockCost > 0) removeItem(inventory, 'rock', stage.rockCost);
            houseStage++;
            screenShake = 8;
            notify(`${HOUSE_STAGES[houseStage].name} !`, '#FFD700');
            if (checkObjective(quests, inventory, houseStage)) {
              setTimeout(() => {
                advanceQuest(quests);
                notify('Retourne voir Laurent !', '#4CAF50');
              }, 1000);
            }
          } else {
            const need = [];
            if (!hasWood) need.push(`${stage.woodCost} bois`);
            if (!hasRock) need.push(`${stage.rockCost} pierre`);
            notify(`Il faut: ${need.join(' + ')}`, '#f44336');
          }
        }
      } else {
        notify('Parle a Laurent d\'abord !', '#aaa');
      }
      return;
    }

    // 3. Use tool on world object
    const toolId = getSelectedTool(inventory);
    if (!toolId) {
      notify('Selectionne un outil (1-2)', '#aaa');
      return;
    }

    const toolDef = TOOLS[toolId];
    if (!toolDef) return;

    const obj = getNearbyObject(worldObjects, player.x, player.y, toolId);
    if (obj) {
      player.actionSprite = toolDef.action;
      player.actionTimer = toolDef.frames;

      const result = hitObject(obj, toolId);
      if (result && result.item) {
        addItem(inventory, result.item, result.count);
        notify(`+${result.count} ${ITEM_TYPES[result.item]?.name || result.item}`, '#4CAF50');
        screenShake = 4;
        if (checkObjective(quests, inventory, houseStage)) {
          if (!quests.needsTalk) {
            advanceQuest(quests);
            notify('Retourne voir Laurent !', '#4CAF50');
          }
        }
      } else if (result) {
        notify('Encore un coup...', '#aaa');
      }
      return;
    }

    const objName = toolId === 'axe' ? 'arbre' : 'rocher';
    notify(`Pas de ${objName} a portee`, '#aaa');
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

  // ── Laurent patrol ──
  function updateLaurent() {
    const path = LAURENT.patrolPath;
    if (!path || path.length < 2) return;
    const target = path[laurent.patrolIdx];
    const dx = target.x - laurent.x;
    const dy = target.y - laurent.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      laurent.moving = false;
      laurent.patrolTimer++;
      if (laurent.patrolTimer > 120) {
        laurent.patrolTimer = 0;
        laurent.patrolIdx = (laurent.patrolIdx + 1) % path.length;
      }
    } else {
      laurent.moving = true;
      const speed = 0.5;
      laurent.x += (dx / dist) * speed;
      laurent.y += (dy / dist) * speed;
      laurent.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }

    // Face player when close
    const playerDist = Math.hypot(player.x - laurent.x, player.y - laurent.y);
    if (playerDist < TILE * 4) {
      laurent.direction = player.x > laurent.x ? 'right' : 'left';
    }
  }

  // ── Game Loop ──
  function loop() {
    frame++;

    updateQuestDialogue(quests);

    if (!quests.showingDialogue) {
      updatePlayer(player, keys);
    } else {
      player.moving = false;
    }

    updateLaurent();
    updateWorldObjects(worldObjects);

    if (screenShake > 0) screenShake--;
    for (const n of notifications) n.age++;
    notifications = notifications.filter(n => n.age < n.duration);

    // ── RENDER ──
    ctx.save();
    if (screenShake > 0) {
      ctx.translate(
        Math.random() * screenShake * 2 - screenShake,
        Math.random() * screenShake * 2 - screenShake
      );
    }

    const state = {
      player, laurent, quests, inventory,
      worldObjects, houseStage, frame, notifications,
    };

    const cam = renderWorld(ctx, canvas, state);
    renderPrompts(ctx, state, cam.camX, cam.camY);

    ctx.restore();

    // UI (not affected by screen shake)
    renderQuestDialogue(ctx, canvas, quests);
    renderHUD(ctx, canvas, state);

    raf = requestAnimationFrame(loop);
  }

  // ── Start ──
  loadAssets().then(() => {
    notify('VDX QUEST - Village 1', '#4FC3F7');
    notify('Va parler a Laurent !', '#4CAF50');
    notify('Fleches/ZQSD = deplacer | ESPACE = agir', '#aaa');
    requestAnimationFrame(loop);
  });

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    if (raf) cancelAnimationFrame(raf);
  };
}
