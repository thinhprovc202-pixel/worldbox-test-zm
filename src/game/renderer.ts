import { Boat, Building, BuildingType, Entity, TileType, Village, Kingdom } from './types';
import { WorldSimulation } from './simulation';

export interface Camera {
  x: number; // Center world X
  y: number; // Center world Y
  zoom: number; // Tile pixel size (e.g. 16px to 64px)
}

const TILE_COLORS: Record<TileType, string> = {
  deep_water: '#1e3a8a',
  shallow_water: '#0284c7',
  sand: '#fde047',
  plains: '#22c55e',
  forest: '#15803d',
  mountain: '#64748b',
  snow: '#f8fafc',
  lava: '#ea580c',
};

const TILE_HIGHLIGHTS: Record<TileType, string> = {
  deep_water: '#172554',
  shallow_water: '#38bdf8',
  sand: '#fef08a',
  plains: '#4ade80',
  forest: '#166534',
  mountain: '#94a3b8',
  snow: '#ffffff',
  lava: '#f97316',
};

function adjustHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return hex;
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export class WorldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrame: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  public render(
    sim: WorldSimulation,
    camera: Camera,
    hoveredTile: { x: number; y: number } | null,
    brushRadius: number,
    selectedEntityId: string | null,
    selectedVillageId: string | null
  ) {
    this.animFrame++;
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const tileSize = camera.zoom;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);

    // Compute visible bounds in world coordinates
    const startTileX = Math.max(0, Math.floor(camera.x - cw / (2 * tileSize) - 1));
    const endTileX = Math.min(sim.width - 1, Math.ceil(camera.x + cw / (2 * tileSize) + 1));
    const startTileY = Math.max(0, Math.floor(camera.y - ch / (2 * tileSize) - 1));
    const endTileY = Math.min(sim.height - 1, Math.ceil(camera.y + ch / (2 * tileSize) + 1));

    const worldToScreenX = (wx: number) => Math.floor(cw / 2 + (wx - camera.x) * tileSize);
    const worldToScreenY = (wy: number) => Math.floor(ch / 2 + (wy - camera.y) * tileSize);

    // 1. Render Terrain Tiles
    const time = this.animFrame * 0.05;

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tile = sim.tiles[ty][tx];
        const sx = worldToScreenX(tx);
        const sy = worldToScreenY(ty);

        ctx.fillStyle = TILE_COLORS[tile];
        ctx.fillRect(sx, sy, tileSize, tileSize);

        // Pixel detail decorations
        if (tile === 'deep_water' || tile === 'shallow_water') {
          // Water ripples
          const wave = Math.sin(time + tx * 0.7 + ty * 0.5);
          if (wave > 0.6) {
            ctx.fillStyle = TILE_HIGHLIGHTS[tile];
            ctx.fillRect(sx + tileSize * 0.2, sy + tileSize * 0.4, tileSize * 0.6, Math.max(1, tileSize * 0.1));
          }
        } else if (tile === 'forest') {
          // Tree foliage top
          ctx.fillStyle = '#14532d';
          ctx.fillRect(sx + tileSize * 0.2, sy + tileSize * 0.15, tileSize * 0.6, tileSize * 0.65);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(sx + tileSize * 0.3, sy + tileSize * 0.25, tileSize * 0.4, tileSize * 0.35);
          // Trunk
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + tileSize * 0.45, sy + tileSize * 0.75, tileSize * 0.12, tileSize * 0.22);
        } else if (tile === 'mountain') {
          // Craggy peak
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(sx + tileSize * 0.5, sy + tileSize * 0.15);
          ctx.lineTo(sx + tileSize * 0.85, sy + tileSize * 0.85);
          ctx.lineTo(sx + tileSize * 0.15, sy + tileSize * 0.85);
          ctx.fill();
        } else if (tile === 'lava') {
          // Glowing magma bubbles
          const pulse = (Math.sin(time * 2 + tx + ty) + 1) * 0.5;
          ctx.fillStyle = pulse > 0.5 ? '#facc15' : '#ea580c';
          ctx.fillRect(sx + tileSize * 0.3, sy + tileSize * 0.3, tileSize * 0.4, tileSize * 0.4);
        } else if (tile === 'plains') {
          // Subtle grass specks
          if ((tx + ty * 7) % 5 === 0) {
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(sx + tileSize * 0.3, sy + tileSize * 0.4, Math.max(1, tileSize * 0.15), Math.max(1, tileSize * 0.25));
          }
        }
      }
    }

    // 2. Render Territory Borders & Zones
    for (const village of sim.villages) {
      const kingdom = sim.getKingdom(village.kingdomId);
      const color = kingdom ? kingdom.bannerColor : '#ffffff';

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, tileSize * 0.08);

      for (const t of village.territory) {
        if (t.x < startTileX - 1 || t.x > endTileX + 1 || t.y < startTileY - 1 || t.y > endTileY + 1) continue;

        const sx = worldToScreenX(t.x);
        const sy = worldToScreenY(t.y);

        // Fill subtle translucent tint
        ctx.fillStyle = `${color}22`; // ~13% opacity
        ctx.fillRect(sx, sy, tileSize, tileSize);

        // Draw border edge if neighbor is not in this village
        const isTop = !village.territory.some(n => n.x === t.x && n.y === t.y - 1);
        const isBottom = !village.territory.some(n => n.x === t.x && n.y === t.y + 1);
        const isLeft = !village.territory.some(n => n.x === t.x - 1 && n.y === t.y);
        const isRight = !village.territory.some(n => n.x === t.x + 1 && n.y === t.y);

        ctx.beginPath();
        if (isTop) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + tileSize, sy);
        }
        if (isBottom) {
          ctx.moveTo(sx, sy + tileSize);
          ctx.lineTo(sx + tileSize, sy + tileSize);
        }
        if (isLeft) {
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, sy + tileSize);
        }
        if (isRight) {
          ctx.moveTo(sx + tileSize, sy);
          ctx.lineTo(sx + tileSize, sy + tileSize);
        }
        ctx.stroke();
      }
    }

    // 2b. Render Farmland (wheat fields surrounding windmills & village centers)
    for (const village of sim.villages) {
      if (!village.farmland) continue;
      for (const f of village.farmland) {
        if (f.x < startTileX - 1 || f.x > endTileX + 1 || f.y < startTileY - 1 || f.y > endTileY + 1) continue;
        const fx = worldToScreenX(f.x);
        const fy = worldToScreenY(f.y);
        this.renderFarmlandTile(fx, fy, tileSize, time, f.x, f.y);
      }
    }

    // 3. Render Buildings (sorted by Y for correct 2.5D elevation & depth)
    const visibleBuildings: { b: Building; bx: number; by: number; bannerColor: string }[] = [];
    for (const village of sim.villages) {
      const kingdom = sim.getKingdom(village.kingdomId);
      const bannerColor = kingdom?.bannerColor || '#e2e8f0';

      for (const b of village.buildings) {
        if (b.x < startTileX - 2 || b.x > endTileX + 2 || b.y < startTileY - 2 || b.y > endTileY + 2) continue;
        const bx = worldToScreenX(b.x);
        const by = worldToScreenY(b.y);
        visibleBuildings.push({ b, bx, by, bannerColor });
      }
    }
    visibleBuildings.sort((a, b) => a.b.y - b.b.y || a.b.x - b.b.x);
    for (const item of visibleBuildings) {
      this.renderBuilding(item.b, item.bx, item.by, tileSize, item.bannerColor, time);
    }

    // 3b. Render European Carrack Ships navigating the waters
    for (const boat of sim.boats) {
      if (boat.x < startTileX - 3 || boat.x > endTileX + 3 || boat.y < startTileY - 3 || boat.y > endTileY + 3) continue;
      const bx = worldToScreenX(boat.x);
      const by = worldToScreenY(boat.y);
      const kingdom = sim.getKingdom(boat.kingdomId);
      this.renderBoat(boat, bx, by, tileSize, kingdom?.bannerColor || '#38bdf8', time);
    }

    // 4. Render Entities
    for (const e of sim.entities) {
      if (!e.alive || e.onBoat) continue; // Entities aboard boats are rendered on the boat deck
      if (e.x < startTileX - 1 || e.x > endTileX + 1 || e.y < startTileY - 1 || e.y > endTileY + 1) continue;

      const ex = worldToScreenX(e.x);
      const ey = worldToScreenY(e.y);
      const isSelected = e.id === selectedEntityId;
      this.renderEntity(e, ex, ey, tileSize, isSelected, sim);
    }

    // 5. Render Particles
    for (const p of sim.particles) {
      const px = worldToScreenX(p.x);
      const py = worldToScreenY(p.y);
      const alpha = 1 - p.life / p.maxLife;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 6. Render Hover Brush Cursor
    if (hoveredTile) {
      const hx = worldToScreenX(hoveredTile.x);
      const hy = worldToScreenY(hoveredTile.y);
      const brushPx = brushRadius * tileSize;

      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(hx + tileSize / 2, hy + tileSize / 2, brushPx + tileSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderBoat(boat: Boat, x: number, y: number, tileSize: number, bannerColor: string, time: number) {
    const ctx = this.ctx;

    // Authentic European Carrack (Nao / Đại chiến thuyền châu Âu thế kỷ 15-16)
    // 28 columns x 19 rows pixel-art table
    const CARRACK_PIXELS: string[] = [
      /* 0 */ "............FFFFF...........",
      /* 1 */ "....FF.......M.FFF.......FF.",
      /* 2 */ "....M........M...........M..",
      /* 3 */ "....M.......NNN.........NNN.",
      /* 4 */ "....M......MMMMMMM.....MMMMM",
      /* 5 */ "...Ss.......SSsSS.......SSSS.",
      /* 6 */ "..Sss.......SsXSs.......SsXS.",
      /* 7 */ "..Sss......SXXXXXs.....SXXXX",
      /* 8 */ ".Ssss.......SsXSs.......SsXS.",
      /* 9 */ ".Sss........SSsSS.......SSsS",
      /* 10*/ "MMMMM......MMMMMMMMM...MMMMM",
      /* 11*/ "Awwww.......R..M..R....wwwww",
      /* 12*/ "WLLLW.......R..M..R....WLLW.",
      /* 13*/ "WGLGWwwwwwwwww.M..wwwwwwWLW.",
      /* 14*/ "WWWWWWWWWWWWWWWWWWWWWWWWWWWO",
      /* 15*/ "wHwGHwGHwGHwGHwGHwGHwGHwHw..",
      /* 16*/ ".HHHHHHHHHHHHHHHHHHHHHHHH...",
      /* 17*/ "..KKKKKKKKKKKKKKKKKKKKKK....",
      /* 18*/ ".BB.BB..BBBB.BBBB..BB.BB....",
    ];

    const CARRACK_PALETTE: Record<string, string> = {
      H: '#3b1808', // Dark oak hull planking
      h: '#240f05', // Deep hull shadow
      W: '#78350f', // Warm seasoned oak timber
      w: '#b45309', // Weathered timber wales & railings
      L: '#92400e', // Castle cabin siding
      K: '#171717', // Keel pitch waterproofing
      G: '#0c0a09', // Gunports & captain cabin windows
      A: '#facc15', // Golden stern lantern
      M: '#451a03', // Solid pine/oak masts and yardarms
      N: '#854d0e', // Crow's nest lookout platform
      S: '#f8fafc', // Canvas sails (sunlit)
      s: '#cbd5e1', // Canvas sails (shading)
      X: '#dc2626', // Royal Heraldic Cross (Cruz de Cristo / Burgundy)
      R: '#94a3b8', // Shrouds & standing rigging
      O: '#78350f', // Bowsprit spar timber
      B: '#e0f2fe', // Sea spray and bow wave foam
    };

    // Substantial size: European Carracks are grand flagships spanning nearly 3 tiles
    const boatScale = 2.8;
    const boatW = tileSize * boatScale;
    const pixelSize = boatW / 28;
    const boatH = pixelSize * 19;

    const centerX = x + tileSize * 0.5;
    const centerY = y + tileSize * 0.5;

    // Ocean swell bobbing & rocking motion
    const wavePhase = time * 2.8 + boat.x * 2.2 + boat.y * 1.5;
    const bobY = Math.sin(wavePhase) * (pixelSize * 1.2);
    const rockAngle = Math.sin(wavePhase * 0.7) * 0.05;

    ctx.save();
    ctx.translate(centerX, centerY + bobY);
    ctx.rotate(rockAngle);

    if (boat.facing === 'left') {
      ctx.scale(-1, 1);
    }

    const startX = -boatW * 0.5;
    // Ground keel at water baseline
    const startY = -boatH * 0.82;

    // Water ripple reflection shadow under hull
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, pixelSize * 2, boatW * 0.42, pixelSize * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render the European Carrack Pixel Table
    for (let r = 0; r < CARRACK_PIXELS.length; r++) {
      const row = CARRACK_PIXELS[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (char === '.') continue;

        let color = CARRACK_PALETTE[char];
        if (char === 'F') {
          color = bannerColor;
        } else if (char === 'B') {
          // Dynamic glittering sea foam
          color = (c + Math.floor(time * 4)) % 3 === 0 ? '#ffffff' : '#bae6fd';
        }

        if (color) {
          ctx.fillStyle = color;
          // Add 0.35 subpixel overlap to prevent canvas rounding seams
          ctx.fillRect(
            startX + c * pixelSize,
            startY + r * pixelSize,
            pixelSize + 0.35,
            pixelSize + 0.35
          );
        }
      }
    }

    // Warm glow from golden stern lantern
    ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.beginPath();
    ctx.arc(startX + pixelSize * 0.5, startY + pixelSize * 11.5, pixelSize * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Render crew / expedition members aboard on deck
    const crewCount = Math.min(boat.passengerIds.length, 4);
    const crewSlots = [
      { c: 2, r: 10 },  // High Aftcastle quarterdeck
      { c: 10, r: 12 }, // Waist gun deck
      { c: 15, r: 12 }, // Waist gun deck
      { c: 22, r: 10 }, // Forecastle lookout
    ];
    for (let i = 0; i < crewCount; i++) {
      const slot = crewSlots[i];
      // Head
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(startX + slot.c * pixelSize, startY + slot.r * pixelSize, pixelSize, pixelSize);
      // Tunic in kingdom colors
      ctx.fillStyle = bannerColor;
      ctx.fillRect(startX + slot.c * pixelSize, startY + (slot.r + 1) * pixelSize, pixelSize, pixelSize);
    }

    // Health bar if the Carrack has taken hull damage
    if (boat.health < boat.maxHealth) {
      const barW = boatW * 0.65;
      const barH = Math.max(3, pixelSize * 1.4);
      const hpRatio = Math.max(0, boat.health / boat.maxHealth);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(-barW / 2, startY - pixelSize * 3, barW, barH);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-barW / 2, startY - pixelSize * 3, barW * hpRatio, barH);
    }

    ctx.restore();
  }

  private renderFarmlandTile(x: number, y: number, size: number, time: number, seedX: number, seedY: number) {
    const ctx = this.ctx;

    // 1. Rich tilled loamy soil base
    ctx.fillStyle = '#6b360f';
    ctx.fillRect(x, y, size, size);

    // Dark soil furrow trenches
    ctx.fillStyle = '#451a03';
    const furrowH = Math.max(1, size * 0.08);
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x, y + size * (0.2 + i * 0.28), size, furrowH);
    }

    // 2. Clustered ripe golden wheat stalks
    const sway = Math.sin(time * 2.5 + seedX * 0.9 + seedY * 0.7) * (size * 0.06);
    const stalkOffsets = [0.12, 0.28, 0.46, 0.65, 0.84];
    const stalkHeights = [0.65, 0.78, 0.72, 0.82, 0.68];

    for (let i = 0; i < stalkOffsets.length; i++) {
      const sx = x + size * stalkOffsets[i];
      const h = size * stalkHeights[i];
      const baseY = y + size * 0.92;
      const topX = sx + sway;
      const topY = baseY - h;

      // Wheat stalk stem
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = Math.max(1, size * 0.05);
      ctx.beginPath();
      ctx.moveTo(sx, baseY);
      ctx.quadraticCurveTo(sx + sway * 0.4, baseY - h * 0.5, topX, topY);
      ctx.stroke();

      // Ripe golden grain head
      const earW = Math.max(2, size * 0.09);
      const earH = Math.max(3, size * 0.22);
      ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#fde047';
      ctx.fillRect(topX - earW / 2, topY, earW, earH);

      // Bright wheat highlight
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(topX - earW / 4, topY + earH * 0.2, earW * 0.5, earH * 0.4);
    }

    // Occasional tiny wild poppy or cornflower
    if ((seedX * 17 + seedY * 31) % 7 === 0) {
      ctx.fillStyle = (seedX + seedY) % 2 === 0 ? '#ef4444' : '#38bdf8';
      ctx.fillRect(x + size * 0.35, y + size * 0.82, Math.max(2, size * 0.08), Math.max(2, size * 0.08));
    }
  }

  private getBuildingScale(type: BuildingType): number {
    switch (type) {
      case 'town_hall':
        return 1.85; // Grand castle / palace
      case 'windmill':
        return 1.75; // Tall windmill with large spinning sails
      case 'watchtower':
        return 1.7;  // Tall fortress lookout
      case 'mine':
        return 1.6;  // Deep quarry scaffold & excavation
      case 'granary':
        return 1.55; // Large raised storehouse
      case 'house':
        return 1.55; // Multi-room WorldBox residential home
      case 'park':
        return 1.5;  // Ornamental garden square
      case 'farm':
        return 1.45; // Farmstead
      case 'docks':
        return 1.45; // Broad waterfront boardwalk
      default:
        return 1.55;
    }
  }

  private renderBuilding(
    b: Building,
    x: number,
    y: number,
    size: number,
    bannerColor: string,
    time: number
  ) {
    const scale = this.getBuildingScale(b.type);
    const bldgSize = size * scale;
    // Ground-anchored positioning: aligns bottom edge of building with bottom edge of tile, centered horizontally
    const bldgX = x - (bldgSize - size) / 2;
    const bldgY = y - (bldgSize - size);

    switch (b.type) {
      case 'house':
        this.renderHouse(b, bldgX, bldgY, bldgSize, bannerColor);
        break;
      case 'windmill':
        this.renderWindmill(b, bldgX, bldgY, bldgSize, bannerColor, time);
        break;
      case 'farm':
        this.renderFarm(b, bldgX, bldgY, bldgSize, bannerColor, time);
        break;
      case 'town_hall':
        this.renderTownHall(b, bldgX, bldgY, bldgSize, bannerColor, time);
        break;
      case 'watchtower':
        this.renderWatchtower(b, bldgX, bldgY, bldgSize, bannerColor, time);
        break;
      case 'mine':
        this.renderMine(b, bldgX, bldgY, bldgSize, time);
        break;
      case 'docks':
        this.renderDocks(b, bldgX, bldgY, bldgSize, bannerColor, time);
        break;
      case 'granary':
        this.renderGranary(b, bldgX, bldgY, bldgSize, bannerColor);
        break;
      case 'park':
        this.renderPark(b, bldgX, bldgY, bldgSize, time);
        break;
      default:
        this.renderHouse(b, bldgX, bldgY, bldgSize, bannerColor);
    }

    // Health bar if building took damage
    if (b.health < b.maxHealth) {
      const ctx = this.ctx;
      const barW = Math.max(16, bldgSize * 0.85);
      const barH = Math.max(3, bldgSize * 0.08);
      const hpRatio = Math.max(0, b.health / b.maxHealth);
      const barX = bldgX + (bldgSize - barW) / 2;
      const barY = bldgY - bldgSize * 0.12;

      ctx.fillStyle = '#450a0a';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }
  }

  // 1. WorldBox Authentic Cottage / House (Multi-gable, banner-tinted roof, timber eaves, stone base & moss)
  private renderHouse(b: Building, x: number, y: number, size: number, bannerColor: string) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    // Color shades for roof depth
    const roofBase = bannerColor;
    const roofHi = adjustHex(bannerColor, 35);
    const roofLo = adjustHex(bannerColor, -35);

    // --- Silhouette shadow / dark outline ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px(0.5), py(0.92), pw(0.48), ph(0.12), 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Right Wing Wall & Secondary Gable Roof ---
    // Right wall masonry
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(px(0.56), py(0.38), pw(0.36), ph(0.54));
    // Right wall foundation
    ctx.fillStyle = '#78716c';
    ctx.fillRect(px(0.56), py(0.84), pw(0.36), ph(0.08));
    // Right horizontal timber stud
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px(0.56), py(0.6), pw(0.36), ph(0.05));

    // Right upper dormer window
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px(0.66), py(0.44), pw(0.12), ph(0.12));
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px(0.64), py(0.42), pw(0.16), ph(0.03)); // Lintel

    // Right wing peaked roof
    ctx.fillStyle = roofLo;
    ctx.beginPath();
    ctx.moveTo(px(0.74), py(-0.2));
    ctx.lineTo(px(0.96), py(0.24));
    ctx.lineTo(px(0.54), py(0.24));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = roofBase;
    ctx.beginPath();
    ctx.moveTo(px(0.74), py(-0.2));
    ctx.lineTo(px(0.92), py(0.22));
    ctx.lineTo(px(0.58), py(0.22));
    ctx.closePath();
    ctx.fill();

    // Right timber bargeboard eave
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = Math.max(1.5, pw(0.05));
    ctx.beginPath();
    ctx.moveTo(px(0.54), py(0.24));
    ctx.lineTo(px(0.74), py(-0.2));
    ctx.lineTo(px(0.96), py(0.24));
    ctx.stroke();

    // --- Left Main Structure ---
    // Main Left Wall Masonry
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(px(0.08), py(0.32), pw(0.48), ph(0.58));
    // Wall shading / texture
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(px(0.08), py(0.32), pw(0.12), ph(0.58));
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(px(0.08), py(0.82), pw(0.48), ph(0.08)); // stone base

    // Left Main Roof Gable (Tall, banner-colored)
    ctx.fillStyle = roofLo;
    ctx.beginPath();
    ctx.moveTo(px(0.3), py(-0.32));
    ctx.lineTo(px(0.58), py(0.26));
    ctx.lineTo(px(0.04), py(0.26));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = roofBase;
    ctx.beginPath();
    ctx.moveTo(px(0.3), py(-0.32));
    ctx.lineTo(px(0.54), py(0.24));
    ctx.lineTo(px(0.08), py(0.24));
    ctx.closePath();
    ctx.fill();

    // Roof vertical tile planks & highlight stripe
    ctx.fillStyle = roofHi;
    ctx.fillRect(px(0.27), py(-0.28), pw(0.06), ph(0.45));
    ctx.fillStyle = roofLo;
    ctx.fillRect(px(0.18), py(-0.1), pw(0.03), ph(0.3));
    ctx.fillRect(px(0.38), py(-0.1), pw(0.03), ph(0.3));

    // Wooden bargeboard trim on main gable
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(1.5, pw(0.06));
    ctx.beginPath();
    ctx.moveTo(px(0.04), py(0.26));
    ctx.lineTo(px(0.3), py(-0.32));
    ctx.lineTo(px(0.58), py(0.26));
    ctx.stroke();

    // --- Lower Porch Gable over Front Door ---
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(px(0.3), py(0.3));
    ctx.lineTo(px(0.46), py(0.54));
    ctx.lineTo(px(0.14), py(0.54));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(px(0.3), py(0.32));
    ctx.lineTo(px(0.43), py(0.52));
    ctx.lineTo(px(0.17), py(0.52));
    ctx.closePath();
    ctx.fill();

    // Dark doorway alcove
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px(0.24), py(0.56), pw(0.13), ph(0.28));
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px(0.26), py(0.58), pw(0.09), ph(0.26));

    // Ivy / climbing moss on walls (emerald green accents from reference)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(px(0.08), py(0.48), pw(0.06), ph(0.36));
    ctx.fillRect(px(0.39), py(0.44), pw(0.06), ph(0.3));
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(px(0.1), py(0.52), pw(0.04), ph(0.2));
    ctx.fillRect(px(0.41), py(0.48), pw(0.04), ph(0.16));

    // Lower front planter bed / green hedge
    ctx.fillStyle = '#78716c';
    ctx.fillRect(px(0.08), py(0.82), pw(0.42), ph(0.09));
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(px(0.1), py(0.79), pw(0.38), ph(0.06));

    // Round decorative stone/shrub on lower right
    ctx.fillStyle = '#4d7c0f';
    ctx.beginPath();
    ctx.arc(px(0.74), py(0.82), pw(0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.arc(px(0.72), py(0.8), pw(0.06), 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. WorldBox Authentic Windmill (Conical shingle roof, stone base, rotating 4-blade cross sails with canvas)
  private renderWindmill(b: Building, x: number, y: number, size: number, bannerColor: string, time: number) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    const roofBase = bannerColor;
    const roofHi = adjustHex(bannerColor, 35);
    const roofLo = adjustHex(bannerColor, -35);

    // Ground shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px(0.5), py(0.92), pw(0.42), ph(0.1), 0, 0, Math.PI * 2);
    ctx.fill();

    // Round Stone Tower Base
    ctx.fillStyle = '#78716c';
    ctx.fillRect(px(0.24), py(0.28), pw(0.52), ph(0.66));
    // Stone highlights & shadow bands
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(px(0.24), py(0.28), pw(0.14), ph(0.66));
    ctx.fillStyle = '#57534e';
    ctx.fillRect(px(0.64), py(0.28), pw(0.12), ph(0.66));

    // Masonry stone blocks
    ctx.fillStyle = '#44403c';
    ctx.fillRect(px(0.34), py(0.44), pw(0.14), ph(0.04));
    ctx.fillRect(px(0.52), py(0.56), pw(0.14), ph(0.04));

    // Dark arched entrance door
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px(0.42), py(0.66), pw(0.16), ph(0.28));
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px(0.44), py(0.68), pw(0.12), ph(0.26));

    // Small upper mill observation window
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px(0.45), py(0.38), pw(0.1), ph(0.1));
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px(0.47), py(0.4), pw(0.06), ph(0.06));

    // Conical Roof (tapered top)
    ctx.fillStyle = roofLo;
    ctx.beginPath();
    ctx.moveTo(px(0.5), py(-0.2));
    ctx.lineTo(px(0.82), py(0.3));
    ctx.lineTo(px(0.18), py(0.3));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = roofBase;
    ctx.beginPath();
    ctx.moveTo(px(0.5), py(-0.2));
    ctx.lineTo(px(0.78), py(0.28));
    ctx.lineTo(px(0.22), py(0.28));
    ctx.closePath();
    ctx.fill();

    // Roof highlight rib
    ctx.fillStyle = roofHi;
    ctx.fillRect(px(0.47), py(-0.12), pw(0.06), ph(0.38));

    // Eaves trim collar
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(px(0.18), py(0.28), pw(0.64), ph(0.05));

    // --- ROTATING 4-BLADE CROSS SAILS ---
    const hubX = px(0.5);
    const hubY = py(0.28);
    // Smooth time rotation
    const rot = (time * 0.9) % (Math.PI * 2);
    const bladeLen = pw(0.58);
    const bladeW = pw(0.16);

    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.rotate(rot);

    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 2);

      // Wooden spar arm beam
      ctx.fillStyle = '#292524';
      ctx.fillRect(-Math.max(1, pw(0.025)), 0, Math.max(2, pw(0.05)), bladeLen);

      // Canvas sail cloth stretched along one side of the spar
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, pw(0.08), bladeW, bladeLen - pw(0.12));

      // Sail shading & lattice ribs
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(bladeW * 0.75, pw(0.08), bladeW * 0.25, bladeLen - pw(0.12));

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = Math.max(0.8, pw(0.02));
      for (let s = 1; s <= 3; s++) {
        const sy = pw(0.08) + (bladeLen - pw(0.12)) * (s / 4);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(bladeW, sy);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Central axle hub pin
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, 0, pw(0.07), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(0, 0, pw(0.035), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. WorldBox Farmstead (Barn, wheat rows, hay bale, split-rail fence)
  private renderFarm(b: Building, x: number, y: number, size: number, bannerColor: string, time: number) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    // Tilled soil base
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px(0.05), py(0.2), pw(0.9), ph(0.75));
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px(0.05), py(0.38), pw(0.9), ph(0.06));
    ctx.fillRect(px(0.05), py(0.6), pw(0.9), ph(0.06));

    // Golden hay bale on the right
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px(0.65), py(0.55), pw(0.26), ph(0.24));
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px(0.65), py(0.55), pw(0.22), ph(0.2));
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px(0.72), py(0.55), pw(0.03), ph(0.24));
    ctx.fillRect(px(0.8), py(0.55), pw(0.03), ph(0.24));

    // Farmer's shed / barn on the left
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px(0.12), py(0.35), pw(0.44), ph(0.5));
    // Doorway
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(px(0.24), py(0.55), pw(0.14), ph(0.3));

    // Banner-colored shed roof
    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.moveTo(px(0.34), py(0.1));
    ctx.lineTo(px(0.6), py(0.38));
    ctx.lineTo(px(0.08), py(0.38));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(1.5, pw(0.05));
    ctx.beginPath();
    ctx.moveTo(px(0.08), py(0.38));
    ctx.lineTo(px(0.34), py(0.1));
    ctx.lineTo(px(0.6), py(0.38));
    ctx.stroke();

    // Mini swaying wheat stalks along the front
    const sway = Math.sin(time * 2.5 + x) * (size * 0.05);
    for (let i = 0; i < 4; i++) {
      const wx = px(0.15 + i * 0.22);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wx, py(0.9));
      ctx.lineTo(wx + sway, py(0.72));
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(wx + sway - 2, py(0.7), 4, 6);
    }
  }

  // 4. WorldBox Grand Town Hall / Keep (Twin battlements, banner roof, royal crest, waving flag)
  private renderTownHall(b: Building, x: number, y: number, size: number, bannerColor: string, time: number) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    const roofBase = bannerColor;
    const roofHi = adjustHex(bannerColor, 35);
    const roofLo = adjustHex(bannerColor, -35);

    // Stone Castle Base Foundation
    ctx.fillStyle = '#334155';
    ctx.fillRect(px(0.05), py(0.22), pw(0.9), ph(0.72));

    // Stone blocks & masonry lines
    ctx.fillStyle = '#475569';
    ctx.fillRect(px(0.1), py(0.25), pw(0.8), ph(0.66));
    ctx.fillStyle = '#64748b';
    ctx.fillRect(px(0.1), py(0.25), pw(0.15), ph(0.66));

    // Left Battlement Tower
    ctx.fillStyle = '#334155';
    ctx.fillRect(px(0.04), py(0.1), pw(0.24), ph(0.82));
    ctx.fillStyle = '#475569';
    ctx.fillRect(px(0.06), py(0.12), pw(0.2), ph(0.8));
    // Merlons (crenellations)
    ctx.fillStyle = '#334155';
    ctx.fillRect(px(0.04), py(0.02), pw(0.08), ph(0.1));
    ctx.fillRect(px(0.18), py(0.02), pw(0.1), ph(0.1));

    // Right Battlement Tower
    ctx.fillStyle = '#334155';
    ctx.fillRect(px(0.72), py(0.1), pw(0.24), ph(0.82));
    ctx.fillStyle = '#475569';
    ctx.fillRect(px(0.74), py(0.12), pw(0.2), ph(0.8));
    // Merlons
    ctx.fillStyle = '#334155';
    ctx.fillRect(px(0.72), py(0.02), pw(0.08), ph(0.1));
    ctx.fillRect(px(0.86), py(0.02), pw(0.1), ph(0.1));

    // Central Steep Keep Roof
    ctx.fillStyle = roofLo;
    ctx.beginPath();
    ctx.moveTo(px(0.5), py(-0.25));
    ctx.lineTo(px(0.74), py(0.25));
    ctx.lineTo(px(0.26), py(0.25));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = roofBase;
    ctx.beginPath();
    ctx.moveTo(px(0.5), py(-0.25));
    ctx.lineTo(px(0.7), py(0.22));
    ctx.lineTo(px(0.3), py(0.22));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = roofHi;
    ctx.fillRect(px(0.47), py(-0.2), pw(0.06), ph(0.38));

    // Massive arched timber gate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px(0.36), py(0.54), pw(0.28), ph(0.4));
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px(0.38), py(0.56), pw(0.11), ph(0.38));
    ctx.fillRect(px(0.51), py(0.56), pw(0.11), ph(0.38));
    // Iron hinge bands
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px(0.38), py(0.66), pw(0.24), ph(0.03));
    ctx.fillRect(px(0.38), py(0.82), pw(0.24), ph(0.03));

    // Royal Golden Crest / Shield
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(px(0.5), py(0.48));
    ctx.lineTo(px(0.55), py(0.42));
    ctx.lineTo(px(0.45), py(0.42));
    ctx.closePath();
    ctx.fill();

    // Glowing arched stained-glass windows
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px(0.13), py(0.35), pw(0.07), ph(0.14));
    ctx.fillRect(px(0.8), py(0.35), pw(0.07), ph(0.14));

    // Central Flagpole & Animated Waving Banner
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px(0.48), py(-0.48), pw(0.04), ph(0.28));

    // Waving banner
    const flagWave = Math.sin(time * 3 + x) * pw(0.04);
    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.moveTo(px(0.52), py(-0.48));
    ctx.quadraticCurveTo(px(0.7) + flagWave, py(-0.44), px(0.86), py(-0.46) + flagWave);
    ctx.lineTo(px(0.86), py(-0.3) + flagWave);
    ctx.quadraticCurveTo(px(0.7) + flagWave, py(-0.28), px(0.52), py(-0.32));
    ctx.closePath();
    ctx.fill();
  }

  // 5. WorldBox Watchtower (Diagonal timber legs, stone footing, sentry platform, banner canopy, lantern)
  private renderWatchtower(b: Building, x: number, y: number, size: number, bannerColor: string, time: number) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    // Stone footing
    ctx.fillStyle = '#57534e';
    ctx.fillRect(px(0.22), py(0.82), pw(0.56), ph(0.12));

    // Diagonal timber support posts
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(2, pw(0.06));
    ctx.beginPath();
    ctx.moveTo(px(0.26), py(0.84));
    ctx.lineTo(px(0.34), py(0.32));
    ctx.moveTo(px(0.74), py(0.84));
    ctx.lineTo(px(0.66), py(0.32));
    // Cross brace
    ctx.moveTo(px(0.28), py(0.6));
    ctx.lineTo(px(0.72), py(0.6));
    ctx.stroke();

    // Tower central shaft
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px(0.42), py(0.34), pw(0.16), ph(0.5));

    // Sentry guard platform
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px(0.18), py(0.28), pw(0.64), ph(0.07));
    // Platform wooden railing
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px(0.18), py(0.18), pw(0.64), ph(0.03));
    ctx.fillRect(px(0.2), py(0.21), pw(0.04), ph(0.07));
    ctx.fillRect(px(0.48), py(0.21), pw(0.04), ph(0.07));
    ctx.fillRect(px(0.76), py(0.21), pw(0.04), ph(0.07));

    // Peaked Pyramid Canopy Roof
    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.moveTo(px(0.5), py(-0.22));
    ctx.lineTo(px(0.84), py(0.16));
    ctx.lineTo(px(0.16), py(0.16));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(1.5, pw(0.05));
    ctx.beginPath();
    ctx.moveTo(px(0.16), py(0.16));
    ctx.lineTo(px(0.5), py(-0.22));
    ctx.lineTo(px(0.84), py(0.16));
    ctx.stroke();

    // Fluttering pennant flag
    const wave = Math.sin(time * 3 + x) * pw(0.03);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px(0.48), py(-0.35), pw(0.04), ph(0.15));
    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.moveTo(px(0.52), py(-0.35));
    ctx.lineTo(px(0.74), py(-0.3) + wave);
    ctx.lineTo(px(0.52), py(-0.25));
    ctx.closePath();
    ctx.fill();

    // Hanging warm lantern
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(px(0.3), py(0.38), Math.max(2, pw(0.04)), 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. WorldBox Mine (Mountain shaft, timber A-frame, rails, sparkling raw ores)
  private renderMine(b: Building, x: number, y: number, size: number, time: number) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    // Mountain rock surround
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(px(0.05), py(0.92));
    ctx.lineTo(px(0.15), py(0.2));
    ctx.lineTo(px(0.85), py(0.2));
    ctx.lineTo(px(0.95), py(0.92));
    ctx.closePath();
    ctx.fill();

    // Cavern dark tunnel opening
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.arc(px(0.5), py(0.65), pw(0.28), Math.PI, 0, false);
    ctx.lineTo(px(0.78), py(0.92));
    ctx.lineTo(px(0.22), py(0.92));
    ctx.closePath();
    ctx.fill();

    // Heavy Timber A-Frame Portal
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = Math.max(2.5, pw(0.08));
    ctx.beginPath();
    ctx.moveTo(px(0.22), py(0.92));
    ctx.lineTo(px(0.32), py(0.35));
    ctx.lineTo(px(0.68), py(0.35));
    ctx.lineTo(px(0.78), py(0.92));
    ctx.stroke();

    // Horizontal timber lintel
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px(0.24), py(0.33), pw(0.52), ph(0.08));

    // Minecart rails
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px(0.38), py(0.75));
    ctx.lineTo(px(0.34), py(0.98));
    ctx.moveTo(px(0.62), py(0.75));
    ctx.lineTo(px(0.66), py(0.98));
    // Ties
    ctx.moveTo(px(0.35), py(0.82));
    ctx.lineTo(px(0.65), py(0.82));
    ctx.moveTo(px(0.33), py(0.92));
    ctx.lineTo(px(0.67), py(0.92));
    ctx.stroke();

    // Sparkling Raw Ores & Minerals
    const sparkle = (Math.sin(time * 3 + x) + 1) * 0.5;
    // Gold nugget
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px(0.12), py(0.8), pw(0.08), ph(0.08));
    // Iron ore
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(px(0.8), py(0.78), pw(0.09), ph(0.08));
    // Mithril blue gem
    ctx.fillStyle = sparkle > 0.4 ? '#38bdf8' : '#0284c7';
    ctx.fillRect(px(0.18), py(0.72), pw(0.06), ph(0.06));
    // Ruby / Adamantite red gem
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(px(0.75), py(0.7), pw(0.06), ph(0.06));

    // Hanging miner's lantern
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(px(0.48), py(0.43), pw(0.05), ph(0.07));
  }

  // 7. WorldBox Docks (Wooden pier boardwalk, pilings, bollards, coiled rope, cargo)
  private renderDocks(b: Building, x: number, y: number, size: number, bannerColor: string, time: number) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    // Underwater timber pilings
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px(0.15), py(0.6), pw(0.08), ph(0.35));
    ctx.fillRect(px(0.77), py(0.6), pw(0.08), ph(0.35));

    // Wooden boardwalk decking
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px(0.08), py(0.35), pw(0.84), ph(0.45));

    // Weathered deck plank lines
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px(0.08), py(0.35 + i * 0.09));
      ctx.lineTo(px(0.92), py(0.35 + i * 0.09));
      ctx.stroke();
    }

    // Mooring bollards & coiled rope
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px(0.12), py(0.28), pw(0.1), ph(0.12));
    ctx.fillRect(px(0.78), py(0.28), pw(0.1), ph(0.12));
    ctx.fillStyle = '#fef3c7'; // rope coil
    ctx.fillRect(px(0.11), py(0.32), pw(0.12), ph(0.04));

    // Wooden cargo crate
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px(0.38), py(0.42), pw(0.22), ph(0.22));
    ctx.fillStyle = '#78350f';
    ctx.strokeRect(px(0.38), py(0.42), pw(0.22), ph(0.22));

    // Pier lantern post
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px(0.82), py(0.12), pw(0.04), ph(0.2));
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px(0.8), py(0.1), pw(0.08), ph(0.08));
  }

  // 8. WorldBox Granary (Stilt warehouse, mushroom stones, sacks of grain, thatch trim)
  private renderGranary(b: Building, x: number, y: number, size: number, bannerColor: string) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    // 4 Stilt Mushroom Stones
    ctx.fillStyle = '#78716c';
    ctx.fillRect(px(0.18), py(0.75), pw(0.08), ph(0.18));
    ctx.fillRect(px(0.74), py(0.75), pw(0.08), ph(0.18));
    // Mushroom cap discs (rat guard)
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(px(0.15), py(0.72), pw(0.14), ph(0.05));
    ctx.fillRect(px(0.71), py(0.72), pw(0.14), ph(0.05));

    // Wooden storehouse body
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px(0.14), py(0.32), pw(0.72), ph(0.42));
    // Clapboard lines
    ctx.fillStyle = '#78350f';
    for (let i = 1; i <= 3; i++) {
      ctx.fillRect(px(0.14), py(0.32 + i * 0.1), pw(0.72), ph(0.02));
    }

    // Steep Hipped Roof in Banner Color with Thatch Eaves
    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.moveTo(px(0.5), py(-0.15));
    ctx.lineTo(px(0.92), py(0.34));
    ctx.lineTo(px(0.08), py(0.34));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#eab308'; // Thatch straw trim
    ctx.fillRect(px(0.06), py(0.32), pw(0.88), ph(0.05));

    // Sacks of harvested golden wheat on porch
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px(0.28), py(0.62), pw(0.14), ph(0.12));
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(px(0.44), py(0.64), pw(0.14), ph(0.1));
  }

  // 9. WorldBox Park (Cobblestone plaza, ornate splashing fountain, vibrant flowerbeds)
  private renderPark(b: Building, x: number, y: number, size: number, time: number) {
    const ctx = this.ctx;
    const px = (rel: number) => x + size * rel;
    const py = (rel: number) => y + size * rel;
    const pw = (rel: number) => size * rel;
    const ph = (rel: number) => size * rel;

    // Cobblestone circular plaza
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(px(0.5), py(0.5), pw(0.44), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central Stone Fountain Basin
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(px(0.5), py(0.5), pw(0.22), 0, Math.PI * 2);
    ctx.fill();

    // Rippling Azure Water
    const wave = (Math.sin(time * 3) + 1) * 0.5;
    ctx.fillStyle = wave > 0.5 ? '#38bdf8' : '#0284c7';
    ctx.beginPath();
    ctx.arc(px(0.5), py(0.5), pw(0.18), 0, Math.PI * 2);
    ctx.fill();

    // Center fountain spout
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px(0.48), py(0.4), pw(0.04), ph(0.1));

    // Encircling Flowerbeds (Roses, Bluebells, Sunflowers)
    const flowers = [
      { rx: 0.18, ry: 0.22, color: '#ef4444' },
      { rx: 0.82, ry: 0.22, color: '#38bdf8' },
      { rx: 0.18, ry: 0.78, color: '#facc15' },
      { rx: 0.82, ry: 0.78, color: '#ec4899' },
    ];
    for (const f of flowers) {
      ctx.fillStyle = '#16a34a'; // leaves
      ctx.fillRect(px(f.rx) - 2, py(f.ry) - 2, 7, 7);
      ctx.fillStyle = f.color;
      ctx.fillRect(px(f.rx), py(f.ry), 4, 4);
    }
  }

  private renderEntity(e: Entity, x: number, y: number, size: number, isSelected: boolean, sim: WorldSimulation) {
    const ctx = this.ctx;
    const bodySize = Math.max(6, size * 0.75);

    ctx.save();

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.5, bodySize * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Blessed Aura
    if (e.traits.includes('Blessed')) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y + size * 0.1, size * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Creature pixel drawing
    const cx = x + size * 0.5;
    const cy = y + size * 0.5;

    switch (e.species) {
      case 'human': {
        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(cx - 3, cy - 8, 6, 6);
        // Hair
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 3, cy - 9, 6, 2);
        // Body (tunic)
        const kingdom = sim.getKingdom(e.ownerKingdomId);
        ctx.fillStyle = kingdom?.bannerColor || '#3b82f6';
        ctx.fillRect(cx - 4, cy - 2, 8, 7);
        // Legs
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx - 3, cy + 5, 2, 4);
        ctx.fillRect(cx + 1, cy + 5, 2, 4);
        // Tiny sword if warrior / fighter
        if (e.level > 1 || e.state === 'FIGHT') {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(cx + 4, cy - 4, 2, 7);
        }
        break;
      }
      case 'elf': {
        // Fair head
        ctx.fillStyle = '#ffedd5';
        ctx.fillRect(cx - 3, cy - 8, 6, 6);
        // Blonde long hair & pointed ears
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 4, cy - 9, 8, 3);
        ctx.fillRect(cx - 5, cy - 7, 2, 3);
        ctx.fillRect(cx + 3, cy - 7, 2, 3);
        // Forest green tunic
        ctx.fillStyle = '#10b981';
        ctx.fillRect(cx - 4, cy - 2, 8, 7);
        // Legs
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(cx - 3, cy + 5, 2, 4);
        ctx.fillRect(cx + 1, cy + 5, 2, 4);
        break;
      }
      case 'orc': {
        // Green head with tusks
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(cx - 4, cy - 8, 8, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 3, cy - 3, 2, 2);
        ctx.fillRect(cx + 1, cy - 3, 2, 2);
        // Bulky body
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(cx - 5, cy - 2, 10, 8);
        // Legs
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 4, cy + 6, 3, 4);
        ctx.fillRect(cx + 1, cy + 6, 3, 4);
        break;
      }
      case 'dwarf': {
        // Horned / iron helmet
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 4, cy - 9, 8, 4);
        // Face & long beard
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(cx - 3, cy - 5, 6, 4);
        ctx.fillStyle = '#ea580c'; // Red beard
        ctx.fillRect(cx - 4, cy - 2, 8, 6);
        // Iron armor
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 4, cy + 2, 8, 5);
        break;
      }
      case 'sheep': {
        // Fluffy white sheep
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 6, cy - 4, 12, 8);
        ctx.fillStyle = '#18181b'; // Black face
        ctx.fillRect(cx + 5, cy - 5, 4, 5);
        // Little legs
        ctx.fillRect(cx - 4, cy + 4, 2, 3);
        ctx.fillRect(cx + 2, cy + 4, 2, 3);
        break;
      }
      case 'wolf': {
        // Grey predator
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 7, cy - 3, 14, 6);
        // Snout & ears
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx + 6, cy - 4, 4, 4);
        ctx.fillRect(cx + 5, cy - 7, 2, 3);
        // Tail
        ctx.fillRect(cx - 9, cy - 6, 3, 4);
        break;
      }
      case 'bear': {
        // Muscular brown bear
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 8, cy - 6, 16, 11);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx + 7, cy - 5, 5, 6);
        ctx.fillRect(cx + 6, cy - 9, 3, 3);
        break;
      }
      case 'dragon': {
        // Magnificent mythical dragon
        const wingFlap = Math.sin(this.animFrame * 0.25) * 4;
        ctx.fillStyle = '#dc2626';
        // Massive body & neck
        ctx.fillRect(cx - 12, cy - 6, 24, 12);
        ctx.fillRect(cx + 10, cy - 14, 10, 10);
        // Horns
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx + 16, cy - 18, 3, 5);
        // Wings
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 4);
        ctx.lineTo(cx - 14, cy - 18 + wingFlap);
        ctx.lineTo(cx + 6, cy - 18 + wingFlap);
        ctx.closePath();
        ctx.fill();
        // Tail
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(cx - 20, cy - 2, 9, 5);
        break;
      }
    }

    // Village chief banner (WorldBox-style flag above the head)
    const ledVillage = e.ownerVillageId ? sim.villages.find(v => v.id === e.ownerVillageId && v.leaderId === e.id) : undefined;
    const isKing = sim.kingdoms.some(k => k.kingId === e.id);
    if (ledVillage) {
      const flagColor = sim.kingdoms.find(k => k.id === ledVillage.kingdomId)?.bannerColor || '#e2e8f0';
      const poleX = cx + 5;
      const poleTop = cy - 30;
      const wave = Math.sin(Date.now() / 220 + e.x) * 1.5;
      ctx.fillStyle = '#3f2a14';
      ctx.fillRect(poleX, poleTop, 2, 22);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(poleX - 1, poleTop - 2, 4, 3);
      ctx.fillStyle = flagColor;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(poleX + 2, poleTop + 1);
      ctx.lineTo(poleX + 15, poleTop + 2 + wave);
      ctx.lineTo(poleX + 12, poleTop + 6 + wave * 0.5);
      ctx.lineTo(poleX + 15, poleTop + 10 + wave);
      ctx.lineTo(poleX + 2, poleTop + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(poleX + 5, poleTop + 4, 3, 3);
    }

    // King crown
    if (isKing) {
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 3, cy - 13, 6, 3);
      ctx.fillRect(cx - 3, cy - 15, 2, 2);
      ctx.fillRect(cx - 1, cy - 15, 2, 2);
      ctx.fillRect(cx + 1, cy - 15, 2, 2);
    }

    // Health bar if hurt
    if (e.health < e.maxHealth) {
      const barW = 16;
      const barH = 3;
      const hpPct = Math.max(0, e.health / e.maxHealth);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(cx - barW / 2, cy - 14, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - barW / 2, cy - 14, barW * hpPct, barH);
    }

    ctx.restore();
  }

  // Fast live minimap draw
  public renderMinimap(sim: WorldSimulation, camera: Camera, targetCanvas: HTMLCanvasElement) {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const mw = targetCanvas.width;
    const mh = targetCanvas.height;
    const imgData = ctx.createImageData(mw, mh);
    const data = imgData.data;

    const scaleX = sim.width / mw;
    const scaleY = sim.height / mh;

    const colorMap: Record<TileType, [number, number, number]> = {
      deep_water: [30, 58, 138],
      shallow_water: [2, 132, 199],
      sand: [253, 224, 71],
      plains: [34, 197, 94],
      forest: [21, 128, 61],
      mountain: [100, 116, 139],
      snow: [248, 250, 252],
      lava: [234, 88, 12],
    };

    for (let my = 0; my < mh; my++) {
      for (let mx = 0; mx < mw; mx++) {
        const wx = Math.floor(mx * scaleX);
        const wy = Math.floor(my * scaleY);
        const tile = sim.tiles[wy]?.[wx] || 'deep_water';
        const [r, g, b] = colorMap[tile];

        const idx = (my * mw + mx) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw camera viewport box
    const viewW = (this.canvas.width / camera.zoom) / scaleX;
    const viewH = (this.canvas.height / camera.zoom) / scaleY;
    const vx = (camera.x - (this.canvas.width / (2 * camera.zoom))) / scaleX;
    const vy = (camera.y - (this.canvas.height / (2 * camera.zoom))) / scaleY;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, viewW, viewH);
  }
}
