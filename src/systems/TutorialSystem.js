/**
 * TutorialSystem.js
 * First-time player onboarding system for The Final Aarti.
 *
 * Requirements:
 * - Explains Movement (WASD / Arrow Keys)
 * - Explains Interaction (E)
 * - Explains Festival Clock (5:55 PM to 6:30 PM) & Readiness
 * - Explains Festival Diary / Notebook (Tab)
 * - Explains Time Loop Rewind (R)
 * - STRICT CONSTRAINT: Does NOT reveal or spoil puzzle solutions!
 */
export class TutorialSystem {
  constructor(audioManager = null) {
    this.audioManager = audioManager;
    this.currentStep = 1;
    this.totalSteps = 5;
    this.isActive = true;
    this.isCompleted = false;

    // Milestone tracking flags
    this.hasMoved = false;
    this.hasInteracted = false;
    this.hasCheckedClock = false;
    this.hasOpenedNotebook = false;
    this.hasAcknowledgedRewind = false;

    // Movement distance counter
    this.totalDistanceMoved = 0;

    // UI elements references
    this.bannerElem = null;
    this.titleElem = null;
    this.textElem = null;
    this.stepCounterElem = null;
    this.nextBtn = null;
    this.skipBtn = null;

    this.tutorialSteps = [
      {
        step: 1,
        title: 'Step 1: Pandal Movement',
        icon: '👟',
        text: 'Use <strong>W, A, S, D</strong> or the <strong>Arrow Keys</strong> to walk through the festival courtyard and stalls.',
        requiresAction: 'move'
      },
      {
        step: 2,
        title: 'Step 2: People & Object Inspection',
        icon: '💬',
        text: 'Walk close to any festival volunteer, organizer, or decorated stall and press <strong>[E]</strong> to converse or inspect.',
        requiresAction: 'interact'
      },
      {
        step: 3,
        title: 'Step 3: The Festival Clock & Readiness',
        icon: '⏰',
        text: 'The festival runs in real-time from <strong>5:55 PM</strong> until the <strong>6:30 PM Grand Aarti</strong>. Help the pandal reach <strong>100% Readiness</strong> before time expires!',
        requiresAction: 'clock'
      },
      {
        step: 4,
        title: 'Step 4: Volunteer Festival Diary',
        icon: '📖',
        text: 'Press <strong>[Tab]</strong> to open your Volunteer Diary. Every character, clue, and scheduled event you uncover is permanently recorded here across loops!',
        requiresAction: 'notebook'
      },
      {
        step: 5,
        title: 'Step 5: The Sacred Time Loop',
        icon: '↻',
        text: 'If disaster strikes or preparation is incomplete at 6:30 PM, time rewinds to 5:55 PM. Press <strong>[R]</strong> anytime to rewind voluntarily while keeping all diary notes!',
        requiresAction: 'rewind'
      }
    ];
  }

