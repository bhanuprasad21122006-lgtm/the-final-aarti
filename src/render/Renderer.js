import { WeatherSystem } from './WeatherSystem.js';
import { EndingVisuals } from './EndingVisuals.js';

/**
 * Renderer.js
 * 2D Canvas rendering pipeline:
 * - Festive ground pavers & rangoli floor art
 * - Depth-sorted entity & NPC & prop rendering
 * - Warm evening lighting halos
 * - Weather system (Monsoon rain)
 * - Electrical Failure blackout & spark effects
 * - RewindSystem visual animation (time-warp, reversing clock, inward particles)
 * - Clue discovery toast & Event toast
 * - EndingVisuals (Sacred Aarti ceremony, divine rays, flower petals, confetti)
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.debug = false;
    this.weather = new WeatherSystem();
    this.endingVisuals = new EndingVisuals();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }

  render(map, player, npcs, camera, interactionSystem, timelineManager, failureSystem, rewindSystem, notebookSystem, clock, dt, endingSequence = null) {
    this.time += dt;
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Clear Screen
    ctx.fillStyle = '#1c1512';
    ctx.fillRect(0, 0, cw, ch);

    // 1. Render Ground & Environment Layout
    this._renderGround(ctx, map, camera, failureSystem.blackout);

    // 2. Render Rangolis
    this._renderRangolis(ctx, map.decorations.rangolis, camera);

    // 3. Render Diyas (Base)
    this._renderDiyas(ctx, map.decorations.diyas, camera);

    // 4. Collect & Depth-Sort Entities (Props + NPCs + Player)
    const renderQueue = [];

    // Map interactables
    for (let i = 0; i < map.interactables.length; i++) {
      const obj = map.interactables[i];
      renderQueue.push({
        y: obj.y + obj.height,
        render: () => obj.render(ctx, camera)
      });
    }

    // NPCs
    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      renderQueue.push({
        y: npc.y + npc.height,
        render: () => npc.render(ctx, camera)
      });
    }

    // Player
    renderQueue.push({
      y: player.y + player.height,
      render: () => player.render(ctx, camera)
    });

    // Sort by Y position
    renderQueue.sort((a, b) => a.y - b.y);

    for (let i = 0; i < renderQueue.length; i++) {
      renderQueue[i].render();
    }

    // 5. Electrical Failure Sparks at the Damaged Cable
    failureSystem.renderSparks(ctx, camera);

    const isEndingActive = endingSequence && endingSequence.isActive;

    // 5B. Ending Sequence Sacred Aarti & Divine Radiance Rays
    if (isEndingActive && endingSequence.stage >= 2) {
      this.endingVisuals.renderDivineRays(ctx, camera, this.time);
      this.endingVisuals.renderAartiCeremony(ctx, camera, this.time);
    }

    // 6. Render Overhead Elements (Fairy lights - dead if blackout!)
    this._renderOverheadLights(ctx, map.decorations.fairyLights, camera, failureSystem.blackout && !isEndingActive);

    // 7. Warm Evening Lighting Halos (Diyas) - Boosted during Ending
    this._renderLightingPass(ctx, map.decorations.diyas, camera, isEndingActive);

    // 8. Weather Particle Effects (Rain)
    this.weather.update(dt, timelineManager.worldState.isRaining, cw, ch);
    this.weather.render(ctx, cw, ch);

    // 8B. Celebration Particle Shower (Flower Petals & Confetti)
    if (isEndingActive && endingSequence.stage >= 2) {
      this.endingVisuals.update(dt, cw, ch, npcs);
      this.endingVisuals.renderParticles(ctx, camera, this.time);
    }

    // 9. Blackout Darkness Overlay (If power failed and not rewinding)
    if (failureSystem.blackout && !rewindSystem.isRewinding && !isEndingActive) {
      ctx.save();
      ctx.fillStyle = 'rgba(8, 5, 4, 0.42)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    }

    // 10. Interaction Prompts in World (Hidden during ending celebration for cinematic immersion)
    if (!isEndingActive) {
      this._renderWorldPrompts(ctx, player, interactionSystem, camera);
    }

    // 11. Timeline Event Announcement Toast (Screen Overlay)
    if (timelineManager.activeToast && !rewindSystem.isRewinding) {
      this._renderEventToast(ctx, timelineManager.activeToast, cw);
    }

    // 12. Clue Discovery Notification Banner (Bottom Left)
    if (notebookSystem.newClueNotification && !rewindSystem.isRewinding) {
      this._renderClueToast(ctx, notebookSystem.newClueNotification, cw, ch);
    }

    // 13. Pause Screen Indicator (Hidden during ending celebration)
    if (clock.isPaused && !rewindSystem.isRewinding && !isEndingActive) {
      this._renderPauseOverlay(ctx, cw, ch);
    }

    // 14. Rewind System Visual Animation (Takes precedence when active)
    if (rewindSystem.isRewinding) {
      rewindSystem.render(ctx, cw, ch, clock);
    }

    // 15. Debug collision rects
    if (this.debug) {
      this._renderDebug(ctx, map, player, npcs, camera);
    }
  }

  _renderGround(ctx, map, camera, isBlackout) {
    const s0 = camera.worldToScreen(0, 0);

    // 1. Base Earthen Courtyard Ground
    ctx.fillStyle = isBlackout ? '#1c120e' : '#2b1b15';
    ctx.fillRect(s0.x, s0.y, map.width, map.height);

    // Subtle natural earth texture / paver speckles
    ctx.fillStyle = isBlackout ? 'rgba(45, 30, 24, 0.4)' : 'rgba(70, 45, 35, 0.25)';
    for (let px = 60; px < map.width - 60; px += 80) {
      for (let py = 90; py < map.height - 40; py += 70) {
        const sp = camera.worldToScreen(px + ((py * 13) % 40), py + ((px * 17) % 30));
        ctx.fillRect(sp.x, sp.y, 18, 12);
      }
    }

    // 2. Central Courtyard Plaza (500, 360 to 1100, 980)
    const st = camera.worldToScreen(500, 360);
    const plazaW = 600;
    const plazaH = 620;

    // Sandstone foundation slab
    ctx.fillStyle = isBlackout ? '#241712' : '#3d261e';
    ctx.fillRect(st.x, st.y, plazaW, plazaH);

    // Staggered terracotta interlocking pavers
    const paverW = 50;
    const paverH = 28;
    for (let gy = 360; gy < 980; gy += paverH) {
      const rowIndex = Math.floor((gy - 360) / paverH);
      const rowOffset = (rowIndex % 2 === 0) ? 0 : paverW / 2;
      for (let gx = 500 - rowOffset; gx < 1100 + paverW; gx += paverW) {
        if (gx + paverW <= 500 || gx >= 1100) continue;
        const p = camera.worldToScreen(Math.max(500, gx), gy);
        const actualW = Math.min(gx + paverW, 1100) - Math.max(500, gx);

        // Subtle shade variation between bricks
        const hash = ((gx * 31 + gy * 47) % 5);
        if (isBlackout) {
          ctx.fillStyle = hash === 0 ? '#201410' : (hash === 1 ? '#281a14' : '#251713');
        } else {
          ctx.fillStyle = hash === 0 ? '#432920' : (hash === 1 ? '#4d3025' : (hash === 2 ? '#482c22' : '#3f261e'));
        }
        ctx.fillRect(p.x + 1, p.y + 1, actualW - 2, paverH - 2);

        // Mortar lines
        ctx.strokeStyle = isBlackout ? '#190e0b' : '#311c15';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x + 0.5, p.y + 0.5, actualW - 1, paverH - 1);
      }
    }

    // Sandstone Plaza Border Curb
    ctx.strokeStyle = isBlackout ? '#3b231a' : '#6b4231';
    ctx.lineWidth = 6;
    ctx.strokeRect(st.x + 3, st.y + 3, plazaW - 6, plazaH - 6);
    ctx.strokeStyle = isBlackout ? '#553325' : '#8d5740';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(st.x + 6, st.y + 6, plazaW - 12, plazaH - 12);

    // 3. Side Market & Preparation Plazas
    const leftPlaza = camera.worldToScreen(140, 520);
    const rightPlaza = camera.worldToScreen(1140, 520);
    [leftPlaza, rightPlaza].forEach(pl => {
      ctx.fillStyle = isBlackout ? '#201410' : '#38221a';
      ctx.fillRect(pl.x, pl.y, 320, 320);
      ctx.strokeStyle = isBlackout ? '#2c1c16' : '#4d3025';
      ctx.lineWidth = 1;
      for (let tx = 0; tx <= 320; tx += 40) {
        ctx.beginPath();
        ctx.moveTo(pl.x + tx, pl.y);
        ctx.lineTo(pl.x + tx, pl.y + 320);
        ctx.stroke();
      }
      for (let ty = 0; ty <= 320; ty += 40) {
        ctx.beginPath();
        ctx.moveTo(pl.x, pl.y + ty);
        ctx.lineTo(pl.x + 320, pl.y + ty);
        ctx.stroke();
      }
      // Decorative border
      ctx.strokeStyle = isBlackout ? '#3d251c' : '#734735';
      ctx.lineWidth = 3;
      ctx.strokeRect(pl.x + 2, pl.y + 2, 316, 316);
    });

    // 4. Royal Ceremonial Crimson Runner (740, 360 to 860, 980)
    const carpet = camera.worldToScreen(740, 360);
    const carpetW = 120;
    const carpetH = 620;

    // Carpet shadow
    ctx.fillStyle = 'rgba(10, 5, 3, 0.4)';
    ctx.fillRect(carpet.x - 3, carpet.y, carpetW + 6, carpetH + 4);

    // Deep Crimson Velvet Body
    ctx.fillStyle = isBlackout ? '#450a1a' : '#7f132e';
    ctx.fillRect(carpet.x, carpet.y, carpetW, carpetH);

    // Inner velvet field
    ctx.fillStyle = isBlackout ? '#580e22' : '#991b3b';
    ctx.fillRect(carpet.x + 12, carpet.y, carpetW - 24, carpetH);

    // Ornate Golden Zari Borders
    ctx.fillStyle = isBlackout ? '#854d0e' : '#eab308';
    ctx.fillRect(carpet.x + 2, carpet.y, 5, carpetH);
    ctx.fillRect(carpet.x + carpetW - 7, carpet.y, 5, carpetH);
    ctx.fillRect(carpet.x + 10, carpet.y, 2, carpetH);
    ctx.fillRect(carpet.x + carpetW - 12, carpet.y, 2, carpetH);

    // Golden repeating geometric embroidery motif along borders
    ctx.fillStyle = isBlackout ? '#a16207' : '#fde047';
    for (let my = carpet.y + 10; my < carpet.y + carpetH; my += 20) {
      // Left border motifs
      ctx.beginPath();
      ctx.moveTo(carpet.x + 4, my);
      ctx.lineTo(carpet.x + 7, my + 4);
      ctx.lineTo(carpet.x + 4, my + 8);
      ctx.lineTo(carpet.x + 1, my + 4);
      ctx.closePath();
      ctx.fill();

      // Right border motifs
      ctx.beginPath();
      ctx.moveTo(carpet.x + carpetW - 5, my);
      ctx.lineTo(carpet.x + carpetW - 2, my + 4);
      ctx.lineTo(carpet.x + carpetW - 5, my + 8);
      ctx.lineTo(carpet.x + carpetW - 8, my + 4);
      ctx.closePath();
      ctx.fill();
    }

    // Tassel fringe at entrance end of the carpet
    ctx.fillStyle = isBlackout ? '#854d0e' : '#f59e0b';
    for (let tx = carpet.x + 4; tx < carpet.x + carpetW - 4; tx += 6) {
      ctx.fillRect(tx, carpet.y + carpetH, 3, 7);
      ctx.beginPath();
      ctx.arc(tx + 1.5, carpet.y + carpetH + 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Grand Mandap Elevated Platform (580, 120 to 1020, 360)
    const mandap = camera.worldToScreen(580, 120);
    const mandapW = 440;
    const mandapH = 240;

    // Platform dropshadow
    ctx.fillStyle = 'rgba(5, 3, 2, 0.55)';
    ctx.fillRect(mandap.x - 6, mandap.y - 4, mandapW + 12, mandapH + 16);

    // Stepped outer tier (Polished Sandstone Plinth)
    ctx.fillStyle = isBlackout ? '#3b1c10' : '#6b2d18';
    ctx.fillRect(mandap.x, mandap.y, mandapW, mandapH);

    // Inner sanctum marble/terracotta inlay
    ctx.fillStyle = isBlackout ? '#4f1414' : '#881b1b';
    ctx.fillRect(mandap.x + 14, mandap.y + 14, mandapW - 28, mandapH - 28);

    // Sacred altar carpet
    ctx.fillStyle = isBlackout ? '#631616' : '#a82020';
    ctx.fillRect(mandap.x + 30, mandap.y + 30, mandapW - 60, mandapH - 56);

    // Decorative golden filigree border around altar
    ctx.strokeStyle = isBlackout ? '#854d0e' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(mandap.x + 28, mandap.y + 28, mandapW - 56, mandapH - 52);

    // Front platform step fascia (Golden & Wood carved molding)
    ctx.fillStyle = isBlackout ? '#78350f' : '#b45309';
    ctx.fillRect(mandap.x, mandap.y + mandapH - 12, mandapW, 12);
    ctx.fillStyle = isBlackout ? '#a16207' : '#fbbf24';
    ctx.fillRect(mandap.x, mandap.y + mandapH - 14, mandapW, 2);
    ctx.fillRect(mandap.x, mandap.y + mandapH - 2, mandapW, 2);

    // Front step carved lotus-petal reliefs
    ctx.fillStyle = isBlackout ? '#92400e' : '#fde047';
    for (let lx = mandap.x + 20; lx < mandap.x + mandapW - 20; lx += 24) {
      ctx.beginPath();
      ctx.arc(lx, mandap.y + mandapH - 7, 4, 0, Math.PI);
      ctx.fill();
    }

    // 6. Perimeter Boundary Fence
    const fence = camera.worldToScreen(60, 90);
    ctx.strokeStyle = isBlackout ? '#451a03' : '#78350f';
    ctx.lineWidth = 5;
    ctx.strokeRect(fence.x, fence.y, map.width - 120, map.height - 130);

    // Decorative bamboo / wooden posts on fence
    ctx.fillStyle = isBlackout ? '#552207' : '#92400e';
    for (let fx = 60; fx <= map.width - 60; fx += 100) {
      const topP = camera.worldToScreen(fx, 90);
      const botP = camera.worldToScreen(fx, map.height - 40);
      ctx.fillRect(topP.x - 4, topP.y - 6, 8, 12);
      ctx.fillRect(botP.x - 4, botP.y - 6, 8, 12);
    }
  }

  _renderRangolis(ctx, rangolis, camera) {
    for (let i = 0; i < rangolis.length; i++) {
      const r = rangolis[i];
      const s = camera.worldToScreen(r.x, r.y);
      const rad = r.radius;

      ctx.save();

      // 1. Soft glowing outer white flour dust aura
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad + 6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Ring: Auspicious Magenta & Vermilion Flower Petals (8 Lotus Petals)
      ctx.fillStyle = '#db2777';
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const tipX = s.x + Math.cos(angle) * rad;
        const tipY = s.y + Math.sin(angle) * rad;
        const leftAngle = angle - 0.22;
        const rightAngle = angle + 0.22;
        const baseRadius = rad * 0.65;
        const b1X = s.x + Math.cos(leftAngle) * baseRadius;
        const b1Y = s.y + Math.sin(leftAngle) * baseRadius;
        const b2X = s.x + Math.cos(rightAngle) * baseRadius;
        const b2Y = s.y + Math.sin(rightAngle) * baseRadius;

        ctx.beginPath();
        ctx.moveTo(b1X, b1Y);
        ctx.quadraticCurveTo(s.x + Math.cos(angle) * (rad * 0.85), s.y + Math.sin(angle) * (rad * 0.85), tipX, tipY);
        ctx.quadraticCurveTo(s.x + Math.cos(angle) * (rad * 0.85), s.y + Math.sin(angle) * (rad * 0.85), b2X, b2Y);
        ctx.closePath();
        ctx.fill();

        // White rice powder outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Petal tip vermilion accent
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#db2777';
      }

      // 3. Middle Ring: Marigold Orange Band
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad * 0.62, 0, Math.PI * 2);
      ctx.fill();

      // 4. Turmeric Yellow Radiance Circle
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad * 0.46, 0, Math.PI * 2);
      ctx.fill();

      // 5. White Rice Powder Concentric Geometric Chita Filigree
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Radiating dots & diamond stippling
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2 + Math.PI / 8;
        const dotX = s.x + Math.cos(angle) * (rad * 0.46);
        const dotY = s.y + Math.sin(angle) * (rad * 0.46);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fill();

        const outerDotX = s.x + Math.cos(angle) * (rad * 0.72);
        const outerDotY = s.y + Math.sin(angle) * (rad * 0.72);
        ctx.beginPath();
        ctx.arc(outerDotX, outerDotY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Inner Core: Vermilion Kumkum Bindu
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // 7. Golden Central Stamen & Miniature Diya Base
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  _renderDiyas(ctx, diyas, camera) {
    for (let i = 0; i < diyas.length; i++) {
      const d = diyas[i];
      const s = camera.worldToScreen(d.x, d.y);

      // 1. Soft earthenware shadow
      ctx.fillStyle = 'rgba(20, 10, 5, 0.45)';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 4, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Terracotta Clay Diya Bowl (Mitti ka Diya)
      ctx.fillStyle = '#9a3412';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 2, 7.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pinched lip highlight
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 1, 6, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Oil pool with warm golden reflection
      ctx.fillStyle = '#431407';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 1, 4.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Cotton Wick (Ruhi Baati with charred tip)
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x - 1, s.y + 1);
      ctx.lineTo(s.x, s.y - 1.5);
      ctx.stroke();

      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(s.x, s.y - 2, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // 4. Animated Flame (Teardrop flame with organic sway)
      const flicker = Math.sin(this.time * 8 + d.phase) * 0.9;
      const sway = Math.cos(this.time * 5 + d.phase) * 0.8;
      const flameH = 6.5 + flicker;

      // Outer golden-orange flame body
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(s.x - 3 + sway * 0.3, s.y - 1);
      ctx.quadraticCurveTo(s.x - 4 + sway, s.y - 4, s.x + sway, s.y - 2 - flameH);
      ctx.quadraticCurveTo(s.x + 4 + sway, s.y - 4, s.x + 3 + sway * 0.3, s.y - 1);
      ctx.closePath();
      ctx.fill();

      // Inner saffron-red flame mantle
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(s.x - 2 + sway * 0.3, s.y - 1);
      ctx.quadraticCurveTo(s.x - 2.5 + sway, s.y - 3, s.x + sway, s.y - 2 - flameH * 0.85);
      ctx.quadraticCurveTo(s.x + 2.5 + sway, s.y - 3, s.x + 2 + sway * 0.3, s.y - 1);
      ctx.closePath();
      ctx.fill();

      // White-hot flame core
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.ellipse(s.x + sway * 0.4, s.y - 2.5, 1.4, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderOverheadLights(ctx, strings, camera, isBlackout) {
    for (let i = 0; i < strings.length; i++) {
      const str = strings[i];
      const s1 = camera.worldToScreen(str.startX, str.startY);
      const s2 = camera.worldToScreen(str.endX, str.endY);
      const midX = (s1.x + s2.x) / 2;
      const midY = (s1.y + s2.y) / 2 + str.sag;

      // Twisted festive copper wire
      ctx.strokeStyle = isBlackout ? '#1e293b' : '#334155';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.quadraticCurveTo(midX, midY, s2.x, s2.y);
      ctx.stroke();

      const bulbCount = 16;
      for (let b = 1; b < bulbCount; b++) {
        const t = b / bulbCount;
        const bx = (1 - t) * (1 - t) * s1.x + 2 * (1 - t) * t * midX + t * t * s2.x;
        const by = (1 - t) * (1 - t) * s1.y + 2 * (1 - t) * t * midY + t * t * s2.y;

        // Bulb socket cap
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx - 1.5, by - 1, 3, 2.5);

        if (isBlackout) {
          // Dark extinguished glass bulb
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(bx, by + 3.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Frosted jewel-tone festive fairy bulbs
          const bulbColors = [
            { main: '#fbbf24', halo: 'rgba(251, 191, 36, 0.35)' }, // Warm Amber
            { main: '#f43f5e', halo: 'rgba(244, 63, 94, 0.35)' },  // Festive Ruby
            { main: '#38bdf8', halo: 'rgba(56, 189, 248, 0.35)' }, // Celestial Cyan
            { main: '#c084fc', halo: 'rgba(192, 132, 252, 0.35)' },// Amethyst Purple
            { main: '#34d399', halo: 'rgba(52, 211, 153, 0.35)' }  // Emerald Green
          ];
          const colorObj = bulbColors[(i * 3 + b) % bulbColors.length];

          // Soft individual bulb halo glow
          ctx.fillStyle = colorObj.halo;
          ctx.beginPath();
          ctx.arc(bx, by + 4, 7, 0, Math.PI * 2);
          ctx.fill();

          // Vibrant glass bulb
          ctx.fillStyle = colorObj.main;
          ctx.beginPath();
          ctx.arc(bx, by + 3.5, 3.2, 0, Math.PI * 2);
          ctx.fill();

          // White filament pinpoint highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx - 0.8, by + 2.5, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  _renderLightingPass(ctx, diyas, camera, isEnding = false) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const boostMultiplier = isEnding ? 1.7 : 1.0;
    const baseRadius = isEnding ? 40 : 26;

    for (let i = 0; i < diyas.length; i++) {
      const d = diyas[i];
      const s = camera.worldToScreen(d.x, d.y);

      if (s.x < -60 || s.x > this.canvas.width + 60 || s.y < -60 || s.y > this.canvas.height + 60) {
        continue;
      }

      const flicker = Math.sin(this.time * 6 + d.phase) * 3;
      const radius = baseRadius + flicker * boostMultiplier;
      const grad = ctx.createRadialGradient(s.x, s.y - 2, 2, s.x, s.y - 2, radius);
      grad.addColorStop(0, isEnding ? 'rgba(255, 247, 237, 0.85)' : 'rgba(254, 240, 138, 0.55)');
      grad.addColorStop(0.3, isEnding ? 'rgba(251, 191, 36, 0.5)' : 'rgba(251, 191, 36, 0.28)');
      grad.addColorStop(0.65, isEnding ? 'rgba(234, 88, 12, 0.25)' : 'rgba(234, 88, 12, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y - 2, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _renderWorldPrompts(ctx, player, interactionSystem, camera) {
    const item = interactionSystem.currentInteractable;
    if (!item) return;

    const target = item.target;
    const s = camera.worldToScreen(target.x + target.width / 2, target.y - 14);
    const bounce = Math.sin(this.time * 6) * 3;

    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    const text = item.prompt;
    const keyText = '[E]';
    const metrics = ctx.measureText(`${keyText}  ${text}`);
    const boxW = metrics.width + 24;
    const boxH = 28;
    const bx = s.x - boxW / 2;
    const by = s.y - boxH + bounce;

    // Glowing drop shadow
    ctx.shadowColor = item.type === 'npc' ? 'rgba(56, 189, 248, 0.45)' : (target.id === 'damaged_cable' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)');
    ctx.shadowBlur = 12;

    // Badge Background (Glassmorphism dark card)
    ctx.fillStyle = 'rgba(18, 11, 8, 0.94)';
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 8);
    ctx.fill();

    // Border glow
    ctx.shadowBlur = 0;
    ctx.strokeStyle = item.type === 'npc' ? '#38bdf8' : (target.id === 'damaged_cable' ? '#ef4444' : '#f59e0b');
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Embossed Keycap Pill for [E]
    const keyPillW = 24;
    const keyPillH = 18;
    const keyPillX = bx + 6;
    const keyPillY = by + (boxH - keyPillH) / 2;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(keyPillX, keyPillY, keyPillW, keyPillH, 4);
    ctx.fill();
    ctx.fillStyle = '#1e110a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', keyPillX + keyPillW / 2, keyPillY + keyPillH / 2);

    // Prompt Text
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, keyPillX + keyPillW + 8, by + boxH / 2);

    ctx.restore();
  }

  _renderEventToast(ctx, toast, cw) {
    ctx.save();
    const boxW = Math.min(cw - 40, 520);
    const boxH = 50;
    const bx = (cw - boxW) / 2;
    const by = 16;

    ctx.fillStyle = 'rgba(24, 15, 10, 0.94)';
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 8);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${toast.time} - ${toast.title}`, bx + 16, by + 20);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.fillText(toast.description, bx + 16, by + 38);

    ctx.restore();
  }

  _renderClueToast(ctx, text, cw, ch) {
    ctx.save();
    const boxW = 340;
    const boxH = 34;
    const bx = 16;
    const by = ch - 50;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 6);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + 14, by + boxH / 2);

    ctx.restore();
  }

  _renderPauseOverlay(ctx, cw, ch) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 6, 4, 0.55)';
    ctx.fillRect(0, 0, cw, ch);

    const pw = 200;
    const ph = 56;
    const px = (cw - pw) / 2;
    const py = (ch - ph) / 2;

    ctx.fillStyle = 'rgba(24, 17, 13, 0.95)';
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 10);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', cw / 2, py + 26);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Press [P] or [Space] to Resume', cw / 2, py + 44);

    ctx.restore();
  }

  _renderDebug(ctx, map, player, npcs, camera) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < map.obstacles.length; i++) {
      const o = map.obstacles[i];
      const box = o.getBounds ? o.getBounds() : o;
      const s = camera.worldToScreen(box.left, box.top);
      ctx.strokeRect(s.x, s.y, box.right - box.left, box.bottom - box.top);
    }

    const pb = player.getBounds();
    const ps = camera.worldToScreen(pb.left, pb.top);
    ctx.strokeStyle = '#22c55e';
    ctx.strokeRect(ps.x, ps.y, pb.right - pb.left, pb.bottom - pb.top);

    for (let i = 0; i < npcs.length; i++) {
      const nb = npcs[i].getBounds();
      const ns = camera.worldToScreen(nb.left, nb.top);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(ns.x, ns.y, nb.right - nb.left, nb.bottom - nb.top);
    }

    ctx.restore();
  }
}
