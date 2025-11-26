// =====================================================
// RPG SUPERHEROES - MAIN APPLICATION
// =====================================================

import * as API from './js/api-client.js';
import * as UI from './js/ui-components.js';
import * as EnhancedUI from './js/enhanced-ui.js';
import * as BattleSystem from './js/battle-system.js';

// =====================================================
// GLOBAL STATE
// =====================================================

window.currentHeroes = [];
window.currentDungeons = [];
window.currentBanners = [];
window.explorationSession = null;
window.explorationInterval = null;
window.selectedHeroes = [];

// =====================================================
// AUTH FUNCTIONS
// =====================================================

window.showLogin = function() {
  document.getElementById('authModal').classList.remove('hidden');
  document.getElementById('modalTitle').textContent = 'Login';
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
}

window.showRegister = function() {
  document.getElementById('authModal').classList.remove('hidden');
  document.getElementById('modalTitle').textContent = 'Create Account';
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
}

window.showGoogleLogin = function() {
  showLogin();
}

window.closeModal = function() {
  document.getElementById('authModal').classList.add('hidden');
}

window.login = async function() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!username || !password) {
    UI.showToast('Please fill in all fields', 'warning');
    return;
  }
  
  try {
    const data = await API.login(username, password);
    closeModal();
    UI.showToast(`Welcome back, ${username}!`, 'success');
    initGameDashboard();
  } catch (error) {
    console.error('Login failed:', error);
    UI.showToast('Login failed. Please check your credentials.', 'error');
  }
}

window.loginWithGoogle = async function() {
  UI.showToast('Google OAuth integration coming soon!', 'info');
  // For now, show simplified login
  // In production, this would use Google OAuth 2.0
  const googleEmail = prompt('Enter your Gmail address (demo):');
  if (!googleEmail || !googleEmail.includes('@gmail.com')) {
    UI.showToast('Please enter a valid Gmail address', 'warning');
    return;
  }
  
  // Auto-create account with Gmail
  const username = googleEmail.split('@')[0];
  const password = 'google_' + Math.random().toString(36).substring(7);
  
  try {
    // Try to register
    await API.register(username, googleEmail, password);
    UI.showToast('Account created with Gmail!', 'success');
  } catch (error) {
    // If already exists, try to login
    console.log('Account might exist, attempting login...');
  }
  
  // Login with generated credentials
  try {
    const data = await API.login(username, password);
    closeModal();
    UI.showToast(`Welcome ${username}!`, 'success');
    initGameDashboard();
  } catch (error) {
    console.error('Google login failed:', error);
    UI.showToast('Please use regular login for existing accounts', 'warning');
  }
}

window.register = async function() {
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  
  if (!username || !email || !password) {
    UI.showToast('Please fill in all fields', 'warning');
    return;
  }
  
  if (password.length < 6) {
    UI.showToast('Password must be at least 6 characters', 'warning');
    return;
  }
  
  try {
    await API.register(username, email, password);
    closeModal();
    UI.showToast('Account created! Logging in...', 'success');
    
    // Auto-login after registration
    setTimeout(async () => {
      try {
        const data = await API.login(username, password);
        UI.showToast(`Welcome, ${username}!`, 'success');
        initGameDashboard();
      } catch (error) {
        UI.showToast('Please login with your new account', 'info');
      }
    }, 500);
  } catch (error) {
    console.error('Registration failed:', error);
    UI.showToast('Registration failed. Username or email may already exist.', 'error');
  }
}

window.registerWithGoogle = function() {
  loginWithGoogle(); // Same flow for registration
}

window.logout = function() {
  API.logout();
}

// =====================================================
// GAME DASHBOARD
// =====================================================

async function initGameDashboard() {
  try {
    const player = await API.getPlayerProfile();
    
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('gameDashboard').classList.remove('hidden');
    document.getElementById('bottomNav').classList.remove('hidden');
    document.getElementById('authButtons').classList.add('hidden');
    document.getElementById('logoutButton').classList.remove('hidden');
    document.getElementById('playerInfo').classList.remove('hidden');
    
    updatePlayerInfo(player);
    showTab('heroes');
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    API.logout();
  }
}

