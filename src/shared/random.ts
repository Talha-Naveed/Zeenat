export interface RandomSource {
  next(): number;
  between(min: number, max: number): number;
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1;
  const normalized = Math.trunc(seed) >>> 0;
  return normalized === 0 ? 1 : normalized;
}

export function createRandom(seed: number): RandomSource {
  let state = normalizeSeed(seed);

  return {
    next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4_294_967_296;
    },
    between(min, max) {
      return min + (max - min) * this.next();
    },
  };
}
