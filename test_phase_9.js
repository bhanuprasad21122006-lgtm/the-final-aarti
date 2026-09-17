import { EndingSequenceSystem } from './src/systems/EndingSequenceSystem.js';
import { NPCSystem } from './src/systems/NPCSystem.js';
import { ReadinessSystem } from './src/systems/ReadinessSystem.js';
import { PuzzleSystem } from './src/systems/PuzzleSystem.js';
import { NotebookSystem } from './src/systems/NotebookSystem.js';
import { GameClock } from './src/core/GameClock.js';
import { EndingVisuals } from './src/render/EndingVisuals.js';
import { AudioManager } from './src/audio/AudioManager.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('\n=== TEST 1: EndingSequenceSystem Initialization ===');
const endingSeq = new EndingSequenceSystem();
assert(!endingSeq.isActive, 'Ending sequence is initially inactive');
assert(endingSeq.stage === 0, 'Initial stage is 0 (Idle)');
assert(endingSeq.timer === 0, 'Initial timer is 0');

console.log('\n=== TEST 2: Trigger Ending Sequence at 6:30 PM with 100% Readiness ===');
const readiness = new ReadinessSystem();
const notebook = new NotebookSystem();
const npcSystem = new NPCSystem();
const clock = new GameClock({ startHour: 17, startMinute: 55, endHour: 18, endMinute: 30 });
clock.setTime(18, 30);

// Add all 6 contributions to reach 100%
readiness.addContribution('electricity_fixed');
readiness.addContribution('modaks_prepared');
readiness.addContribution('crowd_managed');
readiness.addContribution('decorations_ready');
readiness.addContribution('devotees_helped');
readiness.addContribution('final_preparation');
assert(readiness.isComplete(), 'Readiness is 100% complete');

// Mock Game object
const mockGame = {
  clock,
  readiness,
  notebookSystem: notebook,
  npcSystem,
  camera: { follow: (target) => { mockGame.camera.target = target; } },
  audioManager: new AudioManager(),
  loopStartTime: Date.now() - 154000, // ~2m 34s ago
  _showVictoryScreen: (stats) => { mockGame.victoryStatsShown = stats; }
};

endingSeq.triggerEnding(mockGame);

assert(endingSeq.isActive, 'Ending sequence is now active');
assert(endingSeq.stage === 1, 'Ending sequence starts in Stage 1 (Assembly & Illumination)');
assert(mockGame.clock.isPaused, 'Clock is frozen at auspicious Aarti time');
assert(mockGame.camera.target.x === 800 && mockGame.camera.target.y === 220, 'Camera target focuses on central Mandap Altar');

console.log('\n=== TEST 3: NPC Gathering & Celebration Participation ===');
const npcs = npcSystem.getAllEntities();
assert(npcs.length === 8, 'All 8 major festival NPCs exist');

for (let i = 0; i < npcs.length; i++) {
  const npc = npcs[i];
  assert(npc.isCelebrating, `NPC ${npc.name} (${npc.id}) is participating in celebration`);
  assert(npc.currentActivity.includes('Aarti'), `NPC ${npc.name} activity updated to Aarti celebration`);
  // Verify proximity to Mandap altar (Y between 250 and 360, X between 600 and 960)
  assert(npc.targetPos.y >= 250 && npc.targetPos.y <= 360, `NPC ${npc.name} gathered at altar Y (${npc.targetPos.y})`);
}

console.log('\n=== TEST 4: Stage Progression (Assembly -> Aarti -> Culmination) ===');
// Advance time to 3.5s -> Stage 2 (Aarti Ceremony)
endingSeq.update(3.5, mockGame);
assert(endingSeq.stage === 2, 'Stage advanced to 2 (Sacred Aarti ceremony)');

// Advance time further to 8.0s -> Stage 3 (Victory Culmination & Modal)
endingSeq.update(4.5, mockGame);
assert(endingSeq.stage === 3, 'Stage advanced to 3 (Victory Modal & Final Message)');
assert(mockGame.victoryStatsShown !== undefined, 'Victory screen stats passed to modal');

const stats = mockGame.victoryStatsShown;
console.log('Culmination Statistics Captured:', stats);
assert(stats.loopsUsed === '1 Loop', 'Stats show correct loop count');
assert(stats.festivalReadiness === '100% Complete', 'Stats show 100% readiness');
assert(stats.problemsSolved.includes('3 Causal Chains'), 'Stats show problems solved');
assert(stats.completionTime.includes('6:30 PM'), 'Stats show 6:30 PM completion time');

console.log('\n=== TEST 5: EndingVisuals Particle System ===');
const endingVisuals = new EndingVisuals();
assert(endingVisuals.petals.length === 70, '70 flower petals initialized');
assert(endingVisuals.confetti.length === 60, '60 confetti ribbons initialized');

// Update particles
endingVisuals.update(0.1, 1280, 720, npcs);
assert(endingVisuals.aartiAngle > 0, 'Aarti thali orbit angle advances smoothly');

console.log('\n=== TEST 6: Ending Sequence Reset & Replay Cleanliness ===');
endingSeq.reset(mockGame);
assert(!endingSeq.isActive, 'Ending sequence reset to inactive');
assert(endingSeq.stage === 0, 'Stage reset to 0');

for (let i = 0; i < npcs.length; i++) {
  assert(!npcs[i].isCelebrating, `NPC ${npcs[i].name} celebration state cleared`);
}

console.log('\n🎉 ALL PHASE 9 FINAL AARTI AND ENDING TESTS PASSED! 🌟\n');
process.exit(0);
