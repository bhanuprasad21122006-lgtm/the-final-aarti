/**
 * PuzzleSystem.js
 * Orchestrates the three interconnected festival causal puzzle chains:
 * 1. Electrical Failure: Damaged cable + Rain -> Short Circuit -> Blackout -> Aarti disrupted.
 * 2. Modak Failure: Missing coconut -> Preparation delayed -> PRASADM unavailable -> Crowd dissatisfaction.
 * 3. Crowd Failure: Entrance blocked -> Detour congestion -> Pandal overcrowded -> Volunteer trapped.
 *
 * Checks deadlines, coordinates discoveries with the Notebook,
 * evaluates loop status, and triggers the Grand Aarti victory state.
 */
export class PuzzleSystem {
  constructor(readinessSystem = null, audioManager = null) {
    this.readinessSystem = readinessSystem;
    this.audioManager = audioManager;
    this.puzzles = {
      crowd: {
        id: 'crowd_failure',
        name: 'Pandal Entrance Route Obstruction',
        discovered: false,
        solved: false,
        clearedAt: null,
        deadlineMinutes: 60 // 6:00 PM
      },
      electrical: {
        id: 'electrical_failure',
        name: 'Damaged 415V Power Conduit',
        discovered: false,
        solved: false,
        fixedAt: null,
        deadlineMinutes: 68 // 6:08 PM
      },
      modak: {
        id: 'modak_failure',
        name: 'Missing Fresh Grated Coconut',
        discovered: false,
        solved: false,
        deliveredAt: null,
        deadlineMinutes: 70 // 6:10 PM
      }
    };

    this.cabinetUnlocked = false;
    this.cratesMoved = false;
    this.cableDelivered = false;
    this.coconutDelivered = false;

    this.grandAartiAchieved = false;
  }

  setReadinessSystem(readinessSystem) {
    this.readinessSystem = readinessSystem;
  }

  setAudioManager(audioManager) {
    this.audioManager = audioManager;
  }

  reset() {
    this.puzzles.crowd.solved = false;
    this.puzzles.crowd.clearedAt = null;

    this.puzzles.electrical.solved = false;
    this.puzzles.electrical.fixedAt = null;

    this.puzzles.modak.solved = false;
    this.puzzles.modak.deliveredAt = null;

    this.cabinetUnlocked = false;
    this.cratesMoved = false;
    this.cableDelivered = false;
    this.coconutDelivered = false;
    this.grandAartiAchieved = false;
  }

  isCrowdSolved() {
    return this.puzzles.crowd.solved;
  }

  isElectricalSolved() {
    return this.puzzles.electrical.solved;
  }

  isModakSolved() {
    return this.puzzles.modak.solved;
  }

  areAllSolved() {
    return this.puzzles.crowd.solved && this.puzzles.electrical.solved && this.puzzles.modak.solved;
  }

  solveCrowd(clock, notebook) {
    if (this.puzzles.crowd.solved) return;
    this.puzzles.crowd.solved = true;
    this.cratesMoved = true;
    this.puzzles.crowd.clearedAt = clock.getFormattedTime();

    if (notebook) {
      notebook.unlock('clues', 'clue_obstruction_route');
      notebook.unlock('solved', 'solved_crowd');
    }

    if (this.readinessSystem) {
      this.readinessSystem.addContribution('crowd_managed');
    }

    if (this.audioManager) {
      this.audioManager.playPuzzleSolved();
    }

    console.log('[PuzzleSystem] Solved: Crowd Entrance Route Cleared! (+20% Readiness)');
  }

  solveElectrical(clock, notebook) {
    if (this.puzzles.electrical.solved) return;
    this.puzzles.electrical.solved = true;
    this.cableDelivered = true;
    this.puzzles.electrical.fixedAt = clock.getFormattedTime();

    if (notebook) {
      notebook.unlock('clues', 'clue_replacement_cable');
      notebook.unlock('solved', 'solved_blackout');
    }

    if (this.readinessSystem) {
      this.readinessSystem.addContribution('electricity_fixed');
    }

    if (this.audioManager) {
      this.audioManager.playPuzzleSolved();
    }

    console.log('[PuzzleSystem] Solved: Electrical Area Rewired & Waterproofed! (+25% Readiness)');
  }

  solveModak(clock, notebook) {
    if (this.puzzles.modak.solved) return;
    this.puzzles.modak.solved = true;
    this.coconutDelivered = true;
    this.puzzles.modak.deliveredAt = clock.getFormattedTime();

    if (notebook) {
      notebook.unlock('clues', 'clue_coconut_storage');
      notebook.unlock('solved', 'solved_modak');
    }

    if (this.readinessSystem) {
      this.readinessSystem.addContribution('modaks_prepared');
    }

    if (this.audioManager) {
      this.audioManager.playPuzzleSolved();
    }

    console.log('[PuzzleSystem] Solved: Fresh Coconut Delivered for 108 Modaks! (+20% Readiness)');
  }

