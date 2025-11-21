// =====================================================
// EXPLORATION ROUTES - Auto-battle & Resource Gathering
// =====================================================

import { Hono } from 'hono';
import { verifyToken } from './auth';
import { generateExplorationArea, generateEnemyWave, calculateBattle, updateResourceNodes } from '../generators/exploration-generator';

type Bindings = {
  DB: D1Database;
};

const exploration = new Hono<{ Bindings: Bindings }>();

// Get or create exploration session
exploration.get('/session', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const player = await c.env.DB.prepare(`
    SELECT account_level FROM players WHERE id = ?
  `).bind(playerId).first();
  
  // Generate new exploration area
  const area = generateExplorationArea(player.account_level);
  
  return c.json({
    success: true,
    area,
    message: 'Exploration area generated'
  });
});

// Dispatch heroes to gather resource
exploration.post('/dispatch', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { heroIds, nodeId, gatherTime } = await c.req.json();
  
  if (!heroIds || heroIds.length === 0) {
    return c.json({ error: 'No heroes selected' }, 400);
  }
  
  // Record dispatch
  const dispatchId = Date.now();
  const completionTime = Math.floor(Date.now() / 1000) + gatherTime;
  
  return c.json({
    success: true,
    dispatchId,
    completionTime,
    message: `Heroes dispatched for ${gatherTime}s`
  });
});

// Claim gathered resources
exploration.post('/claim', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { rewards } = await c.req.json();
  
  // Grant rewards
  for (const reward of rewards) {
    if (reward.type === 'gold' || reward.type === 'diamonds') {
      await c.env.DB.prepare(`
        UPDATE players SET ${reward.type === 'gold' ? 'free_currency' : 'premium_currency'} = 
        ${reward.type === 'gold' ? 'free_currency' : 'premium_currency'} + ?
        WHERE id = ?
      `).bind(reward.amount, playerId).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO player_resources (player_id, resource_type_code, quantity)
        VALUES (?, ?, ?)
        ON CONFLICT(player_id, resource_type_code) 
        DO UPDATE SET quantity = quantity + ?
      `).bind(playerId, reward.type, reward.amount, reward.amount).run();
    }
  }
  
  return c.json({
    success: true,
    rewards,
    message: 'Resources claimed!'
  });
});

// Auto-battle tick
exploration.post('/battle-tick', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { enemyWave, heroTeam } = await c.req.json();
  
  // Calculate battle result
  const result = calculateBattle(heroTeam, enemyWave);
  
  if (result.victory) {
    // Grant battle rewards
    const rewards = [
      { type: 'gold', amount: Math.floor(100 * enemyWave.level * (1 + Math.random())) },
      { type: 'mana_essence', amount: Math.floor(10 * enemyWave.level * Math.random()) }
    ];
    
    for (const reward of rewards) {
      if (reward.type === 'gold') {
        await c.env.DB.prepare(`
          UPDATE players SET free_currency = free_currency + ? WHERE id = ?
        `).bind(reward.amount, playerId).run();
      } else {
        await c.env.DB.prepare(`
          INSERT INTO player_resources (player_id, resource_type_code, quantity)
          VALUES (?, ?, ?)
          ON CONFLICT(player_id, resource_type_code) 
          DO UPDATE SET quantity = quantity + ?
        `).bind(playerId, reward.type, reward.amount, reward.amount).run();
      }
    }
    
    return c.json({
      success: true,
      result,
      rewards,
      message: 'Enemy wave defeated!'
    });
  }
  
  return c.json({
    success: true,
    result,
    message: result.heroesDefeated ? 'Heroes defeated! Respawning...' : 'Battle continues...'
  });
});

export default exploration;
