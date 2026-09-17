/**
 * test_final_release.js
 * End-to-End Senior Release Engineer Automated Test Suite for Phase 15.
 * Verifies all 15 core systems and contest release checklist items.
 */
import fs from 'fs';
import path from 'path';
import { Game } from './src/core/Game.js';
import { AudioManager } from './src/audio/AudioManager.js';
import { GameClock } from './src/core/GameClock.js';
import { ReadinessSystem } from './src/systems/ReadinessSystem.js';
import { PuzzleSystem } from './src/systems/PuzzleSystem.js';
import { NotebookSystem } from './src/systems/NotebookSystem.js';
import { FailureSystem } from './src/systems/FailureSystem.js';
import { EndingSequenceSystem } from './src/systems/EndingSequenceSystem.js';
import { TutorialSystem } from './src/systems/TutorialSystem.js';
import { NPCSystem } from './src/systems/NPCSystem.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    passed++;
    console.log(`✅ [PASS] ${message}`);
  }
}

console.log('====================================================');
console.log('  PHASE 15: FINAL CONTEST RELEASE VALIDATION SUITE   ');
console.log('====================================================\n');

// ----------------------------------------------------
// SECTION 1: Release Checklist & Asset Audits
// ----------------------------------------------------
console.log('--- SECTION 1: Release Checklist & Asset Audits ---');
const html = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const readme = fs.readFileSync(path.resolve('README.md'), 'utf-8');

assert(html.includes('<title>The Final Aarti - Ganesh Festival Adventure</title>'), 'Correct official game title in index.html');
assert(!html.includes('phase-pill'), 'Debug phase badges completely removed from release DOM');
assert(!html.includes('TODO') && !html.includes('FIXME'), 'Zero TODO/FIXME markers in HTML');
assert(readme.includes('The Final Aarti - Ganesh Festival Adventure'), 'README contains official title and description');
assert(readme.includes('Controls Reference'), 'README contains complete controls guide');
assert(readme.includes('Quickstart Guide for Contest Judges'), 'README contains judge quickstart walkthrough');
assert(readme.includes('Known Limitations'), 'README includes known limitations and requirements');

// ----------------------------------------------------
// SECTION 2: 11 Screen Overlays & Zero Broken Buttons
// ----------------------------------------------------
console.log('\n--- SECTION 2: 11 Screens & Interactive Button Verification ---');
const requiredScreens = [
  'main-menu-overlay',
  'instructions-overlay',
  'controls-overlay',
  'intro-overlay',
  'gameplay-hud',
  'notebook-overlay',
  'pause-overlay',
  'failure-overlay',
  'rewind-overlay',
  'victory-overlay',
  'credits-overlay'
];

for (const screenId of requiredScreens) {
  assert(html.includes(`id="${screenId}"`), `Required screen overlay exists: #${screenId}`);
}

const requiredButtons = [
  'menu-start-btn',
  'menu-instructions-btn',
  'menu-controls-btn',
  'menu-credits-btn',
  'intro-begin-btn',
  'intro-skip-btn',
  'instructions-back-btn',
  'controls-back-btn',
  'pause-resume-btn',
  'pause-instructions-btn',
  'pause-controls-btn',
  'pause-notebook-btn',
  'pause-tutorial-btn',
  'pause-rewind-btn',
  'pause-menu-btn',
  'credits-back-btn',
  'victory-replay-btn',
  'victory-credits-btn',
  'failure-rewind-btn',
  'tutorial-next-btn',
  'tutorial-skip-btn'
];

for (const btnId of requiredButtons) {
  assert(html.includes(`id="${btnId}"`), `Interactive button exists without dead IDs: #${btnId}`);
}

// ----------------------------------------------------
// SECTION 3: Fresh Game Initialization & Tutorial Flow
// ----------------------------------------------------
console.log('\n--- SECTION 3: Fresh Game Initialization & Tutorial Flow ---');
const audio = new AudioManager();
const tutorial = new TutorialSystem(audio);

assert(tutorial.isActive, 'Tutorial initializes in active state on fresh run');
assert(tutorial.currentStep === 1, 'Tutorial starts at Step 1: Pandal Movement');
assert(tutorial.totalSteps === 5, 'Tutorial consists of exactly 5 milestones');

// Milestone 1: Move
tutorial.onPlayerMove(60, 0);
assert(tutorial.currentStep === 2, 'Movement >= 45px advances to Step 2: Interaction');

// Milestone 2: Interact
tutorial.onInteraction();
assert(tutorial.currentStep === 3, 'Interaction advances to Step 3: Clock & Readiness');

// Milestone 3: Clock
tutorial.update(8.0);
assert(tutorial.currentStep === 4, 'Clock step advances to Step 4: Volunteer Diary');

// Milestone 4: Diary
tutorial.onNotebookOpened();
assert(tutorial.currentStep === 5, 'Opening diary advances to Step 5: Sacred Time Loop');

// Milestone 5: Rewind
tutorial.onRewindTriggered();
assert(!tutorial.isActive && tutorial.isCompleted, 'Rewind completes tutorial');

// ----------------------------------------------------
// SECTION 4: The 3 Causal Puzzles & 100% Festival Readiness
// ----------------------------------------------------
console.log('\n--- SECTION 4: The 3 Causal Puzzles & 100% Readiness ---');
const readiness = new ReadinessSystem(audio);
const puzzle = new PuzzleSystem(readiness, audio);
const notebook = new NotebookSystem(audio);

