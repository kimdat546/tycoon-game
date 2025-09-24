# Core Systems Implementation Plan

## 1. Gacha System

### Core Components
```typescript
interface GachaPool {
  id: string;
  name: string;
  heroes: GachaHero[];
  guarantees: GachaGuarantee[];
  cost: number;
  currency: CurrencyType;
}

interface GachaHero {
  heroId: string;
  rarity: number;
  weight: number;
}

interface GachaGuarantee {
  pulls: number;
  minRarity: number;
}
```

### Implementation Steps
1. **Probability Engine**
   - Weighted random selection
   - Pity system for guaranteed rare pulls
   - Duplicate protection mechanics

2. **Summon Flow**
   - Resource validation
   - Animation sequence
   - Reward distribution
   - Collection updates

3. **UI Components**
   - Summon button with costs
   - Pull history
   - Rate display
   - Celebration animations

## 2. Hero Management System

### Hero Data Structure
```typescript
interface Hero {
  // Core Identity
  id: string;
  templateId: string;
  name: string;
  rarity: 1 | 2 | 3 | 4 | 5;
  
  // Stats
  level: number;
  experience: number;
  stats: {
    attack: number;
    defense: number;
    hp: number;
    speed: number;
    magic: number;
  };
  
  // Equipment & Skills
  equipment: Equipment[];
  skills: Skill[];
  
  // Progression
  ascension: number;
  bonds: Map<string, number>; // heroId -> bond level
  
  // Story & Personality
  storyProgress: StoryProgress;
  personality: PersonalityTraits;
  
  // Assignment
  facility?: string; // assigned facility ID
  team?: string;     // combat team ID
}
```

### Core Functions
1. **Stat Calculation**
   - Base stats from template
   - Level scaling formulas
   - Equipment bonuses
   - Bond bonuses
   - Ascension multipliers

2. **Progression System**
   - Experience gain from combat/training
   - Level up rewards
   - Ascension requirements
   - Skill unlocks

3. **Collection Management**
   - Sorting and filtering
   - Favorites system
   - Mass operations
   - Storage limits

## 3. Combat System

### Combat Flow
```typescript
enum CombatPhase {
  PREPARATION,
  BATTLE,
  VICTORY,
  DEFEAT
}

interface CombatState {
  phase: CombatPhase;
  turn: number;
  heroes: CombatUnit[];
  enemies: CombatUnit[];
  actionQueue: CombatAction[];
  battlefield: BattlefieldState;
}
```

### Turn-Based Mechanics
1. **Initiative System**
   - Speed-based turn order
   - Action priority handling
   - Interrupt mechanics

2. **Action Types**
   - Basic attacks
   - Skills with cooldowns
   - Items and consumables
   - Defensive actions

3. **Damage Calculation**
   - Elemental advantages
   - Critical hits
   - Status effects
   - Damage mitigation

### AI System
```typescript
interface EnemyAI {
  evaluateTargets(enemies: CombatUnit[]): CombatUnit;
  selectAction(availableActions: Action[]): Action;
  calculateThreat(hero: CombatUnit): number;
}
```

## 4. Idle/Automation System

### Resource Generation
```typescript
interface IdleCalculation {
  // Time tracking
  lastSaveTime: number;
  currentTime: number;
  offlineTime: number;
  
  // Generation rates
  baseRates: ResourceRates;
  facilityBonuses: FacilityBonus[];
  heroBonuses: HeroBonus[];
  
  // Caps and limits
  resourceCaps: ResourceCaps;
  maxOfflineHours: number;
}
```

### Facility System
1. **Facility Types**
   - Training Ground: Hero experience
   - Mine: Gold generation
   - Alchemy Lab: Mana production
   - Workshop: Equipment crafting
   - Library: Research points

2. **Hero Assignment**
   - Skill matching bonuses
   - Efficiency calculations
   - Automation preferences
   - Rest rotation system

