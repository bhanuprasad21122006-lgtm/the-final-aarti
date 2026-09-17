/**
 * FailureSystem.js
 * Manages the three distinct failure outcomes:
 * 1. Crowd Failure (Entrance bottleneck / stampede)
 * 2. Electrical Failure (Water short circuit / blackout)
 * 3. Modak Failure (PRASADM unavailable / crowd uproar)
 *
 * Logs detailed chronological recaps, updates visual states (sparks, blackout),
 * and powers the Failure Recap Modal.
 */
export class FailureSystem {
  constructor() {
    this.festivalFailed = false;
    this.failureType = null; // 'crowd' | 'electrical' | 'modak'
    this.failureTitle = 'FESTIVAL FAILED';
    this.failureCause = '';
    this.timelineRecap = [];

    // Electrical specific flags
    this.powerFailed = false;
    this.blackout = false;
    this.sparks = [];
  }

  triggerFailure(type, details) {
    if (this.festivalFailed) return;

    this.festivalFailed = true;
    this.failureType = type;
    this.failureTitle = details.title ? `FESTIVAL FAILED: ${details.title.toUpperCase()}` : 'FESTIVAL FAILED';
    this.failureCause = details.cause || 'The festival preparation was disrupted.';
    this.timelineRecap = details.recap || [];

    if (type === 'electrical') {
      this.powerFailed = true;
      this.blackout = true;
      this._spawnSparks(255, 345, 25);
    }

    console.log(`[FailureSystem] Triggered Failure: ${type} - ${this.failureTitle}`);
  }

  update(dt) {
    // Update spark particles if active
    if (this.sparks.length > 0 || (this.powerFailed && Math.random() < 0.15)) {
      this._updateSparks(dt);
    }
  }

  _spawnSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.sparks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.4,
        maxLife: 0.7
      });
    }
  }

  _updateSparks(dt) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    if (this.powerFailed && Math.random() < 0.15) {
      this._spawnSparks(255, 345, 3);
    }
  }

  renderSparks(ctx, camera) {
    if (this.sparks.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.sparks.length; i++) {
      const sp = this.sparks[i];
      const s = camera.worldToScreen(sp.x, sp.y);
      const alpha = Math.max(sp.life / sp.maxLife, 0);

      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  reset() {
    this.festivalFailed = false;
    this.failureType = null;
    this.failureTitle = 'FESTIVAL FAILED';
    this.failureCause = '';
    this.timelineRecap = [];
    this.powerFailed = false;
    this.blackout = false;
    this.sparks = [];
  }
}
