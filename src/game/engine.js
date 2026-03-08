// ═══════════════════════════════════════════════════════
// VDX QUEST - Game Engine
// ═══════════════════════════════════════════════════════
import { TILE, SCALE, RS, LAURENT, HOUSE_STAGES } from './constants.js';
import { loadAssets } from './assets.js';
import { renderAll } from './renderer.js';
import { createPlayer, updatePlayer } from './player.js';
import { createInventory, addItem, removeItem, getItemCount } from './inventory.js';
import {
  createQuestState, getCurrentQuest, startQuestDialogue,
  advanceQuestDialogue, updateQuestDialogue, checkObjective,
  advanceQuest, getObjectiveProgress,
} from './quests.js';
import {
  createWorldObjects, hitObject, updateWorldObjects, getNearbyObject,
} from './world-objects.js';
import { isBuildingPlot } from './maps.js';

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let player = createPlayer();
  let inventory = createInventory();
  let quests = createQuestState();
  let worldObjects = createWorldObjects();
  let houseStage = 0; // 0-4
  let frame = 0;
  let keys = {};
  let raf = null;
  let notifications = [];
  let screenShake = 0;

  // Laurent NPC state
  let laurent = {
    x: LAURENT.x,
    y: LAURENT.y,
    direction: 'down',
    moving: false,
  };

  function notify(text, color = '#c7b777') {
    notifications.push({ text, color, age: 0, duration: 200 });
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

    if (e.code === 'Space') {
      e.preventDefault();

      // If dialogue is showing, advance it
      if (quests.showingDialogue) {
        const continued = advanceQuestDialogue(quests);
        if (!continued) {
          // Dialogue ended - check if objective is already met
          if (checkObjective(quests, inventory, houseStage)) {
            advanceQuest(quests);
          }
        }
        return;
      }

      // Check if near Laurent
      const distToLaurent = Math.hypot(player.x - laurent.x, player.y - laurent.y);
      if (distToLaurent < TILE * 3) {
        if (quests.needsTalk) {
          startQuestDialogue(quests);
          return;
        }
        // Check if objective is met and need to talk
        if (checkObjective(quests, inventory, houseStage)) {
          advanceQuest(quests);
          startQuestDialogue(quests);
          return;
        }
        // Remind of current objective
        const progress = getObjectiveProgress(quests, inventory, houseStage);
        notify(progress, '#aaa');
        return;
      }

      // Check if at building plot and can build
      const ptx = Math.round(player.x / TILE);
      const pty = Math.round(player.y / TILE);
      let nearPlot = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (isBuildingPlot(ptx + dc, pty + dr)) { nearPlot = true; break; }
        }
        if (nearPlot) break;
      }

      if (nearPlot) {
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

              // Check quest objective
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

      // Try to interact with world object (tree/rock)
      const obj = getNearbyObject(worldObjects, player.x, player.y);
      if (obj) {
        player.actionSprite = 'spr_axe';
        player.actionTimer = 20;

        const result = hitObject(obj);
        if (result && result.item) {
          addItem(inventory, result.item, result.count);
          notify(`+1 ${result.item === 'wood' ? 'Bois' : 'Pierre'}`, '#4CAF50');
          screenShake = 4;

          // Check quest objective
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

      notify('Rien ici. Approche un arbre, rocher, ou Laurent.', '#888');
    }
  }

  function onUp(e) { keys[e.code] = false; }
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  // ── Touch ──
  let touchX = 0, touchY = 0;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchX = t.clientX; touchY = t.clientY;
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

    // Update quest dialogue typewriter
    updateQuestDialogue(quests);

    // Update player
    if (!quests.showingDialogue) {
      updatePlayer(player, keys);
    } else {
      player.moving = false;
    }

    // Laurent faces player when close
    const distToLaurent = Math.hypot(player.x - laurent.x, player.y - laurent.y);
    if (distToLaurent < TILE * 4) {
      laurent.direction = player.x > laurent.x ? 'right' : 'left';
    }

    // Update world objects
    updateWorldObjects(worldObjects);

    // Screen shake
    if (screenShake > 0) screenShake--;

    // Notifications
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

    renderAll(ctx, canvas, {
      player, laurent, quests, inventory,
      worldObjects, houseStage, frame, notifications,
    });

    ctx.restore();

    raf = requestAnimationFrame(loop);
  }

  // ── Start ──
  loadAssets().then(() => {
    notify('VDX QUEST - Village 1', '#FFD700');
    notify('Fleches/ZQSD = deplacer | ESPACE = agir', '#aaa');
    notify('Va parler a Laurent !', '#4CAF50');
    requestAnimationFrame(loop);
  });

  return () => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    if (raf) cancelAnimationFrame(raf);
  };
}
