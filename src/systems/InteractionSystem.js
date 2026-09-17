/**
 * InteractionSystem.js
 * Tracks proximity between player and interactable objects/NPCs,
 * drives the interaction prompt UI, and manages inspect & dialogue modal triggers.
 */
export class InteractionSystem {
  constructor() {
    this.currentInteractable = null;
    this.activeDialog = null;
    this.customHandler = null;
  }

  update(player, mapInteractables, npcs, input, isBlackout = false) {
    // If a dialog is open, pressing E or Escape closes it
    if (this.activeDialog) {
      if (input.isInteractJustPressed()) {
        input.consumeInteract();
        this.closeDialog();
      }
      return;
    }

    const foot = player.getFootPosition();
    let closest = null;
    let minDistance = Infinity;

    // 1. Check proximity to NPCs
    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const dist = npc.distanceTo(foot);
      if (dist <= npc.interactRadius && dist < minDistance) {
        minDistance = dist;
        closest = {
          type: 'npc',
          entity: npc,
          prompt: `Talk to ${npc.name.split(' ')[0]}`,
          target: npc
        };
      }
    }

    // 2. Check proximity to map props (including Damaged Cable)
    for (let i = 0; i < mapInteractables.length; i++) {
      const obj = mapInteractables[i];
      if (!obj.active) continue;

      const dist = obj.distanceTo(foot);
      if (dist <= obj.interactRadius && dist < minDistance) {
        minDistance = dist;
        closest = {
          type: 'prop',
          entity: obj,
          prompt: obj.prompt || 'Inspect',
          target: obj
        };
      }
    }

    this.currentInteractable = closest;

    // Trigger interaction
    if (this.currentInteractable && input.isInteractJustPressed()) {
      input.consumeInteract();
      this.triggerInteraction(this.currentInteractable, isBlackout);
    }
  }

  triggerInteraction(interactable, isBlackout = false) {
    if (this.customHandler) {
      const customDialog = this.customHandler(interactable, isBlackout);
      if (customDialog) {
        this.activeDialog = customDialog;
        return;
      }
    }

    if (interactable.type === 'npc') {
      const npc = interactable.entity;
      this.activeDialog = {
        title: npc.name,
        badge: npc.role,
        activity: `Status: ${npc.currentActivity}`,
        description: `"${npc.getCurrentDialogue(isBlackout)}"`,
        isNPC: true
      };
    } else {
      const obj = interactable.entity;
      this.activeDialog = {
        title: obj.name,
        badge: obj.category,
        activity: '',
        description: obj.description,
        isNPC: false
      };
    }
  }

  closeDialog() {
    this.activeDialog = null;
  }

  getPrompt() {
    if (this.activeDialog) {
      return 'Press [E] to Close';
    }
    if (this.currentInteractable) {
      return `[E] ${this.currentInteractable.prompt}`;
    }
    return null;
  }
}
