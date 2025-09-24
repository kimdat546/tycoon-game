import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';
import { CombatSystem, CombatUnit, CombatAction } from '../systems/CombatSystem';
import { Hero } from '../entities/Hero';
import { Enemy, EnemyFactory } from '../entities/Enemy';

export class CombatScene extends Scene {
  private title!: PIXI.Text;
  private backButton!: Button;
  
  // Combat system
  private combatSystem!: CombatSystem;
  private currentFloor: number = 1;
  
  // UI containers
  private heroesContainer!: PIXI.Container;
  private enemiesContainer!: PIXI.Container;
  private uiContainer!: PIXI.Container;
  private logContainer!: PIXI.Container;
  
  // Combat UI
  private attackButton!: Button;
  private defendButton!: Button;
  private turnText!: PIXI.Text;
  private phaseText!: PIXI.Text;
  private logText!: PIXI.Text;
  
  // Selected units
  private selectedHero: CombatUnit | null = null;
  
  // Combat data
  private heroes: Hero[] = [];
  private enemies: Enemy[] = [];

  init(): void {
    // Initialize combat system
    this.combatSystem = new CombatSystem(this.eventBus!);
    
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createContainers();
    this.createUI();
    this.layoutElements();
    this.setupEventListeners();
    
    // Start test combat
    this.startTestCombat();
  }

  update(): void {
    // Combat scene updates
  }

  cleanup(): void {
    this.removeChildren();
    this.removeEventListeners();
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill(0x2a2a4a);
    this.addChild(bg);
    
    // Create battlefield divisions
    const divider = new PIXI.Graphics();
    divider.rect(500, 200, 4, 400);
    divider.fill(0x555555);
    this.addChild(divider);
    
    // Hero side (left)
    const heroSide = new PIXI.Graphics();
    heroSide.rect(50, 200, 450, 400);
    heroSide.stroke({ width: 2, color: 0x4a4aaa });
    this.addChild(heroSide);
    
    // Enemy side (right)
    const enemySide = new PIXI.Graphics();
    enemySide.rect(520, 200, 450, 400);
    enemySide.stroke({ width: 2, color: 0xaa4a4a });
    this.addChild(enemySide);
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: `Combat - Floor ${this.currentFloor}`,
      style: {
        fontSize: 36,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    this.title.anchor.set(0.5);
    this.addChild(this.title);
  }

  private createButtons(): void {
    this.backButton = new Button('Retreat', 120, 40);
    this.backButton.onClick = () => {
      this.eventBus?.emit('scene-change', 'tower');
    };
    this.addChild(this.backButton);
  }

  private createContainers(): void {
    this.heroesContainer = new PIXI.Container();
    this.enemiesContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    this.logContainer = new PIXI.Container();
    
    this.addChild(this.heroesContainer);
    this.addChild(this.enemiesContainer);
    this.addChild(this.uiContainer);
    this.addChild(this.logContainer);
  }

  private createUI(): void {
    // Combat action buttons
    this.attackButton = new Button('Attack', 100, 40);
    this.attackButton.onClick = () => this.performAttack();
    this.attackButton.setEnabled(false);
    
    this.defendButton = new Button('Defend', 100, 40);
    this.defendButton.onClick = () => this.performDefend();
    this.defendButton.setEnabled(false);
    
    this.uiContainer.addChild(this.attackButton);
    this.uiContainer.addChild(this.defendButton);
    
    // Turn information
    this.turnText = new PIXI.Text({
      text: 'Turn: 0',
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: 'Arial',
      },
    });
    this.uiContainer.addChild(this.turnText);
    
    this.phaseText = new PIXI.Text({
      text: 'Phase: Preparation',
      style: {
        fontSize: 16,
        fill: 0xcccccc,
        fontFamily: 'Arial',
      },
    });
    this.uiContainer.addChild(this.phaseText);
    
    // Combat log
    this.logText = new PIXI.Text({
      text: 'Combat Log:\n',
      style: {
        fontSize: 12,
        fill: 0xcccccc,
        fontFamily: 'Arial',
        wordWrap: true,
        wordWrapWidth: 300,
      },
    });
    this.logContainer.addChild(this.logText);
  }

  private setupEventListeners(): void {
    this.eventBus?.on('combat-started', () => this.onCombatStarted());
    this.eventBus?.on('turn-started', (data) => this.onTurnStarted(data));
    this.eventBus?.on('player-turn', (data) => this.onPlayerTurn(data));
    this.eventBus?.on('action-executed', (data) => this.onActionExecuted(data));
    this.eventBus?.on('combat-ended', (data) => this.onCombatEnded(data));
    this.eventBus?.on('damage-dealt', (data) => this.onDamageDealt(data));
    this.eventBus?.on('unit-defeated', (data) => this.onUnitDefeated(data));
  }

