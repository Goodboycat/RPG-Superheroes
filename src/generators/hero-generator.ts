// =====================================================
// PROCEDURAL HERO GENERATOR
// =====================================================

interface GeneratedHero {
  name: string;
  power_type: string;
  base_rarity: string;
  base_hp: number;
  base_attack: number;
  base_defense: number;
  base_speed: number;
  base_crit_rate: number;
  base_crit_damage: number;
  hp_growth: number;
  attack_growth: number;
  defense_growth: number;
  speed_growth: number;
  skill_1_name: string;
  skill_1_desc: string;
  skill_1_damage_multiplier: number;
  skill_2_name: string;
  skill_2_desc: string;
  skill_2_damage_multiplier: number;
  ultimate_name: string;
  ultimate_desc: string;
  ultimate_damage_multiplier: number;
  passive_name: string;
  passive_desc: string;
  avatar_url: string;
}

// Power types with their characteristics
const POWER_TYPES = {
  fire: { emoji: '🔥', strong_against: ['nature', 'ice'], weak_against: ['water'] },
  water: { emoji: '🌊', strong_against: ['fire', 'earth'], weak_against: ['electric'] },
  earth: { emoji: '🪨', strong_against: ['electric', 'steel'], weak_against: ['air'] },
  air: { emoji: '💨', strong_against: ['earth', 'poison'], weak_against: ['ice'] },
  light: { emoji: '✨', strong_against: ['dark'], weak_against: ['dark'] },
  dark: { emoji: '🌑', strong_against: ['light', 'psychic'], weak_against: ['light'] },
  electric: { emoji: '⚡', strong_against: ['water', 'air'], weak_against: ['earth'] },
  ice: { emoji: '❄️', strong_against: ['air', 'nature'], weak_against: ['fire'] },
  poison: { emoji: '☠️', strong_against: ['nature', 'water'], weak_against: ['steel'] },
  psychic: { emoji: '🧠', strong_against: ['poison', 'steel'], weak_against: ['dark'] },
  steel: { emoji: '🛡️', strong_against: ['ice', 'nature'], weak_against: ['fire'] },
  nature: { emoji: '🌿', strong_against: ['water', 'earth'], weak_against: ['fire', 'poison'] }
};

// Rarity multipliers
const RARITY_STATS = {
  C: { hp: 250, atk: 35, def: 20, spd: 70, weight: 4000, growth: 1.02 },
  B: { hp: 350, atk: 50, def: 30, spd: 75, weight: 3000, growth: 1.03 },
  A: { hp: 500, atk: 75, def: 50, spd: 80, weight: 2000, growth: 1.04 },
  S: { hp: 800, atk: 110, def: 80, spd: 85, weight: 800, growth: 1.05 },
  SS: { hp: 1200, atk: 150, def: 100, spd: 100, weight: 180, growth: 1.06 },
  SSS: { hp: 1500, atk: 180, def: 110, spd: 105, weight: 20, growth: 1.07 }
};

// Name generators by power type
const NAME_PREFIXES = {
  fire: ['Pyro', 'Inferno', 'Blaze', 'Ember', 'Scorch', 'Flame', 'Ignis', 'Cinder'],
  water: ['Aqua', 'Hydro', 'Tide', 'Wave', 'Torrent', 'Stream', 'Ocean', 'Marina'],
  earth: ['Terra', 'Stone', 'Rock', 'Boulder', 'Granite', 'Quake', 'Geo', 'Magma'],
  air: ['Zephyr', 'Wind', 'Gale', 'Breeze', 'Storm', 'Cyclone', 'Aero', 'Tempest'],
  light: ['Lumen', 'Radiant', 'Shine', 'Glow', 'Beam', 'Ray', 'Aurora', 'Celestia'],
  dark: ['Shadow', 'Void', 'Eclipse', 'Nox', 'Umbra', 'Dusk', 'Shade', 'Night'],
  electric: ['Volt', 'Spark', 'Thunder', 'Lightning', 'Bolt', 'Charge', 'Tesla', 'Amp'],
  ice: ['Frost', 'Cryo', 'Glacier', 'Chill', 'Icicle', 'Snow', 'Zero', 'Freeze'],
  poison: ['Venom', 'Toxic', 'Viper', 'Plague', 'Acid', 'Bane', 'Serpent', 'Toxin'],
  psychic: ['Psion', 'Mind', 'Cerebro', 'Neural', 'Kinetic', 'Psi', 'Mystic', 'Esper'],
  steel: ['Iron', 'Titan', 'Chrome', 'Metal', 'Alloy', 'Forge', 'Blade', 'Armor'],
  nature: ['Flora', 'Leaf', 'Root', 'Bloom', 'Vine', 'Thorn', 'Seed', 'Petal']
};

