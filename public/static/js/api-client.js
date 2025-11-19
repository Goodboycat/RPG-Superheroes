// =====================================================
// API CLIENT - CENTRALIZED API CALLS
// =====================================================

import { showToast, showLoading, hideLoading } from './ui-components.js';

const API_BASE = '/api';
let authToken = localStorage.getItem('authToken');
let currentPlayer = null;

// Set auth token
export function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
}

// Get current player
export function getCurrentPlayer() {
  return currentPlayer;
}

// Set current player
export function setCurrentPlayer(player) {
  currentPlayer = player;
}

// Generic API call
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

// =====================================================
// AUTH API
// =====================================================

export async function register(username, email, password) {
  showLoading('Creating account...');
  try {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    
    setAuthToken(data.token);
    hideLoading();
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

export async function login(username, password) {
  showLoading('Logging in...');
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    setAuthToken(data.token);
    setCurrentPlayer(data.player);
    hideLoading();
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

export function logout() {
  authToken = null;
  currentPlayer = null;
  localStorage.removeItem('authToken');
  location.reload();
}

// =====================================================
// PLAYER API
// =====================================================

export async function getPlayerProfile() {
  const data = await apiCall('/player/profile');
  setCurrentPlayer(data.player);
  return data.player;
}

export async function getPlayerResources() {
  const data = await apiCall('/player/resources');
  return data.resources;
}

// =====================================================
// HEROES API
// =====================================================

export async function getHeroTemplates() {
  const data = await apiCall('/heroes/templates');
  return data.templates;
}

export async function getPlayerHeroes() {
  const data = await apiCall('/heroes/player');
  return data.heroes;
}

export async function levelUpHero(heroId) {
  showLoading('Leveling up hero...');
  try {
    const data = await apiCall('/heroes/level-up', {
      method: 'POST',
      body: JSON.stringify({ heroId })
    });
    
    hideLoading();
    showToast('Hero leveled up!', 'success');
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

export async function generateRandomHeroes(count = 10) {
  showLoading('Generating heroes...');
  try {
    const data = await apiCall('/heroes/generate', {
      method: 'POST',
      body: JSON.stringify({ count })
    });
    
    hideLoading();
    return data.heroes;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

// =====================================================
// GACHA API
// =====================================================

export async function getGachaBanners() {
  const data = await apiCall('/gacha/banners');
  return data.banners;
}

export async function pullGacha(bannerId, pullType) {
  showLoading('Summoning heroes...');
  try {
    const data = await apiCall('/gacha/pull', {
      method: 'POST',
      body: JSON.stringify({ bannerId, pullType })
    });
    
    hideLoading();
    showToast(data.message || 'Summon complete!', 'success');
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

// =====================================================
// DUNGEONS API
// =====================================================

export async function getDungeons() {
  const data = await apiCall('/dungeons');
  return data.dungeons;
}

export async function enterDungeon(dungeonId, teamHeroIds) {
  showLoading('Starting battle...');
  try {
    const data = await apiCall('/dungeons/battle', {
      method: 'POST',
      body: JSON.stringify({ dungeonId, teamHeroIds })
    });
    
    hideLoading();
    
    if (data.victory) {
      showToast('🎉 VICTORY!', 'success');
    } else {
      showToast('💀 Defeat...', 'error');
    }
    
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

export async function generateDailydungeons() {
  showLoading('Generating daily dungeons...');
  try {
    const data = await apiCall('/dungeons/generate-daily', {
      method: 'POST'
    });
    
    hideLoading();
    return data.dungeons;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

// =====================================================
// MISSIONS API
// =====================================================

export async function getMissions() {
  const data = await apiCall('/missions');
  return data.missions;
}

export async function getDailyRewards() {
  const data = await apiCall('/daily-rewards');
  return data;
}

// =====================================================
// ARENA API
// =====================================================

export async function getArenaRankings() {
  const data = await apiCall('/arena/rankings');
  return data.rankings;
}

// =====================================================
// TEAM AI API
// =====================================================

export async function getOptimalTeam(teamSize = 5) {
  showLoading('Building optimal team...');
  try {
    const data = await apiCall('/team/optimal', {
      method: 'POST',
      body: JSON.stringify({ teamSize })
    });
    
    hideLoading();
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

export async function getCounterTeam(enemyTypes, teamSize = 5) {
  showLoading('Building counter team...');
  try {
    const data = await apiCall('/team/counter', {
      method: 'POST',
      body: JSON.stringify({ enemyTypes, teamSize })
    });
    
    hideLoading();
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

export async function getDungeonTeam(dungeonId, teamSize = 5) {
  showLoading('Building dungeon team...');
  try {
    const data = await apiCall('/team/dungeon', {
      method: 'POST',
      body: JSON.stringify({ dungeonId, teamSize })
    });
    
    hideLoading();
    return data;
  } catch (error) {
    hideLoading();
    throw error;
  }
}

// Export auth check
export function isAuthenticated() {
  return !!authToken;
}