  private removeEventListeners(): void {
    this.eventBus?.off('combat-started', () => this.onCombatStarted());
    this.eventBus?.off('turn-started', (data) => this.onTurnStarted(data));
    this.eventBus?.off('player-turn', (data) => this.onPlayerTurn(data));
    this.eventBus?.off('action-executed', (data) => this.onActionExecuted(data));
    this.eventBus?.off('combat-ended', (data) => this.onCombatEnded(data));
    this.eventBus?.off('damage-dealt', (data) => this.onDamageDealt(data));
    this.eventBus?.off('unit-defeated', (data) => this.onUnitDefeated(data));
  }

  private startTestCombat(): void {
    // Create test heroes and enemies
    this.heroes = this.createTestHeroes();
    this.enemies = this.createTestEnemies();
    
    // Start combat
    this.combatSystem.startCombat(this.heroes, this.enemies);
  }

  private createTestHeroes(): Hero[] {
    // Create some test heroes (this would normally come from player's collection)
    const testHeroes: Hero[] = [
      {
        id: 'test_hero_1',
        templateId: 'farmer_tom',
        name: 'Tom the Farmer',
        type: 'warrior' as any,
        rarity: 1,
        element: 'earth' as any,
        level: 5,
        experience: 0,
        ascension: 0,
        stats: {
          attack: 25,
          defense: 30,
          hp: 180,
          speed: 12,
          magic: 8,
        },
        equipment: [],
        unlockedSkills: ['Basic Strike'],
        bonds: new Map(),
        storyProgress: 0,
        personalityTraits: [],
        summonedAt: Date.now(),
        lastUsed: 0,
      },
      {
        id: 'test_hero_2',
        templateId: 'village_healer',
        name: 'Maria the Healer',
        type: 'healer' as any,
        rarity: 1,
        element: 'light' as any,
        level: 4,
        experience: 0,
        ascension: 0,
        stats: {
          attack: 12,
          defense: 18,
          hp: 140,
          speed: 15,
          magic: 35,
        },
        equipment: [],
        unlockedSkills: ['Heal'],
        bonds: new Map(),
        storyProgress: 0,
        personalityTraits: [],
        summonedAt: Date.now(),
        lastUsed: 0,
      },
    ];
    
    return testHeroes;
  }

  private createTestEnemies(): Enemy[] {
    return [
      EnemyFactory.createBasicGoblin(3),
      EnemyFactory.createBasicGoblin(2),
    ];
  }

  // Event handlers
  private onCombatStarted(): void {
    this.phaseText.text = 'Phase: Combat';
    this.displayUnits();
    this.addToLog('Combat started!');
  }

  private onTurnStarted(data: any): void {
    this.turnText.text = `Turn: ${data.turnCount + 1}`;
    this.updateUnitDisplays();
  }

  private onPlayerTurn(data: any): void {
    this.selectedHero = data.hero;
    this.attackButton.setEnabled(true);
    this.defendButton.setEnabled(true);
    this.addToLog(`${data.hero.name}'s turn!`);
  }

  private onActionExecuted(data: CombatAction): void {
    this.addToLog(data.description);
    this.selectedHero = null;
    this.attackButton.setEnabled(false);
    this.defendButton.setEnabled(false);
    this.updateUnitDisplays();
  }

  private onCombatEnded(data: any): void {
    this.phaseText.text = `Phase: ${data.winner === 'heroes' ? 'Victory' : 'Defeat'}`;
    this.addToLog(`Combat ended! ${data.winner === 'heroes' ? 'Victory!' : 'Defeat!'}`);
    
    if (data.rewards) {
      this.addToLog(`Rewards: ${data.rewards.experience} EXP, ${data.rewards.gold} Gold`);
    }
    
    // Show back button prominently
    this.backButton.setText(data.winner === 'heroes' ? 'Continue' : 'Retreat');
  }

  private onDamageDealt(data: any): void {
    // Create damage number animation
    this.showDamageNumber(data.damage);
  }

  private onUnitDefeated(data: any): void {
    this.addToLog(`${data.unit.name} was defeated!`);
    this.updateUnitDisplays();
  }

  // Combat actions
  private performAttack(): void {
    if (!this.selectedHero) return;
    
    // For now, auto-select first alive enemy
    const aliveEnemies = this.combatSystem.getEnemies().filter(e => e.isAlive);
    if (aliveEnemies.length === 0) return;
    
    const target = aliveEnemies[0];
    const action = this.combatSystem.createAttackAction(this.selectedHero.id, target.id);
    this.combatSystem.executePlayerAction(action);
  }

  private performDefend(): void {
    if (!this.selectedHero) return;
    
    const action = this.combatSystem.createDefendAction(this.selectedHero.id);
    this.combatSystem.executePlayerAction(action);
  }

  // Display methods
  private displayUnits(): void {
    this.displayHeroes();
    this.displayEnemies();
  }

  private displayHeroes(): void {
    this.heroesContainer.removeChildren();
    
    const heroes = this.combatSystem.getHeroes();
    heroes.forEach((hero, index) => {
      const heroCard = this.createUnitCard(hero, true);
      heroCard.position.set(80 + index * 140, 300);
      this.heroesContainer.addChild(heroCard);
    });
  }

