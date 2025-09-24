import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';
import { GachaSystem } from '../systems/GachaSystem';
import { ResourceManager } from '../systems/ResourceManager';
import { HeroCollection } from '../systems/HeroCollection';
import { Hero, HeroRarity } from '../entities/Hero';

export class SummonScene extends Scene {
  private title!: PIXI.Text;
  private backButton!: Button;
  private summonButton!: Button;
  private summon10Button!: Button;
  private resourceDisplay!: PIXI.Text;
  private lastSummonResult!: PIXI.Container;
  private ratesDisplay!: PIXI.Text;

  private gachaSystem!: GachaSystem;
  private resourceManager!: ResourceManager;
  private heroCollection!: HeroCollection;

  init(): void {
    // Get systems from application
    this.eventBus?.on('systems-initialized', (systems: any) => {
      this.gachaSystem = new GachaSystem(this.eventBus!);
      this.resourceManager = systems.resourceManager;
      this.heroCollection = systems.heroCollection;
    });
    
    // Fallback initialization
    if (!this.resourceManager) {
      this.resourceManager = new ResourceManager(this.eventBus!);
    }
    if (!this.gachaSystem) {
      this.gachaSystem = new GachaSystem(this.eventBus!);
    }

    this.createBackground();
    this.createTitle();
    this.createResourceDisplay();
    this.createRatesDisplay();
    this.createButtons();
    this.createResultArea();
    this.layoutElements();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for resource updates
    this.eventBus?.on('resource-spent', () => this.updateResourceDisplay());
    this.eventBus?.on('resources-gained', () => this.updateResourceDisplay());
    this.eventBus?.on('hero-summoned', (data) => this.displaySummonResult(data.hero));
    this.eventBus?.on('multi-summon-completed', (data) => this.displayMultiSummonResult(data.heroes));
    this.eventBus?.on('collection-full', () => this.showCollectionFullWarning());
    this.eventBus?.on('insufficient-resources', (data) => this.showInsufficientResourcesWarning(data));
  }

  update(): void {
    // Summon scene updates
  }

