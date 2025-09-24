import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';
import { HeroCollection, CollectionFilters, CollectionSort } from '../systems/HeroCollection';
import { Hero, HeroRarity } from '../entities/Hero';

export class HeroesScene extends Scene {
  private title!: PIXI.Text;
  private backButton!: Button;
  private noHeroesText!: PIXI.Text;
  private statsText!: PIXI.Text;
  private heroGrid!: PIXI.Container;
  private filterContainer!: PIXI.Container;

  private heroCollection!: HeroCollection;
  private currentFilters: CollectionFilters = {};
  private currentSort: CollectionSort = { field: 'rarity', order: 'desc' };

  // Filter buttons
  private allButton!: Button;
  private commonButton!: Button;
  private uncommonButton!: Button;
  private rareButton!: Button;
  private epicButton!: Button;
  private legendaryButton!: Button;

  init(): void {
    // Get hero collection from application
    this.eventBus?.on('systems-initialized', (systems: any) => {
      this.heroCollection = systems.heroCollection;
      this.refreshDisplay();
    });

    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createFilters();
    this.createStatsDisplay();
    this.createHeroGrid();
    this.layoutElements();
    this.refreshDisplay();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for collection updates
    this.eventBus?.on('hero-added-to-collection', () => this.refreshDisplay());
    this.eventBus?.on('hero-removed-from-collection', () => this.refreshDisplay());
    this.eventBus?.on('collection-loaded', () => this.refreshDisplay());
    this.eventBus?.on('hero-selected', () => this.refreshDisplay());
    this.eventBus?.on('hero-released', () => this.refreshDisplay());
    this.eventBus?.on('collection-expanded', () => this.refreshDisplay());
  }

  update(): void {
    // Heroes scene updates
  }

  cleanup(): void {
    this.removeChildren();
    this.eventBus?.off('hero-added-to-collection', () => this.refreshDisplay());
    this.eventBus?.off('collection-loaded', () => this.refreshDisplay());
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill(0x2a1a3e);
    this.addChild(bg);
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: 'Hero Collection',
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

  private createButtons(): void {
    this.backButton = new Button('Back to Menu', 150, 50);
    this.backButton.onClick = () => {
      this.eventBus?.emit('scene-change', 'menu');
    };

    this.addChild(this.backButton);
  }

  private createFilters(): void {
    this.filterContainer = new PIXI.Container();
    this.addChild(this.filterContainer);

    // Filter buttons
    this.allButton = new Button('All', 80, 30);
    this.allButton.onClick = () => this.setFilter({});

    this.commonButton = new Button('1★', 60, 30);
    this.commonButton.onClick = () => this.setFilter({ rarity: HeroRarity.COMMON });

    this.uncommonButton = new Button('2★', 60, 30);
    this.uncommonButton.onClick = () => this.setFilter({ rarity: HeroRarity.UNCOMMON });

    this.rareButton = new Button('3★', 60, 30);
    this.rareButton.onClick = () => this.setFilter({ rarity: HeroRarity.RARE });

    this.epicButton = new Button('4★', 60, 30);
    this.epicButton.onClick = () => this.setFilter({ rarity: HeroRarity.EPIC });

    this.legendaryButton = new Button('5★', 60, 30);
    this.legendaryButton.onClick = () => this.setFilter({ rarity: HeroRarity.LEGENDARY });

    this.filterContainer.addChild(this.allButton);
    this.filterContainer.addChild(this.commonButton);
    this.filterContainer.addChild(this.uncommonButton);
    this.filterContainer.addChild(this.rareButton);
    this.filterContainer.addChild(this.epicButton);
    this.filterContainer.addChild(this.legendaryButton);
  }

  private createStatsDisplay(): void {
    this.statsText = new PIXI.Text({
      text: '',
      style: {
        fontSize: 16,
        fill: 0xcccccc,
        fontFamily: 'Arial',
        align: 'left',
      },
    });
    this.addChild(this.statsText);
  }

  private createHeroGrid(): void {
    this.heroGrid = new PIXI.Container();
    this.addChild(this.heroGrid);

    this.noHeroesText = new PIXI.Text({
      text: 'No heroes summoned yet!\nGo to the Summon screen to get your first hero.',
      style: {
        fontSize: 24,
        fill: 0xcccccc,
        fontFamily: 'Arial',
        align: 'center',
      },
    });
    this.noHeroesText.anchor.set(0.5);
    this.addChild(this.noHeroesText);
  }

  private setFilter(filters: CollectionFilters): void {
    this.currentFilters = filters;
    this.refreshDisplay();
  }

  private refreshDisplay(): void {
    this.updateStats();
    this.updateHeroGrid();
  }

  private updateStats(): void {
    if (!this.heroCollection) {
      this.statsText.text = 'Loading collection...';
      return;
    }

    const stats = this.heroCollection.getExtendedStats();
    
    const statsString = `Collection: ${stats.totalHeroes}/${stats.maxHeroes} heroes | Total Summoned: ${stats.totalSummoned}
★: ${stats.byRarity[HeroRarity.COMMON]}  ★★: ${stats.byRarity[HeroRarity.UNCOMMON]}  ★★★: ${stats.byRarity[HeroRarity.RARE]}  ★★★★: ${stats.byRarity[HeroRarity.EPIC]}  ★★★★★: ${stats.byRarity[HeroRarity.LEGENDARY]}
Average Level: ${stats.averageLevel}  Total Power: ${stats.totalPower}  Collection Value: ${stats.collectionValue}`;

    this.statsText.text = statsString;
  }

  private updateHeroGrid(): void {
    this.heroGrid.removeChildren();
    
    const heroes = this.heroCollection.getFilteredHeroes(this.currentFilters, this.currentSort);
    
    if (heroes.length === 0) {
      this.noHeroesText.visible = true;
      return;
    }
    
    this.noHeroesText.visible = false;

    // Display heroes in a grid
    const cols = 6;
    const cardWidth = 120;
    const cardHeight = 160;
    const spacing = 20;
    const startX = 100;
    const startY = 280;

    heroes.forEach((hero, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = startX + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);
      
      // Only show heroes that fit on screen
      if (y + cardHeight > 768) return;
      
      const heroCard = this.createHeroCard(hero);
      heroCard.position.set(x, y);
      this.heroGrid.addChild(heroCard);
    });
  }

