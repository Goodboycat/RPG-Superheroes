// =====================================================
// PROCEDURAL DUNGEON & ENCOUNTER GENERATOR
// =====================================================

import { generateRandomHero, generateHeroWithRequirements } from './hero-generator';

interface GeneratedDungeon {
  name: string;
  dungeon_type: string;
  difficulty: string;
  required_level: number;
  required_team_power: number;
  energy_cost: number;
  enemy_team: any[];
  rewards: any[];
  special_mechanics?: string;
  recommended_types: string[];
  theme: string;
  description: string;
}

// Dungeon themes
const DUNGEON_THEMES = {
  volcano: { name: 'Volcanic', emoji: '🌋', types: ['fire', 'earth'], enemies: ['fire', 'earth'] },
  ocean: { name: 'Ocean Depths', emoji: '🌊', types: ['water', 'ice'], enemies: ['water', 'ice'] },
  forest: { name: 'Ancient Forest', emoji: '🌲', types: ['nature', 'poison'], enemies: ['nature', 'poison'] },
  sky: { name: 'Sky Citadel', emoji: '☁️', types: ['air', 'electric'], enemies: ['air', 'electric'] },
  temple: { name: 'Sacred Temple', emoji: '⛩️', types: ['light', 'psychic'], enemies: ['light', 'psychic'] },
  crypt: { name: 'Dark Crypt', emoji: '🏚️', types: ['dark', 'poison'], enemies: ['dark', 'poison'] },
  mountain: { name: 'Mountain Peak', emoji: '⛰️', types: ['earth', 'steel'], enemies: ['earth', 'steel'] },
  tundra: { name: 'Frozen Tundra', emoji: '❄️', types: ['ice', 'water'], enemies: ['ice', 'water'] },
  wasteland: { name: 'Toxic Wasteland', emoji: '☢️', types: ['poison', 'steel'], enemies: ['poison', 'steel'] },
  ruins: { name: 'Ancient Ruins', emoji: '🏛️', types: ['psychic', 'steel'], enemies: ['psychic', 'steel'] }
};

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { 
    enemyLevelMod: 0.8, 
    enemyCount: 3, 
    energyCost: 5, 
    rarityWeights: { C: 60, B: 30, A: 10, S: 0, SS: 0, SSS: 0 },
    rewardMultiplier: 1.0
  },
  normal: { 
    enemyLevelMod: 1.0, 
    enemyCount: 4, 
    energyCost: 8, 
    rarityWeights: { C: 40, B: 40, A: 15, S: 5, SS: 0, SSS: 0 },
    rewardMultiplier: 1.5
  },
  hard: { 
    enemyLevelMod: 1.2, 
    enemyCount: 5, 
    energyCost: 12, 
    rarityWeights: { C: 20, B: 40, A: 25, S: 13, SS: 2, SSS: 0 },
    rewardMultiplier: 2.0
  },
  nightmare: { 
    enemyLevelMod: 1.5, 
    enemyCount: 5, 
    energyCost: 20, 
    rarityWeights: { C: 0, B: 20, A: 40, S: 30, SS: 8, SSS: 2 },
    rewardMultiplier: 3.0
  },
  hell: { 
    enemyLevelMod: 2.0, 
    enemyCount: 5, 
    energyCost: 30, 
    rarityWeights: { C: 0, B: 0, A: 30, S: 40, SS: 20, SSS: 10 },
    rewardMultiplier: 5.0
  }
};

// Dungeon types
const DUNGEON_TYPES = {
  campaign: { name: 'Campaign', icon: '⚔️', description: 'Story progression dungeon' },
  boss: { name: 'Boss Raid', icon: '👹', description: 'Epic boss battle' },
  trial: { name: 'Trial', icon: '🎯', description: 'Test your skills' },
  resource: { name: 'Resource Farm', icon: '💰', description: 'Farm resources' },
  puzzle: { name: 'Puzzle', icon: '🧩', description: 'Solve and conquer' },
  survival: { name: 'Survival', icon: '⏱️', description: 'Endless waves' }
};

