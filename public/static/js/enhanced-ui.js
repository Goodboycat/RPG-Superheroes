// =====================================================
// ENHANCED UI COMPONENTS - GAME IMPROVEMENTS
// =====================================================

// =====================================================
// POWER TYPE VISUAL EFFECTS
// =====================================================

const POWER_EFFECTS = {
  fire: {
    emoji: '🔥',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    particles: { color: '#ff6b00', shape: 'circle' }
  },
  water: {
    emoji: '💧',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    particles: { color: '#0ea5e9', shape: 'circle' }
  },
  earth: {
    emoji: '🌍',
    color: '#a16207',
    gradient: 'linear-gradient(135deg, #a16207 0%, #854d0e 100%)',
    particles: { color: '#ca8a04', shape: 'triangle' }
  },
  air: {
    emoji: '💨',
    color: '#e0e7ff',
    gradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    particles: { color: '#a5b4fc', shape: 'circle' }
  },
  light: {
    emoji: '✨',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    particles: { color: '#fcd34d', shape: 'star' }
  },
  dark: {
    emoji: '🌑',
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    particles: { color: '#8b5cf6', shape: 'circle' }
  },
  electric: {
    emoji: '⚡',
    color: '#eab308',
    gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    particles: { color: '#facc15', shape: 'edge' }
  },
  ice: {
    emoji: '❄️',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    particles: { color: '#22d3ee', shape: 'triangle' }
  },
  poison: {
    emoji: '☠️',
    color: '#84cc16',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    particles: { color: '#a3e635', shape: 'circle' }
  },
  psychic: {
    emoji: '🧠',
    color: '#d946ef',
    gradient: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)',
    particles: { color: '#e879f9', shape: 'star' }
  },
  steel: {
    emoji: '⚙️',
    color: '#64748b',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    particles: { color: '#94a3b8', shape: 'polygon' }
  },
  nature: {
    emoji: '🌿',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    particles: { color: '#4ade80', shape: 'circle' }
  }
};

