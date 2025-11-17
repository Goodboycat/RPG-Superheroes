# 🏗️ RPG Superheroes - System Architecture

## 📐 Overview

RPG Superheroes is a serverless, edge-deployed RPG game built on modern web technologies. The architecture prioritizes scalability, low latency, and developer experience.

## 🎯 Technology Stack

### Backend
- **Runtime**: Cloudflare Workers (V8 Isolates)
- **Framework**: Hono 4.x (Lightweight web framework)
- **Language**: TypeScript 5.x
- **Database**: Cloudflare D1 (SQLite-based distributed database)

### Frontend
- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS 3.x (CDN)
- **Icons**: Font Awesome 6.x (CDN)
- **Build Tool**: Vite 6.x
- **State Management**: LocalStorage + In-memory

### DevOps
- **Deployment**: Cloudflare Pages
- **Package Manager**: npm
- **Process Manager**: PM2 (development)
- **Version Control**: Git + GitHub

## 🗄️ Database Architecture

### Schema Overview
The database consists of 30+ tables organized into logical domains:

#### Core Domain
```
players (account data, currencies, statistics)
├── player_heroes (hero instances)
│   └── hero_templates (master hero data)
├── player_resources (resource inventory)
│   └── resource_types (master resource data)
└── player_equipment (equipment instances)
    └── equipment_templates (master equipment data)
```

#### Game Systems Domain
```
gacha_banners (gacha configurations)
├── gacha_history (pull records)
└── featured_heroes (rate-up heroes)

dungeon_templates (dungeon definitions)
├── player_dungeon_progress (completion tracking)
└── battle_history (combat logs)

mission_templates (quest definitions)
└── player_missions (player progress)
```

#### Social Domain
```
clans (guild data)
├── clan_members (membership)
└── clan_activities (events)

arena_seasons (PVP seasons)
└── player_arena_stats (rankings, MMR)

coop_rooms (multiplayer lobbies)
└── coop_room_members (participants)
```

#### Economy Domain
```
crafting_recipes (crafting formulas)
├── player_crafting_queue (crafting jobs)
└── required_materials (recipe ingredients)

mine_templates (passive income sources)
└── player_mines (player instances)

daily_login_rewards (login bonuses)
└── player_daily_login (claim tracking)
```

### Key Design Decisions

1. **Normalized Schema**: Reduces data redundancy, maintains referential integrity
2. **Template Pattern**: Separates master data (templates) from instance data (player-owned)
3. **JSON Fields**: Used for flexible arrays (skills, rewards, objectives)
4. **Integer IDs**: Auto-incrementing primary keys for performance
5. **Timestamp Tracking**: All major entities track creation/update times
6. **Soft Deletes**: Not implemented (can be added via `deleted_at` columns)

### Indexing Strategy

```sql
-- Player lookups
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_players_email ON players(email);

-- Hero queries
CREATE INDEX idx_player_heroes_player ON player_heroes(player_id);
CREATE INDEX idx_player_heroes_template ON player_heroes(hero_template_id);

-- Resource lookups
CREATE INDEX idx_player_resources_player ON player_resources(player_id);

-- Battle history
CREATE INDEX idx_battle_history_player ON battle_history(player_id);

-- Arena rankings
CREATE INDEX idx_arena_stats_rank ON player_arena_stats(current_rank);
```

## 🔄 API Architecture

### RESTful Endpoints

#### Authentication Flow
```
POST /api/auth/register
  Input: { username, email, password }
  Output: { token, playerId, message }
  
POST /api/auth/login
  Input: { username, password }
  Output: { token, player }
```

#### Game Data Flow
```
GET /api/player/profile
  Headers: { Authorization: Bearer <token> }
  Output: { player }
  
GET /api/heroes/player
  Headers: { Authorization: Bearer <token> }
  Output: { heroes[] }
  
POST /api/gacha/pull
  Headers: { Authorization: Bearer <token> }
  Input: { bannerId, pullType }
  Output: { results[], newPity }
```

### Authentication Strategy

**Current Implementation** (Demo):
```javascript
// Simple token generation
function generateToken(playerId) {
  return `token_${playerId}_${Date.now()}`
}

// Token verification
async function verifyToken(token, db) {
  const [_, playerId, timestamp] = token.split('_')
  return parseInt(playerId)
}
```

**Production Recommendation**:
```javascript
import jwt from '@tsndr/cloudflare-worker-jwt'

// Generate JWT
const token = await jwt.sign({
  sub: playerId,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24h
}, JWT_SECRET)

// Verify JWT
const isValid = await jwt.verify(token, JWT_SECRET)
```

## 🎮 Game Systems Architecture

### Hero System

