-- =====================================================
-- SEED DATA - INITIAL GAME CONTENT
-- =====================================================

-- =====================================================
-- RESOURCE TYPES (20+ types)
-- =====================================================

INSERT OR IGNORE INTO resource_types (code, name, description, category, rarity, icon_url) VALUES
-- Core Currencies
('gold', 'Gold', 'Basic currency for most transactions', 'currency', 'common', '💰'),
('diamonds', 'Diamonds', 'Premium currency', 'currency', 'legendary', '💎'),
('energy', 'Energy', 'Required to enter dungeons', 'currency', 'common', '⚡'),
('mana_essence', 'Mana Essence', 'Mystical energy for upgrades', 'currency', 'rare', '✨'),

-- Upgrade Resources
('level_stone', 'Level Stone', 'Increases hero level', 'upgrade', 'common', '🔷'),
('rank_stone_b', 'B-Rank Stone', 'Required for B-rank promotion', 'upgrade', 'uncommon', '🔶'),
('rank_stone_a', 'A-Rank Stone', 'Required for A-rank promotion', 'upgrade', 'rare', '🔸'),
('rank_stone_s', 'S-Rank Stone', 'Required for S-rank promotion', 'upgrade', 'epic', '💠'),
('rank_stone_ss', 'SS-Rank Stone', 'Required for SS-rank promotion', 'upgrade', 'legendary', '🔆'),
('rank_stone_sss', 'SSS-Rank Stone', 'Required for SSS-rank promotion', 'upgrade', 'mythic', '⭐'),
('limit_breaker_crystal', 'Limit Breaker Crystal', 'Breaks level limits', 'upgrade', 'epic', '💫'),
('awakening_core', 'Awakening Core', 'Awakens hero potential', 'upgrade', 'legendary', '🌟'),
('talent_orb', 'Talent Orb', 'Unlocks talent nodes', 'upgrade', 'rare', '🔮'),
('potential_dust', 'Potential Dust', 'Boosts hero potential', 'upgrade', 'uncommon', '✨'),

-- Crafting Materials
('iron_ore', 'Iron Ore', 'Basic crafting material', 'crafting', 'common', '⛏️'),
('mythril_ingot', 'Mythril Ingot', 'Advanced crafting material', 'crafting', 'rare', '🔩'),
('essence_fiber', 'Essence Fiber', 'Magical fabric', 'crafting', 'uncommon', '🧵'),
('rare_core', 'Rare Core', 'Powerful equipment core', 'crafting', 'epic', '💎'),
('dragon_scale', 'Dragon Scale', 'Legendary material', 'crafting', 'legendary', '🐉'),

-- Gacha Tokens
('basic_gacha_token', 'Basic Gacha Token', 'One basic gacha pull', 'gacha', 'common', '🎫'),
('advanced_gacha_token', 'Advanced Gacha Token', 'One advanced gacha pull', 'gacha', 'rare', '🎟️'),
('essence_gacha_token', 'Essence Gacha Token', 'One essence gacha pull', 'gacha', 'epic', '🎰'),

-- Special Resources
('hero_shard_generic', 'Generic Hero Shard', 'Can be used for any hero', 'special', 'rare', '🧩'),
('dungeon_key', 'Dungeon Key', 'Opens special dungeons', 'special', 'uncommon', '🔑'),
('boss_ticket', 'Boss Ticket', 'Challenges world bosses', 'special', 'rare', '🎯'),
('coop_credit', 'Co-op Credit', 'Currency for co-op shop', 'special', 'uncommon', '🤝'),
('arena_medal', 'Arena Medal', 'Currency for arena shop', 'special', 'rare', '🏆'),
('clan_coin', 'Clan Coin', 'Currency for clan shop', 'special', 'uncommon', '🪙');

-- =====================================================
-- HERO TEMPLATES (12 power types, various rarities)
-- =====================================================

