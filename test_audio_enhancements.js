/**
 * test_audio_enhancements.js
 * Verification suite for:
 * 1. Damaged electric equipment "something went wrong" sound (playElectricalFault & playPowerCut)
 * 2. Rain sound effects with procedural pattering droplets (setRaining)
 * 3. Venue festival music strictly at 50% volume (0.50)
 * 4. Sound system breakdown stops music, and system restoration continues song at 50%
 * 5. Tab in background muting (handleVisibilityChange stops audio & speech)
 * 6. Final Aarti celebration with rhythmic bells & sacred Ganesh mantras
 */

import { AudioManager } from './src/audio/AudioManager.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

console.log('=== RUNNING FESTIVAL AUDIO ENHANCEMENTS VERIFICATION ===\n');

// Mock Web Audio Context for Node.js
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
    return {
      getChannelData: () => new Float32Array(length)
    };
  }
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

// Mock SpeechSynthesis
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
  speak: (utt) => {
    spokenUtterances.push(utt);
    speechCancelled = false;
  },
  cancel: () => {
    speechCancelled = true;
  },
  getVoices: () => [
    { name: 'Neerja (India)', lang: 'en-IN' }
  ]
};
globalThis.window = {
  AudioContext: MockAudioContext,
  speechSynthesis: globalThis.speechSynthesis,
  SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance
};
globalThis.document = {
  hidden: false,
  addEventListener: () => {}
};

console.log('Test Suite 1: Song Volume Calibration (50% Volume)');
const audio = new AudioManager();
assert(audio.musicVolume === 0.50, 'musicVolume property strictly initialized to 0.50 (50%)');
audio.unlockAudio();
assert(audio.musicGain !== null, 'musicGain node created on unlockAudio()');
assert(Math.abs(audio.musicGain.gain.value - 0.50) < 0.001, 'musicGain node initialized precisely at 0.50 (50% volume)');

console.log('\nTest Suite 2: Sound System Breakdown & Continuation Logic');
assert(audio.soundSystemWorking === true, 'Sound system starts in good operational condition');
audio.transitionToMusic('exploration');
assert(audio.currentMusicState === 'exploration', 'Festival music playing during exploration');

// Power fails -> sound system breaks down
audio.setSoundSystemWorking(false);
assert(audio.soundSystemWorking === false, 'Sound system marked as broken down');
assert(audio.currentMusicState === 'exploration', 'Music state tracked for continuation');

// Attempting to change music while sound system is down should suppress playback
audio.transitionToMusic('tension');
assert(audio.musicNodes.length === 0, 'Venue music nodes remain stopped/suppressed while sound system is down');

// Sound system is restored (e.g. cable repaired or time rewind)
audio.setSoundSystemWorking(true);
assert(audio.soundSystemWorking === true, 'Sound system restored to good operational state');
assert(Math.abs(audio.musicGain.gain.value - 0.50) < 0.001, 'Restored song volume continues at 50%');

console.log('\nTest Suite 3: Damaged Electrical Equipment Sound ("Something Went Wrong")');
// Trigger electrical fault sound
let faultTriggered = false;
try {
  audio.playElectricalFault();
  audio.playPowerCut();
  faultTriggered = true;
} catch (e) {
  console.error('Error triggering electrical fault sound:', e);
}
assert(faultTriggered, 'playElectricalFault() & playPowerCut() executed cleanly with rich multi-stage synthesis');

console.log('\nTest Suite 4: Enhanced Rain Sound Effects & Droplets');
audio.startAmbience();
assert(audio.isRaining === false, 'Rain starts disabled');
assert(audio.raindropInterval === null, 'Raindrop pattering interval inactive initially');

audio.setRaining(true);
assert(audio.isRaining === true, 'Rain enabled');
assert(audio.raindropInterval !== null, 'Dynamic raindrop pattering interval successfully active');
assert(Math.abs(audio.rainGain.gain.value - 0.28) < 0.001, 'Rain ambient wash ramped to 0.28');

audio.setRaining(false);
assert(audio.isRaining === false, 'Rain disabled');
assert(audio.raindropInterval === null, 'Raindrop pattering interval cleared cleanly');

console.log('\nTest Suite 5: Background Tab Audio Suppression (Page Visibility)');
assert(audio.ctx.state === 'running', 'AudioContext running in foreground tab');

// Tab switched to background ("backend")
audio.handleVisibilityChange(true);
assert(audio.isTabHidden === true, 'AudioManager tracks tab as hidden/backgrounded');
assert(audio.ctx.state === 'suspended', 'AudioContext suspended immediately when tab is in background');
assert(speechCancelled === true, 'Any active voiceover speech cancelled immediately when tab is in background');

// Tab returns to foreground
audio.handleVisibilityChange(false);
assert(audio.isTabHidden === false, 'AudioManager tracks tab as active/foregrounded');
assert(audio.ctx.state === 'running', 'AudioContext resumed smoothly when returning to tab');

console.log('\nTest Suite 6: Final Aarti Ceremony - Temple Bells & Sacred Mantras');
spokenUtterances = [];
audio.startAartiFanfare();
assert(audio.isPlayingFanfare === true, 'Final Aarti fanfare is active');
assert(audio.aartiBellInterval !== null, 'Rhythmic Puja Ghanta hand-bell clanging loop active');
assert(audio.aartiMahaGhantaInterval !== null, 'Deep bronze Maha Ghanta temple bell tolling loop active');
assert(audio.isPlayingAartiChant === true, 'Sacred Ganesh Aarti mantras recitation active');
assert(spokenUtterances.length > 0, 'Sacred mantra uttered through speech synthesis');
const firstMantra = spokenUtterances[0].text;
assert(firstMantra.includes('Vakratunda Mahakaya') || firstMantra.includes('Om Gam Ganapataye'), `Chanting authentic Ganesh mantra: "${firstMantra}"`);

// Stop Aarti
audio.stopAll();
assert(audio.isPlayingFanfare === false, 'Aarti fanfare stopped on stopAll()');
assert(audio.aartiBellInterval === null, 'Aarti bell interval cleared on stopAll()');
assert(audio.aartiMahaGhantaInterval === null, 'Maha Ghanta interval cleared on stopAll()');
assert(audio.isPlayingAartiChant === false, 'Aarti mantra recitation stopped on stopAll()');

console.log('\n==============================================');
console.log('AUDIO ENHANCEMENTS VERIFICATION COMPLETE!');
console.log('ALL 6 TEST SUITES PASSED 100%!');
console.log('==============================================\n');
process.exit(0);

