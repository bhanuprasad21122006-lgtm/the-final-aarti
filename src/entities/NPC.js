import { Entity } from './Entity.js';

/**
 * NPC.js
 * Living festival NPC entity with scheduled movement, direction-facing rendering,
 * idle behaviors, and context-sensitive dialogue delivery (including blackout reactions).
 */
export class NPC extends Entity {
  constructor(config) {
    super(config.initialPos.x, config.initialPos.y, 28, 44);

    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.personality = config.personality;
    this.color = config.color || '#3b82f6';
    this.skin = config.skin || '#d97736';
    this.schedule = config.schedule || [];
    this.dialogueData = config.dialogue || {};

    this.collider = {
      offsetX: 4,
      offsetY: 26,
      width: 20,
      height: 16
    };
    this.solid = true;

    this.interactRadius = 55;
    this.prompt = `Talk to ${this.name}`;

    this.speed = 80;
    this.facing = 'down';
    this.state = 'idle';
    this.isCelebrating = false;
    this.currentScheduleIndex = 0;
    this.targetPos = { x: this.x, y: this.y };
    this.currentActivity = this.schedule[0] ? this.schedule[0].activity : 'Attending festival';

    this.animTimer = Math.random() * 5;
    this.walkCycle = 0;
  }

  getFootPosition() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height - 4
    };
  }

  distanceTo(point) {
    const foot = this.getFootPosition();
    const dx = foot.x - point.x;
    const dy = foot.y - point.y;
    return Math.hypot(dx, dy);
  }

  evaluateSchedule(clock) {
    let activeIndex = 0;
    for (let i = 0; i < this.schedule.length; i++) {
      const entry = this.schedule[i];
      if (clock.isPastOrAt(entry.hour, entry.minute)) {
        activeIndex = i;
      }
    }

    if (activeIndex !== this.currentScheduleIndex) {
      this.currentScheduleIndex = activeIndex;
      const target = this.schedule[activeIndex];
      this.targetPos = { ...target.targetPos };
      this.currentActivity = target.activity;
    }
  }

  update(dt, clock) {
    this.animTimer += dt;
    if (!this.isCelebrating) {
      this.evaluateSchedule(clock);
    }

    const dx = this.targetPos.x - this.x;
    const dy = this.targetPos.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      this.state = 'walk';
      this.walkCycle += dt * 8;

      const moveDist = Math.min(this.speed * dt, dist);
      const nx = dx / dist;
      const ny = dy / dist;

      this.x += nx * moveDist;
      this.y += ny * moveDist;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.facing = dy > 0 ? 'down' : 'up';
      }
    } else {
      this.x = this.targetPos.x;
      this.y = this.targetPos.y;
      this.state = this.isCelebrating ? 'celebrate' : 'idle';
      if (this.isCelebrating) {
        this.facing = 'up';
      }
      this.walkCycle = 0;
    }
  }

  setCelebrating(celebrating, targetX = null, targetY = null) {
    this.isCelebrating = celebrating;
    if (celebrating) {
      if (targetX !== null && targetY !== null) {
        this.targetPos = { x: targetX, y: targetY };
      }
      this.currentActivity = 'Joyously celebrating the Grand Aarti!';
    } else {
      this.state = 'idle';
    }
  }

  getCurrentDialogue(isBlackout = false) {
    if (isBlackout && this.dialogueData.blackout) {
      const lines = this.dialogueData.blackout;
      const pickIndex = Math.floor(this.animTimer) % lines.length;
      return lines[pickIndex];
    }

    const keys = Object.keys(this.dialogueData);
    let key = 'default';
    if (this.currentScheduleIndex === 1 && keys.length > 1) {
      key = keys[1];
    } else if (this.currentScheduleIndex >= 2 && keys.length > 2) {
      key = keys[2];
    }

    const lines = this.dialogueData[key] || this.dialogueData.default || ["Jai Ganesh!"];
    const pickIndex = Math.floor(this.animTimer) % lines.length;
    return lines[pickIndex];
  }

  render(ctx, camera) {
    const s = camera.worldToScreen(this.x, this.y);
    const px = s.x;
    const py = s.y;

    ctx.save();

    // 1. Soft Dynamic Drop Shadow
    const isChild = this.id === 'child';
    const shadowRx = isChild ? 8 : 11;
    const shadowRy = isChild ? 3.5 : 5;
    const shadowY = isChild ? py + 34 : py + 41;

    ctx.fillStyle = 'rgba(18, 10, 7, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px + 14, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Animation Offsets
    let bob = 0;
    let legOffset = 0;
    let gestureOffset = 0;

    if (this.isCelebrating || this.state === 'celebrate') {
      bob = Math.sin(this.animTimer * 7) * 2.8;
      gestureOffset = Math.sin(this.animTimer * 7) * 4;
    } else if (this.state === 'walk') {
      bob = Math.sin(this.walkCycle * 2) * 1.6;
      legOffset = Math.sin(this.walkCycle * 2) * 4.2;
    } else {
      bob = Math.sin(this.animTimer * 2.2) * 0.8;
      gestureOffset = Math.sin(this.animTimer * 1.5) * 1.5;
    }

    const baseY = py + bob;

    // 3. Legs & Footwear
    const legH = isChild ? 6 : 9;
    const legY = isChild ? baseY + 25 : baseY + 31;
    ctx.fillStyle = this.id === 'elder' ? '#f8fafc' : (this.id === 'cook' ? '#e2e8f0' : '#1e293b');

    if (this.facing === 'left' || this.facing === 'right') {
      const dirSign = this.facing === 'left' ? -1 : 1;
      ctx.fillRect(px + 10 - dirSign * legOffset * 0.4, legY, 3.5, legH);
      ctx.fillRect(px + 15 + dirSign * legOffset * 0.4, legY, 3.5, legH);
      // Traditional leather mojri / sandal
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 9 - dirSign * legOffset * 0.4, legY + legH - 1, 5.5, 3);
      ctx.fillRect(px + 14 + dirSign * legOffset * 0.4, legY + legH - 1, 5.5, 3);
    } else {
      ctx.fillRect(px + 9, legY + legOffset, 3.5, legH);
      ctx.fillRect(px + 15.5, legY - legOffset, 3.5, legH);
      // Traditional leather footwear
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 8, legY + legH - 1 + legOffset, 5.5, 3);
      ctx.fillRect(px + 14.5, legY + legH - 1 - legOffset, 5.5, 3);
    }

    // 4. Torso & Primary Festive Garments
    const bodyW = isChild ? 14 : 17;
    const bodyH = isChild ? 13 : 17;
    const bodyX = isChild ? px + 7 : px + 5.5;
    const bodyY = isChild ? baseY + 13 : baseY + 16;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 3.5);
    ctx.fill();

    // 5. Distinct Role Costumes & Accessories
    this._renderRoleCostume(ctx, px, baseY, bodyX, bodyY, bodyW, bodyH, gestureOffset);

    // 6. Arms & Celebrating Gestures
    if (this.isCelebrating || this.state === 'celebrate') {
      const cheerArm = Math.sin(this.animTimer * 7) * 3;
      ctx.fillStyle = this.skin;
      // Joyously raised arms
      ctx.fillRect(px + 2, baseY + 10 - cheerArm, 3.5, 10);
      ctx.fillRect(px + 22.5, baseY + 10 + cheerArm, 3.5, 10);
      ctx.beginPath();
      ctx.arc(px + 3.7, baseY + 8 - cheerArm, 2.5, 0, Math.PI * 2);
      ctx.arc(px + 24.2, baseY + 8 + cheerArm, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default side arms
      ctx.fillStyle = this.color;
      ctx.fillRect(px + 3, baseY + 17, 3, 10);
      ctx.fillRect(px + 22, baseY + 17, 3, 10);
      ctx.fillStyle = this.skin;
      ctx.beginPath();
      ctx.arc(px + 4.5, baseY + 28, 2, 0, Math.PI * 2);
      ctx.arc(px + 23.5, baseY + 28, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Head & Facial Features
    const headR = isChild ? 6.5 : 7.2;
    const headY = isChild ? baseY + 8 : baseY + 10;

    // Neck
    ctx.fillStyle = this.skin;
    ctx.fillRect(px + 12.5, headY + 4, 3, 3);

    // Face Shape
    ctx.beginPath();
    ctx.arc(px + 14, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.arc(px + 14 - headR - 0.5, headY + 1, 1.6, 0, Math.PI * 2);
    ctx.arc(px + 14 + headR + 0.5, headY + 1, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Character-Specific Hair / Headwear
    this._renderCharacterHeadwear(ctx, px, headY, headR);

    // Expressive Eyes & Tilak
    if (this.facing === 'down') {
      // Tilak
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 13.3, headY - 3.5, 1.4, 3);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px + 13.3, headY, 1.4, 1);

      // Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 11, headY - 0.5, 1.6, 2);
      ctx.fillRect(px + 15.5, headY - 0.5, 1.6, 2);

      // Elder spectacles
      if (this.id === 'elder' || this.id === 'organizer') {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(px + 10.5, headY - 1, 2.8, 2.8);
        ctx.strokeRect(px + 15, headY - 1, 2.8, 2.8);
        ctx.beginPath();
        ctx.moveTo(px + 13.3, headY + 0.4);
        ctx.lineTo(px + 15, headY + 0.4);
        ctx.stroke();
      }
    } else if (this.facing === 'left') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 10, headY - 0.5, 1.6, 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 9, headY - 2.5, 1, 2);
    } else if (this.facing === 'right') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 16.5, headY - 0.5, 1.6, 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 18, headY - 2.5, 1, 2);
    }

    // 8. Overhead Character Name Badge
    const tagW = Math.max(52, this.name.split(' ')[0].length * 7.5 + 12);
    const tagY = isChild ? baseY - 11 : baseY - 14;

    ctx.fillStyle = 'rgba(24, 15, 10, 0.88)';
    ctx.beginPath();
    ctx.roundRect(px + 14 - tagW / 2, tagY, tagW, 12, 3);
    ctx.fill();

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name.split(' ')[0], px + 14, tagY + 8.5);

    ctx.restore();
  }

  _renderRoleCostume(ctx, px, baseY, bodyX, bodyY, bodyW, bodyH, gestureOffset) {
    if (this.id === 'electrician') {
      // Navy utility vest with high-vis yellow reflective stripes
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bodyX, bodyY + 3, bodyW, 2);
      ctx.fillRect(bodyX, bodyY + bodyH - 4, bodyW, 2);
      // Toolbelt & screwdriver
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bodyX - 1, bodyY + bodyH - 3, bodyW + 2, 3);
      ctx.fillStyle = '#ef4444'; // Red handle of screwdriver
      ctx.fillRect(bodyX + bodyW - 2, bodyY + bodyH - 6, 2, 6);
      ctx.fillStyle = '#94a3b8'; // Metal tip
      ctx.fillRect(bodyX + bodyW - 1.5, bodyY + bodyH, 1, 3);
    } else if (this.id === 'cook') {
      // White chef apron over kurta with terracotta piping
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(bodyX + 2, bodyY + 2, bodyW - 4, bodyH - 2);
      ctx.fillStyle = '#ea580c'; // Saffron apron bib ties
      ctx.fillRect(bodyX + 4, bodyY + 1, bodyW - 8, 2);
      // Brass cooking ladle
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + 20, baseY + 18 + gestureOffset * 0.4, 2, 12);
      ctx.beginPath();
      ctx.ellipse(px + 21, baseY + 30 + gestureOffset * 0.4, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.id === 'flower_seller') {
      // Nauvari Saree with golden zari border draped gracefully
      ctx.fillStyle = '#be185d'; // Deep magenta
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
      // Golden border pallu running diagonally
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(bodyX, bodyY + bodyH);
      ctx.lineTo(bodyX + bodyW, bodyY + 3);
      ctx.lineTo(bodyX + bodyW, bodyY + 6);
      ctx.lineTo(bodyX + 3, bodyY + bodyH);
      ctx.closePath();
      ctx.fill();
      // Fresh orange marigold in hand
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(px + 22, baseY + 26, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(px + 22, baseY + 26, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.id === 'organizer') {
      // Maroon Nehru jacket over silk kurta with golden buttons
      ctx.fillStyle = '#831843'; // Royal maroon
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
      // Silk collar
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bodyX + bodyW / 2 - 1, bodyY, 2, 12);
      // Committee Gold Badge
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bodyX + 4, bodyY + 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Clipboard with accounts ledger
      ctx.fillStyle = '#d97706';
      ctx.fillRect(px + 18, baseY + 20, 6, 9);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(px + 19, baseY + 21, 4, 7);
    } else if (this.id === 'elder') {
      // White dhoti-kurta with warm saffron Kashmiri shawl draped on shoulder
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
      // Saffron embroidered shawl
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(bodyX, bodyY + 1, 7, bodyH - 1);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bodyX, bodyY + bodyH - 2, 7, 1.5);
      // Wooden walking cane (laathi) with polished brass handle
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px + 22, baseY + 16);
      ctx.lineTo(px + 22, baseY + 42);
      ctx.stroke();
      // Brass handle
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(px + 21, baseY + 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.id === 'child') {
      // Bright festival Kurta
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
      // Spinning festival mela pinwheel (firki) on stick
      const spin = this.animTimer * 12;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px + 18, baseY + 22);
      ctx.lineTo(px + 25, baseY + 9);
      ctx.stroke();

      const cx = px + 25;
      const cy = baseY + 9;
      const colors = ['#ef4444', '#3b82f6', '#facc15', '#10b981'];
      for (let p = 0; p < 4; p++) {
        const a = spin + (p * Math.PI) / 2;
        ctx.fillStyle = colors[p];
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.id === 'volunteer') {
      // Emerald kurta with blue volunteer sash
      ctx.fillStyle = '#15803d';
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
      ctx.fillStyle = '#0284c7'; // Blue sash
      ctx.beginPath();
      ctx.moveTo(bodyX, bodyY);
      ctx.lineTo(bodyX + 4, bodyY);
      ctx.lineTo(bodyX + bodyW, bodyY + bodyH);
      ctx.lineTo(bodyX + bodyW - 4, bodyY + bodyH);
      ctx.closePath();
      ctx.fill();
      // Volunteer badge
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bodyX + 3, bodyY + 6, 3.5, 2.5);
    } else if (this.id === 'musician') {
      // Royal blue kurta with golden embroidery
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(bodyX + bodyW / 2 - 1, bodyY, 2, bodyH);
      // Brass percussion cymbals (Manjira) in hands
      const cymbalSway = Math.sin(this.animTimer * 8) * 3;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px + 11 - cymbalSway * 0.3, baseY + 25, 3.5, 0, Math.PI * 2);
      ctx.arc(px + 17 + cymbalSway * 0.3, baseY + 25, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(px + 11 - cymbalSway * 0.3, baseY + 25, 1.5, 0, Math.PI * 2);
      ctx.arc(px + 17 + cymbalSway * 0.3, baseY + 25, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderCharacterHeadwear(ctx, px, headY, headR) {
    if (this.id === 'elder') {
      // Silver-white hair with distinguished side temples
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(px + 14, headY - 1, headR + 0.5, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      // Silver mustache
      if (this.facing === 'down') {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(px + 14, headY + 3.2, 3.5, 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.id === 'flower_seller') {
      // Elegant black hair bun with fresh white jasmine gajra garland
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(px + 14, headY - 1, headR + 0.3, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      // Hair bun on top
      ctx.beginPath();
      ctx.arc(px + 14, headY - headR + 0.5, 3.8, 0, Math.PI * 2);
      ctx.fill();
      // Fragrant white Jasmine Gajra garland circling bun
      ctx.fillStyle = '#ffffff';
      for (let g = 0; g < 6; g++) {
        const ga = (g / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(px + 14 + Math.cos(ga) * 4.2, headY - headR + 0.5 + Math.sin(ga) * 3, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Traditional Maharashtrian gold pearl nath (nose ring)
      if (this.facing === 'down' || this.facing === 'left') {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(px + 12.5, headY + 2.5, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 12.3, headY + 3.3, 0.7, 0.7);
      }
    } else if (this.id === 'musician') {
      // Saffron/Red Royal Maharashtrian Pheta Turban
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(px + 14, headY - 2, headR + 1.8, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
      // Pheta pleat bands
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(px + 14 - headR - 1, headY - 4, (headR + 1) * 2, 2.5);
      // Gold Zari Shirpech / Turban Brooch
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(px + 14, headY - 5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(px + 14, headY - 5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.id === 'cook') {
      // Tall traditional white cotton chef cap (topi)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(px + 14 - headR, headY - headR - 5, headR * 2, 6);
      ctx.beginPath();
      ctx.ellipse(px + 14, headY - headR - 5, headR + 1, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Black hair trim beneath cap
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(px + 14 - headR, headY - headR, headR * 2, 1.8);
    } else if (this.id === 'child') {
      // Youthful ruffled black hair
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px + 14, headY - 1, headR + 0.6, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
    } else {
      // Standard styled black hair
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(px + 14, headY - 1, headR + 0.4, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
    }
  }
}
