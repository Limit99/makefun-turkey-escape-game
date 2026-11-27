// Synthesised sound effects through WebAudio: no audio files, nothing to
// download, and the game stays fully offline. The context is created on the
// first user gesture, so browsers never block it.
/** All of the game's sounds, created lazily on first use. */
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.master = null;
  }

  /** Create the audio context (call from a user gesture). */
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, seconds, type, slideTo, when = 0) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(1, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  noise(seconds, filterFreq, when = 0) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.9, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }

  jump() { this.tone(320, 0.16, 'square', 640); }
  dash() { this.noise(0.18, 2400); this.tone(180, 0.18, 'sawtooth', 520); }
  pickup() { this.tone(880, 0.09, 'sine', 1320); this.tone(1320, 0.12, 'sine', 1760, 0.07); }
  feather() { this.tone(660, 0.1, 'triangle', 990); this.tone(990, 0.1, 'triangle', 1320, 0.08); this.tone(1320, 0.16, 'triangle', 1980, 0.16); }
  hit() { this.noise(0.25, 500); this.tone(140, 0.3, 'sawtooth', 55); }
  knife() { this.noise(0.12, 5200); }
  gobble() {
    // Gobble-gobble: three quick falling chirps.
    for (let i = 0; i < 3; i += 1) {
      this.tone(420, 0.09, 'square', 190, i * 0.13);
      this.tone(300, 0.07, 'square', 150, i * 0.13 + 0.06);
    }
  }
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, 0.22, 'triangle', null, i * 0.14));
  }
  caught() {
    const notes = [392, 330, 262, 196];
    notes.forEach((freq, i) => this.tone(freq, 0.3, 'sawtooth', null, i * 0.2));
  }
}