-- FIRE TYPE HEROES
INSERT OR IGNORE INTO hero_templates (
  name, power_type, base_rarity,
  base_hp, base_attack, base_defense, base_speed, base_crit_rate, base_crit_damage,
  hp_growth, attack_growth, defense_growth, speed_growth,
  skill_1_name, skill_1_desc, skill_1_damage_multiplier, skill_1_cooldown,
  skill_2_name, skill_2_desc, skill_2_damage_multiplier, skill_2_cooldown,
  ultimate_name, ultimate_desc, ultimate_damage_multiplier, ultimate_cooldown,
  passive_name, passive_desc, passive_effect,
  gacha_weight, avatar_url
) VALUES
('Ignis the Flame Lord', 'fire', 'SSS', 
  1500, 180, 80, 95, 15, 200,
  1.08, 1.06, 1.03, 1.02,
  'Flame Strike', 'Deals fire damage to single enemy', 1.2, 0,
  'Inferno Blast', 'AOE fire damage to all enemies', 1.8, 2,
  'Meteor Storm', 'Massive fire damage and burns all enemies', 4.5, 5,
  'Burning Soul', 'Increases attack when HP is low', '{"type":"attack_boost","trigger":"low_hp","value":50}',
  10, '🔥'),

('Ember Wisp', 'fire', 'B',
  300, 45, 25, 70, 8, 160,
  1.04, 1.03, 1.02, 1.03,
  'Spark', 'Basic fire attack', 1.0, 0,
  'Flame Wave', 'Medium fire damage', 1.5, 3,
  'Fire Dance', 'Rapid fire attacks', 2.5, 4,
  'Quick Burn', 'Increases speed on kill', '{"type":"speed_boost","trigger":"kill","value":20}',
  400, '🔥'),

-- WATER TYPE HEROES
('Aqua the Tide Master', 'water', 'SS',
  1200, 120, 110, 85, 12, 180,
  1.07, 1.04, 1.05, 1.02,
  'Water Jet', 'Piercing water attack', 1.1, 0,
  'Tidal Wave', 'AOE water damage and slows enemies', 1.7, 2,
  'Ocean''s Wrath', 'Massive water damage and freezes', 3.8, 5,
  'Flowing Defense', 'Reduces damage taken when HP is high', '{"type":"defense_boost","trigger":"high_hp","value":30}',
  50, '🌊'),

('River Spirit', 'water', 'A',
  450, 65, 60, 75, 10, 170,
  1.05, 1.03, 1.04, 1.02,
  'Splash', 'Basic water attack', 1.0, 0,
  'Whirlpool', 'Water damage and pulls enemies', 1.6, 3,
  'Tsunami', 'Large AOE water damage', 3.0, 4,
  'Regeneration', 'Heals over time in water terrain', '{"type":"heal_over_time","trigger":"water_terrain","value":5}',
  200, '🌊'),

-- EARTH TYPE HEROES
('Terra the Stone Guardian', 'earth', 'S',
  1800, 90, 150, 60, 8, 160,
  1.09, 1.02, 1.06, 1.01,
  'Rock Throw', 'Throws a boulder at enemy', 1.0, 0,
  'Earthquake', 'AOE earth damage and stuns', 1.5, 3,
  'Mountain Crash', 'Massive earth damage and defense boost', 3.2, 5,
  'Iron Skin', 'Permanent defense boost', '{"type":"defense_permanent","value":25}',
  100, '🪨'),

-- AIR TYPE HEROES
('Zephyr the Wind Dancer', 'air', 'SS',
  900, 140, 70, 120, 18, 210,
  1.06, 1.05, 1.02, 1.04,
  'Wind Blade', 'Swift air attack', 1.1, 0,
  'Cyclone', 'AOE wind damage and evasion boost', 1.7, 2,
  'Tempest Fury', 'Extreme speed attacks', 3.5, 4,
  'Wind Step', 'Chance to dodge attacks', '{"type":"dodge_chance","value":20}',
  50, '💨'),

