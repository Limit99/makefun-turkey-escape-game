// A small seeded generator (mulberry32) so a screenshot scene with a given
// seed always plays out the same way, and every run feels different.
/** Make a generator from a 32-bit seed. */
export function makeRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [min, max] from the generator. */
export function intBetween(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** A float in [min, max) from the generator. */
export function floatBetween(random, min, max) {
  return min + random() * (max - min);
}

/** Pick one entry of an array from the generator. */
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}
