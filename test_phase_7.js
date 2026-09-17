import { GameClock } from './src/core/GameClock.js';
import { InventorySystem } from './src/systems/InventorySystem.js';
import { PuzzleSystem } from './src/systems/PuzzleSystem.js';
import { FailureSystem } from './src/systems/FailureSystem.js';
import { NotebookSystem } from './src/systems/NotebookSystem.js';
import { TimelineEventManager } from './src/systems/TimelineEventManager.js';
import { FestivalMap } from './src/render/FestivalMap.js';

console.log('=== PHASE 7 UNIT & SIMULATION TESTS ===\n');

// 1. Test InventorySystem
console.log('Test 1: InventorySystem');
const inv = new InventorySystem();
console.assert(inv.items.size === 0, 'Initial inventory should be empty');
inv.addItem('storage_key');
console.assert(inv.hasItem('storage_key'), 'Should have storage_key');
inv.addItem('replacement_cable');
inv.addItem('fresh_coconut');
console.assert(inv.getItems().length === 3, 'Should have 3 items');
inv.removeItem('storage_key');
console.assert(!inv.hasItem('storage_key'), 'Should no longer have storage_key');
inv.reset();
console.assert(inv.items.size === 0, 'Reset should clear inventory');
console.log('✓ InventorySystem passed!\n');

// 2. Test Failure Chain 1: Crowd Failure
console.log('Test 2: Crowd Failure Chain');
{
  const clock = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30, timeScale: 1 });
  const timelineMgr = new TimelineEventManager();
  const failureSys = new FailureSystem();
  const puzzleSys = new PuzzleSystem();

  // Advance to 6:04 PM - should not fail yet
  clock.setTime(18, 4);
  puzzleSys.update(clock, timelineMgr, failureSys);
  console.assert(!failureSys.festivalFailed, 'Festival should not fail before 6:05 PM');

  // Advance to 6:05 PM without solving crowd - triggers crowd failure!
  clock.setTime(18, 5);
  puzzleSys.update(clock, timelineMgr, failureSys);
  console.assert(failureSys.festivalFailed, 'Crowd failure should trigger at 6:05 PM');
  console.assert(failureSys.failureType === 'crowd', 'Failure type should be crowd');
  console.assert(failureSys.timelineRecap.length > 0, 'Timeline recap should have entries');
  console.log('✓ Crowd failure chain verified!\n');
}

// 3. Test Failure Chain 2: Electrical Failure
console.log('Test 3: Electrical Failure Chain');
{
  const clock = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30, timeScale: 1 });
  const timelineMgr = new TimelineEventManager();
  const failureSys = new FailureSystem();
  const puzzleSys = new PuzzleSystem();
  const notebook = new NotebookSystem();

  // Solve crowd first before 6:00 PM
  puzzleSys.solveCrowd(clock, notebook);
  console.assert(puzzleSys.isCrowdSolved(), 'Crowd should be solved');

  // Advance past 6:05 PM - crowd failure should NOT trigger
  clock.setTime(18, 5);
  puzzleSys.update(clock, timelineMgr, failureSys);
  console.assert(!failureSys.festivalFailed, 'Crowd failure avoided');

  // Advance to 6:10 PM - electrical failure triggers!
  clock.setTime(18, 10);
  puzzleSys.update(clock, timelineMgr, failureSys);
  console.assert(failureSys.festivalFailed, 'Electrical failure should trigger at 6:10 PM');
  console.assert(failureSys.failureType === 'electrical', 'Failure type should be electrical');
  console.assert(failureSys.blackout, 'Blackout should be active');
  console.log('✓ Electrical failure chain verified!\n');
}

