// =====================================================
// RPG SUPERHEROES - FRONTEND JAVASCRIPT
// =====================================================

const API_BASE = '/api'
let authToken = localStorage.getItem('authToken')
let currentPlayer = null

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function showMessage(message, type = 'info') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600'
  }
  
  const toast = document.createElement('div')
  toast.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce`
  toast.textContent = message
  document.body.appendChild(toast)
  
  setTimeout(() => toast.remove(), 3000)
}

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }
    
    return data
  } catch (error) {
    showMessage(error.message, 'error')
    throw error
  }
}

// =====================================================
// AUTH FUNCTIONS
// =====================================================

function showLogin() {
  document.getElementById('authModal').classList.remove('hidden')
  document.getElementById('modalTitle').textContent = 'Login'
  document.getElementById('loginForm').classList.remove('hidden')
  document.getElementById('registerForm').classList.add('hidden')
}

function showRegister() {
  document.getElementById('authModal').classList.remove('hidden')
  document.getElementById('modalTitle').textContent = 'Create Account'
  document.getElementById('loginForm').classList.add('hidden')
  document.getElementById('registerForm').classList.remove('hidden')
}

function closeModal() {
  document.getElementById('authModal').classList.add('hidden')
}

async function login() {
  const username = document.getElementById('loginUsername').value
  const password = document.getElementById('loginPassword').value
  
  if (!username || !password) {
    showMessage('Please fill in all fields', 'warning')
    return
  }
  
  try {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    
    authToken = data.token
    localStorage.setItem('authToken', authToken)
    currentPlayer = data.player
    
    closeModal()
    showMessage('Welcome back, ' + username + '!', 'success')
    initGameDashboard()
  } catch (error) {
    console.error('Login failed:', error)
  }
}

async function register() {
  const username = document.getElementById('regUsername').value
  const email = document.getElementById('regEmail').value
  const password = document.getElementById('regPassword').value
  
  if (!username || !email || !password) {
    showMessage('Please fill in all fields', 'warning')
    return
  }
  
  try {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    })
    
    authToken = data.token
    localStorage.setItem('authToken', authToken)
    
    closeModal()
    showMessage(data.message, 'success')
    
    // Auto-login after registration
    setTimeout(() => {
      location.reload()
    }, 1000)
  } catch (error) {
    console.error('Registration failed:', error)
  }
}

function logout() {
  authToken = null
  currentPlayer = null
  localStorage.removeItem('authToken')
  location.reload()
}

// =====================================================
// GAME DASHBOARD
// =====================================================

async function initGameDashboard() {
  try {
    // Load player profile
    const profileData = await apiCall('/player/profile')
    currentPlayer = profileData.player
    
    // Update UI
    document.getElementById('welcomeScreen').classList.add('hidden')
    document.getElementById('gameDashboard').classList.remove('hidden')
    document.getElementById('authButtons').classList.add('hidden')
    document.getElementById('logoutButton').classList.remove('hidden')
    document.getElementById('playerInfo').classList.remove('hidden')
    
    updatePlayerInfo()
    
    // Show heroes tab by default
    showTab('heroes')
  } catch (error) {
    console.error('Failed to load dashboard:', error)
    logout()
  }
}

function updatePlayerInfo() {
  if (!currentPlayer) return
  
  document.getElementById('playerName').textContent = currentPlayer.username
  document.getElementById('playerLevel').textContent = currentPlayer.account_level
  document.getElementById('playerGold').textContent = currentPlayer.free_currency.toLocaleString()
  document.getElementById('playerDiamonds').textContent = currentPlayer.premium_currency
  document.getElementById('playerEnergy').textContent = currentPlayer.energy
}

// =====================================================
// TAB NAVIGATION
// =====================================================

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden')
  })
  
  // Show selected tab
  const selectedTab = document.getElementById(tabName + 'Tab')
  if (selectedTab) {
    selectedTab.classList.remove('hidden')
  }
  
  // Load tab content
  switch(tabName) {
    case 'heroes':
      loadHeroes()
      break
    case 'gacha':
      loadGachaBanners()
      break
    case 'dungeons':
      loadDungeons()
      break
    case 'arena':
      loadArenaRankings()
      break
    case 'inventory':
      loadInventory()
      break
    case 'missions':
      loadMissions()
      break
  }
}

// =====================================================
// HEROES TAB
// =====================================================

async function loadHeroes() {
  try {
    const data = await apiCall('/heroes/player')
    const heroes = data.heroes
    
    const heroList = document.getElementById('heroList')
    
    if (heroes.length === 0) {
      heroList.innerHTML = '<p class="col-span-full text-center text-gray-400 py-8">No heroes yet! Pull from the Gacha to get started!</p>'
      return
    }
    
    heroList.innerHTML = heroes.map(hero => `
      <div class="hero-card bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg border-2 border-${getRarityColor(hero.current_rank)}">
        <div class="flex justify-between items-start mb-2">
          <span class="text-3xl">${hero.avatar_url || '⚡'}</span>
          <span class="rarity-${hero.current_rank} px-2 py-1 rounded text-xs font-bold text-black">${hero.current_rank}</span>
        </div>
        <h3 class="font-bold mb-1">${hero.name}</h3>
        <p class="text-xs text-gray-400 mb-2">${hero.power_type} Type</p>
        <div class="text-sm space-y-1">
          <div class="flex justify-between">
            <span>Level:</span>
            <span class="font-bold">${hero.current_level}</span>
          </div>
          <div class="flex justify-between">
            <span>HP:</span>
            <span class="text-green-400">${hero.current_hp}</span>
          </div>
          <div class="flex justify-between">
            <span>ATK:</span>
            <span class="text-red-400">${hero.current_attack}</span>
          </div>
          <div class="flex justify-between">
            <span>DEF:</span>
            <span class="text-blue-400">${hero.current_defense}</span>
          </div>
        </div>
        <button onclick="levelUpHero(${hero.id})" class="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
          <i class="fas fa-arrow-up"></i> Level Up
        </button>
      </div>
    `).join('')
  } catch (error) {
    console.error('Failed to load heroes:', error)
  }
}

async function levelUpHero(heroId) {
  try {
    const data = await apiCall('/heroes/level-up', {
      method: 'POST',
      body: JSON.stringify({ heroId })
    })
    
    showMessage(`Hero leveled up to ${data.newLevel}!`, 'success')
    loadHeroes()
    
    // Refresh player info
    const profileData = await apiCall('/player/profile')
    currentPlayer = profileData.player
    updatePlayerInfo()
  } catch (error) {
    console.error('Level up failed:', error)
  }
}

function getRarityColor(rarity) {
  const colors = {
    SSS: 'yellow-400',
    SS: 'red-500',
    S: 'purple-500',
    A: 'blue-500',
    B: 'green-500',
    C: 'gray-500'
  }
  return colors[rarity] || 'gray-500'
}

// =====================================================
// GACHA TAB
// =====================================================

async function loadGachaBanners() {
  try {
    const data = await apiCall('/gacha/banners')
    const banners = data.banners
    
    const bannerList = document.getElementById('bannerList')
    bannerList.innerHTML = banners.map(banner => `
      <div class="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-lg border-2 border-purple-500">
        <div class="text-4xl mb-3">${banner.banner_image_url || '🎰'}</div>
        <h3 class="text-xl font-bold mb-2">${banner.name}</h3>
        <p class="text-sm text-gray-300 mb-4">${banner.description}</p>
        
        <div class="bg-black bg-opacity-30 p-3 rounded mb-4 text-sm">
          <div class="flex justify-between mb-1">
            <span>SSS Rate:</span>
            <span class="text-yellow-400 font-bold">${(banner.rate_sss / 100).toFixed(2)}%</span>
          </div>
          <div class="flex justify-between mb-1">
            <span>SS Rate:</span>
            <span class="text-red-400">${(banner.rate_ss / 100).toFixed(2)}%</span>
          </div>
          <div class="flex justify-between">
            <span>Pity:</span>
            <span class="text-purple-400">${banner.pity_threshold} pulls</span>
          </div>
        </div>
        
        <div class="space-y-2">
          <button onclick="pullGacha(${banner.id}, 'single')" class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded">
            <i class="fas fa-dice"></i> Single Pull (${banner.cost_single} ${banner.cost_currency})
          </button>
          <button onclick="pullGacha(${banner.id}, 'multi')" class="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded glow-animation">
            <i class="fas fa-dice"></i> 10x Pull (${banner.cost_multi} ${banner.cost_currency})
          </button>
        </div>
      </div>
    `).join('')
  } catch (error) {
    console.error('Failed to load banners:', error)
  }
}

async function pullGacha(bannerId, pullType) {
  try {
    showMessage('Summoning heroes...', 'info')
    
    const data = await apiCall('/gacha/pull', {
      method: 'POST',
      body: JSON.stringify({ bannerId, pullType })
    })
    
    displayGachaResults(data.results)
    showMessage(data.message, 'success')
    
    // Refresh player info
    const profileData = await apiCall('/player/profile')
    currentPlayer = profileData.player
    updatePlayerInfo()
    
    // Refresh heroes list
    if (document.getElementById('heroesTab').classList.contains('hidden') === false) {
      loadHeroes()
    }
  } catch (error) {
    console.error('Gacha pull failed:', error)
  }
}

function displayGachaResults(results) {
  const resultsDiv = document.getElementById('gachaResults')
  
  resultsDiv.innerHTML = `
    <div class="bg-black bg-opacity-50 p-6 rounded-lg">
      <h3 class="text-2xl font-bold mb-4 text-center">🎉 Summon Results! 🎉</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        ${results.map(hero => `
          <div class="hero-card rarity-${hero.rarity} p-4 rounded-lg text-center text-black">
            <div class="text-4xl mb-2">${hero.avatar}</div>
            <div class="font-bold text-sm mb-1">${hero.name}</div>
            <div class="text-xs">${hero.powerType}</div>
            <div class="mt-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs font-bold">
              ${hero.rarity}
            </div>
            ${hero.isNew ? '<div class="text-xs text-yellow-300 mt-1">✨ NEW!</div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    resultsDiv.innerHTML = ''
  }, 10000)
}

// =====================================================
// DUNGEONS TAB
// =====================================================

async function loadDungeons() {
  try {
    const data = await apiCall('/dungeons')
    const dungeons = data.dungeons
    
    const dungeonList = document.getElementById('dungeonList')
    dungeonList.innerHTML = dungeons.map(dungeon => `
      <div class="bg-gradient-to-br from-red-900 to-orange-900 p-5 rounded-lg border-2 border-red-500">
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-lg font-bold">${dungeon.name}</h3>
          <span class="px-2 py-1 bg-black bg-opacity-50 rounded text-xs">${dungeon.difficulty.toUpperCase()}</span>
        </div>
        
        <div class="space-y-2 text-sm mb-4">
          <div class="flex justify-between">
            <span>Type:</span>
            <span class="font-bold">${dungeon.dungeon_type}</span>
          </div>
          <div class="flex justify-between">
            <span>Energy Cost:</span>
            <span class="text-yellow-400">⚡ ${dungeon.energy_cost}</span>
          </div>
          <div class="flex justify-between">
            <span>Required Level:</span>
            <span class="text-purple-400">Lv.${dungeon.required_level}</span>
          </div>
          <div class="flex justify-between">
            <span>Cleared:</span>
            <span class="text-green-400">${dungeon.times_completed || 0}x</span>
          </div>
        </div>
        
        <button onclick="enterDungeon(${dungeon.id})" class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded">
          <i class="fas fa-dungeon"></i> Enter Dungeon
        </button>
      </div>
    `).join('')
  } catch (error) {
    console.error('Failed to load dungeons:', error)
  }
}

async function enterDungeon(dungeonId) {
  // In a real implementation, we'd select a team first
  // For now, we'll use a simplified approach
  
  if (!confirm('Enter this dungeon? (This will consume energy)')) {
    return
  }
  
  try {
    showMessage('Starting battle...', 'info')
    
    // Get player's heroes for team
    const heroData = await apiCall('/heroes/player')
    const teamHeroIds = heroData.heroes.slice(0, 5).map(h => h.id)
    
    if (teamHeroIds.length === 0) {
      showMessage('You need heroes to battle! Try the gacha first!', 'warning')
      return
    }
    
    const data = await apiCall('/dungeons/battle', {
      method: 'POST',
      body: JSON.stringify({ dungeonId, teamHeroIds })
    })
    
    if (data.victory) {
      showMessage('🎉 VICTORY! ' + data.message, 'success')
      
      // Show rewards
      if (data.rewards && data.rewards.length > 0) {
        const rewardsText = data.rewards.map(r => `${r.amount}x ${r.type}`).join(', ')
        setTimeout(() => {
          showMessage('Rewards: ' + rewardsText, 'success')
        }, 1000)
      }
    } else {
      showMessage('💀 ' + data.message, 'error')
    }
    
    // Refresh player info and dungeon list
    const profileData = await apiCall('/player/profile')
    currentPlayer = profileData.player
    updatePlayerInfo()
    loadDungeons()
  } catch (error) {
    console.error('Battle failed:', error)
  }
}

// =====================================================
// ARENA TAB
// =====================================================

async function loadArenaRankings() {
  try {
    const data = await apiCall('/arena/rankings')
    const rankings = data.rankings
    
    const arenaDiv = document.getElementById('arenaRankings')
    
    if (rankings.length === 0) {
      arenaDiv.innerHTML = '<p class="text-center text-gray-400">No rankings yet. Season just started!</p>'
      return
    }
    
    arenaDiv.innerHTML = `
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-700">
            <th class="text-left py-2">Rank</th>
            <th class="text-left py-2">Player</th>
            <th class="text-right py-2">MMR</th>
            <th class="text-right py-2">W/L</th>
          </tr>
        </thead>
        <tbody>
          ${rankings.map((player, index) => `
            <tr class="border-b border-gray-800">
              <td class="py-2">
                ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </td>
              <td class="py-2">${player.username}</td>
              <td class="text-right py-2">${player.mmr}</td>
              <td class="text-right py-2 text-green-400">${player.wins}/${player.losses}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  } catch (error) {
    console.error('Failed to load rankings:', error)
  }
}

// =====================================================
// INVENTORY TAB
// =====================================================

async function loadInventory() {
  try {
    const data = await apiCall('/player/resources')
    const resources = data.resources
    
    const resourceList = document.getElementById('resourceList')
    resourceList.innerHTML = resources.map(res => `
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-lg text-center border border-gray-700">
        <div class="text-3xl mb-2">${res.icon_url}</div>
        <div class="text-xs text-gray-400 mb-1">${res.name}</div>
        <div class="text-lg font-bold">${res.quantity.toLocaleString()}</div>
        <div class="text-xs mt-1 px-2 py-1 rounded ${getRarityBgColor(res.rarity)}">${res.rarity}</div>
      </div>
    `).join('')
  } catch (error) {
    console.error('Failed to load inventory:', error)
  }
}

function getRarityBgColor(rarity) {
  const colors = {
    mythic: 'bg-yellow-600',
    legendary: 'bg-red-600',
    epic: 'bg-purple-600',
    rare: 'bg-blue-600',
    uncommon: 'bg-green-600',
    common: 'bg-gray-600'
  }
  return colors[rarity] || 'bg-gray-600'
}

// =====================================================
// MISSIONS TAB
// =====================================================

async function loadMissions() {
  try {
    const data = await apiCall('/missions')
    const missions = data.missions
    
    const missionList = document.getElementById('missionList')
    
    // Group by type
    const daily = missions.filter(m => m.mission_type === 'daily')
    const weekly = missions.filter(m => m.mission_type === 'weekly')
    const achievements = missions.filter(m => m.mission_type === 'achievement')
    
    missionList.innerHTML = `
      <div class="mb-6">
        <h3 class="text-xl font-bold mb-3"><i class="fas fa-calendar-day"></i> Daily Missions</h3>
        ${renderMissionGroup(daily)}
      </div>
      <div class="mb-6">
        <h3 class="text-xl font-bold mb-3"><i class="fas fa-calendar-week"></i> Weekly Missions</h3>
        ${renderMissionGroup(weekly)}
      </div>
      <div class="mb-6">
        <h3 class="text-xl font-bold mb-3"><i class="fas fa-trophy"></i> Achievements</h3>
        ${renderMissionGroup(achievements)}
      </div>
    `
  } catch (error) {
    console.error('Failed to load missions:', error)
  }
}

function renderMissionGroup(missions) {
  if (missions.length === 0) {
    return '<p class="text-gray-400 text-sm">No missions available</p>'
  }
  
  return missions.map(mission => `
    <div class="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 rounded-lg mb-3 border border-indigo-700">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h4 class="font-bold mb-1">${mission.name}</h4>
          <p class="text-sm text-gray-300 mb-2">${mission.description}</p>
          <div class="text-xs text-yellow-400">
            <i class="fas fa-gift"></i> Rewards: Check objectives
          </div>
        </div>
        <div class="ml-4">
          ${mission.is_completed 
            ? '<span class="px-3 py-1 bg-green-600 rounded text-sm">✓ Done</span>'
            : '<span class="px-3 py-1 bg-gray-700 rounded text-sm">In Progress</span>'
          }
        </div>
      </div>
    </div>
  `).join('')
}

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    initGameDashboard()
  }
})
