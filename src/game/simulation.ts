import {
  Boat,
  Building,
  BuildingType,
  Entity,
  EntityState,
  GodPowerId,
  HistoryEvent,
  Kingdom,
  Particle,
  Species,
  TileType,
  Trait,
  Village,
  WorldConfig,
  WorldLaws,
  TRAIT_DEFINITIONS,
  BUILDING_LABELS,
  HOUSE_CAPACITY,
  WINDMILL_FIELD_RADIUS
} from './types';

const BUILDING_COSTS: Partial<Record<BuildingType, { wood: number; stone: number; health: number }>> = {
  house: { wood: 15, stone: 10, health: 150 },
  farm: { wood: 15, stone: 10, health: 120 },
  watchtower: { wood: 15, stone: 10, health: 250 },
  windmill: { wood: 25, stone: 15, health: 180 },
  mine: { wood: 20, stone: 10, health: 220 },
  docks: { wood: 25, stone: 15, health: 200 },
  granary: { wood: 20, stone: 10, health: 160 },
  park: { wood: 20, stone: 25, health: 160 },
};

const MAX_FIELDS_PER_WINDMILL = 36;
import { generateWorldMap, PresetType } from './generator';

// Name banks for kingdoms, villages and people
const KINGDOM_PREFIXES = ['Al', 'Val', 'Nord', 'Eld', 'Oakh', 'Iron', 'Sun', 'Moon', 'Storm', 'Shadow', 'Dragon', 'Frost'];
const KINGDOM_SUFFIXES = ['oria', 'gard', 'heim', 'dor', 'vale', 'crest', 'fall', 'haven', 'shire', 'keep', 'realm'];
const FIRST_NAMES = ['Alden', 'Bryn', 'Cedric', 'Doran', 'Elowen', 'Faelan', 'Garrick', 'Harek', 'Isolde', 'Jareth', 'Kaela', 'Lorien', 'Merek', 'Nesta', 'Orin', 'Pyre', 'Ragnor', 'Sylas', 'Thoran', 'Ulric', 'Vera', 'Zephyr'];

const BANNER_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber/Gold
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const CIVILIZED_SPECIES: Species[] = ['human', 'elf', 'orc', 'dwarf'];

export function isCivilized(species: Species): boolean {
  return CIVILIZED_SPECIES.includes(species);
}

export function isWalkable(tile: TileType): boolean {
  return tile !== 'deep_water' && tile !== 'shallow_water' && tile !== 'lava';
}

export function isSwimmable(tile: TileType): boolean {
  return tile === 'shallow_water';
}

export function isWater(tile?: TileType): boolean {
  return tile === 'deep_water' || tile === 'shallow_water';
}

export class WorldSimulation {
  public width: number;
  public height: number;
  public seed: number;
  public name: string;
  public tiles: TileType[][];
  public entities: Entity[] = [];
  public villages: Village[] = [];
  public kingdoms: Kingdom[] = [];
  public boats: Boat[] = [];
  public particles: Particle[] = [];
  public historyEvents: HistoryEvent[] = [];
  public worldLaws: WorldLaws = {
    hunger: true,
    aging: true,
    kingdomWars: true,
    animalBreeding: true,
    disasters: true,
    peacefulMode: false,
    vegetationGrowth: true,
    villageRecruitment: true,
  };

  public year: number = 1;
  public tickCount: number = 0;
  public nextId: number = 1;

  constructor(config: WorldConfig, preset: PresetType = 'continents') {
    this.width = config.width;
    this.height = config.height;
    this.seed = config.seed;
    this.name = config.name || 'Nova Terra';
    this.tiles = generateWorldMap(config, preset);

    this.addHistoryEvent('Khởi nguyên thế giới', `Thế giới ${this.name} được hình thành từ hỗn mang.`, 'nature');
    this.seedInitialLife();
  }

  public getUniqueId(prefix = 'obj'): string {
    return `${prefix}_${this.nextId++}_${Math.random().toString(36).substring(2, 6)}`;
  }

  public addHistoryEvent(title: string, description: string, category: HistoryEvent['category'], color?: string) {
    const event: HistoryEvent = {
      id: this.getUniqueId('hist'),
      year: this.year,
      tick: this.tickCount,
      title,
      description,
      category,
      color,
    };
    this.historyEvents.unshift(event);
    if (this.historyEvents.length > 80) {
      this.historyEvents.pop();
    }
  }

