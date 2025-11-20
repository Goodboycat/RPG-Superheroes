// =====================================================
// TEAM AI ROUTES - AI-Powered Team Building
// =====================================================

import { Hono } from 'hono';
import { verifyToken } from './auth';
import { buildOptimalTeam, buildCounterTeam, buildDungeonTeam } from '../generators/team-ai';

type Bindings = {
  DB: D1Database;
};

const team = new Hono<{ Bindings: Bindings }>();

// Build optimal team
team.post('/optimal', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { teamSize = 5 } = await c.req.json();
  
  // Get player's heroes
  const heroes = await c.env.DB.prepare(`
    SELECT ph.*, ht.name, ht.power_type
    FROM player_heroes ph
    JOIN hero_templates ht ON ph.hero_template_id = ht.id
    WHERE ph.player_id = ?
  `).bind(playerId).all();
  
  if (heroes.results.length === 0) {
    return c.json({ error: 'No heroes available' }, 400);
  }
  
  const composition = buildOptimalTeam(heroes.results as any[], teamSize);
  
  return c.json({
    success: true,
    composition,
    message: `Built optimal team with ${composition.synergy}% synergy`
  });
});

// Build counter team
team.post('/counter', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { enemyTypes, teamSize = 5 } = await c.req.json();
  
  if (!enemyTypes || !Array.isArray(enemyTypes)) {
    return c.json({ error: 'Enemy types required' }, 400);
  }
  
  // Get player's heroes
  const heroes = await c.env.DB.prepare(`
    SELECT ph.*, ht.name, ht.power_type
    FROM player_heroes ph
    JOIN hero_templates ht ON ph.hero_template_id = ht.id
    WHERE ph.player_id = ?
  `).bind(playerId).all();
  
  if (heroes.results.length === 0) {
    return c.json({ error: 'No heroes available' }, 400);
  }
  
  const composition = buildCounterTeam(heroes.results as any[], enemyTypes, teamSize);
  
  return c.json({
    success: true,
    composition,
    message: `Built counter team against ${enemyTypes.join(', ')}`
  });
});

// Build dungeon-specific team
team.post('/dungeon', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { dungeonId, teamSize = 5 } = await c.req.json();
  
  // Get dungeon info
  const dungeon = await c.env.DB.prepare(`
    SELECT * FROM dungeon_templates WHERE id = ?
  `).bind(dungeonId).first();
  
  if (!dungeon) {
    return c.json({ error: 'Dungeon not found' }, 404);
  }
  
  // Parse enemy configuration
  const enemyConfig = JSON.parse(dungeon.enemy_configuration as string);
  const enemyTypes = enemyConfig.map((e: any) => e.power_type);
  
  // Get player's heroes
  const heroes = await c.env.DB.prepare(`
    SELECT ph.*, ht.name, ht.power_type
    FROM player_heroes ph
    JOIN hero_templates ht ON ph.hero_template_id = ht.id
    WHERE ph.player_id = ?
  `).bind(playerId).all();
  
  if (heroes.results.length === 0) {
    return c.json({ error: 'No heroes available' }, 400);
  }
  
  const dungeonInfo = {
    enemy_types: enemyTypes,
    difficulty: dungeon.difficulty as string,
    has_boss: dungeon.dungeon_type === 'boss'
  };
  
  const composition = buildDungeonTeam(heroes.results as any[], dungeonInfo, teamSize);
  
  return c.json({
    success: true,
    composition,
    message: `Built team for ${dungeon.name}`
  });
});

export default team;
