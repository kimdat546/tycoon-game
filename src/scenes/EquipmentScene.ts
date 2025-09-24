import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';
import { EquipmentManager } from '../systems/EquipmentManager';
import { EquipmentFactory } from '../systems/EquipmentFactory';
import { Equipment, EquipmentType, EquipmentRarity, EquipmentUtils } from '../entities/Equipment';
import { HeroCollection } from '../systems/HeroCollection';

export class EquipmentScene extends Scene {
  private title!: PIXI.Text;
  private backButton!: Button;
  private inventoryContainer!: PIXI.Container;
  private equipmentDetailsContainer!: PIXI.Container;
  private heroEquipmentContainer!: PIXI.Container;
  
  // Systems
  private equipmentManager!: EquipmentManager;
  private heroCollection!: HeroCollection;
  
  // State
  private selectedEquipment: Equipment | null = null;
  private selectedHeroId: string | null = null;
  private inventoryPage: number = 0;
  private itemsPerPage: number = 20;

  init(): void {
    // Initialize systems
    this.equipmentManager = new EquipmentManager(this.eventBus!);
    this.heroCollection = new HeroCollection(this.eventBus!);

    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createContainers();
    this.setupEventListeners();
    this.generateTestEquipment();
    this.updateInventoryDisplay();
    this.layoutElements();
  }

  update(): void {
    // Equipment scene updates here
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
      text: 'Equipment Management',
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

    // Test buttons for generating equipment
    const generateButton = new Button({
      text: 'Generate Random',
      width: 150,
      height: 40,
      backgroundColor: 0x2a8a2a,
      textColor: 0xffffff,
      onClick: () => this.generateRandomEquipment()
    });
    generateButton.position.set(200, 20);
    this.addChild(generateButton);

    const enhanceButton = new Button({
      text: 'Enhance Selected',
      width: 150,
      height: 40,
      backgroundColor: 0x8a2a2a,
      textColor: 0xffffff,
      onClick: () => this.enhanceSelectedEquipment()
    });
    enhanceButton.position.set(370, 20);
    this.addChild(enhanceButton);

    const sellButton = new Button({
      text: 'Sell Selected',
      width: 150,
      height: 40,
      backgroundColor: 0x8a6a2a,
      textColor: 0xffffff,
      onClick: () => this.sellSelectedEquipment()
    });
    sellButton.position.set(540, 20);
    this.addChild(sellButton);
  }

  private createContainers(): void {
    // Inventory display
    this.inventoryContainer = new PIXI.Container();
    this.inventoryContainer.position.set(50, 100);
    this.addChild(this.inventoryContainer);

    // Equipment details
    this.equipmentDetailsContainer = new PIXI.Container();
    this.equipmentDetailsContainer.position.set(550, 100);
    this.addChild(this.equipmentDetailsContainer);

    // Hero equipment display
    this.heroEquipmentContainer = new PIXI.Container();
    this.heroEquipmentContainer.position.set(50, 450);
    this.addChild(this.heroEquipmentContainer);
  }

  private setupEventListeners(): void {
    this.eventBus?.on('equipment-enhanced', () => {
      this.updateInventoryDisplay();
      this.updateEquipmentDetails();
    });

    this.eventBus?.on('equipment-sold', () => {
      this.updateInventoryDisplay();
      this.selectedEquipment = null;
      this.updateEquipmentDetails();
    });
  }

  private generateTestEquipment(): void {
    // Generate some test equipment for demonstration
    const testTypes = [EquipmentType.WEAPON, EquipmentType.ARMOR, EquipmentType.HELMET];
    const testSources = ['goblin_camp', 'dark_forest', 'orc_stronghold'];

    for (let i = 0; i < 10; i++) {
      const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
      const randomSource = testSources[Math.floor(Math.random() * testSources.length)];
      const randomLevel = Math.floor(Math.random() * 20) + 1;
      
      const equipment = EquipmentFactory.generateRandomEquipment(randomSource, randomLevel, 2);
      if (equipment) {
        this.equipmentManager.addEquipment(equipment);
      }
    }
  }