  cleanup(): void {
    this.removeChildren();
    this.eventBus?.off('resource-spent', () => this.updateResourceDisplay());
    this.eventBus?.off('hero-summoned', (data) => this.displaySummonResult(data.hero));
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill(0x1a1a3e);
    this.addChild(bg);

    // Add mystical circle
    const circle = new PIXI.Graphics();
    circle.circle(512, 450, 120);
    circle.stroke({ width: 3, color: 0x6a5acd });
    circle.circle(512, 450, 100);
    circle.stroke({ width: 2, color: 0x9370db });
    this.addChild(circle);
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: 'Hero Summoning',
      style: {
        fontSize: 48,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    this.title.anchor.set(0.5);
    this.addChild(this.title);
  }

  private createResourceDisplay(): void {
    this.resourceDisplay = new PIXI.Text({
      text: '',
      style: {
        fontSize: 18,
        fill: 0xffd700,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    this.resourceDisplay.anchor.set(0.5, 0);
    this.addChild(this.resourceDisplay);
    this.updateResourceDisplay();
  }

  private createRatesDisplay(): void {
    const rates = GachaSystem.STANDARD_RATES;
    const ratesText = `Drop Rates:
★★★★★ Legendary: ${rates[HeroRarity.LEGENDARY]}%
★★★★ Epic: ${rates[HeroRarity.EPIC]}%
★★★ Rare: ${rates[HeroRarity.RARE]}%
★★ Uncommon: ${rates[HeroRarity.UNCOMMON]}%
★ Common: ${rates[HeroRarity.COMMON]}%`;

    this.ratesDisplay = new PIXI.Text({
      text: ratesText,
      style: {
        fontSize: 14,
        fill: 0xcccccc,
        fontFamily: 'Arial',
        align: 'left',
      },
    });
    this.addChild(this.ratesDisplay);
  }

  private createButtons(): void {
    this.backButton = new Button('Back to Menu', 150, 50);
    this.backButton.onClick = () => {
      this.eventBus?.emit('scene-change', 'menu');
    };

    this.summonButton = new Button('Summon 1 Hero', 200, 60);
    this.summonButton.onClick = () => {
      this.performSummon(1);
    };

    this.summon10Button = new Button('Summon 10 Heroes', 200, 60);
    this.summon10Button.onClick = () => {
      this.performSummon(10);
    };

    this.addChild(this.backButton);
    this.addChild(this.summonButton);
    this.addChild(this.summon10Button);

    this.updateButtonStates();
  }

  private createResultArea(): void {
    this.lastSummonResult = new PIXI.Container();
    this.addChild(this.lastSummonResult);
  }

  private performSummon(count: number): void {
    if (!this.heroCollection) {
      this.showMessage('Hero collection not initialized!', 0xff4444);
      return;
    }

    const summonType = count === 1 ? 'basic' : 'premium';
    
    // Check collection space
    const currentHeroes = this.heroCollection.getHeroCount();
    const maxHeroes = this.heroCollection.getExtendedStats().maxHeroes;
    
    if (currentHeroes + count > maxHeroes) {
      this.showCollectionFullWarning();
      return;
    }

    // Perform summon using HeroCollection
    if (count === 1) {
      const hero = this.heroCollection.summonHero(summonType);
      if (hero) {
        this.displaySummonResult(hero);
      }
      console.log(`Summoned: ${hero.name} (${hero.rarity}★)`);
    } else {
      const heroes = this.heroCollection.summonMultiple(count, summonType);
      this.displayMultipleSummonResults(heroes);
      console.log(`Summoned ${count} heroes!`);
    }

    this.updateButtonStates();
  }

  private displaySummonResult(hero: Hero): void {
    this.lastSummonResult.removeChildren();

    // Create hero display
    const heroCard = this.createHeroCard(hero);
    heroCard.position.set(512, 450);
    this.lastSummonResult.addChild(heroCard);

    // Show celebration effect
    this.showSummonEffect(hero.rarity);
  }

  private displayMultipleSummonResults(heroes: Hero[]): void {
    this.lastSummonResult.removeChildren();

    const summaryText = new PIXI.Text({
      text: `Summoned ${heroes.length} heroes!`,
      style: {
        fontSize: 24,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    summaryText.anchor.set(0.5);
    summaryText.position.set(512, 400);
    this.lastSummonResult.addChild(summaryText);

    // Show rarity breakdown
    const rarityCount = {
      [HeroRarity.LEGENDARY]: 0,
      [HeroRarity.EPIC]: 0,
      [HeroRarity.RARE]: 0,
      [HeroRarity.UNCOMMON]: 0,
      [HeroRarity.COMMON]: 0,
    };

    heroes.forEach(hero => rarityCount[hero.rarity]++);

    const breakdownText = Object.entries(rarityCount)
      .filter(([, count]) => count > 0)
      .map(([rarity, count]) => `${rarity}★: ${count}`)
      .join('  ');

    const breakdown = new PIXI.Text({
      text: breakdownText,
      style: {
        fontSize: 16,
        fill: 0xcccccc,
        fontFamily: 'Arial',
      },
    });
    breakdown.anchor.set(0.5);
    breakdown.position.set(512, 430);
    this.lastSummonResult.addChild(breakdown);

    // Show best hero
    const bestHero = heroes.reduce((best, current) => 
      current.rarity > best.rarity ? current : best
    );
    this.showSummonEffect(bestHero.rarity);
  }

  private createHeroCard(hero: Hero): PIXI.Container {
    const card = new PIXI.Container();

    // Card background
    const bg = new PIXI.Graphics();
    bg.roundRect(-60, -80, 120, 160, 8);
    bg.fill(this.getRarityColor(hero.rarity));
    bg.stroke({ width: 2, color: 0xffffff });
    card.addChild(bg);

    // Hero name
    const nameText = new PIXI.Text({
      text: hero.name,
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 110,
      },
    });
    nameText.anchor.set(0.5);
    nameText.position.set(0, -50);
    card.addChild(nameText);

    // Rarity stars
    const starsText = new PIXI.Text({
      text: '★'.repeat(hero.rarity),
      style: {
        fontSize: 16,
        fill: 0xffd700,
        fontFamily: 'Arial',
      },
    });
    starsText.anchor.set(0.5);
    starsText.position.set(0, -25);
    card.addChild(starsText);

    // Hero type
    const typeText = new PIXI.Text({
      text: hero.type.toUpperCase(),
      style: {
        fontSize: 12,
        fill: 0xcccccc,
        fontFamily: 'Arial',
      },
    });
    typeText.anchor.set(0.5);
    typeText.position.set(0, 10);
    card.addChild(typeText);

    // Stats preview
    const statsText = new PIXI.Text({
      text: `ATK: ${hero.stats.attack}  DEF: ${hero.stats.defense}\nHP: ${hero.stats.hp}`,
      style: {
        fontSize: 10,
        fill: 0xaaaaaa,
        fontFamily: 'Arial',
        align: 'center',
      },
    });
    statsText.anchor.set(0.5);
    statsText.position.set(0, 40);
    card.addChild(statsText);

    return card;
  }

  private getRarityColor(rarity: HeroRarity): number {
    switch (rarity) {
      case HeroRarity.LEGENDARY: return 0xff6b35;
      case HeroRarity.EPIC: return 0x9b59b6;
      case HeroRarity.RARE: return 0x3498db;
      case HeroRarity.UNCOMMON: return 0x2ecc71;
      case HeroRarity.COMMON: return 0x95a5a6;
      default: return 0x7f8c8d;
    }
  }

  private showSummonEffect(rarity: HeroRarity): void {
    // Create sparkle effect based on rarity
    const sparkles = new PIXI.Graphics();
    const color = this.getRarityColor(rarity);
    
    for (let i = 0; i < rarity * 5; i++) {
      const x = (Math.random() - 0.5) * 300;
      const y = (Math.random() - 0.5) * 300;
      sparkles.star(x, y, 5, 4, 0, 0);
      sparkles.fill(color);
    }
    
    sparkles.position.set(512, 450);
    this.addChild(sparkles);
    
    // Remove sparkles after animation
    setTimeout(() => {
      this.removeChild(sparkles);
    }, 2000);
  }

  private showMessage(text: string, color: number = 0xffffff): void {
    const message = new PIXI.Text({
      text,
      style: {
        fontSize: 24,
        fill: color,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    message.anchor.set(0.5);
    message.position.set(512, 350);
    this.addChild(message);

    setTimeout(() => {
      this.removeChild(message);
    }, 2000);
  }

  private updateResourceDisplay(): void {
    const resources = this.resourceManager.getAllResources();
    const heroStats = this.heroCollection ? this.heroCollection.getExtendedStats() : { totalHeroes: 0, maxHeroes: 50 };
    
    this.resourceDisplay.text = `Gold: ${resources.gold} | Crystals: ${resources.mana} | Heroes: ${heroStats.totalHeroes}/${heroStats.maxHeroes}`;
  }

  private displayMultiSummonResult(heroes: Hero[]): void {
    this.displayMultipleSummonResults(heroes);
  }

  private showCollectionFullWarning(): void {
    this.showMessage('Collection is full! Expand your collection or release heroes.', 0xffa500);
  }

  private showInsufficientResourcesWarning(data: any): void {
    this.showMessage(`Not enough ${data.type}! Need ${data.required}.`, 0xff4444);
  }

  private updateButtonStates(): void {
    const resources = this.resourceManager.getResources();
    const singleCost = GachaSystem.STANDARD_POOL.cost;
    const multiCost = singleCost * 10;

    this.summonButton.setEnabled(resources.gold >= singleCost);
    this.summon10Button.setEnabled(resources.gold >= multiCost);

    // Update button text with costs
    this.summonButton.setText(`Summon 1 (${singleCost} Gold)`);
    this.summon10Button.setText(`Summon 10 (${multiCost} Gold)`);
  }

  private layoutElements(): void {
    this.title.position.set(512, 80);
    this.backButton.position.set(100, 50);
    this.resourceDisplay.position.set(512, 120);
    this.ratesDisplay.position.set(50, 200);
    this.summonButton.position.set(300, 600);
    this.summon10Button.position.set(700, 600);
  }
}