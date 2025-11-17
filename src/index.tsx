import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// Types for Cloudflare bindings
type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function hashPassword(password: string): string {
  // Simple hash for demo - in production use proper bcrypt/argon2
  return `hashed_${password}`
}

function generateToken(playerId: number): string {
  // Simple token for demo - in production use proper JWT
  return `token_${playerId}_${Date.now()}`
}

async function verifyToken(token: string, db: D1Database): Promise<number | null> {
  const parts = token.split('_')
  if (parts.length !== 3 || parts[0] !== 'token') return null
  return parseInt(parts[1])
}

function calculateExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1))
}

function calculateHeroStats(hero: any, template: any): any {
  const level = hero.current_level
  const rankMultiplier = { C: 1.0, B: 1.2, A: 1.5, S: 2.0, SS: 2.5, SSS: 3.0 }[hero.current_rank] || 1.0
  const awakeningBonus = hero.awakening_level * 0.05
  const limitBreakBonus = hero.limit_break_level * 0.1
  
  return {
    hp: Math.floor(template.base_hp * Math.pow(template.hp_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    attack: Math.floor(template.base_attack * Math.pow(template.attack_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    defense: Math.floor(template.base_defense * Math.pow(template.defense_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    speed: Math.floor(template.base_speed * Math.pow(template.speed_growth, level - 1) * rankMultiplier * (1 + awakeningBonus + limitBreakBonus)),
    crit_rate: template.base_crit_rate + hero.potential_level * 0.1,
    crit_damage: template.base_crit_damage + hero.potential_level * 2
  }
}

// =====================================================
// AUTH ROUTES
// =====================================================

app.post('/api/auth/register', async (c) => {
  const { username, email, password } = await c.req.json()
  
  if (!username || !email || !password) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  
  try {
    const hashedPassword = hashPassword(password)
    
    const result = await c.env.DB.prepare(`
      INSERT INTO players (username, email, password_hash, last_login)
      VALUES (?, ?, ?, ?)
    `).bind(username, email, hashedPassword, Math.floor(Date.now() / 1000)).run()
    
    const playerId = result.meta.last_row_id
    
    // Give starting resources
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO player_resources (player_id, resource_type_code, quantity)
        VALUES (?, 'gold', 10000), (?, 'diamonds', 500), (?, 'energy', 100), (?, 'basic_gacha_token', 10)
      `).bind(playerId, playerId, playerId, playerId)
    ])
    
    const token = generateToken(playerId as number)
    
    return c.json({ 
      success: true, 
      token, 
      playerId,
      message: 'Account created successfully! Welcome!' 
    })
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return c.json({ error: 'Username or email already exists' }, 409)
    }
    return c.json({ error: 'Registration failed' }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  
  const hashedPassword = hashPassword(password)
  
  const player = await c.env.DB.prepare(`
    SELECT id, username, account_level, premium_currency, free_currency
    FROM players 
    WHERE username = ? AND password_hash = ?
  `).bind(username, hashedPassword).first()
  
  if (!player) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  
  // Update last login
  await c.env.DB.prepare(`
    UPDATE players SET last_login = ? WHERE id = ?
  `).bind(Math.floor(Date.now() / 1000), player.id).run()
  
  const token = generateToken(player.id as number)
  
  return c.json({ success: true, token, player })
})

// =====================================================
// PLAYER ROUTES
// =====================================================

app.get('/api/player/profile', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const player = await c.env.DB.prepare(`
    SELECT id, username, email, account_level, total_exp, current_exp, exp_to_next_level,
           vip_level, premium_currency, free_currency, energy, max_energy,
           gacha_pity_basic, gacha_pity_advanced, gacha_pity_essence,
           tutorial_completed, prestige_level, total_battles, battles_won,
           created_at, last_login, clan_id
    FROM players WHERE id = ?
  `).bind(playerId).first()
  
  return c.json({ success: true, player })
})

app.get('/api/player/resources', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const resources = await c.env.DB.prepare(`
    SELECT pr.resource_type_code, pr.quantity, rt.name, rt.category, rt.rarity, rt.icon_url
    FROM player_resources pr
    JOIN resource_types rt ON pr.resource_type_code = rt.code
    WHERE pr.player_id = ?
    ORDER BY rt.category, rt.rarity
  `).bind(playerId).all()
  
  return c.json({ success: true, resources: resources.results })
})

// =====================================================
// HERO ROUTES
// =====================================================

app.get('/api/heroes/templates', async (c) => {
  const templates = await c.env.DB.prepare(`
    SELECT * FROM hero_templates ORDER BY base_rarity DESC, name
  `).all()
  
  return c.json({ success: true, templates: templates.results })
})

app.get('/api/heroes/player', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const heroes = await c.env.DB.prepare(`
    SELECT ph.*, ht.name, ht.power_type, ht.base_rarity,
           ht.skill_1_name, ht.skill_2_name, ht.ultimate_name, ht.passive_name,
           ht.avatar_url
    FROM player_heroes ph
    JOIN hero_templates ht ON ph.hero_template_id = ht.id
    WHERE ph.player_id = ?
    ORDER BY ph.current_rank DESC, ph.current_level DESC
  `).bind(playerId).all()
  
  return c.json({ success: true, heroes: heroes.results })
})

app.post('/api/heroes/level-up', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const { heroId } = await c.req.json()
  
  // Check resources
  const resources = await c.env.DB.prepare(`
    SELECT quantity FROM player_resources
    WHERE player_id = ? AND resource_type_code = 'level_stone'
  `).bind(playerId).first()
  
  if (!resources || resources.quantity < 1) {
    return c.json({ error: 'Not enough Level Stones' }, 400)
  }
  
  // Get hero
  const hero = await c.env.DB.prepare(`
    SELECT ph.*, ht.*
    FROM player_heroes ph
    JOIN hero_templates ht ON ph.hero_template_id = ht.id
    WHERE ph.id = ? AND ph.player_id = ?
  `).bind(heroId, playerId).first()
  
  if (!hero) {
    return c.json({ error: 'Hero not found' }, 404)
  }
  
  const newLevel = hero.current_level + 1
  const newStats = calculateHeroStats({ ...hero, current_level: newLevel }, hero)
  
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
  ])
  
  return c.json({ success: true, newLevel, newStats })
})

// =====================================================
// GACHA ROUTES
// =====================================================

app.get('/api/gacha/banners', async (c) => {
  const banners = await c.env.DB.prepare(`
    SELECT * FROM gacha_banners WHERE is_active = 1
    ORDER BY banner_type
  `).all()
  
  return c.json({ success: true, banners: banners.results })
})

app.post('/api/gacha/pull', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const { bannerId, pullType } = await c.req.json() // pullType: 'single' or 'multi'
  
  const banner = await c.env.DB.prepare(`
    SELECT * FROM gacha_banners WHERE id = ? AND is_active = 1
  `).bind(bannerId).first()
  
  if (!banner) {
    return c.json({ error: 'Banner not found' }, 404)
  }
  
  const pullCount = pullType === 'multi' ? 10 : 1
  const cost = pullType === 'multi' ? banner.cost_multi : banner.cost_single
  
  // Check resources
  const player = await c.env.DB.prepare(`
    SELECT premium_currency, gacha_pity_basic, gacha_pity_advanced, gacha_pity_essence
    FROM players WHERE id = ?
  `).bind(playerId).first()
  
  const pityColumn = banner.banner_type === 'basic' ? 'gacha_pity_basic' : 
                     banner.banner_type === 'essence' ? 'gacha_pity_essence' : 'gacha_pity_advanced'
  const currentPity = player[pityColumn] as number
  
  if (banner.cost_currency === 'diamonds' && player.premium_currency < cost) {
    return c.json({ error: 'Not enough diamonds' }, 400)
  }
  
  // Perform gacha pulls
  const results = []
  let newPity = currentPity
  
  for (let i = 0; i < pullCount; i++) {
    newPity++
    let rarity = 'C'
    
    // Pity system
    if (newPity >= banner.pity_threshold) {
      rarity = banner.guaranteed_rarity as string
      newPity = 0
    } else {
      // Random roll
      const roll = Math.random() * 10000
      const rates = banner as any
      
      if (roll < rates.rate_sss) rarity = 'SSS'
      else if (roll < rates.rate_sss + rates.rate_ss) rarity = 'SS'
      else if (roll < rates.rate_sss + rates.rate_ss + rates.rate_s) rarity = 'S'
      else if (roll < rates.rate_sss + rates.rate_ss + rates.rate_s + rates.rate_a) rarity = 'A'
      else if (roll < rates.rate_sss + rates.rate_ss + rates.rate_s + rates.rate_a + rates.rate_b) rarity = 'B'
      else rarity = 'C'
      
      if (['SSS', 'SS', 'S'].includes(rarity)) newPity = 0
    }
    
    // Get random hero of this rarity
    const heroPool = await c.env.DB.prepare(`
      SELECT * FROM hero_templates WHERE base_rarity = ? ORDER BY RANDOM() LIMIT 1
    `).bind(rarity).first()
    
    if (heroPool) {
      // Add hero to player's collection
      const stats = calculateHeroStats({ current_level: 1, current_rank: rarity, awakening_level: 0, limit_break_level: 0, potential_level: 0 }, heroPool)
      
      const heroResult = await c.env.DB.prepare(`
        INSERT INTO player_heroes (
          player_id, hero_template_id, current_rank,
          current_hp, current_attack, current_defense, current_speed,
          current_crit_rate, current_crit_damage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(playerId, heroPool.id, rarity, stats.hp, stats.attack, stats.defense, 
              stats.speed, stats.crit_rate, stats.crit_damage).run()
      
      results.push({
        heroId: heroResult.meta.last_row_id,
        name: heroPool.name,
        rarity,
        powerType: heroPool.power_type,
        isNew: true,
        avatar: heroPool.avatar_url
      })
    }
  }
  
  // Update player resources and pity
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
  ])
  
  return c.json({ 
    success: true, 
    results, 
    newPity,
    message: `You got ${results.filter(r => ['SSS', 'SS', 'S'].includes(r.rarity)).length} rare heroes!`
  })
})

// =====================================================
// DUNGEON ROUTES
// =====================================================

app.get('/api/dungeons', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const player = await c.env.DB.prepare(`
    SELECT account_level FROM players WHERE id = ?
  `).bind(playerId).first()
  
  const dungeons = await c.env.DB.prepare(`
    SELECT d.*, pdp.times_completed, pdp.best_score, pdp.first_clear_claimed
    FROM dungeon_templates d
    LEFT JOIN player_dungeon_progress pdp ON d.id = pdp.dungeon_id AND pdp.player_id = ?
    WHERE d.is_active = 1 AND d.required_level <= ?
    ORDER BY d.required_level, d.difficulty
  `).bind(playerId, player.account_level).all()
  
  return c.json({ success: true, dungeons: dungeons.results })
})

app.post('/api/dungeons/battle', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const { dungeonId, teamHeroIds } = await c.req.json()
  
  // Get dungeon and player's team
  const dungeon = await c.env.DB.prepare(`
    SELECT * FROM dungeon_templates WHERE id = ?
  `).bind(dungeonId).first()
  
  if (!dungeon) {
    return c.json({ error: 'Dungeon not found' }, 404)
  }
  
  // Check energy
  const player = await c.env.DB.prepare(`
    SELECT energy FROM players WHERE id = ?
  `).bind(playerId).first()
  
  if (player.energy < dungeon.energy_cost) {
    return c.json({ error: 'Not enough energy' }, 400)
  }
  
  // Simple battle simulation
  const teamPower = teamHeroIds.length * 1000 // Simplified
  const enemyPower = dungeon.required_team_power * 0.8
  
  const victory = teamPower >= enemyPower
  
  let rewards = []
  if (victory) {
    rewards = JSON.parse(dungeon.clear_rewards as string)
    
    // Check first clear
    const progress = await c.env.DB.prepare(`
      SELECT first_clear_claimed FROM player_dungeon_progress
      WHERE player_id = ? AND dungeon_id = ?
    `).bind(playerId, dungeonId).first()
    
    if (!progress) {
      const firstClearRewards = JSON.parse(dungeon.first_clear_rewards as string)
      rewards = [...rewards, ...firstClearRewards]
    }
    
    // Grant rewards
    for (const reward of rewards) {
      if (reward.type === 'gold' || reward.type === 'diamonds') {
        await c.env.DB.prepare(`
          UPDATE players SET ${reward.type === 'gold' ? 'free_currency' : 'premium_currency'} = 
          ${reward.type === 'gold' ? 'free_currency' : 'premium_currency'} + ?
          WHERE id = ?
        `).bind(reward.amount, playerId).run()
      } else {
        await c.env.DB.prepare(`
          INSERT INTO player_resources (player_id, resource_type_code, quantity)
          VALUES (?, ?, ?)
          ON CONFLICT(player_id, resource_type_code) 
          DO UPDATE SET quantity = quantity + ?
        `).bind(playerId, reward.type, reward.amount, reward.amount).run()
      }
    }
    
    // Update progress
    await c.env.DB.prepare(`
      INSERT INTO player_dungeon_progress (player_id, dungeon_id, times_completed, first_clear_claimed, total_attempts)
      VALUES (?, ?, 1, 1, 1)
      ON CONFLICT(player_id, dungeon_id)
      DO UPDATE SET times_completed = times_completed + 1, total_attempts = total_attempts + 1
    `).bind(playerId, dungeonId).run()
  }
  
  // Deduct energy
  await c.env.DB.prepare(`
    UPDATE players SET energy = energy - ?, total_battles = total_battles + 1,
    battles_won = battles_won + ? WHERE id = ?
  `).bind(dungeon.energy_cost, victory ? 1 : 0, playerId).run()
  
  // Record battle
  await c.env.DB.prepare(`
    INSERT INTO battle_history (player_id, battle_type, dungeon_id, player_team, result, rewards_earned)
    VALUES (?, 'dungeon', ?, ?, ?, ?)
  `).bind(playerId, dungeonId, JSON.stringify(teamHeroIds), victory ? 'victory' : 'defeat', JSON.stringify(rewards)).run()
  
  return c.json({
    success: true,
    victory,
    rewards,
    message: victory ? 'Victory! Keep up the great work!' : 'Defeat... Train harder and try again!'
  })
})

// =====================================================
// DAILY & MISSIONS
// =====================================================

app.get('/api/missions', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const missions = await c.env.DB.prepare(`
    SELECT mt.*, pm.progress, pm.is_completed, pm.is_claimed
    FROM mission_templates mt
    LEFT JOIN player_missions pm ON mt.id = pm.mission_id AND pm.player_id = ?
    WHERE mt.is_active = 1
    ORDER BY mt.mission_type, mt.display_order
  `).bind(playerId).all()
  
  return c.json({ success: true, missions: missions.results })
})

app.get('/api/daily-rewards', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  
  const playerId = await verifyToken(token, c.env.DB)
  if (!playerId) return c.json({ error: 'Invalid token' }, 401)
  
  const loginData = await c.env.DB.prepare(`
    SELECT * FROM player_daily_login WHERE player_id = ?
  `).bind(playerId).first()
  
  const rewards = await c.env.DB.prepare(`
    SELECT * FROM daily_login_rewards ORDER BY day_number
  `).all()
  
  return c.json({ 
    success: true, 
    consecutiveDays: loginData?.consecutive_days || 0,
    lastClaimDay: loginData?.last_claim_day || 0,
    rewards: rewards.results 
  })
})