export function createPowerEffect(powerType, x, y) {
  const effect = POWER_EFFECTS[powerType.toLowerCase()] || POWER_EFFECTS.fire;
  
  // Create particle burst
  const particle = document.createElement('div');
  particle.className = 'power-particle';
  particle.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: 20px;
    height: 20px;
    background: ${effect.color};
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    animation: particleBurst 0.8s ease-out forwards;
  `;
  
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 800);
}

// =====================================================
// ENHANCED HERO CARD (NO STAT BARS)
// =====================================================

export function createEnhancedHeroCard(hero) {
  const powerType = hero.power_type.toLowerCase();
  const effect = POWER_EFFECTS[powerType];
  
  return `
    <div class="hero-card-enhanced" 
         onclick="showHeroDetails(${hero.id})"
         style="background: ${effect.gradient}; cursor: pointer;"
         data-power="${powerType}">
      <div class="hero-card-glow" style="box-shadow: 0 0 20px ${effect.color}40"></div>
      
      <!-- Rarity Badge -->
      <div class="absolute top-2 right-2 rarity-badge-${hero.current_rank.toLowerCase()} px-3 py-1 rounded-full font-bold text-xs shadow-lg">
        ${hero.current_rank}
      </div>
      
      <!-- Hero Avatar -->
      <div class="hero-avatar-large text-center mb-3 relative">
        <div class="text-7xl mb-2 hover:scale-110 transition-transform">
          ${hero.avatar_url}
        </div>
        <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <span class="text-4xl">${effect.emoji}</span>
        </div>
      </div>
      
      <!-- Hero Info -->
      <div class="text-center">
        <h3 class="text-lg font-bold mb-1 text-white drop-shadow-lg">${hero.name}</h3>
        <div class="flex items-center justify-center gap-2 mb-2">
          <span class="text-xl">${effect.emoji}</span>
          <span class="text-sm font-semibold text-white">${hero.power_type}</span>
        </div>
        <div class="text-2xl font-bold text-yellow-300 drop-shadow-lg mb-2">
          Lv.${hero.current_level}
        </div>
      </div>
      
      <!-- Quick Stats (No Bars) -->
      <div class="grid grid-cols-4 gap-1 mt-3 bg-black bg-opacity-30 rounded p-2">
        <div class="text-center">
          <div class="text-xs text-gray-300">HP</div>
          <div class="text-sm font-bold text-red-400">${hero.current_hp}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-300">ATK</div>
          <div class="text-sm font-bold text-orange-400">${hero.current_attack}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-300">DEF</div>
          <div class="text-sm font-bold text-blue-400">${hero.current_defense}</div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-300">SPD</div>
          <div class="text-sm font-bold text-green-400">${hero.current_speed}</div>
        </div>
      </div>
      
      <!-- Action Button -->
      <button onclick="event.stopPropagation(); levelUpHero(${hero.id})" 
              class="mt-3 w-full btn-game btn-success py-2 text-sm">
        <i class="fas fa-arrow-up"></i> Level Up
      </button>
    </div>
  `;
}

// =====================================================
// GACHA PULL ANIMATION
// =====================================================

export function animateGachaPull(results, callback) {
  const overlay = document.createElement('div');
  overlay.className = 'gacha-animation-overlay';
  overlay.innerHTML = `
    <div class="gacha-animation-container">
      <div class="gacha-pull-title">✨ SUMMONING ✨</div>
      <div class="gacha-cards-container" id="gachaCardsContainer"></div>
      <button onclick="this.parentElement.parentElement.remove()" 
              class="btn-game btn-primary mt-6 px-8 py-3">
        Continue
      </button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Trigger confetti for rare pulls
  const rareCount = results.filter(r => ['SSS', 'SS', 'S'].includes(r.rarity)).length;
  if (rareCount > 0) {
    triggerConfetti();
  }
  
  // Animate cards one by one
  const container = document.getElementById('gachaCardsContainer');
  results.forEach((hero, index) => {
    setTimeout(() => {
      const powerType = hero.powerType.toLowerCase();
      const effect = POWER_EFFECTS[powerType];
      
      const card = document.createElement('div');
      card.className = 'gacha-card-flip';
      card.innerHTML = `
        <div class="gacha-card-inner">
          <div class="gacha-card-front">
            <div class="text-6xl">❓</div>
          </div>
          <div class="gacha-card-back" style="background: ${effect.gradient};">
            <div class="text-5xl mb-2">${hero.avatar}</div>
            <div class="font-bold text-lg text-white">${hero.name}</div>
            <div class="text-sm text-white opacity-90">${hero.powerType}</div>
            <div class="rarity-badge-${hero.rarity.toLowerCase()} px-3 py-1 rounded-full font-bold mt-2">
              ${hero.rarity}
            </div>
            ${hero.isNew ? '<div class="text-yellow-300 text-xs mt-1">✨ NEW!</div>' : ''}
          </div>
        </div>
      `;
      
      container.appendChild(card);
      
      // Flip animation
      setTimeout(() => {
        card.classList.add('flipped');
        
        // Sound effect for rare
        if (['SSS', 'SS', 'S'].includes(hero.rarity)) {
          playRareSound();
        }
      }, 300);
      
    }, index * 200);
  });
  
  setTimeout(() => {
    if (callback) callback();
  }, results.length * 200 + 3000);
}

