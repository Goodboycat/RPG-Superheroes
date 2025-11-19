// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const auth = new Hono<{ Bindings: Bindings }>();

function hashPassword(password: string): string {
  return `hashed_${password}`;
}

function generateToken(playerId: number): string {
  return `token_${playerId}_${Date.now()}`;
}

export async function verifyToken(token: string, db: D1Database): Promise<number | null> {
  const parts = token.split('_');
  if (parts.length !== 3 || parts[0] !== 'token') return null;
  return parseInt(parts[1]);
}

auth.post('/register', async (c) => {
  const { username, email, password } = await c.req.json();
  
  if (!username || !email || !password) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  try {
    const hashedPassword = hashPassword(password);
    
    const result = await c.env.DB.prepare(`
      INSERT INTO players (username, email, password_hash, last_login)
      VALUES (?, ?, ?, ?)
    `).bind(username, email, hashedPassword, Math.floor(Date.now() / 1000)).run();
    
    const playerId = result.meta.last_row_id as number;
    
    // Give starting resources
    await c.env.DB.prepare(`
      INSERT INTO player_resources (player_id, resource_type_code, quantity)
      VALUES (?, 'gold', 10000), (?, 'diamonds', 500), (?, 'energy', 100), (?, 'basic_gacha_token', 10)
    `).bind(playerId, playerId, playerId, playerId).run();
    
    const token = generateToken(playerId);
    
    return c.json({ 
      success: true, 
      token, 
      playerId,
      message: 'Account created successfully! Welcome!' 
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return c.json({ error: 'Username or email already exists' }, 409);
    }
    return c.json({ error: 'Registration failed' }, 500);
  }
});

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  const hashedPassword = hashPassword(password);
  
  const player = await c.env.DB.prepare(`
    SELECT id, username, account_level, premium_currency, free_currency
    FROM players 
    WHERE username = ? AND password_hash = ?
  `).bind(username, hashedPassword).first();
  
  if (!player) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  await c.env.DB.prepare(`
    UPDATE players SET last_login = ? WHERE id = ?
  `).bind(Math.floor(Date.now() / 1000), player.id).run();
  
  const token = generateToken(player.id as number);
  
  return c.json({ success: true, token, player });
});

export default auth;
