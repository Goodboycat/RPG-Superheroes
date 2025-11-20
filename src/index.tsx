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
            <!-- Welcome Screen -->
            <div id="welcomeScreen" class="text-center py-10 md:py-20 px-4">
                <div class="float-animation">
                    <h2 class="text-4xl md:text-6xl font-bold mb-6 game-font text-shadow-game">⚡ RPG SUPERHEROES ⚡</h2>
                    <p class="text-lg md:text-2xl mb-8">Collect Heroes • Build Teams • Conquer Dungeons</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mt-12">
                    <div class="bg-white bg-opacity-10 p-4 md:p-6 rounded-lg backdrop-blur-sm border-2 border-purple-500 shadow-pixel">
                        <div class="text-4xl md:text-5xl mb-4">🔥</div>
                        <h3 class="text-lg md:text-xl font-bold mb-2">12 Power Types</h3>
                        <p class="text-xs md:text-sm opacity-80">Fire, Water, Earth & More!</p>
                    </div>
                    <div class="bg-white bg-opacity-10 p-4 md:p-6 rounded-lg backdrop-blur-sm border-2 border-purple-500 shadow-pixel">
                        <div class="text-4xl md:text-5xl mb-4">🎲</div>
                        <h3 class="text-lg md:text-xl font-bold mb-2">Gacha System</h3>
                        <p class="text-xs md:text-sm opacity-80">Pity system & guaranteed SSS!</p>
                    </div>
                    <div class="bg-white bg-opacity-10 p-4 md:p-6 rounded-lg backdrop-blur-sm border-2 border-purple-500 shadow-pixel">
                        <div class="text-4xl md:text-5xl mb-4">⚔️</div>
                        <h3 class="text-lg md:text-xl font-bold mb-2">Epic Battles</h3>
                        <p class="text-xs md:text-sm opacity-80">Dungeons, Bosses & Arena!</p>
                    </div>
                </div>
            </div>

            <!-- Game Dashboard -->
            <div id="gameDashboard" class="hidden container mx-auto p-3 md:p-6">
                <!-- Menu Tabs -->
                <div class="flex overflow-x-auto gap-2 mb-6 pb-2" style="-webkit-overflow-scrolling: touch;">
                    <button onclick="showTab('heroes')" class="tab-btn btn-game btn-primary text-xs md:text-sm whitespace-nowrap px-4 py-3">
                        <i class="fas fa-users"></i> Heroes
                    </button>
                    <button onclick="showTab('gacha')" class="tab-btn btn-game btn-legendary text-xs md:text-sm whitespace-nowrap px-4 py-3 pulse">
                        <i class="fas fa-dice"></i> Gacha
                    </button>
                    <button onclick="showTab('dungeons')" class="tab-btn btn-game btn-danger text-xs md:text-sm whitespace-nowrap px-4 py-3">
                        <i class="fas fa-dungeon"></i> Dungeons
                    </button>
                    <button onclick="showTab('team')" class="tab-btn btn-game btn-success text-xs md:text-sm whitespace-nowrap px-4 py-3">
                        <i class="fas fa-users-cog"></i> Team AI
                    </button>
                    <button onclick="showTab('inventory')" class="tab-btn btn-game btn-warning text-xs md:text-sm whitespace-nowrap px-4 py-3">
                        <i class="fas fa-backpack"></i> Items
                    </button>
                </div>

                <!-- Tab Contents -->
                <div id="heroesTab" class="tab-content hidden"></div>
                <div id="gachaTab" class="tab-content hidden"></div>
                <div id="dungeonsTab" class="tab-content hidden"></div>
                <div id="teamTab" class="tab-content hidden"></div>
                <div id="inventoryTab" class="tab-content hidden"></div>
            </div>
        </div>

        <!-- Auth Modal -->
        <div id="authModal" class="hidden modal-overlay">
            <div class="modal-content max-w-md w-full mx-4">
                <h3 id="modalTitle" class="text-2xl font-bold mb-4 game-font text-shadow-game">Login</h3>
                <div id="loginForm">
                    <input type="text" id="loginUsername" placeholder="Username" class="w-full p-3 mb-3 bg-gray-800 rounded border-2 border-purple-500">
                    <input type="password" id="loginPassword" placeholder="Password" class="w-full p-3 mb-4 bg-gray-800 rounded border-2 border-purple-500">
                    <button onclick="login()" class="w-full btn-game btn-primary py-3">Login</button>
                </div>
                <div id="registerForm" class="hidden">
                    <input type="text" id="regUsername" placeholder="Username" class="w-full p-3 mb-3 bg-gray-800 rounded border-2 border-purple-500">
                    <input type="email" id="regEmail" placeholder="Email" class="w-full p-3 mb-3 bg-gray-800 rounded border-2 border-purple-500">
                    <input type="password" id="regPassword" placeholder="Password" class="w-full p-3 mb-4 bg-gray-800 rounded border-2 border-purple-500">
                    <button onclick="register()" class="w-full btn-game btn-success py-3">Create Account</button>
                </div>
                <button onclick="closeModal()" class="mt-4 text-sm text-gray-400 hover:text-white">Cancel</button>
            </div>
        </div>

        <script type="module" src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
