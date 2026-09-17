import { Game } from './core/Game.js';

/**
 * main.js
 * Entry point: attaches canvas and starts The Final Aarti festival prototype.
 */
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element #game-canvas not found.');
    return;
  }

  const game = new Game(canvas);
  window.game = game;
  game.start();

  console.log('The Final Aarti - Ganesh Festival Adventure initialized.');
});
