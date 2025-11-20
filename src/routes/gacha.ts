// =====================================================
// GACHA ROUTES
// =====================================================

import { Hono } from 'hono';
import { verifyToken } from './auth';

type Bindings = {
  DB: D1Database;
};

const gacha = new Hono<{ Bindings: Bindings }>();

function calculateHeroStats(hero: any, template: any): any {
  const level = 1;
  const rankMultiplier = { C: 1.0, B: 1.2, A: 1.5, S: 2.0, SS: 2.5, SSS: 3.0 }[hero.current_rank] || 1.0;
  
  return {
    hp: Math.floor(template.base_hp * rankMultiplier),
    attack: Math.floor(template.base_attack * rankMultiplier),
    defense: Math.floor(template.base_defense * rankMultiplier),
    speed: Math.floor(template.base_speed * rankMultiplier),
    crit_rate: template.base_crit_rate,
    crit_damage: template.base_crit_damage
  };
}

gacha.get('/banners', async (c) => {
  const banners = await c.env.DB.prepare(`
    SELECT * FROM gacha_banners WHERE is_active = 1
    ORDER BY banner_type
  `).all();
  
  return c.json({ success: true, banners: banners.results });
});

gacha.post('/pull', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { bannerId, pullType } = await c.req.json();
  
  const banner = await c.env.DB.prepare(`
    SELECT * FROM gacha_banners WHERE id = ? AND is_active = 1
  `).bind(bannerId).first();
  
  if (!banner) {
    return c.json({ error: 'Banner not found' }, 404);
  }
  
  const pullCount = pullType === 'multi' ? 10 : 1;
  const cost = pullType === 'multi' ? banner.cost_multi : banner.cost_single;
  
  const player = await c.env.DB.prepare(`
    SELECT premium_currency, gacha_pity_basic, gacha_pity_advanced, gacha_pity_essence
    FROM players WHERE id = ?
  `).bind(playerId).first();
  
  const pityColumn = banner.banner_type === 'basic' ? 'gacha_pity_basic' : 
                     banner.banner_type === 'essence' ? 'gacha_pity_essence' : 'gacha_pity_advanced';
  const currentPity = player[pityColumn] as number;
  
  if (banner.cost_currency === 'diamonds' && player.premium_currency < cost) {
    return c.json({ error: 'Not enough diamonds' }, 400);
  }
  
  const results = [];
  let newPity = currentPity;
  
  for (let i = 0; i < pullCount; i++) {
    newPity++;
    let rarity = 'C';
    
    if (newPity >= banner.pity_threshold) {
      rarity = banner.guaranteed_rarity as string;
      newPity = 0;
    } else {
      const roll = Math.random() * 10000;
      const rates = banner as any;
      
      if (roll < rates.rate_sss) rarity = 'SSS';
      else if (roll < rates.rate_sss + rates.rate_ss) rarity = 'SS';
      else if (roll < rates.rate_sss + rates.rate_ss + rates.rate_s) rarity = 'S';
      else if (roll < rates.rate_sss + rates.rate_ss + rates.rate_s + rates.rate_a) rarity = 'A';
      else if (roll < rates.rate_sss + rates.rate_ss + rates.rate_s + rates.rate_a + rates.rate_b) rarity = 'B';
      else rarity = 'C';
      
      if (['SSS', 'SS', 'S'].includes(rarity)) newPity = 0;
    }
    
    const heroPool = await c.env.DB.prepare(`
      SELECT * FROM hero_templates WHERE base_rarity = ? ORDER BY RANDOM() LIMIT 1
    `).bind(rarity).first();
    
    if (heroPool) {
      const stats = calculateHeroStats({ current_rank: rarity }, heroPool);
      
      const heroResult = await c.env.DB.prepare(`
        INSERT INTO player_heroes (
          player_id, hero_template_id, current_rank,
          current_hp, current_attack, current_defense, current_speed,
          current_crit_rate, current_crit_damage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(playerId, heroPool.id, rarity, stats.hp, stats.attack, stats.defense, 
              stats.speed, stats.crit_rate, stats.crit_damage).run();
      
      results.push({
        heroId: heroResult.meta.last_row_id,
        name: heroPool.name,
        rarity,
        powerType: heroPool.power_type,
        isNew: true,
        avatar: heroPool.avatar_url
      });
    }
  }
  
  await c.env.DB.batch([
    c.env.DB.prepare(`
      UPDATE players 
      SET premium_currency = premium_currency - ?,
          ${pityColumn} = ?,
          total_gacha_pulls = total_gacha_pulls + ?
      WHERE id = ?
    `).bind(cost, newPity, pullCount, playerId),
    
    c.env.DB.prepare(`
      INSERT INTO gacha_history (player_id, banner_id, pull_type, results, currency_spent, amount_spent, pity_counter)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(playerId, bannerId, pullType, JSON.stringify(results), banner.cost_currency, cost, currentPity)
  ]);
  
  return c.json({ 
    success: true, 
    results, 
    newPity,
    message: `You got ${results.filter(r => ['SSS', 'SS', 'S'].includes(r.rarity)).length} rare heroes!`
  });
});

export default gacha;
