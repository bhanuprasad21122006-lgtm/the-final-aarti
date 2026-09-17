/**
 * test_phase_10.js
 * Comprehensive automated verification for Phase 10: Festival Audio System.
 */
import { AudioManager } from './src/audio/AudioManager.js';
import { PuzzleSystem } from './src/systems/PuzzleSystem.js';
import { ReadinessSystem } from './src/systems/ReadinessSystem.js';
import { NotebookSystem } from './src/systems/NotebookSystem.js';
import { GameClock } from './src/core/GameClock.js';

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
  }
}

console.log('=== RUNNING PHASE 10: FESTIVAL AUDIO SYSTEM TESTS ===\n');

// 1. Audio Manager Initialization
console.log('Test Suite 1: AudioManager Core & Headless Safety');
const audio = new AudioManager();
assert(audio !== null, 'AudioManager instance created successfully');
assert(audio.volume === 0.75, 'Initial default volume is 75% (0.75)');
assert(audio.isMuted === false, 'Audio starts unmuted');
assert(audio.currentMusicState === 'none', 'Initial music state is none');

// 2. Volume & Mute Control
console.log('\nTest Suite 2: Volume & Mute Controls');
audio.setVolume(0.5);
assert(audio.volume === 0.5, 'Volume correctly set to 0.5');

audio.setVolume(1.5);
assert(audio.volume === 1.0, 'Volume clamped to maximum 1.0');

audio.setVolume(-0.2);
assert(audio.volume === 0.0, 'Volume clamped to minimum 0.0');

audio.setVolume(0.8);
const isMutedNow = audio.toggleMute();
assert(isMutedNow === true && audio.isMuted === true, 'toggleMute() toggles audio to muted');

const isUnmutedNow = audio.toggleMute();
assert(isUnmutedNow === false && audio.isMuted === false, 'toggleMute() toggles audio back to unmuted');
assert(audio.volume === 0.8, 'Volume preserved after unmuting');

// 3. Ambience & Rain
console.log('\nTest Suite 3: Ambient Audio & Weather Synchronization');
audio.startAmbience();
assert(audio.isAmbienceActive === true, 'startAmbience() activates ambient audio loop');

audio.setRaining(true);
assert(audio.isRaining === true, 'setRaining(true) enables monsoon rain ambiance');

audio.setRaining(false);
assert(audio.isRaining === false, 'setRaining(false) disables monsoon rain ambiance');

audio.stopAmbience();
assert(audio.isAmbienceActive === false, 'stopAmbience() deactivates ambient loop');

// 4. Interaction Sound Effects (Headless Safe Execution)
console.log('\nTest Suite 4: Interaction Sound Effects');
let sfxErrors = 0;
try {
  audio.playNPCInteract();
  audio.playObjectInspect();
  audio.playClueDiscovered();
  audio.playNotebookOpen();
  audio.playNotebookClose();
} catch (e) {
  sfxErrors++;
  console.error(e);
}
assert(sfxErrors === 0, 'All interaction SFX execute safely without errors');

// 5. Gameplay Sound Effects
console.log('\nTest Suite 5: Gameplay Sound Effects');
let gameplayErrors = 0;
try {
  audio.playFailure('electrical');
  audio.playFailure('crowd');
  audio.playRewind();
  audio.playPuzzleSolved();
  audio.playReadinessIncreased();
  audio.playConchHorn();
  audio.playTempleBell(1046.5);
  audio.playDholakBeat(true);
  audio.playDholakBeat(false);
} catch (e) {
  gameplayErrors++;
  console.error(e);
}
assert(gameplayErrors === 0, 'All gameplay SFX execute safely without errors');

// 6. Dynamic Music States & Transitions
console.log('\nTest Suite 6: Dynamic Music State Transitions');
audio.transitionToMusic('exploration');
assert(audio.currentMusicState === 'exploration', 'Successfully transitioned to exploration music');

audio.transitionToMusic('tension');
assert(audio.currentMusicState === 'tension', 'Successfully transitioned to tension music');

audio.transitionToMusic('celebration');
assert(audio.currentMusicState === 'celebration', 'Successfully transitioned to celebration music');

audio.transitionToMusic('rewind');
assert(audio.currentMusicState === 'rewind', 'Successfully transitioned to rewind music state');

audio.transitionToMusic('failure');
assert(audio.currentMusicState === 'failure', 'Successfully transitioned to failure music state');

audio.stopAll();
assert(audio.isPlayingFanfare === false, 'stopAll() clears all active fanfare intervals');

// 7. System Integrations
console.log('\nTest Suite 7: System Integrations (Puzzle, Readiness, Notebook)');

// Mock audio listener tracking
let puzzleSolvedCount = 0;
let readinessIncreasedCount = 0;
let clueDiscoveredCount = 0;

const mockAudio = {
  playPuzzleSolved: () => { puzzleSolvedCount++; },
  playReadinessIncreased: () => { readinessIncreasedCount++; },
  playClueDiscovered: () => { clueDiscoveredCount++; }
};

const clock = new GameClock({ startHour: 17, startMinute: 55 });
const notebook = new NotebookSystem(mockAudio);
const readiness = new ReadinessSystem(mockAudio);
const puzzles = new PuzzleSystem(readiness, mockAudio);

// A. Test Notebook clue discovery trigger
notebook.unlock('clues', 'clue_cable_damaged');
assert(clueDiscoveredCount === 1, 'Notebook discovery triggers audio playClueDiscovered()');

// Unlocking existing clue should NOT trigger sound again
notebook.unlock('clues', 'clue_cable_damaged');
assert(clueDiscoveredCount === 1, 'Duplicate clue does not re-trigger discovery chime');

// B. Test Readiness increase trigger
readiness.addContribution('decorations_ready');
assert(readinessIncreasedCount === 1, 'Readiness contribution triggers audio playReadinessIncreased()');

// Duplicate readiness contribution should not re-trigger
readiness.addContribution('decorations_ready');
assert(readinessIncreasedCount === 1, 'Duplicate contribution does not re-trigger chime');

// C. Test Puzzle Solved trigger
puzzles.solveCrowd(clock, notebook);
assert(puzzleSolvedCount === 1, 'Solving Crowd puzzle triggers playPuzzleSolved()');

puzzles.solveElectrical(clock, notebook);
assert(puzzleSolvedCount === 2, 'Solving Electrical puzzle triggers playPuzzleSolved()');

puzzles.solveModak(clock, notebook);
assert(puzzleSolvedCount === 3, 'Solving Modak puzzle triggers playPuzzleSolved()');

console.log(`\n==============================================`);
console.log(`TEST RESULTS: ${passed} / ${total} passed (${Math.round((passed / total) * 100)}%)`);
console.log(`==============================================\n`);

if (passed === total) {
  console.log('>>> ALL PHASE 10 AUDIO SYSTEM TESTS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
} else {
  console.error('>>> SOME PHASE 10 TESTS FAILED! <<<\n');
  process.exit(1);
}
