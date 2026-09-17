/**
 * RewindSystem.js
 * Manages the time-loop rewind sequence:
 * - Full-screen time warp distortion & chromatic aberration
 * - Rapidly reversing digital clock animation
 * - Inward backward particle stream
 * - Complete world & timeline state restoration while preserving notebook memory
 */
export class RewindSystem {
  constructor() {
    this.isRewinding = false;
    this.duration = 2.0; // 2 seconds transition
    this.timer = 0;
    this.onResetCallback = null;
    this.hasResetTriggered = false;

    // Backward swirling particles
    this.particles = [];
    this._initParticles();
  }

  _initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 200 + Math.random() * 600,
        speed: 300 + Math.random() * 450,
        size: 2 + Math.random() * 3.5,
        color: i % 2 === 0 ? '#38bdf8' : '#f59e0b'
      });
    }
  }

  startRewind(onResetCallback) {
    this.isRewinding = true;
    this.timer = this.duration;
    this.onResetCallback = onResetCallback;
    this.hasResetTriggered = false;
    this._initParticles();
    console.log('[RewindSystem] Rewind sequence initiated!');
  }

  update(dt) {
    if (!this.isRewinding) return;

    this.timer -= dt;

    // Trigger state reset halfway through the animation (peak flash/warp)
    if (!this.hasResetTriggered && this.timer <= this.duration * 0.5) {
      this.hasResetTriggered = true;
      if (this.onResetCallback) {
        this.onResetCallback();
      }
    }

    // Update backward-moving particles (rush inward toward center)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.dist -= p.speed * dt;
      p.angle += dt * 2.5; // Swirl inward

      if (p.dist <= 10) {
        p.dist = 400 + Math.random() * 400;
        p.angle = Math.random() * Math.PI * 2;
      }
    }

    // Finish rewind sequence
    if (this.timer <= 0) {
      this.isRewinding = false;
      this.timer = 0;
      console.log('[RewindSystem] Rewind complete. New loop active.');
    }
  }

  render(ctx, cw, ch, clock) {
    if (!this.isRewinding) return;

    ctx.save();
    const progress = 1 - (this.timer / this.duration); // 0 to 1
    const cx = cw / 2;
    const cy = ch / 2;

    // 1. Full-screen temporal flash & color shift
    const flashAlpha = Math.sin(progress * Math.PI);
    ctx.fillStyle = `rgba(15, 23, 42, ${0.4 + flashAlpha * 0.5})`;
    ctx.fillRect(0, 0, cw, ch);

    // 2. Swirling backward particles rushing toward center
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const px = cx + Math.cos(p.angle) * p.dist;
      const py = cy + Math.sin(p.angle) * p.dist;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Particle streak tail
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(p.angle) * 14, py + Math.sin(p.angle) * 14);
      ctx.stroke();
    }

    // 3. Central Time-Warp Portal Graphic
    const portalRadius = 40 + Math.sin(progress * Math.PI) * 120;
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, portalRadius);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    grad.addColorStop(0.35, 'rgba(56, 189, 248, 0.6)');
    grad.addColorStop(0.75, 'rgba(234, 88, 12, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, portalRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4. Rapidly Reversing Digital Clock Display in Center
    // Calculate simulated reversing clock time (e.g. 6:30 PM down to 5:55 PM)
    const totalMinutesSpan = 35; // 6:30 - 5:55
    const reverseRatio = Math.max(0, 1 - progress);
    const simulatedMinute = Math.floor(55 + (totalMinutesSpan * reverseRatio)) % 60;
    const simulatedHour = reverseRatio > 0.15 ? 18 : 17;
    const displayHour = simulatedHour % 12 || 12;
    const displayMin = String(simulatedMinute).padStart(2, '0');
    const simulatedTimeStr = `${displayHour}:${displayMin} PM`;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.fillText(`↺ ${simulatedTimeStr}`, cx, cy);

    // Label: "REWINDING TIME..."
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 13px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('REWINDING THE EVENING...', cx, cy + 34);

    ctx.restore();
  }
}
