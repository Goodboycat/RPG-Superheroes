// =====================================================
// POKEMON-STYLE BATTLE SYSTEM
// =====================================================

import * as EnhancedUI from './enhanced-ui.js';

let currentBattle = null;
let battleInterval = null;

export async function startDungeonBattle(dungeonId, playerHeroes, dungeonData) {
  // Create battle state
  currentBattle = {
    dungeonId,
    playerTeam: playerHeroes.map(h => ({
      ...h,
      currentHP: h.current_hp,
      maxHP: h.current_hp,
      isAlive: true
    })),
    enemyTeam: dungeonData.enemies.map((e, idx) => ({
      ...e,
      id: `enemy_${idx}`,
      currentHP: e.hp || 100,
      maxHP: e.hp || 100,
      isAlive: true
    })),
    turn: 0,
    isPlayerTurn: true,
    autoMode: false,
    battleLog: []
  };
  
  // Show battle arena
  showBattleArena();
  
  return currentBattle;
}

function showBattleArena() {
  const arena = document.createElement('div');
  arena.id = 'battleArena';
  arena.innerHTML = EnhancedUI.createBattleArena(
    currentBattle.playerTeam,
    currentBattle.enemyTeam
  );
  
  document.body.appendChild(arena);
  
  // Draw battle background
  drawBattleBackground();
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'absolute top-4 right-4 btn-game btn-danger z-50';
  closeBtn.textContent = '✕ Exit';
  closeBtn.onclick = () => {
    endBattle();
    arena.remove();
  };
  arena.appendChild(closeBtn);
  
  // Log battle start
  EnhancedUI.addBattleLog('⚔️ Battle begins!');
}

