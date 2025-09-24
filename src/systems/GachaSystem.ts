import { Hero, HeroFactory, HeroRarity } from '../entities/Hero';
import { HeroDatabase } from '../data/heroes/HeroTemplates';
import { EventBus } from '../core/EventBus';

export interface GachaRates {
  [HeroRarity.COMMON]: number;
  [HeroRarity.UNCOMMON]: number; 
  [HeroRarity.RARE]: number;
  [HeroRarity.EPIC]: number;
  [HeroRarity.LEGENDARY]: number;
}

export interface GachaPool {
  id: string;
  name: string;
  cost: number;
  currency: 'gold' | 'gems';
  rates: GachaRates;
  featuredHeroes?: string[]; // Template IDs
  guaranteedRarity?: HeroRarity;
  guaranteedAfterPulls?: number;
}

export interface GachaPity {
  pulls: number;
  lastLegendary: number;
  lastEpic: number;
}

export class GachaSystem {
  private eventBus: EventBus;
  private pityCounter: GachaPity;

  // Standard gacha rates (percentages)
  public static readonly STANDARD_RATES: GachaRates = {
    [HeroRarity.COMMON]: 50.0,     // 50%
    [HeroRarity.UNCOMMON]: 30.0,   // 30%
    [HeroRarity.RARE]: 15.0,       // 15%
    [HeroRarity.EPIC]: 4.5,        // 4.5%
    [HeroRarity.LEGENDARY]: 0.5,   // 0.5%
  };

  public static readonly STANDARD_POOL: GachaPool = {
    id: 'standard',
    name: 'Standard Summon',
    cost: 1000,
    currency: 'gold',
    rates: GachaSystem.STANDARD_RATES,
    guaranteedAfterPulls: 100, // Guaranteed legendary after 100 pulls
  };

  public static readonly PREMIUM_POOL: GachaPool = {
    id: 'premium',
    name: 'Premium Summon',
    cost: 100,
    currency: 'gems',
    rates: {
      [HeroRarity.COMMON]: 30.0,     // 30%
      [HeroRarity.UNCOMMON]: 35.0,   // 35%
      [HeroRarity.RARE]: 25.0,       // 25%
      [HeroRarity.EPIC]: 9.0,        // 9%
      [HeroRarity.LEGENDARY]: 1.0,   // 1%
    },
    guaranteedAfterPulls: 50, // Guaranteed legendary after 50 pulls
  };

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.pityCounter = {
      pulls: 0,
      lastLegendary: 0,
      lastEpic: 0,
    };
  }

  summonHero(pool: GachaPool = GachaSystem.STANDARD_POOL): Hero {
    this.pityCounter.pulls++;
    
    // Check for guaranteed summon
    let targetRarity = this.determineRarity(pool);
    
    // Apply pity system
    if (pool.guaranteedAfterPulls && 
        this.pityCounter.pulls - this.pityCounter.lastLegendary >= pool.guaranteedAfterPulls) {
      targetRarity = HeroRarity.LEGENDARY;
      this.pityCounter.lastLegendary = this.pityCounter.pulls;
    }

    // Get random hero of the determined rarity
    const template = this.getRandomHeroByRarity(targetRarity, pool);
    const hero = HeroFactory.createFromTemplate(template);

    // Update pity counters
    if (targetRarity === HeroRarity.LEGENDARY) {
      this.pityCounter.lastLegendary = this.pityCounter.pulls;
    } else if (targetRarity === HeroRarity.EPIC) {
      this.pityCounter.lastEpic = this.pityCounter.pulls;
    }

    // Emit summon event
    this.eventBus.emit('hero-summoned', { hero, pool, pity: this.pityCounter });

    return hero;
  }

  summonMultiple(count: number, pool: GachaPool = GachaSystem.STANDARD_POOL): Hero[] {
    const heroes: Hero[] = [];
    for (let i = 0; i < count; i++) {
      heroes.push(this.summonHero(pool));
    }
    
    this.eventBus.emit('multi-summon-completed', { heroes, count, pool });
    return heroes;
  }

  private determineRarity(pool: GachaPool): HeroRarity {
    const random = Math.random() * 100;
    let cumulative = 0;

    // Check rarities from highest to lowest
    const rarities = [
      HeroRarity.LEGENDARY,
      HeroRarity.EPIC,
      HeroRarity.RARE,
      HeroRarity.UNCOMMON,
      HeroRarity.COMMON,
    ];

    for (const rarity of rarities) {
      cumulative += pool.rates[rarity];
      if (random <= cumulative) {
        return rarity;
      }
    }

    // Fallback to common (shouldn't happen with proper rates)
    return HeroRarity.COMMON;
  }

  private getRandomHeroByRarity(rarity: HeroRarity, pool: GachaPool) {
    let availableHeroes = HeroDatabase.getTemplatesByRarity(rarity);

    // If pool has featured heroes, prefer them
    if (pool.featuredHeroes && pool.featuredHeroes.length > 0) {
      const featuredOfRarity = pool.featuredHeroes
        .map(id => HeroDatabase.getTemplate(id))
        .filter((template): template is NonNullable<typeof template> => template !== undefined && template.rarity === rarity);
      
      if (featuredOfRarity.length > 0) {
        // 70% chance to get featured hero of this rarity
        if (Math.random() < 0.7) {
          availableHeroes = featuredOfRarity;
        }
      }
    }

    // Random selection from available heroes
    const randomIndex = Math.floor(Math.random() * availableHeroes.length);
    return availableHeroes[randomIndex];
  }

  // Utility methods
  getPityCounter(): GachaPity {
    return { ...this.pityCounter };
  }

  resetPity(): void {
    this.pityCounter = {
      pulls: 0,
      lastLegendary: 0,
      lastEpic: 0,
    };
  }

  getDropRates(pool: GachaPool): GachaRates {
    return { ...pool.rates };
  }

  calculatePullsUntilGuaranteed(pool: GachaPool): number {
    if (!pool.guaranteedAfterPulls) return -1;
    return Math.max(0, pool.guaranteedAfterPulls - (this.pityCounter.pulls - this.pityCounter.lastLegendary));
  }

  // Simulate summons for testing
  simulateSummons(count: number, pool: GachaPool = GachaSystem.STANDARD_POOL): { [key in HeroRarity]: number } {
    const results = {
      [HeroRarity.COMMON]: 0,
      [HeroRarity.UNCOMMON]: 0,
      [HeroRarity.RARE]: 0,
      [HeroRarity.EPIC]: 0,
      [HeroRarity.LEGENDARY]: 0,
    };

    const originalPity = { ...this.pityCounter };
    
    for (let i = 0; i < count; i++) {
      const rarity = this.determineRarity(pool);
      results[rarity]++;
    }

    // Restore original pity counter
    this.pityCounter = originalPity;

    return results;
  }
}