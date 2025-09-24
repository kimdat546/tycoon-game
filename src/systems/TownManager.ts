import { EventBus } from '../core/EventBus';
import { Hero } from '../entities/Hero';
import { ResourceManager, ResourceProduction } from './ResourceManager';

export interface TownBuilding {
  id: string;
  name: string;
  type: BuildingType;
  level: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isBuilt: boolean;
  buildCost: number;
  upgradeCost: number;
  buildTime: number; // seconds
  upgradeTime: number; // seconds
  isBuilding: boolean;
  buildStartTime?: number;
  capacity: number;
  assignedHeroes: Hero[];
  production?: {
    resource: string;
    rate: number; // per second
    storage: number;
    currentAmount: number;
  };
}

export enum BuildingType {
  BOUNTY_HUT = 'bounty_hut',
  ACADEMY = 'academy',
  FORGE = 'forge',
  TRAINING_GROUND = 'training_ground',
  INN = 'inn',
  MARKET = 'market',
  STORAGE = 'storage',
  BARRACKS = 'barracks',
}

export interface BuildingTemplate {
  type: BuildingType;
  name: string;
  description: string;
  baseBuildCost: number;
  baseBuildTime: number;
  baseCapacity: number;
  maxLevel: number;
  size: { width: number; height: number };
  production?: {
    resource: string;
    baseRate: number;
    baseStorage: number;
  };
}