('Breeze Scout', 'air', 'C',
  250, 35, 20, 90, 12, 170,
  1.03, 1.02, 1.01, 1.04,
  'Quick Strike', 'Fast basic attack', 0.9, 0,
  'Wind Dash', 'Double attack with evasion', 1.4, 3,
  'Air Burst', 'Multiple quick strikes', 2.3, 4,
  'Nimble', 'Increased speed', '{"type":"speed_permanent","value":15}',
  600, '💨'),

-- LIGHT TYPE HEROES
('Lumina the Radiant', 'light', 'SSS',
  1300, 160, 100, 100, 14, 190,
  1.07, 1.05, 1.04, 1.03,
  'Holy Ray', 'Light damage to enemy', 1.2, 0,
  'Divine Shield', 'Protects allies and heals', 0.8, 3,
  'Judgment Day', 'Massive light damage to all dark enemies', 5.0, 5,
  'Blessing', 'Heals team periodically', '{"type":"team_heal","value":10}',
  10, '✨'),

-- DARK TYPE HEROES
('Noctis the Shadow King', 'dark', 'SSS',
  1400, 170, 85, 105, 20, 220,
  1.07, 1.06, 1.03, 1.03,
  'Shadow Strike', 'Dark damage with lifesteal', 1.3, 0,
  'Void Slash', 'Ignores defense', 2.0, 2,
  'Eternal Night', 'Massive dark damage and blinds enemies', 4.8, 5,
  'Life Drain', 'Heals when dealing damage', '{"type":"lifesteal","value":15}',
  10, '🌑'),

('Shadow Rogue', 'dark', 'A',
  500, 85, 50, 95, 16, 200,
  1.05, 1.04, 1.02, 1.03,
  'Backstab', 'High crit chance attack', 1.2, 0,
  'Shadow Step', 'Teleport and attack', 1.8, 2,
  'Assassinate', 'Massive single target damage', 3.5, 4,
  'Critical Master', 'Increased crit rate', '{"type":"crit_rate_permanent","value":10}',
  200, '🌑'),

-- ELECTRIC TYPE HEROES
('Volt the Storm Caller', 'electric', 'SS',
  1100, 150, 75, 110, 13, 185,
  1.06, 1.05, 1.02, 1.03,
  'Lightning Bolt', 'Electric damage to one enemy', 1.2, 0,
  'Chain Lightning', 'Bounces between enemies', 1.6, 2,
  'Thunderstorm', 'Massive AOE electric damage and paralyzes', 4.0, 5,
  'Static Charge', 'Deals damage when attacked', '{"type":"counter_attack","value":20}',
  50, '⚡'),

-- ICE TYPE HEROES
('Frost the Ice Queen', 'ice', 'S',
  1250, 130, 105, 80, 11, 175,
  1.07, 1.04, 1.04, 1.02,
  'Ice Shard', 'Ice damage and slows', 1.1, 0,
  'Blizzard', 'AOE ice damage', 1.7, 3,
  'Absolute Zero', 'Freezes all enemies', 3.3, 5,
  'Ice Armor', 'Reduces physical damage', '{"type":"physical_resist","value":25}',
  100, '❄️'),

-- POISON TYPE HEROES
('Venom the Toxic Master', 'poison', 'A',
  800, 110, 80, 85, 10, 170,
  1.05, 1.04, 1.03, 1.02,
  'Poison Dart', 'Poisons enemy', 0.9, 0,
  'Toxic Cloud', 'AOE poison damage over time', 1.4, 3,
  'Plague Strike', 'Heavy poison and reduces healing', 2.8, 4,
  'Venomous', 'All attacks apply poison', '{"type":"poison_on_hit","value":5}',
  200, '☠️'),

-- PSYCHIC TYPE HEROES
('Psion the Mind Breaker', 'psychic', 'SS',
  1000, 165, 90, 100, 12, 185,
  1.06, 1.05, 1.03, 1.03,
  'Mind Spike', 'Psychic damage ignores armor', 1.3, 0,
  'Confusion', 'Makes enemies attack each other', 1.5, 3,
  'Psychic Storm', 'Massive mental damage to all', 4.2, 5,
  'Mind Shield', 'Immune to status effects', '{"type":"status_immunity","value":100}',
  50, '🧠'),

