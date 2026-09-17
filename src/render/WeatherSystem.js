/**
 * WeatherSystem.js
 * High-fidelity atmospheric monsoon weather system:
 * - Dynamic wind-slanted translucent rain streaks with varying depth & velocity
 * - Ground impact splash bursts with micro-droplet bounces
 * - Concentric elliptical ground ripples expanding on wet pavers
 * - Subtle monsoon humidity atmospheric vignette
 */
export class WeatherSystem {
  constructor(maxParticles = 160) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.splashes = [];
    this.ripples = [];
    this.active = false;
    this.windAngle = -0.28; // Natural monsoon wind slant
    this.time = 0;

    this._initParticles();
  }

  _initParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      // 3 depth layers: foreground (fast/bright), midground, background (slow/subtle)
      const layer = Math.random();
      this.particles.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        speed: 480 + layer * 320,
        length: 10 + layer * 14,
        alpha: 0.25 + layer * 0.45,
        width: layer > 0.7 ? 1.4 : 1.0,
        color: layer > 0.7 ? '#bae6fd' : '#7dd3fc'
      });
    }
  }

  update(dt, isRaining, width, height) {
    this.active = isRaining;
    if (!this.active) {
      this.splashes = [];
      this.ripples = [];
      return;
    }

    this.time += dt;
    // Dynamic organic wind gust oscillation
    const currentWind = this.windAngle + Math.sin(this.time * 0.8) * 0.08;

    // 1. Update falling rain streaks
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += p.speed * dt;
      p.x += p.speed * dt * currentWind;

      if (p.y > height) {
        // Ground impact point
        const impactX = p.x;
        const impactY = height - 10 - Math.random() * (height * 0.45);

        // Spawn ground impact ripple
        if (Math.random() < 0.35 && this.ripples.length < 35) {
          this.ripples.push({
            x: impactX,
            y: impactY,
            radius: 1.5,
            maxRadius: 6 + Math.random() * 7,
            alpha: 0.65,
            growSpeed: 16 + Math.random() * 10
          });
        }

        // Spawn impact splash micro-droplets
        if (Math.random() < 0.25 && this.splashes.length < 40) {
          const count = 2 + Math.floor(Math.random() * 2);
          for (let s = 0; s < count; s++) {
            this.splashes.push({
              x: impactX,
              y: impactY,
              vx: (Math.random() - 0.5) * 50 + currentWind * 30,
              vy: -25 - Math.random() * 45,
              alpha: 0.75,
              life: 0.22,
              maxLife: 0.22
            });
          }
        }

        // Recycle droplet above screen
        p.y = -30 - Math.random() * 40;
        p.x = Math.random() * (width + 350) - 100;
      }
    }

    // 2. Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += dt * r.growSpeed;
      r.alpha -= dt * 1.1;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // 3. Update splash droplets
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 220 * dt; // Gravity
      s.life -= dt;
      s.alpha = Math.max(0, s.life / s.maxLife * 0.75);
      if (s.life <= 0) {
        this.splashes.splice(i, 1);
      }
    }
  }

  render(ctx, width, height) {
    if (!this.active) return;

    ctx.save();

    // 1. Concentric ground water ripples
    for (let i = 0; i < this.ripples.length; i++) {
      const r = this.ripples[i];
      ctx.strokeStyle = `rgba(186, 230, 253, ${r.alpha * 0.7})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.radius * 1.8, r.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner faint secondary ring
      if (r.radius > 3) {
        ctx.strokeStyle = `rgba(224, 242, 254, ${r.alpha * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius * 1.1, r.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 2. Micro-splash bounces
    ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
    for (let i = 0; i < this.splashes.length; i++) {
      const s = this.splashes[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Falling translucent rain streaks
    const currentWind = this.windAngle + Math.sin(this.time * 0.8) * 0.08;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.lineWidth = p.width;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.length * currentWind, p.y + p.length);
      ctx.stroke();
    }

    // 4. Monsoon humidity atmospheric mist wash
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
