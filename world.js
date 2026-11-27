// The run itself: the turkey, the chasing farmer, the obstacles and the
// pickups, stepped at a fixed 60 Hz. Everything the renderer draws comes
// from this state, so a screenshot scene can play the real rules forward.
import {
  ESCAPE_DISTANCE, FARMER, FIELD, LIVES, OBSTACLE, PICKUP, POOL_SIZE,
  SPAWN, STEP, TURKEY,
} from './config.js';
import { floatBetween, intBetween, makeRandom, pick } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_OVER = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_FEATHER = 16;
export const EVENT_DASH = 32;

export const KIND_OVEN = 'oven';
export const KIND_FENCE = 'fence';
export const KIND_BALE = 'bale';
export const KIND_KNIFE = 'knife';
export const KIND_DROP = 'drop';
export const KIND_CORN = 'corn';
export const KIND_PIE = 'pie';
export const KIND_FEATHER = 'feather';

const GROUND_TOP = FIELD.groundY;

/** A fresh, empty run state. */
export function freshState(seed) {
  return {
    seed,
    time: 0,
    distancePx: 0,
    distanceM: 0,
    score: 0,
    lives: LIVES,
    speed: 260,
    bestCombo: 0,
    combo: 0,
    turkey: {
      x: TURKEY.runX,
      y: GROUND_TOP - TURKEY.height,
      vy: 0,
      grounded: true,
      ducking: false,
      dashTimer: 0,
      dashCooldown: 0,
      invulnerable: 0,
      shield: 0,
      runPhase: 0,
    },
    farmerGap: FARMER.startGap,
    farmerPhase: 0,
    timeSinceHit: 99,
    obstacles: [],
    pickups: [],
    particles: [],
    leaves: [],
    spawnTimer: SPAWN.firstGap,
    pickupTimer: 1.6,
    leafTimer: 0.3,
    over: false,
    escaped: false,
    cause: '',
  };
}

/** The world: owns the state, the seeded random source and the step. */
export class World {
  constructor(seed = 1) {
    this.random = makeRandom(seed);
    this.state = freshState(seed);
    this.spawnLeaves(true);
  }

  reset(seed = 1) {
    this.random = makeRandom(seed);
    this.state = freshState(seed);
    this.spawnLeaves(true);
  }

  spawnLeaves(initial) {
    const { leaves } = this.state;
    const count = initial ? 26 : 1;
    for (let i = 0; i < count; i += 1) {
      leaves.push({
        x: initial ? this.random() * FIELD.width : FIELD.width + 20,
        y: this.random() * 420,
        size: floatBetween(this.random, 7, 14),
        speed: floatBetween(this.random, 24, 60),
        sway: floatBetween(this.random, 0, Math.PI * 2),
        colour: pick(this.random, ['#d2691e', '#e8a33c', '#b8442a', '#c96a2e']),
      });
    }
  }

  speedFor(distanceM) {
    return Math.min(500, 260 + distanceM * 0.16);
  }

  spawnObstacleGroup() {
    const { obstacles, distanceM } = this.state;
    const roll = this.random();
    const x = FIELD.width + 40;
    const hard = distanceM > 350;
    const harder = distanceM > 800;
    // The second hazard of a pair trails by a fixed time, not a fixed
    // distance: whatever the speed, the bird has landed and can act again.
    const gap = (seconds) => Math.round(this.state.speed * seconds);
    if (roll < 0.22) {
      obstacles.push(this.makeObstacle(KIND_OVEN, x));
    } else if (roll < 0.4) {
      obstacles.push(this.makeObstacle(KIND_FENCE, x));
      if (hard) obstacles.push(this.makeObstacle(KIND_BALE, x + gap(1.15)));
    } else if (roll < 0.58) {
      obstacles.push(this.makeObstacle(KIND_KNIFE, x));
      if (harder) obstacles.push(this.makeObstacle(KIND_OVEN, x + gap(1.15)));
    } else if (roll < 0.74) {
      // A knife dropped right into the turkey's path: it lands ahead and
      // stays stuck in the dirt while the run carries the bird to it.
      obstacles.push(this.makeObstacle(KIND_DROP, 900, floatBetween(this.random, 260, 460)));
    } else if (roll < 0.88) {
      obstacles.push(this.makeObstacle(KIND_BALE, x));
      obstacles.push(this.makeObstacle(KIND_KNIFE, x + gap(1.15)));
    } else {
      obstacles.push(this.makeObstacle(KIND_OVEN, x));
      obstacles.push(this.makeObstacle(KIND_FENCE, x + gap(1.15)));
    }
  }

