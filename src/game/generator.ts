import { TileType, WorldConfig } from './types';

// Simple Fast Deterministic Seeded PRNG (Mulberry32)
export function createRNG(seed: number) {
  let s = Math.floor(seed) >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 2D Perlin-like gradient noise generator using seeded permutation table
export class Noise2D {
  private perm: Uint8Array = new Uint8Array(512);

  constructor(seed: number) {
    const rng = createRNG(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(rng() * (i + 1));
      const tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public get(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const p = this.perm;
    const a = p[X] + Y;
    const aa = p[a];
    const ab = p[a + 1];
    const b = p[X + 1] + Y;
    const ba = p[b];
    const bb = p[b + 1];

    const g00 = this.grad(p[aa], xf, yf);
    const g10 = this.grad(p[ba], xf - 1, yf);
    const g01 = this.grad(p[ab], xf, yf - 1);
    const g11 = this.grad(p[bb], xf - 1, yf - 1);

    const x1 = this.lerp(u, g00, g10);
    const x2 = this.lerp(u, g01, g11);

    // Normalize roughly to [0, 1]
    return (this.lerp(v, x1, x2) + 1) * 0.5;
  }

  public fbm(x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.get(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

export type PresetType = 'continents' | 'islands' | 'four_kingdoms' | 'pangaea' | 'volcano';

export function generateWorldMap(config: WorldConfig, preset: PresetType = 'continents'): TileType[][] {
  const { width, height, seed } = config;
  const tiles: TileType[][] = Array.from({ length: height }, () => Array(width).fill('deep_water'));

  const heightNoise = new Noise2D(seed);
  const moistureNoise = new Noise2D(seed + 9999);
  const detailNoise = new Noise2D(seed + 54321);

  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Distance from center for continent borders / ocean masking
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      let h = 0;
      let mask = 1;

      const sizeFactor = Math.max(1, width / 100);

      if (preset === 'continents') {
        const nx = x / (35 * sizeFactor);
        const ny = y / (35 * sizeFactor);
        h = heightNoise.fbm(nx, ny, 5, 0.5, 2.0);
        // Soft vignette at edges to keep oceans surrounding continents
        mask = Math.max(0, 1 - Math.pow(distFromCenter, 2.5));
        h = h * mask;
      } else if (preset === 'islands') {
        const nx = x / (22 * sizeFactor);
        const ny = y / (22 * sizeFactor);
        h = heightNoise.fbm(nx, ny, 4, 0.45, 2.2);
        mask = Math.max(0, 1 - Math.pow(distFromCenter, 2.0));
        h = h * mask;
      } else if (preset === 'four_kingdoms') {
        // 4 land quadrant nodes
        const nx = x / (30 * sizeFactor);
        const ny = y / (30 * sizeFactor);
        h = heightNoise.fbm(nx, ny, 4, 0.5, 2.0);
        const cross = Math.min(Math.abs(dx), Math.abs(dy));
        if (cross < 0.12) {
          h -= 0.15; // Water channels separating quadrants
        }
        mask = Math.max(0, 1 - Math.pow(distFromCenter, 2.2));
        h = h * mask;
      } else if (preset === 'pangaea') {
        const nx = x / (42 * sizeFactor);
        const ny = y / (42 * sizeFactor);
        h = heightNoise.fbm(nx, ny, 5, 0.55, 2.0);
        mask = Math.max(0, 1.2 - Math.pow(distFromCenter, 1.8));
        h = h * mask;
      } else if (preset === 'volcano') {
        const nx = x / (25 * sizeFactor);
        const ny = y / (25 * sizeFactor);
        h = heightNoise.fbm(nx, ny, 4, 0.5, 2.0);
        // Caldera: center is a lava bowl
        if (distFromCenter < 0.18) {
          tiles[y][x] = 'lava';
          continue;
        } else if (distFromCenter < 0.35) {
          tiles[y][x] = 'mountain';
          continue;
        }
        mask = Math.max(0, 1 - Math.pow(distFromCenter, 2.0));
        h = h * mask;
      }

      // Moisture for biomes
      const m = moistureNoise.fbm(x / (30 * sizeFactor), y / (30 * sizeFactor), 3, 0.5, 2.0);
      const detail = detailNoise.get(x / 10, y / 10);

      // Height threshold classification
      if (h < 0.28) {
        tiles[y][x] = 'deep_water';
      } else if (h < 0.40) {
        tiles[y][x] = 'shallow_water';
      } else if (h < 0.46) {
        tiles[y][x] = 'sand';
      } else if (h < 0.72) {
        // Land: plains or forest based on moisture
        if (m > 0.48 && detail > 0.35) {
          tiles[y][x] = 'forest';
        } else {
          tiles[y][x] = 'plains';
        }
      } else if (h < 0.86) {
        tiles[y][x] = 'mountain';
      } else {
        tiles[y][x] = 'snow';
      }
    }
  }

  return tiles;
}
