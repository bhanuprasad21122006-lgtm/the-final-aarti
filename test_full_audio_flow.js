/**
 * test_full_audio_flow.js
 * End-to-end integration test validating the entire game loop audio behavior:
 * 1. Damaged electric equipment fault audio on proximity & inspection
 * 2. Rain sound effects when rain begins at 6:08 PM
 * 3. 50% festival music volume
 * 4. Sound system breakdown stops music on blackout
 * 5. Time rewind restores sound system and continues festival song at 50%
 * 6. Background tab audio muting
 * 7. Final Aarti ceremony with temple bells and sacred mantras
 */

import { Game } from './src/core/Game.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

console.log('=== RUNNING FULL GAME AUDIO FLOW INTEGRATION TEST ===\n');

// Mock browser DOM & Audio
class MockAudioNode {
  constructor() {
    this.gain = {
      value: 1.0,
      setValueAtTime: (v) => { this.gain.value = v; },
      linearRampToValueAtTime: (v) => { this.gain.value = v; },
      exponentialRampToValueAtTime: (v) => { this.gain.value = v; },
      cancelScheduledValues: () => {}
    };
    this.frequency = {
      value: 440,
      setValueAtTime: (v) => { this.frequency.value = v; },
      linearRampToValueAtTime: (v) => { this.frequency.value = v; },
      exponentialRampToValueAtTime: (v) => { this.frequency.value = v; }
    };
    this.Q = {
      value: 1.0,
      setValueAtTime: (v) => { this.Q.value = v; }
    };
  }
  connect(dest) { return dest; }
  disconnect() {}
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = new MockAudioNode();
  }
  createGain() { return new MockAudioNode(); }
  createOscillator() { return new MockAudioNode(); }
  createBiquadFilter() { return new MockAudioNode(); }
  createBufferSource() { return new MockAudioNode(); }
  createBuffer(channels, length, sampleRate) {
    return { getChannelData: () => new Float32Array(length) };
  }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  resume() { this.state = 'running'; return Promise.resolve(); }
}

let spokenUtterances = [];
let speechCancelled = false;
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
    this.pitch = 1.0;
    this.rate = 1.0;
    this.volume = 1.0;
  }
};
globalThis.speechSynthesis = {
  speak: (utt) => { spokenUtterances.push(utt); speechCancelled = false; },
  cancel: () => { speechCancelled = true; },
  getVoices: () => [{ name: 'Neerja (India)', lang: 'en-IN' }]
};

class MockElement {
  constructor(id = '') {
    this.id = id;
    const classes = new Set();
    this.classList = {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c)
    };
    this.style = {};
    this.textContent = '';
    this.innerHTML = '';
    this.children = [];
    this.value = '0.5';
    this.listeners = {};
  }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatchEvent(event) {
    const list = this.listeners[event.type] || [];
    for (const fn of list) fn(event);
  }
  appendChild(child) { this.children.push(child); }
  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k]; }
}

const domElements = {};
function getOrCreateElem(id) {
  if (!domElements[id]) domElements[id] = new MockElement(id);
  return domElements[id];
}

globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  AudioContext: MockAudioContext,
  speechSynthesis: globalThis.speechSynthesis,
  SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance,
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.document = {
  hidden: false,
  getElementById: (id) => getOrCreateElem(id),
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {}
};

const mockCanvas = new MockElement('gameCanvas');
mockCanvas.width = 1280;
mockCanvas.height = 720;
mockCanvas.getContext = () => ({
  fillRect: () => {}, clearRect: () => {}, fillText: () => {}, strokeRect: () => {},
  beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {}, save: () => {}, restore: () => {}
});

const game = new Game(mockCanvas);
game.audioManager.unlockAudio();

// 1. Check Music Volume calibrated to 50%
console.log('Step 1: Song Volume Calibration');
assert(game.audioManager.musicVolume === 0.50, 'Festival song volume calibrated to 50% (0.50)');
assert(Math.abs(game.audioManager.musicGain.gain.value - 0.50) < 0.001, 'musicGain strictly set to 0.50');

// 2. Proximity to Damaged Cable triggers Electrical Fault Audio
console.log('\nStep 2: Damaged Electric Equipment Proximity Warning');
let faultPlayCount = 0;
const origFault = game.audioManager.playElectricalFault.bind(game.audioManager);
game.audioManager.playElectricalFault = () => {
  faultPlayCount++;
  origFault();
};

// Place player near damaged cable (x: 235, y: 335)
game.player.x = 240;
game.player.y = 340;
game._update(0.1); // trigger proximity logic
game._update(4.0); // advance past spark interval
assert(faultPlayCount > 0, 'Approaching damaged electric equipment triggers warning fault crackle');

