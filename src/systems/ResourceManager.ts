import { EventBus } from '../core/EventBus';

export interface Resources {
  gold: number;
  gems: number;
  mana: number;
  materials: {
    iron: number;
    wood: number;
    crystal: number;
  };
}

export interface ResourceLimits {
  gold: number;
  gems: number;
  mana: number;
  materials: {
    iron: number;
    wood: number;
    crystal: number;
  };
}

export interface ResourceProduction {
  gold: number;
  mana: number;
  materials: {
    iron: number;
    wood: number;
    crystal: number;
  };
  experience: number;
}

export class ResourceManager {
  private resources: Resources;
  private limits: ResourceLimits;
  private eventBus: EventBus;
  private production: ResourceProduction;
  private updateInterval: number = 0;
  private lastUpdateTime: number = 0;

  constructor(eventBus: EventBus, initialResources?: Partial<Resources>) {
    this.eventBus = eventBus;
    
    // Default starting resources
    this.resources = {
      gold: 2000,
      gems: 50,
      mana: 200,
      materials: {
        iron: 0,
        wood: 0,
        crystal: 0,
      },
      ...initialResources,
    };

    // Default resource limits
    this.limits = {
      gold: 999999,
      gems: 99999,
      mana: 9999,
      materials: {
        iron: 9999,
        wood: 9999,
        crystal: 9999,
      },
    };

    // Initialize production rates (per second)
    this.production = {
      gold: 0,
      mana: 0,
      materials: {
        iron: 0,
        wood: 0,
        crystal: 0,
      },
      experience: 0,
    };

    this.startResourceGeneration();
    this.setupEventListeners();
  }

  // Get current resources
  getResources(): Resources {
    return { ...this.resources };
  }

  getResource(type: keyof Resources): number {
    const resource = this.resources[type];
    return typeof resource === 'number' ? resource : 0;
  }

  getMaterial(type: keyof Resources['materials']): number {
    return this.resources.materials[type];
  }

  // Check if player has enough resources
  hasEnough(type: keyof Resources, amount: number): boolean {
    if (type === 'materials') return false; // Use hasMaterial for materials
    const current = this.getResource(type);
    return current >= amount;
  }

  hasMaterial(type: keyof Resources['materials'], amount: number): boolean {
    return this.resources.materials[type] >= amount;
  }

  canAfford(cost: Partial<Resources>): boolean {
    // Check regular resources
    for (const [type, amount] of Object.entries(cost)) {
      if (type === 'materials') continue;
      if (!this.hasEnough(type as keyof Resources, amount as number)) {
        return false;
      }
    }

    // Check materials
    if (cost.materials) {
      for (const [material, amount] of Object.entries(cost.materials)) {
        if (!this.hasMaterial(material as keyof Resources['materials'], amount as number)) {
          return false;
        }
      }
    }

    return true;
  }

  // Add resources
  addResource(type: keyof Resources, amount: number): number {
    if (type === 'materials') return 0; // Use addMaterial for materials
    
    const current = this.getResource(type);
    const limit = this.limits[type] as number;
    const newAmount = Math.min(current + amount, limit);
    const actualAdded = newAmount - current;
    
    (this.resources[type] as number) = newAmount;
    
    if (actualAdded > 0) {
      this.eventBus.emit('resource-gained', { type, amount: actualAdded, total: newAmount });
    }
    
    return actualAdded;
  }

  addMaterial(type: keyof Resources['materials'], amount: number): number {
    const current = this.resources.materials[type];
    const limit = this.limits.materials[type];
    const newAmount = Math.min(current + amount, limit);
    const actualAdded = newAmount - current;
    
    this.resources.materials[type] = newAmount;
    
    if (actualAdded > 0) {
      this.eventBus.emit('material-gained', { type, amount: actualAdded, total: newAmount });
    }
    
    return actualAdded;
  }

  addResources(resources: Partial<Resources>): void {
    for (const [type, amount] of Object.entries(resources)) {
      if (type === 'materials' && typeof amount === 'object') {
        for (const [material, materialAmount] of Object.entries(amount)) {
          this.addMaterial(material as keyof Resources['materials'], materialAmount as number);
        }
      } else if (typeof amount === 'number') {
        this.addResource(type as keyof Resources, amount);
      }
    }
  }

  // Spend resources
  spendResource(type: keyof Resources, amount: number): boolean {
    if (type === 'materials') return false; // Use spendMaterial for materials
    
    if (!this.hasEnough(type, amount)) {
      return false;
    }
    
    (this.resources[type] as number) -= amount;
    this.eventBus.emit('resource-spent', { type, amount, remaining: this.getResource(type) });
    return true;
  }

