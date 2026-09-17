/**
 * EndingSequenceSystem.js
 * Coordinates the grand final celebration sequence when the player solves the festival:
 * 1. Stage 1 (0s - 3s): Pandal Illumination & Congregation
 *    - All lights and diyas intensify
 *    - Conch horn sounds
 *    - Camera glides smoothly to Mandap Altar (800, 220)
 *    - Major NPCs assemble in front of Shri Ganesh
 * 2. Stage 2 (3s - 8s): Sacred Aarti Ceremony
 *    - Aarti thali flame circles before Lord Ganesh
 *    - Rhythmic temple bell and dholak fanfare
 *    - Flower petal and confetti shower cascade
 *    - Divine rays emanate from the idol
 *    - Crowd raises hands in devotion and cheers
 * 3. Stage 3 (8s+): Festival Completion Message & Statistics
 *    - "GANPATI BAPPA MORIYA!"
 *    - "You saved the final aarti."
 *    - Accurate run statistics displayed
 */
export class EndingSequenceSystem {
  constructor() {
    this.isActive = false;
    this.stage = 0; // 0: Idle, 1: Assembly, 2: Aarti, 3: Culmination
    this.timer = 0;
    this.cameraFocusTarget = { x: 800, y: 220 };
    this.hasTriggeredModal = false;
    this.stats = null;
  }

  triggerEnding(game) {
    if (this.isActive) return;
    this.isActive = true;
    this.stage = 1;
    this.timer = 0;
    this.hasTriggeredModal = false;

    console.log('[EndingSequenceSystem] 🌟 The Grand Final Aarti has begun!');

    // 1. Freeze clock at auspicious Aarti time (6:30 PM)
    game.clock.isPaused = true;

    // 2. Transition music to Celebration Fanfare (Conch + Aarti bells & dholak)
    if (game.audioManager) {
      game.audioManager.transitionToMusic('celebration');
    }

    // 3. Command NPCs to assemble at Mandap
    game.npcSystem.gatherForGrandAarti();

    // 4. Smooth camera switch to focus on Mandap
    game.camera.follow(this.cameraFocusTarget);

    // 5. Gather statistics
    const loopCount = game.notebookSystem.loopCount || 1;
    const nbStats = game.notebookSystem.getStats();
    const readinessPct = game.readiness ? game.readiness.getPercentage() : 100;
    const elapsedMs = Date.now() - (game.loopStartTime || Date.now());
    const totalSecs = Math.max(Math.floor(elapsedMs / 1000), 1);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    this.stats = {
      loopsUsed: loopCount === 1 ? '1 Loop' : `${loopCount} Loops`,
      cluesDiscovered: `${nbStats.unlocked} / ${nbStats.total}`,
      problemsSolved: '3 Causal Chains + 3 Festival Rites',
      festivalReadiness: `${readinessPct}% Complete`,
      completionTime: `6:30 PM (${timeStr} real time)`
    };
  }

  update(dt, game) {
    if (!this.isActive) return;

    this.timer += dt;

    // Transition from Stage 1 to Stage 2 at 3.0s
    if (this.stage === 1 && this.timer >= 3.0) {
      this.stage = 2;
      console.log('[EndingSequenceSystem] 🪔 Sacred Aarti ceremony in progress with bells and flower shower!');
      if (game.audioManager) {
        game.audioManager.startAartiFanfare();
      }
    }

    // Transition to Stage 3 at 7.5s (display completion victory screen)
    if (this.stage === 2 && this.timer >= 7.5 && !this.hasTriggeredModal) {
      this.stage = 3;
      this.hasTriggeredModal = true;
      game._showVictoryScreen(this.stats);
    }
  }

  reset(game) {
    this.isActive = false;
    this.stage = 0;
    this.timer = 0;
    this.hasTriggeredModal = false;
    this.stats = null;

    if (game.audioManager) {
      game.audioManager.stopAll();
    }
    if (game.npcSystem) {
      game.npcSystem.stopCelebration();
    }
    if (game.camera && game.player) {
      game.camera.follow(game.player);
    }
  }
}
