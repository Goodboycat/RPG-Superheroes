-- =====================================================
-- RPG SUPERHEROES - COMPLETE DATABASE SCHEMA
-- =====================================================

-- =====================================================
-- PLAYERS & ACCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  account_level INTEGER DEFAULT 1,
  total_exp INTEGER DEFAULT 0,
  current_exp INTEGER DEFAULT 0,
  exp_to_next_level INTEGER DEFAULT 100,
  
  -- VIP & Premium
  vip_level INTEGER DEFAULT 0,
  vip_exp INTEGER DEFAULT 0,
  premium_currency INTEGER DEFAULT 500, -- Diamonds
  free_currency INTEGER DEFAULT 10000, -- Gold
  
  -- Energy & Stamina
  energy INTEGER DEFAULT 100,
  max_energy INTEGER DEFAULT 100,
  energy_last_update INTEGER, -- timestamp
  
  -- Gacha pity system
  gacha_pity_basic INTEGER DEFAULT 0,
  gacha_pity_advanced INTEGER DEFAULT 0,
  gacha_pity_essence INTEGER DEFAULT 0,
  gacha_luck_value INTEGER DEFAULT 0,
  
  -- Progression flags
  tutorial_completed INTEGER DEFAULT 0,
  prestige_level INTEGER DEFAULT 0,
  prestige_points INTEGER DEFAULT 0,
  
  -- Stats
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  highest_damage INTEGER DEFAULT 0,
  total_gacha_pulls INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_login INTEGER DEFAULT (strftime('%s', 'now')),
  last_daily_reward INTEGER DEFAULT 0,
  
  -- Clan
  clan_id INTEGER,
  clan_role TEXT DEFAULT 'member',
  
  FOREIGN KEY (clan_id) REFERENCES clans(id)
);

-- =====================================================
-- HEROES (ESSENCE ENTITIES)
-- =====================================================

CREATE TABLE IF NOT EXISTS hero_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  power_type TEXT NOT NULL, -- fire, water, earth, air, light, dark, electric, ice, poison, psychic, steel, nature
  base_rarity TEXT NOT NULL, -- C, B, A, S, SS, SSS
  
  -- Base Stats (at level 1, rank 1)
  base_hp INTEGER DEFAULT 100,
  base_attack INTEGER DEFAULT 10,
  base_defense INTEGER DEFAULT 10,
  base_speed INTEGER DEFAULT 10,
  base_crit_rate INTEGER DEFAULT 5, -- percentage
  base_crit_damage INTEGER DEFAULT 150, -- percentage
  
  -- Growth rates (multiplier per level)
  hp_growth REAL DEFAULT 1.05,
  attack_growth REAL DEFAULT 1.04,
  defense_growth REAL DEFAULT 1.03,
  speed_growth REAL DEFAULT 1.02,
  
  -- Skills (stored as JSON-like text)
  skill_1_name TEXT,
  skill_1_desc TEXT,
  skill_1_damage_multiplier REAL DEFAULT 1.0,
  skill_1_cooldown INTEGER DEFAULT 0,
  
  skill_2_name TEXT,
  skill_2_desc TEXT,
  skill_2_damage_multiplier REAL DEFAULT 1.5,
  skill_2_cooldown INTEGER DEFAULT 2,
  
  ultimate_name TEXT,
  ultimate_desc TEXT,
  ultimate_damage_multiplier REAL DEFAULT 3.0,
  ultimate_cooldown INTEGER DEFAULT 4,
  
  passive_name TEXT,
  passive_desc TEXT,
  passive_effect TEXT, -- JSON string
  
  -- Visual
  avatar_url TEXT,
  illustration_url TEXT,
  
  -- Gacha weights
  gacha_weight INTEGER DEFAULT 100,
  
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_heroes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  hero_template_id INTEGER NOT NULL,
  
  -- Current state
  current_level INTEGER DEFAULT 1,
  current_exp INTEGER DEFAULT 0,
  exp_to_next_level INTEGER DEFAULT 100,
  
  -- Progression systems
  current_rank TEXT DEFAULT 'C', -- C, B, A, S, SS, SSS
  rank_stars INTEGER DEFAULT 0, -- 0-5 stars within rank
  awakening_level INTEGER DEFAULT 0, -- 0-10
  limit_break_level INTEGER DEFAULT 0, -- 0-5
  potential_level INTEGER DEFAULT 0, -- 0-100
  
  -- Current stats (calculated)
  current_hp INTEGER,
  current_attack INTEGER,
  current_defense INTEGER,
  current_speed INTEGER,
  current_crit_rate INTEGER,
  current_crit_damage INTEGER,
  
  -- Equipment slots (references to player_equipment)
  equipment_weapon_id INTEGER,
  equipment_armor_id INTEGER,
  equipment_accessory_id INTEGER,
  equipment_boots_id INTEGER,
  
  -- Skill levels
  skill_1_level INTEGER DEFAULT 1,
  skill_2_level INTEGER DEFAULT 1,
  ultimate_level INTEGER DEFAULT 1,
  passive_level INTEGER DEFAULT 1,
  
  -- Talent tree (JSON string with talent node IDs)
  talent_tree TEXT DEFAULT '[]',
  
  -- Status
  is_favorite INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,
  in_team_slot INTEGER DEFAULT 0, -- 0 = not in team, 1-5 = team position
  
  -- Stats
  total_battles INTEGER DEFAULT 0,
  total_victories INTEGER DEFAULT 0,
  total_damage_dealt INTEGER DEFAULT 0,
  
  acquired_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (hero_template_id) REFERENCES hero_templates(id)
);