function triggerConfetti() {
  // Using tsparticles confetti
  if (window.confetti) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function playRareSound() {
  // Placeholder for sound effects
  console.log('🎵 Rare hero sound!');
}

// =====================================================
// ENHANCED GACHA BANNER CARD
// =====================================================

export function createEnhancedGachaBanner(banner) {
  const isNormal = banner.banner_type === 'basic';
  const gradient = isNormal 
    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    : 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)';
  
  return `
    <div class="gacha-banner-enhanced" style="background: ${gradient};">
      <div class="gacha-banner-header">
        <h3 class="text-2xl font-bold text-white mb-2">
          ${isNormal ? '⭐ Normal Summon' : '💎 Advanced Summon'}
        </h3>
        <p class="text-sm text-white opacity-90 mb-4">
          ${isNormal ? 'Basic heroes with good rates' : 'Higher rates for rare heroes!'}
        </p>
      </div>
      
      <div class="gacha-banner-rates grid grid-cols-3 gap-2 mb-4">
        <div class="rate-box">
          <div class="text-xs text-gray-200">SSS</div>
          <div class="text-lg font-bold text-yellow-300">${(banner.rate_sss / 100).toFixed(2)}%</div>
        </div>
        <div class="rate-box">
          <div class="text-xs text-gray-200">SS</div>
          <div class="text-lg font-bold text-purple-300">${(banner.rate_ss / 100).toFixed(2)}%</div>
        </div>
        <div class="rate-box">
          <div class="text-xs text-gray-200">S</div>
          <div class="text-lg font-bold text-blue-300">${(banner.rate_s / 100).toFixed(2)}%</div>
        </div>
      </div>
      
      <div class="gacha-banner-pity bg-black bg-opacity-30 rounded p-3 mb-4">
        <div class="text-xs text-gray-300 mb-1">Pity System</div>
        <div class="text-sm font-bold text-yellow-400">
          Guaranteed ${banner.guaranteed_rarity} in ${banner.pity_threshold} pulls
        </div>
      </div>
      
      <div class="flex gap-2">
        <button onclick="pullGacha(${banner.id}, 'single')" 
                class="flex-1 btn-game btn-primary py-3">
          <div class="text-lg font-bold">1x Pull</div>
          <div class="text-xs">💎 ${banner.cost_single}</div>
        </button>
        <button onclick="pullGacha(${banner.id}, 'multi')" 
                class="flex-1 btn-game btn-legendary py-3 pulse">
          <div class="text-lg font-bold">10x Pull</div>
          <div class="text-xs">💎 ${banner.cost_multi}</div>
        </button>
      </div>
    </div>
  `;
}

// =====================================================
// POKEMON-STYLE BATTLE SYSTEM
// =====================================================

export function createBattleArena(playerTeam, enemyTeam) {
  return `
    <div class="battle-arena-container">
      <!-- Battle Background -->
      <div class="battle-background">
        <canvas id="battleCanvas" width="800" height="600"></canvas>
      </div>
      
      <!-- Battle UI Overlay -->
      <div class="battle-ui-overlay">
        <!-- Enemy Side (Top) -->
        <div class="enemy-battle-zone">
          ${enemyTeam.map((enemy, idx) => `
            <div class="battle-sprite enemy-sprite" id="enemy-${idx}" 
                 style="left: ${100 + idx * 150}px; top: 100px;">
              <div class="sprite-emoji text-6xl">${enemy.avatar || '👹'}</div>
              <div class="sprite-healthbar">
                <div class="healthbar-fill" id="enemy-${idx}-hp" style="width: 100%; background: #ef4444;"></div>
              </div>
              <div class="sprite-name text-sm font-bold text-white">${enemy.name || 'Enemy'}</div>
              <div class="sprite-level text-xs text-gray-300">Lv.${enemy.level || 1}</div>
            </div>
          `).join('')}
        </div>
        
        <!-- Player Side (Bottom) -->
        <div class="player-battle-zone">
          ${playerTeam.map((hero, idx) => `
            <div class="battle-sprite player-sprite" id="hero-${idx}"
                 style="left: ${100 + idx * 150}px; bottom: 150px;">
              <div class="sprite-emoji text-6xl">${hero.avatar_url}</div>
              <div class="sprite-healthbar">
                <div class="healthbar-fill" id="hero-${idx}-hp" style="width: 100%; background: #22c55e;"></div>
              </div>
              <div class="sprite-name text-sm font-bold text-white">${hero.name}</div>
              <div class="sprite-level text-xs text-gray-300">Lv.${hero.current_level}</div>
            </div>
          `).join('')}
        </div>
        
        <!-- Battle Log -->
        <div class="battle-log" id="battleLog">
          <div class="text-sm text-white bg-black bg-opacity-70 p-3 rounded">
            ⚔️ Battle Start!
          </div>
        </div>
        
        <!-- Action Menu -->
        <div class="battle-action-menu" id="battleActionMenu">
          <button onclick="executeBattleTurn('attack')" class="btn-game btn-danger">
            ⚔️ Attack
          </button>
          <button onclick="executeBattleTurn('skill')" class="btn-game btn-primary">
            ⚡ Skill
          </button>
          <button onclick="executeBattleTurn('auto')" class="btn-game btn-success">
            🤖 Auto
          </button>
        </div>
      </div>
    </div>
  `;
}

