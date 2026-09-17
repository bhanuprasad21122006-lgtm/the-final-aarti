/**
 * test_dom_audio.js
 * Comprehensive integration test for Game.js DOM audio controls,
 * keyboard bindings, volume slider, and dynamic music transitions.
 */
import { AudioManager } from './src/audio/AudioManager.js';
import { Game } from './src/core/Game.js';

let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
  }
}

console.log('=== RUNNING DOM AUDIO CONTROLS & GAME INTEGRATION TEST ===\n');

// Mock browser DOM environment
const listeners = {};
const elements = {};

function createElement(id, tagName = 'div') {
  const el = {
    id,
    tagName,
    textContent: '',
    value: '75',
    title: '',
    classList: {
      _classes: new Set(),
      add: (c) => el.classList._classes.add(c),
      remove: (c) => el.classList._classes.delete(c),
      contains: (c) => el.classList._classes.has(c)
    },
    style: {},
    appendChild: () => {},
    addEventListener: (event, handler) => {
      if (!listeners[id]) listeners[id] = {};
      if (!listeners[id][event]) listeners[id][event] = [];
      listeners[id][event].push(handler);
    },
    dispatchEvent: (event) => {
      const handlers = (listeners[id] && listeners[id][event.type]) || [];
      handlers.forEach(h => h(event));
    }
  };
  elements[id] = el;
  return el;
}

// Register all HUD elements used by Game
createElement('hud-clock', 'span');
createElement('hud-pause-btn', 'button');
createElement('hud-restart-btn', 'button');
createElement('hud-notebook-btn', 'button');
createElement('notebook-badge', 'span');
createElement('hud-mute-btn', 'button');
createElement('hud-volume-slider', 'input');
createElement('hud-readiness-percent', 'span');
createElement('hud-readiness-bar', 'div');
createElement('hud-inventory-container', 'div');
createElement('dialog-overlay', 'div');
createElement('dialog-title', 'h2');
createElement('dialog-badge', 'span');
createElement('dialog-activity', 'div');
createElement('dialog-body', 'p');
createElement('dialog-close-btn', 'button');
createElement('notebook-overlay', 'div');
createElement('notebook-loop-indicator', 'div');
createElement('notebook-entries-list', 'ul');
createElement('notebook-section-desc', 'p');
createElement('notebook-close-x', 'button');
createElement('notebook-footer-close-btn', 'button');
createElement('failure-overlay', 'div');
createElement('failure-title', 'h2');
createElement('failure-cause', 'p');
createElement('timeline-recap-list', 'ul');
createElement('failure-rewind-btn', 'button');
createElement('victory-overlay', 'div');
createElement('victory-replay-btn', 'button');

const windowListeners = {};
global.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener: (event, handler) => {
    if (!windowListeners[event]) windowListeners[event] = [];
    windowListeners[event].push(handler);
  },
  dispatchEvent: (event) => {
    const handlers = windowListeners[event.type] || [];
    handlers.forEach(h => h(event));
  }
};

global.document = {
  getElementById: (id) => elements[id] || null,
  querySelectorAll: () => [],
  createElement: (tagName) => {
    const el = createElement('gen-' + Math.random(), tagName);
    el.appendChild = () => {};
    return el;
  }
};

// Canvas mock
const canvasMock = {
  width: 1024,
  height: 640,
  getContext: () => ({
    save: () => {},
    restore: () => {},
    translate: () => {},
    fillRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    measureText: () => ({ width: 50 })
  })
};

// Initialize Game
const game = new Game(canvasMock);

// 1. Initial Audio State in Game
assert(game.audioManager !== null, 'Game initialized with AudioManager instance');
assert(elements['hud-mute-btn'] !== undefined, 'Mute button element found');
assert(elements['hud-volume-slider'] !== undefined, 'Volume slider element found');

// 2. Mute Button Click Handling
const muteBtn = elements['hud-mute-btn'];
const muteClickHandlers = listeners['hud-mute-btn']['click'];
assert(muteClickHandlers.length > 0, 'Mute button has click event listener attached');

