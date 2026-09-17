/**
 * AudioManager.js
 * Comprehensive Native Web Audio API sound synthesizer for The Final Aarti.
 * Zero external asset dependencies, zero network latency, 100% offline-ready.
 *
 * Implements 4 rich audio categories:
 * 1. Ambient: Festival crowd murmur, street ambiance, distant dhol heartbeat, temple bells, monsoon rain drizzle.
 * 2. Interaction: NPC conversation blip, object inspection tap, clue discovery celestial chord, notebook rustle.
 * 3. Gameplay: Failure impact & blackout hum, time-loop rewind sweep, puzzle solved fanfare, readiness chime.
 * 4. Dynamic Music: Indian classical exploration drone (Tanpura/Flute Bhoopali raga), tension pulse near deadlines,
 *    rewind time-warp, and grand celebratory Aarti fanfare (Shankha, Ghanta, Dholak).
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isUnlocked = false;

    // Master & Sub-Gain Nodes
    this.masterGain = null;
    this.musicGain = null;
    this.ambientGain = null;
    this.sfxGain = null;

    // Volume & Mute state
    this.volume = 0.75;
    this.musicVolume = 0.50; // Venue festival song volume strictly calibrated to 50%
    this.isMuted = false;
    this.previousVolume = 0.75;

    // Sound System Operational Health
    this.soundSystemWorking = true;

    // Music State Machine: 'exploration' | 'tension' | 'failure' | 'rewind' | 'celebration' | 'none'
    this.currentMusicState = 'none';
    this.musicNodes = [];
    this.musicInterval = null;

    // Ambience loops
    this.isAmbienceActive = false;
    this.ambientNodes = [];
    this.dholInterval = null;
    this.bellInterval = null;
    this.isRaining = false;
    this.rainGain = null;
    this.raindropInterval = null;

    // Celebration loops
    this.isPlayingFanfare = false;
    this.fanfareInterval = null;
    this.celebrationBellInterval = null;
    this.aartiBellInterval = null;
    this.aartiMahaGhantaInterval = null;
    this.aartiMantraInterval = null;
    this.isPlayingAartiChant = false;

    // Page Visibility State (audio stops when tab is in background)
    this._isTabHidden = false;
    this._setupVisibilityListener();

    // Voice-over speech synthesis system
    this.voiceOverEnabled = true;
    this.preferredVoice = null;
    this._initSpeechVoices();
  }

  get isTabHidden() {
    if (this._isTabHidden) return true;
    if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
      return true;
    }
    return false;
  }

  set isTabHidden(val) {
    this._isTabHidden = !!val;
  }

  /**
   * Initialize AudioContext and node graph.
   * Safe for headless Node.js environments (test scripts).
   */
  _initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Build Gain Hierarchy:
        // Source -> Sub-Gain (music/ambient/sfx) -> MasterGain -> Destination
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime((this.isMuted || this.isTabHidden) ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }
  }

  unlockAudio() {
    this._initContext();
    if (this.ctx && this.ctx.state === 'suspended' && !this.isTabHidden) {
      this.ctx.resume();
    }
    this.isUnlocked = true;
  }

  // =========================================================================
  // VOLUME & MUTE CONTROLS
  // =========================================================================

  setVolume(vol) {
    this.volume = Math.max(0.0, Math.min(1.0, vol));
    if (!this.isMuted && !this.isTabHidden && this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
    }
  }

  toggleMute() {
    return this.setMute(!this.isMuted);
  }

  setMute(muted) {
    this.isMuted = !!muted;
    if (this.isMuted) {
      this.stopSpeech();
    }
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      if (this.isMuted || this.isTabHidden) {
        this.masterGain.gain.linearRampToValueAtTime(0.0, now + 0.05);
      } else {
        this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
      }
    }
    return this.isMuted;
  }

  // =========================================================================
  // NOISE BUFFER GENERATORS (Crowd, Rain, Shimmer)
  // =========================================================================

  _createPinkNoiseBuffer(duration = 3.0) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // =========================================================================
  // AMBIENT SYSTEM
  // =========================================================================

  startAmbience() {
    this._initContext();
    if (this.isAmbienceActive || this.isTabHidden) return;
    this.isAmbienceActive = true;
    if (!this.ctx) return;

    // 1. Distant Festival Crowd Murmur & Street Rustle
    const crowdBuffer = this._createPinkNoiseBuffer(4.0);
    if (crowdBuffer) {
      const crowdSource = this.ctx.createBufferSource();
      crowdSource.buffer = crowdBuffer;
      crowdSource.loop = true;

      // Bandpass filter to shape warm human vocal frequency range (300Hz - 900Hz)
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(450, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

      const crowdGain = this.ctx.createGain();
      crowdGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

      crowdSource.connect(bandpass);
      bandpass.connect(crowdGain);
      crowdGain.connect(this.ambientGain);

      crowdSource.start();
      this.ambientNodes.push(crowdSource, bandpass, crowdGain);
    }

    // 2. Monsoon Rain Sound (fades in when rain begins)
    const rainBuffer = this._createPinkNoiseBuffer(3.0);
    if (rainBuffer) {
      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(this.isRaining ? 0.22 : 0.0, this.ctx.currentTime);

      rainSource.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ambientGain);

      rainSource.start();
      this.ambientNodes.push(rainSource, rainFilter, this.rainGain);
    }

    // 3. Distant Dhol Heartbeat (~55Hz warm subtle festival pulse every 3.6s)
    this.dholInterval = setInterval(() => {
      if (!this.isAmbienceActive || this.isTabHidden) return;
      this.playDistantDhol();
    }, 3600);

    // 4. Drifting Temple Bells (soft shimmering chime every 8-12s)
    this.bellInterval = setInterval(() => {
      if (!this.isAmbienceActive || this.isTabHidden) return;
      if (Math.random() < 0.75) {
        this.playTempleBell(880 + Math.random() * 350, 0.08); // A5 or C6 soft chime
      }
    }, 8500);
  }

  /**
   * Realistic pattering raindrop tap hitting pandal canvas, metal poles, and puddles
   */
  _playPatteringRaindrop() {
    if (!this.ctx || !this.isRaining || this.isTabHidden) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Random droplet resonant frequencies: 1200Hz - 2600Hz
    const freq = 1200 + Math.random() * 1400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.62, now + 0.035);

    const amp = 0.018 + Math.random() * 0.038;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ambientGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  setRaining(raining) {
    this.isRaining = !!raining;

    if (this.isRaining) {
      if (!this.raindropInterval && typeof setInterval !== 'undefined') {
        this.raindropInterval = setInterval(() => {
          if (!this.isRaining || !this.ctx || this.isTabHidden) return;
          const count = 1 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) {
            if (typeof setTimeout !== 'undefined') {
              setTimeout(() => {
                if (this.isRaining && !this.isTabHidden) this._playPatteringRaindrop();
              }, i * 35);
            } else {
              this._playPatteringRaindrop();
            }
          }
        }, 90);
      }
    } else {
      if (this.raindropInterval) {
        clearInterval(this.raindropInterval);
        this.raindropInterval = null;
      }
    }

    if (this.rainGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.linearRampToValueAtTime(this.isRaining ? 0.28 : 0.0, now + 1.8);
    }
  }

  stopAmbience() {
    this.isAmbienceActive = false;
    if (this.dholInterval) {
      clearInterval(this.dholInterval);
      this.dholInterval = null;
    }
    if (this.bellInterval) {
      clearInterval(this.bellInterval);
      this.bellInterval = null;
    }
    if (this.raindropInterval) {
      clearInterval(this.raindropInterval);
      this.raindropInterval = null;
    }
    for (const node of this.ambientNodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // ignore already stopped nodes
      }
    }
    this.ambientNodes = [];
    this.rainGain = null;
  }

  playDistantDhol() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(68, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ambientGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // =========================================================================
  // INTERACTION SFX
  // =========================================================================

  /**
   * Cheerful high-pitched melodic blip (marimba / flute note) when opening dialog
   */
  playNPCInteract() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Two rapid ascending bright flute notes: G5 (784Hz) -> C6 (1046Hz)
    const notes = [783.99, 1046.5];
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }

  /**
   * Tactile wooden/mechanical tap when inspecting props
   */
  playObjectInspect() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Sparkling celestial discovery chord (maj7 arpeggio with high harmonic bell)
   */
  playClueDiscovered() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Majestic ascending arpeggio (C5 - E5 - G5 - B5 - C6)
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5];
    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.16, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.75);
    });
  }

  /**
   * Soft paper rustle / page turn swoosh
   */
  playNotebookOpen() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const buffer = this._createPinkNoiseBuffer(0.22);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.linearRampToValueAtTime(2600, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    source.start(now);
    source.stop(now + 0.22);
  }

  /**
   * Soft notebook closure tap
   */
  playNotebookClose() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // =========================================================================
  // GAMEPLAY SFX
  // =========================================================================

  /**
   * Dramatic failure impact followed by descending minor dissonance and electrical fizzle
   */
  playFailure(type = 'electrical') {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Heavy low impact thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.8);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain || this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.9);

    // 2. Descending minor dissonance (Eb4 -> D4 -> C#4)
    const tones = [311.13, 293.66, 277.18];
    tones.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.18);
      gain.gain.setValueAtTime(0.14, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.7);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.75);
    });

    // 3. Electrical short buzz if electrical failure
    if (type === 'electrical') {
      const buzzOsc = this.ctx.createOscillator();
      const buzzGain = this.ctx.createGain();
      buzzOsc.type = 'sawtooth';
      buzzOsc.frequency.setValueAtTime(50, now); // 50Hz mains hum
      buzzGain.gain.setValueAtTime(0.2, now);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      buzzOsc.connect(buzzGain);
      buzzGain.connect(this.sfxGain || this.ctx.destination);
      buzzOsc.start(now);
      buzzOsc.stop(now + 1.2);
    }
  }

  /**
   * Sound effect for damaged electric equipment ("something went wrong")
   * High-voltage arc crackle, snapping spark pop, and distorted mains hum frequency sag.
   */
  playElectricalFault() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Spitting electrical arc discharge (bandpass bursts of crackling noise)
    const noiseBuffer = this._createPinkNoiseBuffer(0.4);
    if (noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(4200, now);
      bandpass.Q.setValueAtTime(4.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 0.4);
    }

    // 2. High-voltage snapping spark zap (rapid downward pitch dive 2600Hz -> 120Hz)
    const zapOsc = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zapOsc.type = 'sawtooth';
    zapOsc.frequency.setValueAtTime(2600, now);
    zapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

    zapGain.gain.setValueAtTime(0.32, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    zapOsc.connect(zapGain);
    zapGain.connect(this.sfxGain || this.ctx.destination);
    zapOsc.start(now);
    zapOsc.stop(now + 0.14);

    // 3. Strained mains hum with brownout sag (55Hz -> 28Hz overload buzz)
    const buzzOsc = this.ctx.createOscillator();
    const buzzGain = this.ctx.createGain();
    buzzOsc.type = 'sawtooth';
    buzzOsc.frequency.setValueAtTime(55, now);
    buzzOsc.frequency.linearRampToValueAtTime(28, now + 0.45);

    buzzGain.gain.setValueAtTime(0.28, now);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    buzzOsc.connect(buzzGain);
    buzzGain.connect(this.sfxGain || this.ctx.destination);
    buzzOsc.start(now);
    buzzOsc.stop(now + 0.52);

    // 4. Ominous sub-bass shudder
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.4);
    subGain.gain.setValueAtTime(0.22, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain || this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.48);
  }

  /**
   * Sound effect when the sound system breaks down (breaker trips, amplifiers die, tape-stop deceleration)
   */
  playPowerCut() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Sharp breaker trip click / arc pop
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'square';
    popOsc.frequency.setValueAtTime(800, now);
    popOsc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    popGain.gain.setValueAtTime(0.35, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    popOsc.connect(popGain);
    popGain.connect(this.sfxGain || this.ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.07);

    // 2. Turntable / amplifier power capacitor drain (380Hz -> 20Hz frequency drop)
    const drainOsc = this.ctx.createOscillator();
    const drainGain = this.ctx.createGain();
    drainOsc.type = 'sawtooth';
    drainOsc.frequency.setValueAtTime(380, now);
    drainOsc.frequency.exponentialRampToValueAtTime(20, now + 0.4);

    drainGain.gain.setValueAtTime(0.25, now);
    drainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    drainOsc.connect(drainGain);
    drainGain.connect(this.sfxGain || this.ctx.destination);
    drainOsc.start(now);
    drainOsc.stop(now + 0.48);
  }

  /**
   * Time-warp reverse tape whoosh with ascending pitch sweep
   */
  playRewind() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Ascending and fluttering reverse frequency sweep
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(80, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(1400, now + 1.1);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 1.1);
    filter.Q.setValueAtTime(3.0, now);

    sweepGain.gain.setValueAtTime(0.01, now);
    sweepGain.gain.linearRampToValueAtTime(0.25, now + 0.8);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    sweepOsc.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(this.sfxGain || this.ctx.destination);

    sweepOsc.start(now);
    sweepOsc.stop(now + 1.35);
  }

  /**
   * Triumphant brass fanfare triad with sparkling overtones when a puzzle is solved
   */
  playPuzzleSolved() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Major Triad fanfare: C5 (523.25) -> G5 (783.99) -> C6 (1046.50)
    const notes = [523.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const harm = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      harm.type = 'sine';
      harm.frequency.setValueAtTime(freq * 2, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + (idx === 2 ? 1.2 : 0.45));

      osc.connect(gain);
      harm.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(startTime);
      harm.start(startTime);
      osc.stop(startTime + 1.3);
      harm.stop(startTime + 1.3);
    });
  }

  /**
   * Uplifting ascending 3-note arpeggio (Ta-Da-Ding!) for readiness gains
   */
  playReadinessIncreased() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [659.25, 880.0, 1318.5]; // E5 -> A5 -> E6
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // =========================================================================
  // SACRED INSTRUMENTS (Conch, Ghanta, Dholak)
  // =========================================================================

  playConchHorn() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(215, now);
    osc.frequency.exponentialRampToValueAtTime(245, now + 1.2);
    osc.frequency.exponentialRampToValueAtTime(220, now + 2.8);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(430, now);
    oscHarmonic.frequency.exponentialRampToValueAtTime(490, now + 1.2);
    oscHarmonic.frequency.exponentialRampToValueAtTime(440, now + 2.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 1.0);
    filter.frequency.linearRampToValueAtTime(600, now + 2.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    osc.connect(filter);
    oscHarmonic.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 3.0);
    oscHarmonic.stop(now + 3.0);
  }

  playTempleBell(freq = 1046.5, volume = 0.22) {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const harmonics = [1.0, 2.02, 3.05, 4.2];
    const amplitudes = [volume, volume * 0.55, volume * 0.35, volume * 0.18];
    const decays = [1.8, 1.4, 0.9, 0.6];

    harmonics.forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mult, now);

      gain.gain.setValueAtTime(amplitudes[i], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[i]);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + decays[i]);
    });
  }

  playDholakBeat(isBass = true) {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isBass) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Sound System operational status control.
   * When broken down (power cut, short circuit): music stops immediately.
   * When good: festival music continues at 50% volume.
   */
  setSoundSystemWorking(working) {
    const isWorking = !!working;
    if (this.soundSystemWorking === isWorking) return;
    this.soundSystemWorking = isWorking;

    if (!isWorking) {
      console.log('[AudioManager] Sound system broken down! Stopping festival music.');
      this.playPowerCut();
      this._stopCurrentMusic(0.15);
    } else {
      console.log('[AudioManager] Sound system good! Continuing festival music at 50% volume.');
      if (this.musicGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicVolume, now); // ensure 50% volume
      }
      if (this.currentMusicState === 'exploration' || this.currentMusicState === 'tension') {
        const stateToResume = this.currentMusicState;
        this.currentMusicState = 'none';
        this.transitionToMusic(stateToResume);
      } else if (this.currentMusicState === 'none') {
        this.transitionToMusic('exploration');
      }
    }
  }

  /**
   * Transition between music states with smooth crossfade
   * states: 'exploration' | 'tension' | 'failure' | 'rewind' | 'celebration' | 'none'
   */
  transitionToMusic(newState, fadeDuration = 1.0) {
    if (this.currentMusicState === newState) return;
    this._initContext();

    console.log(`[AudioManager] Music transition: ${this.currentMusicState} -> ${newState}`);
    this._stopCurrentMusic(fadeDuration);
    this.currentMusicState = newState;

    if (this.isTabHidden && newState !== 'none') {
      console.log(`[AudioManager] Tab is in background; deferred music start for: ${newState}`);
      return;
    }

    if (!this.soundSystemWorking && newState !== 'failure' && newState !== 'rewind' && newState !== 'none') {
      console.log(`[AudioManager] Sound system broken down; venue festival music suppressed.`);
      return;
    }

    if (!this.ctx) return;

    switch (newState) {
      case 'exploration':
        this._startExplorationMusic();
        break;
      case 'tension':
        this._startTensionMusic();
        break;
      case 'celebration':
        this.startAartiFanfare();
        break;
      case 'failure':
      case 'rewind':
      case 'none':
      default:
        break;
    }
  }

  _stopCurrentMusic(fadeDuration = 0.5) {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.fanfareInterval) {
      clearInterval(this.fanfareInterval);
      this.fanfareInterval = null;
    }
    if (this.celebrationBellInterval) {
      clearInterval(this.celebrationBellInterval);
      this.celebrationBellInterval = null;
    }
    if (this.aartiBellInterval) {
      clearInterval(this.aartiBellInterval);
      this.aartiBellInterval = null;
    }
    if (this.aartiMahaGhantaInterval) {
      clearInterval(this.aartiMahaGhantaInterval);
      this.aartiMahaGhantaInterval = null;
    }
    if (this.aartiMantraInterval) {
      clearTimeout(this.aartiMantraInterval);
      clearInterval(this.aartiMantraInterval);
      this.aartiMantraInterval = null;
    }
    if (this.isPlayingAartiChant) {
      this.isPlayingAartiChant = false;
      this.stopSpeech();
    }
    this.isPlayingFanfare = false;

    if (this.ctx && this.musicNodes.length > 0) {
      const now = this.ctx.currentTime;
      for (const node of this.musicNodes) {
        try {
          if (node.gain) {
            node.gain.cancelScheduledValues(now);
            node.gain.linearRampToValueAtTime(0.001, now + fadeDuration);
          }
          if (node.stop) {
            node.stop(now + fadeDuration + 0.05);
          }
        } catch (e) {
          // ignore already stopped nodes
        }
      }
    }
    this.musicNodes = [];
  }

  /**
   * Indian Classical Exploration Drone & Bansuri Flute Phrasing (Raag Bhoopali: Sa, Re, Ga, Pa, Dha)
   */
  _startExplorationMusic() {
    if (!this.ctx || this.isTabHidden) return;
    const now = this.ctx.currentTime;

    // 1. Sacred Tanpura Sa-Pa Drone (Fundamental C#3: 138.59Hz & G#3: 207.65Hz)
    const dronePitches = [138.59, 207.65, 277.18]; // C#3, G#3, C#4
    dronePitches.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.08 : 0.045, now + 2.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain || this.ctx.destination);

      osc.start(now);
      this.musicNodes.push(osc, gain);
    });

    // 2. Meditative Bansuri Flute Pentatonic Melodic Phrases (Bhoopali Raga)
    const scale = [277.18, 311.13, 369.99, 415.30, 466.16, 554.37]; // C#4, D#4, F#4, G#4, A#4, C#5
    let phraseStep = 0;

    this.musicInterval = setInterval(() => {
      if (this.currentMusicState !== 'exploration' || !this.ctx || this.isTabHidden) return;

      // Play soft flute note with natural swell and pitch bend
      const noteFreq = scale[phraseStep % scale.length];
      const noteStart = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, noteStart);
      // Subtle microtonal ornamentation (Meend)
      osc.frequency.linearRampToValueAtTime(noteFreq * (phraseStep % 3 === 0 ? 1.02 : 0.99), noteStart + 0.6);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.07, noteStart + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.8);

      osc.connect(gain);
      gain.connect(this.musicGain || this.ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 1.9);

      // Advance through meditative pattern
      const steps = [1, 2, 1, 3, -1, 2];
      phraseStep = (phraseStep + steps[Math.floor(Math.random() * steps.length)] + scale.length) % scale.length;
    }, 2800);
  }

  /**
   * Tension Music: Low urgent pulsing bass drone and staccato clock tick as deadlines approach
   */
  _startTensionMusic() {
    if (!this.ctx || this.isTabHidden) return;
    const now = this.ctx.currentTime;

    // 1. Tense low pulsating minor drone (C#2 69.3Hz & D2 73.4Hz cluster dissonance)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(69.3, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(73.4, now); // 4Hz dissonant beat frequency

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 1.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain || this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    this.musicNodes.push(osc1, osc2, gain);

    // 2. Urgent staccato clock-tick pulse every 750ms
    this.musicInterval = setInterval(() => {
      if (this.currentMusicState !== 'tension' || !this.ctx || this.isTabHidden) return;
      const tickTime = this.ctx.currentTime;

      const tickOsc = this.ctx.createOscillator();
      const tickGain = this.ctx.createGain();

      tickOsc.type = 'triangle';
      tickOsc.frequency.setValueAtTime(880, tickTime);
      tickGain.gain.setValueAtTime(0.09, tickTime);
      tickGain.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.06);

      tickOsc.connect(tickGain);
      tickGain.connect(this.musicGain || this.ctx.destination);

      tickOsc.start(tickTime);
      tickOsc.stop(tickTime + 0.08);
    }, 750);
  }

  /**
   * Start Celebratory Grand Final Aarti
   * Transports the player into an authentic, deeply moving temple Aarti:
   * 1. Resounding Conch Horn (Shankhanaad)
   * 2. Cosmic Om Pranava drone resonance (136.1 Hz)
   * 3. Rhythmic temple bell clanging (Puja Ghanta handheld bells ringing continuously: Ting... Ting-Ting!)
   * 4. Deep bronze Maha Ghanta temple bell tolling every 1.8 seconds with golden harmonics
   * 5. Devotional Ganesh Aarti Mantras chanted through speech synthesis with authentic reverent cadence
   * 6. Rhythmic Dholak & percussion heartbeat
   */
  startAartiFanfare() {
    if (this.isPlayingFanfare || this.isTabHidden) return;
    this.isPlayingFanfare = true;
    this._initContext();

    // 1. Opening conch horn call
    this.playConchHorn();

    // 2. Cosmic Om Pranava Drone Resonance (136.1 Hz)
    if (this.ctx && !this.isTabHidden) {
      const now = this.ctx.currentTime;
      const omOsc = this.ctx.createOscillator();
      const omGain = this.ctx.createGain();
      const omFilter = this.ctx.createBiquadFilter();

      omOsc.type = 'triangle';
      omOsc.frequency.setValueAtTime(136.1, now);

      omFilter.type = 'lowpass';
      omFilter.frequency.setValueAtTime(360, now);

      omGain.gain.setValueAtTime(0.001, now);
      omGain.gain.linearRampToValueAtTime(0.09, now + 1.5);

      omOsc.connect(omFilter);
      omFilter.connect(omGain);
      omGain.connect(this.musicGain || this.ctx.destination);

      omOsc.start(now);
      this.musicNodes.push(omOsc, omGain);
    }

    // 3. Raga Bhoopali pentatonic celebration loop (dholak + melodic chimes)
    const melodyNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    let step = 0;

    this.fanfareInterval = setInterval(() => {
      if (!this.isPlayingFanfare || this.isTabHidden) return;

      const isBass = (step % 2 === 0);
      this.playDholakBeat(isBass);

      const noteIdx = step % melodyNotes.length;
      this._playChimeNote(melodyNotes[noteIdx]);

      step++;
    }, 280);

    // 4. Handheld Puja Ghanta (rhythmic continuous temple bells ringing every 320ms: Ting... Ting... Ting-Ting!)
    const handBellPitches = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
    let bellStep = 0;
    this.aartiBellInterval = setInterval(() => {
      if (!this.isPlayingFanfare || this.isTabHidden) return;
      const pitch = handBellPitches[bellStep % handBellPitches.length];
      this.playPujaHandBell(pitch);
      if (bellStep % 4 === 2) {
        if (typeof setTimeout !== 'undefined') {
          setTimeout(() => {
            if (this.isPlayingFanfare && !this.isTabHidden) this.playPujaHandBell(2093.0);
          }, 110);
        }
      }
      bellStep++;
    }, 320);

    // 5. Deep Maha Ghanta Bronze Temple Bell Tolling every 1.8 seconds
    this.aartiMahaGhantaInterval = setInterval(() => {
      if (!this.isPlayingFanfare || this.isTabHidden) return;
      this.playMahaTempleBell();
    }, 1800);

    // 6. Sacred Aarti Mantras Recitation
    this.startAartiChanting();
  }

  playPujaHandBell(pitch = 1318.5) {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.musicGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playMahaTempleBell() {
    if (this.isTabHidden) return;
    this._initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const pitches = [523.25, 784.88, 1046.5, 1308.1];
    const amps = [0.26, 0.16, 0.11, 0.06];

    pitches.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(amps[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(gain);
      gain.connect(this.musicGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.45);
    });
  }

  /**
   * Continuous sacred Ganesh Aarti mantras chanting during the final ceremony
   */
  startAartiChanting() {
    if (!this.voiceOverEnabled || this.isMuted || this.isTabHidden) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.isPlayingAartiChant = true;
    const mantras = [
      "Vakratunda Mahakaya Suryakoti Samaprabha, Nirvighnam Kuru Me Deva Sarva Karyeshu Sarvada!",
      "Om Gam Ganapataye Namaha... Om Shree Siddhivinayakaya Namo Namah, Ganpati Bappa Moriya!",
      "Sukh Karta Dukh Harta Varta Vighnachi, Nurvi Purvi Prem Krupa Jayachi... Jay Dev Jay Dev Jay Mangal Murti!",
      "Ganpati Bappa Moriya! Mangal Murti Moriya! Pudhchya Varshi Lavkar Ya!"
    ];

    let mantraIdx = 0;
    const chantNext = () => {
      if (!this.isPlayingAartiChant || !this.voiceOverEnabled || this.isMuted || this.isTabHidden) return;
      const text = mantras[mantraIdx % mantras.length];
      mantraIdx++;

      try {
        const SpeechUtterance = window.SpeechSynthesisUtterance || globalThis.SpeechSynthesisUtterance;
        if (!SpeechUtterance) return;
        const utterance = new SpeechUtterance(text);
        if (this.preferredVoice) {
          utterance.voice = this.preferredVoice;
        }
        utterance.volume = Math.max(0.4, Math.min(1.0, this.volume));
        utterance.pitch = 0.95; // Reverent chanting pitch
        utterance.rate = 0.88;  // Sacred rhythmic cadence

        utterance.onend = () => {
          if (this.isPlayingAartiChant && !this.isTabHidden) {
            this.aartiMantraInterval = setTimeout(chantNext, 1200);
          }
        };
        utterance.onerror = () => {
          if (this.isPlayingAartiChant && !this.isTabHidden) {
            this.aartiMantraInterval = setTimeout(chantNext, 2000);
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // safe fallback
      }
    };

    // Chant first mantra as Aarti begins
    chantNext();
  }

  stopAartiChanting() {
    this.isPlayingAartiChant = false;
    if (this.aartiMantraInterval) {
      clearTimeout(this.aartiMantraInterval);
      clearInterval(this.aartiMantraInterval);
      this.aartiMantraInterval = null;
    }
    this.stopSpeech();
  }

  _playChimeNote(freq) {
    if (!this.ctx || this.isTabHidden) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.musicGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  stopAll() {
    this._stopCurrentMusic(0.3);
    this.stopAmbience();
    this.stopAartiChanting();
    this.stopSpeech();
  }

  // =========================================================================
  // MESSAGE POPUP VOICE-OVER (Web Speech API)
  // =========================================================================

  _initSpeechVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this._loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  _loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer Indian English voice if available (e.g. en-IN, en_IN, Heera, Ravi, Neerja)
      const indianVoice = voices.find(v => (v.lang === 'en-IN' || v.lang === 'en_IN') || /india|hindi/i.test(v.name));
      const englishVoice = voices.find(v => v.lang && v.lang.startsWith('en'));

      this.preferredVoice = indianVoice || englishVoice || voices[0];
    } catch (e) {
      // safe fallback
    }
  }

  toggleVoiceOver() {
    return this.setVoiceOver(!this.voiceOverEnabled);
  }

  setVoiceOver(enabled) {
    this.voiceOverEnabled = !!enabled;
    if (!this.voiceOverEnabled) {
      this.stopSpeech();
    }
    return this.voiceOverEnabled;
  }

  _cleanSpeechText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // strip emojis
      .replace(/\s*\(\+?\d+%?[^)]*\)/g, '') // strip (+15% Readiness) tags
      .replace(/\s*\[.*?\]/g, '') // strip bracket shortcuts [E], [Tab], [SPM-2026]
      .replace(/["""]/g, '') // strip quote marks
      .replace(/Status:\s*/gi, '') // strip "Status: " prefixes
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Speak popup message text with character-appropriate pitch and cadence
   */
  speakPopup(text, options = {}) {
    if (!this.voiceOverEnabled || this.isMuted || this.isTabHidden) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.stopSpeech();

    const cleanText = this._cleanSpeechText(text);
    if (!cleanText || cleanText.length === 0) return;

    try {
      const SpeechUtterance = window.SpeechSynthesisUtterance || globalThis.SpeechSynthesisUtterance;
      if (!SpeechUtterance) return;

      const utterance = new SpeechUtterance(cleanText);
      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }

      // Voice volume scaled with master volume
      utterance.volume = Math.max(0.1, Math.min(1.0, this.volume));

      // Character-tuned vocal pitch and speech cadence
      let pitch = 1.0;
      let rate = 1.0;

      if (options.pitch !== undefined) {
        pitch = options.pitch;
      }
      if (options.rate !== undefined) {
        rate = options.rate;
      }

      if (options.npcId) {
        switch (options.npcId) {
          case 'elder': // Dada Ramakant - Elderly, peaceful, reverent
            pitch = 0.82;
            rate = 0.86;
            break;
          case 'child': // Chintu - Youthful, bright, excited
            pitch = 1.30;
            rate = 1.10;
            break;
          case 'flower_seller': // Radha - Warm, melodic vendor
            pitch = 1.16;
            rate = 0.98;
            break;
          case 'volunteer': // Priya - Friendly, efficient volunteer
            pitch = 1.12;
            rate = 1.04;
            break;
          case 'organizer': // Uncle Sharma - Respected senior treasurer
            pitch = 0.88;
            rate = 0.92;
            break;
          case 'electrician': // Ramesh - Busy, practical technician
            pitch = 0.94;
            rate = 1.0;
            break;
          case 'cook': // Bawarchi Mohan - Passionate prasad cook
            pitch = 0.96;
            rate = 1.05;
            break;
          case 'musician': // Sundar - Artistic, rhythmic
            pitch = 0.98;
            rate = 1.02;
            break;
          default:
            pitch = 1.0;
            rate = 1.0;
            break;
        }
      }

      utterance.pitch = pitch;
      utterance.rate = rate;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[AudioManager] Speech synthesis unavailable:', e);
    }
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // safe fallback
      }
    }
  }

  // =========================================================================
  // PAGE VISIBILITY / BACKGROUND TAB AUDIO SUPPRESSION
  // =========================================================================

  _setupVisibilityListener() {
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        const isHidden = document.hidden || document.visibilityState === 'hidden';
        this.handleVisibilityChange(isHidden);
      });
    }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      // Window lost focus (user switched to another app/window or tab in backend)
      window.addEventListener('blur', () => {
        this.handleVisibilityChange(true);
      });
      // Window regained focus
      window.addEventListener('focus', () => {
        if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
          return;
        }
        this.handleVisibilityChange(false);
      });
      window.addEventListener('pagehide', () => {
        this.handleVisibilityChange(true);
      });
      window.addEventListener('pageshow', () => {
        this.handleVisibilityChange(false);
      });
    }
  }

  /**
   * Handle browser tab / window visibility & focus changes.
   * When the tab is in the background / backend ("hidden" or "unfocused"), all audio and speech must stop immediately.
   * When foregrounded, audio resumes cleanly if not muted by the user.
   */
  handleVisibilityChange(isHidden) {
    if (isHidden === undefined && typeof document !== 'undefined') {
      isHidden = document.hidden || document.visibilityState === 'hidden';
    }
    this.isTabHidden = !!isHidden;
    console.log(`[AudioManager] Tab visibility changed: hidden = ${this.isTabHidden}`);

    if (this.isTabHidden) {
      // 1. Cancel all speech synthesis immediately & clear mantra timers
      this.stopSpeech();
      if (this.aartiMantraInterval) {
        clearTimeout(this.aartiMantraInterval);
        clearInterval(this.aartiMantraInterval);
        this.aartiMantraInterval = null;
      }

      // 2. Mute master gain node immediately and disconnect from hardware destination
      if (this.masterGain && this.ctx) {
        try {
          const now = this.ctx.currentTime;
          this.masterGain.gain.cancelScheduledValues(0);
          this.masterGain.gain.setValueAtTime(0, now);
          this.masterGain.gain.value = 0;
          this.masterGain.disconnect();
        } catch (e) {
          // safe fallback
        }
      }

      // 3. Suspend AudioContext to halt all sound generation at driver level
      if (this.ctx && this.ctx.state !== 'closed' && typeof this.ctx.suspend === 'function') {
        try {
          this.ctx.suspend();
        } catch (e) {
          // safe fallback
        }
      }
    } else {
      // 1. Reconnect master gain to destination and restore volume
      if (this.masterGain && this.ctx) {
        try {
          this.masterGain.disconnect();
          this.masterGain.connect(this.ctx.destination);
          const now = this.ctx.currentTime;
          this.masterGain.gain.cancelScheduledValues(0);
          const targetVol = this.isMuted ? 0 : this.volume;
          this.masterGain.gain.setValueAtTime(targetVol, now);
          this.masterGain.gain.value = targetVol;
        } catch (e) {
          // safe fallback
        }
      }

      // 2. Resume AudioContext if suspended and not user-muted
      if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted && typeof this.ctx.resume === 'function') {
        try {
          this.ctx.resume();
        } catch (e) {
          // safe fallback
        }
      }

      // 3. Resume background music if state was active or deferred while hidden
      if (this.soundSystemWorking && !this.isMuted) {
        if (this.currentMusicState === 'exploration' && this.musicNodes.length === 0) {
          this._startExplorationMusic();
        } else if (this.currentMusicState === 'tension' && this.musicNodes.length === 0) {
          this._startTensionMusic();
        } else if (this.currentMusicState === 'celebration' && !this.isPlayingFanfare) {
          this.startAartiFanfare();
        }
      }

      // 4. Resume ambience if active
      if (this.isAmbienceActive && this.ambientNodes.length === 0) {
        this.startAmbience();
      }

      // 5. If Aarti chanting was active before tab was hidden, continue chanting
      if (this.isPlayingAartiChant && !this.isMuted) {
        this.startAartiChanting();
      }
    }
  }
}
