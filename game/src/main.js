// The game loop and the screen flow: title, run, pause, caught, escaped.
// A ?shot=title|play|chase|end URL stages a deterministic scene instead, so
// screenshots are real renders of the game's own code.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { SoundBank } from './audio.js';
import { Input, KEY_MUTE, KEY_PAUSE, KEY_RESTART, KEY_START } from './input.js';
import {
  MUTE_BUTTON, RESTART_BUTTON, SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PAUSED,
  SCREEN_PLAY, SCREEN_TITLE, START_BUTTON, drawScene,
} from './render.js';
import { stageShot } from './shots.js';
import {
  EVENT_DASH, EVENT_ESCAPED, EVENT_FEATHER, EVENT_HIT, EVENT_OVER,
  EVENT_PICKUP, World,
} from './world.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');
const sounds = new SoundBank();
const input = new Input();
input.attach(canvas);

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

let world = new World(seed);
let screen = SCREEN_TITLE;
let best = 0;
try {
  best = Number(window.localStorage.getItem(BEST_KEY) || 0) || 0;
} catch {
  best = 0;
}
let accumulator = 0;
let lastTime = performance.now();
let scrollX = 0;

// A tiny read-only handle for play-testing and debugging in the console.
window.turkeyRun = {
  get screen() { return screen; },
  get state() { return world.state; },
  get best() { return best; },
};

function saveBest(score) {
  const value = Math.floor(score);
  if (value <= best) return;
  best = value;
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Private mode: the best score just lives for this visit.
  }
}

function describeStatus() {
  const s = world.state;
  if (!statusLine) return;
  if (screen === SCREEN_TITLE) {
    statusLine.textContent = 'Turkey Run: title screen. Press Enter or click Start to run from the farmer.';
  } else if (screen === SCREEN_PLAY) {
    statusLine.textContent = `Running: score ${Math.floor(s.score)}, ${Math.floor(s.distanceM)} metres of 1500, ${s.lives} lives left.`;
  } else if (screen === SCREEN_PAUSED) {
    statusLine.textContent = 'Paused. Press P to keep running.';
  } else if (screen === SCREEN_OVER) {
    statusLine.textContent = `Caught after ${Math.floor(s.distanceM)} metres, score ${Math.floor(s.score)}. Press R to run again.`;
  } else if (screen === SCREEN_ESCAPED) {
    statusLine.textContent = `Escaped! 1500 metres, score ${Math.floor(s.score)}. Press R to run again.`;
  }
}

function startRun() {
  sounds.ensure();
  sounds.gobble();
  world = new World((seed + Math.floor(Math.random() * 100000)) % 2147483647);
  screen = SCREEN_PLAY;
  accumulator = 0;
  input.clearPressed();
  describeStatus();
}

function backToTitle() {
  world = new World(seed);
  screen = SCREEN_TITLE;
  describeStatus();
}

function inside(button, x, y) {
  return x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height;
}

input.onKey = (key) => {
  sounds.ensure();
  if (KEY_MUTE.includes(key)) {
    sounds.toggleMute();
    return;
  }
  if (screen === SCREEN_TITLE && KEY_START.includes(key)) startRun();
  else if ((screen === SCREEN_OVER || screen === SCREEN_ESCAPED) && KEY_RESTART.includes(key)) startRun();
  else if (screen === SCREEN_PLAY && KEY_PAUSE.includes(key)) screen = SCREEN_PAUSED;
  else if (screen === SCREEN_PAUSED && KEY_PAUSE.includes(key)) screen = SCREEN_PLAY;
  describeStatus();
};

input.onClick = (x, y) => {
  sounds.ensure();
  if (inside(MUTE_BUTTON, x, y)) {
    sounds.toggleMute();
    return;
  }
  if (screen === SCREEN_TITLE) startRun();
  else if (screen === SCREEN_OVER || screen === SCREEN_ESCAPED) {
    if (inside(RESTART_BUTTON, x, y)) startRun();
  } else if (screen === SCREEN_PAUSED) {
    screen = SCREEN_PLAY;
  }
  describeStatus();
};

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  const width = Math.floor(FIELD.width * scale);
  const height = Math.floor(FIELD.height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// A staged screenshot scene replaces the interactive game entirely.
if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  best = Math.max(best, Math.floor(staged.best));
  scrollX = world.state.distancePx;
  drawScene(ctx, world.state, screen, best, sounds.muted, scrollX);
  describeStatus();
  document.title = `Turkey Run — ${shotName} shot`;
} else {
  describeStatus();
  requestAnimationFrame(frame);
}

function frame(now) {
  const elapsed = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (screen === SCREEN_PLAY) {
    accumulator += elapsed;
    let guard = 0;
    while (accumulator >= STEP && guard < 8) {
      accumulator -= STEP;
      guard += 1;
      const events = world.step(STEP, input.read(), false);
      if (events & EVENT_PICKUP) sounds.pickup();
      if (events & EVENT_FEATHER) sounds.feather();
      if (events & EVENT_DASH) sounds.dash();
      if (events & EVENT_HIT) sounds.hit();
      if (events & EVENT_ESCAPED) {
        saveBest(world.state.score);
        sounds.win();
        screen = SCREEN_ESCAPED;
      } else if (events & EVENT_OVER) {
        saveBest(world.state.score);
        sounds.caught();
        screen = SCREEN_OVER;
      }
      if (screen !== SCREEN_PLAY) break;
    }
    scrollX = world.state.distancePx;
    if (Math.floor(world.state.time * 2) !== Math.floor((world.state.time - elapsed) * 2)) describeStatus();
  } else if (screen === SCREEN_TITLE) {
    // The farm idles behind the title: leaves drift, the sun stays low.
    world.state.time += elapsed;
    for (const leaf of world.state.leaves) {
      leaf.x -= 14 * elapsed;
      leaf.sway += elapsed * 2;
      leaf.y += Math.sin(leaf.sway) * 8 * elapsed;
      if (leaf.x < -30) {
        leaf.x = FIELD.width + 20;
        leaf.y = Math.random() * 420;
      }
    }
  }
  drawScene(ctx, world.state, screen, best, sounds.muted, scrollX);
  requestAnimationFrame(frame);
}
