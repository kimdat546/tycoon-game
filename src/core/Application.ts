import * as PIXI from 'pixi.js';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import { SaveManager } from './SaveManager';
import { EventBus } from './EventBus';
import { ResourceManager } from '../systems/ResourceManager';
import { TownManager } from '../systems/TownManager';
import { AutoBattleSystem } from '../systems/AutoBattleSystem';
import { EquipmentManager } from '../systems/EquipmentManager';
import { HeroProgression } from '../systems/HeroProgression';
import { SkillManager } from '../systems/SkillManager';
import { CharacterSprites } from '../graphics/CharacterSprites';
import { MenuScene } from '../scenes/MenuScene';
import { SummonScene } from '../scenes/SummonScene';
import { HeroesScene } from '../scenes/HeroesScene';
import { TowerScene } from '../scenes/TowerScene';
import { CombatScene } from '../scenes/CombatScene';
import { EquipmentScene } from '../scenes/EquipmentScene';
import { HeroProgressionScene } from '../scenes/HeroProgressionScene';
import { SaveLoadScene } from '../scenes/SaveLoadScene';
import { HeroCollection } from '../systems/HeroCollection';

export class Application {
  private pixiApp: PIXI.Application;
  private sceneManager: SceneManager;
  private assetManager: AssetManager;
  private saveManager: SaveManager;
  private eventBus: EventBus;
  private resourceManager: ResourceManager;
  private townManager: TownManager;
  private autoBattleSystem: AutoBattleSystem;
  private equipmentManager: EquipmentManager;
  private heroProgression: HeroProgression;
  private skillManager: SkillManager;
  private heroCollection: HeroCollection;
  private gameLoop: number = 0;
  private lastTime: number = 0;

  constructor() {
    // Initialize PixiJS application
    this.pixiApp = new PIXI.Application();
    
    // Initialize core systems
    this.eventBus = new EventBus();
    this.assetManager = new AssetManager();
    this.saveManager = new SaveManager();
    this.sceneManager = new SceneManager(this.pixiApp.stage, this.eventBus);
    
    // Initialize game systems
    this.resourceManager = new ResourceManager(this.eventBus);
    this.townManager = new TownManager(this.eventBus);
    this.autoBattleSystem = new AutoBattleSystem(this.eventBus);
    this.equipmentManager = new EquipmentManager(this.eventBus);
    this.heroProgression = new HeroProgression(this.eventBus);
    this.skillManager = new SkillManager(this.eventBus);
    this.heroCollection = new HeroCollection(this.eventBus);
    
    // Connect systems
    this.townManager.setResourceManager(this.resourceManager);
    
    // Make systems available globally via eventBus
    this.eventBus.emit('systems-initialized', {
      resourceManager: this.resourceManager,
      townManager: this.townManager,
      autoBattleSystem: this.autoBattleSystem,
      equipmentManager: this.equipmentManager,
      heroProgression: this.heroProgression,
      skillManager: this.skillManager,
      heroCollection: this.heroCollection,
    });
  }

