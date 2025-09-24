# Project Structure & Architecture

## Folder Structure
```
eternal-tower/
├── public/                 # Static assets
│   ├── images/            # Game sprites and UI
│   ├── sounds/            # Audio files
│   └── data/              # JSON configuration files
├── src/
│   ├── main.ts            # Entry point
│   ├── core/              # Core game systems
│   │   ├── Application.ts # Main game application
│   │   ├── SceneManager.ts# Scene management
│   │   ├── AssetManager.ts# Asset loading
│   │   ├── SaveManager.ts # Save/load system
│   │   └── EventBus.ts    # Event communication
│   ├── entities/          # Game entities
│   │   ├── Hero.ts        # Hero entity
│   │   ├── Enemy.ts       # Enemy entity
│   │   ├── Facility.ts    # Building entity
│   │   └── Item.ts        # Equipment/items
│   ├── systems/           # Game systems
│   │   ├── GachaSystem.ts # Summoning logic
│   │   ├── CombatSystem.ts# Battle mechanics
│   │   ├── IdleSystem.ts  # Offline progress
│   │   ├── BondSystem.ts  # Hero relationships
│   │   └── ProgressionSystem.ts
│   ├── ui/                # User interface
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # Game screens
│   │   ├── modals/        # Popup windows
│   │   └── styles/        # UI styling
│   ├── data/              # Game data
│   │   ├── heroes/        # Hero configurations
│   │   ├── enemies/       # Enemy data
│   │   ├── facilities/    # Building data
│   │   └── stories/       # Dialogue and stories
│   ├── utils/             # Utility functions
│   │   ├── math.ts        # Math helpers
│   │   ├── random.ts      # RNG utilities
│   │   └── constants.ts   # Game constants
│   └── scenes/            # Game scenes
│       ├── MenuScene.ts   # Main menu
│       ├── SummonScene.ts # Gacha screen
│       ├── TowerScene.ts  # Tower management
│       ├── CombatScene.ts # Battle screen
│       └── HeroScene.ts   # Hero management
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Core Architecture Components

### 1. Application Layer
- **Application.ts**: Main game loop, initialization
- **SceneManager.ts**: Handle scene transitions
- **AssetManager.ts**: Load and cache game assets
- **SaveManager.ts**: Persistent game state

### 2. Entity-Component System
```typescript
// Base Entity
class Entity {
  id: string;
  components: Map<string, Component>;
}

// Example Components
class StatsComponent implements Component {
  level: number;
  attack: number;
  defense: number;
  hp: number;
}

class VisualComponent implements Component {
  sprite: PIXI.Sprite;
  animations: Map<string, PIXI.AnimatedSprite>;
}
```

### 3. Game Systems
- **GachaSystem**: Hero summoning, probability calculations
- **CombatSystem**: Turn-based combat logic
- **IdleSystem**: Offline progress calculation
- **BondSystem**: Hero relationship mechanics

### 4. State Management
```typescript
interface GameState {
  player: PlayerData;
  heroes: Hero[];
  tower: TowerData;
  resources: Resources;
  progress: ProgressData;
}
```

## Key Design Patterns

### 1. Scene Management
```typescript
abstract class Scene extends PIXI.Container {
  abstract init(): void;
  abstract update(deltaTime: number): void;
  abstract cleanup(): void;
}
```

### 2. Component System
```typescript
interface Component {
  type: string;
  update?(deltaTime: number): void;
}

class ComponentManager {
  private components = new Map<string, Component[]>();
  
  addComponent(entityId: string, component: Component): void;
  getComponents<T>(entityId: string, type: string): T[];
}
```

### 3. Event System
```typescript
class EventBus {
  private listeners = new Map<string, Function[]>();
  
  emit(event: string, data?: any): void;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}
```

## Data Models

### Hero Model
```typescript
interface Hero {
  id: string;
  name: string;
  rarity: 1 | 2 | 3 | 4 | 5;
  type: HeroType;
  level: number;
  stats: HeroStats;
  bonds: Bond[];
  equipment: Equipment[];
  skills: Skill[];
  story: StoryProgress;
}
```

### Tower Model
```typescript
interface Tower {
  floors: Floor[];
  currentFloor: number;
  facilities: Facility[];
  resources: Resources;
}

interface Floor {
  id: number;
  type: FloorType;
  enemies: Enemy[];
  rewards: Reward[];
  isCleared: boolean;
}
```

### Combat Model
```typescript
interface Combat {
  heroes: CombatHero[];
  enemies: CombatEnemy[];
  turn: number;
  phase: CombatPhase;
  actions: CombatAction[];
}
```

## Performance Considerations

### Memory Management
- Object pooling for frequently created/destroyed objects
- Sprite batching for similar visual elements
- Texture atlasing for efficient GPU usage

### Rendering Optimization
- Frustum culling for off-screen objects
- Level-of-detail for distant sprites
- Efficient container hierarchy

### Data Optimization
- Lazy loading for hero data
- Compressed save files
- Efficient delta updates

## Development Workflow

### 1. Feature Development
1. Define data models
2. Implement core logic
3. Create UI components
4. Add visual assets
5. Test and balance

### 2. Testing Strategy
- Unit tests for game logic
- Integration tests for systems
- Playtesting for balance
- Performance profiling

### 3. Asset Pipeline
- Sprite sheet generation
- Audio compression
- Data validation
- Asset optimization

## Scalability Planning

### Code Organization
- Modular system design
- Clear separation of concerns
- Consistent naming conventions
- Documentation standards

### Content Expansion
- Data-driven hero creation
- Modular story system
- Configurable game balance
- Plugin-like feature system