-- STEEL TYPE HEROES
('Titan the Iron Colossus', 'steel', 'S',
  2000, 100, 160, 55, 7, 155,
  1.10, 1.02, 1.07, 1.01,
  'Metal Fist', 'Heavy physical attack', 1.1, 0,
  'Steel Wall', 'Protects team and taunts', 0.5, 3,
  'Meteor Impact', 'Devastating AOE damage', 3.0, 5,
  'Unbreakable', 'Cannot be killed in one hit', '{"type":"survive_fatal","value":1}',
  100, '🛡️'),

-- NATURE TYPE HEROES
('Gaia the Forest Spirit', 'nature', 'S',
  1100, 115, 95, 90, 10, 170,
  1.06, 1.03, 1.04, 1.02,
  'Vine Whip', 'Nature damage and entangles', 1.0, 0,
  'Nature''s Wrath', 'AOE nature damage', 1.6, 3,
  'Overgrowth', 'Massive damage and heals team', 3.4, 5,
  'Regeneration', 'Heals team over time', '{"type":"team_regen","value":8}',
  100, '🌿'),

('Leaf Sprite', 'nature', 'C',
  280, 40, 35, 75, 9, 165,
  1.03, 1.02, 1.02, 1.02,
  'Leaf Cutter', 'Basic nature attack', 0.95, 0,
  'Root Bind', 'Immobilizes enemy', 1.3, 3,
  'Solar Beam', 'Channeled nature damage', 2.4, 4,
  'Photosynthesis', 'Heals self over time', '{"type":"self_heal","value":5}',
  600, '🌿');

-- =====================================================
-- GACHA BANNERS
-- =====================================================

INSERT OR IGNORE INTO gacha_banners (
  name, banner_type, description,
  cost_currency, cost_single, cost_multi,
  rate_c, rate_b, rate_a, rate_s, rate_ss, rate_sss,
  pity_threshold, guaranteed_rarity,
  featured_heroes, featured_rate_boost,
  is_active, banner_image_url
) VALUES
('Basic Summon', 'basic', 'Standard hero summons with common to rare heroes',
  'gold', 10000, 90000,
  4000, 3500, 2000, 450, 50, 0,
  50, 'S', '[]', 1.0, 1, '🎲'),

('Advanced Summon', 'advanced', 'Premium summons with rare to legendary heroes',
  'diamonds', 150, 1350,
  2000, 3000, 3000, 1500, 450, 50,
  100, 'SSS', '[]', 1.0, 1, '✨'),

('Essence Summon - Fire', 'essence', 'Fire-type heroes only with increased SSS rates',
  'diamonds', 150, 1350,
  1500, 2500, 3000, 2000, 800, 200,
  80, 'SSS', '[1,2]', 3.0, 1, '🔥'),

('Legendary Banner', 'event', 'Limited time! Featured SSS heroes with boosted rates',
  'diamonds', 150, 1350,
  1000, 2000, 2500, 2000, 1500, 1000,
  50, 'SSS', '[1,7,8]', 5.0, 1, '⭐');

-- =====================================================
-- DUNGEON TEMPLATES
-- =====================================================

INSERT OR IGNORE INTO dungeon_templates (
  name, dungeon_type, difficulty,
  required_level, required_team_power, energy_cost,
  first_clear_rewards, clear_rewards,
  enemy_configuration, special_mechanics,
  recommended_types, is_active
) VALUES
-- Campaign Dungeons
('Burning Plains', 'campaign', 'easy', 1, 0, 5,
  '[{"type":"gold","amount":1000},{"type":"diamonds","amount":50},{"type":"hero_shard_generic","amount":5}]',
  '[{"type":"gold","amount":200},{"type":"level_stone","amount":3}]',
  '[{"hero_id":2,"level":5,"count":3}]',
  '{"type":"normal","boss":false}',
  '["water","ice"]', 1),

