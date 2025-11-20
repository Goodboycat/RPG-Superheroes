// =====================================================
// DUNGEONS ROUTES - With Procedural Generation
// =====================================================

import { Hono } from 'hono';
import { verifyToken } from './auth';
import { generateRandomDungeon, generateDailyDungeons } from '../generators/dungeon-generator';

type Bindings = {
  DB: D1Database;
};

const dungeons = new Hono<{ Bindings: Bindings }>();

// Get available dungeons
dungeons.get('/', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const player = await c.env.DB.prepare(`
    SELECT account_level FROM players WHERE id = ?
  `).bind(playerId).first();
  
  const dungeonsData = await c.env.DB.prepare(`
    SELECT d.*, pdp.times_completed, pdp.best_score, pdp.first_clear_claimed
    FROM dungeon_templates d
    LEFT JOIN player_dungeon_progress pdp ON d.id = pdp.dungeon_id AND pdp.player_id = ?
    WHERE d.is_active = 1 AND d.required_level <= ?
    ORDER BY d.required_level, d.difficulty
  `).bind(playerId, player.account_level).all();
  
  return c.json({ success: true, dungeons: dungeonsData.results });
});

// Generate daily dungeons
dungeons.post('/generate-daily', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const player = await c.env.DB.prepare(`
    SELECT account_level FROM players WHERE id = ?
  `).bind(playerId).first();
  
  // Generate new daily dungeons
  const newDungeons = generateDailyDungeons(player.account_level);
  
  // Insert into database
  const insertedDungeons = [];
  
  for (const dungeon of newDungeons) {
    const result = await c.env.DB.prepare(`
      INSERT INTO dungeon_templates (
        name, dungeon_type, difficulty,
        required_level, required_team_power, energy_cost,
        first_clear_rewards, clear_rewards,
        enemy_configuration, special_mechanics,
        recommended_types, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      dungeon.name, dungeon.dungeon_type, dungeon.difficulty,
      dungeon.required_level, dungeon.required_team_power, dungeon.energy_cost,
      JSON.stringify(dungeon.rewards), JSON.stringify(dungeon.rewards),
      JSON.stringify(dungeon.enemy_team), dungeon.special_mechanics || null,
      JSON.stringify(dungeon.recommended_types)
    ).run();
    
    insertedDungeons.push({
      id: result.meta.last_row_id,
      ...dungeon
    });
  }
  
  return c.json({ 
    success: true, 
    dungeons: insertedDungeons,
    message: `Generated ${newDungeons.length} new dungeons!`
  });
});

// Battle dungeon
dungeons.post('/battle', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  const playerId = await verifyToken(token, c.env.DB);
  if (!playerId) return c.json({ error: 'Invalid token' }, 401);
  
  const { dungeonId, teamHeroIds } = await c.req.json();
  
  // Get dungeon
  const dungeon = await c.env.DB.prepare(`
    SELECT * FROM dungeon_templates WHERE id = ?
  `).bind(dungeonId).first();
  
  if (!dungeon) {
    return c.json({ error: 'Dungeon not found' }, 404);
  }
  
  // Check energy
  const player = await c.env.DB.prepare(`
    SELECT energy FROM players WHERE id = ?
  `).bind(playerId).first();
  
  if (player.energy < dungeon.energy_cost) {
    return c.json({ error: 'Not enough energy' }, 400);
  }
  
  // Simple battle simulation
  const teamPower = teamHeroIds.length * 1000;
  const enemyPower = dungeon.required_team_power * 0.8;
  
  const victory = teamPower >= enemyPower;
  
  let rewards = [];
  if (victory) {
    rewards = JSON.parse(dungeon.clear_rewards as string);
    
    // Check first clear
    const progress = await c.env.DB.prepare(`
      SELECT first_clear_claimed FROM player_dungeon_progress
      WHERE player_id = ? AND dungeon_id = ?
    `).bind(playerId, dungeonId).first();
    
    if (!progress) {
      const firstClearRewards = JSON.parse(dungeon.first_clear_rewards as string);
      rewards = [...rewards, ...firstClearRewards];
    }
    
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
    
    // Update progress
    await c.env.DB.prepare(`
      INSERT INTO player_dungeon_progress (player_id, dungeon_id, times_completed, first_clear_claimed, total_attempts)
      VALUES (?, ?, 1, 1, 1)
      ON CONFLICT(player_id, dungeon_id)
      DO UPDATE SET times_completed = times_completed + 1, total_attempts = total_attempts + 1
    `).bind(playerId, dungeonId).run();
  }
  
  // Deduct energy
  await c.env.DB.prepare(`
    UPDATE players SET energy = energy - ?, total_battles = total_battles + 1,
    battles_won = battles_won + ? WHERE id = ?
  `).bind(dungeon.energy_cost, victory ? 1 : 0, playerId).run();
  
  // Record battle
  await c.env.DB.prepare(`
    INSERT INTO battle_history (player_id, battle_type, dungeon_id, player_team, result, rewards_earned)
    VALUES (?, 'dungeon', ?, ?, ?, ?)
  `).bind(playerId, dungeonId, JSON.stringify(teamHeroIds), victory ? 'victory' : 'defeat', JSON.stringify(rewards)).run();
  
  return c.json({
    success: true,
    victory,
    rewards,
    message: victory ? 'Victory! Keep up the great work!' : 'Defeat... Train harder and try again!'
  });
});

export default dungeons;
