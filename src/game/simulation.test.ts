import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldSimulation } from './simulation';
import { generateWorldMap } from './generator';
import { Boat } from './types';

test('world map generator creates correct dimensions and biomes', () => {
  const width = 80;
  const height = 60;
  const tiles = generateWorldMap({ width, height, seed: 12345, name: 'Test World' }, 'continents');

  assert.equal(tiles.length, height);
  assert.equal(tiles[0].length, width);

  // Check that there is at least some water and some land
  const hasWater = tiles.some(row => row.some(t => t === 'deep_water' || t === 'shallow_water'));
  const hasLand = tiles.some(row => row.some(t => t === 'plains' || t === 'forest' || t === 'sand'));

  assert.equal(hasWater, true, 'World map should generate ocean water');
  assert.equal(hasLand, true, 'World map should generate land biomes');
});

test('simulation initializes world state and spawns starting life', () => {
  const sim = new WorldSimulation({ width: 60, height: 40, seed: 42, name: 'Initial World' });

  assert.equal(sim.year, 1);
  assert.equal(sim.tickCount, 0);
  assert.ok(sim.entities.length > 0, 'Simulation should spawn initial entities');
  assert.ok(sim.historyEvents.length > 0, 'Simulation should log initial history event');
});

test('spawning entity assigns species traits and stats correctly', () => {
  const sim = new WorldSimulation({ width: 50, height: 50, seed: 99, name: 'Entity Test' });
  
  const human = sim.spawnEntity('human', 25, 25);
  assert.equal(human.species, 'human');
  assert.equal(human.alive, true);
  assert.equal(human.health, human.maxHealth);

  const dragon = sim.spawnEntity('dragon', 10, 10);
  assert.equal(dragon.species, 'dragon');
  assert.ok(dragon.traits.includes('Fireproof'), 'Dragons should be fireproof');
  assert.ok(dragon.maxHealth >= 500, 'Dragons should have high health');
});

test('founding kingdom and village sets up territory and leadership', () => {
  const sim = new WorldSimulation({ width: 50, height: 50, seed: 77, name: 'Civ Test' });
  const founder = sim.spawnEntity('elf', 20, 20);

  const { kingdom, village } = sim.foundKingdomAndVillage(founder);

  assert.equal(kingdom.kingId, founder.id);
  assert.equal(founder.ownerKingdomId, kingdom.id);
  assert.equal(founder.ownerVillageId, village.id);
  assert.equal(village.kingdomId, kingdom.id);
  assert.ok(village.territory.length > 0, 'Village should claim surrounding territory');
  assert.equal(village.buildings.length, 1, 'Village should start with town hall');
  assert.equal(village.buildings[0].type, 'town_hall');
});

test('god powers meteor creates crater and deals damage', () => {
  const sim = new WorldSimulation({ width: 40, height: 40, seed: 100, name: 'God Power Test' });
  const victim = sim.spawnEntity('human', 20, 20);
  victim.health = 100;

  // Trigger meteor at victim position
  sim.triggerGodPower('meteor', 20, 20, 2);

  // Victim should have taken heavy blast damage or be dead
  assert.ok(victim.health < 100, 'Meteor should damage entity');
  assert.ok(sim.particles.length > 0, 'Meteor should spawn explosion particles');
  assert.ok(sim.historyEvents.some(e => e.title.includes('Thiên thạch')), 'History event should be logged');
});

test('world laws toggle correctly prevents hunger damage when disabled', () => {
  const sim = new WorldSimulation({ width: 40, height: 40, seed: 200, name: 'Law Test' });
  const entity = sim.spawnEntity('human', 15, 15);
  entity.hunger = 0;
  const initialHealth = entity.health;

  // With hunger disabled
  sim.worldLaws.hunger = false;
  sim.tickCount = 30; // trigger hunger tick
  sim.update();

  assert.equal(entity.health, initialHealth, 'Health should not decrease when hunger law is off');
});

