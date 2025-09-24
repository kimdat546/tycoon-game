import { EventBus } from '../core/EventBus';
import { Hero } from '../entities/Hero';
import { Resources } from './ResourceManager';
import { GachaPity } from './GachaSystem';

export interface PlayerData {
  level: number;
  experience: number;
  name: string;
  joinedAt: number;
}

export interface TowerProgress {
  currentFloor: number;
  clearedFloors: number[];
  maxFloor: number;
  totalRuns: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  autoSaveEnabled: boolean;
  notifications: boolean;
}

export interface GameState {
  version: string;
  timestamp: number;
  
  // Player progression
  player: PlayerData;
  
  // Resources
  resources: Resources;
  
  // Hero collection
  heroes: Hero[];
  heroCount: number;
  
  // Tower progress
  tower: TowerProgress;
  
  // Gacha system state
  gacha: {
    totalSummons: number;
    pity: GachaPity;
    lastSummonTime: number;
  };
  
  // Game settings
  settings: GameSettings;
  
  // Statistics
  stats: {
    totalPlayTime: number;
    totalGoldEarned: number;
    totalGoldSpent: number;
    heroesUnlocked: number;
    floorsCleared: number;
    lastLoginTime: number;
    loginStreak: number;
  };
}

export class GameStateManager {
  private gameState: GameState;
  private eventBus: EventBus;
  private saveKey = 'eternal-tower-gamestate';
  private autoSaveInterval: number = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    
    // Initialize default game state
    this.gameState = this.createDefaultState();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start auto-save
    this.startAutoSave();
  }

  private createDefaultState(): GameState {
    return {
      version: '0.1.0',
      timestamp: Date.now(),
      
      player: {
        level: 1,
        experience: 0,
        name: 'Master',
        joinedAt: Date.now(),
      },
      
      resources: {
        gold: 2000,
        gems: 50,
        mana: 200,
        materials: {
          iron: 0,
          wood: 0,
          crystal: 0,
        },
      },
      
      heroes: [],
      heroCount: 0,
      
      tower: {
        currentFloor: 1,
        clearedFloors: [],
        maxFloor: 1,
        totalRuns: 0,
      },
      
      gacha: {
        totalSummons: 0,
        pity: {
          pulls: 0,
          lastLegendary: 0,
          lastEpic: 0,
        },
        lastSummonTime: 0,
      },
      
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        autoSaveEnabled: true,
        notifications: true,
      },
      
      stats: {
        totalPlayTime: 0,
        totalGoldEarned: 2000,
        totalGoldSpent: 0,
        heroesUnlocked: 0,
        floorsCleared: 0,
        lastLoginTime: Date.now(),
        loginStreak: 1,
      },
    };
  }

  private setupEventListeners(): void {
    // Hero collection events
    this.eventBus.on('hero-summoned', (data) => {
      this.gameState.heroes.push(data.hero);
      this.gameState.heroCount = this.gameState.heroes.length;
      this.gameState.gacha.totalSummons++;
      this.gameState.gacha.pity = data.pity;
      this.gameState.gacha.lastSummonTime = Date.now();
      this.gameState.stats.heroesUnlocked = this.gameState.heroCount;
    });

    // Resource events
    this.eventBus.on('resource-spent', (data) => {
      if (data.type === 'gold') {
        this.gameState.stats.totalGoldSpent += data.amount;
      }
    });

    this.eventBus.on('resource-gained', (data) => {
      if (data.type === 'gold') {
        this.gameState.stats.totalGoldEarned += data.amount;
      }
    });

    // Tower progress events
    this.eventBus.on('floor-cleared', (data) => {
      const floor = data.floor;
      if (!this.gameState.tower.clearedFloors.includes(floor)) {
        this.gameState.tower.clearedFloors.push(floor);
        this.gameState.stats.floorsCleared++;
      }
      this.gameState.tower.maxFloor = Math.max(this.gameState.tower.maxFloor, floor + 1);
      this.gameState.tower.currentFloor = Math.max(this.gameState.tower.currentFloor, floor + 1);
    });

    // Experience and leveling
    this.eventBus.on('player-exp-gained', (data) => {
      this.gameState.player.experience += data.amount;
      this.checkPlayerLevelUp();
    });
  }

  private checkPlayerLevelUp(): void {
    const expRequired = this.getPlayerExpRequired(this.gameState.player.level);
    if (this.gameState.player.experience >= expRequired) {
      this.gameState.player.level++;
      this.gameState.player.experience -= expRequired;
      this.eventBus.emit('player-level-up', { 
        newLevel: this.gameState.player.level,
        player: this.gameState.player 
      });
    }
  }

  private getPlayerExpRequired(level: number): number {
    return Math.floor(1000 * Math.pow(1.5, level - 1));
  }

  // Getters
  getGameState(): GameState {
    return { ...this.gameState };
  }

  getPlayer(): PlayerData {
    return { ...this.gameState.player };
  }

  getResources(): Resources {
    return { ...this.gameState.resources };
  }

  getHeroes(): Hero[] {
    return [...this.gameState.heroes];
  }

  getTowerProgress(): TowerProgress {
    return { ...this.gameState.tower };
  }

  getStats(): GameState['stats'] {
    return { ...this.gameState.stats };
  }

  getSettings(): GameSettings {
    return { ...this.gameState.settings };
  }

  // Setters
  updateResources(resources: Partial<Resources>): void {
    this.gameState.resources = { ...this.gameState.resources, ...resources };
    this.eventBus.emit('resources-updated', this.gameState.resources);
  }

  updateSettings(settings: Partial<GameSettings>): void {
    this.gameState.settings = { ...this.gameState.settings, ...settings };
    this.eventBus.emit('settings-updated', this.gameState.settings);
  }

  updateTowerProgress(progress: Partial<TowerProgress>): void {
    this.gameState.tower = { ...this.gameState.tower, ...progress };
    this.eventBus.emit('tower-progress-updated', this.gameState.tower);
  }

  // Save/Load operations
  save(): boolean {
    try {
      this.gameState.timestamp = Date.now();
      const serialized = JSON.stringify(this.gameState);
      localStorage.setItem(this.saveKey, serialized);
      this.eventBus.emit('game-saved', { timestamp: this.gameState.timestamp });
      console.log('Game state saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      this.eventBus.emit('save-error', { error });
      return false;
    }
  }

  load(): boolean {
    try {
      const serialized = localStorage.getItem(this.saveKey);
      if (!serialized) {
        console.log('No save data found, using default state');
        return false;
      }

      const loadedState = JSON.parse(serialized) as GameState;
      
      // Validate and migrate if necessary
      if (this.validateGameState(loadedState)) {
        this.gameState = this.migrateGameState(loadedState);
        this.eventBus.emit('game-loaded', { gameState: this.gameState });
        console.log('Game state loaded successfully');
        return true;
      } else {
        console.warn('Invalid save data, using default state');
        return false;
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      this.eventBus.emit('load-error', { error });
      return false;
    }
  }

  private validateGameState(state: any): state is GameState {
    return (
      state &&
      typeof state.version === 'string' &&
      typeof state.timestamp === 'number' &&
      state.player &&
      state.resources &&
      Array.isArray(state.heroes) &&
      state.tower &&
      state.gacha &&
      state.settings &&
      state.stats
    );
  }

  private migrateGameState(state: GameState): GameState {
    // Handle version migrations here
    if (state.version !== '0.1.0') {
      console.log(`Migrating save data from ${state.version} to 0.1.0`);
      // Add migration logic for future versions
    }

    // Ensure all heroes have Maps for bonds
    state.heroes = state.heroes.map(hero => ({
      ...hero,
      bonds: hero.bonds instanceof Map ? hero.bonds : new Map(Object.entries(hero.bonds || {})),
    }));

    state.version = '0.1.0';
    return state;
  }

  // Auto-save functionality
  private startAutoSave(): void {
    if (this.gameState.settings.autoSaveEnabled) {
      this.autoSaveInterval = window.setInterval(() => {
        this.save();
      }, 30000); // Save every 30 seconds
    }
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = 0;
    }
  }

  // Utility methods
  reset(): void {
    this.gameState = this.createDefaultState();
    localStorage.removeItem(this.saveKey);
    this.eventBus.emit('game-reset');
    console.log('Game state reset to defaults');
  }

  export(): string {
    return JSON.stringify(this.gameState, null, 2);
  }

  import(data: string): boolean {
    try {
      const importedState = JSON.parse(data) as GameState;
      if (this.validateGameState(importedState)) {
        this.gameState = this.migrateGameState(importedState);
        this.save();
        this.eventBus.emit('game-imported', { gameState: this.gameState });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import game state:', error);
      return false;
    }
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSave();
    this.save(); // Final save before cleanup
  }
}