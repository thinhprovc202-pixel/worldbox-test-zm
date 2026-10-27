import { Boat, Building, Entity, TileType, Village, Kingdom } from './types';
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

    // 3. Render Buildings
    for (const village of sim.villages) {
      const kingdom = sim.getKingdom(village.kingdomId);
      const bannerColor = kingdom?.bannerColor || '#e2e8f0';

      for (const b of village.buildings) {
        if (b.x < startTileX - 1 || b.x > endTileX + 1 || b.y < startTileY - 1 || b.y > endTileY + 1) continue;
        const bx = worldToScreenX(b.x);
        const by = worldToScreenY(b.y);
        this.renderBuilding(b, bx, by, tileSize, bannerColor);
      }
    }

    // 3b. Render Boats & Ships navigating the waters
    for (const boat of sim.boats) {
      if (boat.x < startTileX - 1 || boat.x > endTileX + 1 || boat.y < startTileY - 1 || boat.y > endTileY + 1) continue;
      const bx = worldToScreenX(boat.x);
      const by = worldToScreenY(boat.y);
      const kingdom = sim.getKingdom(boat.kingdomId);
      this.renderBoat(boat, bx, by, tileSize, kingdom?.bannerColor || '#38bdf8');
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

  private renderBoat(boat: Boat, x: number, y: number, size: number, bannerColor: string) {
    const ctx = this.ctx;

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(x + size * 0.05, y + size * 0.6);
    ctx.lineTo(x + size * 0.95, y + size * 0.6);
    ctx.lineTo(x + size * 0.78, y + size * 0.88);
    ctx.lineTo(x + size * 0.22, y + size * 0.88);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + size * 0.47, y + size * 0.1, size * 0.06, size * 0.5);

    ctx.fillStyle = bannerColor;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.53, y + size * 0.12);
    ctx.lineTo(x + size * 0.85, y + size * 0.5);
    ctx.lineTo(x + size * 0.53, y + size * 0.5);
    ctx.closePath();
    ctx.fill();

    const passengers = Math.min(boat.passengerIds.length, 4);
    ctx.fillStyle = '#fcd34d';
    for (let i = 0; i < passengers; i++) {
      ctx.fillRect(x + size * (0.2 + i * 0.16), y + size * 0.5, size * 0.1, size * 0.1);
    }

    if (boat.health < boat.maxHealth) {
      const ratio = Math.max(0, boat.health / boat.maxHealth);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x, y - size * 0.1, size, size * 0.08);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x, y - size * 0.1, size * ratio, size * 0.08);
    }
  }

  private renderBuilding(b: Building, x: number, y: number, size: number, bannerColor: string) {
    const ctx = this.ctx;

    if (b.type === 'town_hall') {
      // Grand Keep Castle
      ctx.fillStyle = '#475569';
      ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.8, size * 0.65);
      // Battlements
      ctx.fillRect(x + size * 0.1, y + size * 0.12, size * 0.22, size * 0.15);
      ctx.fillRect(x + size * 0.4, y + size * 0.12, size * 0.2, size * 0.15);
      ctx.fillRect(x + size * 0.68, y + size * 0.12, size * 0.22, size * 0.15);
      // Wooden Arch Door
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + size * 0.38, y + size * 0.55, size * 0.24, size * 0.35);
      // Kingdom Flag Pole & Banner
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x + size * 0.48, y - size * 0.25, size * 0.06, size * 0.4);
      ctx.fillStyle = bannerColor;
      ctx.fillRect(x + size * 0.54, y - size * 0.25, size * 0.32, size * 0.2);
    } else if (b.type === 'house') {
      // Cozy Cottage
      ctx.fillStyle = '#b45309'; // Red terracotta roof
      ctx.beginPath();
      ctx.moveTo(x + size * 0.5, y + size * 0.15);
      ctx.lineTo(x + size * 0.9, y + size * 0.45);
      ctx.lineTo(x + size * 0.1, y + size * 0.45);
      ctx.fill();
      // Wall
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + size * 0.2, y + size * 0.45, size * 0.6, size * 0.45);
      // Door
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + size * 0.42, y + size * 0.62, size * 0.16, size * 0.28);
    } else if (b.type === 'farm') {
      // Golden wheat field
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8);
      ctx.fillStyle = '#eab308';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + size * 0.2, y + size * (0.2 + i * 0.25), size * 0.6, size * 0.12);
      }
    } else if (b.type === 'watchtower') {
      // Tall Watchtower
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + size * 0.3, y + size * 0.15, size * 0.4, size * 0.75);
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + size * 0.2, y + size * 0.05, size * 0.6, size * 0.15);
      // Arrow slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + size * 0.46, y + size * 0.35, size * 0.08, size * 0.2);
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