```typescript
interface Hero {
  // Identity
  id: number
  template_id: number
  
  // Progression
  level: number
  rank: 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS'
  awakening_level: number // 0-10
  limit_break_level: number // 0-5
  potential_level: number // 0-100
  
  // Combat Stats
  hp: number
  attack: number
  defense: number
  speed: number
  crit_rate: number
  crit_damage: number
  
  // Equipment
  weapon_id?: number
  armor_id?: number
  accessory_id?: number
  boots_id?: number
}

// Stat Calculation Formula
function calculateStats(hero, template) {
  const levelMultiplier = Math.pow(template.growth_rate, hero.level - 1)
  const rankMultiplier = RANK_MULTIPLIERS[hero.rank]
  const awakeningBonus = hero.awakening_level * 0.05
  const limitBreakBonus = hero.limit_break_level * 0.1
  
  return {
    hp: template.base_hp * levelMultiplier * rankMultiplier * (1 + awakeningBonus + limitBreakBonus),
    // ... similar for other stats
  }
}
```

### Gacha System

```typescript
interface GachaBanner {
  id: number
  name: string
  type: 'basic' | 'advanced' | 'essence' | 'event'
  
  // Costs
  cost_currency: 'gold' | 'diamonds' | 'tokens'
  cost_single: number
  cost_multi: number
  
  // Drop Rates (out of 10000)
  rate_c: number    // 40.00%
  rate_b: number    // 30.00%
  rate_a: number    // 20.00%
  rate_s: number    // 8.00%
  rate_ss: number   // 1.80%
  rate_sss: number  // 0.20%
  
  // Pity System
  pity_threshold: number // e.g., 100 pulls
  guaranteed_rarity: string // e.g., 'SSS'
  
  // Featured Heroes
  featured_heroes: number[] // hero IDs
  featured_rate_boost: number // multiplier
}

// Gacha Pull Algorithm
function performGachaPull(banner, pityCounter) {
  // Check pity
  if (pityCounter >= banner.pity_threshold) {
    return { rarity: banner.guaranteed_rarity, resetPity: true }
  }
  
  // Random roll
  const roll = Math.random() * 10000
  let cumulative = 0
  
  for (const rarity of ['SSS', 'SS', 'S', 'A', 'B', 'C']) {
    cumulative += banner[`rate_${rarity.toLowerCase()}`]
    if (roll < cumulative) {
      const shouldResetPity = ['SSS', 'SS', 'S'].includes(rarity)
      return { rarity, resetPity: shouldResetPity }
    }
  }
}
```

### Combat System

```typescript
interface BattleConfig {
  playerTeam: Hero[]
  enemyTeam: Hero[]
  typeAdvantages: Record<string, string[]> // fire > nature, water > fire, etc.
}

// Simplified Combat (Current)
function simulateBattle(config) {
  const playerPower = config.playerTeam.reduce((sum, hero) => {
    return sum + hero.attack + hero.hp + hero.defense
  }, 0)
  
  const enemyPower = config.enemyTeam.reduce((sum, hero) => {
    return sum + hero.attack + hero.hp + hero.defense
  }, 0)
  
  return playerPower > enemyPower
}

// Advanced Combat (To Implement)
function turnBasedBattle(config) {
  const turnOrder = [...config.playerTeam, ...config.enemyTeam]
    .sort((a, b) => b.speed - a.speed)
  
  let playerHp = config.playerTeam.map(h => h.hp)
  let enemyHp = config.enemyTeam.map(h => h.hp)
  
  for (let turn = 0; turn < 100; turn++) {
    for (const actor of turnOrder) {
      // Calculate damage with type advantages
      // Apply skills and passives
      // Update HP
      // Check win conditions
    }
  }
}
```

### Resource System

```typescript
interface Resource {
  code: string // unique identifier
  name: string
  category: 'currency' | 'upgrade' | 'crafting' | 'gacha' | 'special'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  max_stack: number
}

// Resource Categories
const RESOURCE_CATEGORIES = {
  currency: ['gold', 'diamonds', 'energy', 'mana_essence'],
  upgrade: ['level_stone', 'rank_stone_b', 'awakening_core', 'limit_breaker_crystal'],
  crafting: ['iron_ore', 'mythril_ingot', 'essence_fiber', 'rare_core'],
  gacha: ['basic_gacha_token', 'advanced_gacha_token', 'essence_gacha_token'],
  special: ['dungeon_key', 'boss_ticket', 'arena_medal', 'clan_coin']
}
```

## 🔐 Security Architecture

### Current Implementation
- Password hashing (placeholder - needs bcrypt)
- Token-based authentication
- Server-side validation
- SQL injection prevention (parameterized queries)

### Production Requirements
1. **Strong Password Hashing**: Use bcrypt or argon2
2. **JWT with Refresh Tokens**: Implement proper token lifecycle
3. **Rate Limiting**: Prevent API abuse
4. **Input Validation**: Sanitize all user inputs
5. **CSRF Protection**: Add anti-CSRF tokens
6. **Database Encryption**: Encrypt sensitive data at rest
7. **Audit Logging**: Track all critical operations

