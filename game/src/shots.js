// The screenshot scenes behind ?shot=title|play|chase|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (jump the ovens, duck the knives, chase the corn),
// so every frame is what a short game really looks like and the same seed
// always gives the same frame.
import { FIELD, STEP } from './config.js';
import { EVENT_ESCAPED, EVENT_OVER, KIND_DROP, KIND_KNIFE, KIND_OVEN } from './world.js';
// Ground kinds live here too so the pilot can tell a jumpable hazard from a knife.

import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 16;
const CHASE_SECONDS = 13;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** The obstacles ahead of the turkey, nearest first. An obstacle counts
 * until its back edge has passed the turkey's own back edge, not its nose:
 * a knife still over the bird's tail is still a threat. */
function threatsAhead(state) {
  const back = state.turkey.x + 12;
  return state.obstacles
    .filter((ob) => ob.active && ob.x + ob.width > back)
    .sort((a, b) => a.x - b.x);
}

function isGround(kind) {
  return kind === KIND_OVEN || kind === 'fence' || kind === 'bale';
}

/** The lowest pickup ahead, if any. */
function nearestPickup(state) {
  let best = null;
  for (const p of state.pickups) {
    if (!p.active || p.x < state.turkey.x) continue;
    if (best === null || p.x < best.x) best = p;
  }
  return best;
}

/**
 * Steer the turkey: jump for ground hazards, duck under flying knives,
 * sidestep falling ones, drift toward the nearest corn. `skill` 1 plays well;
 * 0 plays like a hurried player and gets caught.
 */
export function autopilot(state, skill) {
  const t = state.turkey;
  const input = { left: false, right: false, jump: false, duck: false, dash: false };
  // A hurried player freezes up after a few seconds and stops dodging.
  if (skill <= 0.5 && state.time > 12) return input;
  const threats = threatsAhead(state);
  const threat = threats[0] ?? null;
  const next = threats[1] ?? null;
  const distance = threat ? threat.x - (t.x + 84) : Infinity;
  // Mid-air and a knife is coming: tuck and dive under it.
  if (!t.grounded && threat && threat.kind === KIND_KNIFE && distance < 240) {
    input.duck = true;
    return input;
  }
  const react = skill > 0.5 ? 300 : 130;
  if (threat && distance < react && t.grounded) {
    if (threat.kind === KIND_KNIFE) {
      // A ground hazard right behind the knife means ducking would land the
      // bird on it: jump the knife instead and deal with the ground next.
      const groundBehind = next && isGround(next.kind) && next.x - threat.x < 480;
      if (groundBehind) input.jump = distance < 110;
      else input.duck = true;
    } else if (threat.kind === KIND_DROP) {
      // Sidestep the landing mark, then drift back toward the middle.
      if (Math.abs(threat.x - (t.x + 42)) < 90) {
        input.left = threat.x > t.x + 42;
        input.right = threat.x <= t.x + 42;
      }
    } else if (threat.kind === KIND_OVEN) {
      // The jump is floaty: leap late, so the oven passes under the apex.
      input.jump = distance < 110;
      input.dash = distance < 70;
    } else {
      input.jump = distance < 100;
    }
  }
  if (!input.jump && !input.duck) {
    const pickup = nearestPickup(state);
    if (pickup && t.grounded) {
      if (pickup.x > t.x + 120) input.right = true;
      else if (pickup.x < t.x - 20) input.left = true;
    }
  }
  return input;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Any other name is the title scene.
 */
export function stageShot(name, world) {
  world.reset(world.state.seed);
  if (name !== 'play' && name !== 'chase' && name !== 'end') {
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) world.step(STEP, autopilot(world.state, 1), true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : name === 'chase' ? CHASE_SECONDS : PLAY_SECONDS;
  const skill = name === 'end' ? 0 : 1;
  let events = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    events = world.step(STEP, autopilot(world.state, skill), false);
    if (events & (EVENT_OVER | EVENT_ESCAPED)) break;
  }
  if (name === 'chase') {
    // A close call for the cover's drama: the farmer right behind the bird,
    // a carving knife overhead and an oven ahead.
    world.state.farmerGap = 42;
    world.state.timeSinceHit = 0;
    const knife = world.makeObstacle(KIND_KNIFE, world.state.turkey.x + 320);
    world.state.obstacles.push(knife);
    const oven = world.makeObstacle(KIND_OVEN, world.state.turkey.x + 560);
    world.state.obstacles.push(oven);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (world.state.escaped) return { screen: SCREEN_ESCAPED, best: world.state.score };
  if (world.state.over) return { screen: SCREEN_OVER, best: world.state.score };
  return { screen: SCREEN_PLAY, best: world.state.score };
}
