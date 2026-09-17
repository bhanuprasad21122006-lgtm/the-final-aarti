/**
 * profile_performance.js
 * Profiles the game loop, DOM mutations, memory allocations,
 * and rewind cleanup before and after Phase 14 optimizations.
 */
import { Game } from './src/core/Game.js';

console.log('====================================================');
console.log('  PHASE 14: PERFORMANCE PROFILING & BENCHMARK SUITE ');
console.log('====================================================\n');

// Mock browser DOM environment
const listeners = {};
const elements = {};
let domWriteCount = 0;

function createElement(id, tagName = 'div') {
  const el = {
    id,
    tagName,
    _textContent: '',
    get textContent() { return this._textContent; },
    set textContent(v) {
      domWriteCount++;
      this._textContent = v;
    },
    value: '75',
    title: '',
    innerHTML: '',
    classList: {
      _classes: new Set(),
      add: (c) => el.classList._classes.add(c),
      remove: (c) => el.classList._classes.delete(c),
      contains: (c) => el.classList._classes.has(c)
    },
    style: {},
    appendChild: () => {},
    querySelectorAll: () => [],
    addEventListener: (event, handler) => {
      if (!listeners[id]) listeners[id] = {};
      if (!listeners[id][event]) listeners[id][event] = [];
      listeners[id][event].push(handler);
    },
    dispatchEvent: (event) => {
      const handlers = (listeners[id] && listeners[id][event.type]) || [];
      handlers.forEach(h => h(event));
    }
  };
  elements[id] = el;
  return el;
}

// Global DOM mocks
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener: () => {},
  removeEventListener: () => {}
};

globalThis.document = {
  getElementById: (id) => elements[id] || createElement(id),
  querySelectorAll: () => [],
  createElement: (tag) => createElement('dyn_' + Math.random(), tag)
};

// Mock 2D Canvas context
const mockCtx = {
  save: () => {},
  restore: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  ellipse: () => {},
  quadraticCurveTo: () => {},
  bezierCurveTo: () => {},
  rect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  stroke: () => {},
  fill: () => {},
  roundRect: () => {},
  measureText: () => ({ width: 60 }),
  fillText: () => {},
  createRadialGradient: () => ({ addColorStop: () => {} }),
  createLinearGradient: () => ({ addColorStop: () => {} }),
  drawImage: () => {}
};

const mockCanvas = {
  width: 1280,
  height: 720,
  getContext: () => mockCtx
};

// Create Game instance
const game = new Game(mockCanvas);
game.startGame(); // Enter PLAYING state

// ----------------------------------------------------
// BENCHMARK 1: DOM Writes per 600 Frames (10 seconds)
// ----------------------------------------------------
console.log('--- BENCHMARK 1: DOM Writes in Hot Game Loop ---');
domWriteCount = 0;
const framesToSimulate = 600;

for (let i = 0; i < framesToSimulate; i++) {
  game._update(1 / 60);
}

console.log(`Simulated ${framesToSimulate} frames (10 seconds at 60 FPS).`);
console.log(`Total DOM property writes: ${domWriteCount}`);
console.log(`Average DOM writes per frame: ${(domWriteCount / framesToSimulate).toFixed(2)} writes/frame`);
console.log(`Projected DOM writes per second: ${(domWriteCount / (framesToSimulate / 60)).toFixed(0)} writes/sec`);

// ----------------------------------------------------
// BENCHMARK 2: Update Loop Execution Time
// ----------------------------------------------------
console.log('\n--- BENCHMARK 2: Update Loop Performance (1000 frames) ---');
const startUpdate = performance.now();
for (let i = 0; i < 1000; i++) {
  game._update(1 / 60);
}
const elapsedUpdate = performance.now() - startUpdate;
const avgUpdateMs = elapsedUpdate / 1000;
console.log(`Total 1000 updates: ${elapsedUpdate.toFixed(2)} ms`);
console.log(`Average update time: ${avgUpdateMs.toFixed(3)} ms/frame`);
console.log(`Update budget used: ${((avgUpdateMs / 16.667) * 100).toFixed(1)}% of 16.67ms frame budget`);

// ----------------------------------------------------
// BENCHMARK 3: Render Loop Execution Time
// ----------------------------------------------------
console.log('\n--- BENCHMARK 3: Render Loop Performance (1000 frames) ---');
const startRender = performance.now();
for (let i = 0; i < 1000; i++) {
  game._render(1 / 60);
}
const elapsedRender = performance.now() - startRender;
const avgRenderMs = elapsedRender / 1000;
console.log(`Total 1000 renders: ${elapsedRender.toFixed(2)} ms`);
console.log(`Average render time: ${avgRenderMs.toFixed(3)} ms/frame`);
console.log(`Render budget used: ${((avgRenderMs / 16.667) * 100).toFixed(1)}% of 16.67ms frame budget`);

// ----------------------------------------------------
// BENCHMARK 4: Memory Stability Across 30 Rewind Loops
// ----------------------------------------------------
console.log('\n--- BENCHMARK 4: Memory Stability Across 30 Rewinds ---');
if (globalThis.gc) globalThis.gc();
const initialMemory = process.memoryUsage().heapUsed;

for (let loop = 1; loop <= 30; loop++) {
  game.triggerRewind();
  // simulate rewind update ticks
  for (let t = 0; t < 120; t++) {
    game._update(1 / 60);
  }
}

if (globalThis.gc) globalThis.gc();
const finalMemory = process.memoryUsage().heapUsed;
const memoryDeltaMB = (finalMemory - initialMemory) / (1024 * 1024);
console.log(`Initial Heap Used: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Final Heap Used (after 30 rewinds): ${(finalMemory / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Memory Delta: ${memoryDeltaMB.toFixed(2)} MB`);

console.log('\n====================================================');
console.log('  PROFILING COMPLETED SUCCESSFULLY                   ');
console.log('====================================================');
