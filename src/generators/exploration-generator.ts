// =====================================================
// EXPLORATION SYSTEM - Auto-battle, Resource Gathering
// =====================================================

export interface ResourceNode {
  id: string;
  type: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  spawnProbability: number; // 0-100
  gatherTime: number; // seconds
  cooldown: number; // seconds until next spawn
  rewards: { type: string; amount: number }[];
  x: number;
  y: number;
  isActive: boolean;
  lastGathered?: number;
}

export interface EnemyWave {
  id: string;
  level: number;
  enemies: any[];
  spawnX: number;
  spawnY: number;
  isActive: boolean;
  hp: number;
  maxHp: number;
}

export interface ExplorationArea {
  id: string;
  name: string;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  resourceNodes: ResourceNode[];
  enemyWaves: EnemyWave[];
  baseEnemyLevel: number;
  difficultyMultiplier: number;
}

// Resource spawn probabilities and timers by rarity
const RESOURCE_CONFIG = {
  common: { probability: 80, gatherTime: 5, cooldown: 30, rewardMultiplier: 1 },
  uncommon: { probability: 50, gatherTime: 15, cooldown: 60, rewardMultiplier: 2 },
  rare: { probability: 30, gatherTime: 30, cooldown: 120, rewardMultiplier: 5 },
  epic: { probability: 15, gatherTime: 60, cooldown: 300, rewardMultiplier: 10 },
  legendary: { probability: 5, gatherTime: 120, cooldown: 600, rewardMultiplier: 25 }
};

// Resource types by category
const RESOURCE_TYPES = {
  mining: [
    { type: 'iron_ore', rarity: 'common', name: 'Iron Ore', icon: '⛏️' },
    { type: 'mythril_ingot', rarity: 'rare', name: 'Mythril Ingot', icon: '🔩' },
    { type: 'dragon_scale', rarity: 'legendary', name: 'Dragon Scale', icon: '🐉' }
  ],
  gathering: [
    { type: 'essence_fiber', rarity: 'uncommon', name: 'Essence Fiber', icon: '🧵' },
    { type: 'mana_essence', rarity: 'rare', name: 'Mana Essence', icon: '✨' },
    { type: 'rare_core', rarity: 'epic', name: 'Rare Core', icon: '💎' }
  ],
  treasure: [
    { type: 'gold', rarity: 'common', name: 'Gold', icon: '💰' },
    { type: 'diamonds', rarity: 'epic', name: 'Diamonds', icon: '💎' },
    { type: 'gacha_token', rarity: 'legendary', name: 'Gacha Token', icon: '🎟️' }
  ]
};

// Generate resource nodes across the map
function generateResourceNodes(areaWidth: number, areaHeight: number, centerX: number, centerY: number): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  const nodeCount = 20;
  const minDistance = 50; // minimum distance from center
  
  let nodeId = 0;
  
  for (let i = 0; i < nodeCount; i++) {
    // Random position, but not too close to center
    let x, y;
    do {
      x = Math.random() * areaWidth;
      y = Math.random() * areaHeight;
    } while (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) < minDistance);
    
    // Random resource type
    const category = ['mining', 'gathering', 'treasure'][Math.floor(Math.random() * 3)];
    const resources = RESOURCE_TYPES[category as keyof typeof RESOURCE_TYPES];
    const resource = resources[Math.floor(Math.random() * resources.length)];
    
    const config = RESOURCE_CONFIG[resource.rarity];
    
    nodes.push({
      id: `node_${nodeId++}`,
      type: resource.type,
      name: resource.name,
      rarity: resource.rarity,
      spawnProbability: config.probability,
      gatherTime: config.gatherTime,
      cooldown: config.cooldown,
      rewards: [{
        type: resource.type,
        amount: Math.floor((1 + Math.random()) * config.rewardMultiplier)
      }],
      x,
      y,
      isActive: Math.random() * 100 < config.probability
    });
  }
  
  return nodes;
}

