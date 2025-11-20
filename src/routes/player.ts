// =====================================================
// PLAYER ROUTES
// =====================================================

import { Hono } from 'hono';
import { verifyToken } from './auth';

type Bindings = {
  DB: D1Database;
};

const player = new Hono<{ Bindings: Bindings }>();

player.get('/profile', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const playerData = await c.env.DB.prepare(`
    SELECT id, username, email, account_level, total_exp, current_exp, exp_to_next_level,
           vip_level, premium_currency, free_currency, energy, max_energy,
           gacha_pity_basic, gacha_pity_advanced, gacha_pity_essence,
           tutorial_completed, prestige_level, total_battles, battles_won,
           created_at, last_login, clan_id
    FROM players WHERE id = ?
  `).bind(playerId).first();
  
  return c.json({ success: true, player: playerData });
});

player.get('/resources', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const resources = await c.env.DB.prepare(`
    SELECT pr.resource_type_code, pr.quantity, rt.name, rt.category, rt.rarity, rt.icon_url
    FROM player_resources pr
    JOIN resource_types rt ON pr.resource_type_code = rt.code
    WHERE pr.player_id = ?
    ORDER BY rt.category, rt.rarity
  `).bind(playerId).all();
  
  return c.json({ success: true, resources: resources.results });
});

export default player;