  private displayEnemies(): void {
    this.enemiesContainer.removeChildren();
    
    const enemies = this.combatSystem.getEnemies();
    enemies.forEach((enemy, index) => {
      const enemyCard = this.createUnitCard(enemy, false);
      enemyCard.position.set(550 + index * 140, 300);
      this.enemiesContainer.addChild(enemyCard);
    });
  }

  private createUnitCard(unit: CombatUnit, isHero: boolean): PIXI.Container {
    const card = new PIXI.Container();
    
    // Card background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 120, 180, 8);
    bg.fill(unit.isAlive ? (isHero ? 0x4a4aaa : 0xaa4a4a) : 0x444444);
    bg.stroke({ width: 2, color: unit.isAlive ? 0xffffff : 0x666666 });
    card.addChild(bg);
    
    // Unit name
    const nameText = new PIXI.Text({
      text: unit.name,
      style: {
        fontSize: 12,
        fill: unit.isAlive ? 0xffffff : 0x888888,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 110,
      },
    });
    nameText.anchor.set(0.5, 0);
    nameText.position.set(60, 10);
    card.addChild(nameText);
    
    // HP bar
    const hpBarBg = new PIXI.Graphics();
    hpBarBg.rect(10, 40, 100, 12);
    hpBarBg.fill(0x444444);
    card.addChild(hpBarBg);
    
    const hpPercent = unit.currentHp / unit.stats.hp;
    const hpBarFill = new PIXI.Graphics();
    hpBarFill.rect(10, 40, 100 * hpPercent, 12);
    hpBarFill.fill(hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffff00 : 0xff0000);
    card.addChild(hpBarFill);
    
    // HP text
    const hpText = new PIXI.Text({
      text: `${unit.currentHp}/${unit.stats.hp}`,
      style: {
        fontSize: 10,
        fill: 0xffffff,
        fontFamily: 'Arial',
      },
    });
    hpText.anchor.set(0.5, 0);
    hpText.position.set(60, 55);
    card.addChild(hpText);
    
    // Stats
    const statsText = new PIXI.Text({
      text: `ATK: ${unit.stats.attack}\nDEF: ${unit.stats.defense}\nSPD: ${unit.stats.speed}`,
      style: {
        fontSize: 9,
        fill: unit.isAlive ? 0xcccccc : 0x666666,
        fontFamily: 'Arial',
        align: 'center',
      },
    });
    statsText.anchor.set(0.5, 0);
    statsText.position.set(60, 75);
    card.addChild(statsText);
    
    // Status effects
    if (unit.statusEffects.length > 0) {
      const effectsText = new PIXI.Text({
        text: unit.statusEffects.map(e => e.name).join(', '),
        style: {
          fontSize: 8,
          fill: 0xffaa00,
          fontFamily: 'Arial',
          align: 'center',
          wordWrap: true,
          wordWrapWidth: 110,
        },
      });
      effectsText.anchor.set(0.5, 0);
      effectsText.position.set(60, 130);
      card.addChild(effectsText);
    }
    
    return card;
  }

  private updateUnitDisplays(): void {
    this.displayHeroes();
    this.displayEnemies();
  }

  private showDamageNumber(damage: number): void {
    // Find target position and show floating damage number
    // This is a simplified version - in a full game you'd have proper positioning
    const damageText = new PIXI.Text({
      text: `-${damage}`,
      style: {
        fontSize: 24,
        fill: 0xff4444,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    damageText.anchor.set(0.5);
    damageText.position.set(600, 300); // Simplified positioning
    this.addChild(damageText);
    
    // Animate and remove
    setTimeout(() => {
      this.removeChild(damageText);
    }, 1500);
  }

  private addToLog(message: string): void {
    const currentLog = this.logText.text;
    const lines = currentLog.split('\n');
    lines.push(message);
    
    // Keep only last 10 lines
    if (lines.length > 11) {
      lines.splice(1, lines.length - 11);
    }
    
    this.logText.text = lines.join('\n');
  }

  private layoutElements(): void {
    this.title.position.set(512, 50);
    this.backButton.position.set(50, 20);
    
    // UI positions
    this.attackButton.position.set(50, 650);
    this.defendButton.position.set(160, 650);
    this.turnText.position.set(300, 650);
    this.phaseText.position.set(300, 670);
    
    // Log position
    this.logText.position.set(700, 650);
  }

  // Public methods for starting combat with specific parameters
  setFloor(floor: number): void {
    this.currentFloor = floor;
    this.title.text = `Combat - Floor ${floor}`;
  }

  startCombatWithTeam(heroes: Hero[], floor: number): void {
    this.setFloor(floor);
    this.heroes = heroes;
    this.enemies = this.generateEnemiesForFloor(floor);
    this.combatSystem.startCombat(this.heroes, this.enemies);
  }

  private generateEnemiesForFloor(floor: number): Enemy[] {
    const enemyCount = Math.min(4, 1 + Math.floor(floor / 3));
    const enemies: Enemy[] = [];
    
    for (let i = 0; i < enemyCount; i++) {
      enemies.push(EnemyFactory.generateRandomEnemy(floor));
    }
    
    return enemies;
  }
}