export function animateBattleAttack(attackerId, targetId, powerType, damage) {
  const attacker = document.getElementById(attackerId);
  const target = document.getElementById(targetId);
  
  if (!attacker || !target) return;
  
  const effect = POWER_EFFECTS[powerType.toLowerCase()];
  
  // Attacker animation
  attacker.classList.add('battle-attack-anim');
  setTimeout(() => attacker.classList.remove('battle-attack-anim'), 300);
  
  // Create projectile
  const attackerRect = attacker.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  
  const projectile = document.createElement('div');
  projectile.className = 'battle-projectile';
  projectile.textContent = effect.emoji;
  projectile.style.cssText = `
    position: fixed;
    left: ${attackerRect.left + attackerRect.width/2}px;
    top: ${attackerRect.top + attackerRect.height/2}px;
    font-size: 40px;
    z-index: 10000;
    pointer-events: none;
    transition: all 0.5s ease-out;
  `;
  
  document.body.appendChild(projectile);
  
  // Animate projectile to target
  setTimeout(() => {
    projectile.style.left = `${targetRect.left + targetRect.width/2}px`;
    projectile.style.top = `${targetRect.top + targetRect.height/2}px`;
    projectile.style.opacity = '0';
  }, 50);
  
  // Impact effect
  setTimeout(() => {
    projectile.remove();
    target.classList.add('battle-hit-anim');
    
    // Damage number
    showDamageNumber(targetRect.left + targetRect.width/2, targetRect.top, damage);
    
    setTimeout(() => target.classList.remove('battle-hit-anim'), 300);
  }, 500);
}

function showDamageNumber(x, y, damage) {
  const dmg = document.createElement('div');
  dmg.className = 'damage-number';
  dmg.textContent = `-${damage}`;
  dmg.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    font-size: 32px;
    font-weight: bold;
    color: #fbbf24;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    z-index: 10001;
    pointer-events: none;
    animation: damageFloat 1s ease-out forwards;
  `;
  
  document.body.appendChild(dmg);
  setTimeout(() => dmg.remove(), 1000);
}

export function updateBattleHP(spriteId, currentHP, maxHP) {
  const hpBar = document.getElementById(`${spriteId}-hp`);
  if (hpBar) {
    const percent = Math.max(0, (currentHP / maxHP) * 100);
    hpBar.style.width = `${percent}%`;
    
    // Color based on HP
    if (percent > 50) hpBar.style.background = '#22c55e';
    else if (percent > 25) hpBar.style.background = '#fbbf24';
    else hpBar.style.background = '#ef4444';
  }
}

export function addBattleLog(message) {
  const log = document.getElementById('battleLog');
  if (log) {
    const entry = document.createElement('div');
    entry.className = 'text-sm text-white bg-black bg-opacity-70 p-2 rounded mb-1';
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }
}