  makeObstacle(kind, x, targetX) {
    const base = { kind, x, active: true, passed: false, hitDone: false, phase: this.random() * Math.PI * 2 };
    if (kind === KIND_OVEN) return { ...base, width: OBSTACLE.ovenWidth, height: OBSTACLE.ovenHeight, y: GROUND_TOP - OBSTACLE.ovenHeight };
    if (kind === KIND_FENCE) return { ...base, width: OBSTACLE.fenceWidth, height: OBSTACLE.fenceHeight, y: GROUND_TOP - OBSTACLE.fenceHeight };
    if (kind === KIND_BALE) return { ...base, width: OBSTACLE.baleWidth, height: OBSTACLE.baleHeight, y: GROUND_TOP - OBSTACLE.baleHeight };
    if (kind === KIND_KNIFE) return { ...base, width: OBSTACLE.knifeWidth, height: OBSTACLE.knifeHeight, y: OBSTACLE.knifeFlyY, spin: 0 };
    if (kind === KIND_DROP) return { ...base, width: OBSTACLE.dropKnifeWidth, height: OBSTACLE.dropKnifeHeight, y: -120, vy: 0, targetX: targetX ?? 420, stuck: 0 };
    return { ...base, width: 30, height: 30, y: GROUND_TOP - 60 };
  }

  spawnPickup(kind, x, y) {
    const size = kind === KIND_CORN ? PICKUP.cornSize : kind === KIND_PIE ? PICKUP.pieSize : PICKUP.featherSize;
    this.state.pickups.push({ kind, x, y, size, active: true, bob: this.random() * Math.PI * 2 });
  }

  spawnPickupLine() {
    const { distanceM } = this.state;
    const roll = this.random();
    const x = FIELD.width + 40;
    if (roll < 0.55) {
      const y = GROUND_TOP - 120;
      for (let i = 0; i < 3; i += 1) this.spawnPickup(KIND_CORN, x + i * 56, y);
    } else if (roll < 0.8) {
      // A high arc of corn, taken on the jump over an oven.
      for (let i = 0; i < 4; i += 1) {
        this.spawnPickup(KIND_CORN, x + i * 52, GROUND_TOP - 190 + Math.abs(i - 1.5) * 34);
      }
    } else if (roll < 0.93) {
      this.spawnPickup(KIND_PIE, x, GROUND_TOP - 150);
    } else if (distanceM > 200) {
      this.spawnPickup(KIND_FEATHER, x, GROUND_TOP - 170);
    }
  }

  burst(x, y, colour, count, speed) {
    const { particles } = this.state;
    for (let i = 0; i < count; i += 1) {
      if (particles.length >= POOL_SIZE) return;
      const angle = this.random() * Math.PI * 2;
      const power = speed * (0.4 + this.random() * 0.8);
      particles.push({
        x, y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power - 60,
        life: 0.5 + this.random() * 0.5,
        age: 0,
        size: 3 + this.random() * 5,
        colour,
      });
    }
  }

  turkeyBox() {
    const t = this.state.turkey;
    const height = t.ducking ? 44 : TURKEY.height;
    return { x: t.x + 12, y: t.y + (TURKEY.height - height), width: TURKEY.width - 24, height };
  }

