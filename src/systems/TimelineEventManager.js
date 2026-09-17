import { TIMELINE_EVENTS } from './TimelineData.js';

/**
 * TimelineEventManager.js
 * Evaluates declarative timeline events against the game clock,
 * dispatches notifications, and triggers world changes.
 */
export class TimelineEventManager {
  constructor() {
    this.events = JSON.parse(JSON.stringify(TIMELINE_EVENTS));
    this.firedEventIds = new Set();
    this.listeners = new Map();

    // World states driven by timeline events
    this.worldState = {
      devoteesArrived: false,
      isRaining: false,
      PRASADMActive: false,
      aartiPrep: false,
      aartiBegun: false
    };

    // Active visual toast / banner for HUD
    this.activeToast = null;
    this.toastTimer = 0;
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  emit(eventName, data) {
    const list = this.listeners.get(eventName);
    if (list) {
      for (let i = 0; i < list.length; i++) {
        list[i](data);
      }
    }
  }

  update(dt, clock) {
    // Update active toast banner timer
    if (this.activeToast) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.activeToast = null;
      }
    }

    // Evaluate all events in timeline order
    for (let i = 0; i < this.events.length; i++) {
      const evt = this.events[i];
      if (this.firedEventIds.has(evt.id)) continue;

      if (clock.isPastOrAt(evt.hour, evt.minute)) {
        this._fireEvent(evt, clock);
      }
    }
  }

  _fireEvent(evt, clock) {
    this.firedEventIds.add(evt.id);

    // Apply specific world-state modifications
    switch (evt.actionType) {
      case 'DEVOTEES_ARRIVE':
        this.worldState.devoteesArrived = true;
        break;
      case 'START_RAIN':
        this.worldState.isRaining = true;
        break;
      case 'PRASADM_BEGINS':
        this.worldState.PRASADMActive = true;
        break;
      case 'AARTI_PREP':
        this.worldState.aartiPrep = true;
        break;
      case 'AARTI_START':
        this.worldState.aartiBegun = true;
        break;
    }

    // Set visual toast notification
    this.activeToast = {
      title: evt.title,
      time: clock.getFormattedTime(),
      description: evt.description,
      category: evt.category
    };
    this.toastTimer = 4.5; // Display for 4.5 seconds

    // Emit event to subscribers
    this.emit('eventFired', evt);
    this.emit(evt.actionType, evt);

    console.log(`[Timeline] ${clock.getFormattedTime()} -> ${evt.title}`);
  }

  reset() {
    this.firedEventIds.clear();
    this.worldState.devoteesArrived = false;
    this.worldState.isRaining = false;
    this.worldState.PRASADMActive = false;
    this.worldState.aartiPrep = false;
    this.worldState.aartiBegun = false;
    this.activeToast = null;
    this.toastTimer = 0;
  }
}
