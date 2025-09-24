# Eternal Tower: Infinity Gacha Chronicles - PixiJS Development Plan

## Game Analysis
- **Genre**: Idle RPG / Gacha Hero Collection / Town & Dungeon Management
- **Core Loop**: Summon → Train Heroes → Build Tower → Explore Dungeons → Progress
- **Key Features**: Hero collection, bond system, automation, floor progression, narrative choices

## Phase 1: Foundation & Core Systems (Weeks 1-4)

### 1.1 Project Setup
- [ ] Initialize PixiJS project with TypeScript
- [ ] Set up build system (Vite/Webpack)
- [ ] Configure ESLint, Prettier
- [ ] Create basic folder structure
- [ ] Set up hot reload development server

### 1.2 Core Architecture
- [ ] Game state management system
- [ ] Scene manager for different game screens
- [ ] Resource loader for assets
- [ ] Save/Load system (localStorage initially)
- [ ] Event system for game communication

### 1.3 Basic UI Framework
- [ ] UI container system
- [ ] Button components
- [ ] Modal/popup system
- [ ] Text rendering system
- [ ] Basic responsive layout

## Phase 2: Hero System Foundation (Weeks 5-8)

### 2.1 Hero Data Model
- [ ] Hero class definition (stats, rarity, type, bonds)
- [ ] Hero database/registry system
- [ ] Stat calculation system
- [ ] Level progression formulas

### 2.2 Gacha System
- [ ] Summon pool configuration
- [ ] Rarity probability system
- [ ] Summon animation sequence
- [ ] Duplicate hero handling
- [ ] Basic summon UI

### 2.3 Hero Management
- [ ] Hero roster/collection screen
- [ ] Hero detail view
- [ ] Basic hero sorting/filtering
- [ ] Hero equipment slots (basic)

## Phase 3: Resource & Idle Systems (Weeks 9-12)

### 3.1 Resource Management
- [ ] Currency system (gold, mana, materials)
- [ ] Resource generation calculations
- [ ] Offline progress calculation
- [ ] Resource storage limits

### 3.2 Basic Idle Mechanics
- [ ] Time tracking system
- [ ] Idle reward calculation
- [ ] Offline progress popup
- [ ] Basic automation logic

### 3.3 Tower Building Foundation
- [ ] Floor/room data structure
- [ ] Facility types definition
- [ ] Upgrade system framework
- [ ] Assignment system (heroes to facilities)

## Phase 4: Combat System (Weeks 13-16)

### 4.1 Combat Mechanics
- [ ] Turn-based combat engine
- [ ] Skill system framework
- [ ] Damage calculation
- [ ] Status effects system
- [ ] Team formation logic

### 4.2 Dungeon Structure
- [ ] Floor progression system
- [ ] Enemy data and AI
- [ ] Wave-based encounters
- [ ] Boss mechanics framework
- [ ] Loot drop system

### 4.3 Combat UI
- [ ] Battle screen layout
- [ ] Hero positioning
- [ ] Skill button interface
- [ ] Combat animations (basic)
- [ ] Auto-battle toggle

## Phase 5: Advanced Features (Weeks 17-20)

### 5.1 Bond System
- [ ] Relationship tracking
- [ ] Bond level progression
- [ ] Conversation system
- [ ] Bond rewards/bonuses
- [ ] Hero interaction events

### 5.2 Story & Dialogue
- [ ] Dialogue engine
- [ ] Choice/branching system
- [ ] Character story arcs
- [ ] Main story progression
- [ ] Cutscene system

### 5.3 Advanced Tower Building
- [ ] Facility upgrade trees
- [ ] Production chains
- [ ] Hero assignment optimization
- [ ] Tower visualization
- [ ] Layout customization

## Phase 6: Polish & Meta Systems (Weeks 21-24)

### 6.1 Progression Systems
- [ ] Ascension mechanics
- [ ] Prestige system
- [ ] Achievement system
- [ ] Collection tracking
- [ ] Leaderboards (local)

### 6.2 UI/UX Polish
- [ ] Improved animations
- [ ] Sound effects integration
- [ ] Visual feedback systems
- [ ] Loading screens
- [ ] Tutorial system

### 6.3 Content Expansion
- [ ] More hero types/rarities
- [ ] Additional floors/enemies
- [ ] Seasonal events framework
- [ ] Daily quests system
- [ ] Settings menu

## Technical Stack

### Core Technologies
- **PixiJS 7.x**: Main rendering engine
- **TypeScript**: Type safety and better development
- **Vite**: Fast build tool and dev server
- **Zustand**: Lightweight state management
- **Howler.js**: Audio management

### Architecture Patterns
- **ECS (Entity-Component-System)**: For heroes and game objects
- **State Machines**: For game flow and UI states
- **Observer Pattern**: For event handling
- **Command Pattern**: For user actions and undo/redo

### File Structure
```
src/
├── core/           # Core game systems
├── entities/       # Game entities (Hero, Enemy, etc.)
├── systems/        # Game systems (Combat, Gacha, etc.)
├── ui/            # UI components and screens
├── data/          # Game data and configurations
├── assets/        # Asset loading and management
├── utils/         # Utility functions
└── scenes/        # Game scenes/screens
```

## Development Priorities

### Must-Have (MVP)
1. Hero summoning and collection
2. Basic combat system
3. Simple tower building
4. Idle resource generation
5. Save/load functionality

### Should-Have
1. Bond system
2. Story elements
3. Advanced combat mechanics
4. Facility upgrades
5. Achievement system

### Could-Have
1. Online features
2. Advanced animations
3. Voice acting
4. Complex story branching
5. PvP elements

## Estimated Timeline: 6 months
- **Months 1-2**: Foundation and core systems
- **Months 3-4**: Hero and combat systems
- **Months 5-6**: Polish and advanced features

## Success Metrics
- Hero collection engagement (summoning frequency)
- Session length (idle game retention)
- Progression satisfaction (tower climbing)
- Story engagement (dialogue completion rates)
- Monetization potential (if applicable)

## Risk Mitigation
- **Scope Creep**: Stick to MVP first, add features iteratively
- **Performance**: Profile early, optimize PixiJS usage
- **Save Data**: Implement robust save system early
- **Balance**: Playtesting throughout development
- **Art Assets**: Use placeholder art, improve gradually