('Aqua Depths', 'campaign', 'normal', 5, 1000, 8,
  '[{"type":"gold","amount":2000},{"type":"diamonds","amount":75},{"type":"rank_stone_b","amount":3}]',
  '[{"type":"gold","amount":350},{"type":"level_stone","amount":5}]',
  '[{"hero_id":4,"level":10,"count":4}]',
  '{"type":"normal","boss":false}',
  '["electric","nature"]', 1),

('Shadow Realm', 'campaign', 'hard', 15, 5000, 12,
  '[{"type":"gold","amount":5000},{"type":"diamonds","amount":150},{"type":"rank_stone_a","amount":5}]',
  '[{"type":"gold","amount":800},{"type":"rank_stone_b","amount":2}]',
  '[{"hero_id":9,"level":20,"count":5}]',
  '{"type":"normal","boss":true}',
  '["light","psychic"]', 1),

-- Boss Dungeons
('Fire Dragon Lair', 'boss', 'nightmare', 20, 10000, 20,
  '[{"type":"diamonds","amount":500},{"type":"rank_stone_s","amount":10},{"type":"limit_breaker_crystal","amount":5}]',
  '[{"type":"gold","amount":2000},{"type":"rank_stone_a","amount":3},{"type":"dragon_scale","amount":1}]',
  '[{"hero_id":1,"level":50,"count":1}]',
  '{"type":"boss","enrage_timer":300,"special_attack":"Meteor Storm"}',
  '["water","ice"]', 1),

-- Resource Dungeons
('Gold Mine Raid', 'resource', 'easy', 10, 2000, 10,
  '[{"type":"gold","amount":10000}]',
  '[{"type":"gold","amount":5000}]',
  '[{"hero_id":13,"level":15,"count":4}]',
  '{"type":"resource","resource":"gold"}',
  '["any"]', 1),

('Essence Sanctuary', 'trial', 'hard', 25, 15000, 15,
  '[{"type":"awakening_core","amount":10},{"type":"talent_orb","amount":20}]',
  '[{"type":"mana_essence","amount":500},{"type":"talent_orb","amount":5}]',
  '[{"hero_id":12,"level":30,"count":5}]',
  '{"type":"trial","time_limit":180}',
  '["psychic","light"]', 1);

-- =====================================================
-- EQUIPMENT TEMPLATES
-- =====================================================

INSERT OR IGNORE INTO equipment_templates (
  name, equipment_type, rarity,
  base_hp_bonus, base_attack_bonus, base_defense_bonus, base_speed_bonus,
  base_crit_rate_bonus, base_crit_damage_bonus,
  special_effects, set_name, set_bonus_desc,
  required_level, required_power_type,
  craftable, crafting_cost_gold, crafting_materials
) VALUES
-- Weapons
('Flame Sword', 'weapon', 'rare', 0, 50, 0, 5, 5, 0,
  '[{"type":"burn_on_hit","value":10}]', 'Inferno Set', '2-piece: +20% Fire Damage',
  10, 'fire', 1, 5000, '[{"type":"iron_ore","amount":10},{"type":"essence_fiber","amount":5}]'),

('Ocean Trident', 'weapon', 'epic', 0, 80, 0, 10, 0, 15,
  '[{"type":"slow_on_hit","value":20}]', 'Aqua Set', '2-piece: +20% Water Damage',
  20, 'water', 1, 15000, '[{"type":"mythril_ingot","amount":5},{"type":"rare_core","amount":2}]'),

('Shadow Dagger', 'weapon', 'legendary', 0, 120, 0, 20, 15, 30,
  '[{"type":"lifesteal","value":15},{"type":"crit_damage","value":25}]', 'Void Set', '2-piece: +30% Dark Damage',
  30, 'dark', 1, 50000, '[{"type":"mythril_ingot","amount":10},{"type":"dragon_scale","amount":3}]'),