3. **Upgrade Mechanics**
   - Resource costs
   - Time requirements
   - Unlock conditions
   - Capacity increases

## 5. Bond System

### Relationship Mechanics
```typescript
interface Bond {
  heroId1: string;
  heroId2: string;
  level: number;
  experience: number;
  type: BondType;
  conversations: Conversation[];
  bonuses: BondBonus[];
}

enum BondType {
  FRIENDSHIP,
  RIVALRY,
  MENTOR,
  ROMANCE,
  FAMILY
}
```

### Bond Activities
1. **Natural Progression**
   - Combat together
   - Facility work
   - Story events
   - Player choices

2. **Active Bonding**
   - Conversations
   - Gift giving
   - Training sessions
   - Quests together

3. **Bond Benefits**
   - Stat bonuses
   - Combo attacks
   - Special dialogues
   - Story unlocks

## 6. Tower/Dungeon System

### Floor Structure
```typescript
interface Floor {
  id: number;
  type: FloorType;
  difficulty: number;
  
  // Combat floors
  waves?: EnemyWave[];
  boss?: Boss;
  
  // Special floors
  facility?: FacilityType;
  story?: StoryEvent;
  
  // Rewards
  rewards: Reward[];
  firstClearBonus: Reward[];
  
  // Requirements
  requiredPower: number;
  unlockConditions: Condition[];
}
```

### Progression Mechanics
1. **Floor Types**
   - Combat floors with waves
   - Boss floors
   - Story/dialogue floors
   - Rest/facility floors
   - Puzzle/challenge floors

2. **Difficulty Scaling**
   - Enemy stat progression
   - New mechanics introduction
   - Environmental hazards
   - Team size requirements

3. **Exploration Rewards**
   - Experience and gold
   - Equipment drops
   - Hero shards
   - Story progression

## 7. Save/Load System

### Save Data Structure
```typescript
interface SaveData {
  version: string;
  timestamp: number;
  
  // Player data
  player: PlayerProfile;
  resources: Resources;
  
  // Collections
  heroes: Hero[];
  equipment: Equipment[];
  items: Item[];
  
  // Progress
  tower: TowerProgress;
  story: StoryProgress;
  achievements: Achievement[];
  
  // Settings
  preferences: GamePreferences;
  
  // Checksums for validation
  checksum: string;
}
```

### Implementation Features
1. **Auto-Save**
   - Periodic saves during gameplay
   - Save on critical actions
   - Cloud backup integration

2. **Data Validation**
   - Checksum verification
   - Version migration
   - Corruption recovery

3. **Multiple Slots**
   - Manual save slots
   - Quick save/load
   - Export/import functionality

## 8. Event System

### Event Architecture
```typescript
interface GameEvent {
  type: string;
  data?: any;
  timestamp: number;
  source?: string;
}

class EventManager {
  private listeners: Map<string, EventListener[]>;
  
  emit(event: GameEvent): void;
  subscribe(eventType: string, listener: EventListener): void;
  unsubscribe(eventType: string, listener: EventListener): void;
}
```

### Event Types
1. **Combat Events**
   - Damage dealt/received
   - Skill usage
   - Status changes
   - Turn transitions

2. **Progression Events**
   - Level ups
   - New hero summoned
   - Floor cleared
   - Bond increases

3. **System Events**
   - Save completed
   - Resource gained
   - Achievement unlocked
   - Error occurred

## Performance Optimization

### Memory Management
1. **Object Pooling**
   - Combat effects
   - UI elements
   - Temporary calculations

2. **Lazy Loading**
   - Hero data on demand
   - Asset loading
   - Story content

3. **Garbage Collection**
   - Minimize allocations
   - Reuse objects
   - Clear references

### Update Optimization
1. **System Priority**
   - Critical systems first
   - Frame time budgeting
   - Async operations

2. **Batching**
   - UI updates
   - Save operations
   - Network requests

This implementation plan provides a solid foundation for building your gacha RPG with PixiJS while maintaining good performance and extensibility.