-- =====================================================
-- RESOURCES & INVENTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS resource_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- gold, diamonds, energy, mana_essence, etc.
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- currency, upgrade, crafting, gacha, special
  rarity TEXT DEFAULT 'common',
  max_stack INTEGER DEFAULT 9999,
  icon_url TEXT,
  can_trade INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  resource_type_code TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id, resource_type_code)
);

CREATE TABLE IF NOT EXISTS player_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  item_type TEXT NOT NULL, -- equipment, material, consumable, hero_shard, gacha_token
  item_id INTEGER NOT NULL, -- reference to specific item table
  quantity INTEGER DEFAULT 1,
  is_equipped INTEGER DEFAULT 0,
  acquired_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- =====================================================
-- EQUIPMENT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS equipment_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL, -- weapon, armor, accessory, boots
  rarity TEXT NOT NULL, -- common, uncommon, rare, epic, legendary, mythic
  
  -- Base stats
  base_hp_bonus INTEGER DEFAULT 0,
  base_attack_bonus INTEGER DEFAULT 0,
  base_defense_bonus INTEGER DEFAULT 0,
  base_speed_bonus INTEGER DEFAULT 0,
  base_crit_rate_bonus INTEGER DEFAULT 0,
  base_crit_damage_bonus INTEGER DEFAULT 0,
  
  -- Special effects (JSON string)
  special_effects TEXT DEFAULT '[]',
  
  -- Set bonus info
  set_name TEXT,
  set_bonus_desc TEXT,
  
  -- Requirements
  required_level INTEGER DEFAULT 1,
  required_power_type TEXT, -- specific type or 'any'
  
  -- Crafting
  craftable INTEGER DEFAULT 1,
  crafting_cost_gold INTEGER DEFAULT 1000,
  crafting_materials TEXT, -- JSON array of required materials
  
  icon_url TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  equipment_template_id INTEGER NOT NULL,
  
  -- Enhancement
  enhancement_level INTEGER DEFAULT 0, -- 0-15
  
  -- Current stats (base + enhancement)
  current_hp_bonus INTEGER,
  current_attack_bonus INTEGER,
  current_defense_bonus INTEGER,
  current_speed_bonus INTEGER,
  current_crit_rate_bonus INTEGER,
  current_crit_damage_bonus INTEGER,
  
  -- Random substats (JSON)
  substats TEXT DEFAULT '[]',
  
  is_locked INTEGER DEFAULT 0,
  acquired_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (equipment_template_id) REFERENCES equipment_templates(id)
);

