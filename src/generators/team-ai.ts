// =====================================================
// AI TEAM COMPOSITION SYSTEM
// =====================================================

interface Hero {
  id: number;
  name: string;
  power_type: string;
  current_rank: string;
  current_level: number;
  current_hp: number;
  current_attack: number;
  current_defense: number;
  current_speed: number;
  current_crit_rate: number;
  current_crit_damage: number;
}

interface TeamComposition {
  heroes: Hero[];
  totalPower: number;
  typeBalance: Record<string, number>;
  roles: string[];
  synergy: number;
  strategy: string;
}

// Role detection based on stats
function detectHeroRole(hero: Hero): string {
  const hpRatio = hero.current_hp / (hero.current_attack + hero.current_defense);
  const atkRatio = hero.current_attack / (hero.current_hp + hero.current_defense);
  const defRatio = hero.current_defense / (hero.current_hp + hero.current_attack);
  const spdRatio = hero.current_speed / 100;
  
  if (hpRatio > 0.6 && defRatio > 0.3) return 'tank';
  if (atkRatio > 0.5) return 'dps';
  if (spdRatio > 1.0 && hpRatio > 0.3) return 'support';
  if (atkRatio > 0.4 && spdRatio > 0.9) return 'assassin';
  
  return 'balanced';
}

// Calculate hero power score
function calculateHeroPower(hero: Hero): number {
  const rankMultiplier = { C: 1, B: 1.5, A: 2.5, S: 4, SS: 6, SSS: 10 }[hero.current_rank] || 1;
  const statSum = hero.current_hp * 0.5 + hero.current_attack + hero.current_defense * 0.8 + hero.current_speed * 0.3;
  
  return Math.floor(statSum * rankMultiplier * (1 + hero.current_level * 0.1));
}

// Type advantage calculator
function getTypeAdvantage(attackerType: string, defenderType: string): number {
  const advantages: Record<string, string[]> = {
    fire: ['nature', 'ice'],
    water: ['fire', 'earth'],
    earth: ['electric', 'steel'],
    air: ['earth', 'poison'],
    light: ['dark'],
    dark: ['light', 'psychic'],
    electric: ['water', 'air'],
    ice: ['air', 'nature'],
    poison: ['nature', 'water'],
    psychic: ['poison', 'steel'],
    steel: ['ice', 'nature'],
    nature: ['water', 'earth']
  };
  
  const weaknesses: Record<string, string[]> = {
    fire: ['water'],
    water: ['electric'],
    earth: ['air'],
    air: ['ice'],
    light: ['dark'],
    dark: ['light'],
    electric: ['earth'],
    ice: ['fire'],
    poison: ['steel'],
    psychic: ['dark'],
    steel: ['fire'],
    nature: ['fire', 'poison']
  };
  
  if (advantages[attackerType]?.includes(defenderType)) return 1.5;
  if (weaknesses[attackerType]?.includes(defenderType)) return 0.7;
  
  return 1.0;
}

// Calculate team synergy
function calculateTeamSynergy(heroes: Hero[]): number {
  let synergyScore = 0;
  const types = heroes.map(h => h.power_type);
  const roles = heroes.map(h => detectHeroRole(h));
  
  // Type diversity bonus
  const uniqueTypes = new Set(types).size;
  synergyScore += uniqueTypes * 5;
  
  // Role balance bonus
  const hasTank = roles.includes('tank');
  const hasDPS = roles.includes('dps') || roles.includes('assassin');
  const hasSupport = roles.includes('support');
  
  if (hasTank) synergyScore += 10;
  if (hasDPS) synergyScore += 10;
  if (hasSupport) synergyScore += 10;
  if (hasTank && hasDPS && hasSupport) synergyScore += 20; // Perfect composition
  
  // Level balance (avoid too much level disparity)
  const levels = heroes.map(h => h.current_level);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  const levelVariance = levels.reduce((sum, l) => sum + Math.abs(l - avgLevel), 0) / levels.length;
  synergyScore -= levelVariance * 2;
  
  return Math.max(0, Math.min(100, synergyScore));
}