// 4. Test Failure Chain 3: Modak Failure
console.log('Test 4: Modak Failure Chain');
{
  const clock = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30, timeScale: 1 });
  const timelineMgr = new TimelineEventManager();
  const failureSys = new FailureSystem();
  const puzzleSys = new PuzzleSystem();
  const notebook = new NotebookSystem();

  // Solve crowd and electrical
  puzzleSys.solveCrowd(clock, notebook);
  puzzleSys.solveElectrical(clock, notebook);

  // Advance past 6:10 PM - no blackout!
  clock.setTime(18, 10);
  puzzleSys.update(clock, timelineMgr, failureSys);
  console.assert(!failureSys.festivalFailed, 'Electrical failure avoided');

  // Advance to 6:15 PM without coconut - modak failure triggers!
  clock.setTime(18, 15);
  puzzleSys.update(clock, timelineMgr, failureSys);
  console.assert(failureSys.festivalFailed, 'Modak failure should trigger at 6:15 PM');
  console.assert(failureSys.failureType === 'modak', 'Failure type should be modak');
  console.log('✓ Modak failure chain verified!\n');
}

// 5. Test Full Success: All 3 Puzzles Solved -> Grand Aarti Victory at 6:30 PM!
console.log('Test 5: Grand Aarti Victory State');
{
  const clock = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30, timeScale: 1 });
  const timelineMgr = new TimelineEventManager();
  const failureSys = new FailureSystem();
  const puzzleSys = new PuzzleSystem();
  const notebook = new NotebookSystem();

  // Solve all 3 puzzles before deadlines
  puzzleSys.solveCrowd(clock, notebook);
  puzzleSys.solveElectrical(clock, notebook);
  puzzleSys.solveModak(clock, notebook);

  console.assert(puzzleSys.areAllSolved(), 'All 3 puzzles should be marked solved');

  // Progress through the entire evening
  for (let min = 55; min <= 89; min++) {
    const h = min < 60 ? 17 : 18;
    const m = min < 60 ? min : min - 60;
    clock.setTime(h, m);
    puzzleSys.update(clock, timelineMgr, failureSys);
    console.assert(!failureSys.festivalFailed, `Festival should not fail at ${clock.getFormattedTime()}`);
  }

  // Reach 6:30 PM
  clock.setTime(18, 30);
  puzzleSys.update(clock, timelineMgr, failureSys);

  console.assert(puzzleSys.grandAartiAchieved, 'Grand Aarti should be achieved at 6:30 PM!');
  console.assert(!failureSys.festivalFailed, 'Festival must not have failed');

  // Verify notebook entries
  console.assert(notebook.isUnlocked('solved', 'solved_crowd'), 'solved_crowd should be unlocked in notebook');
  console.assert(notebook.isUnlocked('solved', 'solved_blackout'), 'solved_blackout should be unlocked in notebook');
  console.assert(notebook.isUnlocked('solved', 'solved_modak'), 'solved_modak should be unlocked in notebook');

  console.log('✓ Grand Aarti Victory verified!\n');
}

// 6. Test Map Interactive Props & Reset
console.log('Test 6: FestivalMap Props & Reset');
{
  const map = new FestivalMap();
  console.assert(map.storageKeyProp !== undefined, 'Storage key prop should exist');
  console.assert(map.storageCabinetProp !== undefined, 'Storage cabinet prop should exist');
  console.assert(map.entranceObstructionProp !== undefined, 'Entrance obstruction prop should exist');

  // Simulate picking up key and pushing crates
  map.storageKeyProp.active = false;
  map.storageCabinetProp.isUnlocked = true;
  map.entranceObstructionProp.isCleared = true;

  // Reset
  map.resetProps();
  console.assert(map.storageKeyProp.active === true, 'Storage key should be active again after reset');
  console.assert(map.storageCabinetProp.isUnlocked === false, 'Cabinet should be locked after reset');
  console.assert(map.entranceObstructionProp.isCleared === false, 'Obstruction should be reset');
  console.log('✓ FestivalMap props & reset verified!\n');
}

console.log('ALL PHASE 7 TESTS PASSED SUCCESSFULLY! 🎯');
