/**
 * EndingVisuals.js
 * Visual celebration particle systems and sacred ceremony animations:
 * 1. Flower Petal Cascade: Marigold & rose petals fluttering gently downwards.
 * 2. Festive Confetti: Multi-colored shimmering ribbons and rectangles with 3D tumble.
 * 3. Sacred Aarti Thali: Multi-wick brass lamp rotating in a sacred clockwise arc before Lord Ganesh.
 * 4. Divine Radiance Rays: Golden celestial light beams emanating from Shri Ganesh's golden crown.
 * 5. Cheering Crowd Speech Bubbles: Devotional shouts echoing across the congregation.
 */
export class EndingVisuals {
  constructor() {
    this.petals = [];
    this.confetti = [];
    this.cheers = [];
    this.aartiAngle = 0;
    this.flameEmbers = [];
    this.cheerTimer = 0;
    this._initParticles();
  }

  _initParticles() {
    // 70 Flower Petals (Marigold + Rose)
    const petalColors = ['#f97316', '#facc15', '#ea580c', '#e11d48', '#fb7185', '#fda4af'];
    for (let i = 0; i < 70; i++) {
      this.petals.push({
        x: Math.random() * 1280,
        y: Math.random() * -720,
        radiusX: 4 + Math.random() * 4,
        radiusY: 7 + Math.random() * 5,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        speedY: 35 + Math.random() * 45,
        swaySpeed: 1.5 + Math.random() * 2.0,
        swayAmp: 25 + Math.random() * 35,
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5
      });
    }

    // 60 Confetti Pieces
    const confettiColors = ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#38bdf8', '#a855f7', '#ec4899'];
    for (let i = 0; i < 60; i++) {
      this.confetti.push({
        x: Math.random() * 1280,
        y: Math.random() * -720,
        width: 6 + Math.random() * 5,
        height: 10 + Math.random() * 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        speedY: 60 + Math.random() * 80,
        speedX: (Math.random() - 0.5) * 40,
        flipSpeed: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4
      });
    }
  }

  update(dt, cw, ch, npcs = []) {
    // Update Petals
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.y += p.speedY * dt;
      p.rotation += p.rotSpeed * dt;
      if (p.y > ch + 20) {
        p.y = -20;
        p.x = Math.random() * cw;
      }
    }

    // Update Confetti
    for (let i = 0; i < this.confetti.length; i++) {
      const c = this.confetti[i];
      c.y += c.speedY * dt;
      c.x += c.speedX * dt;
      c.rotation += c.rotSpeed * dt;
      if (c.y > ch + 20) {
        c.y = -20;
        c.x = Math.random() * cw;
      }
    }

    // Aarti Thali Orbit Angle
    this.aartiAngle += dt * 1.8; // Smooth clockwise rotation

    // Aarti Flame Embers
    if (Math.random() < 0.4) {
      const cx = 800;
      const cy = 190;
      const orbitR = 42;
      const ax = cx + Math.cos(this.aartiAngle) * orbitR;
      const ay = cy + Math.sin(this.aartiAngle) * (orbitR * 0.45);

      this.flameEmbers.push({
        x: ax + (Math.random() - 0.5) * 8,
        y: ay - 6,
        vx: (Math.random() - 0.5) * 12,
        vy: -20 - Math.random() * 25,
        life: 0.5,
        maxLife: 0.5,
        color: Math.random() < 0.5 ? '#fef08a' : '#fb923c'
      });
    }

    for (let i = this.flameEmbers.length - 1; i >= 0; i--) {
      const e = this.flameEmbers[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.life -= dt;
      if (e.life <= 0) {
        this.flameEmbers.splice(i, 1);
      }
    }

    // Cheering Crowd Floating Speech Bubbles
    this.cheerTimer += dt;
    if (this.cheerTimer > 1.2 && npcs.length > 0) {
      this.cheerTimer = 0;
      const chants = [
        'गणपती बाप्पा मोरया!',
        'मंगल मूर्ती मोरया!',
        'Ganpati Bappa Morya!',
        'Pudhchya Varshi Lavkar Ya!',
        'Jai Shri Ganesh!',
        'Bappa Morya!'
      ];
      const randomNpc = npcs[Math.floor(Math.random() * npcs.length)];
      if (randomNpc) {
        this.cheers.push({
          text: chants[Math.floor(Math.random() * chants.length)],
          x: randomNpc.x + randomNpc.width / 2,
          y: randomNpc.y - 12,
          life: 2.2,
          maxLife: 2.2,
          color: '#fef08a'
        });
      }
    }

    for (let i = this.cheers.length - 1; i >= 0; i--) {
      const chItem = this.cheers[i];
      chItem.y -= 16 * dt;
      chItem.life -= dt;
      if (chItem.life <= 0) {
        this.cheers.splice(i, 1);
      }
    }
  }

