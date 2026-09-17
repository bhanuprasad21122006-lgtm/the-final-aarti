/**
 * test_tab_hidden_deep.js
 * Comprehensive deep verification ensuring zero sound or speech can leak
 * while the tab is hidden, in the background, or blurred.
 */

import { AudioManager } from './src/audio/AudioManager.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

console.log('=== RUNNING DEEP TAB-HIDDEN AUDIO SUPPRESSION TEST ===\n');

let createdOscillators = 0;
let disconnectedCount = 0;
let connectedDestinationCount = 0;

class MockGainNode {
  constructor() {
    this.value = 1.0;
    this.gain = {
      value: 1.0,
      setValueAtTime: (v) => { this.gain.value = v; },
      linearRampToValueAtTime: (v) => { this.gain.value = v; },
      exponentialRampToValueAtTime: (v) => { this.gain.value = v; },
      cancelScheduledValues: () => {}
    };
  }
  connect(dest) {
    if (dest && dest.isDestination) {
      connectedDestinationCount++;
    }
    return dest;
  }
  disconnect() {
    disconnectedCount++;
  }
}

class MockAudioNode {
  constructor() {
    this.gain = new MockGainNode();
    this.frequency = {
      value: 440,
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {}
    };
    this.Q = { setValueAtTime: () => {} };
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
    this.destination = { isDestination: true };
  }
  createGain() { return new MockGainNode(); }
  createOscillator() {
    createdOscillators++;
    return new MockAudioNode();
  }
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
  }
};

globalThis.speechSynthesis = {
  speak: (u) => { spokenUtterances.push(u); speechCancelled = false; },
  cancel: () => { speechCancelled = true; },
  getVoices: () => [{ name: 'Indian English', lang: 'en-IN' }]
};

globalThis.window = {
  AudioContext: MockAudioContext,
  speechSynthesis: globalThis.speechSynthesis,
  SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance,
  addEventListener: () => {},
  removeEventListener: () => {}
};

globalThis.document = {
  hidden: false,
  visibilityState: 'visible',
  addEventListener: () => {}
};

const audio = new AudioManager();
audio.unlockAudio();

console.log('--- Test 1: Verify Initial Foreground Audio State ---');
assert(audio.isTabHidden === false, 'Tab starts in foreground (isTabHidden === false)');
assert(audio.ctx.state === 'running', 'AudioContext is running');

console.log('\n--- Test 2: Hide Tab (handleVisibilityChange(true)) ---');
audio.handleVisibilityChange(true);
assert(audio.isTabHidden === true, 'isTabHidden is true after handleVisibilityChange(true)');
assert(audio.ctx.state === 'suspended', 'AudioContext suspended');
assert(audio.masterGain.gain.value === 0, 'Master gain node explicitly set to 0');
assert(disconnectedCount > 0, 'Master gain physically disconnected from destination');
assert(speechCancelled === true, 'speechSynthesis cancelled');

console.log('\n--- Test 3: Audio Calls while Tab is Hidden must produce 0 Sound/Speech ---');
createdOscillators = 0;
spokenUtterances = [];

audio.speakPopup('Ramesh: The generator needs fuel!');
assert(spokenUtterances.length === 0, 'speakPopup did not speak while tab is hidden');

audio.startAartiChanting();
assert(spokenUtterances.length === 0, 'startAartiChanting did not speak while tab is hidden');

audio.transitionToMusic('exploration');
assert(createdOscillators === 0, 'transitionToMusic deferred and produced 0 oscillators while hidden');

audio._startExplorationMusic();
assert(createdOscillators === 0, '_startExplorationMusic blocked while hidden');

audio._startTensionMusic();
assert(createdOscillators === 0, '_startTensionMusic blocked while hidden');

audio.startAartiFanfare();
assert(audio.isPlayingFanfare === false, 'startAartiFanfare blocked while hidden');

audio.playPujaHandBell();
assert(createdOscillators === 0, 'playPujaHandBell blocked while hidden');

audio.playMahaTempleBell();
assert(createdOscillators === 0, 'playMahaTempleBell blocked while hidden');

audio.playElectricalFault();
assert(createdOscillators === 0, 'playElectricalFault blocked while hidden');

audio.playNPCInteract();
assert(createdOscillators === 0, 'playNPCInteract blocked while hidden');

audio.playPuzzleSolved();
assert(createdOscillators === 0, 'playPuzzleSolved blocked while hidden');

audio._playChimeNote(440);
assert(createdOscillators === 0, '_playChimeNote blocked while hidden');

console.log('\n--- Test 4: Document Reactive Visibility Getter ---');
// Even if handleVisibilityChange has not been called, document.hidden = true reflects in getter
audio.isTabHidden = false; // reset internal flag
globalThis.document.hidden = true;
globalThis.document.visibilityState = 'hidden';
assert(audio.isTabHidden === true, 'isTabHidden getter automatically reflects document.hidden === true');

audio.speakPopup('Emergency announcement!');
assert(spokenUtterances.length === 0, 'speakPopup immediately blocked via reactive document.hidden getter');

console.log('\n--- Test 5: Return to Foreground (handleVisibilityChange(false)) ---');
globalThis.document.hidden = false;
globalThis.document.visibilityState = 'visible';
audio.handleVisibilityChange(false);

assert(audio.isTabHidden === false, 'isTabHidden is false');
assert(audio.ctx.state === 'running', 'AudioContext resumed to running');
assert(connectedDestinationCount > 0, 'Master gain reconnected to destination');
assert(Math.abs(audio.masterGain.gain.value - 0.75) < 0.001, 'Master gain restored to volume level');

console.log('\n======================================================');
console.log('ALL DEEP TAB-HIDDEN AUDIO SUPPRESSION TESTS PASSED 100%!');
console.log('======================================================\n');
