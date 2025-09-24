# Eternal Tower: Infinity Gacha Chronicles

A gacha-based hero collection RPG built with PixiJS and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
Opens the game at http://localhost:3000

### Building
```bash
npm run build
```

### Code Quality
```bash
npm run lint        # Check code quality
npm run format      # Format code
```

## 🏗️ Project Structure

```
src/
├── core/           # Core game systems
│   ├── Application.ts     # Main game application
│   ├── SceneManager.ts    # Scene management
│   ├── EventBus.ts       # Event system
│   ├── AssetManager.ts   # Asset loading
│   └── SaveManager.ts    # Save/load system
├── entities/       # Game entities (heroes, enemies)
├── systems/        # Game systems (gacha, combat, etc.)
├── ui/            # User interface components
│   ├── components/       # Reusable UI components
│   ├── screens/         # Game screens
│   └── modals/          # Popup windows
├── scenes/        # Game scenes
│   └── MenuScene.ts     # Main menu
├── data/          # Game data configurations
└── utils/         # Utility functions
```

## 🎮 Current Features

### ✅ Implemented
- **Core Foundation**
  - PixiJS application setup with TypeScript
  - Scene management system
  - Event system for communication
  - Save/load system with localStorage
  - Hot reload development server

- **Hero System**
  - Complete hero data model (10 unique heroes across all rarities)
  - Gacha summoning system with realistic rates
  - Pity system (guaranteed legendary after 100 pulls)
  - Hero collection management with filtering
  - Statistics tracking and display

- **User Interface**
  - Main menu with navigation
  - Hero summoning scene with visual effects
  - Hero collection browser with rarity filtering
  - Resource display and management
  - Interactive hero cards with hover effects

- **Game Mechanics**
  - Resource system (Gold, Gems, Mana, Materials)
  - Hero stats calculation and growth
  - Rarity-based visual theming
  - Real-time collection statistics

- **Combat System**
  - Turn-based tactical combat
  - Hero vs enemy battles with visual feedback
  - Status effects and damage calculation
  - AI opponent behavior
  - Victory/defeat conditions with rewards

- **Tower Exploration**
  - Floor-based progression system
  - Dynamic enemy generation
  - Boss encounters every 5 floors
  - Combat integration from tower exploration

- **Save/Load System**
  - Comprehensive game state management
  - Auto-save functionality
  - Player progress tracking
  - Hero collection persistence

### 🚧 In Development
- Hero team formation and management
- Equipment and item system
- Advanced combat abilities and skills
- Story progression and dialogue system

## 🔧 Technical Stack

- **Engine**: PixiJS 8.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 7.x
- **Code Quality**: ESLint + Prettier
- **Architecture**: Entity-Component-System

## 📋 Development Roadmap

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed development phases and [CORE_SYSTEMS.md](./CORE_SYSTEMS.md) for system implementation details.

## 🛡️ Safety

This project includes safety rules for dangerous commands. See [CLAUDE_SAFETY_RULES.md](./CLAUDE_SAFETY_RULES.md) for guidelines.

## 🎯 Game Concept

"Eternal Tower" is an idle RPG where players summon and manage heroes to climb an infinite tower. Features include:

- **Gacha System**: Collect heroes with different rarities
- **Bond System**: Heroes form relationships affecting gameplay
- **Tower Climbing**: Progress through increasingly difficult floors
- **Idle Mechanics**: Offline progress and automation
- **Story Elements**: Rich narrative with player choices

See [OVERVIEW.md](./OVERVIEW.md) for the complete game concept.