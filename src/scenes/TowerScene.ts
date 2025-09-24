import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';
import { AutoBattleSystem, BattleZone } from '../systems/AutoBattleSystem';
import { TownManager, TownBuilding, BuildingType } from '../systems/TownManager';
import { HeroCollection } from '../systems/HeroCollection';
import { Hero } from '../entities/Hero';
import { BattleAnimations } from '../graphics/BattleAnimations';
import { CharacterSprites } from '../graphics/CharacterSprites';

export class TowerScene extends Scene {
  private title!: PIXI.Text;
  private backButton!: Button;
  private townInfo!: PIXI.Text;
  private battleZonesContainer!: PIXI.Container;
  private buildingsContainer!: PIXI.Container;
  private heroManagementContainer!: PIXI.Container;
  private battleVisualizationContainer!: PIXI.Container;

  // Systems
  private autoBattleSystem!: AutoBattleSystem;
  private townManager!: TownManager;
  private heroCollection!: HeroCollection;

  // UI Elements
  private zoneButtons: Button[] = [];
  private buildingButtons: Button[] = [];
  private heroList: PIXI.Container[] = [];
  
  // Visual Characters
  private activeHeroSprites: Map<string, PIXI.Container> = new Map();
  private activeEnemySprites: Map<string, PIXI.Container> = new Map();
  private battleVisualizationUpdateInterval: number = 0;

  init(): void {
    // Initialize systems
    this.autoBattleSystem = new AutoBattleSystem(this.eventBus!);
    this.townManager = new TownManager(this.eventBus!);
    this.heroCollection = new HeroCollection(this.eventBus!);

    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createContainers();
    this.createTownInfo();
    this.createBattleZones();
    this.createBuildingManagement();
    this.createHeroManagement();
    this.createBattleVisualization();
    this.layoutElements();
    this.setupEventListeners();
    this.setupBattleEventListeners();
    this.startUpdateLoop();
  }

  update(): void {
    this.updateTownInfo();
    this.updateBattleZoneInfo();
  }

  cleanup(): void {
    this.removeChildren();
    this.autoBattleSystem.destroy();
    this.townManager.destroy();
    
    if (this.battleVisualizationUpdateInterval) {
      cancelAnimationFrame(this.battleVisualizationUpdateInterval);
    }

    // Cleanup all battle animations
    BattleAnimations.cleanupAllAnimations();
    
    // Clear sprite caches
    this.activeHeroSprites.clear();
    this.activeEnemySprites.clear();
    
    // Clear character sprite cache
    CharacterSprites.clearCache();
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill(0x2a3a2a);
    this.addChild(bg);

    // Create town area
    const townArea = new PIXI.Graphics();
    townArea.rect(50, 150, 700, 400);
    townArea.fill(0x3a4a3a);
    townArea.stroke({ width: 2, color: 0x5a6a5a });
    this.addChild(townArea);

    // Create battle zones area
    const battleArea = new PIXI.Graphics();
    battleArea.rect(770, 150, 240, 400);
    battleArea.fill(0x4a3a3a);
    battleArea.stroke({ width: 2, color: 0x6a5a5a });
    this.addChild(battleArea);
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: 'Hunter Village Management',
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
    this.backButton = new Button('Back to Menu', 150, 40);
    this.backButton.onClick = () => {
      this.eventBus?.emit('scene-change', 'menu');
    };
    this.addChild(this.backButton);
  }

  private createContainers(): void {
    this.battleZonesContainer = new PIXI.Container();
    this.buildingsContainer = new PIXI.Container();
    this.heroManagementContainer = new PIXI.Container();
    this.battleVisualizationContainer = new PIXI.Container();
    
    this.addChild(this.battleZonesContainer);
    this.addChild(this.buildingsContainer);
    this.addChild(this.heroManagementContainer);
    this.addChild(this.battleVisualizationContainer);
  }

