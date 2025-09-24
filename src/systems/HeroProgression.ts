import { EventBus } from '../core/EventBus';
import { Hero, HeroStats } from '../entities/Hero';

export interface LevelUpReward {
  statPoints: number;
  skillUnlock?: string;
  specialReward?: {
    type: 'equipment' | 'currency' | 'skill_points';
    amount: number;
    item?: string;
  };
}

export interface AscensionRequirement {
  level: number;
  materials: {
    [key: string]: number;
  };
  gold: number;
}

export interface HeroProgressionData {
  heroId: string;
  totalExperience: number;
  currentLevelExp: number;
  statPoints: number; // Unallocated stat points
  skillPoints: number; // For learning new skills
  ascensionLevel: number;
  unlockedSkills: string[];
}

export class HeroProgression {
  private eventBus: EventBus;
  private heroProgressionData: Map<string, HeroProgressionData> = new Map();
  
  // Experience constants
  private readonly BASE_EXP_REQUIRED = 100;
  private readonly EXP_GROWTH_RATE = 1.15;
  private readonly MAX_LEVEL = 100;
  private readonly MAX_ASCENSION = 5;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for combat experience gains
    this.eventBus.on('hero-gained-experience', (data: { heroId: string; experience: number }) => {
      this.gainExperience(data.heroId, data.experience);
    });

    // Listen for hero creation
    this.eventBus.on('hero-created', (data: { hero: Hero }) => {
      this.initializeHeroProgression(data.hero);
    });