// 3. Inspecting Damaged Cable triggers Electrical Fault Audio
console.log('\nStep 3: Direct Damaged Cable Inspection');
const cableObj = game.map.interactables.find(i => i.id === 'damaged_cable');
assert(cableObj !== undefined, 'Damaged cable found in map interactables');
const preCount = faultPlayCount;
const dialog = game._handleCustomInteraction({ type: 'prop', entity: cableObj }, false);
assert(dialog !== null, 'Inspection returns detailed hazard dialog');
assert(dialog.badge.includes('Hazard'), 'Dialog warns of severe electrical hazard');
assert(faultPlayCount > preCount, 'Inspecting damaged equipment triggers playElectricalFault()');

// 4. Rain Audio Sync at 6:08 PM
console.log('\nStep 4: Rain Sound Effects & Dynamic Droplets');
// Clear crowd obstruction so the timeline advances past 6:05 PM into the rain & electrical chain
game.puzzleSystem.solveCrowd(game.clock, game.notebookSystem);

assert(game.audioManager.isRaining === false, 'Initially not raining');
game.clock.setTime(18, 8);
game._update(0.1);
assert(game.timelineManager.worldState.isRaining === true, 'Timeline enters rain at 6:08 PM');
assert(game.audioManager.isRaining === true, 'Rain audio synchronized and active');
assert(game.audioManager.raindropInterval !== null, 'Procedural raindrop clicks pattering on canvas');

// 5. Blackout & Sound System Breakdown at 6:10 PM
console.log('\nStep 5: Sound System Breakdown on Electrical Short Circuit');
let powerCutCalled = false;
const origCut = game.audioManager.playPowerCut.bind(game.audioManager);
game.audioManager.playPowerCut = () => {
  powerCutCalled = true;
  origCut();
};

game.clock.setTime(18, 10);
game._update(0.1);

assert(game.failureSystem.powerFailed === true, 'Power failed due to damaged cable short circuit');
assert(game.audioManager.soundSystemWorking === false, 'Sound system marked broken down');
assert(powerCutCalled === true, 'playPowerCut() amplifier breakdown pop executed');
assert(game.audioManager.musicNodes.length === 0, 'Festival music stopped completely when sound system broke down');

// 6. Loop Rewind Restores Sound System & Continues Festival Song at 50%
console.log('\nStep 6: Time Rewind Restores Sound System & Continues Music');
game._performWorldReset();
assert(game.audioManager.soundSystemWorking === true, 'Sound system restored to working order on world reset');
assert(game.audioManager.currentMusicState === 'exploration', 'Festival music continues on loop restart');
assert(Math.abs(game.audioManager.musicGain.gain.value - 0.50) < 0.001, 'Continued festival song remains at 50% volume');

// 7. Background Tab Audio Muting
console.log('\nStep 7: Tab in Background Audio Muting');
game.audioManager.handleVisibilityChange(true);
assert(game.audioManager.isTabHidden === true, 'Tab marked hidden');
assert(game.audioManager.ctx.state === 'suspended', 'AudioContext suspended immediately when tab is in background');

game.audioManager.handleVisibilityChange(false);
assert(game.audioManager.isTabHidden === false, 'Tab marked active');
assert(game.audioManager.ctx.state === 'running', 'AudioContext resumed when tab returns to foreground');

// 8. Final Aarti Ceremony - Bells and Sacred Mantras
console.log('\nStep 8: Final Aarti - Continuous Bells & Sacred Mantras');
spokenUtterances = [];
game.audioManager.startAartiFanfare();
assert(game.audioManager.isPlayingFanfare === true, 'Aarti fanfare active');
assert(game.audioManager.aartiBellInterval !== null, 'Handheld Puja Ghanta rhythmic ringing active');
assert(game.audioManager.aartiMahaGhantaInterval !== null, 'Maha Ghanta bronze bell tolling active');
assert(game.audioManager.isPlayingAartiChant === true, 'Sacred Aarti mantras recitation active');
assert(spokenUtterances.length > 0, 'Devotional Ganesh Aarti mantra chanted via speech engine');

console.log(`Chanted Mantra: "${spokenUtterances[0].text}"`);

game.audioManager.stopAll();
assert(game.audioManager.isPlayingFanfare === false, 'Aarti celebration cleaned up cleanly');

console.log('\n==============================================');
console.log('FULL GAME AUDIO FLOW INTEGRATION TEST PASSED 100%!');
console.log('==============================================\n');
process.exit(0);