  update(clock, timelineManager, failureSystem) {
    if (failureSystem.festivalFailed || this.grandAartiAchieved) return;

    // 1. CROWD FAILURE CHAIN CHECK:
    // If crates were NOT moved before 6:00 PM, crowd detour occurs. At 6:05 PM, crowd crush triggers failure.
    if (!this.puzzles.crowd.solved && clock.isPastOrAt(18, 5)) {
      failureSystem.triggerFailure('crowd', {
        title: 'Entrance Bottleneck & Overcrowding',
        cause: 'Unattended cargo crates blocked the eastern entrance queue. Incoming devotees forced their way into the narrow mandap passageway, triggering severe overcrowding. Volunteer Priya was trapped in the crush and could not reach the altar with sacred lamps, halting festival preparations.',
        recap: [
          { time: '6:00 PM', title: 'Devotees Arrived', desc: 'Devotee families arrived at the Welcome Gate, finding the main queue detour blocked by heavy cargo crates.' },
          { time: '6:02 PM', title: 'Crowd Rerouted', desc: 'Devotees diverted through the narrow central mandap walkway, creating an uncontrolled human bottleneck.' },
          { time: '6:05 PM', title: 'Overcrowding & Gridlock', desc: 'The pandal became completely overcrowded. Volunteers could not move ritual materials or maintain safety.' },
          { time: '6:05 PM', title: 'Festival Stalled', desc: 'Altar preparations were aborted due to crowd congestion.' }
        ]
      });
      return;
    }

    // 2. ELECTRICAL FAILURE CHAIN CHECK:
    // If cable was NOT replaced and protected before 6:08 PM rain, water pools at 6:09 PM, short circuit at 6:10 PM.
    if (!this.puzzles.electrical.solved && clock.isPastOrAt(18, 10)) {
      failureSystem.triggerFailure('electrical', {
        title: 'Generator Power Outage & Short Circuit',
        cause: 'Rainwater from the 6:08 PM monsoon shower pooled into the mud depression near the generator, contacting cracked 415V copper wiring. A massive electrical short circuit tripped the main generator, plunging the festival into total darkness and cutting off stage audio.',
        recap: [
          { time: '6:08 PM', title: 'Rain Started', desc: 'Monsoon rain began soaking the pandal street and west wing generator area.' },
          { time: '6:09 PM', title: 'Water Reached Cable', desc: 'Rain runoff accumulated around unshielded, cracked copper wiring in the ground ditch.' },
          { time: '6:10 PM', title: 'Short Circuit & Blackout', desc: '415V short circuit tripped the generator breaker. All lights and amplifiers died.' },
          { time: '6:12 PM', title: 'Total Silence', desc: 'Microphones, stage lighting, and background music completely ceased.' },
          { time: '6:30 PM', title: 'Aarti Disrupted', desc: 'Without power or audio, the Grand Aarti could not be held in darkness.' }
        ]
      });
      return;
    }

    // 3. MODAK FAILURE CHAIN CHECK:
    // If coconut was NOT delivered before 6:10 PM, Mohan runs out of time. At 6:15 PM, prasad is empty, devotees uproar.
    if (!this.puzzles.modak.solved && clock.isPastOrAt(18, 15)) {
      failureSystem.triggerFailure('modak', {
        title: 'Prasad Unavailable & Devotee Dissatisfaction',
        cause: 'Bawarchi Mohan lacked fresh grated coconut to complete the traditional ukadiche modak filling. At 6:15 PM when devotees queued for consecrated naivedya, the prasad counter was completely empty. The ensuing commotion and public dissatisfaction ruined festival harmony, forcing the committee to cancel the ceremony.',
        recap: [
          { time: '6:00 PM', title: 'Devotees Anticipate Prasad', desc: 'Devotees gathered with anticipation for the sacred 108 Ukadiche Modaks.' },
          { time: '6:10 PM', title: 'Preparation Halted', desc: 'Bawarchi Mohan ran out of fresh coconut; sweet preparation halted incomplete.' },
          { time: '6:15 PM', title: 'Prasad Counter Empty', desc: 'Devotees reached the distribution counter to find empty brass thalis.' },
          { time: '6:18 PM', title: 'Crowd Uproar', desc: 'Devotees protested the mismanagement, causing chaos across the pandal.' },
          { time: '6:25 PM', title: 'Festival Readiness Collapsed', desc: 'Committee members abandoned altar duties to calm the angry crowd.' }
        ]
      });
      return;
    }

    // 4. CULMINATION CHECK AT 6:30 PM:
    if (clock.isPastOrAt(18, 30)) {
      if (this.readinessSystem) {
        if (this.readinessSystem.isComplete()) {
          this.grandAartiAchieved = true;
        } else {
          // Incomplete festival preparation failure!
          const pct = this.readinessSystem.getPercentage();
          const missing = this.readinessSystem.getMissingTasks();
          const missingBullets = missing.map(m => `• ${m.label} (+${m.points}%)`).join(' ');

          failureSystem.triggerFailure('incomplete', {
            title: 'Incomplete Festival Preparation',
            cause: `The auspicious hour of 6:30 PM arrived, but Festival Readiness reached only ${pct}% (100% required). Sacred duties were left unfinished: ${missingBullets}. Panditji concluded that the Grand Aarti could not commence without complete sanctity and preparations.`,
            recap: [
              { time: '6:25 PM', title: 'Readiness Audit', desc: `Committee assessed festival readiness: only ${pct}% complete.` },
              { time: '6:28 PM', title: 'Ritual Deficiencies', desc: `Incomplete arrangements: ${missing.map(m => m.label).join(', ')}.` },
              { time: '6:30 PM', title: 'Grand Aarti Cancelled', desc: 'Without 100% preparation, the ceremonial culmination could not proceed.' }
            ]
          });
        }
      } else if (this.areAllSolved()) {
        this.grandAartiAchieved = true;
      }
    }
  }
}