// Generate enemy wave with AI team composition
export function generateEnemyWave(level: number, difficulty: number = 1): EnemyWave {
  const enemyCount = 3 + Math.floor(level / 10);
  const enemies = [];
  
  // Random power type distribution
  const powerTypes = ['fire', 'water', 'earth', 'air', 'light', 'dark', 'electric', 'ice', 'poison', 'psychic', 'steel', 'nature'];
  const selectedTypes = [];
  
  for (let i = 0; i < Math.min(enemyCount, 3); i++) {
    selectedTypes.push(powerTypes[Math.floor(Math.random() * powerTypes.length)]);
  }
  
  for (let i = 0; i < enemyCount; i++) {
    const powerType = selectedTypes[i % selectedTypes.length];
    const rarityRoll = Math.random() * 100;
    
    let rarity = 'C';
    if (level > 50 && rarityRoll < 5) rarity = 'SSS';
    else if (level > 40 && rarityRoll < 10) rarity = 'SS';
    else if (level > 30 && rarityRoll < 20) rarity = 'S';
    else if (level > 20 && rarityRoll < 40) rarity = 'A';
    else if (level > 10 && rarityRoll < 60) rarity = 'B';
    
    const rankMultiplier = { C: 1, B: 1.2, A: 1.5, S: 2, SS: 2.5, SSS: 3 }[rarity] || 1;
    
    enemies.push({
      id: `enemy_${i}`,
      name: `Lv.${level} ${powerType} Enemy`,
      power_type: powerType,
      rank: rarity,
      level,
      hp: Math.floor(300 * level * rankMultiplier * difficulty),
      maxHp: Math.floor(300 * level * rankMultiplier * difficulty),
      attack: Math.floor(50 * level * rankMultiplier * difficulty),
      defense: Math.floor(30 * level * rankMultiplier * difficulty),
      speed: Math.floor(70 + level * 2)
    });
  }
  
  const totalHp = enemies.reduce((sum, e) => sum + e.hp, 0);
  
  return {
    id: `wave_${Date.now()}`,
    level,
    enemies,
    spawnX: Math.random() * 800,
    spawnY: Math.random() * 600,
    isActive: true,
    hp: totalHp,
    maxHp: totalHp
  };
}

// Generate exploration area
export function generateExplorationArea(playerLevel: number): ExplorationArea {
  const width = 1000;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const resourceNodes = generateResourceNodes(width, height, centerX, centerY);
  
  // Generate initial enemy waves
  const enemyWaves: EnemyWave[] = [];
  const waveCount = 3 + Math.floor(playerLevel / 10);
  
  for (let i = 0; i < waveCount; i++) {
    enemyWaves.push(generateEnemyWave(playerLevel, 1 + i * 0.2));
  }
  
  return {
    id: `area_${Date.now()}`,
    name: 'Exploration Area',
    width,
    height,
    centerX,
    centerY,
    resourceNodes,
    enemyWaves,
    baseEnemyLevel: playerLevel,
    difficultyMultiplier: 1
  };
}

// Check if mission conditions met, increase difficulty
export function checkMissionProgress(area: ExplorationArea, defeatedWaves: number, gatheredResources: number): boolean {
  const missionThresholds = [
    { waves: 5, resources: 10 },
    { waves: 15, resources: 30 },
    { waves: 30, resources: 60 },
    { waves: 50, resources: 100 }
  ];
  
  for (const threshold of missionThresholds) {
    if (defeatedWaves >= threshold.waves && gatheredResources >= threshold.resources) {
      area.difficultyMultiplier += 0.5;
      area.baseEnemyLevel += 5;
      return true;
    }
  }
  
  return false;
}

// Spawn new enemy wave when conditions met
export function spawnNewWave(area: ExplorationArea, activeWaves: number): EnemyWave | null {
  if (activeWaves < 3) {
    return generateEnemyWave(area.baseEnemyLevel, area.difficultyMultiplier);
  }
  return null;
}

// Update resource node availability
export function updateResourceNodes(nodes: ResourceNode[], currentTime: number): void {
  for (const node of nodes) {
    if (!node.isActive && node.lastGathered) {
      const timeSinceGathered = (currentTime - node.lastGathered) / 1000;
      
      if (timeSinceGathered >= node.cooldown) {
        // Check spawn probability
        if (Math.random() * 100 < node.spawnProbability) {
          node.isActive = true;
          node.lastGathered = undefined;
        }
      }
    }
  }
}

// Calculate auto-battle outcome
export function calculateBattle(heroes: any[], enemyWave: EnemyWave): {
  victory: boolean;
  heroDamage: number;
  enemyDamage: number;
  heroesDefeated: boolean;
} {
  const heroTotalPower = heroes.reduce((sum, h) => sum + (h.current_attack || 0) + (h.current_defense || 0), 0);
  const enemyTotalPower = enemyWave.enemies.reduce((sum, e) => sum + e.attack + e.defense, 0);
  
  const powerRatio = heroTotalPower / (enemyTotalPower || 1);
  
  // Calculate damage per tick
  const heroDamage = Math.floor(heroTotalPower * 0.1 * (1 + Math.random() * 0.2));
  const enemyDamage = Math.floor(enemyTotalPower * 0.1 * (1 + Math.random() * 0.2));
  
  // Heroes defeated if power ratio too low
  const heroesDefeated = powerRatio < 0.5 && Math.random() < 0.3;
  
  enemyWave.hp = Math.max(0, enemyWave.hp - heroDamage);
  const victory = enemyWave.hp <= 0;
  
  return {
    victory,
    heroDamage,
    enemyDamage,
    heroesDefeated
  };
}
