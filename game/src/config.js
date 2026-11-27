// Every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 618 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Metres of escape: reach this distance and the turkey is free. */
export const ESCAPE_DISTANCE = 1500;

export const TURKEY = {
  width: 84,
  height: 78,
  runX: 300,
  minX: 150,
  maxX: 560,
  moveSpeed: 420,
  jumpSpeed: 880,
  gravity: 1700,
  dashSpeed: 900,
  dashTime: 0.22,
  dashCooldown: 1.6,
  invulnerable: 2.2,
};

export const FARMER = {
  width: 96,
  height: 132,
  startGap: 150,
  catchGap: 26,
  lungeOnHit: 44,
  recoverPerSecond: 12,
};

export const LIVES = 3;

export const OBSTACLE = {
  ovenWidth: 96,
  ovenHeight: 118,
  fenceWidth: 70,
  fenceHeight: 58,
  baleWidth: 84,
  baleHeight: 64,
  knifeWidth: 92,
  knifeHeight: 30,
  knifeFlyY: 528,
  dropKnifeWidth: 34,
  dropKnifeHeight: 96,
};

export const PICKUP = {
  cornSize: 34,
  pieSize: 40,
  featherSize: 36,
  cornPoints: 10,
  piePoints: 25,
  featherPoints: 50,
  shieldSeconds: 5,
};

/** Spawn pacing: seconds between obstacle groups, shrinking as speed grows. */
export const SPAWN = {
  firstGap: 1.1,
  baseInterval: 1.8,
  minInterval: 1.0,
  intervalPerMetre: 0.00035,
  pickupInterval: 1.5,
};

/** How many moving things can exist at once; pools are allocated at boot. */
export const POOL_SIZE = 72;

export const PALETTE = {
  skyTop: '#2b1d4e',
  skyMid: '#b8452e',
  skyLow: '#f2a54a',
  sun: '#ffd97a',
  sunGlow: 'rgba(255, 201, 92, 0.35)',
  hillFar: '#7a3b2e',
  hillNear: '#5d2a22',
  barn: '#8e2f23',
  barnRoof: '#5e1f16',
  ground: '#6b4423',
  groundTop: '#a4713a',
  grass: '#c98f3d',
  fence: '#7c4a21',
  turkeyBody: '#7a4a21',
  turkeyBelly: '#a9713d',
  turkeyHead: '#e8d9c0',
  turkeyBeak: '#e8a33c',
  turkeyWattle: '#d93a2b',
  tail: ['#b8442a', '#d2691e', '#e8a33c', '#8e2f23', '#c96a2e'],
  farmerShirt: '#3f6fb5',
  farmerApron: '#e8e0cc',
  farmerHat: '#d9b23c',
  farmerSkin: '#e8b98a',
  ovenBrick: '#9a4a30',
  ovenDark: '#5e2a1c',
  ovenFire: '#ff9a2a',
  ovenGlow: 'rgba(255, 122, 26, 0.4)',
  knifeBlade: '#dfe6ee',
  knifeEdge: '#f7fafc',
  knifeHandle: '#4a2c14',
  corn: '#f2c94c',
  pie: '#c96a2e',
  featherGold: '#ffd94a',
  leaf: ['#d2691e', '#e8a33c', '#b8442a', '#c96a2e'],
  panel: 'rgba(24, 12, 8, 0.78)',
  panelEdge: '#e8a33c',
  text: '#fff3dd',
  muted: '#e8c9a0',
  danger: '#ff5a3c',
  good: '#7ddb6a',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const FONT_DISPLAY = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'turkey-run.best';
