/**
 * InputManager.js
 * Hardware abstraction layer mapping keyboard inputs to gameplay actions.
 */
export class InputManager {
  constructor() {
    this.keys = new Set();
    this.actions = {
      up: false,
      down: false,
      left: false,
      right: false,
      interact: false,
      interactJustPressed: false
    };

    this._prevInteract = false;

    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
    // Reset keys when window loses focus
    window.addEventListener('blur', () => this.keys.clear());
  }

  _onKeyDown(e) {
    // Prevent default scroll behaviors for arrow keys & space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      if (e.preventDefault) e.preventDefault();
    }
    if (e.code) this.keys.add(e.code);
    if (e.key) this.keys.add(e.key.toLowerCase());
  }

  _onKeyUp(e) {
    if (e.code) this.keys.delete(e.code);
    if (e.key) this.keys.delete(e.key.toLowerCase());
  }

  update() {
    // Directional actions: WASD or Arrow Keys
    this.actions.up = this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('w');
    this.actions.down = this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.keys.has('s');
    this.actions.left = this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.keys.has('a');
    this.actions.right = this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.keys.has('d');

    // Interact action: E key
    const currentInteract = this.keys.has('KeyE') || this.keys.has('e');
    this.actions.interactJustPressed = currentInteract && !this._prevInteract;
    this.actions.interact = currentInteract;
    this._prevInteract = currentInteract;
  }

  isActionActive(action) {
    return !!this.actions[action];
  }

  isInteractJustPressed() {
    return this.actions.interactJustPressed;
  }

  consumeInteract() {
    this.actions.interactJustPressed = false;
  }
}
