export type TileType = 
  | 'deep_water'
  | 'shallow_water'
  | 'sand'
  | 'plains'
  | 'forest'
  | 'mountain'
  | 'snow'
  | 'lava';

export type Species = 
  | 'human' 
  | 'elf' 
  | 'orc' 
  | 'dwarf' 
  | 'sheep' 
  | 'wolf' 
  | 'bear' 
  | 'dragon';

export type EntityState = 
  | 'IDLE' 
  | 'EXPLORE' 
  | 'GATHER' 
  | 'EAT' 
  | 'REST' 
  | 'REPRODUCE' 
  | 'BUILD' 
  | 'FIGHT';

export type Trait = 
  | 'Fast' 
  | 'Strong' 
  | 'Genius' 
  | 'Tough'
  | 'Giant' 
  | 'Tiny' 
  | 'Peaceful' 
  | 'Bloodthirsty' 
  | 'Immortal' 
  | 'Fireproof' 
  | 'Blessed'
  | 'Cursed'
  | 'Seafarer'
  | 'Regeneration'
  | 'Weak'
  | 'Slow'
  | 'Frail'
  | 'Glutton'
  | 'Stupid';

export type TraitCategory = 'positive' | 'negative' | 'neutral';

export interface TraitDefinition {
  id: Trait;
  name: string;
  description: string;
  category: TraitCategory;
  statBonus: string;
}

export const TRAIT_DEFINITIONS: Record<Trait, TraitDefinition> = {
  Genius: {
    id: 'Genius',
    name: 'Thiên tài',
    description: 'Trí tuệ vượt trội, tăng 50% hiệu suất thu thập tài nguyên và thăng cấp nhanh hơn.',
    category: 'positive',
    statBonus: '+50% Thu thập & Exp',
  },
  Strong: {
    id: 'Strong',
    name: 'Cường tráng',
    description: 'Sức mạnh cơ bắp phi thường, giáng những đòn đánh đầy uy lực.',
    category: 'positive',
    statBonus: '+40% Sát thương',
  },
  Fast: {
    id: 'Fast',
    name: 'Nhanh nhẹn',
    description: 'Bước chân thoăn thoắt, di chuyển mau lẹ trên mọi địa hình.',
    category: 'positive',
    statBonus: '+35% Tốc độ di chuyển',
  },
  Tough: {
    id: 'Tough',
    name: 'Bền bỉ',
    description: 'Cơ thể rắn rỏi chịu đòn tốt, tăng giáp và sức bền sinh tồn.',
    category: 'positive',
    statBonus: '+4 Giáp, +20% HP',
  },
  Giant: {
    id: 'Giant',
    name: 'Khổng lồ',
    description: 'Thân hình đồ sộ với lượng máu khổng lồ và sức tấn công lớn nhưng di chuyển chậm hơn.',
    category: 'positive',
    statBonus: '+60% HP, +20% Sát thương, -15% Tốc độ',
  },
  Immortal: {
    id: 'Immortal',
    name: 'Bất tử',
    description: 'Không bao giờ già đi và không chết vì tuổi tác.',
    category: 'positive',
    statBonus: 'Miễn nhiễm tuổi già',
  },
  Fireproof: {
    id: 'Fireproof',
    name: 'Kháng lửa',
    description: 'Miễn nhiễm hoàn toàn trước sức nóng của lửa và dung nham.',
    category: 'positive',
    statBonus: 'Kháng dung nham & cháy',
  },
  Blessed: {
    id: 'Blessed',
    name: 'Ban phước',
    description: 'Nhận được hào quang ánh sáng từ Thần linh, tăng mạnh mọi chỉ số sinh tồn.',
    category: 'positive',
    statBonus: '+50% HP, +30% Sát thương',
  },
  Seafarer: {
    id: 'Seafarer',
    name: 'Thủy thủ kỳ cựu',
    description: 'Dày dạn sóng gió đại dương, chèo thuyền vượt biển nhanh hơn 50% và bơi giỏi.',
    category: 'positive',
    statBonus: '+50% Tốc độ thuyền, +2 Giáp',
  },
  Regeneration: {
    id: 'Regeneration',
    name: 'Tái sinh',
    description: 'Khả năng tự hồi phục vết thương thần tốc theo thời gian.',
    category: 'positive',
    statBonus: 'Tự hồi máu liên tục',
  },
  Weak: {
    id: 'Weak',
    name: 'Yếu ớt',
    description: 'Thể chất kém cỏi, đòn đánh nhẹ và sức sống kém hơn người thường.',
    category: 'negative',
    statBonus: '-35% Sát thương, -15% HP',
  },
  Slow: {
    id: 'Slow',
    name: 'Chậm chạp',
    description: 'Đi lại nặng nề, khó thoát khỏi kẻ thù khi bị truy đuổi.',
    category: 'negative',
    statBonus: '-30% Tốc độ di chuyển',
  },
  Frail: {
    id: 'Frail',
    name: 'Mong manh',
    description: 'Dễ tổn thương, khả năng phòng thủ kém cỏi trước mọi đòn đánh.',
    category: 'negative',
    statBonus: '-4 Giáp, -25% HP',
  },
  Glutton: {
    id: 'Glutton',
    name: 'Phàm ăn',
    description: 'Mau đói bụng hơn bình thường, tiêu hao lương thực nhanh gấp đôi.',
    category: 'negative',
    statBonus: 'Đói nhanh gấp 2 lần',
  },
  Stupid: {
    id: 'Stupid',
    name: 'Khờ khạo',
    description: 'Lười biếng và vụng về trong việc khai khoáng, xây dựng.',
    category: 'negative',
    statBonus: '-50% Thu thập tài nguyên',
  },
  Tiny: {
    id: 'Tiny',
    name: 'Tí hon',
    description: 'Thân hình nhỏ thó, khó bị đánh trúng và chạy nhanh nhưng máu thấp.',
    category: 'neutral',
    statBonus: '-30% HP, +25% Tốc độ, +2 Giáp',
  },
  Peaceful: {
    id: 'Peaceful',
    name: 'Hòa bình',
    description: 'Yêu chuộng yên bình, không bao giờ chủ động đánh nhau và luôn tránh xa xung đột.',
    category: 'neutral',
    statBonus: 'Ưu tiên né tránh giao chiến',
  },
  Bloodthirsty: {
    id: 'Bloodthirsty',
    name: 'Khát máu',
    description: 'Hung hãn hiếu chiến, luôn chủ động truy tìm kẻ địch để tiêu diệt.',
    category: 'neutral',
    statBonus: '+25% Sát thương khi tấn công',
  },
  Cursed: {
    id: 'Cursed',
    name: 'Lời nguyền',
    description: 'Bị quỷ ám khiến sức mạnh và sinh khí hao mòn.',
    category: 'negative',
    statBonus: '-30% HP, -20% Sát thương',
  },
};

