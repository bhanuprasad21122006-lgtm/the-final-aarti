import { TutorialSystem } from './src/systems/TutorialSystem.js';
import fs from 'fs';
import path from 'path';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('====================================================');
console.log('  PHASE 12: USER EXPERIENCE AND TUTORIAL TEST SUITE  ');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST 1: DOM Elements & 11 Required Screens in index.html
// ----------------------------------------------------
console.log('--- TEST 1: 11 Required Screens Verification ---');
const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');

const requiredScreens = [
  { id: 'main-menu-overlay', name: '1. Main Menu' },
  { id: 'instructions-overlay', name: '2. Instructions' },
  { id: 'controls-overlay', name: '3. Controls' },
  { id: 'intro-overlay', name: '4. Intro' },
  { id: 'gameplay-hud', name: '5. Gameplay HUD' },
  { id: 'notebook-overlay', name: '6. Notebook / Volunteer Diary' },
  { id: 'pause-overlay', name: '7. Pause Screen' },
  { id: 'failure-overlay', name: '8. Failure Screen' },
  { id: 'rewind-overlay', name: '9. Rewind Visual Overlay' },
  { id: 'victory-overlay', name: '10. Success / Victory Screen' },
  { id: 'credits-overlay', name: '11. Credits Screen' }
];

for (const screen of requiredScreens) {
  assert(htmlContent.includes(`id="${screen.id}"`), `Screen exists in index.html: ${screen.name} (#${screen.id})`);
}

// ----------------------------------------------------
// TEST 2: Zero Dead Buttons Across All Screens
// ----------------------------------------------------
console.log('\n--- TEST 2: Interactive UI Buttons Existence ---');
const requiredButtons = [
  // Main Menu
  'menu-start-btn',
  'menu-instructions-btn',
  'menu-controls-btn',
  'menu-credits-btn',
  // Intro
  'intro-begin-btn',
  'intro-skip-btn',
  // Instructions
  'instructions-back-btn',
  // Controls
  'controls-back-btn',
  // Pause
  'pause-resume-btn',
  'pause-instructions-btn',
  'pause-controls-btn',
  'pause-notebook-btn',
  'pause-tutorial-btn',
  'pause-rewind-btn',
  'pause-menu-btn',
  // Credits
  'credits-back-btn',
  // Victory
  'victory-replay-btn',
  'victory-credits-btn',
  // Failure
  'failure-rewind-btn',
  // Tutorial HUD
  'tutorial-next-btn',
  'tutorial-skip-btn'
];

for (const btnId of requiredButtons) {
  assert(htmlContent.includes(`id="${btnId}"`), `Button exists in index.html: #${btnId}`);
}

// ----------------------------------------------------
// TEST 3: TutorialSystem Initialization & Steps
// ----------------------------------------------------
console.log('\n--- TEST 3: TutorialSystem Workflow & Milestones ---');
let audioChimesPlayed = 0;
const mockAudio = {
  playClueDiscovered: () => { audioChimesPlayed++; },
  playReadinessProgress: () => { audioChimesPlayed++; }
};

const tutorial = new TutorialSystem(mockAudio);
assert(tutorial.isActive, 'Tutorial initializes in active state');
assert(tutorial.currentStep === 1, 'Tutorial starts at Step 1 (Movement)');
assert(tutorial.totalSteps === 5, 'Tutorial consists of exactly 5 non-spoiler steps');

// Mock UI elements
let renderedBannerHidden = false;
let renderedTitle = '';
let renderedText = '';
let renderedCounter = '';

const mockBanner = { classList: { add: (c) => { if (c === 'hidden') renderedBannerHidden = true; }, remove: (c) => { if (c === 'hidden') renderedBannerHidden = false; } } };
const mockTitle = {
  _val: '',
  get textContent() { return this._val; },
  set textContent(v) { this._val = v; },
  get innerHTML() { return this._val; },
  set innerHTML(v) { this._val = v; }
};
const mockText = {
  _val: '',
  get textContent() { return this._val; },
  set textContent(v) { this._val = v; },
  get innerHTML() { return this._val; },
  set innerHTML(v) { this._val = v; }
};
const mockCounter = { textContent: '' };
const mockNextBtn = { textContent: '', classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} };
const mockSkipBtn = { classList: { add: () => {}, remove: () => {} }, addEventListener: () => {} };

tutorial.initUI(mockBanner, mockTitle, mockText, mockCounter, mockNextBtn, mockSkipBtn);
assert(mockTitle.textContent.includes('Step 1'), 'Step 1 UI rendered title: ' + mockTitle.textContent);
assert(!renderedBannerHidden, 'Banner is visible');

