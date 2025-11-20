// =====================================================
// HEROES ROUTES - With Procedural Generation
// =====================================================

import { Hono } from 'hono';
import { verifyToken } from './auth';
import { generateRandomHero, generateHeroBatch } from '../generators/hero-generator';

type Bindings = {
  DB: D1Database;
};

const heroes = new Hono<{ Bindings: Bindings }>();

function calculateHeroStats(hero: any, template: any): any {
  const level = hero.current_level;
  const rankMultiplier = { C: 1.0, B: 1.2, A: 1.5, S: 2.0, SS: 2.5, SSS: 3.0 }[hero.current_rank] || 1.0;
  const awakeningBonus = hero.awakening_level * 0.05;
  const limitBreakBonus = hero.limit_break_level * 0.1;
  
  return {
    hp: Math.floor(template.base_hp * Math.pow(template.hp_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    attack: Math.floor(template.base_attack * Math.pow(template.attack_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    defense: Math.floor(template.base_defense * Math.pow(template.defense_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    speed: Math.floor(template.base_speed * Math.pow(template.speed_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    crit_rate: template.base_crit_rate + hero.potential_level * 0.1,
    crit_damage: template.base_crit_damage + hero.potential_level * 2
  };
}

// Get all hero templates (static + generated)
heroes.get('/templates', async (c) => {
  const templates = await c.env.DB.prepare(`
    SELECT * FROM hero_templates ORDER BY base_rarity DESC, name LIMIT 50
  `).all();
  
  return c.json({ success: true, templates: templates.results });
});

// Get player's heroes
heroes.get('/player', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const heroesData = await c.env.DB.prepare(`
    SELECT ph.*, ht.name, ht.power_type, ht.base_rarity,
           ht.skill_1_name, ht.skill_2_name, ht.ultimate_name, ht.passive_name,
           ht.avatar_url
    FROM player_heroes ph
    JOIN hero_templates ht ON ph.hero_template_id = ht.id
    WHERE ph.player_id = ?
    ORDER BY ph.current_rank DESC, ph.current_level DESC
  `).bind(playerId).all();
  
  return c.json({ success: true, heroes: heroesData.results });
});

// Generate random heroes (for testing/events)
heroes.post('/generate', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { count = 10 } = await c.req.json();
  
  // Generate heroes
  const newHeroes = generateHeroBatch(Math.min(count, 50));
  
  // Insert into database
  const insertedHeroes = [];
  
  for (const hero of newHeroes) {
    // Check if template exists
    let template = await c.env.DB.prepare(`
      SELECT id FROM hero_templates 
      WHERE name = ? AND power_type = ? AND base_rarity = ?
    `).bind(hero.name, hero.power_type, hero.base_rarity).first();
    
    // If template doesn't exist, create it
    if (!template) {
      const result = await c.env.DB.prepare(`
        INSERT INTO hero_templates (
          name, power_type, base_rarity,
          base_hp, base_attack, base_defense, base_speed, base_crit_rate, base_crit_damage,
          hp_growth, attack_growth, defense_growth, speed_growth,
          skill_1_name, skill_1_desc, skill_1_damage_multiplier, skill_1_cooldown,
          skill_2_name, skill_2_desc, skill_2_damage_multiplier, skill_2_cooldown,
          ultimate_name, ultimate_desc, ultimate_damage_multiplier, ultimate_cooldown,
          passive_name, passive_desc, passive_effect,
          avatar_url, gacha_weight
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 2, ?, ?, ?, 4, ?, ?, '{}', ?, 100)
      `).bind(
        hero.name, hero.power_type, hero.base_rarity,
        hero.base_hp, hero.base_attack, hero.base_defense, hero.base_speed,
        hero.base_crit_rate, hero.base_crit_damage,
        hero.hp_growth, hero.attack_growth, hero.defense_growth, hero.speed_growth,
        hero.skill_1_name, hero.skill_1_desc, hero.skill_1_damage_multiplier,
        hero.skill_2_name, hero.skill_2_desc, hero.skill_2_damage_multiplier,
        hero.ultimate_name, hero.ultimate_desc, hero.ultimate_damage_multiplier,
        hero.passive_name, hero.passive_desc,
        hero.avatar_url
      ).run();
      
      template = { id: result.meta.last_row_id };
    }
    
    insertedHeroes.push({
      ...hero,
      template_id: template.id
    });
  }
  
  return c.json({ 
    success: true, 
    heroes: insertedHeroes,
    message: `Generated ${newHeroes.length} new heroes!`
  });
});

// Level up hero
heroes.post('/level-up', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { heroId } = await c.req.json();
  
  // Check resources
  const resources = await c.env.DB.prepare(`
    SELECT quantity FROM player_resources
    WHERE player_id = ? AND resource_type_code = 'level_stone'
  `).bind(playerId).first();
  
  if (!resources || resources.quantity < 1) {
    return c.json({ error: 'Not enough Level Stones' }, 400);
  }
  
  // Get hero
  const hero = await c.env.DB.prepare(`
    SELECT ph.*, ht.*
    FROM player_heroes ph
    JOIN hero_templates ht ON ph.hero_template_id = ht.id
    WHERE ph.id = ? AND ph.player_id = ?
  `).bind(heroId, playerId).first();
  
  if (!hero) {
    return c.json({ error: 'Hero not found' }, 404);
  }
  
  const newLevel = hero.current_level + 1;
  const newStats = calculateHeroStats({ ...hero, current_level: newLevel }, hero);
  
  // Update hero
  await c.env.DB.batch([
    c.env.DB.prepare(`
      UPDATE player_heroes 
      SET current_level = ?, 
          current_hp = ?, current_attack = ?, current_defense = ?,
          current_speed = ?, current_crit_rate = ?, current_crit_damage = ?
      WHERE id = ?
    `).bind(newLevel, newStats.hp, newStats.attack, newStats.defense, 
            newStats.speed, newStats.crit_rate, newStats.crit_damage, heroId),
    
    c.env.DB.prepare(`
      UPDATE player_resources 
      SET quantity = quantity - 1 
      WHERE player_id = ? AND resource_type_code = 'level_stone'
    `).bind(playerId)
  ]);
  
  return c.json({ success: true, newLevel, newStats });
});

export default heroes;
