import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';
import { HeroProgression } from '../systems/HeroProgression';
import { SkillManager } from '../systems/SkillManager';
import { EquipmentManager } from '../systems/EquipmentManager';
import { HeroCollection } from '../systems/HeroCollection';
import { Hero } from '../entities/Hero';

export class HeroProgressionScene extends Scene {
  private title!: PIXI.Text;
  private backButton!: Button;
  private heroListContainer!: PIXI.Container;
  private heroDetailsContainer!: PIXI.Container;
  private skillsContainer!: PIXI.Container;
  private progressionContainer!: PIXI.Container;
  
  // Systems
  private heroProgression!: HeroProgression;
  private skillManager!: SkillManager;
  private equipmentManager!: EquipmentManager;
  private heroCollection!: HeroCollection;
  
  // State
  private selectedHero: Hero | null = null;
  private heroes: Hero[] = [];

  init(): void {
    // Initialize systems
    this.heroProgression = new HeroProgression(this.eventBus!);
    this.skillManager = new SkillManager(this.eventBus!);
    this.equipmentManager = new EquipmentManager(this.eventBus!);
    this.heroCollection = new HeroCollection(this.eventBus!);

    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createContainers();
    this.setupEventListeners();
    this.generateTestHeroes();
    this.updateHeroList();
    this.layoutElements();
  }

  update(): void {
    // Scene updates
  }

  cleanup(): void {
    this.removeChildren();
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill(0x1a1a2e);
    this.addChild(bg);
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: 'Hero Progression',
      style: {
        fontSize: 32,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    this.title.anchor.set(0.5);
    this.addChild(this.title);
  }

  private createButtons(): void {
    this.backButton = new Button({
      text: 'Back',
      width: 120,
      height: 40,
      backgroundColor: 0x4a4a8a,
      textColor: 0xffffff,
      onClick: () => {
        this.eventBus?.emit('change-scene', { scene: 'menu' });
      }
    });
    this.addChild(this.backButton);

    // Test buttons
    const giveExpButton = new Button({
      text: 'Give 1000 EXP',
      width: 150,
      height: 40,
      backgroundColor: 0x2a8a2a,
      textColor: 0xffffff,
      onClick: () => this.giveExperience(1000)
    });
    giveExpButton.position.set(200, 20);
    this.addChild(giveExpButton);

    const levelUpButton = new Button({
      text: 'Level Up',
      width: 150,
      height: 40,
      backgroundColor: 0x2a6a8a,
      textColor: 0xffffff,
      onClick: () => this.levelUpHero()
    });
    levelUpButton.position.set(370, 20);
    this.addChild(levelUpButton);

    const ascendButton = new Button({
      text: 'Ascend Hero',
      width: 150,
      height: 40,
      backgroundColor: 0x8a2a8a,
      textColor: 0xffffff,
      onClick: () => this.ascendHero()
    });
    ascendButton.position.set(540, 20);
    this.addChild(ascendButton);

    const skillPointsButton = new Button({
      text: 'Give Skill Points',
      width: 150,
      height: 40,
      backgroundColor: 0x8a6a2a,
      textColor: 0xffffff,
      onClick: () => this.giveSkillPoints(5)
    });
    skillPointsButton.position.set(710, 20);
    this.addChild(skillPointsButton);
  }

  private createContainers(): void {
    // Hero list
    this.heroListContainer = new PIXI.Container();
    this.heroListContainer.position.set(50, 100);
    this.addChild(this.heroListContainer);

    // Hero details
    this.heroDetailsContainer = new PIXI.Container();
    this.heroDetailsContainer.position.set(300, 100);
    this.addChild(this.heroDetailsContainer);

    // Skills display
    this.skillsContainer = new PIXI.Container();
    this.skillsContainer.position.set(550, 100);
    this.addChild(this.skillsContainer);

    // Progression info
    this.progressionContainer = new PIXI.Container();
    this.progressionContainer.position.set(50, 400);
    this.addChild(this.progressionContainer);
  }

  private setupEventListeners(): void {
    this.eventBus?.on('hero-leveled-up', (data: any) => {
      console.log(`Hero ${data.heroId} leveled up to ${data.newLevel}!`);
      this.updateHeroDetails();
      this.updateProgressionInfo();
    });

    this.eventBus?.on('skill-learned', (data: any) => {
      console.log(`Skill learned: ${data.skill.name}`);
      this.updateSkillsList();
    });

    this.eventBus?.on('hero-ascended', (data: any) => {
      console.log(`Hero ${data.heroId} ascended to level ${data.newAscensionLevel}!`);
      this.updateHeroDetails();
      this.updateProgressionInfo();
    });
  }

  private generateTestHeroes(): void {
    // Generate some test heroes for demonstration
    const testHeroes = [
      { name: 'Test Warrior', type: 'warrior', rarity: 3 },
      { name: 'Test Mage', type: 'mage', rarity: 4 },
      { name: 'Test Archer', type: 'archer', rarity: 2 },
    ];

    testHeroes.forEach(heroData => {
      const hero: Hero = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId: 'test_template',
        name: heroData.name,
        type: heroData.type as any,
        rarity: heroData.rarity as any,
        element: 'neutral' as any,
        level: 1,
        experience: 0,
        ascension: 0,
        stats: {
          attack: 50 + heroData.rarity * 10,
          defense: 40 + heroData.rarity * 8,
          hp: 200 + heroData.rarity * 50,
          speed: 30 + heroData.rarity * 5,
          magic: 25 + heroData.rarity * 12,
        },
        equipment: [],
        unlockedSkills: [],
        bonds: new Map(),
        storyProgress: 0,
        personalityTraits: [],
        assignedTo: null,
        fatigue: 0,
        isIdle: true,
      };

      this.heroes.push(hero);
      
      // Emit hero creation event to initialize progression
      this.eventBus?.emit('hero-created', { hero });
    });
  }

