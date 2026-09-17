import { Entity } from './Entity.js';

/**
 * Player.js
 * Controllable volunteer Aarav with 4-way movement, idle/walk animations,
 * and obstacle collision handling.
 */
export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 32, 48);

    // Foot collider for natural top-down obstacle depth
    this.collider = {
      offsetX: 6,
      offsetY: 30,
      width: 20,
      height: 16
    };

    this.speed = 190; // Comfortable exploration speed (pixels/sec)
    this.facing = 'down'; // 'up' | 'down' | 'left' | 'right'
    this.state = 'idle';  // 'idle' | 'walk'

    this.walkAnimTimer = 0;
    this.walkAnimFrame = 0;
    this.idleAnimTimer = 0;

    // Interaction reach (distance from player center)
    this.interactionRadius = 55;
  }

  getFootPosition() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height - 4
    };
  }

  update(dt, input, collisionObstacles = []) {
    let dx = 0;
    let dy = 0;

    if (input.isActionActive('up')) {
      dy -= 1;
      this.facing = 'up';
    }
    if (input.isActionActive('down')) {
      dy += 1;
      this.facing = 'down';
    }
    if (input.isActionActive('left')) {
      dx -= 1;
      this.facing = 'left';
    }
    if (input.isActionActive('right')) {
      dx += 1;
      this.facing = 'right';
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.SQRT2;
      dx *= invLen;
      dy *= invLen;
    }

    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving) {
      this.state = 'walk';
      this.walkAnimTimer += dt * 10;
      this.walkAnimFrame = Math.floor(this.walkAnimTimer) % 4;

      // Move with separate X and Y axis collision testing (slide along obstacles)
      const moveX = dx * this.speed * dt;
      this._moveAxis(moveX, 0, collisionObstacles);

      const moveY = dy * this.speed * dt;
      this._moveAxis(0, moveY, collisionObstacles);
    } else {
      this.state = 'idle';
      this.idleAnimTimer += dt * 3;
      this.walkAnimTimer = 0;
      this.walkAnimFrame = 0;
    }
  }

  _moveAxis(dx, dy, obstacles) {
    this.x += dx;
    this.y += dy;

    const playerBox = this.getBounds();

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (!obs.solid) continue;

      const obsBox = obs.getBounds ? obs.getBounds() : obs;
      if (
        playerBox.left < obsBox.right &&
        playerBox.right > obsBox.left &&
        playerBox.top < obsBox.bottom &&
        playerBox.bottom > obsBox.top
      ) {
        // Collision occurred; resolve by backing out of this axis
        if (dx > 0) {
          this.x = obsBox.left - this.collider.offsetX - this.collider.width;
        } else if (dx < 0) {
          this.x = obsBox.right - this.collider.offsetX;
        }

        if (dy > 0) {
          this.y = obsBox.top - this.collider.offsetY - this.collider.height;
        } else if (dy < 0) {
          this.y = obsBox.bottom - this.collider.offsetY;
        }
      }
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);
    const px = screen.x;
    const py = screen.y;

    ctx.save();

    // 1. Soft Dynamic Character Drop Shadow
    ctx.fillStyle = 'rgba(18, 10, 7, 0.38)';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 45, 12, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Animation Cycles
    let bob = 0;
    let legOffset = 0;
    let armSwing = 0;
    let clothSway = 0;

    if (this.state === 'walk') {
      bob = Math.sin(this.walkAnimTimer * 2) * 1.8;
      legOffset = Math.sin(this.walkAnimTimer * 2) * 4.8;
      armSwing = Math.sin(this.walkAnimTimer * 2) * 4.5;
      clothSway = Math.sin(this.walkAnimTimer * 2 + 0.5) * 3;
    } else {
      bob = Math.sin(this.idleAnimTimer) * 0.9;
      clothSway = Math.sin(this.idleAnimTimer * 0.8) * 1;
    }

    const baseY = py + bob;

    // 3. Traditional Festive Footwear (Mojris - Golden Embroidered Brown Leather)
    const shoeColor = '#78350f';
    const shoeGold = '#facc15';

    // Legs (White Churidar Pyjama with realistic folds)
    ctx.fillStyle = '#f8fafc';
    if (this.facing === 'left' || this.facing === 'right') {
      const dirSign = this.facing === 'left' ? -1 : 1;
      // Back leg
      ctx.fillRect(px + 12 - dirSign * legOffset * 0.4, baseY + 33, 4.5, 9);
      // Front leg
      ctx.fillRect(px + 16 + dirSign * legOffset * 0.4, baseY + 33, 4.5, 9);

      // Shoes
      ctx.fillStyle = shoeColor;
      ctx.fillRect(px + 11 - dirSign * legOffset * 0.4, baseY + 42, 6, 3.5);
      ctx.fillRect(px + 15 + dirSign * legOffset * 0.4, baseY + 42, 6, 3.5);
      // Golden mojri curl
      ctx.fillStyle = shoeGold;
      ctx.fillRect(px + (this.facing === 'left' ? 10 : 20), baseY + 41, 2, 2);
    } else {
      // Left leg & Right leg
      ctx.fillRect(px + 9.5, baseY + 33 + legOffset, 4.5, 9);
      ctx.fillRect(px + 18, baseY + 33 - legOffset, 4.5, 9);

      // Shoes
      ctx.fillStyle = shoeColor;
      ctx.fillRect(px + 8.5, baseY + 42 + legOffset, 6.5, 3.5);
      ctx.fillRect(px + 17, baseY + 42 - legOffset, 6.5, 3.5);
      ctx.fillStyle = shoeGold;
      ctx.fillRect(px + 10, baseY + 43 + legOffset, 3.5, 1.5);
      ctx.fillRect(px + 18.5, baseY + 43 - legOffset, 3.5, 1.5);
    }

    // 4. Back Arm (if walking sideways or facing away)
    ctx.fillStyle = '#ea580c'; // Saffron sleeve
    if (this.facing === 'up') {
      ctx.fillRect(px + 4, baseY + 18 - armSwing, 3.5, 12);
      ctx.fillRect(px + 24.5, baseY + 18 + armSwing, 3.5, 12);
    } else if (this.facing === 'left') {
      ctx.fillRect(px + 21, baseY + 18 - armSwing, 3.5, 11);
      ctx.fillStyle = '#d97736'; // Hand
      ctx.beginPath();
      ctx.arc(px + 22.5, baseY + 30 - armSwing, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.facing === 'right') {
      ctx.fillRect(px + 7.5, baseY + 18 - armSwing, 3.5, 11);
      ctx.fillStyle = '#d97736'; // Hand
      ctx.beginPath();
      ctx.arc(px + 9, baseY + 30 - armSwing, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Kurta Body (Vibrant Festival Saffron Kurta with Royal Zari Borders)
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.roundRect(px + 6.5, baseY + 17, 19, 19, 4);
    ctx.fill();

    // Kurta placket & buttons
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(px + 15, baseY + 17, 2, 9);
    ctx.fillStyle = '#fbbf24'; // Gold buttons
    ctx.fillRect(px + 15.5, baseY + 19, 1, 1.5);
    ctx.fillRect(px + 15.5, baseY + 22, 1, 1.5);
    ctx.fillRect(px + 15.5, baseY + 25, 1, 1.5);

    // Gold Zari Hem Border
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px + 6.5, baseY + 34, 19, 2.5);
    ctx.fillStyle = '#991b1b'; // Red inner piping
    ctx.fillRect(px + 6.5, baseY + 33, 19, 1);

    // 6. Angavastram / Dupatta (Festive Crimson Stole draped over shoulder)
    ctx.fillStyle = '#b91c1c';
    if (this.facing === 'down') {
      // Draped across chest and hanging down both sides
      ctx.fillRect(px + 8, baseY + 17, 4, 16);
      ctx.fillRect(px + 20, baseY + 17, 4, 16);
      // Gold fringe on dupatta
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 8, baseY + 32, 4, 1.5);
      ctx.fillRect(px + 20, baseY + 32, 4, 1.5);
    } else if (this.facing === 'up') {
      ctx.fillRect(px + 7, baseY + 17, 18, 4.5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 7, baseY + 20.5, 18, 1);
    } else if (this.facing === 'left') {
      ctx.fillRect(px + 8 + clothSway * 0.3, baseY + 17, 5, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 8 + clothSway * 0.3, baseY + 32, 5, 1.5);
    } else if (this.facing === 'right') {
      ctx.fillRect(px + 19 + clothSway * 0.3, baseY + 17, 5, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 19 + clothSway * 0.3, baseY + 32, 5, 1.5);
    }

    // 7. Front Arm (Skin-toned hands & saffron sleeve)
    ctx.fillStyle = '#f97316';
    if (this.facing === 'down') {
      ctx.fillRect(px + 4, baseY + 18 + armSwing, 3.5, 11);
      ctx.fillRect(px + 24.5, baseY + 18 - armSwing, 3.5, 11);
      ctx.fillStyle = '#d97736'; // Hands
      ctx.beginPath();
      ctx.arc(px + 5.5, baseY + 30 + armSwing, 2, 0, Math.PI * 2);
      ctx.arc(px + 26, baseY + 30 - armSwing, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.facing === 'left') {
      ctx.fillRect(px + 8, baseY + 18 + armSwing, 3.5, 11);
      ctx.fillStyle = '#d97736';
      ctx.beginPath();
      ctx.arc(px + 9.5, baseY + 30 + armSwing, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.facing === 'right') {
      ctx.fillRect(px + 20, baseY + 18 + armSwing, 3.5, 11);
      ctx.fillStyle = '#d97736';
      ctx.beginPath();
      ctx.arc(px + 21.5, baseY + 30 + armSwing, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Official Volunteer Badge & Lanyard
    ctx.fillStyle = '#0284c7'; // Blue Lanyard
    ctx.fillRect(px + 14.5, baseY + 18, 3, 8);
    ctx.fillStyle = '#ffffff'; // ID Card badge
    ctx.fillRect(px + 13.5, baseY + 26, 5, 4);
    ctx.fillStyle = '#f59e0b'; // Gold badge clip
    ctx.fillRect(px + 15, baseY + 25, 2, 1.5);

    // 9. Head & Facial Features
    // Neck
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(px + 14, baseY + 14, 4, 4);

    // Face Shape
    ctx.fillStyle = '#d97736'; // Warm sun-kissed Indian skin tone
    ctx.beginPath();
    ctx.arc(px + 16, baseY + 10.5, 7.8, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.arc(px + 8.5, baseY + 11, 1.8, 0, Math.PI * 2);
    ctx.arc(px + 23.5, baseY + 11, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Styled Festival Hair (Dark espresso with volume)
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(px + 16, baseY + 8.5, 8.2, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();
    // Forehead bangs / hair wave
    ctx.beginPath();
    ctx.moveTo(px + 8, baseY + 7);
    ctx.quadraticCurveTo(px + 16, baseY + 5, px + 24, baseY + 7);
    ctx.lineTo(px + 24, baseY + 9);
    ctx.quadraticCurveTo(px + 16, baseY + 7.5, px + 8, baseY + 9);
    ctx.fill();

    // Facial features based on facing direction
    if (this.facing === 'down') {
      // Auspicious Red Chandan / Kumkum Tilak
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 15.2, baseY + 6.5, 1.6, 3.5);
      ctx.fillStyle = '#fbbf24'; // Yellow chandan dot
      ctx.fillRect(px + 15.2, baseY + 10.5, 1.6, 1.2);

      // Expressive Eyes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 12.5, baseY + 10.5, 1.8, 2.2);
      ctx.fillRect(px + 17.7, baseY + 10.5, 1.8, 2.2);
      // Eye specular shine
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 13, baseY + 10.8, 0.8, 0.8);
      ctx.fillRect(px + 18.2, baseY + 10.8, 0.8, 0.8);

      // Friendly smile
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px + 16, baseY + 13, 2.2, 0, Math.PI);
      ctx.stroke();
    } else if (this.facing === 'up') {
      // Back of head - full rich styled hair
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(px + 16, baseY + 9.5, 8.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.facing === 'left') {
      // Profile eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 11.5, baseY + 10.5, 1.8, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 12, baseY + 10.8, 0.8, 0.8);
      // Tilak side glint
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 10.5, baseY + 7.5, 1.2, 2.5);
    } else if (this.facing === 'right') {
      // Profile eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 18.7, baseY + 10.5, 1.8, 2.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 19.2, baseY + 10.8, 0.8, 0.8);
      // Tilak side glint
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + 20.3, baseY + 7.5, 1.2, 2.5);
    }

    ctx.restore();
  }
}