// Special mechanics
const SPECIAL_MECHANICS = [
  'Enemies have increased critical rate',
  'Time limit: 180 seconds',
  'Boss enrages after 60 seconds',
  'Enemies regenerate health every turn',
  'Weak to elemental attacks',
  'Immune to status effects',
  'Reflects 20% damage back',
  'Summons reinforcements at 50% HP',
  'Alternating elemental shields',
  'Increases power over time'
];

// Random helpers
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWeightedRarity(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  
  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  
  return 'C';
}

// Generate enemy team
function generateEnemyTeam(
  theme: any,
  difficulty: any,
  playerLevel: number,
  isBoss: boolean = false
): any[] {
  const enemyLevel = Math.floor(playerLevel * difficulty.enemyLevelMod);
  const enemyCount = isBoss ? 1 : difficulty.enemyCount;
  const enemies: any[] = [];
  
  for (let i = 0; i < enemyCount; i++) {
    const powerType = randomChoice(theme.enemies);
    const rarity = getWeightedRarity(difficulty.rarityWeights);
    
    let role: 'tank' | 'dps' | 'support' = 'dps';
    if (isBoss) {
      role = 'tank';
    } else if (i === 0) {
      role = randomChoice(['tank', 'dps'] as const);
    } else if (i === enemyCount - 1) {
      role = randomChoice(['support', 'dps'] as const);
    }
    
    const enemy = generateHeroWithRequirements({
      powerType,
      rarity,
      role
    });
    
    enemies.push({
      ...enemy,
      level: enemyLevel,
      is_boss: isBoss
    });
  }
  
  return enemies;
}

// Generate rewards
function generateRewards(
  difficulty: string,
  dungeonType: string,
  playerLevel: number
): any[] {
  const difficultySettings = DIFFICULTY_SETTINGS[difficulty as keyof typeof DIFFICULTY_SETTINGS];
  const baseGold = 200 * playerLevel * difficultySettings.rewardMultiplier;
  
  const rewards: any[] = [
    { type: 'gold', amount: Math.floor(baseGold * (0.8 + Math.random() * 0.4)) }
  ];
  
  // Add type-specific rewards
  switch (dungeonType) {
    case 'campaign':
      rewards.push(
        { type: 'level_stone', amount: randomInt(3, 10) },
        { type: 'mana_essence', amount: randomInt(10, 50) }
      );
      if (Math.random() > 0.7) {
        rewards.push({ type: 'rank_stone_b', amount: randomInt(1, 3) });
      }
      break;
      
    case 'boss':
      rewards.push(
        { type: 'diamonds', amount: randomInt(50, 200) },
        { type: 'rare_core', amount: randomInt(1, 5) },
        { type: 'awakening_core', amount: randomInt(1, 3) }
      );
      if (difficulty === 'hell' || difficulty === 'nightmare') {
        rewards.push({ type: 'rank_stone_sss', amount: 1 });
      }
      break;
      
    case 'resource':
      const resourceTypes = ['iron_ore', 'mythril_ingot', 'essence_fiber', 'dragon_scale'];
      rewards.push(
        { type: randomChoice(resourceTypes), amount: randomInt(5, 20) },
        { type: 'gold', amount: Math.floor(baseGold * 2) }
      );
      break;
      
    case 'trial':
      rewards.push(
        { type: 'talent_orb', amount: randomInt(5, 20) },
        { type: 'potential_dust', amount: randomInt(10, 50) },
        { type: 'limit_breaker_crystal', amount: randomInt(1, 5) }
      );
      break;
  }
  
  // Bonus rewards based on difficulty
  if (difficulty === 'nightmare' || difficulty === 'hell') {
    rewards.push({ type: 'diamonds', amount: randomInt(100, 300) });
  }
  
  return rewards;
}

