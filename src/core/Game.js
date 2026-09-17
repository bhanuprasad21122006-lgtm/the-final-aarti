import { InputManager } from '../input/InputManager.js';
import { Camera } from '../systems/Camera.js';
import { FestivalMap } from '../render/FestivalMap.js';
import { Player } from '../entities/Player.js';
import { NPCSystem } from '../systems/NPCSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { TimelineEventManager } from '../systems/TimelineEventManager.js';
import { FailureSystem } from '../systems/FailureSystem.js';
import { RewindSystem } from '../systems/RewindSystem.js';
import { NotebookSystem } from '../systems/NotebookSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { ReadinessSystem } from '../systems/ReadinessSystem.js';
import { PuzzleSystem } from '../systems/PuzzleSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { EndingSequenceSystem } from '../systems/EndingSequenceSystem.js';
import { TutorialSystem } from '../systems/TutorialSystem.js';
import { Renderer } from '../render/Renderer.js';
import { GameClock } from './GameClock.js';

/**
 * Game.js
 * Central orchestrator for The Final Aarti.
 * Manages the three interconnected causal puzzles, time-loop rewinds,
 * persistent Notebook discoveries, and the Grand Aarti victory state.
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.input = new InputManager();
    this.map = new FestivalMap();

    this.clock = new GameClock({
      startHour: 17,
      startMinute: 55,
      endHour: 18,
      endMinute: 30,
      timeScale: 3.5
    });

    this.initialPlayerPos = { x: 784, y: 880 };
    this.player = new Player(this.initialPlayerPos.x, this.initialPlayerPos.y);

    this.npcSystem = new NPCSystem();
    this.timelineManager = new TimelineEventManager();
    this.failureSystem = new FailureSystem();

    this.audioManager = new AudioManager();
    this.rewindSystem = new RewindSystem();
    this.notebookSystem = new NotebookSystem(this.audioManager);
    this.inventory = new InventorySystem();
    this.readiness = new ReadinessSystem(this.audioManager);
    this.puzzleSystem = new PuzzleSystem(this.readiness, this.audioManager);
    this.tutorial = new TutorialSystem(this.audioManager);
    this.hasPlayedFailureAudio = false;
    this.lastSpokenDialog = null;

    this.endingSequence = new EndingSequenceSystem();
    this.loopStartTime = Date.now();

    this.camera = new Camera(canvas.width, canvas.height, this.map.width, this.map.height);
    this.camera.follow(this.player);

    this.interactionSystem = new InteractionSystem();
    this.interactionSystem.customHandler = (interactable, isBlackout) => this._handleCustomInteraction(interactable, isBlackout);
    this.renderer = new Renderer(canvas);

    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60;

    // Screen State: 'MENU' | 'INTRO' | 'PLAYING' | 'PAUSED' | 'FAILURE' | 'VICTORY'
    this.screenState = 'MENU';
    this.previousModalScreen = 'MENU';
    this.hasViewedIntro = false;

    this._setupWindowEvents();
    this._setupUIElements();
    this._updateNotebookBadge();
  }

  _setupWindowEvents() {
    window.addEventListener('resize', () => this._onResize());
    this._onResize();

    window.addEventListener('click', () => this.audioManager.unlockAudio(), { once: true });

    window.addEventListener('keydown', (e) => {
      this.audioManager.unlockAudio();
      // Toggle debug with Backquote (~) or F1
      if (e.code === 'Backquote' || e.code === 'F1') {
        this.renderer.debug = !this.renderer.debug;
      }

      // Open / Close Notebook with Tab (or N)
      if ((e.code === 'Tab' || e.code === 'KeyN') && !this.rewindSystem.isRewinding) {
        e.preventDefault(); // Prevent focus switching
        if (this.screenState === 'PAUSED') {
          this.resumeGame();
        }
        this._toggleNotebook();
      }

      // Pause toggle with 'P' or 'Space'
      if ((e.code === 'KeyP' || e.code === 'Space') && !this.interactionSystem.activeDialog && !this.notebookSystem.isOpen && !this.failureSystem.festivalFailed && !this.rewindSystem.isRewinding) {
        if (this.screenState === 'PLAYING') {
          this.pauseGame();
        } else if (this.screenState === 'PAUSED') {
          this.resumeGame();
        } else if (this.screenState !== 'MENU' && this.screenState !== 'INTRO') {
          this.clock.togglePause();
          this._updatePauseButtonState();
        }
      }

      // Rewind / Restart loop with 'R'
      if (e.code === 'KeyR' && !this.interactionSystem.activeDialog && !this.rewindSystem.isRewinding) {
        if (this.screenState === 'PAUSED') {
          this.resumeGame();
        }
        this.triggerRewind();
      }

      // Toggle Mute with 'M'
      if (e.code === 'KeyM') {
        this.audioManager.toggleMute();
        this._updateAudioUI();
      }

      // Toggle Voice-over with 'V'
      if (e.code === 'KeyV') {
        this.audioManager.toggleVoiceOver();
        this._updateAudioUI();
      }

      // Enter key advances intro or main menu
      if (e.code === 'Enter') {
        if (this.screenState === 'INTRO') {
          this.beginFromIntro();
        } else if (this.screenState === 'MENU') {
          this.startGame();
        }
      }

      // Speed adjustments (+ / -)
      if (e.key === '+' || e.key === '=') {
        this.clock.timeScale = Math.min(this.clock.timeScale + 2.0, 30.0);
      }
      if (e.key === '-') {
        this.clock.timeScale = Math.max(this.clock.timeScale - 2.0, 1.0);
      }

      // Close modals or Pause with Escape
      if (e.code === 'Escape') {
        if (this._isSubModalOpen()) {
          this.closeSubModal();
        } else if (this.notebookSystem.isOpen) {
          this._toggleNotebook();
        } else if (this.interactionSystem.activeDialog) {
          this.audioManager.stopSpeech();
          this.interactionSystem.closeDialog();
          this._updateUIDialog();
        } else if (this.screenState === 'PLAYING') {
          this.pauseGame();
        } else if (this.screenState === 'PAUSED') {
          this.resumeGame();
        }
      }
    });
  }

  _onResize() {
    const width = Math.min(window.innerWidth, 1280);
    const height = Math.min(window.innerHeight - 100, 720);

    this.canvas.width = width;
    this.canvas.height = height;

    this.camera.resize(width, height);
    this.renderer.resize(width, height);
  }

  _setupUIElements() {
    this.clockDisplay = document.getElementById('hud-clock');
    this.pauseBtn = document.getElementById('hud-pause-btn');
    this.restartBtn = document.getElementById('hud-restart-btn');
    this.notebookBtn = document.getElementById('hud-notebook-btn');
    this.notebookBadge = document.getElementById('notebook-badge');

    // Dialog modal
    this.dialogOverlay = document.getElementById('dialog-overlay');
    this.dialogTitle = document.getElementById('dialog-title');
    this.dialogBadge = document.getElementById('dialog-badge');
    this.dialogActivity = document.getElementById('dialog-activity');
    this.dialogBody = document.getElementById('dialog-body');
    this.dialogCloseBtn = document.getElementById('dialog-close-btn');

    // Notebook modal
    this.notebookOverlay = document.getElementById('notebook-overlay');
    this.notebookLoopIndicator = document.getElementById('notebook-loop-indicator');
    this.notebookEntriesList = document.getElementById('notebook-entries-list');
    this.notebookSectionDesc = document.getElementById('notebook-section-desc');
    this.notebookCloseX = document.getElementById('notebook-close-x');
    this.notebookFooterCloseBtn = document.getElementById('notebook-footer-close-btn');
    this.notebookTabBtns = document.querySelectorAll('.notebook-tab-btn');

    // Failure modal
    this.failureOverlay = document.getElementById('failure-overlay');
    this.failureTitle = document.getElementById('failure-title');
    this.failureCause = document.getElementById('failure-cause');
    this.recapList = document.getElementById('timeline-recap-list');
    this.failureRewindBtn = document.getElementById('failure-rewind-btn');

    // Rewind overlay (Screen 9)
    this.rewindOverlay = document.getElementById('rewind-overlay');

    // Victory modal
    this.victoryOverlay = document.getElementById('victory-overlay');
    this.victoryReplayBtn = document.getElementById('victory-replay-btn');
    this.victoryCreditsBtn = document.getElementById('victory-credits-btn');

    // Phase 12 Screens: Main Menu, Intro, Instructions, Controls, Pause, Credits
    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.menuStartBtn = document.getElementById('menu-start-btn');
    this.menuInstructionsBtn = document.getElementById('menu-instructions-btn');
    this.menuControlsBtn = document.getElementById('menu-controls-btn');
    this.menuCreditsBtn = document.getElementById('menu-credits-btn');

    this.introOverlay = document.getElementById('intro-overlay');
    this.introBeginBtn = document.getElementById('intro-begin-btn');
    this.introSkipBtn = document.getElementById('intro-skip-btn');

    this.instructionsOverlay = document.getElementById('instructions-overlay');
    this.instructionsBackBtn = document.getElementById('instructions-back-btn');

    this.controlsOverlay = document.getElementById('controls-overlay');
    this.controlsBackBtn = document.getElementById('controls-back-btn');

    this.pauseOverlay = document.getElementById('pause-overlay');
    this.pauseClockVal = document.getElementById('pause-clock-val');
    this.pauseLoopVal = document.getElementById('pause-loop-val');
    this.pauseReadinessVal = document.getElementById('pause-readiness-val');
    this.pauseResumeBtn = document.getElementById('pause-resume-btn');
    this.pauseInstructionsBtn = document.getElementById('pause-instructions-btn');
    this.pauseControlsBtn = document.getElementById('pause-controls-btn');
    this.pauseNotebookBtn = document.getElementById('pause-notebook-btn');
    this.pauseTutorialBtn = document.getElementById('pause-tutorial-btn');
    this.pauseRewindBtn = document.getElementById('pause-rewind-btn');
    this.pauseMenuBtn = document.getElementById('pause-menu-btn');

    this.creditsOverlay = document.getElementById('credits-overlay');
    this.creditsBackBtn = document.getElementById('credits-back-btn');

    // Tutorial Banner Elements
    this.tutorialBanner = document.getElementById('tutorial-banner');
    this.tutorialTitle = document.getElementById('tutorial-title');
    this.tutorialText = document.getElementById('tutorial-text');
    this.tutorialCounter = document.getElementById('tutorial-counter');
    this.tutorialNextBtn = document.getElementById('tutorial-next-btn');
    this.tutorialSkipBtn = document.getElementById('tutorial-skip-btn');

    // Initialize Tutorial System UI
    this.tutorial.initUI(
      this.tutorialBanner,
      this.tutorialTitle,
      this.tutorialText,
      this.tutorialCounter,
      this.tutorialNextBtn,
      this.tutorialSkipBtn
    );

    // Wire Main Menu Events
    if (this.menuStartBtn) {
      this.menuStartBtn.addEventListener('click', () => this.startGame());
    }
    if (this.menuInstructionsBtn) {
      this.menuInstructionsBtn.addEventListener('click', () => this.showInstructions('MENU'));
    }
    if (this.menuControlsBtn) {
      this.menuControlsBtn.addEventListener('click', () => this.showControls('MENU'));
    }
    if (this.menuCreditsBtn) {
      this.menuCreditsBtn.addEventListener('click', () => this.showCredits('MENU'));
    }

    // Wire Intro Events
    if (this.introBeginBtn) {
      this.introBeginBtn.addEventListener('click', () => this.beginFromIntro());
    }
    if (this.introSkipBtn) {
      this.introSkipBtn.addEventListener('click', () => this.beginFromIntro());
    }

    // Wire Instructions Events
    if (this.instructionsBackBtn) {
      this.instructionsBackBtn.addEventListener('click', () => this.closeSubModal());
    }

    // Wire Controls Events
    if (this.controlsBackBtn) {
      this.controlsBackBtn.addEventListener('click', () => this.closeSubModal());
    }

    // Wire Pause Menu Events
    if (this.pauseResumeBtn) {
      this.pauseResumeBtn.addEventListener('click', () => this.resumeGame());
    }
    if (this.pauseInstructionsBtn) {
      this.pauseInstructionsBtn.addEventListener('click', () => this.showInstructions('PAUSED'));
    }
    if (this.pauseControlsBtn) {
      this.pauseControlsBtn.addEventListener('click', () => this.showControls('PAUSED'));
    }
    if (this.pauseNotebookBtn) {
      this.pauseNotebookBtn.addEventListener('click', () => {
        this.resumeGame();
        this._toggleNotebook();
      });
    }
    if (this.pauseTutorialBtn) {
      this.pauseTutorialBtn.addEventListener('click', () => this.replayTutorial());
    }
    if (this.pauseRewindBtn) {
      this.pauseRewindBtn.addEventListener('click', () => {
        this.resumeGame();
        this.triggerRewind();
      });
    }
    if (this.pauseMenuBtn) {
      this.pauseMenuBtn.addEventListener('click', () => this.returnToMainMenu());
    }

    // Wire Credits Events
    if (this.creditsBackBtn) {
      this.creditsBackBtn.addEventListener('click', () => this.closeSubModal());
    }
    if (this.victoryCreditsBtn) {
      this.victoryCreditsBtn.addEventListener('click', () => this.showCredits('VICTORY'));
    }

    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => {
        if (this.screenState === 'PLAYING') {
          this.pauseGame();
        } else if (this.screenState === 'PAUSED') {
          this.resumeGame();
        } else {
          this.clock.togglePause();
          this._updatePauseButtonState();
        }
      });
    }

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => {
        if (this.screenState === 'PAUSED') this.resumeGame();
        this.triggerRewind();
      });
    }

    if (this.notebookBtn) {
      this.notebookBtn.addEventListener('click', () => {
        if (this.screenState === 'PAUSED') this.resumeGame();
        this._toggleNotebook();
      });
    }

    if (this.notebookCloseX) {
      this.notebookCloseX.addEventListener('click', () => this._toggleNotebook());
    }
    if (this.notebookFooterCloseBtn) {
      this.notebookFooterCloseBtn.addEventListener('click', () => this._toggleNotebook());
    }

    // Wire Notebook tab navigation buttons
    this.notebookTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) {
          this.notebookSystem.activeTab = tab;
          this.notebookTabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._populateNotebook();
        }
      });
    });

    if (this.failureRewindBtn) {
      this.failureRewindBtn.addEventListener('click', () => {
        this.triggerRewind();
      });
    }

    if (this.victoryReplayBtn) {
      this.victoryReplayBtn.addEventListener('click', () => {
        this._hideVictoryScreen();
        this.triggerRewind();
      });
    }

    // Audio controls
    this.muteBtn = document.getElementById('hud-mute-btn');
    this.volumeSlider = document.getElementById('hud-volume-slider');
    this.voiceBtn = document.getElementById('hud-voice-btn');

    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => {
        this.audioManager.toggleMute();
        this._updateAudioUI();
      });
    }

    if (this.voiceBtn) {
      this.voiceBtn.addEventListener('click', () => {
        this.audioManager.toggleVoiceOver();
        this._updateAudioUI();
      });
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', () => {
        const val = parseFloat(this.volumeSlider.value) / 100;
        this.audioManager.setVolume(val);
        this._updateAudioUI();
      });
    }

    if (this.dialogCloseBtn) {
      this.dialogCloseBtn.addEventListener('click', () => {
        this.audioManager.stopSpeech();
        this.interactionSystem.closeDialog();
        this._updateUIDialog();
      });
    }
  }

  // --- Screen State Navigation Methods ---

  startGame() {
    this._hideAllMenuModals();
    if (!this.hasViewedIntro && this.introOverlay) {
      this.showIntro();
    } else {
      this.beginFromIntro();
    }
  }

  showIntro() {
    this.screenState = 'INTRO';
    this.clock.isPaused = true;
    this._hideAllMenuModals();
    if (this.introOverlay) {
      this.introOverlay.classList.remove('hidden');
    }
    this._updatePauseButtonState();
  }

  beginFromIntro() {
    this.hasViewedIntro = true;
    this._hideAllMenuModals();
    this.screenState = 'PLAYING';
    this.clock.isPaused = false;
    this._updatePauseButtonState();
    this.tutorial.start();
    this.audioManager.startAmbience();
    this.audioManager.transitionToMusic('exploration');
  }

  showInstructions(sourceScreen = 'MENU') {
    this.previousModalScreen = sourceScreen;
    this._hideAllMenuModals();
    if (this.instructionsOverlay) {
      this.instructionsOverlay.classList.remove('hidden');
    }
  }

  showControls(sourceScreen = 'MENU') {
    this.previousModalScreen = sourceScreen;
    this._hideAllMenuModals();
    if (this.controlsOverlay) {
      this.controlsOverlay.classList.remove('hidden');
    }
  }

  showCredits(sourceScreen = 'MENU') {
    this.previousModalScreen = sourceScreen;
    this._hideAllMenuModals();
    if (this.creditsOverlay) {
      this.creditsOverlay.classList.remove('hidden');
    }
  }

  closeSubModal() {
    this._hideAllMenuModals();
    if (this.previousModalScreen === 'MENU') {
      if (this.mainMenuOverlay) this.mainMenuOverlay.classList.remove('hidden');
      this.screenState = 'MENU';
      this.clock.isPaused = true;
    } else if (this.previousModalScreen === 'PAUSED') {
      this.pauseGame();
    } else if (this.previousModalScreen === 'VICTORY') {
      if (this.victoryOverlay) this.victoryOverlay.classList.remove('hidden');
      this.screenState = 'VICTORY';
    } else {
      this.resumeGame();
    }
  }

  pauseGame() {
    this.clock.isPaused = true;
    this.screenState = 'PAUSED';
    if (this.pauseClockVal) this.pauseClockVal.textContent = this.clock.getFormattedTime();
    if (this.pauseLoopVal) this.pauseLoopVal.textContent = `#${this.notebookSystem.loopCount}`;
    if (this.pauseReadinessVal) this.pauseReadinessVal.textContent = `${this.readiness.getPercentage()}%`;
    if (this.pauseOverlay) this.pauseOverlay.classList.remove('hidden');
    this._updatePauseButtonState();
  }

  resumeGame() {
    if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
    this.clock.isPaused = false;
    this.screenState = 'PLAYING';
    this._updatePauseButtonState();
  }

  returnToMainMenu() {
    if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
    this._hideAllMenuModals();
    this.clock.isPaused = true;
    this.screenState = 'MENU';
    if (this.mainMenuOverlay) this.mainMenuOverlay.classList.remove('hidden');
    this._updatePauseButtonState();
  }

  replayTutorial() {
    this.resumeGame();
    this.tutorial.replay();
  }

  _isSubModalOpen() {
    return (
      (this.instructionsOverlay && !this.instructionsOverlay.classList.contains('hidden')) ||
      (this.controlsOverlay && !this.controlsOverlay.classList.contains('hidden')) ||
      (this.creditsOverlay && !this.creditsOverlay.classList.contains('hidden'))
    );
  }

  _hideAllMenuModals() {
    if (this.mainMenuOverlay) this.mainMenuOverlay.classList.add('hidden');
    if (this.introOverlay) this.introOverlay.classList.add('hidden');
    if (this.instructionsOverlay) this.instructionsOverlay.classList.add('hidden');
    if (this.controlsOverlay) this.controlsOverlay.classList.add('hidden');
    if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
    if (this.creditsOverlay) this.creditsOverlay.classList.add('hidden');
  }

  _updateAudioUI() {
    if (this.muteBtn) {
      if (this.audioManager.isMuted) {
        this.muteBtn.textContent = '🔇';
        this.muteBtn.classList.add('muted');
        this.muteBtn.title = 'Unmute Audio (Key: M)';
      } else {
        this.muteBtn.textContent = '🔊';
        this.muteBtn.classList.remove('muted');
        this.muteBtn.title = 'Mute Audio (Key: M)';
      }
    }
    if (this.voiceBtn) {
      if (this.audioManager.voiceOverEnabled) {
        this.voiceBtn.textContent = '🗣️ Voice: ON';
        this.voiceBtn.classList.add('active');
        this.voiceBtn.classList.remove('disabled');
        this.voiceBtn.title = 'Message Voice-Over: ON (Key: V)';
      } else {
        this.voiceBtn.textContent = '🔇 Voice: OFF';
        this.voiceBtn.classList.remove('active');
        this.voiceBtn.classList.add('disabled');
        this.voiceBtn.title = 'Message Voice-Over: OFF (Key: V)';
      }
    }
    if (this.volumeSlider && !this.audioManager.isMuted) {
      this.volumeSlider.value = Math.round(this.audioManager.volume * 100);
    }
  }

  _updatePauseButtonState() {
    if (!this.pauseBtn) return;
    this.pauseBtn.textContent = this.clock.isPaused ? '▶ Resume' : '⏸ Menu [Esc]';
    if (this.clock.isPaused) {
      this.pauseBtn.classList.add('active');
    } else {
      this.pauseBtn.classList.remove('active');
    }
  }

  _toggleNotebook() {
    const isOpen = this.notebookSystem.toggleOpen();
    if (isOpen) {
      this.tutorial.onNotebookOpened();
      this.audioManager.playNotebookOpen();
      this._populateNotebook();
      this.notebookOverlay.classList.remove('hidden');
    } else {
      this.audioManager.playNotebookClose();
      this.notebookOverlay.classList.add('hidden');
    }
  }

  _updateNotebookBadge() {
    const stats = this.notebookSystem.getStats();
    if (this.notebookBadge) {
      this.notebookBadge.textContent = `(${stats.unlocked})`;
    }

    // Update individual tab counts
    const sections = ['people', 'places', 'objects', 'events', 'clues', 'solved'];
    sections.forEach(sec => {
      const el = document.getElementById(`tab-count-${sec}`);
      if (el) {
        const list = this.notebookSystem.getSectionEntries(sec);
        const unlocked = list.filter(item => item.unlocked).length;
        el.textContent = `(${unlocked}/${list.length})`;
      }
    });
  }

  _populateNotebook() {
    if (!this.notebookEntriesList) return;

    this._updateNotebookBadge();

    const stats = this.notebookSystem.getStats();
    if (this.notebookLoopIndicator) {
      this.notebookLoopIndicator.textContent = `Loop #${this.notebookSystem.loopCount} • ${stats.unlocked}/${stats.total} Mysteries & Facts Recorded`;
    }

    // Section descriptions
    const sectionDescriptions = {
      people: 'Devotees, volunteers, and staff observed or spoken to during the festival:',
      places: 'Distinct locations and pavilions inspected across the festival grounds:',
      objects: 'Sacred items, mechanical apparatus, and electrical hardware inspected:',
      events: 'Milestones and incidents witnessed firsthand along the festival timeline:',
      clues: 'Actionable puzzle clues deduced across your festival investigations:',
      solved: 'Major causal chains and mysteries successfully solved and documented:'
    };

    if (this.notebookSectionDesc) {
      this.notebookSectionDesc.textContent = sectionDescriptions[this.notebookSystem.activeTab] || 'Recorded entries:';
    }

    // Populate current active section entries
    const entries = this.notebookSystem.getSectionEntries(this.notebookSystem.activeTab);
    this.notebookEntriesList.innerHTML = '';

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const li = document.createElement('li');

      if (e.unlocked) {
        // Genuinely discovered entry
        li.className = 'notebook-entry-card';
        li.innerHTML = `
          <div class="notebook-entry-top">
            <span class="notebook-entry-title">${e.title}</span>
            <span class="notebook-entry-badge">${e.category} &bull; Loop #${e.discoveryLoop}</span>
          </div>
          <div class="notebook-entry-desc">${e.description}</div>
        `;
      } else {
        // Undiscovered / Hidden entry
        li.className = 'notebook-entry-locked';
        li.innerHTML = `
          <span>🔒 ??? - Undiscovered Fact</span>
          <span>Explore and observe to record</span>
        `;
      }

      this.notebookEntriesList.appendChild(li);
    }
  }

  triggerRewind() {
    if (this.rewindSystem.isRewinding) return;

    if (this.rewindOverlay) this.rewindOverlay.classList.remove('hidden');
    this.tutorial.onRewindTriggered();
    this.audioManager.stopSpeech();
    this.audioManager.playRewind();
    this.audioManager.transitionToMusic('rewind');

    this._hideFailureScreen();
    this._hideVictoryScreen();
    if (this.notebookSystem.isOpen) this._toggleNotebook();
    if (this.interactionSystem.activeDialog) {
      this.interactionSystem.closeDialog();
      this._updateUIDialog();
    }

    this.rewindSystem.startRewind(() => {
      this._performWorldReset();
    });
  }

  _performWorldReset() {
    console.log('[TimeRewind] Resetting world state. Preserving 6-section notebook entries...');
    if (this.rewindOverlay) this.rewindOverlay.classList.add('hidden');
    this.endingSequence.reset(this);
    this.hasPlayedFailureAudio = false;
    this.lastSpokenDialog = null;
    this.audioManager.setRaining(false);
    this.audioManager.stopAll();
    this.audioManager.setSoundSystemWorking(true);
    this.audioManager.startAmbience();
    this.audioManager.transitionToMusic('exploration');
    this.renderer.endingVisuals.reset();
    this.loopStartTime = Date.now();

    this.clock.reset();
    this.timelineManager.reset();
    this.failureSystem.reset();
    this.inventory.reset();
    this.readiness.reset();
    this.puzzleSystem.reset();
    this.map.resetProps();

    this.player.x = this.initialPlayerPos.x;
    this.player.y = this.initialPlayerPos.y;
    this.player.facing = 'down';
    this.player.state = 'idle';

    this.npcSystem = new NPCSystem();

    this.notebookSystem.incrementLoop();
    this._updateNotebookBadge();

    const stats = this.notebookSystem.getStats();
    this.timelineManager.activeToast = {
      title: `LOOP #${this.notebookSystem.loopCount} - 5:55 PM`,
      time: '5:55 PM',
      description: `The evening restarts! You retain ${stats.unlocked} persistent facts in your notebook.`
    };
    this.timelineManager.toastTimer = 5.0;

    this._updatePauseButtonState();
  }

  _showFailureScreen() {
    if (!this.failureOverlay) return;

    if (!this.hasPlayedFailureAudio) {
      this.hasPlayedFailureAudio = true;
      this.audioManager.playFailure(this.failureSystem.failureType);
      this.audioManager.transitionToMusic('none');
      const failText = `${this.failureSystem.failureTitle}. ${this.failureSystem.failureCause}`;
      this.audioManager.speakPopup(failText, { pitch: 0.88, rate: 0.92 });
    }

    if (this.failureTitle) {
      this.failureTitle.textContent = this.failureSystem.failureTitle;
    }
    if (this.failureCause) {
      this.failureCause.textContent = this.failureSystem.failureCause;
    }

    if (this.recapList) {
      this.recapList.innerHTML = '';
      const recaps = this.failureSystem.timelineRecap;
      for (let i = 0; i < recaps.length; i++) {
        const item = recaps[i];
        const li = document.createElement('li');
        li.className = 'recap-item';
        li.innerHTML = `
          <span class="recap-time">${item.time}</span>
          <div class="recap-content">
            <div class="recap-item-title">${item.title}</div>
            <div class="recap-item-desc">${item.desc}</div>
          </div>
        `;
        this.recapList.appendChild(li);
      }
    }

    this.failureOverlay.classList.remove('hidden');
  }

  _hideFailureScreen() {
    if (this.failureOverlay && !this.failureOverlay.classList.contains('hidden')) {
      this.failureOverlay.classList.add('hidden');
    }
  }

  _showVictoryScreen(stats = null) {
    if (!this.victoryOverlay) return;

    this.audioManager.speakPopup("Ganpati Bappa Moriya! You saved the final aarti!", { pitch: 1.05, rate: 0.95 });

    if (stats) {
      const elLoops = document.getElementById('stat-loops');
      const elClues = document.getElementById('stat-clues');
      const elProblems = document.getElementById('stat-problems');
      const elReadiness = document.getElementById('stat-readiness');
      const elTime = document.getElementById('stat-time');

      if (elLoops) elLoops.textContent = stats.loopsUsed;
      if (elClues) elClues.textContent = stats.cluesDiscovered;
      if (elProblems) elProblems.textContent = stats.problemsSolved;
      if (elReadiness) elReadiness.textContent = stats.festivalReadiness;
      if (elTime) elTime.textContent = stats.completionTime;
    }

    this.victoryOverlay.classList.remove('hidden');
    // Also unlock all solved mysteries in notebook
    this.notebookSystem.unlock('solved', 'solved_crowd');
    this.notebookSystem.unlock('solved', 'solved_blackout');
    this.notebookSystem.unlock('solved', 'solved_modak');
    this.notebookSystem.unlock('solved', 'solved_readiness');
    this._updateNotebookBadge();
  }

  _hideVictoryScreen() {
    if (this.victoryOverlay && !this.victoryOverlay.classList.contains('hidden')) {
      this.victoryOverlay.classList.add('hidden');
    }
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    if (this.mainMenuOverlay && !this.mainMenuOverlay.classList.contains('hidden')) {
      this.screenState = 'MENU';
      this.clock.isPaused = true;
      this._updatePauseButtonState();
    } else {
      this.screenState = 'PLAYING';
      this.clock.isPaused = false;
      this.tutorial.start();
      this.audioManager.startAmbience();
      this.audioManager.transitionToMusic('exploration');
    }
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(currentTime) {
    if (!this.isRunning) return;

    const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedStep) {
      this._update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }

    this._render(frameTime);

    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    this.input.update();

    if (this.rewindSystem.isRewinding) {
      this.rewindSystem.update(dt);
      return;
    }

    this.tutorial.update(dt, this.clock);
    this.notebookSystem.update(dt);

    this.clock.update(dt);
    if (this.clockDisplay) {
      this.clockDisplay.textContent = this.clock.getFormattedTime();
    }

    // Check timeline events and record event discoveries
    this.timelineManager.update(dt, this.clock);
    this._checkTimelineDiscoveries();

    // Check causal puzzle states & failure conditions
    this.failureSystem.update(dt);
    this.puzzleSystem.update(this.clock, this.timelineManager, this.failureSystem);

    if (this.failureSystem.festivalFailed) {
      this._showFailureScreen();
    } else if (this.puzzleSystem.grandAartiAchieved) {
      if (!this.endingSequence.isActive) {
        this.endingSequence.triggerEnding(this);
      }
    }

    if (this.endingSequence.isActive) {
      this.endingSequence.update(dt, this);
    }

    if (!this.clock.isPaused && !this.failureSystem.festivalFailed && !this.puzzleSystem.grandAartiAchieved) {
      this.npcSystem.update(dt, this.clock);
    } else if (this.endingSequence.isActive) {
      this.npcSystem.update(dt, this.clock);
    }

    // Check player spatial zone discoveries
    this._checkSpatialDiscoveries();

    if (!this.interactionSystem.activeDialog && !this.notebookSystem.isOpen && !this.failureSystem.festivalFailed) {
      const prevX = this.player.x;
      const prevY = this.player.y;
      const allObstacles = [...this.map.obstacles, ...this.npcSystem.getAllEntities()];
      this.player.update(dt, this.input, allObstacles);
      const moveDx = this.player.x - prevX;
      const moveDy = this.player.y - prevY;
      if (moveDx !== 0 || moveDy !== 0) {
        this.tutorial.onPlayerMove(moveDx, moveDy);
      }
    }

    // Sound system operational status: breaks down when power fails or blackout occurs
    const isSoundSystemGood = !this.failureSystem.powerFailed && !this.failureSystem.blackout;
    this.audioManager.setSoundSystemWorking(isSoundSystemGood);

    // Damaged electric equipment warning sound when player is near damaged cable / electrical fault
    if (!this.puzzleSystem.isElectricalSolved() && !this.failureSystem.festivalFailed) {
      this.electricalSparkTimer = (this.electricalSparkTimer || 0) + dt;
      const dx = this.player.x - 235;
      const dy = this.player.y - 335;
      const distToCable = Math.hypot(dx, dy);
      const sparkPeriod = this.timelineManager.worldState.isRaining ? 1.5 : 3.5;
      if (distToCable < 125 && this.electricalSparkTimer >= sparkPeriod) {
        this.electricalSparkTimer = 0;
        this.audioManager.playElectricalFault();
      }
    }

    // Dynamic Indian classical music transition: Exploration vs. Tension
    if (!this.failureSystem.festivalFailed && !this.puzzleSystem.grandAartiAchieved && !this.endingSequence.isActive) {
      const isCrowdTense = !this.puzzleSystem.isCrowdSolved() && this.clock.isPastOrAt(17, 58) && !this.clock.isPastOrAt(18, 5);
      const isElectricalTense = !this.puzzleSystem.isElectricalSolved() && this.clock.isPastOrAt(18, 6) && !this.clock.isPastOrAt(18, 10);
      const isModakTense = !this.puzzleSystem.isModakSolved() && this.clock.isPastOrAt(18, 8) && !this.clock.isPastOrAt(18, 10);
      const isReadinessTense = !this.readiness.isComplete() && this.clock.isPastOrAt(18, 28) && !this.clock.isPastOrAt(18, 30);

      if (isCrowdTense || isElectricalTense || isModakTense || isReadinessTense) {
        this.audioManager.transitionToMusic('tension');
      } else {
        this.audioManager.transitionToMusic('exploration');
      }
    }

    // Sync rain audio
    if (this.timelineManager.worldState.isRaining) {
      this.audioManager.setRaining(true);
    } else {
      this.audioManager.setRaining(false);
    }

    this.camera.update(dt);

    this.interactionSystem.update(
      this.player,
      this.map.interactables,
      this.npcSystem.getAllEntities(),
      this.input,
      this.failureSystem.blackout
    );

    // Play interaction sound feedback and voice over on opening or changing dialog
    const dialog = this.interactionSystem.activeDialog;
    if (dialog && dialog !== this.lastSpokenDialog) {
      this.lastSpokenDialog = dialog;
      this.tutorial.onInteraction();
      if (dialog.isNPC) {
        this.audioManager.playNPCInteract();
      } else {
        this.audioManager.playObjectInspect();
      }

      // Voice over the message popup
      const current = this.interactionSystem.currentInteractable;
      const npcId = current?.type === 'npc' ? current.entity?.id : null;
      const textToSpeak = dialog.description || dialog.title;
      this.audioManager.speakPopup(textToSpeak, {
        npcId: npcId,
        isNPC: dialog.isNPC
      });
    } else if (!dialog && this.lastSpokenDialog) {
      // Stopped/closed dialog: cancel ongoing voiceover
      this.lastSpokenDialog = null;
      this.audioManager.stopSpeech();
    }

    if (this.interactionSystem.activeDialog) {
      this._checkInteractionDiscoveries(this.interactionSystem.currentInteractable);
    }

    this._updateUIDialog();
  }

  _checkTimelineDiscoveries() {
    // 6:00 PM Devotees
    if (this.timelineManager.worldState.devoteesArrived) {
      this.notebookSystem.unlock('events', 'devotees_arrive');
      this.notebookSystem.unlock('clues', 'clue_side_entrance');
      if (!this.puzzleSystem.isCrowdSolved()) {
        this.notebookSystem.unlock('clues', 'clue_obstruction_route');
      } else {
        this.notebookSystem.unlock('solved', 'solved_crowd');
      }
      this._updateNotebookBadge();
    }

    // 6:05 PM Electrician to stage
    if (this.clock.isPastOrAt(18, 5)) {
      this.notebookSystem.unlock('events', 'electrician_stage');
      this._updateNotebookBadge();
    }

    // 6:08 PM Rain begins
    if (this.timelineManager.worldState.isRaining) {
      this.notebookSystem.unlock('events', 'rain_starts');
      this.notebookSystem.unlock('clues', 'clue_rain_time');
      if (!this.puzzleSystem.isElectricalSolved()) {
        this.notebookSystem.unlock('clues', 'clue_cable_damaged');
      } else {
        this.notebookSystem.unlock('solved', 'solved_blackout');
      }
      this._updateNotebookBadge();
    }

    // 6:10 PM Electrician leaves for tea
    if (this.clock.isPastOrAt(18, 10)) {
      this.notebookSystem.unlock('events', 'electrician_tea');
      this.notebookSystem.unlock('clues', 'clue_electrician_leaves');
      this._updateNotebookBadge();
    }

    // 6:15 PM PRASADM starts
    if (this.timelineManager.worldState.PRASADMActive) {
      this.notebookSystem.unlock('events', 'PRASADM_starts');
      if (this.puzzleSystem.isModakSolved()) {
        this.notebookSystem.unlock('solved', 'solved_modak');
      } else {
        this.notebookSystem.unlock('clues', 'clue_cook_coconut');
      }
      this._updateNotebookBadge();
    }
  }

  _checkSpatialDiscoveries() {
    const px = this.player.x;
    const py = this.player.y;

    // Electrical Zone (X < 360, Y < 450)
    if (px < 360 && py < 450) {
      this.notebookSystem.unlock('places', 'electrical_area');
    }
    // Mandap & Altar (580 to 1020, Y < 360)
    if (px > 580 && px < 1020 && py < 360) {
      this.notebookSystem.unlock('places', 'mandap_altar');
    }
    // PRASADM Counter (X > 1100, Y > 500 && Y < 800)
    if (px > 1100 && py > 500 && py < 800) {
      this.notebookSystem.unlock('places', 'PRASADM_counter');
    }
    // Flower Stall (X < 400, Y > 500 && Y < 800)
    if (px < 400 && py > 500 && py < 800) {
      this.notebookSystem.unlock('places', 'flower_stall');
    }
    // Welcome Gate (Y > 850)
    if (py > 850) {
      this.notebookSystem.unlock('places', 'welcome_gate');
    }

    this._updateNotebookBadge();
  }

  _checkInteractionDiscoveries(interactable) {
    if (!interactable) return;

    if (interactable.type === 'prop') {
      const objId = interactable.entity.id;

      if (objId === 'damaged_cable') {
        this.notebookSystem.unlock('objects', 'damaged_cable');
        this.notebookSystem.unlock('clues', 'clue_cable_damaged');
      } else if (objId === 'generator') {
        this.notebookSystem.unlock('objects', 'generator');
      } else if (objId === 'sound_mixer') {
        this.notebookSystem.unlock('objects', 'sound_mixer');
      } else if (objId === 'notice_board') {
        this.notebookSystem.unlock('objects', 'notice_board');
      } else if (objId.includes('deepstambh')) {
        this.notebookSystem.unlock('objects', 'deepstambh');
      }
    } else if (interactable.type === 'npc') {
      const npcId = interactable.entity.id;

      // Unlock People entry
      this.notebookSystem.unlock('people', npcId);

      // Specific NPC clue discoveries
      if (npcId === 'electrician') {
        this.notebookSystem.unlock('clues', 'clue_electrician_leaves');
      } else if (npcId === 'cook') {
        this.notebookSystem.unlock('clues', 'clue_cook_coconut');
      } else if (npcId === 'organizer' || npcId === 'flower_seller') {
        this.notebookSystem.unlock('clues', 'clue_sharma_keys');
      } else if (npcId === 'volunteer') {
        this.notebookSystem.unlock('clues', 'clue_side_entrance');
      }
    }

    this._updateNotebookBadge();
  }

  _handleCustomInteraction(interactable, isBlackout) {
    if (!interactable) return null;

    // 1. Pick up Uncle Sharma's brass key
    if (interactable.type === 'prop' && interactable.entity.id === 'storage_key') {
      interactable.entity.active = false;
      this.inventory.addItem('storage_key');
      this.notebookSystem.unlock('objects', 'storage_key');
      this.notebookSystem.unlock('clues', 'clue_sharma_keys');
      this._updateNotebookBadge();

      this.timelineManager.activeToast = {
        title: '🔑 Collected Brass Storage Key',
        time: this.clock.getFormattedTime(),
        description: 'Antique brass key marked "SPM-2026". Opens backstage committee supply cabinet!'
      };
      this.timelineManager.toastTimer = 4.0;

      return {
        title: "Uncle Sharma's Brass Key",
        badge: 'Key Item Acquired',
        activity: '',
        description: 'You found Uncle Sharma\'s lost antique brass key nestled near Radha\'s flower crates! Stamped "SPM-2026", it unlocks the backstage committee supply cabinet.',
        isNPC: false
      };
    }

    // 2. Backstage Committee Storage Cabinet
    if (interactable.type === 'prop' && interactable.entity.id === 'storage_cabinet') {
      this.notebookSystem.unlock('objects', 'storage_cabinet');

      if (this.inventory.hasItem('storage_key')) {
        if (!interactable.entity.isUnlocked) {
          interactable.entity.isUnlocked = true;
          interactable.entity.prompt = 'Inspect Supply Cabinet';
          interactable.entity.description = 'The steel cabinet stands unlocked. The spare power cable and fresh grated coconut have been collected.';
          this.puzzleSystem.cabinetUnlocked = true;

          this.inventory.addItem('replacement_cable');
          this.inventory.addItem('fresh_coconut');

          this.notebookSystem.unlock('clues', 'clue_replacement_cable');
          this.notebookSystem.unlock('clues', 'clue_coconut_storage');
          this._updateNotebookBadge();

          this.timelineManager.activeToast = {
            title: '⚡ & 🥥 Acquired Supplies!',
            time: this.clock.getFormattedTime(),
            description: 'Obtained replacement 415V cable & fresh grated coconut!'
          };
          this.timelineManager.toastTimer = 5.0;

          return {
            title: 'Committee Supply Cabinet',
            badge: 'Unlocked with Brass Key',
            activity: '',
            description: 'CLICK! The brass key turns smoothly! Inside the steel shelves, you discover a heavy, brand-new 415V insulated copper cable with a waterproof tarpaulin, and a sealed vessel of fresh grated coconut for the ukadiche modaks! You take both items into your inventory.',
            isNPC: false
          };
        }
      } else if (!interactable.entity.isUnlocked) {
        this.notebookSystem.unlock('clues', 'clue_sharma_keys');
        this._updateNotebookBadge();
        return {
          title: 'Committee Supply Cabinet',
          badge: 'Locked Heavy Storage',
          activity: '',
          description: 'A reinforced steel locker with a heavy brass padlock. A plaque reads: "Committee Reserves & Tools - Key held by Uncle Sharma". You need Uncle Sharma\'s brass key to unlock this cabinet.',
          isNPC: false
        };
      }
    }

    // 3. Entrance Obstruction Crates
    if (interactable.type === 'prop' && interactable.entity.id === 'entrance_obstruction') {
      this.notebookSystem.unlock('objects', 'entrance_obstruction');

      if (!interactable.entity.isCleared) {
        interactable.entity.isCleared = true;
        interactable.entity.solid = false;
        interactable.entity.prompt = 'Pathway Cleared';
        interactable.entity.description = 'The crates have been pushed against the wall, leaving the eastern queue detour wide open for devotees.';

        // Remove from obstacles
        const obsIdx = this.map.obstacles.indexOf(interactable.entity);
        if (obsIdx !== -1) {
          this.map.obstacles.splice(obsIdx, 1);
        }

        this.puzzleSystem.solveCrowd(this.clock, this.notebookSystem);
        this._updateNotebookBadge();

        this.timelineManager.activeToast = {
          title: '🛡️ Entrance Pathway Cleared!',
          time: this.clock.getFormattedTime(),
          description: 'Crates cleared! Devotees will enter smoothly without bottlenecking.'
        };
        this.timelineManager.toastTimer = 5.0;

        return {
          title: 'Eastern Entrance Detour Cleared',
          badge: 'Obstruction Removed',
          activity: '',
          description: 'Putting your shoulders into it, you shove the heavy cargo crates off the walkway and stack them securely against the side wall. The eastern queue detour is now completely open! Incoming crowds at 6:00 PM will flow into orderly lines without crushing into the mandap!',
          isNPC: false
        };
      }
    }

    // 4. Electrician Ramesh
    if (interactable.type === 'npc' && interactable.entity.id === 'electrician') {
      this.notebookSystem.unlock('people', 'electrician');

      if (this.inventory.hasItem('replacement_cable') && !this.puzzleSystem.isElectricalSolved()) {
        this.inventory.removeItem('replacement_cable');
        this.puzzleSystem.solveElectrical(this.clock, this.notebookSystem);
        this.audioManager.setSoundSystemWorking(true);
        this._updateNotebookBadge();

        interactable.entity.currentActivity = 'Wiring new cable & staking tarp';

        this.timelineManager.activeToast = {
          title: '⚡ Power Conduit Protected!',
          time: this.clock.getFormattedTime(),
          description: 'Ramesh rewired and waterproofed the generator line before the rain!'
        };
        this.timelineManager.toastTimer = 5.0;

        return {
          title: 'Ramesh (Festival Electrician)',
          badge: 'Power Grid Protected',
          activity: 'Status: Conduit Weatherproofed',
          description: '"Aarav! You found the heavy insulated replacement line and waterproof tarpaulin from Sharma\'s cabinet! Fantastic! I will rewire this three-phase connection and stake down the waterproof tarpaulin over the mud trench right now. Even if the heavens open with rain, our power grid is completely safe!"',
          isNPC: true
        };
      }

      if (this.puzzleSystem.isElectricalSolved()) {
        return {
          title: 'Ramesh (Festival Electrician)',
          badge: 'Conduit Weatherproofed',
          activity: 'Status: Standing by Altar Audio',
          description: '"The new cable is hooked up tight and covered with tarpaulin! No water can get in. Let it rain—the Aarti lights and music will stay bright and loud!"',
          isNPC: true
        };
      }
    }

    // 5. Cook Bawarchi Mohan
    if (interactable.type === 'npc' && interactable.entity.id === 'cook') {
      this.notebookSystem.unlock('people', 'cook');

      if (this.inventory.hasItem('fresh_coconut') && !this.puzzleSystem.isModakSolved()) {
        this.inventory.removeItem('fresh_coconut');
        this.puzzleSystem.solveModak(this.clock, this.notebookSystem);
        this._updateNotebookBadge();

        interactable.entity.currentActivity = 'Steaming 108 Ukadiche Modaks';

        this.timelineManager.activeToast = {
          title: '🥥 Modak Preparation Rescued!',
          time: this.clock.getFormattedTime(),
          description: '108 Ukadiche Modaks are steaming on schedule!'
        };
        this.timelineManager.toastTimer = 5.0;

        return {
          title: 'Bawarchi Mohan (Modak Cook)',
          badge: 'PRASADM Rescued',
          activity: 'Status: Steaming 108 Modaks',
          description: '"Aarav! Lord Ganesha has sent you! Pure, fresh grated wet coconut! The cardamom and jaggery filling is ready—I am steaming all 108 sacred Ukadiche Modaks right now. The PRASADM counter will be overflowing on schedule at 6:15 PM! Thank you!"',
          isNPC: true
        };
      }

      if (this.puzzleSystem.isModakSolved()) {
        return {
          title: 'Bawarchi Mohan (Modak Cook)',
          badge: 'Modaks Steaming Hot',
          activity: 'Status: Preparing Brass Thalis',
          description: '"Aarav! The modaks are steaming to divine perfection! The fragrance of jaggery, cardamom, and fresh coconut fills the air. All 108 will be offered to Bappa on time!"',
          isNPC: true
        };
      }
    }

    // 6. Direct fix or inspection on Damaged Cable
    if (interactable.type === 'prop' && interactable.entity.id === 'damaged_cable') {
      this.notebookSystem.unlock('objects', 'damaged_cable');
      this.notebookSystem.unlock('clues', 'clue_cable_damaged');

      if (this.inventory.hasItem('replacement_cable') && !this.puzzleSystem.isElectricalSolved()) {
        this.inventory.removeItem('replacement_cable');
        this.puzzleSystem.solveElectrical(this.clock, this.notebookSystem);
        this.audioManager.setSoundSystemWorking(true);
        this._updateNotebookBadge();

        this.timelineManager.activeToast = {
          title: '⚡ Conduit Weatherproofed!',
          time: this.clock.getFormattedTime(),
          description: 'Replaced cracked cable & securely staked waterproof tarpaulin!'
        };
        this.timelineManager.toastTimer = 5.0;

        return {
          title: '415V Main Power Conduit',
          badge: 'Conduit Weatherproofed',
          activity: '',
          description: 'You lay the fresh heavy-duty 415V insulated cable into the line and tightly stake down the waterproof tarpaulin over the ground depression. Rainwater will now drain away safely, keeping the power grid dry and fully operational!',
          isNPC: false
        };
      }

      if (!this.puzzleSystem.isElectricalSolved()) {
        this.audioManager.playElectricalFault();
        return {
          title: 'Damaged 415V Main Power Cable',
          badge: 'Severe Electrical Hazard',
          activity: 'Status: Sizzling & Unprotected',
          description: 'BZZZT! SNAP! Sparks crackle menacingly from the exposed copper strands! The high-voltage rubber insulation is cracked wide open inside a rain runoff trench. If water pools here, the entire festival power grid will short circuit and cut off the lights and sound!',
          isNPC: false
        };
      }
    }

    // Generator inspection when electrical problem is active
    if (interactable.type === 'prop' && interactable.entity.id === 'generator') {
      this.notebookSystem.unlock('objects', 'generator');
      if (!this.puzzleSystem.isElectricalSolved()) {
        this.audioManager.playElectricalFault();
      }
    }

    // 7. Priya Volunteer interaction after cleared
    if (interactable.type === 'npc' && interactable.entity.id === 'volunteer') {
      this.notebookSystem.unlock('people', 'volunteer');
      if (this.puzzleSystem.isCrowdSolved()) {
        return {
          title: 'Priya (Volunteer Coordinator)',
          badge: 'Entrance Clear',
          activity: 'Status: Guiding Queue',
          description: '"Thank you Aarav! You cleared those crates just in time! The devotees are walking through the barricades in calm, beautiful lines. I was able to bring the ritual oil to the deepstambh without any delay!"',
          isNPC: true
        };
      }
    }

    // 8. Mandap Festival Garland Decorations Arch (Decorations Ready: +15%)
    if (interactable.type === 'prop' && interactable.entity.id === 'mandap_garland_rack') {
      this.notebookSystem.unlock('objects', 'mandap_garland_rack');
      if (!interactable.entity.isDecorated) {
        interactable.entity.isDecorated = true;
        interactable.entity.prompt = 'Mandap Arch Adorned';
        interactable.entity.description = 'The 11-foot royal orange marigold and red rose garland hangs majestically across the entrance arch of the Mandap.';
        this.readiness.addContribution('decorations_ready');
        this.notebookSystem.unlock('clues', 'clue_marigold_garland');
        this._updateNotebookBadge();

        this.timelineManager.activeToast = {
          title: '🌺 Mandap Adorned! (+15% Readiness)',
          time: this.clock.getFormattedTime(),
          description: 'Hung the 11-ft royal marigold garland across the Mandap arch!'
        };
        this.timelineManager.toastTimer = 5.0;

        return {
          title: 'Royal Marigold Archway',
          badge: 'Decorations Ready (+15%)',
          activity: '',
          description: 'You take the fragrant 11-foot garland woven from fresh orange marigolds, golden chrysanthemums, and holy mango leaves from Radha\'s preparation stand. Stepping onto the wooden stool, you loop and secure it firmly across the grand Mandap entrance archway! The hall glows with vibrant festival majesty!',
          isNPC: false
        };
      } else {
        return {
          title: 'Royal Marigold Archway',
          badge: 'Decorations Complete',
          activity: '',
          description: 'The lush 11-foot royal garland of fresh marigolds and red roses adorns the entrance arch. The air is rich with sweet floral fragrance, welcoming devotees into the sanctum.',
          isNPC: false
        };
      }
    }

    // 9. Dada Ramakant (Devotees Helped: +10%)
    if (interactable.type === 'npc' && interactable.entity.id === 'elder') {
      this.notebookSystem.unlock('people', 'elder');
      if (!interactable.entity.hasBeenHelped) {
        interactable.entity.hasBeenHelped = true;
        interactable.entity.currentActivity = 'Seated peacefully at the Altar';
        this.readiness.addContribution('devotees_helped');
        this.notebookSystem.unlock('clues', 'clue_elder_assisted');
        this._updateNotebookBadge();

        this.timelineManager.activeToast = {
          title: '🙏 Devotee Guided! (+10% Readiness)',
          time: this.clock.getFormattedTime(),
          description: 'Assisted Dada Ramakant safely to the front row carpet for Aarti!'
        };
        this.timelineManager.toastTimer = 5.0;

        return {
          title: 'Dada Ramakant (Elder Devotee)',
          badge: 'Elder Devotee Assisted (+10%)',
          activity: 'Status: Seated at Mandap Front Row',
          description: '"Bless your pure soul, young Aarav! My arthritic knees were trembling from standing so long. Taking your gentle arm brought me safely past the bustling crowds right to the front velvet carpet before Bappa. May Lord Vighnaharta bless you with wisdom, health, and joy!"',
          isNPC: true
        };
      } else {
        return {
          title: 'Dada Ramakant (Elder Devotee)',
          badge: 'Peacefully Chanting',
          activity: 'Status: Offering Prayers',
          description: '"I have witnessed this festival for fifty years, Aarav. Today, with the hall so orderly, bright, and joyful, my heart is full of peace. Bappa\'s blessings are with us all tonight."',
          isNPC: true
        };
      }
    }

    // 10. Ceremonial Brass Deepstambh Lamps (Final Preparation: +10%)
    if (interactable.type === 'prop' && (interactable.entity.id === 'deepstambh_left' || interactable.entity.id === 'deepstambh_right')) {
      this.notebookSystem.unlock('objects', 'deepstambh');

      if (!this.readiness.completed.has('final_preparation')) {
        if (this.map.leftDeepstambh) {
          this.map.leftDeepstambh.isLit = true;
          this.map.leftDeepstambh.prompt = 'Deepstambh Lamps Glowing [Sacred Flame]';
        }
        if (this.map.rightDeepstambh) {
          this.map.rightDeepstambh.isLit = true;
          this.map.rightDeepstambh.prompt = 'Deepstambh Lamps Glowing [Sacred Flame]';
        }
        this.readiness.addContribution('final_preparation');
        this.notebookSystem.unlock('clues', 'clue_deepstambh_lit');
        this._updateNotebookBadge();

        this.timelineManager.activeToast = {
          title: '🪔 Deepstambh Lit! (+10% Readiness)',
          time: this.clock.getFormattedTime(),
          description: 'Lit both sacred brass Deepstambh lamps with camphor flame!'
        };
        this.timelineManager.toastTimer = 5.0;

        return {
          title: 'Ceremonial Brass Deepstambh',
          badge: 'Final Aarti Prep (+10%)',
          activity: '',
          description: 'You strike a ceremonial match and touch the pure burning camphor flame to the ghee-soaked wicks of the seven-tiered brass Deepstambh pillars flanking Ganesha\'s altar. Golden sacred flames rise in brilliant symmetry, illuminating the deity\'s face with warm divine radiance!',
          isNPC: false
        };
      } else {
        return {
          title: 'Ceremonial Brass Deepstambh',
          badge: 'Sacred Flame Glowing',
          activity: '',
          description: 'The golden flames dance steadily in the brass tiered lamps, casting a majestic warm aura across Lord Ganesha\'s mandap and the velvet prayer carpets.',
          isNPC: false
        };
      }
    }

    // 11. Flower Seller Radha reaction
    if (interactable.type === 'npc' && interactable.entity.id === 'flower_seller') {
      this.notebookSystem.unlock('people', 'flower_seller');
      if (this.readiness.completed.has('decorations_ready')) {
        return {
          title: 'Radha (Flower Vendor)',
          badge: 'Mandap Adorned',
          activity: 'Status: Offering Blessings',
          description: '"Aarav! Look how radiant the Mandap looks with the royal marigold arch draped! The entire courtyard smells of fresh flowers and devotion! Thank you for hanging it up!"',
          isNPC: true
        };
      }
    }

    return null;
  }

  _updateUIDialog() {
    if (!this.dialogOverlay) return;

    const dialog = this.interactionSystem.activeDialog;
    if (dialog) {
      if (this.dialogOverlay.classList.contains('hidden')) {
        this.dialogOverlay.classList.remove('hidden');
      }
      if (this.dialogTitle) this.dialogTitle.textContent = dialog.title;
      if (this.dialogBadge) this.dialogBadge.textContent = dialog.badge;
      if (this.dialogActivity) {
        if (dialog.activity) {
          this.dialogActivity.textContent = dialog.activity;
          this.dialogActivity.style.display = 'block';
        } else {
          this.dialogActivity.style.display = 'none';
        }
      }
      if (this.dialogBody) this.dialogBody.textContent = dialog.description;
    } else {
      if (!this.dialogOverlay.classList.contains('hidden')) {
        this.dialogOverlay.classList.add('hidden');
      }
    }
  }

  _render(dt) {
    this.renderer.render(
      this.map,
      this.player,
      this.npcSystem.getAllEntities(),
      this.camera,
      this.interactionSystem,
      this.timelineManager,
      this.failureSystem,
      this.rewindSystem,
      this.notebookSystem,
      this.clock,
      dt,
      this.endingSequence
    );
  }
}