test('spawning entity in same-species village has 80% recruitment probability', () => {
  const sim = new WorldSimulation({ width: 60, height: 60, seed: 300, name: 'Recruitment Test' });
  const founder = sim.spawnEntity('elf', 30, 30);
  const { village } = sim.foundKingdomAndVillage(founder);

  // Spawn 100 elves inside this elf village
  let recruitedCount = 0;
  const trials = 100;
  for (let i = 0; i < trials; i++) {
    const spawnedElf = sim.spawnEntity('elf', village.x, village.y);
    if (spawnedElf.ownerVillageId === village.id && spawnedElf.recruitedAtSpawn) {
      recruitedCount++;
    }
  }

  // With 80% probability over 100 trials, count will reliably fall between 65 and 95
  assert.ok(recruitedCount >= 65 && recruitedCount <= 95, `Recruited count ${recruitedCount} should be around ~80% of 100 trials`);

  // Spawning DIFFERENT species (Orc into Elf village) must NEVER recruit (0%)
  let orcRecruitedCount = 0;
  for (let i = 0; i < 20; i++) {
    const spawnedOrc = sim.spawnEntity('orc', village.x, village.y);
    if (spawnedOrc.ownerVillageId === village.id) {
      orcRecruitedCount++;
    }
  }
  assert.equal(orcRecruitedCount, 0, 'Different species must never be recruited into another race village');

  // Disabling villageRecruitment law stops recruitment
  sim.worldLaws.villageRecruitment = false;
  let lawDisabledCount = 0;
  for (let i = 0; i < 20; i++) {
    const spawnedElf = sim.spawnEntity('elf', village.x, village.y);
    if (spawnedElf.ownerVillageId === village.id) {
      lawDisabledCount++;
    }
  }
  assert.equal(lawDisabledCount, 0, 'When villageRecruitment law is disabled, no automatic recruitment should occur');
});

test('placing windmill creates building and plows circular wheat farmland', () => {
  const sim = new WorldSimulation({ width: 100, height: 100, seed: 42, name: 'Windmill World' });

  // Find a plains tile
  let px = 50, py = 50;
  for (let y = 30; y < 70; y++) {
    for (let x = 30; x < 70; x++) {
      if (sim.tiles[y][x] === 'plains') {
        px = x;
        py = y;
        break;
      }
    }
  }

  const windmill = sim.placeBuildingAt('windmill', px, py);
  assert.ok(windmill, 'Windmill should be placed successfully');
  assert.equal(windmill.type, 'windmill');

  // Verify village has windmill and farmland plowed around it
  const village = sim.villages.find(v => v.id === windmill.villageId);
  assert.ok(village, 'Village must own the placed windmill');
  assert.ok(village.farmland.length > 0, 'Windmill must immediately plow wheat farmland rings around it');

  // Place house
  const house = sim.placeBuildingAt('house', px + 1, py + 1);
  assert.ok(house, 'House should be placed successfully');
  assert.equal(house.type, 'house');
});

test('halved animal counts and expanded village housing limits work properly', () => {
  const sim = new WorldSimulation({ width: 60, height: 60, seed: 777, name: 'Eco Test' });

  // Verify wolves and bears are in controlled, reduced numbers
  const wolves = sim.entities.filter(e => e.species === 'wolf');
  const bears = sim.entities.filter(e => e.species === 'bear');
  const sheep = sim.entities.filter(e => e.species === 'sheep');

  // Wolves and bears should be few and balanced (<= 2-3 wolves, <= 1-2 bears for a 60x60 map)
  assert.ok(wolves.length <= 4, `Wolves count (${wolves.length}) should be halved and low`);
  assert.ok(bears.length <= 3, `Bears count (${bears.length}) should be halved and low`);
  assert.ok(sheep.length <= 8, `Sheep count (${sheep.length}) should be halved and balanced`);

  // Verify village can hold and build multiple houses
  const founder = sim.spawnEntity('human', 20, 20);
  const { village } = sim.foundKingdomAndVillage(founder);
  assert.ok(village, 'Village founded');

  // Place 15 houses into the village to verify expanded housing capacity
  for (let i = 0; i < 15; i++) {
    const h = sim.placeBuildingAt('house', 20 + (i % 5) + 1, 20 + Math.floor(i / 5) + 1);
    assert.ok(h, `House ${i} should be successfully constructed`);
  }
  const villageHouses = village.buildings.filter(b => b.type === 'house');
  assert.equal(villageHouses.length, 15, 'Village should easily support 15+ houses');
  assert.ok(village.buildings.length >= 16, 'Total buildings including town hall should be >= 16');
});