  async init(): Promise<void> {
    // Initialize PixiJS
    await this.pixiApp.init({
      width: 1024,
      height: 768,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    // Add canvas to DOM
    document.body.appendChild(this.pixiApp.canvas);

    // Set renderer for character sprites
    CharacterSprites.setRenderer(this.pixiApp.renderer);

    // Load initial assets
    await this.loadInitialAssets();

    // Initialize scenes
    this.initializeScenes();

    // Setup save/load events
    this.setupSaveLoadEvents();

    // Start game loop
    this.startGameLoop();

    // Load save data
    this.loadGameData();

    console.log('Application initialized successfully');
  }

  private async loadInitialAssets(): Promise<void> {
    // For now, we'll create simple colored rectangles as placeholders
    // Later this will load actual sprite sheets and assets using assetManager
    console.log('Loading initial assets...');
    
    // Create some basic textures programmatically
    this.createBasicTextures();
    
    // Prepare assetManager for future use
    void this.assetManager; // Suppress unused warning for now
    
    console.log('Initial assets loaded');
  }

  private createBasicTextures(): void {
    // Create colored rectangles for UI elements
    const graphics = new PIXI.Graphics();
    
    // Button texture
    graphics.clear();
    graphics.rect(0, 0, 200, 60);
    graphics.fill(0x4a4a8a);
    graphics.stroke({ width: 2, color: 0x6a6aaa });
    PIXI.Assets.cache.set('button', this.pixiApp.renderer.generateTexture(graphics));

    // Hero card texture
    graphics.clear();
    graphics.rect(0, 0, 120, 160);
    graphics.fill(0x2a2a4a);
    graphics.stroke({ width: 2, color: 0x4a4a6a });
    PIXI.Assets.cache.set('hero-card', this.pixiApp.renderer.generateTexture(graphics));

    // Panel texture
    graphics.clear();
    graphics.rect(0, 0, 400, 300);
    graphics.fill(0x1a1a3a);
    graphics.stroke({ width: 2, color: 0x3a3a5a });
    PIXI.Assets.cache.set('panel', this.pixiApp.renderer.generateTexture(graphics));
  }

  private initializeScenes(): void {
    // Register scenes
    this.sceneManager.addScene('menu', new MenuScene());
    this.sceneManager.addScene('summon', new SummonScene());
    this.sceneManager.addScene('heroes', new HeroesScene());
    this.sceneManager.addScene('tower', new TowerScene());
    this.sceneManager.addScene('combat', new CombatScene());
    this.sceneManager.addScene('equipment', new EquipmentScene());
    this.sceneManager.addScene('progression', new HeroProgressionScene());
    this.sceneManager.addScene('saveload', new SaveLoadScene());
    
    // Start with menu scene
    this.sceneManager.switchTo('menu');
  }

  private startGameLoop(): void {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      
      // Update game systems
      this.update(deltaTime);
      
      // Continue loop
      this.gameLoop = requestAnimationFrame(gameLoop);
    };
    
    this.lastTime = performance.now();
    this.gameLoop = requestAnimationFrame(gameLoop);
  }

  private update(deltaTime: number): void {
    // Update scene manager
    this.sceneManager.update(deltaTime);
    
    // Auto-save every 5 minutes (300000ms)
    if (Math.floor(performance.now() / 300000) !== Math.floor((performance.now() - deltaTime) / 300000)) {
      this.saveGameData();
    }
  }

  private loadGameData(): void {
    const saveData = this.saveManager.load();
    if (saveData) {
      console.log('Save data loaded:', saveData);
      
      // Load data into systems in the correct order
      if (saveData.resources) {
        this.resourceManager.deserialize(saveData.resources);
      }
      
      if (saveData.equipment) {
        this.equipmentManager.deserialize(saveData.equipment);
      }
      
      if (saveData.heroProgression) {
        this.heroProgression.deserialize(saveData.heroProgression);
      }
      
      if (saveData.skills) {
        this.skillManager.deserialize(saveData.skills);
      }
      
      // Load town data
      if (saveData.town) {
        this.townManager.deserialize(saveData.town);
      }
      
      // Load hero collection
      if (saveData.heroCollection) {
        this.heroCollection.deserialize(saveData.heroCollection);
      }
      
      // Load battle zone states
      if (saveData.battleZones) {
        this.eventBus.emit('battle-zones-loaded', saveData.battleZones);
      }
      
      this.eventBus.emit('save-loaded', saveData);
    } else {
      console.log('No save data found, starting new game');
      this.initializeNewGame();
    }
  }

  private initializeNewGame(): void {
    // Set up default game state for new players
    this.eventBus.emit('new-game');
    
    // Initialize with starting resources
    this.eventBus.emit('resources-gained', {
      gold: 1000,
      wood: 100,
      stone: 100,
      iron: 50,
    });
    
    console.log('New game initialized with starting resources');
  }

  private setupSaveLoadEvents(): void {
    this.eventBus.on('manual-save', (slot: number) => this.saveGame(slot));
    this.eventBus.on('manual-load', (slot: number) => this.loadGame(slot));
    this.eventBus.on('delete-save', (slot: number) => this.saveManager.delete(slot));
    this.eventBus.on('request-save-slots', (callback: (slots: any[]) => void) => {
      callback(this.getSaveSlots());
    });
    this.eventBus.on('request-storage-info', (callback: (info: any) => void) => {
      callback(this.saveManager.getStorageInfo());
    });
    this.eventBus.on('export-save', (data: any) => {
      const result = this.exportSave(data.slot || 0);
      if (data.callback) data.callback(result);
    });
    this.eventBus.on('import-save', (data: any) => {
      const success = this.importSave(data.saveString, data.slot);
      if (data.callback) data.callback(success);
    });
  }

  private serializeBattleZones(): any {
    // Get battle zone states from auto battle system
    const zones = this.autoBattleSystem.getBattleZones();
    return zones.map(zone => ({
      id: zone.id,
      assignedHeroes: zone.assignedHeroes.map(hero => hero.id),
      currentWave: zone.currentWave,
      isActive: zone.isActive,
    }));
  }

  // Manual save/load methods for UI
  saveGame(slot: number = 0): boolean {
    try {
      this.saveGameData();
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  loadGame(slot: number = 0): boolean {
    try {
      const saveData = this.saveManager.load(slot);
      if (saveData) {
        // Reload the entire application state
        this.loadGameData();
        console.log(`Game loaded from slot ${slot}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  getSaveSlots(): any[] {
    return this.saveManager.getAllSaveSlots();
  }

  exportSave(slot: number = 0): string | null {
    return this.saveManager.exportSave(slot);
  }

  importSave(saveString: string, slot: number = 0): boolean {
    return this.saveManager.importSave(saveString, slot);
  }

  private saveGameData(): void {
    try {
      // Collect state from all systems
      const gameState = {
        timestamp: Date.now(),
        version: '0.2.0',
        player: {
          level: 1,
          experience: 0,
        },
        resources: this.resourceManager.serialize(),
        town: this.townManager.serialize(),
        equipment: this.equipmentManager.serialize(),
        heroProgression: this.heroProgression.serialize(),
        skills: this.skillManager.serialize(),
        heroCollection: this.heroCollection.serialize(),
        heroes: [], // Legacy field - kept for compatibility
        battleZones: this.serializeBattleZones(),
        tower: {
          currentFloor: 1,
          clearedFloors: [],
        },
        settings: {
          autoSaveEnabled: true,
          autoSaveInterval: 5,
        },
      };
      
      const success = this.saveManager.save(gameState);
      if (success) {
        console.log('Game saved automatically');
        this.eventBus.emit('game-saved', { timestamp: gameState.timestamp });
      } else {
        console.error('Failed to save game');
        this.eventBus.emit('save-failed', { reason: 'Storage error' });
      }
    } catch (error) {
      console.error('Error during save:', error);
      this.eventBus.emit('save-failed', { reason: error });
    }
  }

  destroy(): void {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    
    // Cleanup game systems
    this.resourceManager.destroy();
    this.townManager.destroy();
    this.autoBattleSystem.destroy();
    this.heroCollection.destroy();
    // equipmentManager doesn't need destroy method
    
    this.pixiApp.destroy(true);
    
    // Final save before destroying
    this.saveGameData();
  }
}