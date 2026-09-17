import { ReadinessSystem } from './src/systems/ReadinessSystem.js';
import { PuzzleSystem } from './src/systems/PuzzleSystem.js';
import { FailureSystem } from './src/systems/FailureSystem.js';
import { GameClock } from './src/core/GameClock.js';
import { NotebookSystem } from './src/systems/NotebookSystem.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('\n--- TEST 1: Initial Readiness State (0%) ---');
const readiness = new ReadinessSystem();
assert(readiness.getPercentage() === 0, 'Initial readiness is 0%');
assert(!readiness.isComplete(), 'Initial readiness is not complete');
const missingAtStart = readiness.getMissingTasks();
assert(missingAtStart.length === 6, 'All 6 contributions are initially missing');

console.log('\n--- TEST 2: Step-by-step Contributions (up to 100%) ---');
readiness.addContribution('electricity_fixed');
assert(readiness.getPercentage() === 25, 'Electricity fixed contributes +25% (Total: 25%)');

readiness.addContribution('modaks_prepared');
assert(readiness.getPercentage() === 45, 'Modaks prepared contributes +20% (Total: 45%)');

readiness.addContribution('crowd_managed');
assert(readiness.getPercentage() === 65, 'Crowd managed contributes +20% (Total: 65%)');

readiness.addContribution('decorations_ready');
assert(readiness.getPercentage() === 80, 'Decorations ready contributes +15% (Total: 80%)');

readiness.addContribution('devotees_helped');
assert(readiness.getPercentage() === 90, 'Devotees helped contributes +10% (Total: 90%)');

readiness.addContribution('final_preparation');
assert(readiness.getPercentage() === 100, 'Final preparation contributes +10% (Total: 100%)');
assert(readiness.isComplete(), 'Readiness is now complete (100%)');
assert(readiness.getMissingTasks().length === 0, 'No missing tasks remain at 100%');

console.log('\n--- TEST 3: Incomplete Readiness Failure at 6:30 PM (<100%) ---');
const incompleteReadiness = new ReadinessSystem();
const puzzleSystem1 = new PuzzleSystem(incompleteReadiness);
const failureSystem1 = new FailureSystem();
const clock1 = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30 });
const notebook1 = new NotebookSystem();

// Solve only 3 main puzzles (+20% crowd, +25% electrical, +20% modaks = 65%)
puzzleSystem1.solveCrowd(clock1, notebook1);
puzzleSystem1.solveElectrical(clock1, notebook1);
puzzleSystem1.solveModak(clock1, notebook1);
assert(incompleteReadiness.getPercentage() === 65, 'Partial readiness is 65%');

// Fast-forward to 6:30 PM without completing decorations, devotee guidance, or deepstambh
clock1.setTime(18, 30);
puzzleSystem1.update(clock1, { worldState: {} }, failureSystem1);

assert(failureSystem1.festivalFailed, 'Failure triggered at 6:30 PM due to incomplete readiness');
assert(failureSystem1.failureType === 'incomplete', 'Failure type is "incomplete"');
assert(failureSystem1.failureCause.includes('65%'), 'Failure cause correctly states 65% readiness');
assert(!puzzleSystem1.grandAartiAchieved, 'Grand Aarti is NOT achieved when readiness is incomplete');

console.log('\n--- TEST 4: Full Readiness Victory at 6:30 PM (100%) ---');
const completeReadiness = new ReadinessSystem();
const puzzleSystem2 = new PuzzleSystem(completeReadiness);
const failureSystem2 = new FailureSystem();
const clock2 = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30 });
const notebook2 = new NotebookSystem();

// Solve all 6 contributions
puzzleSystem2.solveCrowd(clock2, notebook2); // +20%
puzzleSystem2.solveElectrical(clock2, notebook2); // +25%
puzzleSystem2.solveModak(clock2, notebook2); // +20%
completeReadiness.addContribution('decorations_ready'); // +15%
completeReadiness.addContribution('devotees_helped'); // +10%
completeReadiness.addContribution('final_preparation'); // +10%

assert(completeReadiness.getPercentage() === 100, 'Full readiness is 100%');
assert(completeReadiness.isComplete(), 'Readiness is complete');

// Fast-forward to 6:30 PM
clock2.setTime(18, 30);
puzzleSystem2.update(clock2, { worldState: {} }, failureSystem2);

assert(!failureSystem2.festivalFailed, 'No failure triggered at 6:30 PM with 100% readiness');
assert(puzzleSystem2.grandAartiAchieved, 'Grand Aarti successfully achieved!');

console.log('\n--- TEST 5: Loop Reset Cleanliness ---');
completeReadiness.reset();
assert(completeReadiness.getPercentage() === 0, 'Reset returns readiness to 0%');
assert(completeReadiness.completed.size === 0, 'Completed tasks cleared on loop reset');

console.log('\n🎉 ALL PHASE 8 READINESS TESTS PASSED SUCCESSFULLY!\n');