-- =====================================================
-- GACHA SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS gacha_banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  banner_type TEXT NOT NULL, -- basic, advanced, essence, event
  description TEXT,
  
  -- Costs
  cost_currency TEXT DEFAULT 'diamonds', -- diamonds, gacha_tokens, special_currency
  cost_single INTEGER DEFAULT 150,
  cost_multi INTEGER DEFAULT 1350, -- 10-pull discount
  
  -- Rates
  rate_c INTEGER DEFAULT 4000, -- out of 10000 (40%)
  rate_b INTEGER DEFAULT 3000, -- 30%
  rate_a INTEGER DEFAULT 2000, -- 20%
  rate_s INTEGER DEFAULT 800,  -- 8%
  rate_ss INTEGER DEFAULT 180, -- 1.8%
  rate_sss INTEGER DEFAULT 20, -- 0.2%
  
  -- Pity system
  pity_threshold INTEGER DEFAULT 100,
  guaranteed_rarity TEXT DEFAULT 'SSS',
  
  -- Featured heroes (JSON array of hero_template_ids)
  featured_heroes TEXT DEFAULT '[]',
  featured_rate_boost REAL DEFAULT 2.0,
  
  -- Active period
  is_active INTEGER DEFAULT 1,
  start_time INTEGER,
  end_time INTEGER,
  
  banner_image_url TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS gacha_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  banner_id INTEGER NOT NULL,
  pull_type TEXT NOT NULL, -- single, multi
  
  -- Results (JSON array)
  results TEXT NOT NULL,
  
  -- Cost
  currency_spent TEXT,
  amount_spent INTEGER,
  
  -- Pity counter at time of pull
  pity_counter INTEGER,
  
  pulled_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (banner_id) REFERENCES gacha_banners(id)
);

-- =====================================================
-- GAME MODES - DUNGEONS & STAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS dungeon_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  dungeon_type TEXT NOT NULL, -- campaign, boss, trial, resource, puzzle
  difficulty TEXT NOT NULL, -- easy, normal, hard, nightmare, hell
  
  -- Requirements
  required_level INTEGER DEFAULT 1,
  required_team_power INTEGER DEFAULT 0,
  energy_cost INTEGER DEFAULT 10,
  
  -- Rewards (JSON)
  first_clear_rewards TEXT, -- JSON array of rewards
  clear_rewards TEXT, -- JSON array of standard rewards
  
  -- Enemy configuration (JSON)
  enemy_configuration TEXT,
  
  -- Special mechanics
  special_mechanics TEXT, -- JSON describing special rules
  
  -- Type advantages
  recommended_types TEXT, -- JSON array
  
  is_active INTEGER DEFAULT 1,
  unlock_condition TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_dungeon_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  dungeon_id INTEGER NOT NULL,
  
  -- Progress
  times_completed INTEGER DEFAULT 0,
  best_clear_time INTEGER,
  best_score INTEGER DEFAULT 0,
  
  -- Rewards
  first_clear_claimed INTEGER DEFAULT 0,
  
  -- Stats
  total_attempts INTEGER DEFAULT 0,
  
  first_completed_at INTEGER,
  last_completed_at INTEGER,
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (dungeon_id) REFERENCES dungeon_templates(id),
  UNIQUE(player_id, dungeon_id)
);

-- =====================================================
-- COMBAT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS battle_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  
  battle_type TEXT NOT NULL, -- dungeon, pvp, boss, coop
  opponent_id INTEGER, -- player_id for PVP, null for PVE
  dungeon_id INTEGER,
  
  -- Team composition (JSON array of player_hero_ids)
  player_team TEXT NOT NULL,
  opponent_team TEXT,
  
  -- Battle result
  result TEXT NOT NULL, -- victory, defeat, draw
  battle_duration INTEGER, -- seconds
  
  -- Stats
  total_damage_dealt INTEGER DEFAULT 0,
  total_damage_taken INTEGER DEFAULT 0,
  total_healing INTEGER DEFAULT 0,
  heroes_lost INTEGER DEFAULT 0,
  
  -- Rewards (JSON)
  rewards_earned TEXT,
  
  -- Battle log (compressed JSON for replay)
  battle_log TEXT,
  
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- =====================================================
-- PVP & ARENA
-- =====================================================