  // Seed some starting wildlife and travelers across the lands
  public seedInitialLife() {
    const landTiles: { x: number; y: number }[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x] === 'plains' || this.tiles[y][x] === 'forest') {
          landTiles.push({ x, y });
        }
      }
    }

    if (landTiles.length === 0) return;

    // Pick 3-4 separate land regions to spawn 4 intelligent races
    const races: Species[] = ['human', 'elf', 'orc', 'dwarf'];
    const areaRatio = Math.max(1, Math.round((this.width * this.height) / 7500));
    const tribeCount = Math.min(6, 2 + areaRatio);

    for (let i = 0; i < races.length; i++) {
      const idx = Math.floor((landTiles.length * (i + 1)) / (races.length + 1));
      const pos = landTiles[idx] || landTiles[0];
      // Spawn small tribe
      for (let k = 0; k < tribeCount; k++) {
        this.spawnEntity(
          races[i],
          Math.max(1, Math.min(this.width - 2, pos.x + Math.floor(Math.random() * 7 - 3))),
          Math.max(1, Math.min(this.height - 2, pos.y + Math.floor(Math.random() * 7 - 3)))
        );
      }
    }

    // Spawn passive sheep (reduced by 2x)
    const sheepCount = Math.max(2, Math.round(5 * areaRatio));
    for (let i = 0; i < sheepCount; i++) {
      const pos = landTiles[Math.floor(Math.random() * landTiles.length)];
      if (pos) this.spawnEntity('sheep', pos.x, pos.y);
    }

    // Spawn wolves (reduced by 2x)
    const wolfCount = Math.max(1, Math.round(1.5 * areaRatio));
    for (let i = 0; i < wolfCount; i++) {
      const pos = landTiles[Math.floor(Math.random() * landTiles.length)];
      if (pos) this.spawnEntity('wolf', pos.x, pos.y);
    }

    // Spawn bears (reduced by 2x)
    const bearCount = Math.max(1, Math.round(1 * areaRatio));
    for (let i = 0; i < bearCount; i++) {
      const pos = landTiles[Math.floor(Math.random() * landTiles.length)];
      if (pos) this.spawnEntity('bear', pos.x, pos.y);
    }
  }

  public spawnEntity(species: Species, x: number, y: number, traitsOverride?: Trait[]): Entity {
    const isMale = Math.random() > 0.5;
    const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;

    let maxHp = 100;
    let atk = 10;
    let def = 2;
    let spd = 1.0;

    switch (species) {
      case 'human':
        maxHp = 100;
        atk = 12;
        def = 3;
        spd = 1.0;
        break;
      case 'elf':
        maxHp = 90;
        atk = 14;
        def = 2;
        spd = 1.25;
        break;
      case 'orc':
        maxHp = 140;
        atk = 18;
        def = 4;
        spd = 0.95;
        break;
      case 'dwarf':
        maxHp = 125;
        atk = 13;
        def = 7;
        spd = 0.85;
        break;
      case 'sheep':
        maxHp = 45;
        atk = 0;
        def = 1;
        spd = 0.8;
        break;
      case 'wolf':
        maxHp = 75;
        atk = 16;
        def = 2;
        spd = 1.2;
        break;
      case 'bear':
        maxHp = 160;
        atk = 24;
        def = 6;
        spd = 0.9;
        break;
      case 'dragon':
        maxHp = 600;
        atk = 40;
        def = 12;
        spd = 1.4;
        break;
    }

    const traits: Trait[] = traitsOverride ? [...traitsOverride] : [];
    if (!traitsOverride) {
      // Positive traits
      if (Math.random() < 0.16) traits.push('Fast');
      if (Math.random() < 0.14) traits.push('Strong');
      if (isCivilized(species) && Math.random() < 0.12) traits.push('Genius');
      if (Math.random() < 0.15) traits.push('Tough');
      if (Math.random() < 0.05) traits.push('Giant');
      if (Math.random() < 0.05) traits.push('Immortal');
      if (isCivilized(species) && Math.random() < 0.12) traits.push('Seafarer');
      if (Math.random() < 0.06) traits.push('Regeneration');

      // Negative traits
      if (Math.random() < 0.08) traits.push('Weak');
      if (Math.random() < 0.08) traits.push('Slow');
      if (Math.random() < 0.08) traits.push('Frail');
      if (Math.random() < 0.09) traits.push('Glutton');
      if (isCivilized(species) && Math.random() < 0.08) traits.push('Stupid');

      // Neutral / Special traits
      if (Math.random() < 0.05) traits.push('Tiny');
      if (species === 'sheep' || (Math.random() < 0.08 && species !== 'orc' && species !== 'wolf' && species !== 'dragon')) {
        traits.push('Peaceful');
      }
      if (species === 'orc' ? Math.random() < 0.45 : Math.random() < 0.06) {
        if (!traits.includes('Peaceful')) traits.push('Bloodthirsty');
      }

      // Species innate traits
      if (species === 'dragon') {
        if (!traits.includes('Fireproof')) traits.push('Fireproof');
        if (!traits.includes('Giant')) traits.push('Giant');
        if (!traits.includes('Strong')) traits.push('Strong');
      }
      if (species === 'dwarf') {
        if (!traits.includes('Tough')) traits.push('Tough');
      }
      if (species === 'elf') {
        if (Math.random() < 0.25 && !traits.includes('Fast')) traits.push('Fast');
      }
    }

    // Apply stat modifiers from all traits
    for (const t of traits) {
      if (t === 'Fast') spd *= 1.35;
      if (t === 'Slow') spd = Math.max(0.3, spd * 0.7);
      if (t === 'Strong') atk = Math.round(atk * 1.4);
      if (t === 'Weak') {
        atk = Math.max(1, Math.round(atk * 0.65));
        maxHp = Math.max(10, Math.round(maxHp * 0.85));
      }
      if (t === 'Tough') {
        def += 4;
        maxHp = Math.round(maxHp * 1.2);
      }
      if (t === 'Frail') {
        def = Math.max(0, def - 4);
        maxHp = Math.max(10, Math.round(maxHp * 0.75));
      }
      if (t === 'Giant') {
        maxHp = Math.round(maxHp * 1.6);
        atk = Math.round(atk * 1.2);
        spd *= 0.85;
      }
      if (t === 'Tiny') {
        maxHp = Math.round(maxHp * 0.7);
        spd *= 1.25;
        def += 2;
      }
      if (t === 'Blessed') {
        maxHp = Math.round(maxHp * 1.5);
        atk = Math.round(atk * 1.3);
      }
      if (t === 'Cursed') {
        maxHp = Math.round(maxHp * 0.7);
        atk = Math.max(1, Math.round(atk * 0.8));
      }
      if (t === 'Seafarer') {
        def += 2;
      }
    }

    const entity: Entity = {
      id: this.getUniqueId('ent'),
      name,
      species,
      x: Math.max(0, Math.min(this.width - 1, x)),
      y: Math.max(0, Math.min(this.height - 1, y)),
      health: maxHp,
      maxHealth: maxHp,
      age: isCivilized(species) ? Math.floor(Math.random() * 15 + 16) : Math.floor(Math.random() * 5 + 1),
      hunger: 80,
      state: 'IDLE',
      alive: true,
      traits,
      level: 1,
      kills: 0,
      attackPower: atk,
      defense: def,
      speed: spd,
      actionTimer: Math.floor(Math.random() * 10),
      gender: isMale ? 'M' : 'F',
    };

    this.entities.push(entity);

    // Rule: if spawning a civilized class entity into any village,
    // if the village is of the same species, there is an 80% chance it is recruited as a villager!
    if (isCivilized(species) && this.worldLaws.villageRecruitment !== false) {
      // Check if location is inside village territory or within village radius (6 tiles)
      const targetVillage =
        this.getVillageAt(entity.x, entity.y) ||
        this.villages.find(v => Math.hypot(v.x - entity.x, v.y - entity.y) <= 6.5);

      if (targetVillage) {
        const targetKingdom = this.getKingdom(targetVillage.kingdomId);
        // Only if the village belongs to the exact same species
        if (targetKingdom && targetKingdom.species === species) {
          const roll = Math.random();
          if (roll < 0.8) {
            // 80% probability: Successfully recruited!
            entity.ownerVillageId = targetVillage.id;
            entity.ownerKingdomId = targetVillage.kingdomId;
            entity.recruitedAtSpawn = true;
            targetVillage.population += 1;
            if (targetVillage.population > targetVillage.maxPopulation) {
              targetVillage.maxPopulation = targetVillage.population;
            }

            // Visual celebration particles
            this.createSparks(entity.x, entity.y, targetKingdom.bannerColor || '#10b981', 14);
            this.createPuff(entity.x, entity.y, '#facc15', 6);

            this.addHistoryEvent(
              'Gia nhập Dân làng (80%)',
              `${entity.name} (${entity.species}) đã được kết nạp vào làng ${targetVillage.name} thuộc Vương quốc ${targetKingdom.name}!`,
              'kingdom',
              targetKingdom.bannerColor
            );
          } else {
            // 20% remaining probability: declined citizenship
            this.addHistoryEvent(
              'Từ chối nhập tịch (20%)',
              `${entity.name} (${entity.species}) xuất hiện tại làng ${targetVillage.name} nhưng đã chọn làm một kẻ du mục tự do.`,
              'nature',
              '#94a3b8'
            );
          }
        }
      }
    }

    return entity;
  }

  public foundKingdomAndVillage(founder: Entity): { kingdom: Kingdom; village: Village } {
    const prefix = KINGDOM_PREFIXES[Math.floor(Math.random() * KINGDOM_PREFIXES.length)];
    const suffix = KINGDOM_SUFFIXES[Math.floor(Math.random() * KINGDOM_SUFFIXES.length)];
    const kingdomName = `${prefix}${suffix}`;
    const villageName = `${prefix}'s Hold`;

    const usedColors = new Set(this.kingdoms.map(k => k.bannerColor));
    const availableColors = BANNER_COLORS.filter(c => !usedColors.has(c));
    const bannerColor = availableColors.length > 0
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : BANNER_COLORS[this.kingdoms.length % BANNER_COLORS.length];

    const kingdomId = this.getUniqueId('kng');
    const villageId = this.getUniqueId('vlg');

    const kingdom: Kingdom = {
      id: kingdomId,
      name: kingdomName,
      bannerColor,
      kingId: founder.id,
      species: founder.species,
      villages: [villageId],
      enemyKingdomIds: [],
      alliedKingdomIds: [],
      relations: {},
      createdAtYear: this.year,
    };

    // Initialize relations with other kingdoms
    for (const other of this.kingdoms) {
      const initialRelation = this.worldLaws.peacefulMode ? 50 : Math.floor(Math.random() * 40 - 10);
      kingdom.relations[other.id] = initialRelation;
      other.relations[kingdom.id] = initialRelation;
    }

    const territory: { x: number; y: number }[] = [];
    const radius = 3;
    const fx = Math.round(founder.x);
    const fy = Math.round(founder.y);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = fx + dx;
        const ty = fy + dy;
        if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
          if (isWalkable(this.tiles[ty][tx])) {
            territory.push({ x: tx, y: ty });
          }
        }
      }
    }

    const townHall: Building = {
      id: this.getUniqueId('bld'),
      villageId,
      type: 'town_hall',
      x: fx,
      y: fy,
      health: 300,
      maxHealth: 300,
      level: 1,
    };

    const village: Village = {
      id: villageId,
      kingdomId,
      name: villageName,
      leaderId: founder.id,
      x: fx,
      y: fy,
      territory,
      resources: {
        wood: 35,
        stone: 20,
        food: 50,
        gold: 10,
        iron: 0,
        mithril: 0,
        adamantite: 0,
      },
      farmland: [],
      population: 1,
      maxPopulation: 6,
      buildings: [townHall],
    };

    this.kingdoms.push(kingdom);
    this.villages.push(village);

    founder.ownerKingdomId = kingdomId;
    founder.ownerVillageId = villageId;

    this.addHistoryEvent(
      `Vương quốc ${kingdomName} thành lập`,
      `${founder.name} (${founder.species}) đã sáng lập Vương quốc ${kingdomName} tại ${villageName}!`,
      'kingdom',
      bannerColor
    );

    return { kingdom, village };
  }

  // Find village territory at a given tile
  public getVillageAt(x: number, y: number): Village | undefined {
    const rx = Math.round(x);
    const ry = Math.round(y);
    return this.villages.find(v => v.territory.some(t => t.x === rx && t.y === ry));
  }

  public getKingdom(id?: string): Kingdom | undefined {
    if (!id) return undefined;
    return this.kingdoms.find(k => k.id === id);
  }

  public getVillage(id?: string): Village | undefined {
    if (!id) return undefined;
    return this.villages.find(v => v.id === id);
  }

  // Execute one step of simulation
  public update() {
    this.tickCount++;

    // 1 year = 60 simulation ticks
    if (this.tickCount % 60 === 0) {
      this.year++;
      this.updateKingdomDiplomacyYearly();
    }

    // 1. Natural vegetation growth & environment
    if (this.worldLaws.vegetationGrowth && this.tickCount % 40 === 0) {
      this.updateNatureCycle();
    }

    // 2. Village economy & building construction
    if (this.tickCount % 20 === 0) {
      this.updateVillages();
    }

    // 2b. Naval fleet voyages & oceanic expansion
    this.updateBoats();

    // 3. Entity AI and Behavior
    this.updateEntities();

    // 4. Update particles
    this.updateParticles();
  }

  private updateNatureCycle() {
    // Random spots: grass can turn to forest if nearby forest, dirt can heal
    const rx = Math.floor(Math.random() * (this.width - 2)) + 1;
    const ry = Math.floor(Math.random() * (this.height - 2)) + 1;

    if (this.tiles[ry][rx] === 'plains') {
      // Check neighbors for forest
      let hasForest = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (this.tiles[ry + dy][rx + dx] === 'forest') hasForest = true;
        }
      }
      if (hasForest && Math.random() < 0.35) {
        this.tiles[ry][rx] = 'forest';
      }
    }
  }

  private updateVillages() {
    for (const village of this.villages) {
      this.normalizeVillage(village);

      // Passive food from legacy farms and windmill-tended fields
      const farms = village.buildings.filter(b => b.type === 'farm');
      this.updateWindmillFields(village);
      village.resources.food += farms.length * 2 + Math.floor(village.farmland.length / 4);

      this.updateMines(village);

      // Check count of alive villagers
      const citizens = this.entities.filter(e => e.ownerVillageId === village.id && e.alive);
      village.population = citizens.length;

      // Housing: the town hall and every house shelter a fixed number of residents
      village.maxPopulation = this.getHomes(village).length * HOUSE_CAPACITY;
      this.assignHomes(village, citizens);

      if (village.buildings.some(b => b.type === 'park')) {
        const park = village.buildings.find(b => b.type === 'park')!;
        for (const c of citizens) {
          if (c.health < c.maxHealth && Math.hypot(c.x - park.x, c.y - park.y) <= 6) {
            c.health = Math.min(c.maxHealth, c.health + 2);
          }
        }
      }

      // Village chief succession: hereditary first, otherwise the most skilled citizen
      const leader = citizens.find(e => e.id === village.leaderId);
      if (!leader && citizens.length > 0) {
        const previousLeaderId = village.leaderId;
        const bySkill = (a: Entity, b: Entity) => this.getSkillScore(b) - this.getSkillScore(a);
        const heir = previousLeaderId
          ? citizens
              .filter(c => c.parentId === previousLeaderId || c.motherId === previousLeaderId || c.fatherId === previousLeaderId)
              .sort(bySkill)[0]
          : undefined;
        const successor = heir ?? [...citizens].sort(bySkill)[0];
        this.crownVillageLeader(village, successor, heir ? 'inherit' : 'elect', previousLeaderId);
      } else if (
        leader &&
        citizens.length >= 3 &&
        Math.random() < (village.buildings.some(b => b.type === 'park') ? 0.008 : 0.02)
      ) {
        this.attemptCoup(village, leader, citizens);
      }

      // Check for building construction if resources allow (increased building cap to 60)
      if (village.resources.wood >= 12 && village.resources.stone >= 8 && village.buildings.length < 60) {
        this.attemptVillageConstruction(village);
      }

      // Check for boat construction if village has docks (or is coastal) and has wood
      const hasDocks = village.buildings.some(b => b.type === 'docks');
      const activeVillageBoats = this.boats.filter(b => b.villageId === village.id);
      if (hasDocks && village.resources.wood >= 35 && activeVillageBoats.length < 2 && Math.random() < 0.35) {
        const shore = this.findShorelineTile(village);
        if (shore) {
          village.resources.wood -= 35;
          const boat: Boat = {
            id: this.getUniqueId('boat'),
            name: `Thuyền Carrack ${village.name}`,
            villageId: village.id,
            kingdomId: village.kingdomId,
            x: shore.waterX,
            y: shore.waterY,
            facing: 'right',
            passengerIds: [],
            capacity: 5,
            health: 350,
            maxHealth: 350,
            state: 'MOORED',
          };
          this.boats.push(boat);
          this.createPuff(shore.waterX, shore.waterY, '#38bdf8', 8);
          const kingdom = this.getKingdom(village.kingdomId);
          this.addHistoryEvent(
            'Hạ thủy đại chiến thuyền Carrack',
            `Làng ven biển ${village.name} đã hoàn thành đóng chiến thuyền Carrack châu Âu tráng lệ vươn ra đại dương!`,
            'kingdom',
            kingdom?.bannerColor
          );
        }
      }

      // Expand territory as population grows or more building space is needed
      const needsExpansion =
        village.population > village.territory.length / 6 ||
        village.buildings.length > village.territory.length / 3.5;
      if (needsExpansion && Math.random() < 0.45) {
        this.expandVillageTerritory(village);
      }
    }

    // Filter out destroyed villages
    for (let i = this.villages.length - 1; i >= 0; i--) {
      const v = this.villages[i];
      const townHall = v.buildings.find(b => b.type === 'town_hall');
      if (!townHall || townHall.health <= 0 || (v.population === 0 && this.tickCount > 200)) {
        // Town has fallen
        const kingdom = this.getKingdom(v.kingdomId);
        this.addHistoryEvent(
          'Làng mạc sụp đổ',
          `Thị trấn ${v.name} thuộc ${kingdom?.name || 'Vương quốc'} đã bị hủy diệt hoặc bỏ hoang.`,
          'war',
          '#ef4444'
        );
        this.villages.splice(i, 1);
        if (kingdom) {
          kingdom.villages = kingdom.villages.filter(id => id !== v.id);
        }
      }
    }

    // Filter out kingdoms with 0 villages and 0 citizens
    for (let i = this.kingdoms.length - 1; i >= 0; i--) {
      const k = this.kingdoms[i];
      const hasCitizens = this.entities.some(e => e.ownerKingdomId === k.id && e.alive);
      if (k.villages.length === 0 && !hasCitizens) {
        this.addHistoryEvent('Vương triều sụp đổ', `Vương quốc ${k.name} đã chính thức tan rã vào dĩ vãng.`, 'kingdom', '#6b7280');
        this.kingdoms.splice(i, 1);
      }
    }
  }

  public getSkillScore(e: Entity): number {
    let score = e.level * 10 + e.kills * 4 + e.attackPower + e.defense * 1.5 + e.health / 10;
    for (const t of e.traits) {
      const category = TRAIT_DEFINITIONS[t]?.category;
      if (category === 'positive') score += 8;
      else if (category === 'negative') score -= 6;
    }
    return Math.max(1, score);
  }

  private crownVillageLeader(
    village: Village,
    newLeader: Entity,
    reason: 'inherit' | 'elect' | 'coup',
    previousLeaderId?: string
  ) {
    village.leaderId = newLeader.id;
    village.leaderSinceYear = this.year;
    const kingdom = this.getKingdom(village.kingdomId);
    const color = kingdom?.bannerColor;

    if (reason === 'inherit') {
      this.addHistoryEvent(
        'Cha truyền con nối',
        `${newLeader.name} kế thừa ngôi trưởng làng ${village.name} từ cha mẹ mình.`,
        'kingdom',
        color
      );
    } else if (reason === 'elect') {
      this.addHistoryEvent(
        'Trưởng làng mới',
        `Dân làng ${village.name} tôn ${newLeader.name} (Cấp ${newLeader.level}) — người tài giỏi nhất — làm trưởng làng.`,
        'kingdom',
        color
      );
    }

    if (kingdom) {
      const kingAlive = kingdom.kingId && this.entities.some(e => e.id === kingdom.kingId && e.alive);
      if (!kingAlive || kingdom.kingId === previousLeaderId) {
        kingdom.kingId = newLeader.id;
        this.addHistoryEvent(
          'Vua mới lên ngôi',
          `${newLeader.name} lên ngai vàng của Vương quốc ${kingdom.name}.`,
          'kingdom',
          kingdom.bannerColor
        );
      }
    }
  }

  private attemptCoup(village: Village, leader: Entity, citizens: Entity[]) {
    const leaderScore = this.getSkillScore(leader);
    const challenger = citizens
      .filter(c => c.id !== leader.id && !c.onBoat && c.age >= 16 && !c.traits.includes('Peaceful'))
      .sort((a, b) => this.getSkillScore(b) - this.getSkillScore(a))[0];
    if (!challenger) return;

    const challengerScore = this.getSkillScore(challenger);
    const ambition = challenger.traits.includes('Bloodthirsty') ? 1.1 : 1.3;
    if (challengerScore < leaderScore * ambition) return;
    if (Math.random() > 0.35) return;

    const kingdom = this.getKingdom(village.kingdomId);
    const successChance = challengerScore / (challengerScore + leaderScore);

    if (Math.random() < successChance) {
      leader.alive = false;
      leader.health = 0;
      this.createPuff(leader.x, leader.y, '#dc2626', 10);
      challenger.kills += 1;
      this.addHistoryEvent(
        'Đảo chính thành công',
        `${challenger.name} lật đổ và hạ sát trưởng làng ${leader.name}, cướp ngôi làng ${village.name}!`,
        'war',
        '#dc2626'
      );
      this.crownVillageLeader(village, challenger, 'coup', leader.id);
    } else {
      challenger.alive = false;
      challenger.health = 0;
      this.createPuff(challenger.x, challenger.y, '#dc2626', 10);
      leader.kills += 1;
      this.addHistoryEvent(
        'Đảo chính thất bại',
        `${challenger.name} mưu phản tại ${village.name} nhưng bị trưởng làng ${leader.name} trấn áp.`,
        'war',
        kingdom?.bannerColor
      );
    }
  }

  private expandVillageTerritory(village: Village) {
    let added = 0;
    for (let attempt = 0; attempt < 6 && added < 2; attempt++) {
      const current = village.territory[Math.floor(Math.random() * village.territory.length)];
      if (!current) break;
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 1 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
      ];
      for (const d of dirs) {
        const nx = current.x + d.dx;
        const ny = current.y + d.dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (isWalkable(this.tiles[ny][nx])) {
            const alreadyClaimed = this.villages.some(v => v.territory.some(t => t.x === nx && t.y === ny));
            if (!alreadyClaimed) {
              village.territory.push({ x: nx, y: ny });
              added++;
              break;
            }
          }
        }
      }
    }
  }

  public isCoastalVillage(village: Village): boolean {
    for (const t of village.territory) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = t.x + dx;
          const ny = t.y + dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            const tile = this.tiles[ny][nx];
            if (tile === 'shallow_water' || tile === 'deep_water') {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  public findShorelineTile(village: Village): { x: number; y: number; waterX: number; waterY: number } | null {
    for (const t of village.territory) {
      if (isWalkable(this.tiles[t.y]?.[t.x])) {
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];
        for (const d of dirs) {
          const wx = t.x + d.dx;
          const wy = t.y + d.dy;
          if (wx >= 0 && wx < this.width && wy >= 0 && wy < this.height) {
            const tile = this.tiles[wy][wx];
            if (tile === 'shallow_water' || tile === 'deep_water') {
              return { x: t.x, y: t.y, waterX: wx, waterY: wy };
            }
          }
        }
      }
    }
    return null;
  }

  public isWaterAt(x: number, y: number): boolean {
    const rx = Math.round(x);
    const ry = Math.round(y);
    if (rx < 0 || rx >= this.width || ry < 0 || ry >= this.height) return false;
    return isWater(this.tiles[ry]?.[rx]);
  }

  public findNearestWaterTile(x: number, y: number, maxRadius: number = 3): { x: number; y: number } | null {
    const cx = Math.round(x);
    const cy = Math.round(y);
    for (let r = 1; r <= maxRadius; r++) {
      let candidate: { x: number; y: number; dist: number } | null = null;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            if (isWater(this.tiles[ny]?.[nx])) {
              const d = Math.hypot(dx, dy);
              if (!candidate || d < candidate.dist) {
                candidate = { x: nx, y: ny, dist: d };
              }
            }
          }
        }
      }
      if (candidate) {
        return { x: candidate.x, y: candidate.y };
      }
    }
    return null;
  }

  public findWaterPath(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    maxSearchNodes: number = 3500
  ): { x: number; y: number }[] | null {
    const sx = Math.round(startX);
    const sy = Math.round(startY);
    const tx = Math.round(targetX);
    const ty = Math.round(targetY);

    if (sx === tx && sy === ty) return [{ x: tx, y: ty }];
    if (!this.isWaterAt(sx, sy) || !this.isWaterAt(tx, ty)) return null;

    const queue: [number, number][] = [[sx, sy]];
    const cameFrom = new Map<number, number>();
    const visited = new Uint8Array(this.width * this.height);

    const toKey = (x: number, y: number) => y * this.width + x;
    const startKey = toKey(sx, sy);
    const targetKey = toKey(tx, ty);

    visited[startKey] = 1;

    const cardinalDirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];

    let nodes = 0;
    let found = false;

    while (queue.length > 0 && nodes < maxSearchNodes) {
      nodes++;
      const [cx, cy] = queue.shift()!;
      const curKey = toKey(cx, cy);

      if (cx === tx && cy === ty) {
        found = true;
        break;
      }

      for (let i = 0; i < cardinalDirs.length; i++) {
        const [dx, dy] = cardinalDirs[i];
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

        // Diagonal checks: never cut across diagonal land corners
        if (dx !== 0 && dy !== 0) {
          if (!isWater(this.tiles[cy]?.[nx]) || !isWater(this.tiles[ny]?.[cx])) {
            continue;
          }
        }

        const tile = this.tiles[ny]?.[nx];
        if (!isWater(tile)) continue;

        const nKey = toKey(nx, ny);
        if (visited[nKey] === 1) continue;

        visited[nKey] = 1;
        cameFrom.set(nKey, curKey);
        queue.push([nx, ny]);
      }
    }

    if (!found) return null;

    const path: { x: number; y: number }[] = [];
    let curr = targetKey;
    while (curr !== startKey) {
      const py = Math.floor(curr / this.width);
      const px = curr % this.width;
      path.unshift({ x: px, y: py });
      const parent = cameFrom.get(curr);
      if (parent === undefined) break;
      curr = parent;
    }

    return path;
  }

  public findUncolonizedIslandTarget(
    originVillageId: string
  ): { x: number; y: number; waterX: number; waterY: number } | null {
    const originVillage = this.getVillage(originVillageId);
    const ox = originVillage?.x ?? this.width / 2;
    const oy = originVillage?.y ?? this.height / 2;

    const candidates: { x: number; y: number; waterX: number; waterY: number; dist: number }[] = [];

    // Search for distant coastal land tiles across ocean
    for (let attempt = 0; attempt < 120; attempt++) {
      const rx = Math.floor(Math.random() * (this.width - 6)) + 3;
      const ry = Math.floor(Math.random() * (this.height - 6)) + 3;
      const tile = this.tiles[ry][rx];

      if (isWalkable(tile)) {
        const dist = Math.hypot(rx - ox, ry - oy);
        // Distant island / shore (>= 14 tiles away)
        if (dist >= 14) {
          // Must not be near any existing village
          const nearAnyVillage = this.villages.some(v => Math.hypot(v.x - rx, v.y - ry) < 11);
          if (!nearAnyVillage) {
            // Find adjacent water landing tile for the boat
            const dirs = [
              { dx: 1, dy: 0 },
              { dx: -1, dy: 0 },
              { dx: 0, dy: 1 },
              { dx: 0, dy: -1 },
              { dx: 1, dy: 1 },
              { dx: -1, dy: -1 },
              { dx: 1, dy: -1 },
              { dx: -1, dy: 1 },
            ];
            for (const d of dirs) {
              const wx = rx + d.dx;
              const wy = ry + d.dy;
              if (wx >= 0 && wx < this.width && wy >= 0 && wy < this.height) {
                if (isWater(this.tiles[wy]?.[wx])) {
                  candidates.push({ x: rx, y: ry, waterX: wx, waterY: wy, dist });
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  public foundColonyVillage(founder: Entity, kingdom: Kingdom, landX: number, landY: number): Village {
    const prefix = KINGDOM_PREFIXES[Math.floor(Math.random() * KINGDOM_PREFIXES.length)];
    const villageName = `Tân ${prefix} (${kingdom.name})`;
    const villageId = this.getUniqueId('vlg');

    const territory: { x: number; y: number }[] = [];
    const radius = 3;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = landX + dx;
        const ty = landY + dy;
        if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
          if (isWalkable(this.tiles[ty][tx])) {
            territory.push({ x: tx, y: ty });
          }
        }
      }
    }

    const townHall: Building = {
      id: this.getUniqueId('bld'),
      villageId,
      type: 'town_hall',
      x: landX,
      y: landY,
      health: 300,
      maxHealth: 300,
      level: 1,
    };

    const village: Village = {
      id: villageId,
      kingdomId: kingdom.id,
      name: villageName,
      leaderId: founder.id,
      x: landX,
      y: landY,
      territory,
      resources: {
        wood: 40,
        stone: 25,
        food: 60,
        gold: 15,
        iron: 0,
        mithril: 0,
        adamantite: 0,
      },
      farmland: [],
      population: 1,
      maxPopulation: 6,
      buildings: [townHall],
    };

    kingdom.villages.push(villageId);
    this.villages.push(village);

    founder.ownerKingdomId = kingdom.id;
    founder.ownerVillageId = villageId;

    this.addHistoryEvent(
      'Khai phá thuộc địa mới',
      `Đoàn thuyền từ Vương quốc ${kingdom.name} do ${founder.name} chỉ huy đã vượt đại dương và khai lập thuộc địa ${villageName}!`,
      'kingdom',
      kingdom.bannerColor
    );

    return village;
  }

  public updateBoats() {
    const activeBoats: Boat[] = [];

    for (const boat of this.boats) {
      if (boat.health <= 0) {
        for (const pid of boat.passengerIds) {
          const p = this.entities.find(e => e.id === pid);
          if (p) {
            p.onBoat = false;
            p.boatId = undefined;
          }
        }
        this.createPuff(boat.x, boat.y, '#38bdf8', 12);
        continue;
      }

      // Enforce water constraint: boat MUST NEVER exist on land!
      if (!this.isWaterAt(boat.x, boat.y)) {
        const waterSpot = this.findNearestWaterTile(boat.x, boat.y, 4);
        if (waterSpot) {
          boat.x = waterSpot.x;
          boat.y = waterSpot.y;
        } else {
          // Stranded deep inland with no nearby water: wreck boat and disembark
          for (const pid of boat.passengerIds) {
            const p = this.entities.find(e => e.id === pid);
            if (p) {
              p.onBoat = false;
              p.boatId = undefined;
            }
          }
          this.createPuff(boat.x, boat.y, '#78350f', 12);
          boat.health = 0;
          continue;
        }
      }

      const passengers = this.entities.filter(e => boat.passengerIds.includes(e.id) && e.alive);
      boat.passengerIds = passengers.map(p => p.id);

      for (const p of passengers) {
        p.x = boat.x;
        p.y = boat.y;
        p.onBoat = true;
        p.boatId = boat.id;
      }

      if (boat.state === 'MOORED') {
        // Invite nearby villagers aboard for exploration
        if (passengers.length < boat.capacity) {
          const candidate = this.entities.find(
            e =>
              e.alive &&
              isCivilized(e.species) &&
              e.ownerVillageId === boat.villageId &&
              !e.onBoat &&
              Math.hypot(e.x - boat.x, e.y - boat.y) <= 8
          );
          if (candidate && Math.random() < 0.12) {
            candidate.onBoat = true;
            candidate.boatId = boat.id;
            boat.passengerIds.push(candidate.id);
            if (!candidate.traits.includes('Seafarer') && Math.random() < 0.4) {
              candidate.traits.push('Seafarer');
              candidate.defense += 2;
            }
          }
        }

        // Set voyage target to uncolonized island with a valid water route
        if (boat.passengerIds.length >= 1 && Math.random() < 0.15) {
          const dest = this.findUncolonizedIslandTarget(boat.villageId);
          if (dest) {
            const waterRoute = this.findWaterPath(boat.x, boat.y, dest.waterX, dest.waterY);
            if (waterRoute && waterRoute.length > 0) {
              boat.destinationIsland = dest;
              boat.targetX = dest.waterX; // Navigate strictly on water!
              boat.targetY = dest.waterY;
              boat.path = waterRoute;
              boat.state = 'VOYAGING';
              boat.facing = dest.waterX >= boat.x ? 'right' : 'left';
              const village = this.getVillage(boat.villageId);
              const kingdom = this.getKingdom(boat.kingdomId);
              this.addHistoryEvent(
                'Dong buồm Carrack thám hiểm',
                `Đại chiến thuyền Carrack chở ${boat.passengerIds.length} nhà thám hiểm từ ${village?.name || 'làng ven biển'} đã giương buồm vượt đại dương!`,
                'nature',
                kingdom?.bannerColor || '#38bdf8'
              );
            }
          }
        }
      } else if (boat.state === 'VOYAGING' || boat.state === 'COLONIZING') {
        if (boat.targetX !== undefined && boat.targetY !== undefined) {
          // If path is missing or empty, attempt to compute water route
          if (!boat.path || boat.path.length === 0) {
            const dist = Math.hypot(boat.targetX - boat.x, boat.targetY - boat.y);
            if (dist > 1.0) {
              boat.path = this.findWaterPath(boat.x, boat.y, boat.targetX, boat.targetY) || [];
            }
          }

          // Advance along waypoints
          if (boat.path && boat.path.length > 0) {
            const wp = boat.path[0];
            if (Math.hypot(wp.x - boat.x, wp.y - boat.y) <= 0.45) {
              boat.path.shift();
            }
          }

          const distToTarget = Math.hypot(boat.targetX - boat.x, boat.targetY - boat.y);
          const hasArrived = (!boat.path || boat.path.length === 0) && distToTarget <= 0.85;

          if (hasArrived) {
            // Arrived at coastal water mooring! Disembark colonists to target land
            const dest = boat.destinationIsland;
            if (dest && isWalkable(this.tiles[dest.y]?.[dest.x]) && passengers.length > 0) {
              const kingdom = this.getKingdom(boat.kingdomId);
              const leader = passengers[0];
              if (kingdom && leader) {
                const newVillage = this.foundColonyVillage(leader, kingdom, dest.x, dest.y);
                for (const p of passengers) {
                  p.ownerVillageId = newVillage.id;
                  p.ownerKingdomId = kingdom.id;
                  p.onBoat = false;
                  p.boatId = undefined;
                  p.x = dest.x;
                  p.y = dest.y;
                }
                newVillage.population = passengers.length;
                boat.passengerIds = [];
                boat.villageId = newVillage.id;
                boat.state = 'MOORED';
                boat.targetX = undefined;
                boat.targetY = undefined;
                boat.path = undefined;
                boat.destinationIsland = undefined;
                this.createPuff(boat.x, boat.y, '#38bdf8', 12);
                this.createPuff(dest.x, dest.y, '#f59e0b', 12);
              }
            } else {
              boat.state = 'MOORED';
              boat.targetX = undefined;
              boat.targetY = undefined;
              boat.path = undefined;
            }
          } else {
            // Step towards next waypoint or target strictly on water
            const nextGoal = (boat.path && boat.path.length > 0) ? boat.path[0] : { x: boat.targetX, y: boat.targetY };
            const dx = nextGoal.x - boat.x;
            const dy = nextGoal.y - boat.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0.001) {
              const hasSeafarer = passengers.some(p => p.traits.includes('Seafarer'));
              const speed = hasSeafarer ? 0.22 : 0.16;
              const step = Math.min(speed, dist);
              const nextX = boat.x + (dx / dist) * step;
              const nextY = boat.y + (dy / dist) * step;

              // Strictly verify water at next coordinate
              if (this.isWaterAt(nextX, nextY)) {
                boat.x = nextX;
                boat.y = nextY;
                boat.facing = dx >= 0 ? 'right' : 'left';
              } else if (this.isWaterAt(nextX, boat.y)) {
                // Slip along X
                boat.x = nextX;
                boat.facing = dx >= 0 ? 'right' : 'left';
              } else if (this.isWaterAt(boat.x, nextY)) {
                // Slip along Y
                boat.y = nextY;
              } else {
                // Path blocked by terrain change: recalculate
                boat.path = this.findWaterPath(boat.x, boat.y, boat.targetX, boat.targetY) || [];
                if (boat.path.length === 0) {
                  boat.state = 'MOORED';
                }
              }

              if (this.tickCount % 4 === 0) {
                this.createPuff(boat.x - (dx / dist) * 0.4, boat.y - (dy / dist) * 0.4, '#e0f2fe', 1);
              }
            }
          }
        } else {
          boat.state = 'MOORED';
        }
      }

      activeBoats.push(boat);
    }

    this.boats = activeBoats;
  }

  private attemptVillageConstruction(village: Village) {
    let buildType: BuildingType = 'house';
    const count = (type: BuildingType) => village.buildings.filter(b => b.type === type).length;
    const houses = count('house');
    const windmills = count('windmill');
    const mines = count('mine');
    const watchtowers = count('watchtower');
    const granaries = count('granary');
    const parks = count('park');
    const hasDocks = count('docks') > 0;
    const isCoastal = this.isCoastalVillage(village);
    const homesFull = village.population >= village.maxPopulation - 1;
    const canMine = this.findMineSite(village) !== null;

    // Prioritize building a coastal docks if near water to enable naval travel
    if (isCoastal && !hasDocks && village.resources.wood >= 25 && village.resources.stone >= 15) {
      buildType = 'docks';
    } else if (houses < 2 || (homesFull && houses < 35) || (houses < 22 && Math.random() < 0.45)) {
      buildType = 'house';
    } else if (windmills < 1 || (village.resources.food < 40 && windmills < 5)) {
      buildType = 'windmill';
    } else if (granaries < 1 && houses >= 3) {
      buildType = 'granary';
    } else if (canMine && mines < 1) {
      buildType = 'mine';
    } else if (parks < 1 && village.population >= 6) {
      buildType = 'park';
    } else if (watchtowers < 2) {
      buildType = 'watchtower';
    } else if (houses < 35) {
      buildType = 'house';
    } else if (canMine && mines < 3 && village.population >= 10) {
      buildType = 'mine';
    } else if (windmills < 5 && village.population >= 10) {
      buildType = 'windmill';
    } else if (granaries < 3) {
      buildType = 'granary';
    } else if (watchtowers < 4) {
      buildType = 'watchtower';
    } else if (parks < 3) {
      buildType = 'park';
    } else {
      buildType = 'house';
    }

    if (buildType === 'docks') {
      const shore = this.findShorelineTile(village);
      if (shore) {
        village.resources.wood -= 25;
        village.resources.stone -= 15;
        const newBuilding: Building = {
          id: this.getUniqueId('bld'),
          villageId: village.id,
          type: 'docks',
          x: shore.x,
          y: shore.y,
          health: 200,
          maxHealth: 200,
          level: 1,
        };
        village.buildings.push(newBuilding);
        this.createSparks(shore.x, shore.y, '#38bdf8', 8);
        const kingdom = this.getKingdom(village.kingdomId);
        this.addHistoryEvent(
          'Khánh thành Bến cảng',
          `Làng ven biển ${village.name} đã hoàn tất xây dựng Bến cảng để đóng tàu và chinh phục đại dương!`,
          'kingdom',
          kingdom?.bannerColor
        );
        return;
      }
    }

    const cost = BUILDING_COSTS[buildType] ?? BUILDING_COSTS.house!;
    if (village.resources.wood < cost.wood || village.resources.stone < cost.stone) return;

    let spot: { x: number; y: number } | null = null;
    if (buildType === 'mine') {
      spot = this.findMineSite(village);
    } else {
      const candidateTiles = village.territory.filter(t => this.isFreeBuildTile(t.x, t.y));
      if (candidateTiles.length > 0) {
        // Houses cluster near the town center; windmills prefer open land farther out
        candidateTiles.sort((a, b) => {
          const da = Math.hypot(a.x - village.x, a.y - village.y);
          const db = Math.hypot(b.x - village.x, b.y - village.y);
          return buildType === 'windmill' ? db - da : da - db;
        });
        const pool = candidateTiles.slice(0, Math.max(3, Math.ceil(candidateTiles.length / 3)));
        spot = pool[Math.floor(Math.random() * pool.length)];
      }
    }
    if (!spot) return;

    village.resources.wood -= cost.wood;
    village.resources.stone -= cost.stone;
    village.buildings.push({
      id: this.getUniqueId('bld'),
      villageId: village.id,
      type: buildType,
      x: spot.x,
      y: spot.y,
      health: cost.health,
      maxHealth: cost.health,
      level: 1,
    });
    this.createSparks(spot.x, spot.y, '#f59e0b', 6);

    if (buildType === 'windmill' || buildType === 'mine' || buildType === 'park') {
      const kingdom = this.getKingdom(village.kingdomId);
      this.addHistoryEvent(
        `Khánh thành ${BUILDING_LABELS[buildType]}`,
        `Làng ${village.name} đã xây dựng ${BUILDING_LABELS[buildType].toLowerCase()} mới.`,
        'kingdom',
        kingdom?.bannerColor
      );
    }
  }

  public placeBuildingAt(type: BuildingType, x: number, y: number): Building | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;

    // Find nearest village or create one
    let targetVillage: Village | undefined = this.villages.find(v => Math.hypot(v.x - x, v.y - y) <= 25);
    if (!targetVillage) {
      if (this.villages.length > 0) {
        targetVillage = this.villages[0];
      } else {
        const founder = this.spawnEntity('human', x, y, ['Genius']);
        targetVillage = this.foundKingdomAndVillage(founder).village;
      }
    }
    if (!targetVillage) return null;

    // Ensure territory includes this tile
    if (!targetVillage.territory.some(t => t.x === x && t.y === y)) {
      targetVillage.territory.push({ x, y });
    }

    const cost = BUILDING_COSTS[type] ?? { health: 150 };
    const building: Building = {
      id: this.getUniqueId('bld'),
      villageId: targetVillage.id,
      type,
      x,
      y,
      health: cost.health,
      maxHealth: cost.health,
      level: 1,
    };
    targetVillage.buildings.push(building);

    // If windmill, plow surrounding farmland ring immediately (matching WorldBox screenshot)
    if (type === 'windmill') {
      targetVillage.farmland ??= [];
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (Math.hypot(dx, dy) <= 4.2) {
            const fx = x + dx;
            const fy = y + dy;
            if (fx >= 0 && fx < this.width && fy >= 0 && fy < this.height) {
              if (this.tiles[fy][fx] === 'plains' && !this.isBuildingAt(fx, fy)) {
                if (!targetVillage.farmland.some(f => f.x === fx && f.y === fy)) {
                  targetVillage.farmland.push({ x: fx, y: fy });
                }
              }
            }
          }
        }
      }
    }

    this.createSparks(x, y, '#f59e0b', 10);
    const kingdom = this.getKingdom(targetVillage.kingdomId);
    this.addHistoryEvent(
      `Thần linh giáng tạo ${BUILDING_LABELS[type]}`,
      `Một công trình ${BUILDING_LABELS[type]} tráng lệ đã được Thần linh đặt tại ${targetVillage.name}!`,
      'kingdom',
      kingdom?.bannerColor
    );

    return building;
  }

  private normalizeVillage(village: Village) {
    village.resources.iron ??= 0;
    village.resources.mithril ??= 0;
    village.resources.adamantite ??= 0;
    village.farmland ??= [];
  }

  private isFarmland(x: number, y: number): boolean {
    return this.villages.some(v => v.farmland?.some(f => f.x === x && f.y === y));
  }

  private isBuildingAt(x: number, y: number): boolean {
    return this.villages.some(v => v.buildings.some(b => b.x === x && b.y === y));
  }

  private isFreeBuildTile(x: number, y: number): boolean {
    return this.tiles[y]?.[x] === 'plains' && !this.isBuildingAt(x, y) && !this.isFarmland(x, y);
  }

  private getHomes(village: Village): Building[] {
    return village.buildings.filter(b => b.type === 'house' || b.type === 'town_hall');
  }

  private assignHomes(village: Village, citizens: Entity[]) {
    const homes = this.getHomes(village);
    const occupancy = new Map<string, number>(homes.map(h => [h.id, 0]));
    for (const c of citizens) {
      if (c.homeId && occupancy.has(c.homeId) && occupancy.get(c.homeId)! < HOUSE_CAPACITY) {
        occupancy.set(c.homeId, occupancy.get(c.homeId)! + 1);
      } else {
        c.homeId = undefined;
      }
    }
    for (const c of citizens) {
      if (c.homeId) continue;
      const free = homes.find(h => occupancy.get(h.id)! < HOUSE_CAPACITY);
      if (!free) break;
      c.homeId = free.id;
      occupancy.set(free.id, occupancy.get(free.id)! + 1);
    }
  }

  private updateWindmillFields(village: Village) {
    const windmills = village.buildings.filter(b => b.type === 'windmill');
    const inRange = (f: { x: number; y: number }) =>
      windmills.some(w => Math.hypot(f.x - w.x, f.y - w.y) <= WINDMILL_FIELD_RADIUS);

    // Fields wither when their windmill is destroyed or the land is no longer arable
    village.farmland = village.farmland.filter(
      f => this.tiles[f.y]?.[f.x] === 'plains' && inRange(f) && !this.isBuildingAt(f.x, f.y)
    );

    for (const mill of windmills) {
      const millFields = village.farmland.filter(
        f => Math.hypot(f.x - mill.x, f.y - mill.y) <= WINDMILL_FIELD_RADIUS
      ).length;
      if (millFields >= MAX_FIELDS_PER_WINDMILL) continue;

      // Plow outward ring by ring so fields grow as a circle around the mill
      let plowed = 0;
      for (let r = 1; r <= WINDMILL_FIELD_RADIUS && plowed < 2; r++) {
        for (let dy = -r; dy <= r && plowed < 2; dy++) {
          for (let dx = -r; dx <= r && plowed < 2; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            if (Math.hypot(dx, dy) > WINDMILL_FIELD_RADIUS) continue;
            const fx = mill.x + dx;
            const fy = mill.y + dy;
            if (!this.isFreeBuildTile(fx, fy)) continue;
            village.farmland.push({ x: fx, y: fy });
            plowed++;
          }
        }
      }
    }
  }

  private findMineSite(village: Village): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    const range = 8;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const x = village.x + dx;
        const y = village.y + dy;
        if (this.tiles[y]?.[x] !== 'mountain' || this.isBuildingAt(x, y)) continue;
        const dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          best = { x, y };
          bestDist = dist;
        }
      }
    }
    return best;
  }

  private updateMines(village: Village) {
    const mines = village.buildings.filter(b => b.type === 'mine');
    if (mines.length === 0) return;
    const species = this.getKingdom(village.kingdomId)?.species;
    const r = village.resources;
    for (const mine of mines) {
      r.iron += 2;
      r.stone += 1;
      if (Math.random() < 0.3) r.gold += 1;
      // Elves treasure mithril; dwarves delve deepest for adamantite
      if (Math.random() < (species === 'elf' ? 0.25 : 0.06)) r.mithril += 1;
      if (Math.random() < (species === 'dwarf' ? 0.2 : 0.04)) r.adamantite += 1;
      if (Math.random() < 0.3) this.createSparks(mine.x, mine.y, '#cbd5e1', 2);
    }
  }

  private updateKingdomDiplomacyYearly() {
    if (this.kingdoms.length < 2) return;

    for (let i = 0; i < this.kingdoms.length; i++) {
      for (let j = i + 1; j < this.kingdoms.length; j++) {
        const kA = this.kingdoms[i];
        const kB = this.kingdoms[j];

        // Shift relation slightly
        let rel = kA.relations[kB.id] ?? 0;
        const drift = Math.floor(Math.random() * 15 - 7);
        rel = Math.max(-100, Math.min(100, rel + drift));

        kA.relations[kB.id] = rel;
        kB.relations[kA.id] = rel;

        const isCurrentlyAtWar = kA.enemyKingdomIds.includes(kB.id);

        if (!isCurrentlyAtWar && rel <= -45 && this.worldLaws.kingdomWars && !this.worldLaws.peacefulMode) {
          // Declare War
          kA.enemyKingdomIds.push(kB.id);
          kB.enemyKingdomIds.push(kA.id);
          this.addHistoryEvent(
            'Chiến tranh bùng nổ!',
            `Vương quốc ${kA.name} và ${kB.name} đã chính thức tuyên chiến do thù địch lãnh thổ!`,
            'war',
            '#ef4444'
          );
        } else if (isCurrentlyAtWar && (rel >= 15 || this.worldLaws.peacefulMode)) {
          // Sign Peace
          kA.enemyKingdomIds = kA.enemyKingdomIds.filter(id => id !== kB.id);
          kB.enemyKingdomIds = kB.enemyKingdomIds.filter(id => id !== kA.id);
          this.addHistoryEvent(
            'Hiệp ước hòa bình ký kết',
            `Sau thời gian giao tranh, ${kA.name} và ${kB.name} đã đồng ý đình chiến lập lại hòa bình.`,
            'kingdom',
            '#10b981'
          );
        }
      }
    }
  }

  private updateEntities() {
    const aliveEntities: Entity[] = [];

    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (!e.alive) continue;

      // 1. Aging and Hunger
      if (this.tickCount % 60 === 0 && this.worldLaws.aging) {
        if (!e.traits.includes('Immortal')) {
          e.age += 1;
          const deathAge = isCivilized(e.species) ? 75 : 20;
          if (e.age >= deathAge && Math.random() < 0.2) {
            e.alive = false;
            this.createPuff(e.x, e.y, '#9ca3af', 8);
            continue;
          }
        }
      }

      if (this.worldLaws.hunger && this.tickCount % 30 === 0) {
        const drain = e.traits.includes('Glutton') ? 2 : 1;
        e.hunger = Math.max(0, e.hunger - drain);
        if (e.hunger === 0) {
          e.health -= 5;
          if (e.health <= 0) {
            e.alive = false;
            this.createPuff(e.x, e.y, '#dc2626', 6);
            continue;
          }
        }
      }

      // 2. Health regeneration if well-fed or has Regeneration trait
      if ((e.hunger > 60 && this.tickCount % 20 === 0) || (e.traits.includes('Regeneration') && this.tickCount % 15 === 0)) {
        if (e.health < e.maxHealth) {
          const healAmount = e.traits.includes('Regeneration') ? 4 : 3;
          e.health = Math.min(e.maxHealth, e.health + healAmount);
        }
      }

      // 3. Environmental damage (lava or fire)
      const currentTile = this.tiles[Math.round(e.y)]?.[Math.round(e.x)];
      if (currentTile === 'lava' && !e.traits.includes('Fireproof')) {
        e.health -= 25;
        this.createSparks(e.x, e.y, '#f97316', 5);
        if (e.health <= 0) {
          e.alive = false;
          continue;
        }
      }

      // 4. AI State & Decision
      this.stepEntityAI(e);

      aliveEntities.push(e);
    }

    this.entities = aliveEntities;
  }

  private stepEntityAI(e: Entity) {
    // If entity is currently aboard a boat, its location and navigation are handled by the boat!
    if (e.onBoat) {
      e.state = 'REST';
      return;
    }

    e.actionTimer = (e.actionTimer || 0) - 1;

    // Movement speed factor
    const moveStep = 0.15 * e.speed;

    // A. Civilized creatures: can found village if unassigned, on walkable land, and no villages nearby
    if (isCivilized(e.species) && !e.ownerVillageId && isWalkable(this.tiles[Math.round(e.y)]?.[Math.round(e.x)])) {
      const nearVillage = this.villages.some(v => {
        const dx = v.x - e.x;
        const dy = v.y - e.y;
        return Math.sqrt(dx * dx + dy * dy) < 14;
      });

      if (!nearVillage && Math.random() < 0.05) {
        this.foundKingdomAndVillage(e);
      } else {
        // Natural wandering join: only if wandering directly within territory of a same-species village
        const localVillage = this.villages.find(v => {
          const k = this.getKingdom(v.kingdomId);
          return (
            k &&
            k.species === e.species &&
            v.population < v.maxPopulation &&
            (v.territory.some(t => t.x === Math.round(e.x) && t.y === Math.round(e.y)) ||
              Math.hypot(v.x - e.x, v.y - e.y) <= 6)
          );
        });
        if (localVillage && Math.random() < 0.05) {
          e.ownerVillageId = localVillage.id;
          e.ownerKingdomId = localVillage.kingdomId;
          localVillage.population += 1;
        }
      }
    }

    // B. Combat & Threat detection
    const enemy = this.findNearbyEnemy(e);
    if (enemy) {
      // Peaceful trait: Flee away from enemies instead of engaging!
      if (e.traits.includes('Peaceful')) {
        e.state = 'EXPLORE';
        const fleeDx = e.x - enemy.x;
        const fleeDy = e.y - enemy.y;
        this.moveTowards(e, e.x + fleeDx * 3, e.y + fleeDy * 3, moveStep * 1.25);
        return;
      }

      e.state = 'FIGHT';
      // Move toward enemy and attack
      const dx = enemy.x - e.x;
      const dy = enemy.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.0) {
        // Attack!
        if (e.actionTimer <= 0) {
          e.actionTimer = 10;
          const bonusAtk = e.traits.includes('Bloodthirsty') ? Math.round(e.attackPower * 0.25) : 0;
          const dmg = Math.max(1, (e.attackPower + bonusAtk) - enemy.defense + Math.floor(Math.random() * 5 - 2));
          enemy.health -= dmg;
          this.createBlood(enemy.x, enemy.y, 4);

          // If enemy survived heavy hit with low HP (< 25%), chance to gain Tough trait
          if (enemy.health > 0 && enemy.health < enemy.maxHealth * 0.25 && !enemy.traits.includes('Tough')) {
            if (Math.random() < 0.25) {
              enemy.traits.push('Tough');
              enemy.defense += 4;
              enemy.maxHealth = Math.round(enemy.maxHealth * 1.2);
            }
          }

          if (enemy.health <= 0) {
            enemy.alive = false;
            e.kills += 1;
            e.level += 1;
            e.attackPower += 2;
            e.maxHealth += 10;
            e.health = Math.min(e.maxHealth, e.health + (e.traits.includes('Bloodthirsty') ? 35 : 15));

            // Dynamic battlefield traits
            if (e.kills >= 3 && !e.traits.includes('Bloodthirsty') && Math.random() < 0.3) {
              e.traits.push('Bloodthirsty');
            }
            if (e.level >= 3 && !e.traits.includes('Strong') && Math.random() < 0.3) {
              e.traits.push('Strong');
              e.attackPower = Math.round(e.attackPower * 1.3);
            }

            // If enemy was a sheep, get food
            if (enemy.species === 'sheep' && e.ownerVillageId) {
              const v = this.getVillage(e.ownerVillageId);
              if (v) v.resources.food += 15;
            }
          }
        }
      } else {
        // Approach
        this.moveTowards(e, enemy.x, enemy.y, moveStep);
      }
      return;
    }

    // C. Needs: Hunger & Gathering
    if (e.hunger < 40) {
      e.state = 'EAT';
      // Try eating from village storage
      if (e.ownerVillageId) {
        const v = this.getVillage(e.ownerVillageId);
        if (v && v.resources.food > 0) {
          v.resources.food -= 1;
          e.hunger = 95;
          return;
        }
      }
      // If sheep, graze grass
      if (e.species === 'sheep') {
        const curTile = this.tiles[Math.round(e.y)]?.[Math.round(e.x)];
        if (curTile === 'plains') {
          e.hunger = 100;
          return;
        }
      }
    }

    // D. Civilized Gathering for village resources
    if (e.ownerVillageId && isCivilized(e.species)) {
      const v = this.getVillage(e.ownerVillageId);
      if (v) {
        const curTile = this.tiles[Math.round(e.y)]?.[Math.round(e.x)];
        const failGather = e.traits.includes('Stupid') && Math.random() < 0.5;
        const gatherBonus = e.traits.includes('Genius') ? 2 : 1;

        if (!failGather && curTile === 'forest' && v.resources.wood < 350) {
          e.state = 'GATHER';
          v.resources.wood += gatherBonus;
          this.createPuff(e.x, e.y, '#15803d', 2);
        } else if (!failGather && curTile === 'mountain' && v.resources.stone < 250) {
          e.state = 'GATHER';
          v.resources.stone += gatherBonus;
          this.createSparks(e.x, e.y, '#94a3b8', 2);
        }

        // Reproduction: a housed adult woman with a nearby adult man, when a home has room
        const home = e.homeId ? v.buildings.find(b => b.id === e.homeId) : undefined;
        if (
          this.worldLaws.animalBreeding &&
          e.gender === 'F' &&
          e.age >= 16 &&
          e.age <= 45 &&
          home &&
          v.population < v.maxPopulation &&
          e.hunger > 60 &&
          Math.random() < 0.016
        ) {
          const father = this.entities.find(
            m =>
              m.alive &&
              !m.onBoat &&
              m.gender === 'M' &&
              m.age >= 16 &&
              m.ownerVillageId === v.id &&
              Math.hypot(m.x - e.x, m.y - e.y) <= 6
          );
          if (father) {
            e.state = 'REPRODUCE';
            const baby = this.spawnEntity(e.species, home.x + (Math.random() - 0.5), home.y + (Math.random() - 0.5));
            baby.ownerVillageId = v.id;
            baby.ownerKingdomId = v.kingdomId;
            baby.parentId = e.id;
            baby.motherId = e.id;
            baby.fatherId = father.id;
            baby.homeId = home.id;
            baby.age = 1;
            v.population += 1;
            this.createPuff(home.x, home.y, '#ec4899', 6);
            return;
          }
        }
      }
    }

    // E. Animals reproduction (halved rate & halved max population caps)
    if (
      this.worldLaws.animalBreeding &&
      !isCivilized(e.species) &&
      e.species !== 'dragon' &&
      e.hunger > 60 &&
      Math.random() < 0.0025
    ) {
      const speciesMaxCap = e.species === 'wolf' ? 8 : e.species === 'bear' ? 4 : 18;
      const sameSpeciesCount = this.entities.filter(other => other.species === e.species && other.alive).length;
      if (sameSpeciesCount < speciesMaxCap) {
        this.spawnEntity(e.species, e.x + (Math.random() * 2 - 1), e.y + (Math.random() * 2 - 1));
        this.createPuff(e.x, e.y, '#ec4899', 5);
      }
    }

    // F. Exploration & Wandering
    if (!e.targetX || !e.targetY || Math.random() < 0.04) {
      // Pick random destination nearby
      const wanderRadius = e.species === 'dragon' ? 25 : 8;
      const tx = Math.max(1, Math.min(this.width - 2, e.x + (Math.random() * wanderRadius * 2 - wanderRadius)));
      const ty = Math.max(1, Math.min(this.height - 2, e.y + (Math.random() * wanderRadius * 2 - wanderRadius)));

      // Dragon can fly anywhere; others need walkable or swimmable land
      if (e.species === 'dragon' || isWalkable(this.tiles[Math.round(ty)]?.[Math.round(tx)])) {
        e.targetX = tx;
        e.targetY = ty;
        e.state = 'EXPLORE';
      }
    }

    if (e.targetX !== undefined && e.targetY !== undefined) {
      this.moveTowards(e, e.targetX, e.targetY, moveStep);
    }
  }

  private findNearbyEnemy(e: Entity): Entity | undefined {
    // Peaceful creatures never look for fights
    if (e.traits.includes('Peaceful')) return undefined;

    // Dragons attack all mortals
    if (e.species === 'dragon') {
      return this.entities.find(other => other.alive && other.id !== e.id && Math.hypot(other.x - e.x, other.y - e.y) < 8);
    }

    // Wolves and bears hunt sheep or humans
    if (e.species === 'wolf' || e.species === 'bear') {
      return this.entities.find(
        other => other.alive && (other.species === 'sheep' || isCivilized(other.species)) && Math.hypot(other.x - e.x, other.y - e.y) < 5
      );
    }

    // Sheep are peaceful and flee or don't fight
    if (e.species === 'sheep') return undefined;

    // Civilized creatures:
    if (isCivilized(e.species)) {
      // 1. Attack dangerous wild predators nearby
      const predator = this.entities.find(
        other => other.alive && (other.species === 'wolf' || other.species === 'bear' || other.species === 'dragon') && Math.hypot(other.x - e.x, other.y - e.y) < 4
      );
      if (predator) return predator;

      // 2. Attack enemy kingdoms if at war
      if (e.ownerKingdomId && this.worldLaws.kingdomWars) {
        const myKingdom = this.getKingdom(e.ownerKingdomId);
        if (myKingdom && myKingdom.enemyKingdomIds.length > 0) {
          const searchRadius = e.traits.includes('Bloodthirsty') ? 10 : 7;
          const enemy = this.entities.find(
            other =>
              other.alive &&
              other.ownerKingdomId &&
              myKingdom.enemyKingdomIds.includes(other.ownerKingdomId) &&
              Math.hypot(other.x - e.x, other.y - e.y) < searchRadius
          );
          if (enemy) return enemy;
        }
      }
    }

    return undefined;
  }

  private moveTowards(e: Entity, targetX: number, targetY: number, step: number) {
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.2) {
      e.targetX = undefined;
      e.targetY = undefined;
      return;
    }

    const nextX = e.x + (dx / dist) * step;
    const nextY = e.y + (dy / dist) * step;

    const roundX = Math.round(nextX);
    const roundY = Math.round(nextY);

    // Flying creatures ignore terrain
    if (e.species === 'dragon') {
      e.x = Math.max(0, Math.min(this.width - 1, nextX));
      e.y = Math.max(0, Math.min(this.height - 1, nextY));
      return;
    }

    // Normal path check
    if (roundX >= 0 && roundX < this.width && roundY >= 0 && roundY < this.height) {
      const tile = this.tiles[roundY][roundX];
      if (isWalkable(tile) || isSwimmable(tile)) {
        e.x = nextX;
        e.y = nextY;
      } else {
        // Can't walk into deep water or mountain walls: pick new wander target
        e.targetX = undefined;
        e.targetY = undefined;
      }
    }
  }

  // --- GOD TOOLS & POWERS ---

  public applyTerrainBrush(cx: number, cy: number, tileType: TileType, radius: number) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const tx = Math.round(cx + dx);
          const ty = Math.round(cy + dy);
          if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
            this.tiles[ty][tx] = tileType;
          }
        }
      }
    }
  }

  public triggerGodPower(power: GodPowerId, cx: number, cy: number, radius = 3) {
    const rx = Math.round(cx);
    const ry = Math.round(cy);

    switch (power) {
      case 'meteor': {
        this.addHistoryEvent('Thiên thạch giáng trần', `Một thiên thạch khổng lồ đâm sầm vào tọa độ (${rx}, ${ry})!`, 'god', '#f97316');
        this.createExplosion(rx, ry, 35);
        // Form crater
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              const tx = rx + dx;
              const ty = ry + dy;
              if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
                if (dx * dx + dy * dy <= 2) {
                  this.tiles[ty][tx] = 'lava';
                } else {
                  this.tiles[ty][tx] = 'mountain';
                }
              }
            }
          }
        }
        // Blast damage to entities and buildings
        this.damageEntitiesInRadius(rx, ry, radius * 2.5, 250);
        this.damageBuildingsInRadius(rx, ry, radius * 2.5, 300);
        break;
      }
      case 'lightning': {
        this.addHistoryEvent('Sấm sét thần thánh', `Sét trời giáng xuống vị trí (${rx}, ${ry})!`, 'god', '#38bdf8');
        this.createSparks(rx, ry, '#38bdf8', 25);
        this.damageEntitiesInRadius(rx, ry, 3, 160);
        this.damageBuildingsInRadius(rx, ry, 2, 100);
        if (this.tiles[ry]?.[rx] === 'forest') {
          this.tiles[ry][rx] = 'plains';
        }
        break;
      }
      case 'healing_rain': {
        this.addHistoryEvent('Mưa ban phước', `Cơn mưa hồi sinh tưới mát sinh linh tại (${rx}, ${ry}).`, 'god', '#34d399');
        for (let i = 0; i < 20; i++) {
          this.createPuff(rx + (Math.random() * 6 - 3), ry + (Math.random() * 6 - 3), '#6ee7b7', 3);
        }
        // Heal entities
        for (const e of this.entities) {
          if (Math.hypot(e.x - rx, e.y - ry) <= radius * 2) {
            e.health = e.maxHealth;
            e.hunger = 100;
            if (!e.traits.includes('Blessed')) {
              e.traits.push('Blessed');
            }
          }
        }
        // Turn dry sand near water into fertile plains
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const tx = rx + dx;
            const ty = ry + dy;
            if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
              if (this.tiles[ty][tx] === 'sand') this.tiles[ty][tx] = 'plains';
            }
          }
        }
        break;
      }
      case 'water_rain': {
        for (let i = 0; i < 20; i++) {
          this.createPuff(rx + (Math.random() * 6 - 3), ry + (Math.random() * 6 - 3), '#60a5fa', 2);
        }
        break;
      }
      case 'fire': {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const tx = rx + dx;
            const ty = ry + dy;
            if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
              if (this.tiles[ty][tx] === 'forest') {
                this.tiles[ty][tx] = 'plains';
                this.createSparks(tx, ty, '#ef4444', 8);
              }
            }
          }
        }
        this.damageEntitiesInRadius(rx, ry, radius, 80);
        this.damageBuildingsInRadius(rx, ry, radius, 120);
        break;
      }
      case 'nuke': {
        this.addHistoryEvent('Vũ khí hủy diệt', `Một vụ nổ nhiệt hạch kinh hoàng san bằng vùng đất (${rx}, ${ry})!`, 'god', '#facc15');
        this.createExplosion(rx, ry, 60);
        for (let dy = -radius * 2; dy <= radius * 2; dy++) {
          for (let dx = -radius * 2; dx <= radius * 2; dx++) {
            if (dx * dx + dy * dy <= (radius * 2) * (radius * 2)) {
              const tx = rx + dx;
              const ty = ry + dy;
              if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
                this.tiles[ty][tx] = 'shallow_water';
              }
            }
          }
        }
        this.damageEntitiesInRadius(rx, ry, radius * 3, 999);
        this.damageBuildingsInRadius(rx, ry, radius * 3, 999);
        break;
      }
      case 'blessing': {
        for (const e of this.entities) {
          if (Math.hypot(e.x - rx, e.y - ry) <= radius) {
            if (!e.traits.includes('Blessed')) {
              e.traits.push('Blessed');
              e.maxHealth = Math.round(e.maxHealth * 1.5);
              e.health = e.maxHealth;
              e.speed *= 1.3;
              this.createPuff(e.x, e.y, '#fef08a', 8);
            }
          }
        }
        break;
      }
      case 'bloodlust': {
        for (const e of this.entities) {
          if (Math.hypot(e.x - rx, e.y - ry) <= radius) {
            if (!e.traits.includes('Bloodthirsty')) {
              e.traits.push('Bloodthirsty');
              e.attackPower = Math.round(e.attackPower * 1.6);
              this.createBlood(e.x, e.y, 10);
            }
          }
        }
        break;
      }
      case 'earthquake': {
        this.addHistoryEvent('Đại địa chấn', `Một trận động đất xé toạc mặt đất tại (${rx}, ${ry})!`, 'nature', '#a8a29e');
        this.createSparks(rx, ry, '#78716c', 30);
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const tx = rx + dx;
            const ty = ry + dy;
            if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
              if (Math.random() < 0.5) this.tiles[ty][tx] = 'mountain';
            }
          }
        }
        this.damageBuildingsInRadius(rx, ry, radius, 180);
        break;
      }
    }
  }

  private damageEntitiesInRadius(x: number, y: number, radius: number, damage: number) {
    for (const e of this.entities) {
      if (Math.hypot(e.x - x, e.y - y) <= radius) {
        e.health -= damage;
        this.createBlood(e.x, e.y, 4);
        if (e.health <= 0) {
          e.alive = false;
        }
      }
    }
    for (const b of this.boats) {
      if (Math.hypot(b.x - x, b.y - y) <= radius) {
        b.health -= damage;
        this.createSparks(b.x, b.y, '#f59e0b', 4);
      }
    }
  }

  private damageBuildingsInRadius(x: number, y: number, radius: number, damage: number) {
    for (const v of this.villages) {
      for (const b of v.buildings) {
        if (Math.hypot(b.x - x, b.y - y) <= radius) {
          b.health -= damage;
          this.createSparks(b.x, b.y, '#ef4444', 5);
        }
      }
      // Remove ruined buildings
      v.buildings = v.buildings.filter(b => b.health > 0);
    }
  }

  // --- PARTICLES ---

  public createExplosion(x: number, y: number, count = 20) {
    const colors = ['#ef4444', '#f97316', '#facc15', '#4b5563'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.floor(Math.random() * 20 + 15),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        type: 'blast',
      });
    }
  }

  public createSparks(x: number, y: number, color: string, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.floor(Math.random() * 15 + 10),
        color,
        size: Math.random() * 2.5 + 1,
        type: 'spark',
      });
    }
  }

  public createPuff(x: number, y: number, color: string, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 0.6 - 0.3),
        y: y + (Math.random() * 0.6 - 0.3),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.6 - 0.2,
        life: 0,
        maxLife: Math.floor(Math.random() * 18 + 12),
        color,
        size: Math.random() * 3 + 2,
        type: 'smoke',
      });
    }
  }

  public createBlood(x: number, y: number, count = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        life: 0,
        maxLife: 12,
        color: '#dc2626',
        size: Math.random() * 2 + 1,
        type: 'blood',
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * 0.1;
      p.y += p.vy * 0.1;
      p.life++;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }
}