// AI: Build optimal team for general combat
export function buildOptimalTeam(
  availableHeroes: Hero[],
  teamSize: number = 5
): TeamComposition {
  if (availableHeroes.length === 0) {
    return {
      heroes: [],
      totalPower: 0,
      typeBalance: {},
      roles: [],
      synergy: 0,
      strategy: 'No heroes available'
    };
  }
  
  // Sort by power
  const sortedHeroes = [...availableHeroes].sort((a, b) => 
    calculateHeroPower(b) - calculateHeroPower(a)
  );
  
  const team: Hero[] = [];
  const roles: string[] = [];
  const typeBalance: Record<string, number> = {};
  
  // Priority: Tank > DPS > Support > Fill
  const herosByRole: Record<string, Hero[]> = {
    tank: [],
    dps: [],
    assassin: [],
    support: [],
    balanced: []
  };
  
  // Categorize heroes
  for (const hero of sortedHeroes) {
    const role = detectHeroRole(hero);
    herosByRole[role].push(hero);
  }
  
  // Build team composition
  // 1. Add best tank
  if (herosByRole.tank.length > 0) {
    team.push(herosByRole.tank[0]);
    roles.push('tank');
  }
  
  // 2. Add 2-3 DPS/Assassins
  const dpsPool = [...herosByRole.dps, ...herosByRole.assassin];
  for (let i = 0; i < Math.min(3, dpsPool.length) && team.length < teamSize; i++) {
    team.push(dpsPool[i]);
    roles.push(dpsPool[i] === herosByRole.dps[0] ? 'dps' : 'assassin');
  }
  
  // 3. Add support if available
  if (herosByRole.support.length > 0 && team.length < teamSize) {
    team.push(herosByRole.support[0]);
    roles.push('support');
  }
  
  // 4. Fill remaining slots with highest power
  for (const hero of sortedHeroes) {
    if (team.length >= teamSize) break;
    if (!team.includes(hero)) {
      team.push(hero);
      roles.push(detectHeroRole(hero));
    }
  }
  
  // Calculate type balance
  for (const hero of team) {
    typeBalance[hero.power_type] = (typeBalance[hero.power_type] || 0) + 1;
  }
  
  const totalPower = team.reduce((sum, h) => sum + calculateHeroPower(h), 0);
  const synergy = calculateTeamSynergy(team);
  
  return {
    heroes: team,
    totalPower,
    typeBalance,
    roles,
    synergy,
    strategy: 'Balanced team with tank, DPS, and support'
  };
}

// AI: Build counter team based on enemy types
export function buildCounterTeam(
  availableHeroes: Hero[],
  enemyTypes: string[],
  teamSize: number = 5
): TeamComposition {
  if (availableHeroes.length === 0) {
    return buildOptimalTeam(availableHeroes, teamSize);
  }
  
  // Score each hero based on type advantage against enemies
  const scoredHeroes = availableHeroes.map(hero => {
    let advantageScore = 0;
    
    for (const enemyType of enemyTypes) {
      const advantage = getTypeAdvantage(hero.power_type, enemyType);
      advantageScore += advantage;
    }
    
    const powerScore = calculateHeroPower(hero);
    const totalScore = powerScore * (1 + advantageScore / 10);
    
    return { hero, score: totalScore, advantageScore };
  });
  
  // Sort by total score
  scoredHeroes.sort((a, b) => b.score - a.score);
  
  const team = scoredHeroes.slice(0, teamSize).map(s => s.hero);
  const roles = team.map(h => detectHeroRole(h));
  const typeBalance: Record<string, number> = {};
  
  for (const hero of team) {
    typeBalance[hero.power_type] = (typeBalance[hero.power_type] || 0) + 1;
  }
  
  const totalPower = team.reduce((sum, h) => sum + calculateHeroPower(h), 0);
  const synergy = calculateTeamSynergy(team);
  
  const counterTypes = team
    .filter(h => enemyTypes.some(et => getTypeAdvantage(h.power_type, et) > 1.0))
    .map(h => h.power_type);
  
  return {
    heroes: team,
    totalPower,
    typeBalance,
    roles,
    synergy,
    strategy: `Counter team with ${counterTypes.join(', ')} types to exploit enemy weaknesses`
  };
}

