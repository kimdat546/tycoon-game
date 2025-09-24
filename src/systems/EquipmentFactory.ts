import { Equipment, EquipmentTemplate, EquipmentType, EquipmentRarity, EquipmentUtils } from '../entities/Equipment';
import { EQUIPMENT_TEMPLATES } from '../data/equipment/EquipmentTemplates';

export class EquipmentFactory {
  private static templates: Map<string, EquipmentTemplate> = new Map();

  static {
    // Initialize templates
    EQUIPMENT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Generate random equipment from a drop source
  static generateRandomEquipment(
    dropSource: string,
    heroLevel: number,
    rarityBonus: number = 0
  ): Equipment | null {
    const availableTemplates = EQUIPMENT_TEMPLATES.filter(
      template => template.dropSources.includes(dropSource)
    );

    if (availableTemplates.length === 0) return null;

    // Select random template
    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    
    // Determine rarity with bonus
    const finalRarity = this.determineRarity(template.baseRarity, rarityBonus);
    
    return this.createEquipmentFromTemplate(template.id, finalRarity, heroLevel);
  }

  // Create specific equipment from template
  static createEquipmentFromTemplate(
    templateId: string,
    rarity: EquipmentRarity = EquipmentRarity.COMMON,
    level: number = 1
  ): Equipment | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const equipmentId = `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate random stats based on rarity
    const randomStats = EquipmentUtils.generateRandomStats(template.baseStats, rarity);
    
    const equipment: Equipment = {
      id: equipmentId,
      templateId: template.id,
      name: this.generateEquipmentName(template.name, rarity),
      type: template.type,
      rarity,
      level: Math.max(1, Math.min(level, 50)), // Cap at level 50
      enhancementLevel: 0,
      stats: randomStats,
      baseStats: { ...randomStats },
      requirements: { ...template.requirements },
      description: template.description,
      iconId: template.iconId,
      sellValue: this.calculateSellValue(rarity, level),
      enhancementCost: this.calculateEnhancementCost(rarity),
      isEquipped: false,
      setId: template.setId,
      socketCount: template.socketCount,
      sockets: EquipmentUtils.createSockets(template.socketCount),
    };

    // Recalculate final stats
    equipment.stats = EquipmentUtils.calculateStats(equipment);

    return equipment;
  }

  // Generate equipment name with rarity prefix
  private static generateEquipmentName(baseName: string, rarity: EquipmentRarity): string {
    const prefixes = {
      [EquipmentRarity.COMMON]: [],
      [EquipmentRarity.UNCOMMON]: ['Fine', 'Quality', 'Well-made'],
      [EquipmentRarity.RARE]: ['Superior', 'Excellent', 'Masterwork'],
      [EquipmentRarity.EPIC]: ['Heroic', 'Majestic', 'Glorious'],
      [EquipmentRarity.LEGENDARY]: ['Legendary', 'Fabled', 'Mythical'],
      [EquipmentRarity.MYTHIC]: ['Divine', 'Celestial', 'Transcendent'],
    };

    const availablePrefixes = prefixes[rarity];
    if (availablePrefixes.length === 0) return baseName;

    const prefix = availablePrefixes[Math.floor(Math.random() * availablePrefixes.length)];
    return `${prefix} ${baseName}`;
  }

  // Determine equipment rarity with luck bonus
  private static determineRarity(baseRarity: EquipmentRarity, bonus: number = 0): EquipmentRarity {
    const rarityChances = [
      { rarity: EquipmentRarity.COMMON, chance: 60 },
      { rarity: EquipmentRarity.UNCOMMON, chance: 25 },
      { rarity: EquipmentRarity.RARE, chance: 10 },
      { rarity: EquipmentRarity.EPIC, chance: 4 },
      { rarity: EquipmentRarity.LEGENDARY, chance: 0.8 },
      { rarity: EquipmentRarity.MYTHIC, chance: 0.2 },
    ];

    // Apply bonus to higher rarities
    rarityChances.forEach(entry => {
      if (entry.rarity > baseRarity) {
        entry.chance += bonus;
      }
    });

    // Normalize chances
    const totalChance = rarityChances.reduce((sum, entry) => sum + entry.chance, 0);
    const random = Math.random() * totalChance;

    let cumulative = 0;
    for (const entry of rarityChances) {
      cumulative += entry.chance;
      if (random <= cumulative && entry.rarity >= baseRarity) {
        return entry.rarity;
      }
    }

    return baseRarity;
  }

  // Calculate sell value based on rarity and level
  private static calculateSellValue(rarity: EquipmentRarity, level: number): number {
    const baseValue = [10, 25, 60, 150, 400, 1000][rarity] || 10;
    const levelMultiplier = 1 + (level - 1) * 0.1;
    return Math.floor(baseValue * levelMultiplier);
  }

  // Calculate enhancement cost based on rarity
  private static calculateEnhancementCost(rarity: EquipmentRarity): number {
    return [50, 100, 200, 500, 1000, 2500][rarity] || 50;
  }

  // Generate equipment for a specific type and level range
  static generateEquipmentByType(
    type: EquipmentType,
    minLevel: number,
    maxLevel: number,
    rarityBonus: number = 0
  ): Equipment | null {
    const typeTemplates = EQUIPMENT_TEMPLATES.filter(
      template => template.type === type &&
      template.requirements.level >= minLevel &&
      template.requirements.level <= maxLevel
    );

    if (typeTemplates.length === 0) return null;

    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    const rarity = this.determineRarity(template.baseRarity, rarityBonus);
    const level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

    return this.createEquipmentFromTemplate(template.id, rarity, level);
  }

  // Generate a complete equipment set for a hero
  static generateStarterEquipment(heroClass: string, level: number = 1): Equipment[] {
    const equipment: Equipment[] = [];
    
    // Generate weapon for hero class
    const weaponTemplates = EQUIPMENT_TEMPLATES.filter(
      template => template.type === EquipmentType.WEAPON &&
      template.requirements.class?.includes(heroClass) &&
      template.requirements.level <= level
    );

    if (weaponTemplates.length > 0) {
      const weaponTemplate = weaponTemplates[0]; // Use first (lowest level) weapon
      const weapon = this.createEquipmentFromTemplate(weaponTemplate.id, EquipmentRarity.COMMON, level);
      if (weapon) equipment.push(weapon);
    }

    // Generate basic armor
    const armorTemplate = EQUIPMENT_TEMPLATES.find(
      template => template.type === EquipmentType.ARMOR &&
      template.requirements.level <= level
    );

    if (armorTemplate) {
      const armor = this.createEquipmentFromTemplate(armorTemplate.id, EquipmentRarity.COMMON, level);
      if (armor) equipment.push(armor);
    }

    return equipment;
  }

  // Upgrade equipment to higher level
  static upgradeEquipment(equipment: Equipment, targetLevel: number): Equipment {
    const template = this.templates.get(equipment.templateId);
    if (!template) return equipment;

    const upgradedEquipment = { ...equipment };
    upgradedEquipment.level = Math.max(equipment.level, Math.min(targetLevel, 50));

    // Recalculate stats
    upgradedEquipment.stats = EquipmentUtils.calculateStats(upgradedEquipment);
    upgradedEquipment.sellValue = this.calculateSellValue(equipment.rarity, upgradedEquipment.level);

    return upgradedEquipment;
  }

  // Enhance equipment (increase enhancement level)
  static enhanceEquipment(equipment: Equipment): { success: boolean; equipment: Equipment; cost: any } {
    const enhancementData = EquipmentUtils.getEnhancementCost(equipment.enhancementLevel);
    
    if (!enhancementData || equipment.enhancementLevel >= 15) {
      return { success: false, equipment, cost: null };
    }

    const success = Math.random() * 100 < enhancementData.successRate;
    const enhancedEquipment = { ...equipment };

    if (success) {
      enhancedEquipment.enhancementLevel++;
      enhancedEquipment.stats = EquipmentUtils.calculateStats(enhancedEquipment);
    }

    return {
      success,
      equipment: enhancedEquipment,
      cost: enhancementData,
    };
  }

  // Get all templates for a specific type
  static getTemplatesByType(type: EquipmentType): EquipmentTemplate[] {
    return EQUIPMENT_TEMPLATES.filter(template => template.type === type);
  }

  // Get template by ID
  static getTemplate(templateId: string): EquipmentTemplate | undefined {
    return this.templates.get(templateId);
  }

  // Generate loot table for specific content
  static generateLootTable(contentType: string, heroLevel: number): Equipment[] {
    const loot: Equipment[] = [];
    const lootCount = Math.floor(Math.random() * 3) + 1; // 1-3 items

    for (let i = 0; i < lootCount; i++) {
      const equipment = this.generateRandomEquipment(contentType, heroLevel);
      if (equipment) {
        loot.push(equipment);
      }
    }

    return loot;
  }

  // Compare two equipment pieces
  static compareEquipment(equipment1: Equipment, equipment2: Equipment): number {
    const power1 = EquipmentUtils.calculatePower(equipment1);
    const power2 = EquipmentUtils.calculatePower(equipment2);
    return power2 - power1; // Higher power first
  }

  // Filter equipment by various criteria
  static filterEquipment(
    equipment: Equipment[],
    filters: {
      type?: EquipmentType;
      rarity?: EquipmentRarity;
      minLevel?: number;
      maxLevel?: number;
      canEquip?: { level: number; class: string };
    }
  ): Equipment[] {
    return equipment.filter(item => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.rarity && item.rarity !== filters.rarity) return false;
      if (filters.minLevel && item.level < filters.minLevel) return false;
      if (filters.maxLevel && item.level > filters.maxLevel) return false;
      if (filters.canEquip && !EquipmentUtils.canEquip(item, filters.canEquip.level, filters.canEquip.class)) return false;
      
      return true;
    });
  }
}