  private updateHeroList(): void {
    this.heroListContainer.removeChildren();

    const title = new PIXI.Text({
      text: 'Heroes',
      style: {
        fontSize: 18,
        fill: 0xFFFFFF,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    this.heroListContainer.addChild(title);

    this.heroes.forEach((hero, index) => {
      const heroButton = this.createHeroListItem(hero, 30 + (index * 50));
      this.heroListContainer.addChild(heroButton);
    });
  }

  private createHeroListItem(hero: Hero, yOffset: number): PIXI.Container {
    const container = new PIXI.Container();
    container.y = yOffset;

    // Background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 220, 45);
    bg.fill({ 
      color: this.selectedHero?.id === hero.id ? 0x444444 : 0x2a2a2a, 
      alpha: 0.8 
    });
    bg.stroke({ width: 1, color: this.getRarityColor(hero.rarity) });
    container.addChild(bg);

    // Hero name
    const nameText = new PIXI.Text({
      text: hero.name,
      style: {
        fontSize: 14,
        fill: this.getRarityColor(hero.rarity),
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    nameText.x = 5;
    nameText.y = 2;
    container.addChild(nameText);

    // Level and type
    const level = this.heroProgression.getHeroLevel(hero.id);
    const progressionData = this.heroProgression.getProgressionData(hero.id);
    const infoText = new PIXI.Text({
      text: `Lv.${level} ${hero.type} (A${progressionData?.ascensionLevel || 0})`,
      style: {
        fontSize: 12,
        fill: 0xCCCCCC,
        fontFamily: 'Arial'
      }
    });
    infoText.x = 5;
    infoText.y = 22;
    container.addChild(infoText);

    // Make clickable
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    bg.on('pointerdown', () => {
      this.selectedHero = hero;
      this.updateHeroList();
      this.updateHeroDetails();
      this.updateSkillsList();
      this.updateProgressionInfo();
    });

    return container;
  }

  private updateHeroDetails(): void {
    this.heroDetailsContainer.removeChildren();

    if (!this.selectedHero) {
      const noSelectionText = new PIXI.Text({
        text: 'Select a hero to view details',
        style: {
          fontSize: 16,
          fill: 0x888888,
          fontFamily: 'Arial'
        }
      });
      this.heroDetailsContainer.addChild(noSelectionText);
      return;
    }

    const hero = this.selectedHero;
    const level = this.heroProgression.getHeroLevel(hero.id);
    const progressionData = this.heroProgression.getProgressionData(hero.id);
    const equipmentStats = this.equipmentManager.calculateEquipmentStats(hero.id);
    const finalStats = this.heroProgression.calculateHeroStats(hero, {}, equipmentStats);

    let yOffset = 0;

    // Hero name and level
    const title = new PIXI.Text({
      text: `${hero.name} - Level ${level}`,
      style: {
        fontSize: 18,
        fill: this.getRarityColor(hero.rarity),
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    title.y = yOffset;
    this.heroDetailsContainer.addChild(title);
    yOffset += 30;

    // Basic info
    const basicInfo = [
      `Type: ${hero.type}`,
      `Rarity: ${this.getRarityName(hero.rarity)}`,
      `Ascension: ${progressionData?.ascensionLevel || 0}`,
      `Experience: ${progressionData?.totalExperience || 0}`,
      `Stat Points: ${progressionData?.statPoints || 0}`,
    ];

    basicInfo.forEach(info => {
      const text = new PIXI.Text({
        text: info,
        style: {
          fontSize: 12,
          fill: 0xFFFFFF,
          fontFamily: 'Arial'
        }
      });
      text.y = yOffset;
      this.heroDetailsContainer.addChild(text);
      yOffset += 18;
    });

    yOffset += 10;

    // Stats
    const statsTitle = new PIXI.Text({
      text: 'Final Stats:',
      style: {
        fontSize: 14,
        fill: 0xFFD700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    statsTitle.y = yOffset;
    this.heroDetailsContainer.addChild(statsTitle);
    yOffset += 20;

    Object.entries(finalStats).forEach(([stat, value]) => {
      const statText = new PIXI.Text({
        text: `${stat}: ${value}`,
        style: {
          fontSize: 12,
          fill: 0x90EE90,
          fontFamily: 'Arial'
        }
      });
      statText.y = yOffset;
      this.heroDetailsContainer.addChild(statText);
      yOffset += 16;
    });
  }

  private updateSkillsList(): void {
    this.skillsContainer.removeChildren();

    if (!this.selectedHero) return;

    const skillData = this.skillManager.getHeroSkills(this.selectedHero.id);
    if (!skillData) return;

    let yOffset = 0;

    // Title
    const title = new PIXI.Text({
      text: `Skills (${skillData.availableSkillPoints} pts)`,
      style: {
        fontSize: 18,
        fill: 0xFFD700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    title.y = yOffset;
    this.skillsContainer.addChild(title);
    yOffset += 30;

    // Learned skills
    const learnedSkills = Array.from(skillData.learnedSkills.values());
    if (learnedSkills.length === 0) {
      const noSkillsText = new PIXI.Text({
        text: 'No skills learned yet',
        style: {
          fontSize: 12,
          fill: 0x888888,
          fontFamily: 'Arial'
        }
      });
      noSkillsText.y = yOffset;
      this.skillsContainer.addChild(noSkillsText);
    } else {
      learnedSkills.forEach(skill => {
        const skillContainer = new PIXI.Container();
        skillContainer.y = yOffset;
        this.skillsContainer.addChild(skillContainer);

        // Skill name and level
        const skillText = new PIXI.Text({
          text: `${skill.name} (Lv.${skill.currentLevel}/${skill.maxLevel})`,
          style: {
            fontSize: 12,
            fill: skillData.equippedSkills.includes(skill.id) ? 0x00FF00 : 0xFFFFFF,
            fontFamily: 'Arial'
          }
        });
        skillContainer.addChild(skillText);

        // Skill type
        const typeText = new PIXI.Text({
          text: skill.type,
          style: {
            fontSize: 10,
            fill: 0xCCCCCC,
            fontFamily: 'Arial'
          }
        });
        typeText.x = 0;
        typeText.y = 15;
        skillContainer.addChild(typeText);

        yOffset += 35;
      });
    }
  }

  private updateProgressionInfo(): void {
    this.progressionContainer.removeChildren();

    if (!this.selectedHero) return;

    const stats = this.heroProgression.getHeroStats(this.selectedHero.id);
    const canAscend = this.heroProgression.canAscend(this.selectedHero.id);
    const ascensionReq = this.heroProgression.getAscensionRequirements(this.selectedHero.id);

    let yOffset = 0;

    // Title
    const title = new PIXI.Text({
      text: 'Progression Info',
      style: {
        fontSize: 18,
        fill: 0xFFD700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    title.y = yOffset;
    this.progressionContainer.addChild(title);
    yOffset += 30;

    // Experience info
    const expInfo = [
      `Current Level: ${stats.level}`,
      `Total Experience: ${stats.experience}`,
      `EXP to Next Level: ${stats.expToNext}`,
      `Available Stat Points: ${stats.statPoints}`,
      `Available Skill Points: ${stats.skillPoints}`,
    ];

    expInfo.forEach(info => {
      const text = new PIXI.Text({
        text: info,
        style: {
          fontSize: 12,
          fill: 0xFFFFFF,
          fontFamily: 'Arial'
        }
      });
      text.y = yOffset;
      this.progressionContainer.addChild(text);
      yOffset += 18;
    });

    // Ascension info
    yOffset += 10;
    const ascensionText = new PIXI.Text({
      text: `Can Ascend: ${canAscend ? 'Yes' : 'No'}`,
      style: {
        fontSize: 14,
        fill: canAscend ? 0x00FF00 : 0xFF6666,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    ascensionText.y = yOffset;
    this.progressionContainer.addChild(ascensionText);
    yOffset += 25;

    if (ascensionReq) {
      const reqText = new PIXI.Text({
        text: `Ascension Requirements:\nLevel ${ascensionReq.level}\nGold: ${ascensionReq.gold}\nMaterials needed`,
        style: {
          fontSize: 11,
          fill: 0xCCCCCC,
          fontFamily: 'Arial'
        }
      });
      reqText.y = yOffset;
      this.progressionContainer.addChild(reqText);
    }
  }

  // Test methods
  private giveExperience(amount: number): void {
    if (!this.selectedHero) {
      console.warn('No hero selected');
      return;
    }

    this.heroProgression.giveExperience(this.selectedHero.id, amount);
  }

  private levelUpHero(): void {
    if (!this.selectedHero) {
      console.warn('No hero selected');
      return;
    }

    // Give enough experience to level up
    const stats = this.heroProgression.getHeroStats(this.selectedHero.id);
    this.heroProgression.giveExperience(this.selectedHero.id, stats.expToNext + 10);
  }

  private ascendHero(): void {
    if (!this.selectedHero) {
      console.warn('No hero selected');
      return;
    }

    const result = this.heroProgression.ascendHero(this.selectedHero.id);
    console.log(`Ascension ${result ? 'successful' : 'failed'}`);
  }

  private giveSkillPoints(amount: number): void {
    if (!this.selectedHero) {
      console.warn('No hero selected');
      return;
    }

    this.skillManager.giveSkillPoints(this.selectedHero.id, amount);
    this.updateSkillsList();
  }

  // Helper methods
  private getRarityColor(rarity: number): number {
    switch (rarity) {
      case 1: return 0x808080; // Gray
      case 2: return 0x00FF00; // Green  
      case 3: return 0x0080FF; // Blue
      case 4: return 0x8000FF; // Purple
      case 5: return 0xFFD700; // Gold
      default: return 0x808080;
    }
  }

  private getRarityName(rarity: number): string {
    switch (rarity) {
      case 1: return 'Common';
      case 2: return 'Uncommon';
      case 3: return 'Rare';
      case 4: return 'Epic';
      case 5: return 'Legendary';
      default: return 'Unknown';
    }
  }

  private layoutElements(): void {
    this.title.position.set(512, 30);
    this.backButton.position.set(50, 20);
  }
}