CREATE TABLE IF NOT EXISTS arena_seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  
  -- Rewards by tier (JSON)
  tier_rewards TEXT,
  
  is_active INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_arena_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  
  -- Rankings
  current_rank INTEGER DEFAULT 0,
  highest_rank INTEGER DEFAULT 0,
  mmr INTEGER DEFAULT 1000, -- matchmaking rating
  
  -- Stats
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  
  -- Rewards
  arena_points INTEGER DEFAULT 0,
  weekly_rewards_claimed INTEGER DEFAULT 0,
  
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (season_id) REFERENCES arena_seasons(id),
  UNIQUE(player_id, season_id)
);

-- =====================================================
-- CLANS & GUILDS
-- =====================================================

CREATE TABLE IF NOT EXISTS clans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  tag TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Leadership
  leader_id INTEGER NOT NULL,
  
  -- Stats
  member_count INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 30,
  clan_level INTEGER DEFAULT 1,
  clan_exp INTEGER DEFAULT 0,
  
  -- Requirements
  required_level INTEGER DEFAULT 1,
  required_power INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  
  -- Resources
  clan_currency INTEGER DEFAULT 0,
  
  -- Clan boss
  clan_boss_hp INTEGER DEFAULT 0,
  clan_boss_max_hp INTEGER DEFAULT 1000000,
  clan_boss_reset_time INTEGER,
  
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (leader_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS clan_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clan_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  
  role TEXT DEFAULT 'member', -- member, officer, co-leader, leader
  contribution_points INTEGER DEFAULT 0,
  
  joined_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (clan_id) REFERENCES clans(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id)
);

-- =====================================================
-- CRAFTING & FUSION
-- =====================================================

CREATE TABLE IF NOT EXISTS crafting_recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  recipe_type TEXT NOT NULL, -- equipment, material, hero_fusion
  
  -- Result
  result_item_type TEXT NOT NULL,
  result_item_id INTEGER NOT NULL,
  result_quantity INTEGER DEFAULT 1,
  
  -- Requirements (JSON array)
  required_materials TEXT NOT NULL,
  required_gold INTEGER DEFAULT 0,
  
  -- Constraints
  required_player_level INTEGER DEFAULT 1,
  crafting_time INTEGER DEFAULT 0, -- seconds, 0 = instant
  
  -- Success rate
  success_rate INTEGER DEFAULT 100, -- percentage
  
  is_unlocked_by_default INTEGER DEFAULT 1,
  unlock_condition TEXT,
  
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_crafting_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  
  started_at INTEGER DEFAULT (strftime('%s', 'now')),
  completion_time INTEGER NOT NULL,
  
  is_completed INTEGER DEFAULT 0,
  is_claimed INTEGER DEFAULT 0,
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (recipe_id) REFERENCES crafting_recipes(id)
);

-- =====================================================
-- DAILY & MISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS mission_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  mission_type TEXT NOT NULL, -- daily, weekly, achievement, story
  
  -- Objectives (JSON)
  objectives TEXT NOT NULL,
  
  -- Rewards (JSON)
  rewards TEXT NOT NULL,
  
  -- Requirements
  required_level INTEGER DEFAULT 1,
  
  -- Repeatability
  is_repeatable INTEGER DEFAULT 0,
  reset_period TEXT, -- daily, weekly, never
  
  -- Ordering
  display_order INTEGER DEFAULT 0,
  
  is_active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  mission_id INTEGER NOT NULL,
  
  -- Progress (JSON matching objectives)
  progress TEXT DEFAULT '{}',
  
  -- Status
  is_completed INTEGER DEFAULT 0,
  is_claimed INTEGER DEFAULT 0,
  
  -- Tracking
  started_at INTEGER DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,
  claimed_at INTEGER,
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (mission_id) REFERENCES mission_templates(id)
);