function drawBattleBackground() {
  const canvas = document.getElementById('battleCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, '#87ceeb');
  gradient.addColorStop(1, '#e0f6ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 400);
  
  // Ground
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, 400, 800, 200);
  
  // Ground detail
  ctx.fillStyle = '#a0826d';
  for (let i = 0; i < 800; i += 50) {
    ctx.fillRect(i, 400, 40, 10);
    ctx.fillRect(i + 10, 410, 30, 10);
  }
  
  // Player platform
  ctx.fillStyle = '#6b5d4f';
  ctx.beginPath();
  ctx.ellipse(200, 500, 120, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Enemy platform
  ctx.fillStyle = '#6b5d4f';
  ctx.beginPath();
  ctx.ellipse(600, 300, 120, 20, 0, 0, Math.PI * 2);
  ctx.fill();
}

window.executeBattleTurn = async function(actionType) {
  if (!currentBattle || !currentBattle.isPlayerTurn) return;
  
  if (actionType === 'auto') {
    currentBattle.autoMode = !currentBattle.autoMode;
    if (currentBattle.autoMode) {
      startAutoBattle();
    } else {
      stopAutoBattle();
    }
    return;
  }
  
  await performPlayerTurn(actionType);
  
  if (checkBattleEnd()) return;
  
  // Enemy turn
  currentBattle.isPlayerTurn = false;
  setTimeout(async () => {
    await performEnemyTurn();
    currentBattle.isPlayerTurn = true;
    
    if (checkBattleEnd()) return;
    
    if (currentBattle.autoMode) {
      setTimeout(() => executeBattleTurn('attack'), 1000);
    }
  }, 1500);
}

async function performPlayerTurn(actionType) {
  currentBattle.turn++;
  
  // Select attacker (first alive hero)
  const attacker = currentBattle.playerTeam.find(h => h.isAlive);
  if (!attacker) return;
  
  // Select target (random alive enemy)
  const aliveEnemies = currentBattle.enemyTeam.filter(e => e.isAlive);
  if (aliveEnemies.length === 0) return;
  
  const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  
  // Calculate damage
  const baseDamage = attacker.current_attack || 50;
  const skillMultiplier = actionType === 'skill' ? 1.5 : 1.0;
  const damage = Math.floor(baseDamage * skillMultiplier * (0.9 + Math.random() * 0.2));
  
  // Apply damage
  target.currentHP = Math.max(0, target.currentHP - damage);
  if (target.currentHP === 0) target.isAlive = false;
  
  // Get sprite IDs
  const attackerId = `hero-${currentBattle.playerTeam.indexOf(attacker)}`;
  const targetId = `enemy-${currentBattle.enemyTeam.indexOf(target)}`;
  
  // Animate attack
  EnhancedUI.animateBattleAttack(
    attackerId,
    targetId,
    attacker.power_type,
    damage
  );
  
  // Update HP
  EnhancedUI.updateBattleHP(targetId, target.currentHP, target.maxHP);
  
  // Log
  const actionName = actionType === 'skill' ? attacker.skill_1_name || 'Skill' : 'Attack';
  EnhancedUI.addBattleLog(`${attacker.name} used ${actionName}! Dealt ${damage} damage!`);
  
  if (!target.isAlive) {
    EnhancedUI.addBattleLog(`${target.name || 'Enemy'} fainted!`);
    setTimeout(() => {
      document.getElementById(targetId)?.classList.add('opacity-30');
    }, 600);
  }
}

async function performEnemyTurn() {
  // Select attacker (random alive enemy)
  const aliveEnemies = currentBattle.enemyTeam.filter(e => e.isAlive);
  if (aliveEnemies.length === 0) return;
  
  const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  
  // Select target (random alive hero)
  const aliveHeroes = currentBattle.playerTeam.filter(h => h.isAlive);
  if (aliveHeroes.length === 0) return;
  
  const target = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
  
  // Calculate damage
  const baseDamage = attacker.attack || 40;
  const damage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
  
  // Apply damage
  target.currentHP = Math.max(0, target.currentHP - damage);
  if (target.currentHP === 0) target.isAlive = false;
  
  // Get sprite IDs
  const attackerId = `enemy-${currentBattle.enemyTeam.indexOf(attacker)}`;
  const targetId = `hero-${currentBattle.playerTeam.indexOf(target)}`;
  
  // Animate attack
  EnhancedUI.animateBattleAttack(
    attackerId,
    targetId,
    attacker.power_type || 'fire',
    damage
  );
  
  // Update HP
  EnhancedUI.updateBattleHP(targetId, target.currentHP, target.maxHP);
  
  // Log
  EnhancedUI.addBattleLog(`${attacker.name || 'Enemy'} attacked! Dealt ${damage} damage!`);
  
  if (!target.isAlive) {
    EnhancedUI.addBattleLog(`${target.name} fainted!`);
    setTimeout(() => {
      document.getElementById(targetId)?.classList.add('opacity-30');
    }, 600);
  }
}

function checkBattleEnd() {
  const playerAlive = currentBattle.playerTeam.some(h => h.isAlive);
  const enemyAlive = currentBattle.enemyTeam.some(e => e.isAlive);
  
  if (!playerAlive) {
    EnhancedUI.addBattleLog('💀 Defeat... Your team was defeated!');
    setTimeout(() => {
      alert('Defeat! Your team was defeated.');
      endBattle();
      document.getElementById('battleArena')?.remove();
    }, 2000);
    return true;
  }
  
  if (!enemyAlive) {
    EnhancedUI.addBattleLog('🎉 VICTORY! All enemies defeated!');
    setTimeout(async () => {
      alert('Victory! You won the battle!');
      await handleBattleVictory();
      endBattle();
      document.getElementById('battleArena')?.remove();
    }, 2000);
    return true;
  }
  
  return false;
}

async function handleBattleVictory() {
  // Call backend to record victory and get rewards
  try {
    const response = await fetch('/api/dungeons/battle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        dungeonId: currentBattle.dungeonId,
        teamHeroIds: currentBattle.playerTeam.map(h => h.id)
      })
    });
    
    const data = await response.json();
    if (data.rewards) {
      const rewardsText = data.rewards.map(r => `${r.amount}x ${r.type}`).join(', ');
      alert(`Rewards: ${rewardsText}`);
    }
  } catch (error) {
    console.error('Failed to record victory:', error);
  }
}

function startAutoBattle() {
  EnhancedUI.addBattleLog('🤖 Auto-battle enabled');
  if (!currentBattle.isPlayerTurn) return;
  executeBattleTurn('attack');
}

function stopAutoBattle() {
  EnhancedUI.addBattleLog('⏸️ Auto-battle disabled');
}

function endBattle() {
  currentBattle = null;
  if (battleInterval) {
    clearInterval(battleInterval);
    battleInterval = null;
  }
}

// Export for use in app.js
export { currentBattle };
