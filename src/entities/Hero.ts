export enum HeroType {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  HEALER = 'healer',
  ROGUE = 'rogue',
  ARCHER = 'archer',
  TANK = 'tank',
}

export enum HeroRarity {
  COMMON = 1,
  UNCOMMON = 2,
  RARE = 3,
  EPIC = 4,
  LEGENDARY = 5,
}

export enum Element {
  FIRE = 'fire',
  WATER = 'water',
  EARTH = 'earth',
  AIR = 'air',
  LIGHT = 'light',
  DARK = 'dark',
  NEUTRAL = 'neutral',
}

export interface HeroStats {
  attack: number;
  defense: number;
  hp: number;
  speed: number;
  magic: number;
}

export interface HeroTemplate {
  id: string;
  name: string;
  type: HeroType;
  rarity: HeroRarity;
  element: Element;
  baseStats: HeroStats;
  growthRates: HeroStats;
  description: string;
  skills: string[];
  story: string;
}

export interface Hero {
  // Core Identity
  id: string;
  templateId: string;
  name: string;
  type: HeroType;
  rarity: HeroRarity;
  element: Element;
  
  // Progression
  level: number;
  experience: number;
  ascension: number;
  
  // Current Stats (calculated from base + level + equipment)
  stats: HeroStats;
  
  // Equipment & Skills
  equipment: string[]; // Equipment IDs
  unlockedSkills: string[];
  
  // Relationships
  bonds: Map<string, number>; // heroId -> bond level
  
  // Story & Personality
  storyProgress: number;
  personalityTraits: string[];
  
  // Assignment
  assignedFacility?: string;
  inTeam?: boolean;
  
  // Timestamps
  summonedAt: number;
  lastUsed: number;
}

export class HeroFactory {
  static createFromTemplate(template: HeroTemplate): Hero {
    return {
      id: this.generateId(),
      templateId: template.id,
      name: template.name,
      type: template.type,
      rarity: template.rarity,
      element: template.element,
      level: 1,
      experience: 0,
      ascension: 0,
      stats: { ...template.baseStats },
      equipment: [],
      unlockedSkills: template.skills.slice(0, 1), // Start with first skill
      bonds: new Map(),
      storyProgress: 0,
      personalityTraits: [],
      summonedAt: Date.now(),
      lastUsed: 0,
    };
  }

  static calculateStats(hero: Hero, template: HeroTemplate): HeroStats {
    const levelMultiplier = hero.level - 1;
    const ascensionMultiplier = hero.ascension * 0.1;
    
    return {
      attack: Math.floor(
        template.baseStats.attack + 
        (template.growthRates.attack * levelMultiplier) + 
        (template.baseStats.attack * ascensionMultiplier)
      ),
      defense: Math.floor(
        template.baseStats.defense + 
        (template.growthRates.defense * levelMultiplier) + 
        (template.baseStats.defense * ascensionMultiplier)
      ),
      hp: Math.floor(
        template.baseStats.hp + 
        (template.growthRates.hp * levelMultiplier) + 
        (template.baseStats.hp * ascensionMultiplier)
      ),
      speed: Math.floor(
        template.baseStats.speed + 
        (template.growthRates.speed * levelMultiplier) + 
        (template.baseStats.speed * ascensionMultiplier)
      ),
      magic: Math.floor(
        template.baseStats.magic + 
        (template.growthRates.magic * levelMultiplier) + 
        (template.baseStats.magic * ascensionMultiplier)
      ),
    };
  }

  static levelUp(hero: Hero, template: HeroTemplate): boolean {
    const expRequired = this.getExpRequired(hero.level);
    if (hero.experience >= expRequired) {
      hero.level++;
      hero.experience -= expRequired;
      hero.stats = this.calculateStats(hero, template);
      
      // Unlock new skills at certain levels
      if (hero.level % 5 === 0 && hero.unlockedSkills.length < template.skills.length) {
        const nextSkillIndex = hero.unlockedSkills.length;
        hero.unlockedSkills.push(template.skills[nextSkillIndex]);
      }
      
      return true;
    }
    return false;
  }

  static getExpRequired(level: number): number {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  private static generateId(): string {
    return 'hero_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}