function updatePlayerInfo(player) {
  if (!player) return;
  
  document.getElementById('playerName').textContent = player.username;
  document.getElementById('playerLevel').textContent = player.account_level;
  document.getElementById('playerGold').textContent = UI.formatNumber(player.free_currency);
  document.getElementById('playerDiamonds').textContent = player.premium_currency;
  document.getElementById('playerEnergy').textContent = player.energy;
}

// =====================================================
// TAB NAVIGATION
// =====================================================

window.showTab = function(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  const selectedTab = document.getElementById(tabName + 'Tab');
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
  }
  
  switch(tabName) {
    case 'heroes':
      loadHeroes();
      break;
    case 'gacha':
      loadGacha();
      break;
    case 'exploration':
      loadExploration();
      break;
    case 'dungeons':
      loadDungeons();
      break;
    case 'team':
      loadTeamAI();
      break;
    case 'inventory':
      loadInventory();
      break;
  }
}

// =====================================================
// HEROES TAB
// =====================================================

async function loadHeroes() {
  try {
    const heroes = await API.getPlayerHeroes();
    window.currentHeroes = heroes;
    
    const heroList = document.getElementById('heroesTab');
    
    if (heroes.length === 0) {
      heroList.innerHTML = `
        <div class="text-center py-12">
          <p class="text-xl mb-4 text-gray-400">No heroes yet!</p>
          <button onclick="showTab('gacha')" class="btn-game btn-legendary py-3 px-6">
            Go to Gacha
          </button>
        </div>
      `;
      return;
    }
    
    heroList.innerHTML = `
      <h2 class="text-2xl md:text-3xl font-bold mb-6 game-font text-shadow-game">
        <i class="fas fa-users"></i> Your Heroes (${heroes.length})
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${heroes.map(hero => EnhancedUI.createEnhancedHeroCard(hero)).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Failed to load heroes:', error);
  }
}

window.levelUpHero = async function(heroId) {
  try {
    await API.levelUpHero(heroId);
    const player = await API.getPlayerProfile();
    updatePlayerInfo(player);
    loadHeroes();
  } catch (error) {
    console.error('Level up failed:', error);
  }
}

window.showHeroDetails = function(heroId) {
  const hero = window.currentHeroes.find(h => h.id === heroId);
  if (!hero) return;
  
  const content = `
    <div class="flex flex-col md:flex-row gap-6">
      <div class="flex-shrink-0 text-center">
        <div class="text-8xl mb-4">${hero.avatar_url}</div>
        <span class="rarity-bg-${UI.getRarityClass(hero.current_rank)} px-4 py-2 rounded-lg text-xl font-bold border-pixel inline-block">
          ${hero.current_rank}
        </span>
      </div>
      <div class="flex-1">
        <h3 class="text-2xl font-bold mb-2">${hero.name}</h3>
        <p class="type-badge type-badge-${UI.getTypeClass(hero.power_type)} mb-4">${hero.power_type} Type</p>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="text-sm text-gray-400">Level</div>
            <div class="text-2xl font-bold text-yellow-400">${hero.current_level}</div>
          </div>
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="text-sm text-gray-400">HP</div>
            <div class="text-2xl font-bold text-red-400">${hero.current_hp}</div>
          </div>
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="text-sm text-gray-400">Attack</div>
            <div class="text-2xl font-bold text-orange-400">${hero.current_attack}</div>
          </div>
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="text-sm text-gray-400">Defense</div>
            <div class="text-2xl font-bold text-blue-400">${hero.current_defense}</div>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="font-bold mb-1">🔥 ${hero.skill_1_name}</div>
            <div class="text-sm text-gray-400">Basic attack skill</div>
          </div>
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="font-bold mb-1">⚡ ${hero.skill_2_name}</div>
            <div class="text-sm text-gray-400">Special skill</div>
          </div>
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="font-bold mb-1">💫 ${hero.ultimate_name}</div>
            <div class="text-sm text-gray-400">Ultimate ability</div>
          </div>
          <div class="bg-black bg-opacity-50 p-3 rounded">
            <div class="font-bold mb-1">✨ ${hero.passive_name}</div>
            <div class="text-sm text-gray-400">Passive effect</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  UI.createModal(`Hero Details: ${hero.name}`, content);
}

// =====================================================
// GACHA TAB
// =====================================================

async function loadGacha() {
  try {
    const banners = await API.getGachaBanners();
    // Filter to show only Normal (basic) and Advanced
    const filteredBanners = banners.filter(b => 
      b.banner_type === 'basic' || b.banner_type === 'advanced'
    );
    window.currentBanners = filteredBanners;
    
    const gachaTab = document.getElementById('gachaTab');
    gachaTab.innerHTML = `
      <h2 class="text-2xl md:text-3xl font-bold mb-6 game-font text-shadow-game">
        <i class="fas fa-dice"></i> Hero Summons
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 max-w-4xl mx-auto">
        ${filteredBanners.map(banner => EnhancedUI.createEnhancedGachaBanner(banner)).join('')}
      </div>
      <div id="gachaResults"></div>
    `;
  } catch (error) {
    console.error('Failed to load banners:', error);
  }
}

window.pullGacha = async function(bannerId, pullType) {
  try {
    const data = await API.pullGacha(bannerId, pullType);
    
    // Use enhanced animation
    EnhancedUI.animateGachaPull(data.results, async () => {
      const player = await API.getPlayerProfile();
      updatePlayerInfo(player);
      await loadHeroes(); // Refresh hero list
    });
    
  } catch (error) {
    console.error('Gacha pull failed:', error);
  }
}

// =====================================================
// DUNGEONS TAB
// =====================================================

async function loadDungeons() {
  try {
    const dungeons = await API.getDungeons();
    window.currentDungeons = dungeons;
    
    const dungeonsTab = document.getElementById('dungeonsTab');
    dungeonsTab.innerHTML = `
      <h2 class="text-2xl md:text-3xl font-bold mb-6 game-font text-shadow-game">
        <i class="fas fa-dungeon"></i> Dungeons & Raids
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${dungeons.map(dungeon => UI.createDungeonCard(dungeon)).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Failed to load dungeons:', error);
  }
}

window.enterDungeon = async function(dungeonId) {
  try {
    const heroes = await API.getPlayerHeroes();
    const playerTeam = heroes.slice(0, 5);
    
    if (playerTeam.length === 0) {
      UI.showToast('You need heroes! Try gacha first!', 'warning');
      return;
    }
    
    // Get dungeon data
    const dungeon = window.currentDungeons.find(d => d.id === dungeonId);
    if (!dungeon) {
      UI.showToast('Dungeon not found!', 'error');
      return;
    }
    
    // Create mock enemy data for battle
    const enemyTeam = Array.from({ length: 3 }, (_, i) => ({
      name: `Enemy ${i + 1}`,
      level: dungeon.required_level || 1,
      hp: 100 + dungeon.required_level * 20,
      attack: 40 + dungeon.required_level * 5,
      power_type: ['fire', 'water', 'earth', 'air'][Math.floor(Math.random() * 4)],
      avatar: ['👹', '👺', '👻', '💀', '👾'][Math.floor(Math.random() * 5)]
    }));
    
    // Start Pokemon-style battle
    await BattleSystem.startDungeonBattle(dungeonId, playerTeam, {
      enemies: enemyTeam
    });
    
    // Update player info after battle
    setTimeout(async () => {
      const player = await API.getPlayerProfile();
      updatePlayerInfo(player);
    }, 2000);
    
  } catch (error) {
    console.error('Battle failed:', error);
  }
}

// =====================================================
// TEAM AI TAB
// =====================================================

async function loadTeamAI() {
  const teamTab = document.getElementById('teamTab');
  teamTab.innerHTML = `
    <h2 class="text-2xl md:text-3xl font-bold mb-6 game-font text-shadow-game">
      <i class="fas fa-users-cog"></i> AI Team Builder
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button onclick="buildOptimalTeam()" class="btn-game btn-success py-6 text-lg">
        <i class="fas fa-star"></i><br>Build Optimal Team
      </button>
      <button onclick="buildCounterTeam()" class="btn-game btn-primary py-6 text-lg">
        <i class="fas fa-shield-alt"></i><br>Build Counter Team
      </button>
      <button onclick="generateHeroes()" class="btn-game btn-legendary py-6 text-lg pulse">
        <i class="fas fa-magic"></i><br>Generate Heroes
      </button>
    </div>
    <div id="teamAIResults" class="mt-6"></div>
  `;
}

window.buildOptimalTeam = async function() {
  try {
    const data = await API.getOptimalTeam(5);
    displayTeamComposition(data.composition);
  } catch (error) {
    console.error('Failed to build team:', error);
  }
}

window.buildCounterTeam = async function() {
  const types = prompt('Enter enemy types (comma-separated):\nfire,water,earth,air,light,dark,electric,ice,poison,psychic,steel,nature');
  if (!types) return;
  
  const enemyTypes = types.split(',').map(t => t.trim());
  
  try {
    const data = await API.getCounterTeam(enemyTypes, 5);
    displayTeamComposition(data.composition);
  } catch (error) {
    console.error('Failed to build counter team:', error);
  }
}

window.generateHeroes = async function() {
  try {
    await API.generateRandomHeroes(10);
    UI.showToast('Generated 10 new heroes! Check hero templates.', 'success');
  } catch (error) {
    console.error('Failed to generate heroes:', error);
  }
}

function displayTeamComposition(composition) {
  const resultsDiv = document.getElementById('teamAIResults');
  
  resultsDiv.innerHTML = `
    <div class="bg-game-dark p-6 rounded-lg border-4 border-green-500">
      <h3 class="text-2xl font-bold mb-4 game-font">Team Composition</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-black bg-opacity-50 p-3 rounded">
          <div class="text-sm text-gray-400">Total Power</div>
          <div class="text-2xl font-bold text-yellow-400">${UI.formatNumber(composition.totalPower)}</div>
        </div>
        <div class="bg-black bg-opacity-50 p-3 rounded">
          <div class="text-sm text-gray-400">Synergy</div>
          <div class="text-2xl font-bold text-green-400">${composition.synergy}%</div>
        </div>
        <div class="bg-black bg-opacity-50 p-3 rounded col-span-2 md:col-span-1">
          <div class="text-sm text-gray-400">Strategy</div>
          <div class="text-sm font-bold">${composition.strategy}</div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        ${composition.heroes.map(hero => UI.createHeroCard(hero)).join('')}
      </div>
    </div>
  `;
}

// =====================================================
// INVENTORY TAB
// =====================================================

async function loadInventory() {
  try {
    const resources = await API.getPlayerResources();
    
    const inventoryTab = document.getElementById('inventoryTab');
    inventoryTab.innerHTML = `
      <h2 class="text-2xl md:text-3xl font-bold mb-6 game-font text-shadow-game">
        <i class="fas fa-backpack"></i> Resources & Items
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        ${resources.map(res => `
          <div class="bg-game-dark p-4 rounded-lg text-center border-2 border-${res.rarity === 'legendary' ? 'yellow' : res.rarity === 'epic' ? 'purple' : 'gray'}-500">
            <div class="text-4xl mb-2">${res.icon_url}</div>
            <div class="text-xs text-gray-400 mb-1">${res.name}</div>
            <div class="text-xl font-bold">${UI.formatNumber(res.quantity)}</div>
            <div class="text-xs mt-1 px-2 py-1 rounded capitalize ${
              res.rarity === 'mythic' ? 'bg-yellow-600' :
              res.rarity === 'legendary' ? 'bg-red-600' :
              res.rarity === 'epic' ? 'bg-purple-600' :
              res.rarity === 'rare' ? 'bg-blue-600' :
              res.rarity === 'uncommon' ? 'bg-green-600' : 'bg-gray-600'
            }">${res.rarity}</div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Failed to load inventory:', error);
  }
}

// =====================================================
// EXPLORATION TAB
// =====================================================

async function loadExploration() {
  try {
    const session = await API.getExplorationSession();
    window.explorationSession = session;
    window.explorationTeam = []; // Combat team
    window.explorationFarmers = []; // Resource farmers
    
    const explorationTab = document.getElementById('explorationTab');
    explorationTab.innerHTML = `
      <h2 class="text-xl md:text-2xl font-bold mb-4 game-font text-shadow-game">
        <i class="fas fa-map-marked-alt"></i> Live Exploration
      </h2>
      
      <!-- Stats Bar -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-game-dark p-2 rounded border border-purple-500">
          <div class="text-xs text-gray-400">Difficulty</div>
          <div class="text-lg font-bold text-red-400" id="difficultyLevel">x1.0</div>
        </div>
        <div class="bg-game-dark p-2 rounded border border-green-500">
          <div class="text-xs text-gray-400">Resources</div>
          <div class="text-lg font-bold text-green-400" id="resourcesGathered">0</div>
        </div>
        <div class="bg-game-dark p-2 rounded border border-yellow-500">
          <div class="text-xs text-gray-400">Waves Defeated</div>
          <div class="text-lg font-bold text-yellow-400" id="wavesDefeated">0</div>
        </div>
      </div>
      
      <!-- Map Canvas -->
      <div class="bg-gray-900 rounded-lg border-4 border-purple-600 mb-4 relative overflow-hidden" style="height: 350px;">
        <canvas id="explorationMap" width="1000" height="800" style="width: 100%; height: 100%; image-rendering: pixelated;"></canvas>
        <div class="absolute top-2 left-2 bg-black bg-opacity-70 p-2 rounded text-xs">
          <div id="battleStatus" class="text-green-400">⏸️ Paused</div>
        </div>
      </div>
      
      <!-- Team Setup -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Combat Team -->
        <div class="bg-game-dark p-3 rounded border border-red-500">
          <h3 class="text-sm font-bold mb-2">⚔️ Combat Team (1 Team Only)</h3>
          <div id="combatTeamDisplay" class="min-h-[60px] flex gap-2 items-center">
            <button onclick="selectCombatTeam()" class="btn-game btn-danger text-xs py-2 px-3">
              Select Team
            </button>
          </div>
        </div>
        
        <!-- Resource Farmers -->
        <div class="bg-game-dark p-3 rounded border border-green-500">
          <h3 class="text-sm font-bold mb-2">🌾 Farmers (Any Heroes)</h3>
          <div id="farmersDisplay" class="min-h-[60px] flex gap-2 items-center">
            <button onclick="selectFarmers()" class="btn-game btn-success text-xs py-2 px-3">
              Select Farmers
            </button>
          </div>
        </div>
      </div>
      
      <!-- Resource Nodes (Compact) -->
      <div class="mb-4">
        <h3 class="text-sm font-bold mb-2">💎 Active Resources</h3>
        <div id="resourceNodesList" class="grid grid-cols-3 md:grid-cols-6 gap-1 text-xs"></div>
      </div>
      
      <!-- Start Button -->
      <button onclick="toggleExploration()" id="explorationToggle" 
              class="w-full btn-game btn-legendary py-4 text-lg pulse">
        <i class="fas fa-play"></i> START LIVE EXPLORATION
      </button>
    `;
    
    drawExplorationMap();
    updateResourceNodesCompact();
    
  } catch (error) {
    console.error('Failed to load exploration:', error);
  }
}

function drawExplorationMap() {
  const canvas = document.getElementById('explorationMap');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const session = window.explorationSession;
  if (!session) return;
  
  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 1000, 800);
  
  // Draw grid
  ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1000; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 800);
    ctx.stroke();
  }
  for (let y = 0; y < 800; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1000, y);
    ctx.stroke();
  }
  
  // Draw center spawn area
  const centerX = session.area.centerX;
  const centerY = session.area.centerY;
  ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏠 SPAWN', centerX, centerY);
  
  // Draw resource nodes
  session.area.resourceNodes.forEach(node => {
    const colors = {
      common: '#888888',
      uncommon: '#4ade80',
      rare: '#3b82f6',
      epic: '#a855f7',
      legendary: '#fbbf24'
    };
    
    ctx.fillStyle = node.isActive ? colors[node.rarity] : '#333333';
    ctx.beginPath();
    ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(node.isActive ? '💎' : '⏳', node.x, node.y + 4);
  });
  
  // Draw enemy waves
  session.area.enemyWaves.forEach((wave, idx) => {
    if (wave.hp > 0) {
      const waveX = 200 + (idx % 3) * 300;
      const waveY = 150 + Math.floor(idx / 3) * 200;
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(waveX, waveY, 30, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👹', waveX, waveY + 5);
      
      // Health bar
      const barWidth = 60;
      const barHeight = 8;
      const healthPercent = wave.hp / wave.maxHp;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(waveX - barWidth/2, waveY + 35, barWidth, barHeight);
      
      ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#fbbf24' : '#ef4444';
      ctx.fillRect(waveX - barWidth/2, waveY + 35, barWidth * healthPercent, barHeight);
      
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(waveX - barWidth/2, waveY + 35, barWidth, barHeight);
    }
  });
  
  // Draw heroes at center (placeholder)
  ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('👥', centerX, centerY + 30);
}

function updateResourceNodesList() {
  const session = window.explorationSession;
  if (!session) return;
  
  const listDiv = document.getElementById('resourceNodesList');
  listDiv.innerHTML = session.area.resourceNodes.map(node => {
    const rarityColors = {
      common: 'gray',
      uncommon: 'green',
      rare: 'blue',
      epic: 'purple',
      legendary: 'yellow'
    };
    
    return `
      <div class="bg-game-dark p-2 rounded border-2 border-${rarityColors[node.rarity]}-500 ${!node.isActive ? 'opacity-50' : ''}">
        <div class="text-xs font-bold capitalize">${node.type}</div>
        <div class="text-xs text-${rarityColors[node.rarity]}-400">${node.rarity}</div>
        <div class="text-xs">${node.isActive ? '✅ Active' : '⏳ Cooldown'}</div>
        <div class="text-xs mt-1">Gather: ${node.gatherTime}s</div>
        ${node.isActive ? `
          <button onclick="selectNodeForDispatch('${node.id}')" class="btn-game btn-primary text-xs py-1 px-2 mt-1 w-full">
            Dispatch Hero
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function loadHeroesForDispatch() {
  try {
    const heroes = await API.getPlayerHeroes();
    const listDiv = document.getElementById('heroSelectionList');
    
    listDiv.innerHTML = heroes.slice(0, 10).map(hero => `
      <div class="bg-game-dark p-2 rounded border-2 ${window.selectedHeroes.includes(hero.id) ? 'border-green-500' : 'border-gray-600'} cursor-pointer"
           onclick="toggleHeroSelection(${hero.id})">
        <div class="text-2xl text-center">${hero.avatar_url}</div>
        <div class="text-xs text-center font-bold">${hero.name}</div>
        <div class="text-xs text-center">Lv.${hero.current_level}</div>
        ${window.selectedHeroes.includes(hero.id) ? '<div class="text-xs text-center text-green-400">✅ Selected</div>' : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load heroes:', error);
  }
}

window.toggleHeroSelection = function(heroId) {
  const idx = window.selectedHeroes.indexOf(heroId);
  if (idx > -1) {
    window.selectedHeroes.splice(idx, 1);
  } else {
    if (window.selectedHeroes.length >= 5) {
      UI.showToast('Maximum 5 heroes can be selected', 'warning');
      return;
    }
    window.selectedHeroes.push(heroId);
  }
  loadHeroesForDispatch();
}

window.selectNodeForDispatch = async function(nodeId) {
  if (window.selectedHeroes.length === 0) {
    UI.showToast('Please select a hero first!', 'warning');
    return;
  }
  
  const heroId = window.selectedHeroes[0];
  
  try {
    await API.dispatchHeroToResource(heroId, nodeId);
    window.selectedHeroes = window.selectedHeroes.filter(id => id !== heroId);
    loadExploration(); // Reload
  } catch (error) {
    console.error('Failed to dispatch hero:', error);
  }
}

window.startAutoBattle = function() {
  if (window.explorationInterval) {
    UI.showToast('Auto-battle already running!', 'warning');
    return;
  }
  
  UI.showToast('Auto-battle started!', 'success');
  document.getElementById('battleStatus').textContent = 'Fighting!';
  
  window.explorationInterval = setInterval(async () => {
    try {
      const result = await API.explorationBattleTick(window.explorationSession.sessionId);
      
      if (result.victory) {
        UI.showToast('🎉 Wave defeated!', 'success');
        const currentWaves = parseInt(document.getElementById('wavesDefeated').textContent);
        document.getElementById('wavesDefeated').textContent = currentWaves + 1;
      }
      
      if (result.heroesDefeated) {
        UI.showToast('💀 Heroes defeated! Respawning at center...', 'error');
        document.getElementById('heroPosition').textContent = '👥 Heroes: Respawned at Center';
      }
      
      if (result.missionComplete) {
        UI.showToast('🎯 Mission complete! Difficulty increased!', 'success');
      }
      
      // Update session
      window.explorationSession = result.session;
      drawExplorationMap();
      
    } catch (error) {
      console.error('Battle tick failed:', error);
      stopAutoBattle();
    }
  }, 2000); // Battle tick every 2 seconds
}

window.stopAutoBattle = function() {
  if (window.explorationInterval) {
    clearInterval(window.explorationInterval);
    window.explorationInterval = null;
    UI.showToast('Auto-battle stopped', 'info');
    document.getElementById('battleStatus').textContent = 'Idle';
  }
}

// Enhanced Exploration Functions
window.selectCombatTeam = async function() {
  const heroes = await API.getPlayerHeroes();
  const selected = prompt(`Select hero IDs (comma-separated, max 5):\n${heroes.map((h, i) => `${i}: ${h.name}`).join('\n')}`);
  if (!selected) return;
  
  const indices = selected.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  window.explorationTeam = indices.slice(0, 5).map(i => heroes[i]).filter(h => h);
  
  document.getElementById('combatTeamDisplay').innerHTML = `
    <div class="flex gap-1 flex-wrap">
      ${window.explorationTeam.map(h => `<span class="text-2xl" title="${h.name}">${h.avatar_url}</span>`).join('')}
    </div>
  `;
}

window.selectFarmers = async function() {
  const heroes = await API.getPlayerHeroes();
  const selected = prompt(`Select farmer IDs (comma-separated, any amount):\n${heroes.map((h, i) => `${i}: ${h.name}`).join('\n')}`);
  if (!selected) return;
  
  const indices = selected.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  window.explorationFarmers = indices.map(i => heroes[i]).filter(h => h);
  
  document.getElementById('farmersDisplay').innerHTML = `
    <div class="flex gap-1 flex-wrap">
      ${window.explorationFarmers.map(h => `<span class="text-2xl" title="${h.name}">${h.avatar_url}</span>`).join('')}
    </div>
  `;
}

function updateResourceNodesCompact() {
  const session = window.explorationSession;
  if (!session) return;
  
  const listDiv = document.getElementById('resourceNodesList');
  const activeNodes = session.area.resourceNodes.filter(n => n.isAlive);
  
  listDiv.innerHTML = activeNodes.slice(0, 12).map(node => {
    const rarityEmoji = {
      common: '⚪',
      uncommon: '🟢',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡'
    }[node.rarity];
    
    return `<div class="bg-black bg-opacity-50 p-1 rounded text-center">${rarityEmoji}</div>`;
  }).join('');
}

window.toggleExploration = function() {
  if (window.explorationInterval) {
    // Stop
    clearInterval(window.explorationInterval);
    window.explorationInterval = null;
    document.getElementById('explorationToggle').innerHTML = '<i class="fas fa-play"></i> START LIVE EXPLORATION';
    document.getElementById('battleStatus').innerHTML = '⏸️ Paused';
  } else {
    // Start
    if (!window.explorationTeam || window.explorationTeam.length === 0) {
      UI.showToast('Please select a combat team first!', 'warning');
      return;
    }
    
    document.getElementById('explorationToggle').innerHTML = '<i class="fas fa-stop"></i> STOP EXPLORATION';
    document.getElementById('battleStatus').innerHTML = '⚔️ Fighting!';
    
    // Live exploration loop
    window.explorationInterval = setInterval(async () => {
      try {
        // Simulated battle and farming
        const wavesEl = document.getElementById('wavesDefeated');
        const resourcesEl = document.getElementById('resourcesGathered');
        const difficultyEl = document.getElementById('difficultyLevel');
        
        // Increment waves (every 3 seconds = 1 wave)
        const currentWaves = parseInt(wavesEl.textContent);
        wavesEl.textContent = currentWaves + 1;
        
        // Farm resources if farmers are active
        if (window.explorationFarmers && window.explorationFarmers.length > 0) {
          const currentResources = parseInt(resourcesEl.textContent);
          const farmRate = window.explorationFarmers.length;
          resourcesEl.textContent = currentResources + farmRate;
        }
        
        // Increase difficulty every 5 waves
        if ((currentWaves + 1) % 5 === 0) {
          const newDifficulty = 1.0 + Math.floor((currentWaves + 1) / 5) * 0.5;
          difficultyEl.textContent = `x${newDifficulty.toFixed(1)}`;
          UI.showToast('Difficulty increased!', 'warning');
        }
        
        drawExplorationMap();
        
      } catch (error) {
        console.error('Exploration tick failed:', error);
      }
    }, 3000); // Every 3 seconds
  }
}

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  if (API.isAuthenticated()) {
    initGameDashboard();
  }
});