  private generateRandomEquipment(): void {
    const sources = ['goblin_camp', 'dark_forest', 'orc_stronghold', 'shadow_realm'];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomLevel = Math.floor(Math.random() * 30) + 1;
    
    const equipment = EquipmentFactory.generateRandomEquipment(randomSource, randomLevel, 5);
    if (equipment) {
      this.equipmentManager.addEquipment(equipment);
      this.updateInventoryDisplay();
      console.log(`Generated ${equipment.name}`);
    }
  }

  private enhanceSelectedEquipment(): void {
    if (!this.selectedEquipment) {
      console.warn('No equipment selected for enhancement');
      return;
    }

    const result = this.equipmentManager.enhanceEquipment(this.selectedEquipment.id);
    if (result.success) {
      console.log(`Successfully enhanced ${this.selectedEquipment.name} to +${result.result.equipment.enhancementLevel}`);
      this.selectedEquipment = result.result.equipment;
    } else {
      console.log(`Enhancement failed for ${this.selectedEquipment.name}`);
    }
  }

  private sellSelectedEquipment(): void {
    if (!this.selectedEquipment) {
      console.warn('No equipment selected for selling');
      return;
    }

    const sellValue = this.equipmentManager.sellEquipment(this.selectedEquipment.id);
    if (sellValue > 0) {
      console.log(`Sold ${this.selectedEquipment.name} for ${sellValue} gold`);
      this.selectedEquipment = null;
    }
  }

  private updateInventoryDisplay(): void {
    // Clear previous display
    this.inventoryContainer.removeChildren();

    const inventory = this.equipmentManager.sortInventory('power');
    const startIndex = this.inventoryPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, inventory.length);