    // Auto-battle experience gains
    this.eventBus.on('enemy-defeated', (data: any) => {
      if (data.hero && data.rewards?.experience) {
        this.gainExperience(data.hero.id, data.rewards.experience);
      }
    });
  }

  // Initialize progression data for new hero
  private initializeHeroProgression(hero: Hero): void {
    if (this.heroProgressionData.has(hero.id)) return;

    const progressionData: HeroProgressionData = {
      heroId: hero.id,
      totalExperience: 0,
      currentLevelExp: 0,
      statPoints: 0,
      skillPoints: 1, // Start with 1 skill point
      ascensionLevel: 0,
      unlockedSkills: [],
    };

    this.heroProgressionData.set(hero.id, progressionData);
    console.log(`Initialized progression for ${hero.name}`);
  }

  // Core experience and leveling system
  gainExperience(heroId: string, experience: number): boolean {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData) {
      console.warn(`No progression data found for hero ${heroId}`);
      return false;
    }

    const oldLevel = this.getHeroLevel(heroId);
    const maxLevel = this.getMaxLevel(progressionData.ascensionLevel);

    if (oldLevel >= maxLevel) {
      console.log(`Hero ${heroId} is at max level for ascension ${progressionData.ascensionLevel}`);
      return false;
    }

    // Add experience
    progressionData.totalExperience += experience;
    progressionData.currentLevelExp += experience;

    // Check for level ups
    let leveledUp = false;
    while (progressionData.currentLevelExp >= this.getExpRequiredForLevel(oldLevel + (leveledUp ? 1 : 0))) {
      const currentLevel = oldLevel + (leveledUp ? 1 : 0);
      const expRequired = this.getExpRequiredForLevel(currentLevel);
      
      if (currentLevel >= maxLevel) break;

      progressionData.currentLevelExp -= expRequired;
      leveledUp = true;

      this.handleLevelUp(heroId, currentLevel + 1);
    }

    if (leveledUp) {
      this.eventBus.emit('hero-leveled-up', {
        heroId,
        oldLevel,
        newLevel: this.getHeroLevel(heroId),
        progressionData
      });
    }

    return leveledUp;
  }

  private handleLevelUp(heroId: string, newLevel: number): void {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData) return;

    // Award level up rewards
    const reward = this.getLevelUpReward(newLevel);
    progressionData.statPoints += reward.statPoints;
    progressionData.skillPoints += 1; // Always give 1 skill point per level

    // Unlock skills
    if (reward.skillUnlock && !progressionData.unlockedSkills.includes(reward.skillUnlock)) {
      progressionData.unlockedSkills.push(reward.skillUnlock);
      this.eventBus.emit('skill-unlocked', {
        heroId,
        skill: reward.skillUnlock,
        level: newLevel
      });
    }

    // Special rewards
    if (reward.specialReward) {
      this.eventBus.emit('level-up-reward', {
        heroId,
        level: newLevel,
        reward: reward.specialReward
      });
    }

    this.eventBus.emit('hero-stats-changed', { heroId });
    console.log(`Hero ${heroId} reached level ${newLevel}! Gained ${reward.statPoints} stat points.`);
  }

  // Experience calculations
  getExpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(this.BASE_EXP_REQUIRED * Math.pow(this.EXP_GROWTH_RATE, level - 2));
  }

  getTotalExpForLevel(level: number): number {
    let total = 0;
    for (let i = 2; i <= level; i++) {
      total += this.getExpRequiredForLevel(i);
    }
    return total;
  }

  getExpToNextLevel(heroId: string): number {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData) return 0;

    const currentLevel = this.getHeroLevel(heroId);
    const expRequired = this.getExpRequiredForLevel(currentLevel + 1);
    return Math.max(0, expRequired - progressionData.currentLevelExp);
  }

  getHeroLevel(heroId: string): number {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData) return 1;

    let level = 1;
    let expNeeded = 0;
    
    while (expNeeded <= progressionData.totalExperience) {
      level++;
      expNeeded += this.getExpRequiredForLevel(level);
      
      const maxLevel = this.getMaxLevel(progressionData.ascensionLevel);
      if (level >= maxLevel) break;
    }

    return Math.max(1, level - 1);
  }

  // Stat point allocation
  allocateStatPoint(heroId: string, stat: keyof HeroStats, points: number = 1): boolean {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData || progressionData.statPoints < points) {
      return false;
    }

    progressionData.statPoints -= points;
    
    // Emit event for hero manager to update stats
    this.eventBus.emit('stat-points-allocated', {
      heroId,
      stat,
      points,
      remainingPoints: progressionData.statPoints
    });

    this.eventBus.emit('hero-stats-changed', { heroId });
    return true;
  }

  // Calculate hero's final stats including base + allocated points + equipment
  calculateHeroStats(hero: Hero, allocatedStats?: Partial<HeroStats>, equipmentStats?: Partial<HeroStats>): HeroStats {
    const level = this.getHeroLevel(hero.id);
    const progressionData = this.heroProgressionData.get(hero.id);

    // Base stats from template + level growth
    const template = hero; // Assume hero has template data
    let finalStats: HeroStats = {
      attack: template.stats.attack,
      defense: template.stats.defense,
      hp: template.stats.hp,
      speed: template.stats.speed,
      magic: template.stats.magic,
    };

    // Apply level growth (assume 5% per level)
    const levelMultiplier = 1 + ((level - 1) * 0.05);
    Object.keys(finalStats).forEach(key => {
      const statKey = key as keyof HeroStats;
      finalStats[statKey] = Math.floor(finalStats[statKey] * levelMultiplier);
    });

    // Add allocated stat points
    if (allocatedStats) {
      Object.keys(allocatedStats).forEach(key => {
        const statKey = key as keyof HeroStats;
        const allocated = allocatedStats[statKey] || 0;
        finalStats[statKey] += allocated;
      });
    }

    // Add equipment bonuses
    if (equipmentStats) {
      Object.keys(equipmentStats).forEach(key => {
        const statKey = key as keyof HeroStats;
        const equipmentBonus = equipmentStats[statKey] || 0;
        finalStats[statKey] += equipmentBonus;
      });
    }

    // Apply ascension bonuses
    if (progressionData && progressionData.ascensionLevel > 0) {
      const ascensionBonus = 1 + (progressionData.ascensionLevel * 0.1); // 10% per ascension
      Object.keys(finalStats).forEach(key => {
        const statKey = key as keyof HeroStats;
        finalStats[statKey] = Math.floor(finalStats[statKey] * ascensionBonus);
      });
    }

    return finalStats;
  }

  // Ascension system
  canAscend(heroId: string): boolean {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData) return false;

    const currentLevel = this.getHeroLevel(heroId);
    const maxLevel = this.getMaxLevel(progressionData.ascensionLevel);
    
    return currentLevel >= maxLevel && 
           progressionData.ascensionLevel < this.MAX_ASCENSION;
  }

  getAscensionRequirements(heroId: string): AscensionRequirement | null {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData || !this.canAscend(heroId)) return null;

    const nextAscension = progressionData.ascensionLevel + 1;
    
    return {
      level: this.getMaxLevel(progressionData.ascensionLevel),
      materials: {
        'ascension_crystal': nextAscension * 2,
        'crystal': nextAscension * 50,
        'iron': nextAscension * 100,
      },
      gold: nextAscension * 10000,
    };
  }

  ascendHero(heroId: string): boolean {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData || !this.canAscend(heroId)) return false;

    const requirements = this.getAscensionRequirements(heroId);
    if (!requirements) return false;

    // Check if player has required resources (would integrate with ResourceManager)
    // For now, assume they do

    // Perform ascension
    progressionData.ascensionLevel++;
    progressionData.currentLevelExp = 0; // Reset current level exp
    progressionData.statPoints += 5; // Bonus stat points for ascension
    progressionData.skillPoints += 3; // Bonus skill points

    this.eventBus.emit('hero-ascended', {
      heroId,
      newAscensionLevel: progressionData.ascensionLevel,
      requirements
    });

    this.eventBus.emit('hero-stats-changed', { heroId });
    console.log(`Hero ${heroId} ascended to level ${progressionData.ascensionLevel}!`);
    return true;
  }

  // Helper methods
  private getMaxLevel(ascensionLevel: number): number {
    return Math.min(this.MAX_LEVEL, 20 + (ascensionLevel * 20));
  }

  private getLevelUpReward(level: number): LevelUpReward {
    const baseReward: LevelUpReward = {
      statPoints: 2, // Standard 2 stat points per level
    };

    // Milestone rewards
    if (level % 10 === 0) {
      baseReward.statPoints += 3; // Bonus points every 10 levels
      baseReward.specialReward = {
        type: 'currency',
        amount: level * 100,
      };
    }

    // Skill unlocks at specific levels
    if (level === 5) baseReward.skillUnlock = 'basic_skill_1';
    if (level === 15) baseReward.skillUnlock = 'basic_skill_2';
    if (level === 25) baseReward.skillUnlock = 'advanced_skill_1';
    if (level === 40) baseReward.skillUnlock = 'advanced_skill_2';
    if (level === 60) baseReward.skillUnlock = 'ultimate_skill';

    return baseReward;
  }

  // Getters and utility methods
  getProgressionData(heroId: string): HeroProgressionData | undefined {
    return this.heroProgressionData.get(heroId);
  }

  getHeroStats(heroId: string): { level: number; experience: number; expToNext: number; statPoints: number; skillPoints: number } {
    const progressionData = this.heroProgressionData.get(heroId);
    if (!progressionData) {
      return { level: 1, experience: 0, expToNext: this.getExpRequiredForLevel(2), statPoints: 0, skillPoints: 0 };
    }

    return {
      level: this.getHeroLevel(heroId),
      experience: progressionData.totalExperience,
      expToNext: this.getExpToNextLevel(heroId),
      statPoints: progressionData.statPoints,
      skillPoints: progressionData.skillPoints,
    };
  }

  getAllProgressionData(): Map<string, HeroProgressionData> {
    return new Map(this.heroProgressionData);
  }

  // Save/Load system
  serialize(): any {
    return {
      heroProgressionData: Array.from(this.heroProgressionData.entries()),
    };
  }

  deserialize(data: any): void {
    if (data.heroProgressionData) {
      this.heroProgressionData = new Map(data.heroProgressionData);
    }
  }

  // Debug and testing methods
  giveExperience(heroId: string, amount: number): void {
    this.gainExperience(heroId, amount);
  }

  setHeroLevel(heroId: string, targetLevel: number): void {
    const totalExpNeeded = this.getTotalExpForLevel(targetLevel);
    const currentExp = this.heroProgressionData.get(heroId)?.totalExperience || 0;
    
    if (totalExpNeeded > currentExp) {
      this.gainExperience(heroId, totalExpNeeded - currentExp);
    }
  }

  resetHeroProgression(heroId: string): void {
    const progressionData = this.heroProgressionData.get(heroId);
    if (progressionData) {
      progressionData.totalExperience = 0;
      progressionData.currentLevelExp = 0;
      progressionData.statPoints = 0;
      progressionData.skillPoints = 1;
      progressionData.ascensionLevel = 0;
      progressionData.unlockedSkills = [];
      
      this.eventBus.emit('hero-stats-changed', { heroId });
    }
  }
}