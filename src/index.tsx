import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// Import modular routes
import auth from './routes/auth'
import player from './routes/player'
import heroes from './routes/heroes'
import gacha from './routes/gacha'
import dungeons from './routes/dungeons'
import team from './routes/team'
import exploration from './routes/exploration'

// Types for Cloudflare bindings
type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Mount API routes
app.route('/api/auth', auth)
app.route('/api/player', player)
app.route('/api/heroes', heroes)
app.route('/api/gacha', gacha)
app.route('/api/dungeons', dungeons)
app.route('/api/team', team)
app.route('/api/exploration', exploration)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

// =====================================================
// FRONTEND - MAIN PAGE
// =====================================================

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>RPG Superheroes - Epic Essence Powers</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/css/game-ui.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/tsparticles-confetti@2.12.0/tsparticles.confetti.bundle.min.js"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
        
        <style>
          body {
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            overflow-x: hidden;
          }
          
          /* Pixelated background pattern */
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px),
              repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px);
            pointer-events: none;
            z-index: 0;
          }
          
          #app-content {
            position: relative;
            z-index: 1;
          }
        </style>
    </head>
    <body class="text-white">
        <!-- Navigation -->
        <nav class="bg-game-darker backdrop-blur-md p-4 sticky top-0 z-50 border-b-4 border-purple-600 shadow-pixel">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <h1 class="text-xl md:text-2xl font-bold game-font text-shadow-game">⚡ RPG HEROES</h1>
                    <div id="playerInfo" class="hidden flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                        <span class="bg-black bg-opacity-50 px-2 py-1 rounded border border-purple-500">
                            <i class="fas fa-user"></i> <span id="playerName">Player</span>
                        </span>
                        <span class="bg-black bg-opacity-50 px-2 py-1 rounded border border-yellow-500">
                            <i class="fas fa-level-up-alt"></i> <span id="playerLevel">1</span>
                        </span>
                        <span class="bg-black bg-opacity-50 px-2 py-1 rounded border border-yellow-600">
                            💰 <span id="playerGold">0</span>
                        </span>
                        <span class="bg-black bg-opacity-50 px-2 py-1 rounded border border-blue-400">
                            💎 <span id="playerDiamonds">0</span>
                        </span>
                        <span class="bg-black bg-opacity-50 px-2 py-1 rounded border border-green-400">
                            ⚡ <span id="playerEnergy">0</span>
                        </span>
                    </div>
                </div>
                <div id="authButtons" class="flex gap-2">
                    <button onclick="showLogin()" class="btn-game btn-primary text-xs md:text-sm px-3 py-2">Login</button>
                    <button onclick="showRegister()" class="btn-game btn-success text-xs md:text-sm px-3 py-2">Register</button>
                </div>
                <button id="logoutButton" onclick="logout()" class="hidden btn-game btn-danger text-xs md:text-sm px-3 py-2">Logout</button>
            </div>
        </nav>

        <div id="app-content">
            <!-- Enhanced Welcome Screen -->
            <div id="welcomeScreen" class="min-h-screen flex items-center justify-center px-4 py-10">
                <div class="max-w-6xl w-full">
                    <!-- Hero Title -->
                    <div class="text-center mb-12 float-animation">
                        <h1 class="text-4xl md:text-6xl font-bold mb-4 game-font text-shadow-game" style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">⚡ RPG SUPERHEROES ⚡</h1>
                        <p class="text-xl md:text-2xl mb-2 text-purple-300">Epic Browser RPG Experience</p>
                        <p class="text-base md:text-lg text-gray-400">Collect • Battle • Explore • Dominate</p>
                    </div>
                    
                    <!-- Feature Showcase Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div class="feature-card bg-gradient-to-br from-red-600 to-orange-500">
                            <div class="text-6xl mb-4">🔥</div>
                            <h3 class="text-2xl font-bold mb-2">12 Power Types</h3>
                            <p class="text-sm opacity-90">Fire, Water, Earth, Light, Dark & More!</p>
                        </div>
                        <div class="feature-card bg-gradient-to-br from-purple-600 to-pink-500">
                            <div class="text-6xl mb-4">🎴</div>
                            <h3 class="text-2xl font-bold mb-2">Gacha System</h3>
                            <p class="text-sm opacity-90">Collect rare heroes with pity system!</p>
                        </div>
                        <div class="feature-card bg-gradient-to-br from-blue-600 to-cyan-500">
                            <div class="text-6xl mb-4">⚔️</div>
                            <h3 class="text-2xl font-bold mb-2">Pokemon Battles</h3>
                            <p class="text-sm opacity-90">Turn-based combat with visual effects!</p>
                        </div>
                    </div>
                    
                    <!-- Quick Start Actions -->
                    <div class="text-center">
                        <h3 class="text-2xl font-bold mb-6 text-purple-300">🎮 Start Your Adventure</h3>
                        <div class="flex flex-col md:flex-row gap-4 justify-center items-center">
                            <button onclick="showLogin()" class="btn-game btn-primary text-lg px-8 py-4 min-w-[200px]">
                                <i class="fas fa-sign-in-alt"></i> Login
                            </button>
                            <button onclick="showRegister()" class="btn-game btn-legendary text-lg px-8 py-4 min-w-[200px] pulse">
                                <i class="fas fa-user-plus"></i> Create Account
                            </button>
                        </div>
                        <div class="mt-4">
                            <button onclick="showGoogleLogin()" class="btn-game bg-white text-gray-800 hover:bg-gray-100 px-6 py-3">
                                <i class="fab fa-google"></i> Continue with Google
                            </button>
                        </div>
                    </div>
                    
                    <!-- Stats Bar -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                        <div class="stat-box">
                            <div class="text-3xl font-bold text-yellow-400">15+</div>
                            <div class="text-sm text-gray-400">Unique Heroes</div>
                        </div>
                        <div class="stat-box">
                            <div class="text-3xl font-bold text-purple-400">12</div>
                            <div class="text-sm text-gray-400">Power Types</div>
                        </div>
                        <div class="stat-box">
                            <div class="text-3xl font-bold text-red-400">6</div>
                            <div class="text-sm text-gray-400">Rarity Tiers</div>
                        </div>
                        <div class="stat-box">
                            <div class="text-3xl font-bold text-green-400">∞</div>
                            <div class="text-sm text-gray-400">Adventures</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Game Dashboard -->
            <div id="gameDashboard" class="hidden container mx-auto p-3 md:p-6" style="padding-bottom: 100px;">
                <!-- Tab Contents -->
                <div id="heroesTab" class="tab-content hidden"></div>
                <div id="gachaTab" class="tab-content hidden"></div>
                <div id="explorationTab" class="tab-content hidden"></div>
                <div id="dungeonsTab" class="tab-content hidden"></div>
                <div id="teamTab" class="tab-content hidden"></div>
                <div id="inventoryTab" class="tab-content hidden"></div>
            </div>

            <!-- Bottom Navigation Bar -->
            <nav id="bottomNav" class="hidden fixed bottom-0 left-0 right-0 bg-game-darker backdrop-blur-md border-t-4 border-purple-600 shadow-pixel z-50">
                <div class="flex justify-around items-center h-16 px-2">
                    <button onclick="showTab('heroes')" class="tab-btn flex flex-col items-center justify-center flex-1 py-2 px-1 hover:bg-purple-800 hover:bg-opacity-30 transition-all rounded">
                        <i class="fas fa-users text-lg mb-1"></i>
                        <span class="text-xs">Heroes</span>
                    </button>
                    <button onclick="showTab('gacha')" class="tab-btn flex flex-col items-center justify-center flex-1 py-2 px-1 hover:bg-yellow-600 hover:bg-opacity-30 transition-all rounded pulse">
                        <i class="fas fa-dice text-lg mb-1"></i>
                        <span class="text-xs">Gacha</span>
                    </button>
                    <button onclick="showTab('exploration')" class="tab-btn flex flex-col items-center justify-center flex-1 py-2 px-1 hover:bg-green-600 hover:bg-opacity-30 transition-all rounded">
                        <i class="fas fa-map-marked-alt text-lg mb-1"></i>
                        <span class="text-xs">Explore</span>
                    </button>
                    <button onclick="showTab('dungeons')" class="tab-btn flex flex-col items-center justify-center flex-1 py-2 px-1 hover:bg-red-600 hover:bg-opacity-30 transition-all rounded">
                        <i class="fas fa-dungeon text-lg mb-1"></i>
                        <span class="text-xs">Dungeons</span>
                    </button>
                    <button onclick="showTab('team')" class="tab-btn flex flex-col items-center justify-center flex-1 py-2 px-1 hover:bg-blue-600 hover:bg-opacity-30 transition-all rounded">
                        <i class="fas fa-users-cog text-lg mb-1"></i>
                        <span class="text-xs">Team</span>
                    </button>
                    <button onclick="showTab('inventory')" class="tab-btn flex flex-col items-center justify-center flex-1 py-2 px-1 hover:bg-orange-600 hover:bg-opacity-30 transition-all rounded">
                        <i class="fas fa-backpack text-lg mb-1"></i>
                        <span class="text-xs">Items</span>
                    </button>
                </div>
            </nav>
        </div>

        <!-- Enhanced Auth Modal -->
        <div id="authModal" class="hidden modal-overlay">
            <div class="modal-content max-w-md w-full mx-4 bg-gradient-to-br from-gray-900 to-purple-900 border-4 border-purple-500">
                <h3 id="modalTitle" class="text-3xl font-bold mb-6 game-font text-shadow-game text-center">Login</h3>
                
                <!-- Login Form -->
                <div id="loginForm">
                    <div class="mb-4">
                        <label class="block text-sm font-bold mb-2 text-purple-300">
                            <i class="fas fa-user"></i> Username
                        </label>
                        <input type="text" id="loginUsername" placeholder="Enter your username" 
                               class="w-full p-4 bg-gray-800 rounded-lg border-2 border-purple-500 focus:border-purple-400 focus:outline-none">
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-bold mb-2 text-purple-300">
                            <i class="fas fa-lock"></i> Password
                        </label>
                        <input type="password" id="loginPassword" placeholder="Enter your password" 
                               class="w-full p-4 bg-gray-800 rounded-lg border-2 border-purple-500 focus:border-purple-400 focus:outline-none">
                    </div>
                    <button onclick="login()" class="w-full btn-game btn-primary py-4 text-lg mb-4">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                    <div class="divider mb-4">OR</div>
                    <button onclick="loginWithGoogle()" class="w-full bg-white text-gray-800 hover:bg-gray-100 py-3 rounded-lg font-bold transition-all">
                        <i class="fab fa-google text-red-500"></i> Login with Gmail
                    </button>
                </div>
                
                <!-- Register Form -->
                <div id="registerForm" class="hidden">
                    <div class="mb-4">
                        <label class="block text-sm font-bold mb-2 text-purple-300">
                            <i class="fas fa-user"></i> Username
                        </label>
                        <input type="text" id="regUsername" placeholder="Choose a username" 
                               class="w-full p-4 bg-gray-800 rounded-lg border-2 border-purple-500 focus:border-purple-400 focus:outline-none">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-bold mb-2 text-purple-300">
                            <i class="fas fa-envelope"></i> Email
                        </label>
                        <input type="email" id="regEmail" placeholder="your.email@example.com" 
                               class="w-full p-4 bg-gray-800 rounded-lg border-2 border-purple-500 focus:border-purple-400 focus:outline-none">
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-bold mb-2 text-purple-300">
                            <i class="fas fa-lock"></i> Password
                        </label>
                        <input type="password" id="regPassword" placeholder="Create a strong password" 
                               class="w-full p-4 bg-gray-800 rounded-lg border-2 border-purple-500 focus:border-purple-400 focus:outline-none">
                    </div>
                    <button onclick="register()" class="w-full btn-game btn-success py-4 text-lg mb-4">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                    <div class="divider mb-4">OR</div>
                    <button onclick="registerWithGoogle()" class="w-full bg-white text-gray-800 hover:bg-gray-100 py-3 rounded-lg font-bold transition-all">
                        <i class="fab fa-google text-red-500"></i> Sign up with Gmail
                    </button>
                </div>
                
                <button onclick="closeModal()" class="mt-6 w-full text-center text-sm text-gray-400 hover:text-white py-2">
                    Cancel
                </button>
            </div>
        </div>

        <script type="module" src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
