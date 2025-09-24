export enum EquipmentType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  HELMET = 'helmet',
  BOOTS = 'boots',
  ACCESSORY = 'accessory',
  RING = 'ring',
}

export enum EquipmentRarity {
  COMMON = 0,
  UNCOMMON = 1,
  RARE = 2,
  EPIC = 3,
  LEGENDARY = 4,
  MYTHIC = 5,
}

export interface EquipmentStats {
  attack?: number;
  defense?: number;
  hp?: number;
  speed?: number;
  magic?: number;
  critRate?: number;
  critDamage?: number;
  accuracy?: number;
  evasion?: number;
}

export interface Equipment {
  id: string;
  templateId: string;
  name: string;
  type: EquipmentType;
  rarity: EquipmentRarity;
  level: number;
  enhancementLevel: number; // +0 to +15
  stats: EquipmentStats;
  baseStats: EquipmentStats;
  requirements: {
    level: number;
    class?: string[];
  };
  description: string;
  iconId: string;
  sellValue: number;
  enhancementCost: number;
  isEquipped: boolean;
  equippedBy?: string; // Hero ID
  setId?: string; // For equipment sets
  socketCount: number;
  sockets: EquipmentSocket[];
}

export interface EquipmentSocket {
  id: string;
  type: SocketType;
  gem?: Gem;
}

export enum SocketType {
  RED = 'red',     // Strength/Attack
  BLUE = 'blue',   // Intelligence/Magic
  GREEN = 'green', // Agility/Speed
  WHITE = 'white', // Universal
}

export interface Gem {
  id: string;
  name: string;
  type: SocketType;
  rarity: EquipmentRarity;
  stats: EquipmentStats;
  description: string;
}

export interface EquipmentTemplate {
  id: string;
  name: string;
  type: EquipmentType;
  baseRarity: EquipmentRarity;
  baseStats: EquipmentStats;
  statGrowth: EquipmentStats; // Stats per level
  requirements: {
    level: number;
    class?: string[];
  };
  description: string;
  iconId: string;
  setId?: string;
  socketCount: number;
  dropSources: string[]; // Where this equipment can be found
}

export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  pieces: string[]; // Equipment template IDs
  bonuses: {
    2: EquipmentStats; // 2-piece bonus
    4: EquipmentStats; // 4-piece bonus
    6?: EquipmentStats; // 6-piece bonus (for larger sets)
  };
}

// Equipment enhancement costs and success rates
export interface EnhancementData {
  level: number;
  successRate: number;
  goldCost: number;
  materialCost: {
    iron?: number;
    crystal?: number;
    enhancementStone?: number;
  };
  statMultiplier: number; // Multiplier for base stats
}

export const ENHANCEMENT_TABLE: EnhancementData[] = [
  { level: 1, successRate: 100, goldCost: 100, materialCost: { iron: 5 }, statMultiplier: 1.1 },
  { level: 2, successRate: 95, goldCost: 200, materialCost: { iron: 10 }, statMultiplier: 1.2 },
  { level: 3, successRate: 90, goldCost: 400, materialCost: { iron: 20 }, statMultiplier: 1.3 },
  { level: 4, successRate: 85, goldCost: 800, materialCost: { iron: 40, crystal: 2 }, statMultiplier: 1.4 },
  { level: 5, successRate: 80, goldCost: 1600, materialCost: { iron: 80, crystal: 5 }, statMultiplier: 1.5 },
  { level: 6, successRate: 75, goldCost: 3200, materialCost: { crystal: 10, enhancementStone: 1 }, statMultiplier: 1.6 },
  { level: 7, successRate: 70, goldCost: 6400, materialCost: { crystal: 20, enhancementStone: 2 }, statMultiplier: 1.7 },
  { level: 8, successRate: 65, goldCost: 12800, materialCost: { crystal: 40, enhancementStone: 4 }, statMultiplier: 1.8 },
  { level: 9, successRate: 60, goldCost: 25600, materialCost: { crystal: 80, enhancementStone: 8 }, statMultiplier: 1.9 },
  { level: 10, successRate: 55, goldCost: 51200, materialCost: { crystal: 160, enhancementStone: 16 }, statMultiplier: 2.0 },
  { level: 11, successRate: 50, goldCost: 102400, materialCost: { crystal: 320, enhancementStone: 32 }, statMultiplier: 2.2 },
  { level: 12, successRate: 45, goldCost: 204800, materialCost: { crystal: 640, enhancementStone: 64 }, statMultiplier: 2.4 },
  { level: 13, successRate: 40, goldCost: 409600, materialCost: { crystal: 1280, enhancementStone: 128 }, statMultiplier: 2.6 },
  { level: 14, successRate: 35, goldCost: 819200, materialCost: { crystal: 2560, enhancementStone: 256 }, statMultiplier: 2.8 },
  { level: 15, successRate: 30, goldCost: 1638400, materialCost: { crystal: 5120, enhancementStone: 512 }, statMultiplier: 3.0 },
];

