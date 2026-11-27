// Keyboard and mouse (and touch) input, kept apart from the simulation so
// the game can be driven by a real player or by the screenshot autopilot.
export const KEY_LEFT = ['ArrowLeft', 'a', 'A'];
export const KEY_RIGHT = ['ArrowRight', 'd', 'D'];
export const KEY_JUMP = [' ', 'ArrowUp', 'w', 'W'];
export const KEY_DUCK = ['ArrowDown', 's', 'S'];
export const KEY_DASH = ['Shift'];
export const KEY_START = ['Enter'];
export const KEY_RESTART = ['r', 'R', 'Enter'];
export const KEY_PAUSE = ['p', 'P', 'Escape'];
export const KEY_MUTE = ['m', 'M'];

/** Live input state: what the world reads each step. */
export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.duck = false;
    this.dash = false;
    this.jumpQueued = false;
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false };
    this.onKey = null;
    this.onClick = null;
  }

  attach(element) {
    window.addEventListener('keydown', (event) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
      if (!event.repeat) {
        this.pressed.add(event.key);
        if (KEY_JUMP.includes(event.key)) this.jumpQueued = true;
        if (this.onKey) this.onKey(event.key);
      }
      this.refresh();
    });
    window.addEventListener('keyup', (event) => {
      this.pressed.delete(event.key);
      this.refresh();
    });
    element.addEventListener('pointerdown', (event) => {
      const rect = element.getBoundingClientRect();
      const scaleX = 1280 / rect.width;
      const scaleY = 720 / rect.height;
      this.mouse.x = (event.clientX - rect.left) * scaleX;
      this.mouse.y = (event.clientY - rect.top) * scaleY;
      this.mouse.clicked = true;
      this.jumpQueued = true;
      if (this.onClick) this.onClick(this.mouse.x, this.mouse.y);
    });
    window.addEventListener('blur', () => {
      this.pressed.clear();
      this.left = false;
      this.right = false;
      this.duck = false;
      this.dash = false;
      this.jumpQueued = false;
    });
  }

  refresh() {
    const has = (keys) => keys.some((key) => this.pressed.has(key));
    this.left = has(KEY_LEFT);
    this.right = has(KEY_RIGHT);
    this.duck = has(KEY_DUCK);
    this.dash = has(KEY_DASH);
  }

  /** The per-step input the world consumes; jump is edge-triggered. */
  read() {
    const input = {
      left: this.left,
      right: this.right,
      jump: this.jumpQueued,
      duck: this.duck,
      dash: this.dash,
    };
    this.jumpQueued = false;
    return input;
  }

  consumeClick() {
    const clicked = this.mouse.clicked;
    this.mouse.clicked = false;
    return clicked;
  }

  /** True when any of `keys` was pressed since the last check. */
  wasPressed(keys) {
    for (const key of keys) {
      if (this.pressed.has(key)) {
        this.pressed.delete(key);
        return true;
      }
    }
    return false;
  }

  clearPressed() {
    this.pressed.clear();
  }
}