  private createTownInfo(): void {
    this.townInfo = new PIXI.Text({
      text: 'Town Level: 1\nBuildings: 2\nActive Heroes: 0',
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'Arial',
      },
    });
    this.addChild(this.townInfo);
  }

  private createBattleZones(): void {
    const zones = this.autoBattleSystem.getBattleZones();
    
    const zoneTitle = new PIXI.Text({
      text: 'Battle Zones',
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    zoneTitle.position.set(785, 160);
    this.battleZonesContainer.addChild(zoneTitle);

    zones.forEach((zone, index) => {
      const zoneContainer = this.createZoneDisplay(zone, index);
      zoneContainer.position.set(780, 190 + index * 80);
      this.battleZonesContainer.addChild(zoneContainer);
    });
  }

  private createZoneDisplay(zone: BattleZone, index: number): PIXI.Container {
    const container = new PIXI.Container();

    // Zone background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 220, 70, 5);
    bg.fill(zone.isActive ? 0x4a6a4a : 0x3a3a3a);
    bg.stroke({ width: 1, color: 0x6a6a6a });
    container.addChild(bg);

    // Zone name and info
    const nameText = new PIXI.Text({
      text: zone.name,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    nameText.position.set(5, 5);
    container.addChild(nameText);

    const infoText = new PIXI.Text({
      text: `Level: ${zone.level}\nHeroes: ${zone.assignedHeroes.length}/${zone.requiredHeroes}\nWave: ${zone.currentWave}`,
      style: {
        fontSize: 10,
        fill: 0xcccccc,
        fontFamily: 'Arial',
      },
    });
    infoText.position.set(5, 20);
    container.addChild(infoText);

    // Assign button
    const assignButton = new Button('Assign', 60, 20);
    assignButton.onClick = () => this.showHeroAssignmentDialog(zone.id);
    assignButton.position.set(150, 25);
    container.addChild(assignButton);

    return container;
  }

  private createBuildingManagement(): void {
    const buildingTitle = new PIXI.Text({
      text: 'Town Buildings',
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    buildingTitle.position.set(65, 160);
    this.buildingsContainer.addChild(buildingTitle);

    // Add building button
    const addBuildingButton = new Button('Build New', 100, 30);
    addBuildingButton.onClick = () => this.showBuildingSelectionDialog();
    addBuildingButton.position.set(200, 155);
    this.buildingsContainer.addChild(addBuildingButton);

    this.updateBuildingDisplay();
  }

  private updateBuildingDisplay(): void {
    // Clear existing building displays (keep title and button)
    const children = this.buildingsContainer.children.slice(2); // Keep first 2 elements
    children.forEach(child => this.buildingsContainer.removeChild(child));

    const buildings = this.townManager.getBuildings();
    buildings.forEach((building, index) => {
      const buildingDisplay = this.createBuildingDisplay(building);
      buildingDisplay.position.set(70 + (index % 6) * 110, 190 + Math.floor(index / 6) * 80);
      this.buildingsContainer.addChild(buildingDisplay);
    });
  }

  private createBuildingDisplay(building: TownBuilding): PIXI.Container {
    const container = new PIXI.Container();

    // Building background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 100, 70, 5);
    bg.fill(building.isBuilt ? 0x4a4a6a : 0x3a3a3a);
    bg.stroke({ width: 1, color: building.isBuilding ? 0xffaa00 : 0x6a6a6a });
    container.addChild(bg);

    // Building icon (simplified)
    const icon = new PIXI.Graphics();
    icon.rect(10, 10, 20, 20);
    icon.fill(this.getBuildingColor(building.type));
    container.addChild(icon);

    // Building name
    const nameText = new PIXI.Text({
      text: building.name.substring(0, 8),
      style: {
        fontSize: 10,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    nameText.position.set(5, 35);
    container.addChild(nameText);

    // Building info
    const infoText = new PIXI.Text({
      text: `Lv.${building.level}\n${building.assignedHeroes.length}/${building.capacity}`,
      style: {
        fontSize: 8,
        fill: 0xcccccc,
        fontFamily: 'Arial',
      },
    });
    infoText.position.set(5, 50);
    container.addChild(infoText);

    // Progress bar if building
    if (building.isBuilding && building.buildStartTime) {
      const progress = this.getBuildingProgress(building);
      const progressBar = new PIXI.Graphics();
      progressBar.rect(35, 55, 60, 5);
      progressBar.fill(0x333333);
      progressBar.rect(35, 55, 60 * progress, 5);
      progressBar.fill(0x00ff00);
      container.addChild(progressBar);
    }

    // Make interactive
    container.interactive = true;
    container.cursor = 'pointer';
    container.on('pointerdown', () => this.showBuildingDetails(building));

    return container;
  }

  private getBuildingColor(type: BuildingType): number {
    switch (type) {
      case BuildingType.BOUNTY_HUT: return 0xff6b35;
      case BuildingType.ACADEMY: return 0x3498db;
      case BuildingType.FORGE: return 0xe74c3c;
      case BuildingType.TRAINING_GROUND: return 0x2ecc71;
      case BuildingType.INN: return 0xf39c12;
      case BuildingType.MARKET: return 0x9b59b6;
      case BuildingType.STORAGE: return 0x95a5a6;
      case BuildingType.BARRACKS: return 0x34495e;
      default: return 0x7f8c8d;
    }
  }

  private getBuildingProgress(building: TownBuilding): number {
    if (!building.buildStartTime) return 0;
    
    const timeElapsed = (Date.now() - building.buildStartTime) / 1000;
    const timeRequired = building.isBuilt ? building.upgradeTime : building.buildTime;
    return Math.min(1, timeElapsed / timeRequired);
  }

  private createHeroManagement(): void {
    const heroTitle = new PIXI.Text({
      text: 'Available Heroes',
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    heroTitle.position.set(50, 570);
    this.heroManagementContainer.addChild(heroTitle);

    this.updateHeroList();
  }

  private updateHeroList(): void {
    // Clear existing hero displays (keep title)
    const children = this.heroManagementContainer.children.slice(1);
    children.forEach(child => this.heroManagementContainer.removeChild(child));

    const heroes = this.heroCollection.getAllHeroes();
    heroes.slice(0, 8).forEach((hero, index) => { // Show first 8 heroes
      const heroDisplay = this.createHeroDisplay(hero);
      heroDisplay.position.set(60 + index * 90, 590);
      this.heroManagementContainer.addChild(heroDisplay);
    });
  }

  private createHeroDisplay(hero: Hero): PIXI.Container {
    const container = new PIXI.Container();

    // Hero background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 80, 60, 5);
    bg.fill(0x4a4a8a);
    bg.stroke({ width: 1, color: 0x6a6aaa });
    container.addChild(bg);

    // Hero name
    const nameText = new PIXI.Text({
      text: hero.name.substring(0, 6),
      style: {
        fontSize: 10,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    nameText.position.set(5, 5);
    container.addChild(nameText);

    // Hero level and status
    const statusText = new PIXI.Text({
      text: `Lv.${hero.level}\n${this.getHeroStatus(hero)}`,
      style: {
        fontSize: 8,
        fill: 0xcccccc,
        fontFamily: 'Arial',
      },
    });
    statusText.position.set(5, 20);
    container.addChild(statusText);

    // Make interactive
    container.interactive = true;
    container.cursor = 'pointer';
    container.on('pointerdown', () => this.showHeroOptions(hero));

    return container;
  }

  private getHeroStatus(hero: Hero): string {
    // Check if hero is assigned to battle zone
    const zones = this.autoBattleSystem.getBattleZones();
    for (const zone of zones) {
      if (zone.assignedHeroes.find(h => h.id === hero.id)) {
        return `Fighting\n${zone.name}`;
      }
    }

    // Check if hero is assigned to building
    const buildings = this.townManager.getBuildings();
    for (const building of buildings) {
      if (building.assignedHeroes.find(h => h.id === hero.id)) {
        return `Working\n${building.name}`;
      }
    }

    return 'Idle';
  }

  // Event handlers and dialogs
  private showHeroAssignmentDialog(zoneId: string): void {
    const zone = this.autoBattleSystem.getBattleZone(zoneId);
    if (!zone) return;

    const availableHeroes = this.heroCollection.getAllHeroes().filter(hero => 
      this.getHeroStatus(hero) === 'Idle'
    );

    if (availableHeroes.length === 0) {
      console.log('No available heroes to assign');
      return;
    }

    // For now, auto-assign the first available hero
    const hero = availableHeroes[0];
    this.autoBattleSystem.assignHeroToZone(hero, zoneId);
    this.updateBattleZoneDisplay();
  }

  private showBuildingSelectionDialog(): void {
    // For now, build a random building type
    const buildingTypes = [
      BuildingType.ACADEMY,
      BuildingType.FORGE,
      BuildingType.TRAINING_GROUND,
      BuildingType.INN,
    ];

    const randomType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
    const position = this.findAvailableBuildingPosition();
    
    if (position) {
      this.townManager.createBuilding(randomType, position);
      console.log(`Started building ${randomType} at (${position.x}, ${position.y})`);
    }
  }

  private findAvailableBuildingPosition(): { x: number; y: number } | null {
    // Simple position finding - in a real game you'd have a grid system
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        const position = { x, y };
        // Check if position is free (simplified)
        return position;
      }
    }
    return null;
  }

  private showBuildingDetails(building: TownBuilding): void {
    console.log(`Building details: ${building.name} (Level ${building.level})`);
    // Could show upgrade options, hero assignment, etc.
  }

  private showHeroOptions(hero: Hero): void {
    console.log(`Hero options for: ${hero.name}`);
    // Could show assignment options, stats, equipment, etc.
  }

  private setupEventListeners(): void {
    this.eventBus?.on('hero-assigned-to-zone', () => this.updateBattleZoneDisplay());
    this.eventBus?.on('building-completed', () => this.updateBuildingDisplay());
    this.eventBus?.on('auto-attack', (data) => this.onAutoAttack(data));
    this.eventBus?.on('auto-skill-used', (data) => this.onSkillUsed(data));
    this.eventBus?.on('enemy-defeated', (data) => this.onEnemyDefeated(data));
    this.eventBus?.on('hero-leveled-up', (data) => this.onHeroLevelUp(data));
    this.eventBus?.on('skill-learned', (data) => this.onSkillLearned(data));
  }

  private onAutoAttack(data: any): void {
    // Show floating damage numbers or effects
    console.log(`${data.hero.name} attacked for ${data.damage} damage in ${data.zone}`);
  }

  private onEnemyDefeated(data: any): void {
    console.log(`${data.hero.name} defeated ${data.enemy.name} for ${data.rewards.experience} EXP and ${data.rewards.gold} gold!`);
  }

  private onSkillUsed(data: any): void {
    console.log(`⚡ ${data.hero.name} used ${data.skill.name} for ${data.damage} damage in ${data.zone}!`);
  }

  private onHeroLevelUp(data: any): void {
    console.log(`🎉 ${data.hero.name} leveled up to ${data.newLevel}!`);
  }

  private onSkillLearned(data: any): void {
    console.log(`✨ Hero learned ${data.skill.name}!`);
  }

  private updateTownInfo(): void {
    const townStats = this.townManager.getTownStats();
    const activeZones = this.autoBattleSystem.getActiveZones().length;
    
    this.townInfo.text = `Town Level: ${townStats.townLevel}
Buildings: ${townStats.builtBuildings}/${townStats.totalBuildings}
Active Zones: ${activeZones}
Heroes: ${this.heroCollection.getHeroCount()}`;
  }

  private updateBattleZoneInfo(): void {
    // Update zone displays with current info
    this.battleZonesContainer.removeChildren();
    this.createBattleZones();
  }

  private updateBattleZoneDisplay(): void {
    this.battleZonesContainer.removeChildren();
    this.createBattleZones();
  }

  private startUpdateLoop(): void {
    // Update display every second
    setInterval(() => {
      this.updateBuildingDisplay();
      this.updateHeroList();
    }, 1000);
  }

  private layoutElements(): void {
    this.title.position.set(512, 50);
    this.backButton.position.set(50, 20);
    this.townInfo.position.set(50, 80);
    
    // Position battle visualization in the center-right area
    this.battleVisualizationContainer.position.set(600, 200);
  }

  // Battle Visualization Methods
  private createBattleVisualization(): void {
    // Create battle area background
    const battleArea = new PIXI.Graphics();
    battleArea.rect(0, 0, 400, 300);
    battleArea.fill({ color: 0x1a1a1a, alpha: 0.8 });
    battleArea.stroke({ width: 2, color: 0x444444 });
    this.battleVisualizationContainer.addChild(battleArea);

    // Add title
    const battleTitle = new PIXI.Text({
      text: 'Auto-Battle Zones',
      style: {
        fontSize: 16,
        fill: 0xFFFFFF,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    battleTitle.x = 10;
    battleTitle.y = 10;
    this.battleVisualizationContainer.addChild(battleTitle);

    // Start battle visualization updates
    this.startBattleVisualizationUpdates();
  }

  private startBattleVisualizationUpdates(): void {
    const update = () => {
      this.updateBattleVisualization();
      this.battleVisualizationUpdateInterval = requestAnimationFrame(update);
    };
    this.battleVisualizationUpdateInterval = requestAnimationFrame(update);
  }

  private updateBattleVisualization(): void {
    const activeZones = this.autoBattleSystem.getActiveZones();
    
    // Clear old battle displays
    this.clearOldBattleDisplays();

    // Display active battle zones
    activeZones.forEach((zone, index) => {
      this.displayBattleZone(zone, index);
    });
  }

  private displayBattleZone(zone: any, zoneIndex: number): void {
    const yOffset = 40 + (zoneIndex * 80);
    const zoneContainer = new PIXI.Container();
    zoneContainer.y = yOffset;
    this.battleVisualizationContainer.addChild(zoneContainer);

    // Zone name
    const zoneName = new PIXI.Text({
      text: zone.name,
      style: {
        fontSize: 12,
        fill: 0xFFD700,
        fontFamily: 'Arial'
      }
    });
    zoneName.x = 10;
    zoneContainer.addChild(zoneName);

    // Display heroes in this zone
    zone.assignedHeroes.forEach((hero: Hero, heroIndex: number) => {
      const heroSprite = this.createOrUpdateHeroSprite(hero, zoneIndex, heroIndex);
      if (heroSprite) {
        heroSprite.x = 150 + (heroIndex * 60);
        heroSprite.y = 0;
        zoneContainer.addChild(heroSprite);
      }
    });

    // Display enemies in this zone
    zone.activeEnemies.forEach((enemy: any, enemyIndex: number) => {
      const enemySprite = this.createOrUpdateEnemySprite(enemy, zoneIndex, enemyIndex);
      if (enemySprite) {
        enemySprite.x = 280 + (enemyIndex * 50);
        enemySprite.y = 0;
        zoneContainer.addChild(enemySprite);
      }
    });

    // Add wave info
    const waveInfo = new PIXI.Text({
      text: `Wave ${zone.currentWave}`,
      style: {
        fontSize: 10,
        fill: 0xCCCCCC,
        fontFamily: 'Arial'
      }
    });
    waveInfo.x = 10;
    waveInfo.y = 20;
    zoneContainer.addChild(waveInfo);
  }

  private createOrUpdateHeroSprite(hero: Hero, zoneIndex: number, heroIndex: number): PIXI.Container | null {
    const spriteKey = `hero_${zoneIndex}_${heroIndex}`;
    
    let heroSprite = this.activeHeroSprites.get(spriteKey);
    if (!heroSprite) {
      heroSprite = BattleAnimations.createAnimatedCharacter(hero, { x: 0, y: 0 }, true);
      this.activeHeroSprites.set(spriteKey, heroSprite);
    }

    return heroSprite;
  }

  private createOrUpdateEnemySprite(enemy: any, zoneIndex: number, enemyIndex: number): PIXI.Container | null {
    const spriteKey = `enemy_${zoneIndex}_${enemyIndex}`;
    
    let enemySprite = this.activeEnemySprites.get(spriteKey);
    if (!enemySprite) {
      enemySprite = BattleAnimations.createAnimatedEnemy(enemy, { x: 0, y: 0 });
      this.activeEnemySprites.set(spriteKey, enemySprite);
    }

    // Update health bar
    BattleAnimations.updateHealthBar(enemySprite, enemy.currentHp, enemy.stats.hp);

    return enemySprite;
  }

  private clearOldBattleDisplays(): void {
    // Remove all children except the background and title (first 2 children)
    while (this.battleVisualizationContainer.children.length > 2) {
      const child = this.battleVisualizationContainer.children[2];
      this.battleVisualizationContainer.removeChild(child);
    }
  }

  private setupBattleEventListeners(): void {
    // Listen for auto-attack events to show animations
    this.eventBus?.on('auto-attack', (data: any) => {
      this.handleAutoAttackAnimation(data);
    });

    // Listen for enemy defeated events
    this.eventBus?.on('enemy-defeated', (data: any) => {
      this.handleEnemyDefeatedAnimation(data);
    });

    // Listen for wave spawned events
    this.eventBus?.on('wave-spawned', (data: any) => {
      this.handleWaveSpawnedEffect(data);
    });
  }

  private handleAutoAttackAnimation(data: any): void {
    // Find the attacking hero sprite and target enemy sprite
    const attackerSprite = Array.from(this.activeHeroSprites.values()).find(sprite => {
      // This is simplified - in a real implementation you'd match by hero ID
      return sprite.children.length > 0;
    });

    const targetSprite = Array.from(this.activeEnemySprites.values()).find(sprite => {
      // This is simplified - in a real implementation you'd match by enemy ID
      return sprite.children.length > 0;
    });

    if (attackerSprite && targetSprite) {
      BattleAnimations.playAttackAnimation(attackerSprite, targetSprite);
      BattleAnimations.playDamageAnimation(targetSprite, data.damage);
    }
  }

  private handleEnemyDefeatedAnimation(data: any): void {
    // Find and animate the defeated enemy
    const defeatedSprite = Array.from(this.activeEnemySprites.values()).find(sprite => {
      return sprite.children.length > 0;
    });

    if (defeatedSprite) {
      BattleAnimations.playDeathAnimation(defeatedSprite, () => {
        // Remove the sprite after death animation
        if (defeatedSprite.parent) {
          defeatedSprite.parent.removeChild(defeatedSprite);
        }
      });
    }

    // Animate the victorious hero
    const victorSprite = Array.from(this.activeHeroSprites.values()).find(sprite => {
      return sprite.children.length > 0;
    });

    if (victorSprite) {
      BattleAnimations.playVictoryAnimation(victorSprite);
    }
  }

  private handleWaveSpawnedEffect(data: any): void {
    // Add a flash effect to indicate new wave
    const flash = new PIXI.Graphics();
    flash.rect(0, 0, 400, 300);
    flash.fill({ color: 0xFFFFFF, alpha: 0.3 });
    this.battleVisualizationContainer.addChild(flash);

    // Remove flash after brief moment
    setTimeout(() => {
      if (flash.parent) {
        flash.parent.removeChild(flash);
      }
    }, 200);
  }

}