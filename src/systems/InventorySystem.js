/**
 * InventorySystem.js
 * Tracks active items carried by the player during the current loop.
 * Items reset on time rewind, but discoveries and clues remain permanently in the Notebook.
 */
export class InventorySystem {
  constructor() {
    this.items = new Set();
    this.itemDefinitions = {
      storage_key: {
        id: 'storage_key',
        name: 'Brass Storage Key',
        icon: '🔑',
        badge: 'Key Item',
        description: 'Old brass key dropped by Uncle Sharma near Radha\'s flower crates. Unlocks the backstage storage cabinet.'
      },
      replacement_cable: {
        id: 'replacement_cable',
        name: 'Heavy Power Cable & Tarp',
        icon: '⚡',
        badge: 'Electrical',
        description: 'Thick, insulated industrial-grade 415V copper cable with a heavy-duty waterproof tarpaulin cover.'
      },
      fresh_coconut: {
        id: 'fresh_coconut',
        name: 'Fresh Grated Coconut',
        icon: '🥥',
        badge: 'Ingredient',
        description: 'A large bowl of freshly grated wet coconut. Essential filling for Bawarchi Mohan\'s 108 Ukadiche Modaks.'
      }
    };
  }

  addItem(itemId) {
    if (this.itemDefinitions[itemId]) {
      this.items.add(itemId);
      console.log(`[Inventory] Added item: ${itemId}`);
      this.renderHUD();
      return true;
    }
    return false;
  }

  hasItem(itemId) {
    return this.items.has(itemId);
  }

  removeItem(itemId) {
    if (this.items.has(itemId)) {
      this.items.delete(itemId);
      console.log(`[Inventory] Removed item: ${itemId}`);
      this.renderHUD();
      return true;
    }
    return false;
  }

  getItems() {
    return Array.from(this.items).map(id => this.itemDefinitions[id]);
  }

  reset() {
    this.items.clear();
    this.renderHUD();
  }

  renderHUD() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('hud-inventory-container');
    if (!container) return;

    if (this.items.size === 0) {
      container.innerHTML = '<span class="inventory-empty-hint">Inventory: [Empty]</span>';
      return;
    }

    let html = '<span class="inventory-label">Inventory:</span>';
    this.items.forEach(id => {
      const def = this.itemDefinitions[id];
      if (def) {
        html += `
          <div class="inventory-item-badge" title="${def.name}: ${def.description}">
            <span class="inv-icon">${def.icon}</span>
            <span class="inv-name">${def.name}</span>
          </div>
        `;
      }
    });

    container.innerHTML = html;
  }
}