  spendMaterial(type: keyof Resources['materials'], amount: number): boolean {
    if (!this.hasMaterial(type, amount)) {
      return false;
    }
    
    this.resources.materials[type] -= amount;
    this.eventBus.emit('material-spent', { type, amount, remaining: this.resources.materials[type] });
    return true;
  }

  spendResources(cost: Partial<Resources>): boolean {
    // Check if we can afford it first
    if (!this.canAfford(cost)) {
      return false;
    }

    // Spend regular resources
    for (const [type, amount] of Object.entries(cost)) {
      if (type === 'materials') continue;
      this.spendResource(type as keyof Resources, amount as number);
    }

    // Spend materials
    if (cost.materials) {
      for (const [material, amount] of Object.entries(cost.materials)) {
        this.spendMaterial(material as keyof Resources['materials'], amount as number);
      }
    }

    this.eventBus.emit('resources-spent', { cost, remaining: this.getResources() });
    return true;
  }

  // Resource limits
  setLimit(type: keyof Resources, limit: number): void {
    if (type === 'materials') return; // Use setMaterialLimit for materials
    (this.limits[type] as number) = limit;
    
    // Cap current resources to new limit
    const current = this.getResource(type);
    if (current > limit) {
      (this.resources[type] as number) = limit;
    }
  }

  setMaterialLimit(type: keyof Resources['materials'], limit: number): void {
    this.limits.materials[type] = limit;
    
    // Cap current materials to new limit
    if (this.resources.materials[type] > limit) {
      this.resources.materials[type] = limit;
    }
  }

  getLimit(type: keyof Resources): number {
    const limit = this.limits[type];
    return typeof limit === 'number' ? limit : 0;
  }

  getMaterialLimit(type: keyof Resources['materials']): number {
    return this.limits.materials[type];
  }

  // Utility methods
  getResourcePercentage(type: keyof Resources): number {
    if (type === 'materials') return 0;
    const current = this.getResource(type);
    const limit = this.getLimit(type);
    return limit > 0 ? (current / limit) * 100 : 0;
  }

  isFull(type: keyof Resources): boolean {
    if (type === 'materials') return false;
    return this.getResource(type) >= this.getLimit(type);
  }

  isEmpty(type: keyof Resources): boolean {
    if (type === 'materials') return false;
    return this.getResource(type) <= 0;
  }

  // Real-time resource generation
  private startResourceGeneration(): void {
    this.lastUpdateTime = Date.now();
    
    const update = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = currentTime;

      this.generateResources(deltaTime);
      this.updateInterval = requestAnimationFrame(update);
    };

