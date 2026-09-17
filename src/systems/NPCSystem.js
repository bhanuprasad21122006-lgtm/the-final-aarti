import { NPC } from '../entities/NPC.js';
import { NPCS_CONFIG } from './NPCData.js';

/**
 * NPCSystem.js
 * Manages the population of festival NPCs, their daily timelines,
 * pathing, and interaction proximity with the player.
 */
export class NPCSystem {
  constructor() {
    this.npcs = [];
    this._initializeNPCs();
  }

  _initializeNPCs() {
    for (let i = 0; i < NPCS_CONFIG.length; i++) {
      const npc = new NPC(NPCS_CONFIG[i]);
      this.npcs.push(npc);
    }
  }

  update(dt, clock) {
    for (let i = 0; i < this.npcs.length; i++) {
      this.npcs[i].update(dt, clock);
    }
  }

  getClosestNPC(playerFoot, radius = 55) {
    let closest = null;
    let minDistance = Infinity;

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const dist = npc.distanceTo(playerFoot);
      if (dist <= radius && dist < minDistance) {
        minDistance = dist;
        closest = npc;
      }
    }

    return closest;
  }

  gatherForGrandAarti() {
    const gatheringPositions = {
      electrician: { x: 680, y: 310 },
      cook: { x: 880, y: 310 },
      flower_seller: { x: 740, y: 330 },
      organizer: { x: 840, y: 330 },
      elder: { x: 720, y: 270 },
      child: { x: 860, y: 270 },
      volunteer: { x: 640, y: 290 },
      musician: { x: 940, y: 290 }
    };

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];
      const pos = gatheringPositions[npc.id] || { x: 800, y: 350 };
      npc.setCelebrating(true, pos.x, pos.y);
    }
  }

  stopCelebration() {
    for (let i = 0; i < this.npcs.length; i++) {
      this.npcs[i].setCelebrating(false);
    }
  }

  getAllEntities() {
    return this.npcs;
  }
}
