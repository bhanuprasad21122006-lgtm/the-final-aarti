/**
 * GameClock.js
 * Drives the festival timeline from 5:55 PM to 6:30 PM.
 * Supports pausing, resuming, step scaling, resetting, and formatted time output.
 */
export class GameClock {
  constructor({
    startHour = 17,
    startMinute = 55,
    endHour = 18,
    endMinute = 30,
    timeScale = 3.5
  } = {}) {
    this.startTotalMinutes = startHour * 60 + startMinute;
    this.endTotalMinutes = endHour * 60 + endMinute;
    this.currentTotalMinutes = this.startTotalMinutes;
    this.timeScale = timeScale; // 1 real sec = timeScale in-game sec
    this.isPaused = false;
    this.isFinished = false;
  }

  update(dt) {
    if (this.isPaused || this.isFinished) return;

    // dt is in real seconds
    const minutesToAdd = (dt * this.timeScale) / 60;
    this.currentTotalMinutes += minutesToAdd;

    if (this.currentTotalMinutes >= this.endTotalMinutes) {
      this.currentTotalMinutes = this.endTotalMinutes;
      this.isFinished = true;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  reset() {
    this.currentTotalMinutes = this.startTotalMinutes;
    this.isFinished = false;
  }

  setTime(hour, minute) {
    this.currentTotalMinutes = hour * 60 + minute;
    this.isFinished = this.currentTotalMinutes >= this.endTotalMinutes;
  }

  getHour() {
    return Math.floor(this.currentTotalMinutes / 60) % 24;
  }

  getMinute() {
    return Math.floor(this.currentTotalMinutes) % 60;
  }

  getSecond() {
    return Math.floor((this.currentTotalMinutes * 60) % 60);
  }

  getFormattedTime() {
    let hour = this.getHour();
    const minute = this.getMinute();
    const period = hour >= 12 ? 'PM' : 'AM';

    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;

    const mm = String(minute).padStart(2, '0');
    return `${displayHour}:${mm} ${period}`;
  }

  isPastOrAt(hour, minute) {
    const target = hour * 60 + minute;
    return this.currentTotalMinutes >= target;
  }

  getProgress() {
    const total = this.endTotalMinutes - this.startTotalMinutes;
    const current = this.currentTotalMinutes - this.startTotalMinutes;
    return Math.min(Math.max(current / total, 0), 1);
  }
}