// Simulate click to mute
muteClickHandlers[0]({});
assert(game.audioManager.isMuted === true, 'Clicking mute button sets isMuted to true');
assert(muteBtn.textContent === '🔇', 'Mute button text updated to 🔇');
assert(muteBtn.classList.contains('muted'), 'Mute button has "muted" CSS class');

// Simulate click to unmute
muteClickHandlers[0]({});
assert(game.audioManager.isMuted === false, 'Clicking mute button again sets isMuted to false');
assert(muteBtn.textContent === '🔊', 'Mute button text updated to 🔊');
assert(!muteBtn.classList.contains('muted'), 'Mute button removed "muted" CSS class');

// 3. Volume Slider Input Handling
const volumeSlider = elements['hud-volume-slider'];
const volumeInputHandlers = listeners['hud-volume-slider']['input'];
assert(volumeInputHandlers.length > 0, 'Volume slider has input event listener attached');

// Simulate slider change to 45%
volumeSlider.value = '45';
volumeInputHandlers[0]({});
assert(Math.abs(game.audioManager.volume - 0.45) < 0.001, 'Volume slider sets volume to 0.45');

// 4. Keyboard Shortcut 'M'
const keydownHandlers = windowListeners['keydown'];
assert(keydownHandlers.length > 0, 'Window has keydown listener for keyboard shortcuts');

// Simulate 'M' key press
keydownHandlers.forEach(h => h({ code: 'KeyM' }));
assert(game.audioManager.isMuted === true, 'Keydown "M" toggles mute to true');
assert(muteBtn.textContent === '🔇', 'Button updated to 🔇 on keypress');

// Simulate 'M' key press again
keydownHandlers.forEach(h => h({ code: 'KeyM' }));
assert(game.audioManager.isMuted === false, 'Keydown "M" toggles mute back to false');
assert(muteBtn.textContent === '🔊', 'Button updated to 🔊 on keypress');

// 5. Notebook Open / Close Audio Feedback
let notebookOpenPlayed = false;
let notebookClosePlayed = false;
game.audioManager.playNotebookOpen = () => { notebookOpenPlayed = true; };
game.audioManager.playNotebookClose = () => { notebookClosePlayed = true; };

// Open notebook
game._toggleNotebook();
assert(notebookOpenPlayed === true, 'Opening notebook calls playNotebookOpen()');

// Close notebook
game._toggleNotebook();
assert(notebookClosePlayed === true, 'Closing notebook calls playNotebookClose()');

// 6. Dynamic Music Tension & Exploration Checks
game.clock.setTime(17, 56);
game.puzzleSystem.puzzles.crowd.solved = false;
game._update(0.016);
assert(game.audioManager.currentMusicState === 'exploration', 'At 5:56 PM music is exploration');

// Advance clock to 5:59 PM (Tension window before 6:00 crowd arrival / 6:05 bottleneck)
game.clock.setTime(17, 59);
game._update(0.016);
assert(game.audioManager.currentMusicState === 'tension', 'At 5:59 PM approaching crowd bottleneck, music transitions to tension');

// Solve crowd obstruction
game.puzzleSystem.solveCrowd(game.clock, game.notebookSystem);
game._update(0.016);
assert(game.audioManager.currentMusicState === 'exploration', 'After clearing crowd obstruction, music transitions back to exploration');

// 7. Rewind Audio
let rewindPlayed = false;
game.audioManager.playRewind = () => { rewindPlayed = true; };
game.triggerRewind();
assert(rewindPlayed === true, 'Triggering rewind calls playRewind()');
assert(game.audioManager.currentMusicState === 'rewind', 'Music transitions to rewind on triggerRewind()');

console.log(`\n==============================================`);
console.log(`DOM AUDIO RESULTS: ${passed} / ${total} passed (${Math.round((passed / total) * 100)}%)`);
console.log(`==============================================\n`);

if (passed === total) {
  console.log('>>> DOM AUDIO INTEGRATION TESTS PASSED 100%! <<<\n');
  process.exit(0);
} else {
  console.error('>>> SOME DOM AUDIO TESTS FAILED! <<<\n');
  process.exit(1);
}