const NAME_SUFFIXES = ['', 'the Great', 'the Wise', 'the Swift', 'the Mighty', 'Lord', 'Master', 'Knight', 'Guardian', 'Warrior', 'Mage', 'Sage'];

// Skill name generators
const SKILL_ACTIONS = {
  fire: ['Flame', 'Inferno', 'Burn', 'Scorch', 'Meteor', 'Blaze'],
  water: ['Tsunami', 'Torrent', 'Whirlpool', 'Splash', 'Hydro', 'Aqua'],
  earth: ['Earthquake', 'Boulder', 'Rock', 'Landslide', 'Crystal', 'Quake'],
  air: ['Cyclone', 'Wind', 'Gale', 'Tornado', 'Storm', 'Breeze'],
  light: ['Holy', 'Divine', 'Radiant', 'Sacred', 'Purify', 'Bless'],
  dark: ['Shadow', 'Void', 'Curse', 'Death', 'Doom', 'Eclipse'],
  electric: ['Thunder', 'Lightning', 'Shock', 'Volt', 'Plasma', 'Chain'],
  ice: ['Blizzard', 'Freeze', 'Icicle', 'Frost', 'Hail', 'Glacier'],
  poison: ['Venom', 'Toxic', 'Plague', 'Acid', 'Decay', 'Miasma'],
  psychic: ['Mind', 'Psychic', 'Mental', 'Kinetic', 'Telepathy', 'Confusion'],
  steel: ['Metal', 'Iron', 'Steel', 'Blade', 'Hammer', 'Forge'],
  nature: ['Vine', 'Root', 'Thorn', 'Leaf', 'Bloom', 'Petal']
};

const SKILL_TYPES = ['Strike', 'Blast', 'Wave', 'Storm', 'Slash', 'Impact', 'Burst', 'Shot', 'Beam'];

// Random helpers
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate random rarity based on weights
function generateRarity(): string {
  const total = Object.values(RARITY_STATS).reduce((sum, r) => sum + r.weight, 0);
  let roll = Math.random() * total;
  
  for (const [rarity, stats] of Object.entries(RARITY_STATS)) {
    roll -= stats.weight;
    if (roll <= 0) return rarity;
  }
  
  return 'C';
}

// Generate hero name
function generateHeroName(powerType: string, rarity: string): string {
  const prefixes = NAME_PREFIXES[powerType as keyof typeof NAME_PREFIXES];
  const prefix = randomChoice(prefixes);
  const suffix = rarity === 'SSS' || rarity === 'SS' ? randomChoice(NAME_SUFFIXES.slice(1)) : randomChoice(NAME_SUFFIXES);
  
  return suffix ? `${prefix} ${suffix}` : prefix;
}

// Generate skill name
function generateSkillName(powerType: string): string {
  const actions = SKILL_ACTIONS[powerType as keyof typeof SKILL_ACTIONS];
  const action = randomChoice(actions);
  const type = randomChoice(SKILL_TYPES);
  
  return `${action} ${type}`;
}

// Generate skill description
function generateSkillDesc(skillName: string, powerType: string, damageMultiplier: number): string {
  const powerInfo = POWER_TYPES[powerType as keyof typeof POWER_TYPES];
  const descriptions = [
    `Unleashes ${skillName.toLowerCase()} dealing ${(damageMultiplier * 100).toFixed(0)}% damage`,
    `Channels ${powerType} power to strike with ${skillName.toLowerCase()}`,
    `Devastating ${powerType} attack that deals ${(damageMultiplier * 100).toFixed(0)}% damage`,
    `Harnesses ${powerType} essence for a powerful ${skillName.toLowerCase()}`
  ];
  
  return randomChoice(descriptions);
}

// Generate passive ability
function generatePassive(powerType: string, rarity: string): { name: string; desc: string } {
  const passiveTypes = [
    { name: `${powerType.charAt(0).toUpperCase() + powerType.slice(1)} Mastery`, desc: `Increases ${powerType} damage by 15%` },
    { name: 'Quick Reflexes', desc: 'Increases speed by 10%' },
    { name: 'Fortified', desc: 'Increases defense by 20%' },
    { name: 'Power Surge', desc: 'Increases attack by 15%' },
    { name: 'Vital Force', desc: 'Increases HP by 20%' },
    { name: 'Critical Eye', desc: 'Increases crit rate by 10%' },
    { name: 'Lethal Strike', desc: 'Increases crit damage by 25%' }
  ];
  
  if (rarity === 'SSS' || rarity === 'SS') {
    passiveTypes.push(
      { name: 'Legendary Aura', desc: 'Increases all stats by 10%' },
      { name: 'Immortal Spirit', desc: 'Survives fatal damage once per battle' },
      { name: 'Power Overwhelming', desc: 'Attack increases as HP decreases' }
    );
  }
  
  return randomChoice(passiveTypes);
}

