// =====================================================
// UI COMPONENTS - REUSABLE GAMING UI ELEMENTS
// =====================================================

// Get rarity color class
export function getRarityClass(rarity) {
  const rarityMap = {
    'C': 'c',
    'B': 'b',
    'A': 'a',
    'S': 's',
    'SS': 'ss',
    'SSS': 'sss'
  };
  return rarityMap[rarity.toUpperCase()] || 'c';
}

// Get type color class
export function getTypeClass(type) {
  return type.toLowerCase();
}

// Create hero card HTML
export function createHeroCard(hero) {
  const rarityClass = getRarityClass(hero.current_rank || hero.base_rarity);
  const typeClass = getTypeClass(hero.power_type);
  
  return `
    <div class="hero-card rarity-border-${rarityClass} type-border-${typeClass} bg-game-dark hero-card-${rarityClass}" 
         data-hero-id="${hero.id}" 
         onclick="showHeroDetails(${hero.id})">
      <div class="flex justify-between items-start mb-3">
        <div class="hero-avatar">${hero.avatar_url || '⚡'}</div>
        <div class="flex flex-col gap-1">
          <span class="rarity-bg-${rarityClass} px-2 py-1 rounded text-xs font-bold border-pixel">${hero.current_rank || hero.base_rarity}</span>
          <span class="type-badge type-badge-${typeClass} text-xs">${hero.power_type}</span>
        </div>
      </div>
      
      <h3 class="font-bold text-sm mb-2 text-shadow-game">${hero.name}</h3>
      
      <div class="space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-ui-text-dim">Level:</span>
          <span class="font-bold text-yellow-400">${hero.current_level || hero.level || 1}</span>
        </div>
        
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-red-400">HP:</span>
            <span class="font-bold">${hero.current_hp || hero.base_hp}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill stat-bar-hp" style="width: ${Math.min(100, (hero.current_hp || hero.base_hp) / 20)}%"></div>
          </div>
        </div>
        
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-orange-400">ATK:</span>
            <span class="font-bold">${hero.current_attack || hero.base_attack}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill stat-bar-atk" style="width: ${Math.min(100, (hero.current_attack || hero.base_attack) / 2)}%"></div>
          </div>
        </div>
        
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-blue-400">DEF:</span>
            <span class="font-bold">${hero.current_defense || hero.base_defense}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill stat-bar-def" style="width: ${Math.min(100, (hero.current_defense || hero.base_defense) / 2)}%"></div>
          </div>
        </div>
        
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-green-400">SPD:</span>
            <span class="font-bold">${hero.current_speed || hero.base_speed}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-bar-fill stat-bar-spd" style="width: ${Math.min(100, (hero.current_speed || hero.base_speed) / 1.5)}%"></div>
          </div>
        </div>
      </div>
      
      <button onclick="event.stopPropagation(); levelUpHero(${hero.id})" 
              class="mt-3 w-full btn-game btn-primary text-xs py-2">
        <i class="fas fa-arrow-up"></i> Level Up
      </button>
    </div>
  `;
}

// Create dungeon card HTML
export function createDungeonCard(dungeon) {
  const difficultyClass = `difficulty-${dungeon.difficulty}`;
  
  return `
    <div class="dungeon-card" data-dungeon-id="${dungeon.id}">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-lg font-bold text-shadow-game">${dungeon.name}</h3>
        <span class="${difficultyClass} px-3 py-1 rounded-lg text-xs font-bold uppercase border-pixel">
          ${dungeon.difficulty}
        </span>
      </div>
      
      <div class="space-y-2 text-sm mb-4">
        <div class="flex justify-between">
          <span class="text-ui-text-dim">Type:</span>
          <span class="font-bold capitalize">${dungeon.dungeon_type}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ui-text-dim">Energy:</span>
          <span class="text-yellow-400 font-bold">⚡ ${dungeon.energy_cost}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ui-text-dim">Required Lv:</span>
          <span class="text-purple-400 font-bold">${dungeon.required_level}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-ui-text-dim">Cleared:</span>
          <span class="text-green-400 font-bold">${dungeon.times_completed || 0}x</span>
        </div>
      </div>
      
      ${dungeon.recommended_types ? `
        <div class="mb-3">
          <div class="text-xs text-ui-text-dim mb-1">Recommended:</div>
          <div class="flex flex-wrap gap-1">
            ${dungeon.recommended_types.map(type => 
              `<span class="type-badge type-badge-${getTypeClass(type)}">${type}</span>`
            ).join('')}
          </div>
        </div>
      ` : ''}
      
      <button onclick="enterDungeon(${dungeon.id})" 
              class="w-full btn-game btn-danger text-sm py-3">
        <i class="fas fa-dungeon"></i> Enter Dungeon
      </button>
    </div>
  `;
}