// =====================================================
// ARENA ROUTES
// =====================================================

app.get('/api/arena/rankings', async (c) => {
  const season = await c.env.DB.prepare(`
    SELECT id FROM arena_seasons WHERE is_active = 1 LIMIT 1
  `).first()
  
  if (!season) {
    return c.json({ error: 'No active season' }, 404)
  }
  
  const rankings = await c.env.DB.prepare(`
    SELECT p.username, pas.current_rank, pas.mmr, pas.wins, pas.losses
    FROM player_arena_stats pas
    JOIN players p ON pas.player_id = p.id
    WHERE pas.season_id = ?
    ORDER BY pas.current_rank ASC
    LIMIT 100
  `).bind(season.id).all()
  
  return c.json({ success: true, rankings: rankings.results })
})

// =====================================================
// FRONTEND - MAIN PAGE
// =====================================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RPG Superheroes - Epic Essence Powers</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
            50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
          }
          .float-animation { animation: float 3s ease-in-out infinite; }
          .glow-animation { animation: glow 2s ease-in-out infinite; }
          .hero-card { transition: all 0.3s; }
          .hero-card:hover { transform: scale(1.05); }
          .rarity-SSS { background: linear-gradient(135deg, #ffd700, #ffed4e); }
          .rarity-SS { background: linear-gradient(135deg, #ff6b6b, #ee5a6f); }
          .rarity-S { background: linear-gradient(135deg, #845ec2, #b39cd0); }
          .rarity-A { background: linear-gradient(135deg, #00c9ff, #92fe9d); }
          .rarity-B { background: linear-gradient(135deg, #a8dadc, #1d3557); }
          .rarity-C { background: linear-gradient(135deg, #adb5bd, #495057); }
        </style>
    </head>
    <body class="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 min-h-screen text-white">
        <!-- Navigation -->
        <nav class="bg-black bg-opacity-50 backdrop-blur-md p-4 sticky top-0 z-50">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <h1 class="text-2xl font-bold">⚡ RPG Superheroes</h1>
                    <div id="playerInfo" class="hidden space-x-4 text-sm">
                        <span><i class="fas fa-user"></i> <span id="playerName">Player</span></span>
                        <span><i class="fas fa-level-up-alt"></i> Lv.<span id="playerLevel">1</span></span>
                        <span><i class="fas fa-coins"></i> <span id="playerGold">0</span></span>
                        <span><i class="fas fa-gem"></i> <span id="playerDiamonds">0</span></span>
                        <span><i class="fas fa-bolt"></i> <span id="playerEnergy">0</span></span>
                    </div>
                </div>
                <div id="authButtons" class="space-x-2">
                    <button onclick="showLogin()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">Login</button>
                    <button onclick="showRegister()" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded">Register</button>
                </div>
                <button id="logoutButton" onclick="logout()" class="hidden px-4 py-2 bg-red-600 hover:bg-red-700 rounded">Logout</button>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container mx-auto p-6">
            <!-- Welcome Screen -->
            <div id="welcomeScreen" class="text-center py-20">
                <div class="float-animation">
                    <h2 class="text-6xl font-bold mb-6">⚡ RPG SUPERHEROES ⚡</h2>
                    <p class="text-2xl mb-8">Collect Heroes • Build Teams • Conquer Dungeons</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
                    <div class="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
                        <div class="text-5xl mb-4">🔥</div>
                        <h3 class="text-xl font-bold mb-2">12 Power Types</h3>
                        <p class="text-sm opacity-80">Fire, Water, Earth, Air, Light, Dark & More!</p>
                    </div>
                    <div class="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
                        <div class="text-5xl mb-4">🎲</div>
                        <h3 class="text-xl font-bold mb-2">Gacha System</h3>
                        <p class="text-sm opacity-80">Pull heroes with pity system & guaranteed SSS!</p>
                    </div>
                    <div class="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
                        <div class="text-5xl mb-4">⚔️</div>
                        <h3 class="text-xl font-bold mb-2">Epic Battles</h3>
                        <p class="text-sm opacity-80">Dungeons, Bosses, Arena & Co-op Raids!</p>
                    </div>
                </div>
            </div>

            <!-- Game Dashboard (hidden initially) -->
            <div id="gameDashboard" class="hidden">
                <!-- Menu Tabs -->
                <div class="flex space-x-2 mb-6 overflow-x-auto">
                    <button onclick="showTab('heroes')" class="tab-btn px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <i class="fas fa-users"></i> Heroes
                    </button>
                    <button onclick="showTab('gacha')" class="tab-btn px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg glow-animation">
                        <i class="fas fa-dice"></i> Gacha
                    </button>
                    <button onclick="showTab('dungeons')" class="tab-btn px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg">
                        <i class="fas fa-dungeon"></i> Dungeons
                    </button>
                    <button onclick="showTab('arena')" class="tab-btn px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg">
                        <i class="fas fa-trophy"></i> Arena
                    </button>
                    <button onclick="showTab('inventory')" class="tab-btn px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg">
                        <i class="fas fa-backpack"></i> Inventory
                    </button>
                    <button onclick="showTab('missions')" class="tab-btn px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                        <i class="fas fa-tasks"></i> Missions
                    </button>
                </div>

                <!-- Tab Contents -->
                <div id="heroesTab" class="tab-content hidden">
                    <h2 class="text-3xl font-bold mb-4"><i class="fas fa-users"></i> Your Heroes</h2>
                    <div id="heroList" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
                </div>

                <div id="gachaTab" class="tab-content hidden">
                    <h2 class="text-3xl font-bold mb-4"><i class="fas fa-dice"></i> Gacha Summons</h2>
                    <div id="bannerList" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
                    <div id="gachaResults" class="mt-6"></div>
                </div>

                <div id="dungeonsTab" class="tab-content hidden">
                    <h2 class="text-3xl font-bold mb-4"><i class="fas fa-dungeon"></i> Dungeons & Raids</h2>
                    <div id="dungeonList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
                </div>

                <div id="arenaTab" class="tab-content hidden">
                    <h2 class="text-3xl font-bold mb-4"><i class="fas fa-trophy"></i> Arena Rankings</h2>
                    <div id="arenaRankings" class="bg-white bg-opacity-10 p-6 rounded-lg"></div>
                </div>

                <div id="inventoryTab" class="tab-content hidden">
                    <h2 class="text-3xl font-bold mb-4"><i class="fas fa-backpack"></i> Resources & Items</h2>
                    <div id="resourceList" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"></div>
                </div>

                <div id="missionsTab" class="tab-content hidden">
                    <h2 class="text-3xl font-bold mb-4"><i class="fas fa-tasks"></i> Daily Missions</h2>
                    <div id="missionList" class="space-y-4"></div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <div id="authModal" class="hidden fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div class="bg-gray-900 p-8 rounded-lg max-w-md w-full">
                <h3 id="modalTitle" class="text-2xl font-bold mb-4">Login</h3>
                <div id="loginForm">
                    <input type="text" id="loginUsername" placeholder="Username" class="w-full p-3 mb-3 bg-gray-800 rounded">
                    <input type="password" id="loginPassword" placeholder="Password" class="w-full p-3 mb-4 bg-gray-800 rounded">
                    <button onclick="login()" class="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded">Login</button>
                </div>
                <div id="registerForm" class="hidden">
                    <input type="text" id="regUsername" placeholder="Username" class="w-full p-3 mb-3 bg-gray-800 rounded">
                    <input type="email" id="regEmail" placeholder="Email" class="w-full p-3 mb-3 bg-gray-800 rounded">
                    <input type="password" id="regPassword" placeholder="Password" class="w-full p-3 mb-4 bg-gray-800 rounded">
                    <button onclick="register()" class="w-full p-3 bg-green-600 hover:bg-green-700 rounded">Create Account</button>
                </div>
                <button onclick="closeModal()" class="mt-4 text-sm text-gray-400 hover:text-white">Cancel</button>
            </div>
        </div>

        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