// Main generator function
export function generateRandomHero(powerType?: string, rarity?: string): GeneratedHero {
  const selectedPowerType = powerType || randomChoice(Object.keys(POWER_TYPES));
  const selectedRarity = rarity || generateRarity();
  const rarityStats = RARITY_STATS[selectedRarity as keyof typeof RARITY_STATS];
  
  // Add variance to stats
  const variance = 0.2; // ±20%
  const hp = Math.floor(rarityStats.hp * randomFloat(1 - variance, 1 + variance));
  const attack = Math.floor(rarityStats.atk * randomFloat(1 - variance, 1 + variance));
  const defense = Math.floor(rarityStats.def * randomFloat(1 - variance, 1 + variance));
  const speed = Math.floor(rarityStats.spd * randomFloat(1 - variance, 1 + variance));
  
  // Generate skills
  const skill1Name = generateSkillName(selectedPowerType);
  const skill2Name = generateSkillName(selectedPowerType);
  const ultimateName = `Ultimate: ${generateSkillName(selectedPowerType)}`;
  const passive = generatePassive(selectedPowerType, selectedRarity);
  
  // Skill multipliers based on rarity
  const skill1Mult = randomFloat(0.8, 1.2);
  const skill2Mult = randomFloat(1.5, 2.0);
  const ultMult = randomFloat(3.0, 5.0);
  
  return {
    name: generateHeroName(selectedPowerType, selectedRarity),
    power_type: selectedPowerType,
    base_rarity: selectedRarity,
    base_hp: hp,
    base_attack: attack,
    base_defense: defense,
    base_speed: speed,
    base_crit_rate: randomInt(5, 15),
    base_crit_damage: randomInt(150, 200),
    hp_growth: rarityStats.growth + randomFloat(-0.01, 0.01),
    attack_growth: rarityStats.growth - 0.01 + randomFloat(-0.005, 0.005),
    defense_growth: rarityStats.growth - 0.02 + randomFloat(-0.005, 0.005),
    speed_growth: rarityStats.growth - 0.03 + randomFloat(-0.005, 0.005),
    skill_1_name: skill1Name,
    skill_1_desc: generateSkillDesc(skill1Name, selectedPowerType, skill1Mult),
    skill_1_damage_multiplier: skill1Mult,
    skill_2_name: skill2Name,
    skill_2_desc: generateSkillDesc(skill2Name, selectedPowerType, skill2Mult),
    skill_2_damage_multiplier: skill2Mult,
    ultimate_name: ultimateName,
    ultimate_desc: `Unleashes the ultimate ${selectedPowerType} power!`,
    ultimate_damage_multiplier: ultMult,
    passive_name: passive.name,
    passive_desc: passive.desc,
    avatar_url: POWER_TYPES[selectedPowerType as keyof typeof POWER_TYPES].emoji
  };
}

// Generate a batch of heroes
export function generateHeroBatch(count: number): GeneratedHero[] {
  const heroes: GeneratedHero[] = [];
  
  for (let i = 0; i < count; i++) {
    heroes.push(generateRandomHero());
  }
  
  return heroes;
}

// Generate hero with specific requirements
export function generateHeroWithRequirements(requirements: {
  powerType?: string;
  rarity?: string;
  minAttack?: number;
  role?: 'tank' | 'dps' | 'support';
}): GeneratedHero {
  let hero = generateRandomHero(requirements.powerType, requirements.rarity);
  
  // Adjust stats based on role
  if (requirements.role) {
    const rarityStats = RARITY_STATS[hero.base_rarity as keyof typeof RARITY_STATS];
    
    switch (requirements.role) {
      case 'tank':
        hero.base_hp = Math.floor(hero.base_hp * 1.5);
        hero.base_defense = Math.floor(hero.base_defense * 1.5);
        hero.base_attack = Math.floor(hero.base_attack * 0.7);
        break;
      case 'dps':
        hero.base_attack = Math.floor(hero.base_attack * 1.5);
        hero.base_crit_rate = Math.floor(hero.base_crit_rate * 1.5);
        hero.base_defense = Math.floor(hero.base_defense * 0.7);
        break;
      case 'support':
        hero.base_speed = Math.floor(hero.base_speed * 1.3);
        hero.base_hp = Math.floor(hero.base_hp * 1.2);
        hero.base_attack = Math.floor(hero.base_attack * 0.8);
        break;
    }
  }
  
  // Ensure minimum attack if specified
  if (requirements.minAttack && hero.base_attack < requirements.minAttack) {
    hero.base_attack = requirements.minAttack;
  }
  
  return hero;
}