    // Title
    const inventoryTitle = new PIXI.Text({
      text: `Inventory (${inventory.length} items)`,
      style: {
        fontSize: 18,
        fill: 0xFFFFFF,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    this.inventoryContainer.addChild(inventoryTitle);

    // Display inventory items
    for (let i = startIndex; i < endIndex; i++) {
      const equipment = inventory[i];
      const yOffset = 30 + ((i - startIndex) * 25);
      
      const itemContainer = this.createInventoryItem(equipment, yOffset);
      this.inventoryContainer.addChild(itemContainer);
    }

    // Pagination info
    const pageInfo = new PIXI.Text({
      text: `Page ${this.inventoryPage + 1} of ${Math.ceil(inventory.length / this.itemsPerPage)}`,
      style: {
        fontSize: 12,
        fill: 0xCCCCCC,
        fontFamily: 'Arial'
      }
    });
    pageInfo.y = 30 + (this.itemsPerPage * 25);
    this.inventoryContainer.addChild(pageInfo);
  }

  private createInventoryItem(equipment: Equipment, yOffset: number): PIXI.Container {
    const container = new PIXI.Container();
    container.y = yOffset;

    // Background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 450, 22);
    bg.fill({ 
      color: this.selectedEquipment?.id === equipment.id ? 0x444444 : 0x2a2a2a, 
      alpha: 0.8 
    });
    bg.stroke({ width: 1, color: EquipmentUtils.getRarityColor(equipment.rarity) });
    container.addChild(bg);

    // Equipment name with enhancement level
    const enhancementText = EquipmentUtils.getEnhancementDisplayName(equipment.enhancementLevel);
    const nameText = new PIXI.Text({
      text: `${enhancementText} ${equipment.name}`,
      style: {
        fontSize: 12,
        fill: EquipmentUtils.getRarityColor(equipment.rarity),
        fontFamily: 'Arial'
      }
    });
    nameText.x = 5;
    nameText.y = 2;
    container.addChild(nameText);

    // Level and type
    const infoText = new PIXI.Text({
      text: `Lv.${equipment.level} ${equipment.type}`,
      style: {
        fontSize: 10,
        fill: 0xCCCCCC,
        fontFamily: 'Arial'
      }
    });
    infoText.x = 250;
    infoText.y = 4;
    container.addChild(infoText);

    // Power score
    const power = EquipmentUtils.calculatePower(equipment);
    const powerText = new PIXI.Text({
      text: `${power}`,
      style: {
        fontSize: 12,
        fill: 0xFFD700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    powerText.x = 400;
    powerText.y = 2;
    container.addChild(powerText);

    // Make clickable
    bg.eventMode = 'static';
    bg.cursor = 'pointer';
    bg.on('pointerdown', () => {
      this.selectedEquipment = equipment;
      this.updateInventoryDisplay();
      this.updateEquipmentDetails();
    });

    return container;
  }

  private updateEquipmentDetails(): void {
    // Clear previous details
    this.equipmentDetailsContainer.removeChildren();

    if (!this.selectedEquipment) {
      const noSelectionText = new PIXI.Text({
        text: 'Select an item to view details',
        style: {
          fontSize: 16,
          fill: 0x888888,
          fontFamily: 'Arial'
        }
      });
      this.equipmentDetailsContainer.addChild(noSelectionText);
      return;
    }

    const equipment = this.selectedEquipment;
    let yOffset = 0;

    // Title
    const enhancementText = EquipmentUtils.getEnhancementDisplayName(equipment.enhancementLevel);
    const title = new PIXI.Text({
      text: `${enhancementText} ${equipment.name}`,
      style: {
        fontSize: 18,
        fill: EquipmentUtils.getRarityColor(equipment.rarity),
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    title.y = yOffset;
    this.equipmentDetailsContainer.addChild(title);
    yOffset += 30;

    // Basic info
    const basicInfo = [
      `Type: ${equipment.type}`,
      `Rarity: ${EquipmentUtils.getRarityName(equipment.rarity)}`,
      `Level: ${equipment.level}`,
      `Enhancement: +${equipment.enhancementLevel}`,
      `Power: ${EquipmentUtils.calculatePower(equipment)}`,
      `Sell Value: ${equipment.sellValue} gold`
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
      this.equipmentDetailsContainer.addChild(text);
      yOffset += 18;
    });

    yOffset += 10;

    // Stats
    const statsTitle = new PIXI.Text({
      text: 'Stats:',
      style: {
        fontSize: 14,
        fill: 0xFFD700,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    statsTitle.y = yOffset;
    this.equipmentDetailsContainer.addChild(statsTitle);
    yOffset += 20;

    const stats = EquipmentUtils.calculateStats(equipment);
    Object.entries(stats).forEach(([stat, value]) => {
      if (value && value > 0) {
        const statText = new PIXI.Text({
          text: `${stat}: +${value}`,
          style: {
            fontSize: 12,
            fill: 0x90EE90,
            fontFamily: 'Arial'
          }
        });
        statText.y = yOffset;
        this.equipmentDetailsContainer.addChild(statText);
        yOffset += 16;
      }
    });

    // Enhancement cost
    yOffset += 10;
    const enhancementCost = EquipmentUtils.getEnhancementCost(equipment.enhancementLevel);
    if (enhancementCost) {
      const costTitle = new PIXI.Text({
        text: 'Enhancement Cost:',
        style: {
          fontSize: 14,
          fill: 0xFFD700,
          fontFamily: 'Arial',
          fontWeight: 'bold'
        }
      });
      costTitle.y = yOffset;
      this.equipmentDetailsContainer.addChild(costTitle);
      yOffset += 20;

      const costText = new PIXI.Text({
        text: `Gold: ${enhancementCost.goldCost}\nSuccess Rate: ${enhancementCost.successRate}%`,
        style: {
          fontSize: 12,
          fill: 0xFFFFFF,
          fontFamily: 'Arial'
        }
      });
      costText.y = yOffset;
      this.equipmentDetailsContainer.addChild(costText);
    }
  }

  private layoutElements(): void {
    this.title.position.set(512, 30);
    this.backButton.position.set(50, 20);
  }
}