  /** The box an obstacle actually hits with: a little forgiving, so a jump
   * that looks clear plays clear. */
  hitBox(ob) {
    if (ob.kind === KIND_OVEN || ob.kind === KIND_FENCE || ob.kind === KIND_BALE) {
      return { x: ob.x + 10, y: ob.y + 6, width: ob.width - 20, height: ob.height - 6 };
    }
    return ob;
  }

  overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  hitObstacle(obstacle) {
    const s = this.state;
    const t = s.turkey;
    if (t.invulnerable > 0) return EVENT_NONE;
    if (t.shield > 0) {
      t.shield = 0;
      t.invulnerable = TURKEY.invulnerable;
      this.burst(t.x + 42, t.y + 30, '#ffd94a', 18, 260);
      obstacle.hitDone = true;
      return EVENT_FEATHER;
    }
    s.lives -= 1;
    s.combo = 0;
    s.timeSinceHit = 0;
    s.farmerGap = Math.max(FARMER.catchGap - 1, s.farmerGap - FARMER.lungeOnHit);
    t.invulnerable = TURKEY.invulnerable;
    obstacle.hitDone = true;
    this.burst(t.x + 42, t.y + 30, '#e8d9c0', 22, 300);
    this.burst(t.x + 42, t.y + 20, '#b8442a', 10, 220);
    if (s.lives <= 0 || s.farmerGap <= FARMER.catchGap) {
      s.over = true;
      s.cause = s.lives <= 0 ? 'knocked out' : 'caught';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  /** Advance the run one fixed step. `input` is {left, right, jump, duck, dash}. */
  step(dt, input, paused = false) {
    const s = this.state;
    if (s.over || s.escaped || paused) return EVENT_NONE;
    let events = EVENT_NONE;
    s.time += dt;
    s.timeSinceHit += dt;
    s.speed = this.speedFor(s.distanceM);
    const dashing = s.turkey.dashTimer > 0;
    const scroll = s.speed * (dashing ? 1.9 : 1);
    s.distancePx += scroll * dt;
    s.distanceM = s.distancePx / 12;
    s.score += (scroll * dt) / 24;

    const t = s.turkey;
    t.runPhase += dt * (dashing ? 26 : 16);
    s.farmerPhase += dt * 15;
    if (t.invulnerable > 0) t.invulnerable -= dt;
    if (t.shield > 0) t.shield -= dt;
    if (t.dashCooldown > 0) t.dashCooldown -= dt;
    if (t.dashTimer > 0) t.dashTimer -= dt;

    // Horizontal movement inside the running band.
    if (input.left) t.x -= TURKEY.moveSpeed * dt;
    if (input.right) t.x += TURKEY.moveSpeed * dt;
    t.x = Math.max(TURKEY.minX, Math.min(TURKEY.maxX, t.x));
    if (input.dash && t.dashCooldown <= 0 && t.grounded) {
      t.dashTimer = TURKEY.dashTime;
      t.dashCooldown = TURKEY.dashCooldown;
      t.x = Math.min(TURKEY.maxX, t.x + 46);
      this.burst(t.x + 10, GROUND_TOP - 8, '#d9c9a8', 10, 180);
      events |= EVENT_DASH;
    }
    // Jump and duck. Ducking mid-air is a dive: the bird tucks and drops
    // fast, which also slips it under a flying carving knife.
    t.ducking = Boolean(input.duck);
    if (input.jump && t.grounded && !t.ducking) {
      t.vy = -TURKEY.jumpSpeed;
      t.grounded = false;
    }
    if (!t.grounded) {
      t.vy += TURKEY.gravity * dt;
      if (t.ducking) t.vy += 1800 * dt;
      t.y += t.vy * dt;
      if (t.y >= GROUND_TOP - TURKEY.height) {
        t.y = GROUND_TOP - TURKEY.height;
        t.vy = 0;
        t.grounded = true;
        this.burst(t.x + 42, GROUND_TOP - 4, '#d9c9a8', 6, 120);
      }
    }

    // The farmer gains slowly when the turkey is careless, recovers otherwise.
    if (s.timeSinceHit > 3) s.farmerGap = Math.min(FARMER.startGap, s.farmerGap + FARMER.recoverPerSecond * dt);
    if (s.farmerGap <= FARMER.catchGap) {
      s.over = true;
      s.cause = 'caught';
      return events | EVENT_OVER;
    }

    // Spawning.
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      this.spawnObstacleGroup();
      const interval = Math.max(SPAWN.minInterval, SPAWN.baseInterval - s.distanceM * SPAWN.intervalPerMetre);
      s.spawnTimer = interval * floatBetween(this.random, 0.95, 1.25);
    }
    s.pickupTimer -= dt;
    if (s.pickupTimer <= 0) {
      this.spawnPickupLine();
      s.pickupTimer = SPAWN.pickupInterval * floatBetween(this.random, 0.8, 1.4);
    }
    s.leafTimer -= dt;
    if (s.leafTimer <= 0) {
      this.spawnLeaves(false);
      s.leafTimer = floatBetween(this.random, 0.25, 0.8);
    }

    // Move and collide with obstacles.
    const box = this.turkeyBox();
    for (const ob of s.obstacles) {
      if (!ob.active) continue;
      if (ob.kind === KIND_DROP) {
        if (ob.stuck > 0) {
          ob.stuck -= dt;
          if (ob.stuck <= 0) ob.active = false;
        } else {
          ob.vy += 2600 * dt;
          ob.y += ob.vy * dt;
          ob.x -= scroll * dt;
          if (ob.y + ob.height >= GROUND_TOP) {
            ob.y = GROUND_TOP - ob.height;
            ob.stuck = 1.4;
          }
        }
      } else {
        ob.x -= scroll * dt;
        if (ob.kind === KIND_KNIFE) ob.spin += dt * 9;
      }
      if (ob.x + ob.width < -80) { ob.active = false; continue; }
      if (!ob.hitDone && !ob.passed && ob.x + ob.width < t.x) {
        ob.passed = true;
        s.score += 2;
        s.combo += 1;
        s.bestCombo = Math.max(s.bestCombo, s.combo);
      }
      if (!ob.hitDone && this.overlaps(box, this.hitBox(ob))) events |= this.hitObstacle(ob);
      if (s.over) return events;
    }
    s.obstacles = s.obstacles.filter((ob) => ob.active);

    // Pickups drift left and bob.
    for (const p of s.pickups) {
      if (!p.active) continue;
      p.x -= scroll * dt;
      p.bob += dt * 5;
      if (p.x < -60) { p.active = false; continue; }
      const pBox = { x: p.x - p.size / 2, y: p.y + Math.sin(p.bob) * 5 - p.size / 2, width: p.size, height: p.size };
      if (this.overlaps(box, pBox)) {
        p.active = false;
        if (p.kind === KIND_CORN) s.score += PICKUP.cornPoints;
        if (p.kind === KIND_PIE) s.score += PICKUP.piePoints;
        if (p.kind === KIND_FEATHER) {
          s.score += PICKUP.featherPoints;
          t.shield = PICKUP.shieldSeconds;
          events |= EVENT_FEATHER;
          this.burst(p.x, p.y, '#ffd94a', 16, 240);
        } else {
          events |= EVENT_PICKUP;
          this.burst(p.x, p.y, '#f2c94c', 8, 160);
        }
      }
    }
    s.pickups = s.pickups.filter((p) => p.active);

    // Leaves drift and sway.
    for (const leaf of s.leaves) {
      leaf.x -= (scroll * 0.25 + leaf.speed) * dt;
      leaf.sway += dt * 2;
      leaf.y += Math.sin(leaf.sway) * 18 * dt;
    }
    s.leaves = s.leaves.filter((leaf) => leaf.x > -30);

    // Particles fade.
    for (const pt of s.particles) {
      pt.age += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 500 * dt;
    }
    s.particles = s.particles.filter((pt) => pt.age < pt.life);

    // Escape!
    if (s.distanceM >= ESCAPE_DISTANCE) {
      s.escaped = true;
      return events | EVENT_ESCAPED;
    }
    return events;
  }
}