export interface Boat {
  id: string;
  name: string;
  villageId: string;
  kingdomId: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  facing?: 'left' | 'right';
  path?: { x: number; y: number }[];
  passengerIds: string[];
  capacity: number;
  health: number;
  maxHealth: number;
  state: 'MOORED' | 'VOYAGING' | 'COLONIZING';
  destinationIsland?: { x: number; y: number; waterX?: number; waterY?: number };
}

export interface Entity {
  id: string;
  name: string;
  species: Species;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  health: number;
  maxHealth: number;
  age: number;
  hunger: number;
  state: EntityState;
  ownerKingdomId?: string;
  ownerVillageId?: string;
  alive: boolean;
  traits: Trait[];
  level: number;
  kills: number;
  attackPower: number;
  defense: number;
  speed: number;
  actionTimer: number;
  gender: 'M' | 'F';
  recruitedAtSpawn?: boolean;
  boatId?: string;
  onBoat?: boolean;
  parentId?: string;
  motherId?: string;
  fatherId?: string;
  homeId?: string;
}

export type BuildingType = 
  | 'town_hall' 
  | 'house' 
  | 'granary' 
  | 'watchtower' 
  | 'farm'
  | 'docks'
  | 'windmill'
  | 'mine'
  | 'park';

export const BUILDING_LABELS: Record<BuildingType, string> = {
  town_hall: 'Tòa thị chính',
  house: 'Nhà ở',
  granary: 'Kho lương',
  watchtower: 'Tháp canh',
  farm: 'Ruộng lúa',
  docks: 'Bến cảng',
  windmill: 'Cối xay gió',
  mine: 'Hầm mỏ',
  park: 'Công viên',
};

export const HOUSE_CAPACITY = 4;
export const WINDMILL_FIELD_RADIUS = 10;

export interface Building {
  id: string;
  villageId: string;
  type: BuildingType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  level: number;
}

export interface Village {
  id: string;
  kingdomId: string;
  name: string;
  leaderId?: string;
  leaderSinceYear?: number;
  x: number;
  y: number;
  territory: { x: number; y: number }[];
  resources: {
    wood: number;
    stone: number;
    food: number;
    gold: number;
    iron: number;
    mithril: number;
    adamantite: number;
  };
  farmland: { x: number; y: number }[];
  population: number;
  maxPopulation: number;
  buildings: Building[];
}

export interface Kingdom {
  id: string;
  name: string;
  bannerColor: string;
  kingId?: string;
  species: Species;
  villages: string[];
  enemyKingdomIds: string[];
  alliedKingdomIds: string[];
  relations: Record<string, number>; // -100 to +100
  createdAtYear: number;
}

export interface WorldLaws {
  hunger: boolean;
  aging: boolean;
  kingdomWars: boolean;
  animalBreeding: boolean;
  disasters: boolean;
  peacefulMode: boolean;
  vegetationGrowth: boolean;
  villageRecruitment: boolean;
}

export type GodCategory = 
  | 'terrain' 
  | 'creatures' 
  | 'civilization' 
  | 'powers' 
  | 'inspect' 
  | 'laws';

export type GodPowerId = 
  | 'meteor' 
  | 'lightning' 
  | 'healing_rain' 
  | 'fire' 
  | 'water_rain' 
  | 'nuke' 
  | 'blessing' 
  | 'bloodlust' 
  | 'earthquake';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type?: 'fire' | 'smoke' | 'spark' | 'water' | 'blood' | 'magic' | 'blast';
}

export interface HistoryEvent {
  id: string;
  year: number;
  tick: number;
  title: string;
  description: string;
  category: 'kingdom' | 'war' | 'nature' | 'god' | 'birth';
  color?: string;
}

export interface WorldConfig {
  width: number;
  height: number;
  seed: number;
  name: string;
}