    this.updateInterval = requestAnimationFrame(update);
  }

  private generateResources(deltaTime: number): void {
    let resourcesGenerated = false;

    // Generate gold
    if (this.production.gold > 0) {
      const goldGenerated = this.production.gold * deltaTime;
      if (goldGenerated >= 0.1) { // Only add when we have at least 0.1 gold
        const added = this.addResource('gold', Math.floor(goldGenerated * 10) / 10);
        if (added > 0) resourcesGenerated = true;
      }
    }

    // Generate mana
    if (this.production.mana > 0) {
      const manaGenerated = this.production.mana * deltaTime;
      if (manaGenerated >= 0.1) {
        const added = this.addResource('mana', Math.floor(manaGenerated * 10) / 10);
        if (added > 0) resourcesGenerated = true;
      }
    }

    // Generate materials
    Object.keys(this.production.materials).forEach(materialType => {
      const type = materialType as keyof Resources['materials'];
      const rate = this.production.materials[type];
      if (rate > 0) {
        const materialGenerated = rate * deltaTime;
        if (materialGenerated >= 0.1) {
          const added = this.addMaterial(type, Math.floor(materialGenerated * 10) / 10);
          if (added > 0) resourcesGenerated = true;
        }
      }
    });

    // Emit update event periodically
    if (resourcesGenerated) {
      this.eventBus.emit('resources-updated', {
        resources: this.getResources(),
        production: this.getProduction(),
      });
    }
  }

  private setupEventListeners(): void {
    // Listen for building production updates
    this.eventBus.on('building-production-changed', (data: any) => {
      this.updateProductionFromBuilding(data.building, data.production);
    });

    // Listen for auto-battle resource generation
    this.eventBus.on('resources-gained', (data: any) => {
      if (data.gold) this.addResource('gold', data.gold);
      if (data.mana) this.addResource('mana', data.mana);
      if (data.materials) {
        Object.keys(data.materials).forEach(material => {
          this.addMaterial(material as keyof Resources['materials'], data.materials[material]);
        });
      }
    });

    // Listen for resource production from buildings
    this.eventBus.on('resource-produced', (data: any) => {
      const { resource, amount } = data;
      switch (resource) {
        case 'gold':
          this.addResource('gold', amount);
          break;
        case 'mana':
          this.addResource('mana', amount);
          break;
        case 'materials':
        case 'iron':
        case 'wood':
        case 'crystal':
          this.addMaterial(resource as keyof Resources['materials'], amount);
          break;
      }
    });
  }

  // Production management
  getProduction(): ResourceProduction {
    return { ...this.production };
  }

  updateProduction(newProduction: Partial<ResourceProduction>): void {
    if (newProduction.gold !== undefined) this.production.gold = newProduction.gold;
    if (newProduction.mana !== undefined) this.production.mana = newProduction.mana;
    if (newProduction.experience !== undefined) this.production.experience = newProduction.experience;
    
    if (newProduction.materials) {
      Object.keys(newProduction.materials).forEach(material => {
        const type = material as keyof Resources['materials'];
        if (newProduction.materials![type] !== undefined) {
          this.production.materials[type] = newProduction.materials![type];
        }
      });
    }

    this.eventBus.emit('production-updated', this.getProduction());
  }

  addToProduction(productionBonus: Partial<ResourceProduction>): void {
    if (productionBonus.gold) this.production.gold += productionBonus.gold;
    if (productionBonus.mana) this.production.mana += productionBonus.mana;
    if (productionBonus.experience) this.production.experience += productionBonus.experience;
    
    if (productionBonus.materials) {
      Object.keys(productionBonus.materials).forEach(material => {
        const type = material as keyof Resources['materials'];
        if (productionBonus.materials![type]) {
          this.production.materials[type] += productionBonus.materials![type];
        }
      });
    }

    this.eventBus.emit('production-updated', this.getProduction());
  }

  removeFromProduction(productionReduction: Partial<ResourceProduction>): void {
    if (productionReduction.gold) this.production.gold = Math.max(0, this.production.gold - productionReduction.gold);
    if (productionReduction.mana) this.production.mana = Math.max(0, this.production.mana - productionReduction.mana);
    if (productionReduction.experience) this.production.experience = Math.max(0, this.production.experience - productionReduction.experience);
    
    if (productionReduction.materials) {
      Object.keys(productionReduction.materials).forEach(material => {
        const type = material as keyof Resources['materials'];
        if (productionReduction.materials![type]) {
          this.production.materials[type] = Math.max(0, this.production.materials[type] - productionReduction.materials![type]);
        }
      });
    }

    this.eventBus.emit('production-updated', this.getProduction());
  }

  private updateProductionFromBuilding(building: any, productionChange: any): void {
    // Update production rates based on building changes
    if (productionChange.resource === 'gold') {
      this.production.gold = Math.max(0, this.production.gold + productionChange.rate);
    } else if (productionChange.resource === 'mana') {
      this.production.mana = Math.max(0, this.production.mana + productionChange.rate);
    } else if (['iron', 'wood', 'crystal'].includes(productionChange.resource)) {
      const material = productionChange.resource as keyof Resources['materials'];
      this.production.materials[material] = Math.max(0, this.production.materials[material] + productionChange.rate);
    }

    this.eventBus.emit('production-updated', this.getProduction());
  }

  // Save/Load
  serialize(): any {
    return { 
      resources: { ...this.resources },
      production: { ...this.production },
    };
  }

  deserialize(data: any): void {
    this.resources = {
      gold: data.resources?.gold ?? 1000,
      gems: data.resources?.gems ?? 50,
      mana: data.resources?.mana ?? 100,
      materials: {
        iron: data.resources?.materials?.iron ?? 0,
        wood: data.resources?.materials?.wood ?? 0,
        crystal: data.resources?.materials?.crystal ?? 0,
      },
    };

    if (data.production) {
      this.production = {
        gold: data.production.gold ?? 0,
        mana: data.production.mana ?? 0,
        materials: {
          iron: data.production.materials?.iron ?? 0,
          wood: data.production.materials?.wood ?? 0,
          crystal: data.production.materials?.crystal ?? 0,
        },
        experience: data.production.experience ?? 0,
      };
    }
    
    this.eventBus.emit('resources-loaded', this.getResources());
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      cancelAnimationFrame(this.updateInterval);
    }
  }
}