  initUI(bannerElem, titleElem, textElem, stepCounterElem, nextBtn, skipBtn) {
    this.bannerElem = bannerElem;
    this.titleElem = titleElem;
    this.textElem = textElem;
    this.stepCounterElem = stepCounterElem;
    this.nextBtn = nextBtn;
    this.skipBtn = skipBtn;

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.advanceStepManually());
    }
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.skipTutorial());
    }

    this.render();
  }

  start() {
    this.isActive = true;
    this.isCompleted = false;
    this.currentStep = 1;
    this.totalDistanceMoved = 0;
    this.render();
  }

  onPlayerMove(dx, dy) {
    if (!this.isActive || this.currentStep !== 1) return;

    this.totalDistanceMoved += Math.sqrt(dx * dx + dy * dy);
    if (this.totalDistanceMoved > 45 && !this.hasMoved) {
      this.hasMoved = true;
      this._playChime();
      this.nextStep();
    }
  }

  onInteraction() {
    if (!this.isActive) return;

    if (this.currentStep === 2 && !this.hasInteracted) {
      this.hasInteracted = true;
      this._playChime();
      this.nextStep();
    }
  }

  onClockNoticed() {
    if (!this.isActive || this.currentStep !== 3) return;
    this.hasCheckedClock = true;
    this._playChime();
    this.nextStep();
  }

  update(dt, clock = null) {
    if (!this.isActive) return;

    if (this.currentStep === 3) {
      this.stepTimer = (this.stepTimer || 0) + dt;
      if (this.stepTimer >= 7.0) {
        this.stepTimer = 0;
        this.onClockNoticed();
      }
    }
  }

  onNotebookOpened() {
    if (!this.isActive) return;

    if (this.currentStep === 4 && !this.hasOpenedNotebook) {
      this.hasOpenedNotebook = true;
      this._playChime();
      this.nextStep();
    }
  }

  onRewindTriggered() {
    if (!this.isActive) return;
    if (this.currentStep === 5) {
      this.onRewindNoticed();
    }
  }

  onRewindNoticed() {
    if (!this.isActive || this.currentStep !== 5) return;
    this.hasAcknowledgedRewind = true;
    this._playChime();
    this.complete();
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.render();
    } else {
      this.complete();
    }
  }

  advanceStepManually() {
    if (this.currentStep === 1) this.hasMoved = true;
    if (this.currentStep === 2) this.hasInteracted = true;
    if (this.currentStep === 3) this.hasCheckedClock = true;
    if (this.currentStep === 4) this.hasOpenedNotebook = true;
    if (this.currentStep === 5) {
      this.hasAcknowledgedRewind = true;
      this.complete();
      return;
    }
    this._playChime();
    this.nextStep();
  }

  skipTutorial() {
    this.isActive = false;
    this.isCompleted = true;
    if (this.bannerElem) {
      this.bannerElem.classList.add('hidden');
    }
  }

  replay() {
    this.hasMoved = false;
    this.hasInteracted = false;
    this.hasCheckedClock = false;
    this.hasOpenedNotebook = false;
    this.hasAcknowledgedRewind = false;
    this.start();
  }

  complete() {
    this.isActive = false;
    this.isCompleted = true;
    this.renderCompletedBadge();
  }

  render() {
    if (!this.bannerElem) return;

    if (!this.isActive || this.isCompleted) {
      this.bannerElem.classList.add('hidden');
      return;
    }

    this.bannerElem.classList.remove('hidden');

    const stepData = this.tutorialSteps[this.currentStep - 1];
    if (stepData) {
      if (this.titleElem) {
        this.titleElem.innerHTML = `${stepData.icon} ${stepData.title}`;
      }
      if (this.textElem) {
        this.textElem.innerHTML = stepData.text;
      }
      if (this.stepCounterElem) {
        this.stepCounterElem.textContent = `${this.currentStep} of ${this.totalSteps}`;
      }
      if (this.nextBtn) {
        this.nextBtn.textContent = (this.currentStep === this.totalSteps) ? 'Finish [Got It!]' : 'Next →';
      }
      if (this.skipBtn && this.skipBtn.classList) {
        this.skipBtn.classList.remove('hidden');
      }
    }
  }

  renderCompletedBadge() {
    if (!this.bannerElem) return;

    if (this.titleElem) {
      this.titleElem.innerHTML = '🎉 Tutorial Complete!';
    }
    if (this.textElem) {
      this.textElem.innerHTML = 'You are ready to serve as festival volunteer. Investigate, protect the pandal, and make sure the 6:30 PM Aarti happens!';
    }
    if (this.nextBtn) {
      this.nextBtn.textContent = 'Begin Duty!';
    }
    if (this.skipBtn && this.skipBtn.classList) {
      this.skipBtn.classList.add('hidden');
    }

    setTimeout(() => {
      if (this.bannerElem && this.bannerElem.classList && this.isCompleted) {
        this.bannerElem.classList.add('hidden');
      }
    }, 4500);
  }

  _playChime() {
    if (this.audioManager && typeof this.audioManager.playClueDiscovered === 'function') {
      this.audioManager.playClueDiscovered();
    }
  }
}
