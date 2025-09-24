import { Hero, HeroRarity, HeroType, Element, HeroFactory } from '../entities/Hero';
import { EventBus } from '../core/EventBus';

export interface CollectionFilters {
  rarity?: HeroRarity;
  type?: HeroType;
  element?: Element;
  search?: string;
}

export interface CollectionSort {
  field: 'name' | 'rarity' | 'level' | 'type' | 'summonedAt';
  order: 'asc' | 'desc';
}

export class HeroCollection {
  private heroes: Map<string, Hero> = new Map();
  private eventBus: EventBus;
  private selectedHero: string | null = null;
  private maxHeroes: number = 50;
  private totalSummoned: number = 0;

  // Summon costs and rates
  private readonly SUMMON_COSTS = {
    basic: 100,
    premium: 300,
    elite: 1000,
  };

  private readonly RARITY_RATES = {
    basic: [60, 25, 12, 2, 1],    // 1-5 star rates
    premium: [30, 35, 25, 8, 2],  // Better rates
    elite: [0, 15, 35, 35, 15],   // Guaranteed 4+ star
  };

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for new heroes being summoned
    this.eventBus.on('hero-summoned', (data) => {
      this.addHero(data.hero);
    });

    // Listen for save data loading
    this.eventBus.on('save-loaded', (saveData: any) => {
      if (saveData.heroCollection) {
        this.deserialize(saveData.heroCollection);
      }
    });