-- Armor
('Iron Plate Armor', 'armor', 'common', 200, 0, 40, -5, 0, 0,
  '[]', 'Basic Set', 'No set bonus',
  1, 'any', 1, 1000, '[{"type":"iron_ore","amount":15}]'),

('Dragon Scale Armor', 'armor', 'legendary', 500, 0, 150, 0, 0, 0,
  '[{"type":"damage_reduction","value":20}]', 'Dragon Set', '2-piece: +25% Defense',
  40, 'any', 1, 100000, '[{"type":"dragon_scale","amount":10},{"type":"rare_core","amount":5}]'),

-- Accessories
('Speed Boots', 'boots', 'uncommon', 0, 0, 0, 25, 0, 0,
  '[{"type":"dodge_chance","value":10}]', 'Wind Set', '2-piece: +20 Speed',
  5, 'any', 1, 2000, '[{"type":"essence_fiber","amount":10}]'),

('Critical Amulet', 'accessory', 'epic', 0, 30, 0, 0, 20, 50,
  '[{"type":"crit_rate","value":10}]', 'Assassin Set', '2-piece: +30% Crit Damage',
  25, 'any', 1, 20000, '[{"type":"rare_core","amount":3},{"type":"mythril_ingot","amount":5}]');

-- =====================================================
-- CRAFTING RECIPES
-- =====================================================

INSERT OR IGNORE INTO crafting_recipes (
  name, recipe_type,
  result_item_type, result_item_id, result_quantity,
  required_materials, required_gold,
  required_player_level, crafting_time, success_rate
) VALUES
('Craft Iron Plate Armor', 'equipment', 'equipment', 4, 1,
  '[{"type":"iron_ore","amount":15},{"type":"essence_fiber","amount":5}]', 1000,
  1, 0, 100),

('Craft Flame Sword', 'equipment', 'equipment', 1, 1,
  '[{"type":"iron_ore","amount":10},{"type":"essence_fiber","amount":5},{"type":"mana_essence","amount":100}]', 5000,
  10, 3600, 100),

('Craft Dragon Scale Armor', 'equipment', 'equipment', 5, 1,
  '[{"type":"dragon_scale","amount":10},{"type":"rare_core","amount":5},{"type":"mythril_ingot","amount":15}]', 100000,
  40, 86400, 80),

('Fuse Hero Shards', 'hero_fusion', 'hero', 0, 1,
  '[{"type":"hero_shard_generic","amount":50}]', 10000,
  10, 0, 100),

('Upgrade Material', 'material', 'rank_stone_a', 0, 1,
  '[{"type":"rank_stone_b","amount":10},{"type":"mana_essence","amount":500}]', 5000,
  15, 1800, 90);

-- =====================================================
-- MISSION TEMPLATES
-- =====================================================

INSERT OR IGNORE INTO mission_templates (
  name, description, mission_type,
  objectives, rewards,
  required_level, is_repeatable, reset_period, display_order
) VALUES
-- Daily Missions
('Daily Login', 'Login to the game', 'daily',
  '[{"type":"login","target":1}]',
  '[{"type":"gold","amount":1000},{"type":"energy","amount":50}]',
  1, 1, 'daily', 1),

('Complete 3 Dungeons', 'Clear any dungeons 3 times', 'daily',
  '[{"type":"dungeon_clear","target":3}]',
  '[{"type":"gold","amount":2000},{"type":"diamonds","amount":50}]',
  1, 1, 'daily', 2),

('Win 5 Arena Battles', 'Win 5 battles in the arena', 'daily',
  '[{"type":"arena_win","target":5}]',
  '[{"type":"arena_medal","amount":100},{"type":"diamonds","amount":75}]',
  25, 1, 'daily', 3),

-- Weekly Missions
('Complete 20 Dungeons', 'Clear dungeons 20 times this week', 'weekly',
  '[{"type":"dungeon_clear","target":20}]',
  '[{"type":"gold","amount":10000},{"type":"diamonds","amount":300},{"type":"gacha_token","amount":5}]',
  1, 1, 'weekly', 10),