export class TownManager {
  private eventBus: EventBus;
  private resourceManager: ResourceManager | null = null;
  private buildings: Map<string, TownBuilding> = new Map();
  private buildingTemplates: Map<BuildingType, BuildingTemplate> = new Map();
  private townLevel: number = 1;
  private townExperience: number = 0;
  private updateInterval: number = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.initializeBuildingTemplates();
    this.initializeStarterBuildings();
    this.startUpdateLoop();
  }

  setResourceManager(resourceManager: ResourceManager): void {
    this.resourceManager = resourceManager;
    this.recalculateAllProduction();
  }

  private initializeBuildingTemplates(): void {
    const templates: BuildingTemplate[] = [
      {
        type: BuildingType.BOUNTY_HUT,
        name: 'Bounty Hut',
        description: 'Send heroes on quests to hunt monsters for experience and items',
        baseBuildCost: 100,
        baseBuildTime: 30,
        baseCapacity: 2,
        maxLevel: 10,
        size: { width: 2, height: 2 },
      },
      {
        type: BuildingType.ACADEMY,
        name: 'Academy',
        description: 'Teach heroes skills and secret techniques',
        baseBuildCost: 200,
        baseBuildTime: 60,
        baseCapacity: 1,
        maxLevel: 8,
        size: { width: 3, height: 2 },
        production: {
          resource: 'knowledge',
          baseRate: 1,
          baseStorage: 100,
        },
      },
      {
        type: BuildingType.FORGE,
        name: 'Enhancement Forge',
        description: 'Forge and modify hero equipment',
        baseBuildCost: 150,
        baseBuildTime: 45,
        baseCapacity: 1,
        maxLevel: 10,
        size: { width: 2, height: 3 },
        production: {
          resource: 'materials',
          baseRate: 0.5,
          baseStorage: 50,
        },
      },
      {
        type: BuildingType.TRAINING_GROUND,
        name: 'Training Ground',
        description: 'Level up heroes quickly through training',
        baseBuildCost: 250,
        baseBuildTime: 90,
        baseCapacity: 3,
        maxLevel: 8,
        size: { width: 4, height: 3 },
        production: {
          resource: 'experience',
          baseRate: 2,
          baseStorage: 200,
        },
      },
      {
        type: BuildingType.INN,
        name: 'Hero Inn',
        description: 'Attract and recruit new heroes',
        baseBuildCost: 300,
        baseBuildTime: 120,
        baseCapacity: 0,
        maxLevel: 6,
        size: { width: 3, height: 3 },
      },
      {
        type: BuildingType.MARKET,
        name: 'Market',
        description: 'Trade resources and sell items',
        baseBuildCost: 180,
        baseBuildTime: 75,
        baseCapacity: 0,
        maxLevel: 8,
        size: { width: 3, height: 2 },
        production: {
          resource: 'gold',
          baseRate: 1,
          baseStorage: 1000,
        },
      },
      {
        type: BuildingType.STORAGE,
        name: 'Storage Warehouse',
        description: 'Increase resource storage capacity',
        baseBuildCost: 120,
        baseBuildTime: 40,
        baseCapacity: 0,
        maxLevel: 15,
        size: { width: 2, height: 2 },
      },
      {
        type: BuildingType.BARRACKS,
        name: 'Barracks',
        description: 'House and manage your hero teams',
        baseBuildCost: 400,
        baseBuildTime: 150,
        baseCapacity: 5,
        maxLevel: 5,
        size: { width: 4, height: 4 },
      },
    ];

    templates.forEach(template => {
      this.buildingTemplates.set(template.type, template);
    });
  }

  private initializeStarterBuildings(): void {
    // Create starter buildings that every town begins with
    this.createBuilding(BuildingType.BOUNTY_HUT, { x: 2, y: 2 }, true);
    this.createBuilding(BuildingType.MARKET, { x: 5, y: 2 }, true);
  }

  // Building creation and management
  createBuilding(type: BuildingType, position: { x: number; y: number }, instant: boolean = false): string | null {
    const template = this.buildingTemplates.get(type);
    if (!template) {
      console.error(`Building template not found for type: ${type}`);
      return null;
    }

    // Check if position is available
    if (!this.isPositionAvailable(position, template.size)) {
      console.warn('Position not available for building');
      return null;
    }

    const buildingId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const building: TownBuilding = {
      id: buildingId,
      name: template.name,
      type,
      level: 1,
      position,
      size: template.size,
      isBuilt: instant,
      buildCost: template.baseBuildCost,
      upgradeCost: template.baseBuildCost * 1.5,
      buildTime: template.baseBuildTime,
      upgradeTime: template.baseBuildTime * 0.8,
      isBuilding: !instant,
      buildStartTime: instant ? undefined : Date.now(),
      capacity: template.baseCapacity,
      assignedHeroes: [],
    };

    // Add production if template has it
    if (template.production) {
      building.production = {
        resource: template.production.resource,
        rate: template.production.baseRate,
        storage: template.production.baseStorage,
        currentAmount: 0,
      };
    }

    this.buildings.set(buildingId, building);

    if (instant) {
      this.eventBus.emit('building-completed', { building });
    } else {
      this.eventBus.emit('building-started', { building });
    }

    console.log(`${instant ? 'Created' : 'Started building'} ${template.name} at (${position.x}, ${position.y})`);
    return buildingId;
  }

  upgradeBuilding(buildingId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building || !building.isBuilt || building.isBuilding) {
      return false;
    }

    const template = this.buildingTemplates.get(building.type);
    if (!template || building.level >= template.maxLevel) {
      return false;
    }

    building.level++;
    building.isBuilding = true;
    building.buildStartTime = Date.now();
    building.buildCost = Math.floor(building.buildCost * 1.5);
    building.upgradeCost = Math.floor(building.upgradeCost * 1.5);

    // Improve capacity and production
    building.capacity = Math.floor(template.baseCapacity * (1 + building.level * 0.2));
    
    if (building.production && template.production) {
      building.production.rate = template.production.baseRate * (1 + building.level * 0.3);
      building.production.storage = Math.floor(template.production.baseStorage * (1 + building.level * 0.5));
    }

    this.eventBus.emit('building-upgrade-started', { building });
    console.log(`Started upgrading ${building.name} to level ${building.level}`);
    return true;
  }

  // Hero assignment to buildings
  assignHeroToBuilding(hero: Hero, buildingId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building || !building.isBuilt) {
      console.warn('Building not found or not built');
      return false;
    }

    if (building.assignedHeroes.length >= building.capacity) {
      console.warn('Building is at full capacity');
      return false;
    }

    // Remove hero from other buildings first
    this.removeHeroFromAllBuildings(hero.id);

    // Assign to new building
    building.assignedHeroes.push(hero);
    
    // Recalculate production for this building
    this.updateBuildingProduction(building);
    
    this.eventBus.emit('hero-assigned-to-building', { hero, building });
    console.log(`${hero.name} assigned to ${building.name}`);
    return true;
  }

  removeHeroFromBuilding(heroId: string, buildingId: string): boolean {
    const building = this.buildings.get(buildingId);
    if (!building) return false;

    const heroIndex = building.assignedHeroes.findIndex(h => h.id === heroId);
    if (heroIndex === -1) return false;

    const hero = building.assignedHeroes.splice(heroIndex, 1)[0];
    
    // Recalculate production for this building
    this.updateBuildingProduction(building);
    
    this.eventBus.emit('hero-removed-from-building', { hero, building });
    return true;
  }

  private removeHeroFromAllBuildings(heroId: string): void {
    this.buildings.forEach(building => {
      const hadHero = building.assignedHeroes.some(h => h.id === heroId);
      building.assignedHeroes = building.assignedHeroes.filter(h => h.id !== heroId);
      
      // If hero was removed, recalculate production
      if (hadHero) {
        this.updateBuildingProduction(building);
      }
    });
  }

  // Update loop for building construction and production
  private startUpdateLoop(): void {
    const update = () => {
      this.updateBuildings();
      this.updateInterval = requestAnimationFrame(update);
    };
    this.updateInterval = requestAnimationFrame(update);
  }

  private updateBuildings(): void {
    const currentTime = Date.now();

    this.buildings.forEach(building => {
      // Check building construction
      if (building.isBuilding && building.buildStartTime) {
        const timeElapsed = (currentTime - building.buildStartTime) / 1000;
        const timeRequired = building.isBuilt ? building.upgradeTime : building.buildTime;

        if (timeElapsed >= timeRequired) {
          building.isBuilding = false;
          building.isBuilt = true;
          building.buildStartTime = undefined;
          this.eventBus.emit('building-completed', { building });
          console.log(`${building.name} construction completed!`);
        }
      }

      // Update production
      if (building.isBuilt && building.production && building.assignedHeroes.length > 0) {
        this.updateBuildingProduction(building);
      }
    });
  }


  // Utility methods
  private isPositionAvailable(position: { x: number; y: number }, size: { width: number; height: number }): boolean {
    // Check if the area is free from other buildings
    for (const building of this.buildings.values()) {
      if (this.checkOverlap(position, size, building.position, building.size)) {
        return false;
      }
    }
    return true;
  }

  private checkOverlap(
    pos1: { x: number; y: number }, size1: { width: number; height: number },
    pos2: { x: number; y: number }, size2: { width: number; height: number }
  ): boolean {
    return !(
      pos1.x + size1.width <= pos2.x ||
      pos2.x + size2.width <= pos1.x ||
      pos1.y + size1.height <= pos2.y ||
      pos2.y + size2.height <= pos1.y
    );
  }

  // Getters
  getBuildings(): TownBuilding[] {
    return Array.from(this.buildings.values());
  }

  getBuilding(buildingId: string): TownBuilding | undefined {
    return this.buildings.get(buildingId);
  }

  getBuildingsByType(type: BuildingType): TownBuilding[] {
    return Array.from(this.buildings.values()).filter(b => b.type === type);
  }

  getBuildingTemplate(type: BuildingType): BuildingTemplate | undefined {
    return this.buildingTemplates.get(type);
  }

  getAllBuildingTemplates(): BuildingTemplate[] {
    return Array.from(this.buildingTemplates.values());
  }

  getTownLevel(): number {
    return this.townLevel;
  }

  getTownExperience(): number {
    return this.townExperience;
  }

  // Town progression
  addTownExperience(amount: number): void {
    this.townExperience += amount;
    this.checkTownLevelUp();
  }

  private checkTownLevelUp(): void {
    const expRequired = this.getTownExpRequired();
    if (this.townExperience >= expRequired) {
      this.townLevel++;
      this.townExperience -= expRequired;
      this.eventBus.emit('town-level-up', { 
        newLevel: this.townLevel,
        experience: this.townExperience 
      });
      console.log(`Town leveled up to ${this.townLevel}!`);
    }
  }

  private getTownExpRequired(): number {
    return Math.floor(500 * Math.pow(1.4, this.townLevel - 1));
  }

  // Statistics
  getTownStats(): any {
    const totalBuildings = this.buildings.size;
    const builtBuildings = Array.from(this.buildings.values()).filter(b => b.isBuilt).length;
    const buildingsInProgress = Array.from(this.buildings.values()).filter(b => b.isBuilding).length;
    
    return {
      townLevel: this.townLevel,
      townExperience: this.townExperience,
      expToNextLevel: this.getTownExpRequired(),
      totalBuildings,
      builtBuildings,
      buildingsInProgress,
      buildings: this.getBuildings().map(b => ({
        name: b.name,
        type: b.type,
        level: b.level,
        isBuilt: b.isBuilt,
        assignedHeroes: b.assignedHeroes.length,
        capacity: b.capacity,
      })),
    };
  }

  // Production management
  private updateBuildingProduction(building: TownBuilding): void {
    if (!this.resourceManager || !building.production || !building.isBuilt) return;

    const template = this.buildingTemplates.get(building.type);
    if (!template || !template.production) return;

    // Calculate production rate based on building level and assigned heroes
    const baseRate = template.production.baseRate * (1 + building.level * 0.3);
    
    // Hero efficiency bonus: 25% per hero, max efficiency at 200%
    const heroBonus = Math.min(building.assignedHeroes.length * 0.25, 2.0);
    const finalRate = baseRate * (1 + heroBonus);

    // Update building's production rate
    const oldRate = building.production.rate;
    building.production.rate = finalRate;

    // Notify resource manager of the change
    if (oldRate !== finalRate) {
      this.eventBus.emit('building-production-changed', {
        building,
        production: {
          resource: building.production.resource,
          rate: finalRate - oldRate, // Net change
        },
      });

      console.log(`${building.name} production updated: ${finalRate.toFixed(2)} ${building.production.resource}/sec`);
    }
  }

  private recalculateAllProduction(): void {
    if (!this.resourceManager) return;

    // Reset all production to 0, then recalculate
    const totalProduction: ResourceProduction = {
      gold: 0,
      mana: 0,
      materials: { iron: 0, wood: 0, crystal: 0 },
      experience: 0,
    };

    // Calculate total production from all buildings
    this.buildings.forEach(building => {
      if (building.isBuilt && building.production && building.assignedHeroes.length > 0) {
        const template = this.buildingTemplates.get(building.type);
        if (template?.production) {
          const baseRate = template.production.baseRate * (1 + building.level * 0.3);
          const heroBonus = Math.min(building.assignedHeroes.length * 0.25, 2.0);
          const finalRate = baseRate * (1 + heroBonus);

          // Add to total production based on resource type
          switch (building.production.resource) {
            case 'gold':
              totalProduction.gold += finalRate;
              break;
            case 'knowledge':
            case 'experience':
              totalProduction.experience += finalRate;
              break;
            case 'materials':
              totalProduction.materials.iron += finalRate * 0.4;
              totalProduction.materials.wood += finalRate * 0.4;
              totalProduction.materials.crystal += finalRate * 0.2;
              break;
            case 'iron':
              totalProduction.materials.iron += finalRate;
              break;
            case 'wood':
              totalProduction.materials.wood += finalRate;
              break;
            case 'crystal':
              totalProduction.materials.crystal += finalRate;
              break;
          }

          // Update building's stored production rate
          building.production.rate = finalRate;
        }
      }
    });

    // Update resource manager with new total production
    this.resourceManager.updateProduction(totalProduction);
    
    console.log('Town production recalculated:', totalProduction);
  }

  // Calculate production efficiency for display
  getBuildingEfficiency(buildingId: string): number {
    const building = this.buildings.get(buildingId);
    if (!building || !building.isBuilt) return 0;

    if (building.capacity === 0) return 1; // Buildings without capacity are always 100% efficient
    
    const assignedHeroes = building.assignedHeroes.length;
    const optimalHeroes = Math.min(building.capacity, 4); // Optimal is 4 heroes for max efficiency
    
    return Math.min(assignedHeroes / optimalHeroes, 1);
  }

  getTotalProduction(): ResourceProduction {
    if (!this.resourceManager) {
      return { gold: 0, mana: 0, materials: { iron: 0, wood: 0, crystal: 0 }, experience: 0 };
    }
    return this.resourceManager.getProduction();
  }

  // Event handlers for building completion
  private onBuildingCompleted(building: TownBuilding): void {
    // When a building is completed, recalculate production if it has production capability
    if (building.production) {
      this.updateBuildingProduction(building);
    }
  }

  // Save/Load
  serialize(): any {
    return {
      townLevel: this.townLevel,
      population: this.population,
      buildings: Array.from(this.buildings.entries()).map(([id, building]) => [
        id,
        {
          ...building,
          // Convert dates to timestamps for serialization
          buildStartTime: building.buildStartTime,
          upgradeStartTime: building.upgradeStartTime,
          lastCollectionTime: building.lastCollectionTime,
        },
      ]),
    };
  }

  deserialize(data: any): void {
    if (!data) return;

    this.townLevel = data.townLevel || 1;
    this.population = data.population || 0;

    if (data.buildings) {
      this.buildings = new Map(data.buildings.map(([id, buildingData]: [string, any]) => [
        id,
        {
          ...buildingData,
          // Restore dates from timestamps
          buildStartTime: buildingData.buildStartTime,
          upgradeStartTime: buildingData.upgradeStartTime,
          lastCollectionTime: buildingData.lastCollectionTime || Date.now(),
        },
      ]));
    }

    // Recalculate production after loading
    this.recalculateProduction();
    console.log(`Loaded town with ${this.buildings.size} buildings`);
  }

  // Export town for debugging/testing
  exportTownData(): string {
    return JSON.stringify(this.serialize(), null, 2);
  }

  // Import town data for testing
  importTownData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.deserialize(parsed);
      return true;
    } catch (error) {
      console.error('Failed to import town data:', error);
      return false;
    }
  }

  // Reset town to initial state
  resetTown(): void {
    this.buildings.clear();
    this.townLevel = 1;
    this.population = 0;
    
    // Add starter building
    this.addBuilding(BuildingType.TOWN_HALL, { x: 5, y: 5 }, true);
    
    this.recalculateProduction();
    this.eventBus.emit('town-reset');
    console.log('Town reset to initial state');
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      cancelAnimationFrame(this.updateInterval);
    }
  }
}