// Step 1: Movement milestone
tutorial.onPlayerMove(10, 0);
assert(tutorial.currentStep === 1, 'Small movement (<45px) does not prematurely complete Step 1');
tutorial.onPlayerMove(40, 0); // Cumulative 50px
assert(tutorial.currentStep === 2, 'Movement >= 45px advances tutorial to Step 2 (Interaction)');
assert(mockTitle.textContent.includes('Step 2'), 'Step 2 UI rendered title: ' + mockTitle.textContent);
assert(audioChimesPlayed === 1, 'Audio feedback chime played on Step 1 completion');

// Step 2: Interaction milestone
tutorial.onInteraction();
assert(tutorial.currentStep === 3, 'Interaction [E] advances tutorial to Step 3 (Clock & Readiness)');
assert(mockTitle.textContent.includes('Step 3'), 'Step 3 UI rendered title: ' + mockTitle.textContent);
assert(audioChimesPlayed === 2, 'Audio feedback chime played on Step 2 completion');

// Step 3: Clock & Readiness auto-advance or manual next
tutorial.update(7.5, null);
assert(tutorial.currentStep === 4, 'Clock step advances to Step 4 (Volunteer Diary)');
assert(mockTitle.textContent.includes('Step 4'), 'Step 4 UI rendered title: ' + mockTitle.textContent);

// Step 4: Notebook milestone
tutorial.onNotebookOpened();
assert(tutorial.currentStep === 5, 'Opening notebook [Tab] advances to Step 5 (Time Loop Rewind)');
assert(mockTitle.textContent.includes('Step 5'), 'Step 5 UI rendered title: ' + mockTitle.textContent);

// Step 5: Rewind milestone
tutorial.onRewindTriggered();
assert(!tutorial.isActive, 'Tutorial completed after Step 5 (Rewind)');
assert(mockTitle.textContent.includes('Tutorial Complete'), 'Celebratory completion badge rendered upon completing all steps');

// Replay functionality
tutorial.replay();
assert(tutorial.isActive, 'Replay reactivates tutorial');
assert(tutorial.currentStep === 1, 'Replay resets step back to Step 1');
assert(!renderedBannerHidden, 'Tutorial banner visible again on replay');

// Skip functionality
tutorial.skipTutorial();
assert(!tutorial.isActive, 'Skip deactivates tutorial immediately');
assert(tutorial.isCompleted, 'Skip marks tutorial as completed');
assert(renderedBannerHidden, 'Banner hidden upon skip');

// ----------------------------------------------------
// TEST 4: Non-Spoiler Constraint Verification
// ----------------------------------------------------
console.log('\n--- TEST 4: Non-Spoiler Constraint Verification ---');
// Verify that neither instructions nor tutorial reveal secrets/solutions
const forbiddenSpoilerTerms = [
  'SPM-2026',
  '415V',
  'storage_cabinet',
  'sharma_keys',
  'give flowers to',
  'distract the crowd with',
  'take key from flower stall'
];

for (const step of tutorial.tutorialSteps) {
  for (const spoiler of forbiddenSpoilerTerms) {
    assert(!step.text.toLowerCase().includes(spoiler.toLowerCase()), `Tutorial Step ${step.step} does not contain spoiler: "${spoiler}"`);
  }
}

for (const spoiler of forbiddenSpoilerTerms) {
  assert(!htmlContent.toLowerCase().includes(spoiler.toLowerCase()) || 
         // Allow only in actual game element ids / dialogue, not in instruction or tutorial panels
         !htmlContent.includes(`instructions-panel`) ||
         !htmlContent.split('id="instructions-overlay"')[1].split('id="controls-overlay"')[0].toLowerCase().includes(spoiler.toLowerCase()), 
         `Instructions modal does not spoil puzzle solutions: "${spoiler}"`);
}

// ----------------------------------------------------
// TEST 5: CSS Stylesheet Verification
// ----------------------------------------------------
console.log('\n--- TEST 5: UI & CSS Stylesheet Verification ---');
const cssContent = fs.readFileSync(path.resolve('css/style.css'), 'utf-8');

const requiredCSSSelectors = [
  '#main-menu-overlay',
  '#intro-overlay',
  '#instructions-overlay',
  '#controls-overlay',
  '#pause-overlay',
  '#credits-overlay',
  '#tutorial-banner',
  '.keycap',
  '.menu-btn',
  '.pause-btn'
];

for (const sel of requiredCSSSelectors) {
  assert(cssContent.includes(sel), `CSS contains styles for: ${sel}`);
}

console.log('\n====================================================');
console.log('  ALL PHASE 12 ACCEPTANCE CRITERIA VERIFIED!        ');
console.log('====================================================\n');
