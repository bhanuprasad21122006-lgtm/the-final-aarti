/**
 * Entity.js
 * Base class for all game entities in The Final Aarti.
 */
export class Entity {
  constructor(x = 0, y = 0, width = 32, height = 32) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    // Collision box offset relative to (x, y)
    this.collider = {
      offsetX: 0,
      offsetY: 0,
      width: width,
      height: height
    };

    this.solid = true;
    this.active = true;
  }

  getBounds() {
    return {
      left: this.x + this.collider.offsetX,
      right: this.x + this.collider.offsetX + this.collider.width,
      top: this.y + this.collider.offsetY,
      bottom: this.y + this.collider.offsetY + this.collider.height
    };
  }

  intersects(other) {
    const a = this.getBounds();
    const b = other.getBounds ? other.getBounds() : other;
    return (
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top
    );
  }

  update(dt) {}

  render(ctx, camera) {}
}