test('European Carrack boat navigation strictly stays on water tiles and moors at shoreline', () => {
  const sim = new WorldSimulation({ width: 50, height: 50, seed: 999, name: 'Carrack Naval Test' });

  // Create a customized channel of water:
  // Water channel from (5, 5) to (5, 20) with land at x=6..10
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      sim.tiles[y][x] = 'plains';
    }
  }

  // Create an L-shaped water canal connecting (5, 5) -> (5, 25) -> (25, 25)
  for (let y = 5; y <= 25; y++) {
    sim.tiles[y][5] = 'shallow_water';
  }
  for (let x = 5; x <= 25; x++) {
    sim.tiles[25][x] = 'deep_water';
  }
  // Shoreline land for colonization at (26, 25)
  sim.tiles[25][26] = 'plains';

  // Verify water pathfinder: direct Euclidean path from (5, 5) to (25, 25) crosses dry land at (15, 15)
  // But findWaterPath MUST strictly follow the water canal!
  const waterRoute = sim.findWaterPath(5, 5, 25, 25);
  assert.ok(waterRoute, 'Water path must be discovered through the canal');
  assert.ok(waterRoute.length > 0, 'Path must have waypoints');

  for (const step of waterRoute) {
    const tile = sim.tiles[step.y][step.x];
    assert.ok(
      tile === 'shallow_water' || tile === 'deep_water',
      `Every waypoint along waterRoute must be a water tile, got: ${tile} at (${step.x}, ${step.y})`
    );
  }

  // Create a founder and village with a dock
  const founder = sim.spawnEntity('human', 26, 26);
  const { kingdom, village } = sim.foundKingdomAndVillage(founder);

  // Spawn an expedition passenger
  const explorer = sim.spawnEntity('human', 26, 26, ['Seafarer']);
  explorer.ownerVillageId = village.id;
  explorer.ownerKingdomId = kingdom.id;

  // Spawn a Carrack boat in the water at (5, 5)
  const boat: Boat = {
    id: 'test-carrack-1',
    name: 'Carrack Santa Maria',
    villageId: village.id,
    kingdomId: kingdom.id,
    x: 5,
    y: 5,
    facing: 'right',
    passengerIds: [explorer.id],
    capacity: 5,
    health: 350,
    maxHealth: 350,
    state: 'VOYAGING',
    targetX: 25,
    targetY: 25,
    path: [...waterRoute],
    destinationIsland: { x: 26, y: 25, waterX: 25, waterY: 25 },
  };
  sim.boats = [boat];
  explorer.onBoat = true;
  explorer.boatId = boat.id;

  // Run simulation updates for boat movement
  for (let step = 0; step < 200; step++) {
    sim.updateBoats();
    // After every single tick, boat must NEVER be on land!
    const bx = Math.round(boat.x);
    const by = Math.round(boat.y);
    const currentTile = sim.tiles[by]?.[bx];
    assert.ok(
      currentTile === 'shallow_water' || currentTile === 'deep_water',
      `Boat must always stay on water! Found at (${boat.x.toFixed(2)}, ${boat.y.toFixed(2)}) tile: ${currentTile}`
    );
    if (boat.state === 'MOORED') break;
  }

  // Verify that arrival successfully founded/colonized or safely moored
  assert.equal(boat.state, 'MOORED', 'Boat should reach the mooring site and be MOORED');
  assert.ok(boat.capacity >= 5, 'European Carrack should have capacity >= 5');
  assert.ok(boat.health >= 300, 'European Carrack should have robust HP >= 300');
});

