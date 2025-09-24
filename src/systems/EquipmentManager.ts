import { EventBus } from '../core/EventBus';
import { Equipment, EquipmentType, EquipmentUtils, ENHANCEMENT_TABLE } from '../entities/Equipment';
import { Hero } from '../entities/Hero';
import { EquipmentFactory } from './EquipmentFactory';

export interface HeroEquipment {
  heroId: string;
  weapon?: Equipment;
  armor?: Equipment;
  helmet?: Equipment;
  boots?: Equipment;
  accessory?: Equipment;
  ring?: Equipment;
}

export class EquipmentManager {
  private eventBus: EventBus;
  private inventory: Map<string, Equipment> = new Map();
  private heroEquipment: Map<string, HeroEquipment> = new Map();
  private inventoryLimit: number = 100;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for hero creation to generate starter equipment
    this.eventBus.on('hero-created', (data: { hero: Hero }) => {
      this.generateStarterEquipment(data.hero);
    });

    // Listen for combat rewards
    this.eventBus.on('enemy-defeated', (data: any) => {
      this.handleCombatLoot(data);
    });
  }

  // Inventory Management
  addEquipment(equipment: Equipment): boolean {
    if (this.inventory.size >= this.inventoryLimit) {
      console.warn('Inventory is full');
      return false;
    }

    this.inventory.set(equipment.id, equipment);
    this.eventBus.emit('equipment-added', { equipment });
    return true;
  }

  removeEquipment(equipmentId: string): Equipment | null {
    const equipment = this.inventory.get(equipmentId);
    if (!equipment) return null;

    this.inventory.delete(equipmentId);
    this.eventBus.emit('equipment-removed', { equipment });
    return equipment;
  }

  getInventory(): Equipment[] {
    return Array.from(this.inventory.values());
  }

  getInventoryByType(type: EquipmentType): Equipment[] {
    return this.getInventory().filter(equipment => equipment.type === type);
  }

  // Hero Equipment Management
  equipItem(heroId: string, equipmentId: string): boolean {
    const equipment = this.inventory.get(equipmentId);
    if (!equipment) {
      console.warn('Equipment not found in inventory');
      return false;
    }

    // Get hero equipment setup
    let heroEquip = this.heroEquipment.get(heroId);
    if (!heroEquip) {
      heroEquip = { heroId };
      this.heroEquipment.set(heroId, heroEquip);
    }

    // Check equipment requirements (this would need hero data)
    // For now, we'll assume it's valid

    // Unequip existing item of same type
    const currentEquipment = this.getCurrentEquipment(heroEquip, equipment.type);
    if (currentEquipment) {
      this.unequipItem(heroId, equipment.type);
    }

    // Equip new item
    this.setEquipmentSlot(heroEquip, equipment.type, equipment);
    equipment.isEquipped = true;
    equipment.equippedBy = heroId;

    // Remove from inventory
    this.inventory.delete(equipmentId);

    this.eventBus.emit('equipment-equipped', { heroId, equipment });
    this.eventBus.emit('hero-stats-changed', { heroId, equipment });

    console.log(`Equipped ${equipment.name} on hero ${heroId}`);
    return true;
  }

  unequipItem(heroId: string, equipmentType: EquipmentType): boolean {
    const heroEquip = this.heroEquipment.get(heroId);
    if (!heroEquip) return false;

    const equipment = this.getCurrentEquipment(heroEquip, equipmentType);
    if (!equipment) return false;

    // Add back to inventory
    if (!this.addEquipment(equipment)) {
      console.warn('Cannot unequip - inventory is full');
      return false;
    }

    // Remove from hero
    this.setEquipmentSlot(heroEquip, equipmentType, undefined);
    equipment.isEquipped = false;
    equipment.equippedBy = undefined;

    this.eventBus.emit('equipment-unequipped', { heroId, equipment });
    this.eventBus.emit('hero-stats-changed', { heroId, equipment });

    console.log(`Unequipped ${equipment.name} from hero ${heroId}`);
    return true;
  }

  private getCurrentEquipment(heroEquip: HeroEquipment, type: EquipmentType): Equipment | undefined {
    switch (type) {
      case EquipmentType.WEAPON: return heroEquip.weapon;
      case EquipmentType.ARMOR: return heroEquip.armor;
      case EquipmentType.HELMET: return heroEquip.helmet;
      case EquipmentType.BOOTS: return heroEquip.boots;
      case EquipmentType.ACCESSORY: return heroEquip.accessory;
      case EquipmentType.RING: return heroEquip.ring;
      default: return undefined;
    }
  }

  private setEquipmentSlot(heroEquip: HeroEquipment, type: EquipmentType, equipment?: Equipment): void {
    switch (type) {
      case EquipmentType.WEAPON: heroEquip.weapon = equipment; break;
      case EquipmentType.ARMOR: heroEquip.armor = equipment; break;
      case EquipmentType.HELMET: heroEquip.helmet = equipment; break;
      case EquipmentType.BOOTS: heroEquip.boots = equipment; break;
      case EquipmentType.ACCESSORY: heroEquip.accessory = equipment; break;
      case EquipmentType.RING: heroEquip.ring = equipment; break;
    }
  }

  getHeroEquipment(heroId: string): HeroEquipment | undefined {
    return this.heroEquipment.get(heroId);
  }

  // Calculate total stats bonus from equipment
  calculateEquipmentStats(heroId: string): any {
    const heroEquip = this.heroEquipment.get(heroId);
    if (!heroEquip) return {};

    const totalStats: any = {
      attack: 0,
      defense: 0,
      hp: 0,
      speed: 0,
      magic: 0,
      critRate: 0,
      critDamage: 0,
      accuracy: 0,
      evasion: 0,
    };

    // Sum stats from all equipped items
    Object.values(heroEquip).forEach(equipment => {
      if (equipment && typeof equipment === 'object' && 'stats' in equipment) {
        const equipmentStats = EquipmentUtils.calculateStats(equipment as Equipment);
        Object.keys(equipmentStats).forEach(key => {
          if (totalStats.hasOwnProperty(key)) {
            totalStats[key] += equipmentStats[key as keyof typeof equipmentStats] || 0;
          }
        });
      }
    });

    return totalStats;
  }

  // Equipment Enhancement
  enhanceEquipment(equipmentId: string): { success: boolean; result: any } {
    const equipment = this.inventory.get(equipmentId) || 
      Array.from(this.heroEquipment.values())
        .flatMap(heroEquip => Object.values(heroEquip))
        .find(eq => eq && typeof eq === 'object' && 'id' in eq && eq.id === equipmentId) as Equipment;

    if (!equipment) {
      return { success: false, result: { message: 'Equipment not found' } };
    }

    const enhancementResult = EquipmentFactory.enhanceEquipment(equipment);
    
    if (enhancementResult.success) {
      // Update the equipment in storage
      if (this.inventory.has(equipmentId)) {
        this.inventory.set(equipmentId, enhancementResult.equipment);
      } else {
        // Update in hero equipment
        for (const heroEquip of this.heroEquipment.values()) {
          Object.keys(heroEquip).forEach(key => {
            const eq = heroEquip[key as keyof HeroEquipment];
            if (eq && typeof eq === 'object' && 'id' in eq && eq.id === equipmentId) {
              (heroEquip as any)[key] = enhancementResult.equipment;
            }
          });
        }
      }

      this.eventBus.emit('equipment-enhanced', { 
        equipment: enhancementResult.equipment,
        previousLevel: equipment.enhancementLevel
      });

      if (equipment.equippedBy) {
        this.eventBus.emit('hero-stats-changed', { 
          heroId: equipment.equippedBy,
          equipment: enhancementResult.equipment
        });
      }
    }

    return { 
      success: enhancementResult.success, 
      result: enhancementResult 
    };
  }

  // Sell Equipment
  sellEquipment(equipmentId: string): number {
    const equipment = this.inventory.get(equipmentId);
    if (!equipment || equipment.isEquipped) return 0;

    const sellValue = equipment.sellValue;
    this.removeEquipment(equipmentId);

    this.eventBus.emit('equipment-sold', { equipment, value: sellValue });
    this.eventBus.emit('gold-gained', { amount: sellValue });

    return sellValue;
  }

  // Generate starter equipment for new hero
  private generateStarterEquipment(hero: Hero): void {
    const starterEquipment = EquipmentFactory.generateStarterEquipment(hero.class || 'warrior', hero.level);
    
    starterEquipment.forEach(equipment => {
      this.addEquipment(equipment);
    });

    console.log(`Generated ${starterEquipment.length} starter equipment for ${hero.name}`);
  }

  // Handle loot from combat
  private handleCombatLoot(data: any): void {
    // Generate random equipment based on enemy level and zone
    const enemyLevel = data.enemy?.level || 1;
    const zone = data.zone || 'goblin_camp';
    
    // 20% chance to drop equipment
    if (Math.random() < 0.2) {
      const loot = EquipmentFactory.generateRandomEquipment(zone, enemyLevel);
      if (loot) {
        this.addEquipment(loot);
        this.eventBus.emit('loot-dropped', { equipment: loot, source: zone });
        console.log(`Dropped ${loot.name} from ${data.enemy?.name || 'enemy'}`);
      }
    }
  }

  // Utility methods
  getEquipmentById(equipmentId: string): Equipment | null {
    // Check inventory first
    const inventoryItem = this.inventory.get(equipmentId);
    if (inventoryItem) return inventoryItem;

    // Check equipped items
    for (const heroEquip of this.heroEquipment.values()) {
      const equipment = Object.values(heroEquip).find(eq => 
        eq && typeof eq === 'object' && 'id' in eq && eq.id === equipmentId
      ) as Equipment;
      if (equipment) return equipment;
    }

    return null;
  }

  getInventorySpace(): { used: number; total: number; remaining: number } {
    const used = this.inventory.size;
    return {
      used,
      total: this.inventoryLimit,
      remaining: this.inventoryLimit - used,
    };
  }

  // Sort inventory by various criteria
  sortInventory(criteria: 'power' | 'rarity' | 'level' | 'type'): Equipment[] {
    const items = this.getInventory();
    
    switch (criteria) {
      case 'power':
        return items.sort((a, b) => EquipmentFactory.compareEquipment(a, b));
      case 'rarity':
        return items.sort((a, b) => b.rarity - a.rarity);
      case 'level':
        return items.sort((a, b) => b.level - a.level);
      case 'type':
        return items.sort((a, b) => a.type.localeCompare(b.type));
      default:
        return items;
    }
  }

  // Auto-equip best equipment for hero
  autoEquipBest(heroId: string, heroLevel: number, heroClass: string): boolean {
    const heroEquip = this.heroEquipment.get(heroId) || { heroId };
    let equipped = false;

    // For each equipment type, find the best available item
    Object.values(EquipmentType).forEach(type => {
      const availableItems = this.getInventoryByType(type).filter(equipment =>
        EquipmentUtils.canEquip(equipment, heroLevel, heroClass)
      );

      if (availableItems.length === 0) return;

      // Sort by power and get the best
      availableItems.sort((a, b) => EquipmentFactory.compareEquipment(a, b));
      const bestItem = availableItems[0];

      // Check if it's better than current equipment
      const currentItem = this.getCurrentEquipment(heroEquip, type);
      if (!currentItem || EquipmentUtils.calculatePower(bestItem) > EquipmentUtils.calculatePower(currentItem)) {
        if (this.equipItem(heroId, bestItem.id)) {
          equipped = true;
        }
      }
    });

    return equipped;
  }

  // Cleanup and save/load
  serialize(): any {
    return {
      inventory: Array.from(this.inventory.entries()),
      heroEquipment: Array.from(this.heroEquipment.entries()),
      inventoryLimit: this.inventoryLimit,
    };
  }

  deserialize(data: any): void {
    if (data.inventory) {
      this.inventory = new Map(data.inventory);
    }
    if (data.heroEquipment) {
      this.heroEquipment = new Map(data.heroEquipment);
    }
    if (data.inventoryLimit) {
      this.inventoryLimit = data.inventoryLimit;
    }
  }
}