  private createHeroCard(hero: Hero): PIXI.Container {
    const card = new PIXI.Container();
    card.interactive = true;
    card.cursor = 'pointer';

    // Card background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 120, 160, 8);
    bg.fill(this.getRarityColor(hero.rarity));
    bg.stroke({ width: 2, color: 0xffffff });
    card.addChild(bg);

    // Hero name
    const nameText = new PIXI.Text({
      text: hero.name,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 110,
      },
    });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(60, 5);
    card.addChild(nameText);

    // Rarity stars
    const starsText = new PIXI.Text({
      text: '★'.repeat(hero.rarity),
      style: {
        fontSize: 14,
        fill: 0xffd700,
        fontFamily: 'Arial',
      },
    });
    starsText.anchor.set(0.5, 0);
    starsText.position.set(60, 30);
    card.addChild(starsText);

    // Level
    const levelText = new PIXI.Text({
      text: `Lv.${hero.level}`,
      style: {
        fontSize: 12,
        fill: 0x00ff00,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    levelText.anchor.set(0.5, 0);
    levelText.position.set(60, 50);
    card.addChild(levelText);

    // Hero type and element
    const typeText = new PIXI.Text({
      text: `${hero.type.toUpperCase()}\n${hero.element.toUpperCase()}`,
      style: {
        fontSize: 10,
        fill: 0xcccccc,
        fontFamily: 'Arial',
        align: 'center',
      },
    });
    typeText.anchor.set(0.5, 0);
    typeText.position.set(60, 70);
    card.addChild(typeText);

    // Stats
    const statsText = new PIXI.Text({
      text: `ATK: ${hero.stats.attack}\nDEF: ${hero.stats.defense}\nHP: ${hero.stats.hp}`,
      style: {
        fontSize: 9,
        fill: 0xaaaaaa,
        fontFamily: 'Arial',
        align: 'center',
      },
    });
    statsText.anchor.set(0.5, 0);
    statsText.position.set(60, 105);
    card.addChild(statsText);

    // Click handler
    card.on('pointerdown', () => {
      this.showHeroDetails(hero);
    });

    // Hover effect
    card.on('pointerover', () => {
      card.scale.set(1.05);
    });

    card.on('pointerout', () => {
      card.scale.set(1.0);
    });

    return card;
  }

  private showHeroDetails(hero: Hero): void {
    console.log(`Viewing hero: ${hero.name}`);
    // TODO: Show detailed hero information modal
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

  private layoutElements(): void {
    this.title.position.set(512, 50);
    this.backButton.position.set(100, 20);
    
    // Layout filter buttons
    const filterStartX = 200;
    const filterY = 100;
    const filterSpacing = 90;
    
    this.allButton.position.set(filterStartX, filterY);
    this.commonButton.position.set(filterStartX + filterSpacing, filterY);
    this.uncommonButton.position.set(filterStartX + filterSpacing * 2, filterY);
    this.rareButton.position.set(filterStartX + filterSpacing * 3, filterY);
    this.epicButton.position.set(filterStartX + filterSpacing * 4, filterY);
    this.legendaryButton.position.set(filterStartX + filterSpacing * 5, filterY);
    
    this.statsText.position.set(50, 140);
    this.noHeroesText.position.set(512, 400);
  }
}