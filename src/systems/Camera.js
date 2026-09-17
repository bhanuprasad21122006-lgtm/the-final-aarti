/**
 * Camera.js
 * 2D viewport camera with smooth target following and boundary clamping.
 */
export class Camera {
  constructor(viewportWidth, viewportHeight, worldWidth, worldHeight) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.x = 0;
    this.y = 0;
    this.target = null;
    this.smoothSpeed = 0.12; // Lerp smoothing factor

    // Screen-shake system for dramatic impact (blackout, electrical short)
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  follow(target) {
    this.target = target;
    if (this.target) {
      // Immediate snap to target on assignment
      this.x = this.target.x - this.viewportWidth / 2;
      this.y = this.target.y - this.viewportHeight / 2;
      this._clamp();
    }
  }

  panTo(target, smooth = 0.05) {
    this.target = target;
    this.smoothSpeed = smooth;
  }

  shake(intensity = 5, duration = 0.3) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  update(dt = 0.016) {
    // Update screen-shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const currentAmp = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentAmp;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentAmp;
      if (this.shakeTimer <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    if (!this.target) return;

    const desiredX = this.target.x - this.viewportWidth / 2;
    const desiredY = this.target.y - this.viewportHeight / 2;

    this.x += (desiredX - this.x) * this.smoothSpeed;
    this.y += (desiredY - this.y) * this.smoothSpeed;

    this._clamp();
  }

  _clamp() {
    // If world is smaller than viewport, center it
    if (this.worldWidth < this.viewportWidth) {
      this.x = (this.worldWidth - this.viewportWidth) / 2;
    } else {
      this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewportWidth));
    }

    if (this.worldHeight < this.viewportHeight) {
      this.y = (this.worldHeight - this.viewportHeight) / 2;
    } else {
      this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.viewportHeight));
    }
  }

  worldToScreen(worldX, worldY) {
    return {
      x: Math.round(worldX - this.x + this.shakeOffsetX),
      y: Math.round(worldY - this.y + this.shakeOffsetY)
    };
  }
}