    // Listen for new game initialization
    this.eventBus.on('new-game', () => {
      this.generateStarterHeroes();
    });
  }

  // Collection management
  addHero(hero: Hero): boolean {
    if (this.heroes.size >= this.maxHeroes) {
      console.warn('Hero collection is full!');
      this.eventBus.emit('collection-full', { maxHeroes: this.maxHeroes });
      return false;
    }

    this.heroes.set(hero.id, hero);
    
    // Auto-select first hero if none selected
    if (!this.selectedHero) {
      this.selectedHero = hero.id;
    }

    // Emit hero creation event for other systems
    this.eventBus.emit('hero-created', { hero });
    this.eventBus.emit('hero-added-to-collection', { hero, totalCount: this.heroes.size });
    
    console.log(`Added ${hero.name} to collection (${this.heroes.size}/${this.maxHeroes})`);
    return true;
  }

  removeHero(heroId: string): boolean {
    const hero = this.heroes.get(heroId);
    if (!hero) return false;

    // Don't allow removing if it's the only hero
    if (this.heroes.size <= 1) {
      console.warn('Cannot remove the last hero!');
      this.eventBus.emit('cannot-remove-last-hero');
      return false;
    }

    this.heroes.delete(heroId);

    // Update selected hero if removed
    if (this.selectedHero === heroId) {
      this.selectedHero = this.heroes.keys().next().value || null;
    }

    this.eventBus.emit('hero-removed-from-collection', { heroId, hero, totalCount: this.heroes.size });
    return true;
  }

  getHero(heroId: string): Hero | undefined {
    return this.heroes.get(heroId);
  }

  getAllHeroes(): Hero[] {
    return Array.from(this.heroes.values());
  }

  getHeroCount(): number {
    return this.heroes.size;
  }

  // Hero selection
  selectHero(heroId: string): boolean {
    if (!this.heroes.has(heroId)) return false;
    
    this.selectedHero = heroId;
    this.eventBus.emit('hero-selected', { heroId, hero: this.heroes.get(heroId) });
    return true;
  }

  getSelectedHero(): Hero | null {
    return this.selectedHero ? this.heroes.get(this.selectedHero) || null : null;
  }

  // Hero summoning
  summonHero(summonType: 'basic' | 'premium' | 'elite' = 'basic'): Hero | null {
    const cost = this.SUMMON_COSTS[summonType];
    
    // Generate hero based on summon type
    const rarity = this.rollRarity(summonType);
    const heroType = this.rollHeroType();
    const hero = HeroFactory.createRandomHero(heroType, rarity);

    // Add to collection
    if (this.addHero(hero)) {
      this.totalSummoned++;
      this.eventBus.emit('hero-summoned', { hero, summonType, cost });
      this.eventBus.emit('resources-consumed', { gold: cost });
      return hero;
    }

    return null;
  }

  summonMultiple(count: number, summonType: 'basic' | 'premium' | 'elite' = 'basic'): Hero[] {
    const summoned: Hero[] = [];
    
    for (let i = 0; i < count; i++) {
      const hero = this.summonHero(summonType);
      if (hero) {
        summoned.push(hero);
      } else {
        break; // Stop if summon failed
      }
    }

    if (summoned.length > 0) {
      this.eventBus.emit('multi-summon-completed', { heroes: summoned, count: summoned.length });
    }

    return summoned;
  }

  // Filtering and sorting
  getFilteredHeroes(filters: CollectionFilters = {}, sort: CollectionSort = { field: 'summonedAt', order: 'desc' }): Hero[] {
    let filtered = Array.from(this.heroes.values());

    // Apply filters
    if (filters.rarity !== undefined) {
      filtered = filtered.filter(hero => hero.rarity === filters.rarity);
    }

    if (filters.type !== undefined) {
      filtered = filtered.filter(hero => hero.type === filters.type);
    }

    if (filters.element !== undefined) {
      filtered = filtered.filter(hero => hero.element === filters.element);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(hero => 
        hero.name.toLowerCase().includes(searchLower) ||
        hero.type.toLowerCase().includes(searchLower) ||
        hero.element.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rarity':
          aValue = a.rarity;
          bValue = b.rarity;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'summonedAt':
          aValue = a.summonedAt;
          bValue = b.summonedAt;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  // Statistics
  getCollectionStats() {
    const stats = {
      total: this.heroes.length,
      byRarity: {
        [HeroRarity.COMMON]: 0,
        [HeroRarity.UNCOMMON]: 0,
        [HeroRarity.RARE]: 0,
        [HeroRarity.EPIC]: 0,
        [HeroRarity.LEGENDARY]: 0,
      },
      byType: {
        [HeroType.WARRIOR]: 0,
        [HeroType.MAGE]: 0,
        [HeroType.HEALER]: 0,
        [HeroType.ROGUE]: 0,
        [HeroType.ARCHER]: 0,
        [HeroType.TANK]: 0,
      },
      byElement: {
        [Element.FIRE]: 0,
        [Element.WATER]: 0,
        [Element.EARTH]: 0,
        [Element.AIR]: 0,
        [Element.LIGHT]: 0,
        [Element.DARK]: 0,
        [Element.NEUTRAL]: 0,
      },
      averageLevel: 0,
      totalPower: 0,
    };

    if (this.heroes.size === 0) return stats;

    let totalLevel = 0;
    let totalPower = 0;

    Array.from(this.heroes.values()).forEach(hero => {
      stats.byRarity[hero.rarity]++;
      stats.byType[hero.type]++;
      stats.byElement[hero.element]++;
      
      totalLevel += hero.level;
      totalPower += this.calculateHeroPower(hero);
    });

    stats.averageLevel = Math.round(totalLevel / this.heroes.size * 100) / 100;
    stats.totalPower = totalPower;

    return stats;
  }

  // Utility methods
  private calculateHeroPower(hero: Hero): number {
    return hero.stats.attack + hero.stats.defense + hero.stats.hp + hero.stats.speed + hero.stats.magic;
  }

  getTopHeroes(count: number = 5): Hero[] {
    return Array.from(this.heroes.values())
      .sort((a, b) => this.calculateHeroPower(b) - this.calculateHeroPower(a))
      .slice(0, count);
  }

  getHeroesByRarity(rarity: HeroRarity): Hero[] {
    return Array.from(this.heroes.values()).filter(hero => hero.rarity === rarity);
  }

  getHeroesByType(type: HeroType): Hero[] {
    return Array.from(this.heroes.values()).filter(hero => hero.type === type);
  }

  getHeroesByElement(element: Element): Hero[] {
    return Array.from(this.heroes.values()).filter(hero => hero.element === element);
  }

  // Helper methods
  private rollRarity(summonType: 'basic' | 'premium' | 'elite'): number {
    const rates = this.RARITY_RATES[summonType];
    const roll = Math.random() * 100;
    let cumulative = 0;

    for (let rarity = 1; rarity <= 5; rarity++) {
      cumulative += rates[rarity - 1];
      if (roll <= cumulative) {
        return rarity;
      }
    }
    return 1; // Fallback
  }

  private rollHeroType(): HeroType {
    const types = Object.values(HeroType);
    return types[Math.floor(Math.random() * types.length)];
  }

  // Collection expansion
  expandCollection(additionalSlots: number = 10): boolean {
    const expansionCost = this.calculateExpansionCost(additionalSlots);
    
    this.maxHeroes += additionalSlots;
    this.eventBus.emit('collection-expanded', { 
      newMaxHeroes: this.maxHeroes, 
      additionalSlots,
      cost: expansionCost 
    });

    console.log(`Collection expanded to ${this.maxHeroes} slots`);
    return true;
  }

  private calculateExpansionCost(slots: number): number {
    const baseCost = 1000;
    const currentExpansions = Math.floor((this.maxHeroes - 50) / 10);
    const expansionMultiplier = 1 + (currentExpansions * 0.5);
    return Math.floor(baseCost * slots * expansionMultiplier);
  }

  // Release hero for rewards
  releaseHero(heroId: string): boolean {
    const hero = this.heroes.get(heroId);
    if (!hero) return false;

    const rewards = this.calculateReleaseRewards(hero);
    
    if (this.removeHero(heroId)) {
      this.eventBus.emit('hero-released', { hero, rewards });
      this.eventBus.emit('resources-gained', rewards);
      console.log(`Released ${hero.name} for rewards:`, rewards);
      return true;
    }
    return false;
  }

  private calculateReleaseRewards(hero: Hero): { gold: number; experience: number } {
    const baseReward = hero.rarity * 50;
    const levelBonus = hero.level * 10;
    
    return {
      gold: baseReward + levelBonus,
      experience: hero.level * 25,
    };
  }

  // Favorites and teams
  getFavoriteHeroes(): Hero[] {
    return Array.from(this.heroes.values()).filter(hero => hero.personalityTraits?.includes('favorite'));
  }

  toggleFavorite(heroId: string): boolean {
    const hero = this.getHero(heroId);
    if (!hero) return false;

    const favoriteIndex = hero.personalityTraits.indexOf('favorite');
    if (favoriteIndex !== -1) {
      hero.personalityTraits.splice(favoriteIndex, 1);
    } else {
      hero.personalityTraits.push('favorite');
    }

    this.eventBus.emit('hero-favorite-toggled', { hero, isFavorite: favoriteIndex === -1 });
    return true;
  }

  // Generate starter heroes for new players
  generateStarterHeroes(): void {
    const starterTypes = [HeroType.WARRIOR, HeroType.MAGE, HeroType.ARCHER];
    
    starterTypes.forEach(type => {
      const hero = HeroFactory.createRandomHero(type, 2); // 2-star starters
      this.addHero(hero);
    });

    console.log('Generated starter heroes');
    this.eventBus.emit('starter-heroes-generated', { count: starterTypes.length });
  }

  // Testing method
  giveTestHeroes(count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const type = this.rollHeroType();
      const rarity = Math.floor(Math.random() * 5) + 1;
      const hero = HeroFactory.createRandomHero(type, rarity);
      this.addHero(hero);
    }
    console.log(`Generated ${count} test heroes`);
  }

  // Enhanced collection stats
  getExtendedStats() {
    const basicStats = this.getCollectionStats();
    return {
      ...basicStats,
      maxHeroes: this.maxHeroes,
      totalSummoned: this.totalSummoned,
      selectedHero: this.selectedHero,
      collectionValue: this.calculateCollectionValue(),
    };
  }

  private calculateCollectionValue(): number {
    return Array.from(this.heroes.values()).reduce((total, hero) => {
      return total + (hero.rarity * 100) + (hero.level * 10);
    }, 0);
  }

  // Save/Load
  serialize(): any {
    return {
      heroes: Array.from(this.heroes.entries()),
      selectedHero: this.selectedHero,
      maxHeroes: this.maxHeroes,
      totalSummoned: this.totalSummoned,
    };
  }

  deserialize(data: any): void {
    if (!data) return;

    if (data.heroes) {
      this.heroes = new Map(data.heroes.map(([id, heroData]: [string, any]) => [
        id,
        {
          ...heroData,
          bonds: new Map(Object.entries(heroData.bonds || {})),
        },
      ]));
    }

    this.selectedHero = data.selectedHero || null;
    this.maxHeroes = data.maxHeroes || 50;
    this.totalSummoned = data.totalSummoned || 0;

    // Validate selected hero exists
    if (this.selectedHero && !this.heroes.has(this.selectedHero)) {
      this.selectedHero = this.heroes.size > 0 ? this.heroes.keys().next().value : null;
    }

    console.log(`Loaded hero collection with ${this.heroes.size} heroes`);
    this.eventBus.emit('collection-loaded', { heroes: Array.from(this.heroes.values()), count: this.heroes.size });
  }

  clear(): void {
    this.heroes.clear();
    this.selectedHero = null;
    this.totalSummoned = 0;
    this.eventBus.emit('collection-cleared');
  }

  // Cleanup
  destroy(): void {
    this.clear();
  }
}