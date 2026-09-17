/**
 * test_voiceover.js
 * Automated verification for message popup voice-over system in The Final Aarti.
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

console.log('=== RUNNING MESSAGE POPUP VOICE-OVER VERIFICATION ===\n');

// 1. Text Sanitization
console.log('Test Suite 1: Voice Text Sanitization');
const audio = new AudioManager();

const messyText = '⚡ "Aarav! Look at Uncle Sharma\'s key [SPM-2026]! (+15% Readiness) Let\'s go!" 🥥';
const cleaned = audio._cleanSpeechText(messyText);
assert(!cleaned.includes('⚡') && !cleaned.includes('🥥'), 'Cleaned text strips emoji icons');
assert(!cleaned.includes('"'), 'Cleaned text strips quotation marks');
assert(!cleaned.includes('(+15% Readiness)'), 'Cleaned text strips bracketed status tags');
assert(cleaned.includes('Aarav! Look at Uncle Sharma\'s key! Let\'s go!'), 'Cleaned text retains narrative dialogue');

// 2. Voice-over Toggle & State Management
console.log('\nTest Suite 2: Voice-over State Controls');
assert(audio.voiceOverEnabled === true, 'Voice-over is enabled by default');

let stopSpeechCalled = false;
audio.stopSpeech = () => { stopSpeechCalled = true; };

audio.toggleVoiceOver();
assert(audio.voiceOverEnabled === false, 'toggleVoiceOver() toggles voice-over off');
assert(stopSpeechCalled === true, 'Turning voice-over off calls stopSpeech()');

stopSpeechCalled = false;
audio.toggleVoiceOver();
assert(audio.voiceOverEnabled === true, 'toggleVoiceOver() toggles voice-over back on');

audio.setMute(true);
assert(stopSpeechCalled === true, 'Muting audio immediately cancels active speech');
audio.setMute(false);

// 3. Mock SpeechSynthesis Environment
console.log('\nTest Suite 3: SpeechSynthesis Integration & Character Tuning');

let spokenUtterances = [];
let cancelCallCount = 0;

global.window = {
  speechSynthesis: {
    speak: (utterance) => {
      spokenUtterances.push(utterance);
    },
    cancel: () => {
      cancelCallCount++;
    },
    getVoices: () => [
      { name: 'Microsoft Heera - English (India)', lang: 'en-IN' },
      { name: 'Google US English', lang: 'en-US' }
    ]
  },
  SpeechSynthesisUtterance: function(text) {
    this.text = text;
    this.volume = 1.0;
    this.pitch = 1.0;
    this.rate = 1.0;
    this.voice = null;
  }
};

const browserAudio = new AudioManager();
assert(browserAudio.preferredVoice !== null, 'Browser audio successfully selects preferred Indian English voice');
assert(browserAudio.preferredVoice.lang === 'en-IN', 'Preferred voice is Indian English (en-IN)');

// Test Character Pitch / Rate Modulation
spokenUtterances = [];
browserAudio.speakPopup('"My knees are trembling, young Aarav."', { npcId: 'elder' });
assert(spokenUtterances.length === 1, 'Elder speech utterance queued');
assert(spokenUtterances[0].pitch < 0.9, `Elder voice has respectful low pitch (${spokenUtterances[0].pitch})`);
assert(spokenUtterances[0].rate < 0.95, `Elder voice has patient cadence (${spokenUtterances[0].rate})`);

spokenUtterances = [];
browserAudio.speakPopup('"Look Aarav bhaiya! The fairy lights are glowing!"', { npcId: 'child' });
assert(spokenUtterances.length === 1, 'Child speech utterance queued');
assert(spokenUtterances[0].pitch > 1.2, `Child voice has bright energetic pitch (${spokenUtterances[0].pitch})`);
assert(spokenUtterances[0].rate > 1.05, `Child voice has brisk rate (${spokenUtterances[0].rate})`);

spokenUtterances = [];
browserAudio.speakPopup('"The 415V power line is secure and waterproofed."', { npcId: 'electrician' });
assert(spokenUtterances.length === 1, 'Electrician speech utterance queued');
assert(Math.abs(spokenUtterances[0].rate - 1.0) < 0.05, 'Electrician voice has steady technical rate');

// 4. Game Dialog Message Popup Voice-Over Trigger
console.log('\nTest Suite 4: Game Dialogue Modal & Screen Voice-Over Triggers');

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
    }
  };
  elements[id] = el;
  return el;
}

[
  'hud-clock', 'hud-pause-btn', 'hud-restart-btn', 'hud-notebook-btn', 'notebook-badge',
  'hud-mute-btn', 'hud-volume-slider', 'hud-voice-btn', 'hud-readiness-percent', 'hud-readiness-bar',
  'hud-inventory-container', 'dialog-overlay', 'dialog-title', 'dialog-badge',
  'dialog-activity', 'dialog-body', 'dialog-close-btn', 'notebook-overlay',
  'notebook-loop-indicator', 'notebook-entries-list', 'notebook-section-desc',
  'notebook-close-x', 'notebook-footer-close-btn', 'failure-overlay',
  'failure-title', 'failure-cause', 'timeline-recap-list', 'failure-rewind-btn',
  'victory-overlay', 'victory-replay-btn'
].forEach(id => createElement(id));

const windowListeners = {};
global.window.innerWidth = 1280;
global.window.innerHeight = 720;
global.window.addEventListener = (event, handler) => {
  if (!windowListeners[event]) windowListeners[event] = [];
  windowListeners[event].push(handler);
};

global.document = {
  getElementById: (id) => elements[id] || null,
  querySelectorAll: () => [],
  createElement: (tagName) => createElement('gen-' + Math.random(), tagName)
};

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

const game = new Game(canvasMock);

// A. Trigger NPC dialogue popup and verify voice-over
spokenUtterances = [];
game.interactionSystem.currentInteractable = {
  type: 'npc',
  entity: { id: 'cook', name: 'Bawarchi Mohan' }
};
game.interactionSystem.activeDialog = {
  title: 'Bawarchi Mohan (Cook)',
  badge: 'Prasad Cook',
  activity: 'Status: Steaming modaks',
  description: '"Aarav! The modaks are steaming to divine perfection!"',
  isNPC: true
};

// Update loop to process dialog opening
game._update(0.016);
assert(spokenUtterances.length === 1, 'Opening dialogue popup triggers voice-over of message');
assert(spokenUtterances[0].text.includes('modaks are steaming to divine perfection'), 'Voiceover speaks the exact dialogue text');

// B. Close dialogue and verify speech cancel
const initialCancelCount = cancelCallCount;
game.interactionSystem.closeDialog();
game._update(0.016);
assert(cancelCallCount > initialCancelCount, 'Closing dialogue popup immediately stops speech');

// C. Failure screen voiceover
spokenUtterances = [];
game.failureSystem.festivalFailed = true;
game.failureSystem.failureTitle = 'FESTIVAL FAILED: POWER OUTAGE';
game.failureSystem.failureCause = 'Water reached the damaged cable causing blackout.';
game.failureSystem.timelineRecap = [];
game._showFailureScreen();
assert(spokenUtterances.length === 1, 'Failure screen popup triggers voice-over of failure message');
assert(spokenUtterances[0].text.includes('Water reached the damaged cable'), 'Spoken failure message contains failure cause');

// D. Victory screen voiceover
spokenUtterances = [];
game._showVictoryScreen({});
assert(spokenUtterances.length === 1, 'Victory celebration screen triggers celebratory voice-over');
assert(spokenUtterances[0].text.includes('Ganpati Bappa Moriya'), 'Victory voice-over speaks Ganpati Bappa Moriya');

// E. HUD Voice Button Click
const voiceBtn = elements['hud-voice-btn'];
assert(voiceBtn !== undefined, 'Voice toggle button found in HUD');
const voiceHandlers = listeners['hud-voice-btn']['click'];
assert(voiceHandlers.length > 0, 'Voice toggle button has click listener');

// Click to turn OFF
voiceHandlers[0]({});
assert(game.audioManager.voiceOverEnabled === false, 'Clicking HUD voice button turns voice-over OFF');
assert(voiceBtn.textContent.includes('OFF'), 'Button updates to indicate OFF');

// Click to turn ON
voiceHandlers[0]({});
assert(game.audioManager.voiceOverEnabled === true, 'Clicking HUD voice button turns voice-over ON');
assert(voiceBtn.textContent.includes('ON'), 'Button updates to indicate ON');

// F. Keyboard Shortcut 'V'
const keyHandlers = windowListeners['keydown'];
keyHandlers.forEach(h => h({ code: 'KeyV' }));
assert(game.audioManager.voiceOverEnabled === false, 'Pressing "V" toggles voice-over to OFF');

keyHandlers.forEach(h => h({ code: 'KeyV' }));
assert(game.audioManager.voiceOverEnabled === true, 'Pressing "V" toggles voice-over back to ON');

console.log(`\n==============================================`);
console.log(`VOICE-OVER TEST RESULTS: ${passed} / ${total} passed (${Math.round((passed / total) * 100)}%)`);
console.log(`==============================================\n`);

if (passed === total) {
  console.log('>>> ALL MESSAGE POPUP VOICE-OVER TESTS PASSED! <<<\n');
  process.exit(0);
} else {
  console.error('>>> SOME VOICE-OVER TESTS FAILED! <<<\n');
  process.exit(1);
}