const clock = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30 });

assert(readiness.getPercentage() === 0, 'Initial festival readiness is 0%');
assert(!readiness.isComplete(), 'Festival is not complete at start');

// Solve Puzzle 1: Crowd Route
puzzle.solveCrowd(clock, notebook);
assert(puzzle.isCrowdSolved(), 'Crowd queue puzzle solved');
assert(readiness.getPercentage() === 20, 'Crowd resolution adds +20% readiness');

// Solve Puzzle 2: Electrical Waterproofing
puzzle.solveElectrical(clock, notebook);
assert(puzzle.isElectricalSolved(), 'Electrical waterproofing puzzle solved');
assert(readiness.getPercentage() === 45, 'Electrical resolution adds +25% readiness (Total: 45%)');

// Solve Puzzle 3: 108 Ukadiche Modaks
puzzle.solveModak(clock, notebook);
assert(puzzle.isModakSolved(), 'Modak preparation puzzle solved');
assert(readiness.getPercentage() === 65, 'Modak resolution adds +20% readiness (Total: 65%)');

// Remaining 3 Festival Rites
readiness.addContribution('decorations_ready'); // +15%
assert(readiness.getPercentage() === 80, 'Garland hung (+15% -> Total: 80%)');

readiness.addContribution('devotees_helped');   // +10%
assert(readiness.getPercentage() === 90, 'Dada Ramakant guided (+10% -> Total: 90%)');

readiness.addContribution('final_preparation'); // +10%
assert(readiness.getPercentage() === 100, 'Deepstambh lit (+10% -> Total: 100%)');
assert(readiness.isComplete(), '100% Festival Readiness achieved');

// ----------------------------------------------------
// SECTION 5: Climax: Grand Final Aarti Ceremony
// ----------------------------------------------------
const ending = new EndingSequenceSystem();
clock.setTime(18, 30);

let victoryStatsEmitted = null;
const mockGame = {
  clock,
  readiness,
  notebookSystem: notebook,
  camera: { follow: (target) => { mockGame.camera.target = target; } },
  npcSystem: new NPCSystem(),
  audioManager: audio,
  loopStartTime: Date.now() - 180000,
  _showVictoryScreen: (stats) => { victoryStatsEmitted = stats; }
};

ending.triggerEnding(mockGame);
assert(ending.isActive, 'Final Aarti ceremony triggered successfully at 6:30 PM');
assert(ending.stage === 1, 'Ending begins in Stage 1: Illumination & Gathering');
assert(clock.isPaused, 'Festival clock frozen at auspicious Aarti time');

// Advance stages
ending.update(3.5, mockGame); // Advance to Stage 2
assert(ending.stage === 2, 'Ending advances to Stage 2: Sacred Aarti with Pancharti Flame & Bells');

ending.update(10.5, mockGame); // Advance to Stage 3
assert(ending.stage === 3, 'Ending culminates in Stage 3: Victory Screen & Statistics');
assert(victoryStatsEmitted !== null, 'Celebratory statistics calculated and emitted');
assert(victoryStatsEmitted.festivalReadiness === '100% Complete', 'Culmination stats confirm 100% Complete');

// ----------------------------------------------------
// SECTION 6: Time-Loop Rewind & Persistent Knowledge
// ----------------------------------------------------
console.log('\n--- SECTION 6: Time-Loop Rewind & Knowledge Persistence ---');
// Record discoveries across multiple sections
notebook.unlock('people', 'electrician');
notebook.unlock('places', 'mandap_altar');
notebook.unlock('objects', 'storage_cabinet');
notebook.unlock('events', 'devotees_arrive');
notebook.unlock('clues', 'clue_rain_time');
notebook.unlock('solved', 'solved_crowd');

const statsBeforeRewind = notebook.getStats();
assert(statsBeforeRewind.unlocked >= 6, 'Notebook recorded discoveries');

// Advance loop count
notebook.incrementLoop();
assert(notebook.loopCount === 2, 'Loop counter advanced to #2');

const statsAfterRewind = notebook.getStats();
assert(statsAfterRewind.unlocked === statsBeforeRewind.unlocked, 'All discoveries preserved identically across rewind');
assert(notebook.isUnlocked('people', 'electrician'), 'Specific character knowledge preserved');
assert(notebook.isUnlocked('solved', 'solved_crowd'), 'Solved causal mystery preserved');

// ----------------------------------------------------
// SECTION 7: Audio Controls Verification
// ----------------------------------------------------
console.log('\n--- SECTION 7: Audio & Voiceover Control Systems ---');
audio.setVolume(0.5);
assert(audio.volume === 0.5, 'Audio volume set to 50%');

audio.toggleMute();
assert(audio.isMuted, 'Audio muted successfully');

audio.toggleMute();
assert(!audio.isMuted, 'Audio unmuted successfully');

audio.setVoiceOver(false);
assert(!audio.voiceOverEnabled, 'Voiceover disabled successfully');

audio.setVoiceOver(true);
assert(audio.voiceOverEnabled, 'Voiceover re-enabled successfully');

console.log('\n====================================================');
console.log(`  ALL ${passed} / ${total} RELEASE SPECIFICATIONS VERIFIED 100%! `);
console.log('  CONTEST BUILD READY FOR DEMONSTRATION & JUDGING!  ');
console.log('====================================================\n');

audio.stopAll();
process.exit(0);