export class EquipmentUtils {
  // Calculate equipment stats with level and enhancement
  static calculateStats(equipment: Equipment): EquipmentStats {
    const template = equipment.baseStats;
    const enhancementData = ENHANCEMENT_TABLE[equipment.enhancementLevel] || ENHANCEMENT_TABLE[0];
    const levelMultiplier = 1 + (equipment.level - 1) * 0.1; // 10% per level
    const enhancementMultiplier = enhancementData.statMultiplier;

    const finalStats: EquipmentStats = {};
    
    Object.keys(template).forEach(key => {
      const statKey = key as keyof EquipmentStats;
      const baseValue = template[statKey] || 0;
      finalStats[statKey] = Math.floor(baseValue * levelMultiplier * enhancementMultiplier);
    });

    // Add socket gem stats
    equipment.sockets.forEach(socket => {
      if (socket.gem) {
        Object.keys(socket.gem.stats).forEach(key => {
          const statKey = key as keyof EquipmentStats;
          const gemValue = socket.gem!.stats[statKey] || 0;
          finalStats[statKey] = (finalStats[statKey] || 0) + gemValue;
        });
      }
    });

    return finalStats;
  }

  // Get rarity color for UI
  static getRarityColor(rarity: EquipmentRarity): number {
    switch (rarity) {
      case EquipmentRarity.COMMON: return 0x808080; // Gray
      case EquipmentRarity.UNCOMMON: return 0x00FF00; // Green
      case EquipmentRarity.RARE: return 0x0080FF; // Blue
      case EquipmentRarity.EPIC: return 0x8000FF; // Purple
      case EquipmentRarity.LEGENDARY: return 0xFFD700; // Gold
      case EquipmentRarity.MYTHIC: return 0xFF6600; // Orange
      default: return 0x808080;
    }
  }

  // Get rarity name
  static getRarityName(rarity: EquipmentRarity): string {
    switch (rarity) {
      case EquipmentRarity.COMMON: return 'Common';
      case EquipmentRarity.UNCOMMON: return 'Uncommon';
      case EquipmentRarity.RARE: return 'Rare';
      case EquipmentRarity.EPIC: return 'Epic';
      case EquipmentRarity.LEGENDARY: return 'Legendary';
      case EquipmentRarity.MYTHIC: return 'Mythic';
      default: return 'Unknown';
    }
  }

  // Get enhancement level display name
  static getEnhancementDisplayName(level: number): string {
    return level > 0 ? `+${level}` : '';
  }

  // Calculate enhancement cost
  static getEnhancementCost(currentLevel: number): EnhancementData | null {
    if (currentLevel >= ENHANCEMENT_TABLE.length) return null;
    return ENHANCEMENT_TABLE[currentLevel];
  }

  // Calculate equipment power/score for comparison
  static calculatePower(equipment: Equipment): number {
    const stats = this.calculateStats(equipment);
    
    // Weight different stats
    const weights = {
      attack: 2,
      defense: 1.5,
      hp: 0.5,
      speed: 1,
      magic: 2,
      critRate: 3,
      critDamage: 2,
      accuracy: 1,
      evasion: 1,
    };

    let power = 0;
    Object.keys(stats).forEach(key => {
      const statKey = key as keyof EquipmentStats;
      const value = stats[statKey] || 0;
      const weight = weights[statKey] || 1;
      power += value * weight;
    });

    return Math.floor(power);
  }

  // Check if equipment can be equipped by hero
  static canEquip(equipment: Equipment, heroLevel: number, heroClass: string): boolean {
    if (heroLevel < equipment.requirements.level) return false;
    
    if (equipment.requirements.class && equipment.requirements.class.length > 0) {
      return equipment.requirements.class.includes(heroClass);
    }
    
    return true;
  }

  // Generate random equipment stats within rarity bounds
  static generateRandomStats(baseStats: EquipmentStats, rarity: EquipmentRarity): EquipmentStats {
    const rarityMultiplier = 1 + rarity * 0.25; // 25% increase per rarity tier
    const variance = 0.2; // ±20% variance
    
    const randomStats: EquipmentStats = {};
    
    Object.keys(baseStats).forEach(key => {
      const statKey = key as keyof EquipmentStats;
      const baseValue = baseStats[statKey] || 0;
      const multipliedValue = baseValue * rarityMultiplier;
      const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
      randomStats[statKey] = Math.floor(multipliedValue * randomFactor);
    });

    return randomStats;
  }

  // Create empty sockets for equipment
  static createSockets(count: number): EquipmentSocket[] {
    const sockets: EquipmentSocket[] = [];
    
    for (let i = 0; i < count; i++) {
      // Randomly assign socket types
      const types = Object.values(SocketType);
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      sockets.push({
        id: `socket_${Date.now()}_${i}`,
        type: randomType,
        gem: undefined,
      });
    }
    
    return sockets;
  }
}