  renderDivineRays(ctx, camera, time) {
    const s = camera.worldToScreen(800, 110); // Ganesha's Mukut crown
    const rayCount = 12;
    const pulse = 0.85 + Math.sin(time * 2.5) * 0.15;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(time * 0.2);

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);

      const grad = ctx.createLinearGradient(0, 0, 160 * pulse, 0);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
      grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
      grad.addColorStop(1, 'rgba(234, 88, 12, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(160 * pulse, -14);
      ctx.lineTo(160 * pulse, 14);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Central divine halo glow
    const haloGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 85 * pulse);
    haloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    haloGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
    haloGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 85 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderAartiCeremony(ctx, camera, time) {
    const cx = 800;
    const cy = 190;
    const orbitR = 44;
    const worldX = cx + Math.cos(this.aartiAngle) * orbitR;
    const worldY = cy + Math.sin(this.aartiAngle) * (orbitR * 0.45);

    const s = camera.worldToScreen(worldX, worldY);

    ctx.save();

    // Sacred Aarti Plate (Pancharti brass thali)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 4, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 3, 16, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Five Sacred Flames (Pancharti wicks)
    const wickOffsets = [
      { dx: 0, dy: 0 },
      { dx: -9, dy: -2 },
      { dx: 9, dy: -2 },
      { dx: -5, dy: 2 },
      { dx: 5, dy: 2 }
    ];

    wickOffsets.forEach((w, idx) => {
      const wx = s.x + w.dx;
      const wy = s.y + w.dy;
      const flicker = Math.sin(time * 12 + idx) * 1.5;

      // Outer golden glow halo
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.beginPath();
      ctx.arc(wx, wy - 5, 8 + flicker, 0, Math.PI * 2);
      ctx.fill();

      // Flame body
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(wx, wy - 5, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Pure burning white-hot camphor center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(wx, wy - 6.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Render trailing embers
    for (let i = 0; i < this.flameEmbers.length; i++) {
      const e = this.flameEmbers[i];
      const es = camera.worldToScreen(e.x, e.y);
      const alpha = Math.max(e.life / e.maxLife, 0);

      ctx.fillStyle = e.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(es.x, es.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderParticles(ctx, camera, time) {
    ctx.save();

    // Render Flower Petals
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      const sway = Math.sin(time * p.swaySpeed + p.phase) * p.swayAmp;
      const px = p.x + sway;
      const py = p.y;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.rotation);

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle petal midrib line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.radiusY * 0.7);
      ctx.lineTo(0, p.radiusY * 0.7);
      ctx.stroke();

      ctx.restore();
    }

    // Render Confetti
    for (let i = 0; i < this.confetti.length; i++) {
      const c = this.confetti[i];
      const flip = Math.cos(time * c.flipSpeed);

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.scale(1, flip);

      ctx.fillStyle = c.color;
      ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);

      ctx.restore();
    }

    // Render Cheering Speech Bubbles
    for (let i = 0; i < this.cheers.length; i++) {
      const chItem = this.cheers[i];
      const cs = camera.worldToScreen(chItem.x, chItem.y);
      const alpha = Math.min(chItem.life / 0.5, 1.0) * Math.min((chItem.maxLife - chItem.life) / 0.3, 1.0);

      ctx.save();
      ctx.globalAlpha = Math.max(alpha, 0);

      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';

      // Text background bubble
      const textWidth = ctx.measureText(chItem.text).width;
      ctx.fillStyle = 'rgba(26, 17, 13, 0.88)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(cs.x - textWidth / 2 - 8, cs.y - 14, textWidth + 16, 18, 6);
      ctx.fill();
      ctx.stroke();

      // Devotional chant text
      ctx.fillStyle = '#fef08a';
      ctx.fillText(chItem.text, cs.x, cs.y - 1);

      ctx.restore();
    }

    ctx.restore();
  }

  reset() {
    this.petals = [];
    this.confetti = [];
    this.cheers = [];
    this.flameEmbers = [];
    this.aartiAngle = 0;
    this.cheerTimer = 0;
    this._initParticles();
  }
}