// AI: Build team for specific dungeon
export function buildDungeonTeam(
  availableHeroes: Hero[],
  dungeonInfo: {
    enemy_types: string[];
    difficulty: string;
    has_boss: boolean;
  },
  teamSize: number = 5
): TeamComposition {
  // For boss fights, prioritize tanks and sustained DPS
  if (dungeonInfo.has_boss) {
    const team: Hero[] = [];
    const herosByRole: Record<string, Hero[]> = {};
    
    for (const hero of availableHeroes) {
      const role = detectHeroRole(hero);
      if (!herosByRole[role]) herosByRole[role] = [];
      herosByRole[role].push(hero);
    }
    
    // Sort each role by power
    for (const role in herosByRole) {
      herosByRole[role].sort((a, b) => calculateHeroPower(b) - calculateHeroPower(a));
    }
    
    // Boss team: 2 tanks, 2 DPS, 1 support
    if (herosByRole.tank?.length > 0) {
      team.push(...herosByRole.tank.slice(0, Math.min(2, teamSize)));
    }
    
    const dpsCount = Math.max(2, teamSize - team.length - 1);
    if (herosByRole.dps?.length > 0) {
      team.push(...herosByRole.dps.slice(0, Math.min(dpsCount, teamSize - team.length)));
    }
    
    if (herosByRole.support?.length > 0 && team.length < teamSize) {
      team.push(herosByRole.support[0]);
    }
    
    // Fill with highest power
    const remaining = availableHeroes
      .filter(h => !team.includes(h))
      .sort((a, b) => calculateHeroPower(b) - calculateHeroPower(a));
    
    team.push(...remaining.slice(0, teamSize - team.length));
    
    const typeBalance: Record<string, number> = {};
    for (const hero of team) {
      typeBalance[hero.power_type] = (typeBalance[hero.power_type] || 0) + 1;
    }
    
    return {
      heroes: team,
      totalPower: team.reduce((sum, h) => sum + calculateHeroPower(h), 0),
      typeBalance,
      roles: team.map(h => detectHeroRole(h)),
      synergy: calculateTeamSynergy(team),
      strategy: 'Boss raid composition: High survivability with sustained damage'
    };
  }
  
  // For regular dungeons, use counter team
  return buildCounterTeam(availableHeroes, dungeonInfo.enemy_types, teamSize);
}

// AI: Suggest team improvements
export function suggestTeamImprovements(
  currentTeam: Hero[],
  allHeroes: Hero[]
): string[] {
  const suggestions: string[] = [];
  const roles = currentTeam.map(h => detectHeroRole(h));
  const types = currentTeam.map(h => h.power_type);
  
  // Check role balance
  if (!roles.includes('tank')) {
    const tanks = allHeroes.filter(h => detectHeroRole(h) === 'tank' && !currentTeam.includes(h));
    if (tanks.length > 0) {
      suggestions.push(`Add a tank like ${tanks[0].name} for better survivability`);
    }
  }
  
  if (!roles.includes('support')) {
    const supports = allHeroes.filter(h => detectHeroRole(h) === 'support' && !currentTeam.includes(h));
    if (supports.length > 0) {
      suggestions.push(`Add support hero ${supports[0].name} for team buffs`);
    }
  }
  
  // Check type diversity
  const uniqueTypes = new Set(types).size;
  if (uniqueTypes < 3) {
    suggestions.push('Increase type diversity for better coverage against different enemies');
  }
  
  // Check level gaps
  const levels = currentTeam.map(h => h.current_level);
  const maxLevel = Math.max(...levels);
  const minLevel = Math.min(...levels);
  
  if (maxLevel - minLevel > 10) {
    suggestions.push('Level up weaker heroes to match your strongest ones');
  }
  
  // Check for weak heroes
  const avgPower = currentTeam.reduce((sum, h) => sum + calculateHeroPower(h), 0) / currentTeam.length;
  const weakHeroes = currentTeam.filter(h => calculateHeroPower(h) < avgPower * 0.6);
  
  if (weakHeroes.length > 0) {
    suggestions.push(`Consider replacing ${weakHeroes[0].name} with a stronger hero`);
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Team composition looks solid! Keep leveling and upgrading.');
  }
  
  return suggestions;
}