### Anti-Cheat Measures
```typescript
// Server-side validation examples
function validateGachaPull(playerId, bannerId, cost) {
  // Verify player has sufficient currency
  const resources = await db.getPlayerResources(playerId)
  if (resources.diamonds < cost) {
    throw new Error('Insufficient resources')
  }
  
  // Verify banner is active
  const banner = await db.getActiveBanner(bannerId)
  if (!banner) {
    throw new Error('Invalid banner')
  }
  
  // Rate limiting
  const recentPulls = await db.getRecentPulls(playerId, '1 minute')
  if (recentPulls > 10) {
    throw new Error('Rate limit exceeded')
  }
}
```

## 📊 Performance Optimization

### Database Query Optimization
```sql
-- Batch operations for gacha pulls
BEGIN TRANSACTION;
INSERT INTO player_heroes (...) VALUES (...);
INSERT INTO player_heroes (...) VALUES (...);
UPDATE players SET diamonds = diamonds - 1350 WHERE id = ?;
COMMIT;

-- Efficient stat queries with JOINs
SELECT ph.*, ht.name, ht.power_type
FROM player_heroes ph
INNER JOIN hero_templates ht ON ph.hero_template_id = ht.id
WHERE ph.player_id = ?
ORDER BY ph.current_rank DESC
LIMIT 100;
```

### Caching Strategy
```typescript
// Edge caching for static data
const cacheControl = {
  heroTemplates: 'public, max-age=3600', // 1 hour
  gachaBanners: 'public, max-age=300',   // 5 minutes
  dungeonTemplates: 'public, max-age=600' // 10 minutes
}

// Player-specific data: no cache
// Always fetch fresh from database
```

### Asset Optimization
- Use CDN for third-party libraries
- Minify and bundle JavaScript
- Lazy load images
- Implement service worker for offline play

## 🚀 Deployment Architecture

### Development Environment
```
Local Machine / Sandbox
├── Wrangler Pages Dev (localhost:3000)
├── D1 Local SQLite (.wrangler/state/v3/d1)
├── PM2 Process Manager
└── Hot Module Reloading
```

### Production Environment
```
Cloudflare Global Network
├── Pages (Static Assets)
│   └── Edge CDN (300+ locations)
├── Workers (API Routes)
│   └── V8 Isolates (instant startup)
└── D1 Database (Distributed SQLite)
    ├── Primary Region
    └── Read Replicas (global)
```

### Deployment Pipeline
```bash
# 1. Build application
npm run build

# 2. Run tests (to implement)
npm test

# 3. Apply database migrations
wrangler d1 migrations apply rpg-production

# 4. Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name rpg-superheroes

# 5. Verify deployment
curl https://rpg-superheroes.pages.dev/api/health
```

## 📈 Scalability Considerations

### Current Limitations
- Single D1 database (no sharding)
- Stateless API (no WebSocket support)
- Limited to 100k requests/day (free tier)

### Scaling Strategies

#### Horizontal Scaling
- Cloudflare Workers auto-scale globally
- No server management required
- Pay-per-request model

#### Database Scaling
- D1 supports read replicas globally
- Consider sharding by region if needed
- Implement write batching for high-volume operations

#### Caching Layer
```typescript
// Use KV for frequently accessed data
const cache = {
  async getHeroTemplate(id) {
    const cached = await env.KV.get(`hero:${id}`)
    if (cached) return JSON.parse(cached)
    
    const hero = await env.DB.prepare('SELECT * FROM hero_templates WHERE id = ?')
      .bind(id).first()
    
    await env.KV.put(`hero:${id}`, JSON.stringify(hero), { expirationTtl: 3600 })
    return hero
  }
}
```

## 🔮 Future Architecture Enhancements

### Phase 1: Performance
- [ ] Implement Redis/KV caching layer
- [ ] Add database connection pooling
- [ ] Optimize SQL queries with EXPLAIN
- [ ] Implement lazy loading for heroes

### Phase 2: Real-time Features
- [ ] Add Durable Objects for multiplayer
- [ ] WebSocket support for live battles
- [ ] Server-Sent Events for notifications
- [ ] Real-time arena matchmaking

### Phase 3: Advanced Systems
- [ ] Microservices architecture (optional)
- [ ] Message queue for background jobs
- [ ] Analytics and telemetry
- [ ] A/B testing framework

### Phase 4: Enterprise
- [ ] Multi-region active-active setup
- [ ] Disaster recovery plan
- [ ] Automated backups
- [ ] Monitoring and alerting

## 📚 References

### Documentation
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)

### Best Practices
- [12-Factor App](https://12factor.net/)
- [REST API Design](https://restfulapi.net/)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [Web Performance](https://web.dev/performance/)

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Maintainer**: RPG Superheroes Team
