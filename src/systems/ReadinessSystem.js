/**
 * ReadinessSystem.js
 * Manages the quantitative and qualitative Festival Readiness (0% to 100%).
 *
 * Contributions:
 * - electricity_fixed: 25% (Conduit rewired & shielded before rain)
 * - modaks_prepared: 20% (108 Ukadiche Modaks prepared with fresh coconut)
 * - crowd_managed: 20% (Entrance detour cleared, queue flowing smoothly)
 * - decorations_ready: 15% (11-ft royal marigold garland hung on Mandap arch)
 * - devotees_helped: 10% (Elder devotee Dada Ramakant guided safely to altar)
 * - final_preparation: 10% (Ceremonial Deepstambh lamps lit with camphor flame)
 * Total: 100%
 */
export class ReadinessSystem {
  constructor(audioManager = null) {
    this.readiness = 0;
    this.maxReadiness = 100;
    this.audioManager = audioManager;

    this.contributionsConfig = {
      electricity_fixed: {
        points: 25,
        label: '415V Power Conduit Shielded & Waterproofed',
        icon: '⚡'
      },
      modaks_prepared: {
        points: 20,
        label: '108 Ukadiche Modaks Steamed for Naivedya',
        icon: '🥥'
      },
      crowd_managed: {
        points: 20,
        label: 'Entrance Obstruction Cleared & Queue Managed',
        icon: '🛡️'
      },
      decorations_ready: {
        points: 15,
        label: 'Royal Marigold Garlands Hung on Mandap Arch',
        icon: '🌸'
      },
      devotees_helped: {
        points: 10,
        label: 'Devotees Guided & Assisted to Altar Pavilion',
        icon: '🙏'
      },
      final_preparation: {
        points: 10,
        label: 'Brass Deepstambh Ceremonial Lamps Lit',
        icon: '🪔'
      }
    };

    this.completed = new Set();
  }

  setAudioManager(audioManager) {
    this.audioManager = audioManager;
  }

  addContribution(key) {
    if (!this.contributionsConfig[key]) return false;
    if (this.completed.has(key)) return false;

    this.completed.add(key);
    const item = this.contributionsConfig[key];
    this.readiness = Math.min(this.readiness + item.points, this.maxReadiness);

    if (this.audioManager) {
      this.audioManager.playReadinessIncreased();
    }

    console.log(`[Readiness] +${item.points}%: ${item.label} (Total: ${this.readiness}%)`);
    this.renderHUD(item);
    return true;
  }

  hasContribution(key) {
    return this.completed.has(key);
  }

  getPercentage() {
    return this.readiness;
  }

  calculatePercentage() {
    return this.readiness;
  }

  isComplete() {
    return this.readiness >= this.maxReadiness;
  }

  getMissingTasks() {
    const missing = [];
    for (const [k, conf] of Object.entries(this.contributionsConfig)) {
      if (!this.completed.has(k)) {
        missing.push({ key: k, ...conf });
      }
    }
    return missing;
  }

  reset() {
    this.readiness = 0;
    this.completed.clear();
    this.renderHUD();
  }

  renderHUD(lastItem = null) {
    if (typeof document === 'undefined') return;

    const percentEl = document.getElementById('hud-readiness-percent');
    const barEl = document.getElementById('hud-readiness-bar');

    if (percentEl) {
      percentEl.textContent = `${this.readiness}%`;
      // Color transition based on readiness
      if (this.readiness === 100) {
        percentEl.style.color = '#4ade80';
        percentEl.style.textShadow = '0 0 10px rgba(74, 222, 128, 0.8)';
      } else if (this.readiness >= 65) {
        percentEl.style.color = '#fef08a';
        percentEl.style.textShadow = '0 0 8px rgba(254, 240, 138, 0.6)';
      } else {
        percentEl.style.color = '#fb923c';
        percentEl.style.textShadow = '0 0 6px rgba(251, 146, 60, 0.4)';
      }
    }

    if (barEl) {
      barEl.style.width = `${this.readiness}%`;
      if (this.readiness === 100) {
        barEl.style.background = 'linear-gradient(90deg, #f59e0b, #22c55e)';
        barEl.style.boxShadow = '0 0 14px rgba(34, 197, 94, 0.7)';
      } else {
        barEl.style.background = 'linear-gradient(90deg, #ea580c, #f59e0b)';
        barEl.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.5)';
      }
    }
  }
}