-- =====================================================
-- DAILY REWARDS & LOGIN
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_login_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_number INTEGER NOT NULL UNIQUE,
  rewards TEXT NOT NULL, -- JSON array
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_daily_login (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  consecutive_days INTEGER DEFAULT 1,
  last_claim_day INTEGER DEFAULT 1,
  last_claim_time INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id)
);

-- =====================================================
-- MULTIPLAYER CO-OP
-- =====================================================

CREATE TABLE IF NOT EXISTS coop_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_code TEXT UNIQUE NOT NULL,
  host_player_id INTEGER NOT NULL,
  dungeon_id INTEGER NOT NULL,
  
  max_players INTEGER DEFAULT 4,
  current_players INTEGER DEFAULT 1,
  
  -- Status
  status TEXT DEFAULT 'waiting', -- waiting, in_progress, completed
  
  -- Room settings
  is_public INTEGER DEFAULT 1,
  required_power INTEGER DEFAULT 0,
  
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  started_at INTEGER,
  completed_at INTEGER,
  
  FOREIGN KEY (host_player_id) REFERENCES players(id),
  FOREIGN KEY (dungeon_id) REFERENCES dungeon_templates(id)
);

CREATE TABLE IF NOT EXISTS coop_room_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  
  is_ready INTEGER DEFAULT 0,
  joined_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (room_id) REFERENCES coop_rooms(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(room_id, player_id)
);

-- =====================================================
-- FARMING & MINES
-- =====================================================

CREATE TABLE IF NOT EXISTS mine_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mine_type TEXT NOT NULL, -- gold_mine, essence_mine, material_mine
  
  -- Production
  resource_type_code TEXT NOT NULL,
  base_production_rate INTEGER DEFAULT 10, -- per hour
  
  -- Upgrades
  max_level INTEGER DEFAULT 10,
  base_upgrade_cost INTEGER DEFAULT 1000,
  upgrade_cost_multiplier REAL DEFAULT 1.5,
  
  -- Requirements
  required_player_level INTEGER DEFAULT 5,
  
  icon_url TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS player_mines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  mine_template_id INTEGER NOT NULL,
  
  current_level INTEGER DEFAULT 1,
  current_production_rate INTEGER,
  
  -- Storage
  stored_amount INTEGER DEFAULT 0,
  max_storage INTEGER DEFAULT 1000,
  
  last_collection_time INTEGER DEFAULT (strftime('%s', 'now')),
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (mine_template_id) REFERENCES mine_templates(id),
  UNIQUE(player_id, mine_template_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_clan ON players(clan_id);

CREATE INDEX IF NOT EXISTS idx_player_heroes_player ON player_heroes(player_id);
CREATE INDEX IF NOT EXISTS idx_player_heroes_template ON player_heroes(hero_template_id);
CREATE INDEX IF NOT EXISTS idx_player_heroes_team ON player_heroes(player_id, in_team_slot);

CREATE INDEX IF NOT EXISTS idx_hero_templates_type ON hero_templates(power_type);
CREATE INDEX IF NOT EXISTS idx_hero_templates_rarity ON hero_templates(base_rarity);

CREATE INDEX IF NOT EXISTS idx_player_resources_player ON player_resources(player_id);
CREATE INDEX IF NOT EXISTS idx_player_inventory_player ON player_inventory(player_id);

CREATE INDEX IF NOT EXISTS idx_gacha_history_player ON gacha_history(player_id);
CREATE INDEX IF NOT EXISTS idx_battle_history_player ON battle_history(player_id);

CREATE INDEX IF NOT EXISTS idx_arena_stats_player ON player_arena_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_arena_stats_season ON player_arena_stats(season_id);
CREATE INDEX IF NOT EXISTS idx_arena_stats_rank ON player_arena_stats(current_rank);

CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_player ON clan_members(player_id);

CREATE INDEX IF NOT EXISTS idx_player_missions_player ON player_missions(player_id);
CREATE INDEX IF NOT EXISTS idx_player_missions_completed ON player_missions(player_id, is_completed);

CREATE INDEX IF NOT EXISTS idx_coop_rooms_status ON coop_rooms(status);
CREATE INDEX IF NOT EXISTS idx_coop_room_members_room ON coop_room_members(room_id);