('Level Up 5 Heroes', 'Increase hero levels 5 times', 'weekly',
  '[{"type":"hero_level_up","target":5}]',
  '[{"type":"level_stone","amount":50},{"type":"gold","amount":5000}]',
  1, 1, 'weekly', 11),

-- Achievement Missions
('First SSS Hero', 'Obtain your first SSS-rank hero', 'achievement',
  '[{"type":"obtain_hero_rarity","target":"SSS","count":1}]',
  '[{"type":"diamonds","amount":1000},{"type":"awakening_core","amount":10}]',
  1, 0, 'never', 100),

('Reach Level 50', 'Reach account level 50', 'achievement',
  '[{"type":"player_level","target":50}]',
  '[{"type":"diamonds","amount":2000},{"type":"premium_item","id":"legendary_box","amount":1}]',
  1, 0, 'never', 101),

('Join a Clan', 'Become a member of a clan', 'achievement',
  '[{"type":"join_clan","target":1}]',
  '[{"type":"clan_coin","amount":500},{"type":"diamonds","amount":200}]',
  30, 0, 'never', 102);

-- =====================================================
-- DAILY LOGIN REWARDS
-- =====================================================

INSERT OR IGNORE INTO daily_login_rewards (day_number, rewards) VALUES
(1, '[{"type":"gold","amount":5000},{"type":"energy","amount":100}]'),
(2, '[{"type":"gold","amount":7500},{"type":"level_stone","amount":10}]'),
(3, '[{"type":"diamonds","amount":150},{"type":"basic_gacha_token","amount":3}]'),
(4, '[{"type":"gold","amount":10000},{"type":"rank_stone_b","amount":5}]'),
(5, '[{"type":"diamonds","amount":300},{"type":"hero_shard_generic","amount":10}]'),
(6, '[{"type":"gold","amount":15000},{"type":"talent_orb","amount":20}]'),
(7, '[{"type":"diamonds","amount":500},{"type":"advanced_gacha_token","amount":1},{"type":"awakening_core","amount":5}]');

-- =====================================================
-- MINE TEMPLATES
-- =====================================================

INSERT OR IGNORE INTO mine_templates (
  name, mine_type, resource_type_code,
  base_production_rate, max_level,
  base_upgrade_cost, upgrade_cost_multiplier,
  required_player_level
) VALUES
('Gold Mine', 'gold_mine', 'gold', 100, 20, 5000, 1.5, 5),
('Essence Well', 'essence_mine', 'mana_essence', 10, 15, 10000, 1.8, 10),
('Iron Quarry', 'material_mine', 'iron_ore', 50, 15, 3000, 1.4, 5),
('Diamond Mine', 'premium_mine', 'diamonds', 5, 10, 50000, 2.0, 20);

-- =====================================================
-- ARENA SEASON
-- =====================================================

INSERT OR IGNORE INTO arena_seasons (
  season_number, name,
  start_time, end_time,
  tier_rewards, is_active
) VALUES
(1, 'Season 1: Origins',
  strftime('%s', 'now'), strftime('%s', 'now', '+30 days'),
  '[{"tier":"bronze","min_rank":0,"max_rank":1000,"rewards":[{"type":"arena_medal","amount":1000}]},{"tier":"silver","min_rank":1001,"max_rank":5000,"rewards":[{"type":"arena_medal","amount":500}]},{"tier":"gold","min_rank":5001,"max_rank":999999,"rewards":[{"type":"arena_medal","amount":200}]}]',
  1);

-- =====================================================
-- INITIAL TEST DATA (can be removed in production)
-- =====================================================

-- Create test players
INSERT OR IGNORE INTO players (
  username, email, password_hash,
  account_level, total_exp, premium_currency, free_currency,
  energy, tutorial_completed
) VALUES
('TestPlayer', 'test@rpg.com', '$2a$10$test.hash.placeholder',
  10, 5000, 1000, 50000,
  100, 1);
