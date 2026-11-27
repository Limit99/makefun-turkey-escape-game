// Everything the player sees: the sunset farm, the turkey, the farmer, the
// hazards, the HUD and every screen. All art is drawn with canvas paths, so
// the game needs no image files at all.
import { FARMER, FIELD, OBSTACLE, PALETTE, TURKEY } from './config.js';
import { KIND_BALE, KIND_CORN, KIND_DROP, KIND_FEATHER, KIND_FENCE, KIND_KNIFE, KIND_OVEN, KIND_PIE } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

/** Clickable button rects, in logical pixels. */
export const START_BUTTON = { x: 490, y: 560, width: 300, height: 72 };
export const RESTART_BUTTON = { x: 490, y: 566, width: 300, height: 72 };
export const MUTE_BUTTON = { x: 1212, y: 14, width: 54, height: 40 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function text(ctx, str, x, y, size, colour, align = 'center', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function outlinedText(ctx, str, x, y, size, colour, align = 'center') {
  ctx.font = `900 ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(40, 12, 6, 0.9)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(str, x, y);
}

/** The sunset farm behind everything, scrolling with the run. */
export function drawBackground(ctx, state, scrollX) {
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.45, PALETTE.skyMid);
  sky.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.groundY + 2);

  // Low sun with a warm halo.
  ctx.fillStyle = PALETTE.sunGlow;
  ellipse(ctx, 1020, 300, 150, 150);
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, 1020, 300, 74, 74);

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 220, 180, 0.5)';
  const clouds = [[180, 90, 90], [520, 140, 70], [860, 70, 80], [1180, 150, 60]];
  for (const [cx, cy, cr] of clouds) {
    const drift = (scrollX * 0.05 + cx) % 1500;
    ellipse(ctx, drift - 110, cy, cr, cr * 0.36);
    ellipse(ctx, drift - 40, cy + 8, cr * 0.7, cr * 0.3);
  }

  // Far hills and the old red barn.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 560);
  for (let x = 0; x <= FIELD.width; x += 80) {
    ctx.lineTo(x, 540 + Math.sin((x + scrollX * 0.1) * 0.006) * 26);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.lineTo(0, FIELD.groundY);
  ctx.closePath();
  ctx.fill();
  drawBarn(ctx, 980 - ((scrollX * 0.15) % 1600), 430);
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 590);
  for (let x = 0; x <= FIELD.width; x += 80) {
    ctx.lineTo(x, 580 + Math.sin((x + scrollX * 0.2) * 0.008 + 2) * 18);
  }
  ctx.lineTo(FIELD.width, FIELD.groundY);
  ctx.lineTo(0, FIELD.groundY);
  ctx.closePath();
  ctx.fill();

  // Ground: packed earth with a grassy top edge.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, FIELD.groundY, FIELD.width, 10);
  ctx.fillStyle = PALETTE.groundTop;
  for (let x = 0; x < FIELD.width; x += 46) {
    const px = x - (scrollX % 46);
    ctx.fillRect(px, FIELD.groundY + 26 + ((x * 7) % 40), 22, 5);
  }

  // Fence posts and pumpkins marching past.
  ctx.fillStyle = PALETTE.fence;
  for (let x = -((scrollX * 1) % 130); x < FIELD.width; x += 130) {
    ctx.fillRect(x, FIELD.groundY - 52, 10, 52);
    ctx.fillRect(x - 60, FIELD.groundY - 44, 130, 7);
    ctx.fillRect(x - 60, FIELD.groundY - 26, 130, 7);
  }
  drawPumpkin(ctx, 700 - ((scrollX * 1) % 1500), FIELD.groundY - 16, 26);
  drawPumpkin(ctx, 1150 - ((scrollX * 1 + 700) % 1500), FIELD.groundY - 13, 20);
}

function drawBarn(ctx, x, y) {
  if (x < -160 || x > FIELD.width + 40) return;
  ctx.fillStyle = PALETTE.barn;
  ctx.fillRect(x, y, 150, 110);
  ctx.fillStyle = PALETTE.barnRoof;
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 75, y - 52);
  ctx.lineTo(x + 162, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2e3c0';
  ctx.fillRect(x + 55, y + 52, 40, 58);
  ctx.strokeStyle = PALETTE.barnRoof;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 55, y + 52);
  ctx.lineTo(x + 95, y + 110);
  ctx.moveTo(x + 95, y + 52);
  ctx.lineTo(x + 55, y + 110);
  ctx.stroke();
  ctx.fillStyle = '#ffd97a';
  ctx.fillRect(x + 16, y + 22, 26, 22);
  ctx.fillRect(x + 108, y + 22, 26, 22);
}

function drawPumpkin(ctx, x, y, r) {
  if (x < -40 || x > FIELD.width + 40) return;
  ctx.fillStyle = '#d2691e';
  ellipse(ctx, x, y, r, r * 0.82);
  ctx.fillStyle = '#e8822e';
  ellipse(ctx, x, y, r * 0.55, r * 0.82);
  ctx.fillStyle = '#5d7a2e';
  ctx.fillRect(x - 3, y - r * 0.82 - 8, 6, 12);
}

/** The hero: a big brown turkey with a fanned tail, mid-stride. */
export function drawTurkey(ctx, turkey, time, opts = {}) {
  const { x, y } = turkey;
  const big = opts.scale ?? 1;
  const phase = turkey.runPhase ?? time * 16;
  const legSwing = Math.sin(phase) * (turkey.grounded ? 14 : 6);
  const ducking = turkey.ducking;
  const blink = turkey.invulnerable > 0 && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(x + 42 * big, y + 78 * big);
  ctx.scale(big, big);
  if (blink) ctx.globalAlpha = 0.65;
  // Fanned tail feathers.
  for (let i = 0; i < 5; i += 1) {
    const angle = (-60 + i * 30) * (Math.PI / 180);
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = PALETTE.tail[i];
    ctx.beginPath();
    ctx.ellipse(-26, -46, 13, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 220, 150, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-26, -66, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs, pumping.
  ctx.strokeStyle = '#e8a33c';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ellipse(ctx, 0, -34, 34, 30);
  ctx.fillStyle = PALETTE.turkeyBelly;
  ellipse(ctx, 6, -28, 22, 20);
  // Wing, flapping a little.
  ctx.fillStyle = '#5d3517';
  ctx.save();
  ctx.translate(-4, -36);
  ctx.rotate(ducking ? -0.5 : Math.sin(phase * 0.5) * 0.25 - 0.2);
  ctx.beginPath();
  ctx.ellipse(-8, 0, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Neck and head.
  ctx.strokeStyle = PALETTE.turkeyBody;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(22, -52);
  ctx.quadraticCurveTo(34, -72, 30, -84);
  ctx.stroke();
  ctx.fillStyle = PALETTE.turkeyHead;
  ctx.beginPath();
  ctx.arc(31, -86, 13, 0, Math.PI * 2);
  ctx.fill();
  // Beak and wattle.
  ctx.fillStyle = PALETTE.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(40, -88);
  ctx.lineTo(56, -83);
  ctx.lineTo(40, -79);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(38, -76, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye, always looking back at the farmer.
  ctx.fillStyle = '#1c1210';
  ctx.beginPath();
  ctx.arc(27, -89, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Golden shield ring.
  if (turkey.shield > 0) {
    ctx.strokeStyle = 'rgba(255, 217, 74, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + 42 * big, y + 36 * big, 58 * big + Math.sin(time * 6) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** The farmer: straw hat, blue shirt, apron, and a very determined run. */
export function drawFarmer(ctx, x, y, phase, close) {
  const legSwing = Math.sin(phase) * 16;
  const armSwing = Math.sin(phase) * 14;
  ctx.save();
  ctx.translate(x + 48, y + 132);
  // Legs.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -52);
  ctx.lineTo(-8 + legSwing, 0);
  ctx.moveTo(10, -52);
  ctx.lineTo(10 - legSwing, 0);
  ctx.stroke();
  // Apron and shirt.
  ctx.fillStyle = PALETTE.farmerShirt;
  rr(ctx, -30, -118, 62, 70, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerApron;
  rr(ctx, -22, -96, 46, 52, 8);
  ctx.fill();
  // Arms: one pumping, one reaching for the turkey.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-28, -108);
  ctx.lineTo(-44, -84 - armSwing);
  ctx.moveTo(28, -108);
  ctx.lineTo(52, -96 + armSwing * 0.5);
  ctx.stroke();
  ctx.fillStyle = PALETTE.farmerSkin;
  ellipse(ctx, -44, -84 - armSwing, 7, 7);
  ellipse(ctx, 52, -96 + armSwing * 0.5, 8, 8);
  // Head with a straw hat and an angry moustache.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(2, -132, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, 2, -146, 30, 7);
  ctx.fillRect(-14, -168, 32, 24);
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(-14, -148, 32, 5);
  ctx.fillStyle = '#1c1210';
  ctx.beginPath();
  ctx.arc(-4, -134, 2.5, 0, Math.PI * 2);
  ctx.arc(9, -134, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -122);
  ctx.lineTo(10, -122);
  ctx.stroke();
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(-6, -124, 17, 5);
  // "!" when he is about to catch the bird.
  if (close) {
    outlinedText(ctx, '!', 62, -158, 44, PALETTE.danger);
  }
  ctx.restore();
}

/** One obstacle, by kind. */
export function drawObstacle(ctx, ob, time) {
  if (ob.kind === KIND_OVEN) {
    const flicker = 0.75 + Math.sin(time * 11 + ob.phase) * 0.25;
    ctx.fillStyle = PALETTE.ovenGlow;
    ellipse(ctx, ob.x + ob.width / 2, ob.y + ob.height - 20, 90 * flicker, 60 * flicker);
    ctx.fillStyle = PALETTE.ovenBrick;
    rr(ctx, ob.x, ob.y, ob.width, ob.height, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ovenDark;
    ctx.lineWidth = 3;
    for (let row = 0; row < 3; row += 1) {
      ctx.beginPath();
      ctx.moveTo(ob.x + 6, ob.y + 30 + row * 28);
      ctx.lineTo(ob.x + ob.width - 6, ob.y + 30 + row * 28);
      ctx.stroke();
    }
    // Chimney.
    ctx.fillStyle = PALETTE.ovenDark;
    ctx.fillRect(ob.x + ob.width - 30, ob.y - 26, 22, 30);
    ctx.fillStyle = 'rgba(220, 220, 220, 0.5)';
    ellipse(ctx, ob.x + ob.width - 19, ob.y - 34 - ((time * 30 + ob.phase * 40) % 26), 8, 6);
    // Arched door with fire inside.
    ctx.fillStyle = '#2a1008';
    ctx.beginPath();
    ctx.moveTo(ob.x + 22, ob.y + ob.height - 8);
    ctx.lineTo(ob.x + 22, ob.y + 62);
    ctx.arc(ob.x + 48, ob.y + 62, 26, Math.PI, 0);
    ctx.lineTo(ob.x + 74, ob.y + ob.height - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.ovenFire;
    ctx.beginPath();
    ctx.moveTo(ob.x + 30, ob.y + ob.height - 10);
    ctx.quadraticCurveTo(ob.x + 40, ob.y + 66 + Math.sin(time * 13 + ob.phase) * 5, ob.x + 48, ob.y + 78);
    ctx.quadraticCurveTo(ob.x + 58, ob.y + 66, ob.x + 66, ob.y + ob.height - 10);
    ctx.closePath();
    ctx.fill();
    text(ctx, 'OVEN', ob.x + ob.width / 2, ob.y + 16, 15, '#ffd9a0');
  } else if (ob.kind === KIND_FENCE) {
    ctx.fillStyle = PALETTE.fence;
    ctx.fillRect(ob.x, ob.y + 6, 8, ob.height - 6);
    ctx.fillRect(ob.x + ob.width - 8, ob.y + 6, 8, ob.height - 6);
    ctx.fillRect(ob.x - 4, ob.y + 12, ob.width + 8, 9);
    ctx.fillRect(ob.x - 4, ob.y + 32, ob.width + 8, 9);
  } else if (ob.kind === KIND_BALE) {
    ctx.fillStyle = '#c98f3d';
    ellipse(ctx, ob.x + ob.width / 2, ob.y + ob.height / 2, ob.width / 2, ob.height / 2);
    ctx.strokeStyle = '#8a5a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(ob.x + ob.width / 2, ob.y + ob.height / 2, ob.width / 2 - 8, ob.height / 2 - 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ob.x + 10, ob.y + 12);
    ctx.lineTo(ob.x + ob.width - 10, ob.y + ob.height - 12);
    ctx.moveTo(ob.x + ob.width - 10, ob.y + 12);
    ctx.lineTo(ob.x + 10, ob.y + ob.height - 12);
    ctx.stroke();
  } else if (ob.kind === KIND_KNIFE) {
    ctx.save();
    ctx.translate(ob.x + ob.width / 2, ob.y + ob.height / 2);
    ctx.rotate(ob.spin ?? 0);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-46, -6);
    ctx.lineTo(18, -9);
    ctx.lineTo(46, 0);
    ctx.lineTo(18, 9);
    ctx.lineTo(-46, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeEdge;
    ctx.fillRect(-46, -7, 64, 2);
    ctx.fillStyle = PALETTE.knifeHandle;
    rr(ctx, -46, -8, 22, 16, 4);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 90, 60, 0.85)';
    text(ctx, '!', ob.x + ob.width / 2, ob.y - 16, 20, PALETTE.danger);
  } else if (ob.kind === KIND_DROP) {
    // Telegraph: a red shadow where it will land.
    if (ob.stuck <= 0) {
      ctx.fillStyle = 'rgba(255, 60, 40, 0.35)';
      ellipse(ctx, ob.x + ob.width / 2, FIELD.groundY + 4, 26, 6);
    }
    ctx.save();
    ctx.translate(ob.x + ob.width / 2, ob.y + ob.height / 2);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-8, -48);
    ctx.lineTo(8, -48);
    ctx.lineTo(8, 30);
    ctx.lineTo(0, 48);
    ctx.lineTo(-8, 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeHandle;
    rr(ctx, -11, -48, 22, 16, 4);
    ctx.fill();
    ctx.restore();
  }
}

/** One pickup, bobbing gently. */
export function drawPickup(ctx, p, time) {
  const bob = Math.sin(p.bob) * 5;
  const x = p.x;
  const y = p.y + bob;
  if (p.kind === KIND_CORN) {
    ctx.fillStyle = '#7a9a2e';
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 14);
    ctx.lineTo(x - 16, y + 26);
    ctx.lineTo(x - 2, y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.corn;
    rr(ctx, x - 9, y - 17, 18, 34, 9);
    ctx.fill();
    ctx.strokeStyle = '#c98f1e';
    ctx.lineWidth = 2;
    for (let row = -10; row < 12; row += 7) {
      ctx.beginPath();
      ctx.moveTo(x - 7, y + row);
      ctx.lineTo(x + 7, y + row);
      ctx.stroke();
    }
  } else if (p.kind === KIND_PIE) {
    ctx.fillStyle = '#8e4a1e';
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 12);
    ctx.lineTo(x + 20, y + 12);
    ctx.lineTo(x, y - 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.pie;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 8);
    ctx.lineTo(x + 16, y + 8);
    ctx.lineTo(x, y - 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2e3c0';
    ctx.beginPath();
    ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === KIND_FEATHER) {
    const glow = 0.6 + Math.sin(time * 6) * 0.3;
    ctx.fillStyle = `rgba(255, 217, 74, ${glow})`;
    ellipse(ctx, x, y, 26, 26);
    ctx.strokeStyle = PALETTE.featherGold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.quadraticCurveTo(x + 14, y - 6, x + 2, y - 20);
    ctx.stroke();
    ctx.fillStyle = '#fff3c0';
    ctx.beginPath();
    ctx.ellipse(x + 4, y - 4, 7, 14, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx, particles) {
  for (const pt of particles) {
    ctx.globalAlpha = Math.max(0, 1 - pt.age / pt.life);
    ctx.fillStyle = pt.colour;
    ellipse(ctx, pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;
}

function drawLeaves(ctx, leaves) {
  for (const leaf of leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(Math.sin(leaf.sway) * 0.6);
    ctx.fillStyle = leaf.colour;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** The in-play HUD: score, distance to freedom, lives, dash and speed. */
export function drawHUD(ctx, state, muted) {
  // Top bar.
  ctx.fillStyle = 'rgba(24, 12, 8, 0.66)';
  ctx.fillRect(0, 0, FIELD.width, 64);
  text(ctx, `SCORE ${Math.floor(state.score)}`, 24, 32, 26, PALETTE.text, 'left');
  // Distance progress: farm on the left, freedom on the right.
  const barX = 300;
  const barW = 560;
  const progress = Math.min(1, state.distanceM / 1500);
  ctx.fillStyle = 'rgba(255, 243, 221, 0.25)';
  rr(ctx, barX, 22, barW, 20, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.good;
  if (progress > 0) {
    rr(ctx, barX, 22, Math.max(20, barW * progress), 20, 10);
    ctx.fill();
  }
  text(ctx, '🏃', barX + barW * progress, 32, 22, PALETTE.text);
  text(ctx, `${Math.floor(state.distanceM)} m / 1500 m`, barX + barW / 2, 56, 15, PALETTE.muted);
  text(ctx, 'FREEDOM →', barX + barW + 12, 32, 16, PALETTE.good, 'left');
  // Lives as hearts.
  for (let i = 0; i < 3; i += 1) {
    const hx = 960 + i * 34;
    ctx.fillStyle = i < state.lives ? '#ff5a6e' : 'rgba(255, 243, 221, 0.25)';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♥', hx, 32);
  }
  // Dash meter.
  const dashReady = state.turkey.dashCooldown <= 0;
  ctx.fillStyle = 'rgba(255, 243, 221, 0.25)';
  rr(ctx, 1075, 24, 110, 14, 7);
  ctx.fill();
  ctx.fillStyle = dashReady ? '#7ddbff' : '#e8a33c';
  const dashFill = dashReady ? 1 : 1 - state.turkey.dashCooldown / 1.6;
  if (dashFill > 0) {
    rr(ctx, 1075, 24, Math.max(8, 110 * dashFill), 14, 7);
    ctx.fill();
  }
  text(ctx, dashReady ? 'DASH READY' : 'DASH…', 1130, 52, 13, PALETTE.muted);
  // Mute button.
  ctx.fillStyle = 'rgba(255, 243, 221, 0.18)';
  rr(ctx, 1212, 14, 54, 40, 9);
  ctx.fill();
  text(ctx, muted ? '🔇' : '🔊', 1239, 35, 20, PALETTE.text);
  // Farmer closing in?
  if (state.farmerGap < 70 && !state.over) {
    const flash = Math.floor(state.time * 6) % 2 === 0;
    if (flash) outlinedText(ctx, 'THE FARMER IS CLOSE!', FIELD.width / 2, 96, 30, PALETTE.danger);
  }
  if (state.turkey.shield > 0) {
    text(ctx, `🛡 SHIELD ${Math.ceil(state.turkey.shield)}s`, FIELD.width / 2, 128, 20, PALETTE.featherGold);
  }
}

/** Draw the whole scene for a screen: background, world, HUD and overlays. */
export function drawScene(ctx, state, screen, best, muted, scrollX) {
  drawBackground(ctx, state, scrollX);
  drawLeaves(ctx, state.leaves);
  if (screen !== SCREEN_TITLE) {
    for (const ob of state.obstacles) drawObstacle(ctx, ob, state.time);
    for (const p of state.pickups) drawPickup(ctx, p, state.time);
    // The farmer chases from behind the turkey.
    const farmerX = state.turkey.x - state.farmerGap - FARMER.width;
    drawFarmer(ctx, farmerX, FIELD.groundY - FARMER.height, state.farmerPhase, state.farmerGap < 70);
    drawTurkey(ctx, state.turkey, state.time);
  }
  drawParticles(ctx, state.particles);
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHUD(ctx, state, muted);
  if (screen === SCREEN_TITLE) drawTitle(ctx, best);
  if (screen === SCREEN_PAUSED) drawPaused(ctx);
  if (screen === SCREEN_OVER) drawCaught(ctx, state, best);
  if (screen === SCREEN_ESCAPED) drawEscaped(ctx, state, best);
}

function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(20, 8, 6, 0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  outlinedText(ctx, '🦃 TURKEY RUN 🦃', FIELD.width / 2, 120, 84, '#ffd97a');
  outlinedText(ctx, 'THANKSGIVING ESCAPE', FIELD.width / 2, 190, 34, PALETTE.text);
  text(ctx, 'The farmer wants you for dinner. Run 1500 m to freedom —', FIELD.width / 2, 240, 24, PALETTE.text);
  text(ctx, 'jump the ovens, duck the carving knives, grab the corn!', FIELD.width / 2, 272, 24, PALETTE.text);
  // Hero turkey, big and centre stage.
  drawTurkey(ctx, { x: 596, y: 330, runPhase: 1.2, grounded: true, ducking: false, invulnerable: 0, shield: 0 }, 1.2, { scale: 1.5 });
  panel(ctx, 330, 452, 620, 92);
  text(ctx, '← → / A D move      SPACE / ↑ / CLICK jump', FIELD.width / 2, 478, 20, PALETTE.text);
  text(ctx, '↓ / S duck (dive in mid-air)      SHIFT dash      P pause      M mute', FIELD.width / 2, 512, 20, PALETTE.text);
  // Start button.
  ctx.fillStyle = '#d2691e';
  rr(ctx, START_BUTTON.x, START_BUTTON.y, START_BUTTON.width, START_BUTTON.height, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd97a';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '▶  START RUN', FIELD.width / 2, START_BUTTON.y + 37, 30, '#fff3dd');
  text(ctx, 'or press ENTER', FIELD.width / 2, START_BUTTON.y + 100, 18, PALETTE.muted);
  if (best > 0) text(ctx, `BEST SCORE: ${best}`, FIELD.width / 2, 60, 22, PALETTE.featherGold);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 8, 6, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  outlinedText(ctx, 'PAUSED', FIELD.width / 2, 320, 64, PALETTE.text);
  text(ctx, 'Press P or click to keep running', FIELD.width / 2, 392, 24, PALETTE.muted);
}

function drawCaught(ctx, state, best) {
  ctx.fillStyle = 'rgba(30, 6, 4, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  outlinedText(ctx, 'CAUGHT!', FIELD.width / 2, 150, 88, PALETTE.danger);
  text(ctx, 'The farmer got you… Thanksgiving dinner is served. 🍗', FIELD.width / 2, 226, 26, PALETTE.text);
  text(ctx, `You ran ${Math.floor(state.distanceM)} m of 1500 m`, FIELD.width / 2, 268, 22, PALETTE.muted);
  drawFarmer(ctx, 560, 330, 0.4, false);
  // A very sorry turkey, upside down in the farmer's hands.
  ctx.save();
  ctx.translate(640, 420);
  ctx.rotate(Math.PI);
  drawTurkey(ctx, { x: -42, y: -78, runPhase: 0, grounded: true, ducking: false, invulnerable: 0, shield: 0 }, 0, { scale: 0.9 });
  ctx.restore();
  panel(ctx, 440, 470, 400, 84);
  text(ctx, `SCORE ${Math.floor(state.score)}`, FIELD.width / 2, 496, 30, PALETTE.text);
  text(ctx, `BEST ${Math.max(best, Math.floor(state.score))}`, FIELD.width / 2, 530, 20, PALETTE.featherGold);
  ctx.fillStyle = '#d2691e';
  rr(ctx, RESTART_BUTTON.x, RESTART_BUTTON.y, RESTART_BUTTON.width, RESTART_BUTTON.height, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd97a';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '↻  RUN AGAIN', FIELD.width / 2, RESTART_BUTTON.y + 37, 30, '#fff3dd');
  text(ctx, 'or press R / ENTER', FIELD.width / 2, RESTART_BUTTON.y + 100, 18, PALETTE.muted);
}

function drawEscaped(ctx, state, best) {
  ctx.fillStyle = 'rgba(20, 40, 12, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  outlinedText(ctx, 'ESCAPED! 🎉', FIELD.width / 2, 140, 84, PALETTE.good);
  text(ctx, '1500 m of farm behind you — the turkey lives to gobble another day!', FIELD.width / 2, 212, 26, PALETTE.text);
  text(ctx, 'No oven, no carving knife, no dinner table. Freedom tastes like corn.', FIELD.width / 2, 248, 22, PALETTE.muted);
  drawTurkey(ctx, { x: 596, y: 330, runPhase: 2.4, grounded: true, ducking: false, invulnerable: 0, shield: 0 }, 2.4, { scale: 1.5 });
  // Confetti leaves.
  for (let i = 0; i < 24; i += 1) {
    const lx = (i * 53 + 40) % FIELD.width;
    const ly = 300 + ((i * 97) % 260);
    ctx.fillStyle = ['#d2691e', '#e8a33c', '#ffd94a', '#7ddb6a'][i % 4];
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(i);
    ctx.fillRect(-6, -3, 12, 6);
    ctx.restore();
  }
  panel(ctx, 440, 470, 400, 84);
  text(ctx, `SCORE ${Math.floor(state.score)}`, FIELD.width / 2, 496, 30, PALETTE.text);
  text(ctx, `BEST ${Math.max(best, Math.floor(state.score))}`, FIELD.width / 2, 530, 20, PALETTE.featherGold);
  ctx.fillStyle = '#3f7a2e';
  rr(ctx, RESTART_BUTTON.x, RESTART_BUTTON.y, RESTART_BUTTON.width, RESTART_BUTTON.height, 16);
  ctx.fill();
  ctx.strokeStyle = '#ffd97a';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '↻  RUN AGAIN', FIELD.width / 2, RESTART_BUTTON.y + 37, 30, '#fff3dd');
  text(ctx, 'or press R / ENTER', FIELD.width / 2, RESTART_BUTTON.y + 100, 18, PALETTE.muted);
}