// Create gacha banner card
export function createGachaBannerCard(banner) {
  return `
    <div class="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-lg border-3 border-purple-500 shadow-lg">
      <div class="text-6xl mb-3 text-center">${banner.banner_image_url || '🎰'}</div>
      <h3 class="text-2xl font-bold mb-2 text-center text-shadow-game">${banner.name}</h3>
      <p class="text-sm text-gray-300 mb-4 text-center">${banner.description}</p>
      
      <div class="bg-black bg-opacity-50 p-4 rounded-lg mb-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span>SSS Rate:</span>
          <span class="text-yellow-400 font-bold">${(banner.rate_sss / 100).toFixed(2)}%</span>
        </div>
        <div class="flex justify-between">
          <span>SS Rate:</span>
          <span class="text-red-400 font-bold">${(banner.rate_ss / 100).toFixed(2)}%</span>
        </div>
        <div class="flex justify-between">
          <span>S Rate:</span>
          <span class="text-purple-400 font-bold">${(banner.rate_s / 100).toFixed(2)}%</span>
        </div>
        <div class="flex justify-between">
          <span>Pity:</span>
          <span class="text-purple-400 font-bold">${banner.pity_threshold} pulls</span>
        </div>
      </div>
      
      <div class="space-y-2">
        <button onclick="pullGacha(${banner.id}, 'single')" 
                class="w-full btn-game btn-primary py-3">
          <i class="fas fa-dice"></i> Single (${banner.cost_single} 💎)
        </button>
        <button onclick="pullGacha(${banner.id}, 'multi')" 
                class="w-full btn-game btn-legendary py-3 pulse">
          <i class="fas fa-dice"></i> 10x Pull (${banner.cost_multi} 💎)
        </button>
      </div>
    </div>
  `;
}

// Show toast notification
export function showToast(message, type = 'info') {
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600'
  };
  
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 border-pixel bounce-in`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-xl"></i>
      <span class="font-bold">${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Create loading spinner
export function showLoading(message = 'Loading...') {
  const loading = document.createElement('div');
  loading.id = 'loading-overlay';
  loading.className = 'modal-overlay';
  loading.innerHTML = `
    <div class="modal-content text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
      <p class="text-xl font-bold game-font">${message}</p>
    </div>
  `;
  
  document.body.appendChild(loading);
}

export function hideLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) loading.remove();
}

// Create modal
export function createModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  modal.innerHTML = `
    <div class="modal-content max-w-4xl" onclick="event.stopPropagation()">
      <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
        <h2 class="text-2xl font-bold game-font text-shadow-game">${title}</h2>
        <button onclick="this.closest('.modal-overlay').remove()" 
                class="text-3xl hover:text-red-500 transition-colors">
          &times;
        </button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  return modal;
}

// Format large numbers
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Calculate total power
export function calculateTotalPower(heroes) {
  return heroes.reduce((sum, hero) => {
    return sum + (hero.current_hp || hero.base_hp) * 0.5 + 
           (hero.current_attack || hero.base_attack) + 
           (hero.current_defense || hero.base_defense) * 0.8;
  }, 0);
}