// Get recommended counter types
function getRecommendedTypes(themeTypes: string[]): string[] {
  const counters: Set<string> = new Set();
  
  const typeAdvantages: Record<string, string[]> = {
    fire: ['water', 'earth'],
    water: ['electric', 'nature'],
    earth: ['air', 'water'],
    air: ['ice', 'electric'],
    light: ['dark'],
    dark: ['light'],
    electric: ['earth'],
    ice: ['fire'],
    poison: ['steel', 'psychic'],
    psychic: ['dark'],
    steel: ['fire', 'earth'],
    nature: ['fire', 'poison', 'ice']
  };
  
  for (const type of themeTypes) {
    const advantages = typeAdvantages[type] || [];
    advantages.forEach(t => counters.add(t));
  }
  
  return Array.from(counters);
}

// Generate dungeon name
function generateDungeonName(theme: any, difficulty: string, dungeonType: string): string {
  const prefixes = ['The', 'Ancient', 'Cursed', 'Sacred', 'Forbidden', 'Lost', 'Hidden', 'Eternal'];
  const suffixes = ['Depths', 'Peak', 'Sanctum', 'Abyss', 'Fortress', 'Realm', 'Lair', 'Chamber'];
  
  if (dungeonType === 'boss') {
    return `${randomChoice(prefixes)} ${theme.name} ${randomChoice(suffixes)}`;
  }
  
  return `${theme.name} ${randomChoice(suffixes)}`;
}

// Main dungeon generator
export function generateRandomDungeon(
  playerLevel: number,
  difficulty?: string,
  dungeonType?: string
): GeneratedDungeon {
  const selectedDifficulty = difficulty || randomChoice(Object.keys(DIFFICULTY_SETTINGS));
  const selectedType = dungeonType || randomChoice(Object.keys(DUNGEON_TYPES));
  const difficultySettings = DIFFICULTY_SETTINGS[selectedDifficulty as keyof typeof DIFFICULTY_SETTINGS];
  const typeInfo = DUNGEON_TYPES[selectedType as keyof typeof DUNGEON_TYPES];
  
  const theme = randomChoice(Object.values(DUNGEON_THEMES));
  const isBoss = selectedType === 'boss';
  
  const enemies = generateEnemyTeam(theme, difficultySettings, playerLevel, isBoss);
  const rewards = generateRewards(selectedDifficulty, selectedType, playerLevel);
  const requiredPower = enemies.reduce((sum, e) => sum + e.base_attack + e.base_defense + e.base_hp, 0);
  
  return {
    name: generateDungeonName(theme, selectedDifficulty, selectedType),
    dungeon_type: selectedType,
    difficulty: selectedDifficulty,
    required_level: Math.max(1, playerLevel - 5),
    required_team_power: Math.floor(requiredPower * 0.7),
    energy_cost: difficultySettings.energyCost,
    enemy_team: enemies,
    rewards,
    special_mechanics: isBoss ? randomChoice(SPECIAL_MECHANICS) : undefined,
    recommended_types: getRecommendedTypes(theme.types),
    theme: theme.name,
    description: `${typeInfo.description} in the ${theme.name.toLowerCase()}`
  };
}

// Generate a set of dungeons for player level
export function generateDungeonSet(playerLevel: number, count: number = 5): GeneratedDungeon[] {
  const dungeons: GeneratedDungeon[] = [];
  const difficulties = ['easy', 'normal', 'hard', 'nightmare', 'hell'];
  const types = Object.keys(DUNGEON_TYPES);
  
  for (let i = 0; i < count; i++) {
    const difficulty = difficulties[Math.min(i, difficulties.length - 1)];
    const type = randomChoice(types);
    
    dungeons.push(generateRandomDungeon(playerLevel, difficulty, type));
  }
  
  return dungeons;
}

// Generate daily dungeon rotation
export function generateDailyDungeons(playerLevel: number): GeneratedDungeon[] {
  return [
    generateRandomDungeon(playerLevel, 'easy', 'campaign'),
    generateRandomDungeon(playerLevel, 'normal', 'resource'),
    generateRandomDungeon(playerLevel, 'hard', 'trial'),
    generateRandomDungeon(playerLevel, 'nightmare', 'boss')
  ];
}
