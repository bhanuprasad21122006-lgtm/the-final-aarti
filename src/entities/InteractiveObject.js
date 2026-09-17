import { Entity } from './Entity.js';

/**
 * InteractiveObject.js
 * Represents interactive world props (Altar, Stalls, Generator, Diyas, etc.)
 * with collision, detection radius, and descriptive interaction payloads.
 */
export class InteractiveObject extends Entity {
  constructor({
    id,
    name,
    x,
    y,
    width,
    height,
    solid = true,
    collider = null,
    interactRadius = 60,
    prompt = 'Press E to inspect',
    description = '',
    category = 'prop',
    renderCustom = null
  }) {
    super(x, y, width, height);

    this.id = id;
    this.name = name;
    this.solid = solid;
    this.interactRadius = interactRadius;
    this.prompt = prompt;
    this.description = description;
    this.category = category;
    this.renderCustom = renderCustom;

    if (collider) {
      this.collider = collider;
    } else {
      this.collider = {
        offsetX: 0,
        offsetY: 0,
        width: width,
        height: height
      };
    }
  }

  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  distanceTo(point) {
    const center = this.getCenter();
    const dx = center.x - point.x;
    const dy = center.y - point.y;
    return Math.hypot(dx, dy);
  }

  isPlayerInRange(playerFoot) {
    return this.distanceTo(playerFoot) <= this.interactRadius;
  }

  render(ctx, camera) {
    if (this.renderCustom) {
      this.renderCustom(ctx, camera, this);
    }
  }
}
