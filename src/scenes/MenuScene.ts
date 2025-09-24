import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';

export class MenuScene extends Scene {
  private title!: PIXI.Text;
  private startButton!: Button;
  private summonButton!: Button;
  private towerButton!: Button;
  private heroesButton!: Button;

  init(): void {
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.layoutElements();
  }

  update(): void {
    // Menu scene doesn't need constant updates
    // But we could add subtle animations here later
  }

  cleanup(): void {
    // Remove event listeners if any
    this.removeChildren();
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill(0x0f0f23);
    this.addChild(bg);

    // Add some decorative elements
    const stars = new PIXI.Graphics();
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 768;
      const size = Math.random() * 2 + 1;
      stars.circle(x, y, size);
      stars.fill(0xffffff);
    }
    this.addChild(stars);
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: 'Eternal Tower',
      style: {
        fontSize: 64,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        dropShadow: {
          color: 0x000000,
          alpha: 0.8,
          angle: Math.PI / 4,
          distance: 4,
        },
      },
    });
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    const subtitle = new PIXI.Text({
      text: 'Infinity Gacha Chronicles',
      style: {
        fontSize: 24,
        fill: 0xcccccc,
        fontFamily: 'Arial',
        fontStyle: 'italic',
      },
    });
    subtitle.anchor.set(0.5);
    this.addChild(subtitle);
    
    // Position subtitle below title
    subtitle.y = this.title.height / 2 + 20;
  }

  private createButtons(): void {
    this.startButton = new Button('New Game', 200, 60);
    this.startButton.onClick = () => {
      console.log('Starting new game...');
      // For now, just switch to summon scene when it's ready
      this.eventBus?.emit('scene-change', 'summon');
    };

    this.summonButton = new Button('Summon Heroes', 200, 60);
    this.summonButton.onClick = () => {
      console.log('Opening summon scene...');
      this.eventBus?.emit('scene-change', 'summon');
    };

    this.towerButton = new Button('Tower', 200, 60);
    this.towerButton.onClick = () => {
      console.log('Opening tower scene...');
      this.eventBus?.emit('scene-change', 'tower');
    };

    this.heroesButton = new Button('Heroes', 200, 60);
    this.heroesButton.onClick = () => {
      console.log('Opening heroes scene...');
      this.eventBus?.emit('scene-change', 'heroes');
    };

    const equipmentButton = new Button('Equipment', 200, 60);
    equipmentButton.onClick = () => {
      console.log('Opening equipment scene...');
      this.eventBus?.emit('scene-change', 'equipment');
    };

    const progressionButton = new Button('Progression', 200, 60);
    progressionButton.onClick = () => {
      console.log('Opening progression scene...');
      this.eventBus?.emit('scene-change', 'progression');
    };

    this.addChild(this.startButton);
    this.addChild(this.summonButton);
    this.addChild(this.towerButton);
    this.addChild(this.heroesButton);
    const saveLoadButton = new Button('Save / Load', 200, 60);
    saveLoadButton.onClick = () => {
      console.log('Opening save/load scene...');
      this.eventBus?.emit('scene-change', 'saveload');
    };

    this.addChild(equipmentButton);
    this.addChild(progressionButton);
    this.addChild(saveLoadButton);
  }

  private layoutElements(): void {
    // Center title
    this.title.position.set(512, 150);
    
    // Center subtitle below title
    const subtitle = this.children.find(child => 
      child instanceof PIXI.Text && child.text === 'Infinity Gacha Chronicles'
    ) as PIXI.Text;
    if (subtitle) {
      subtitle.position.set(512, 190);
    }

    // Layout buttons vertically
    const startY = 350;
    const spacing = 80;

    this.startButton.position.set(512, startY);
    this.summonButton.position.set(512, startY + spacing);
    this.towerButton.position.set(512, startY + spacing * 2);
    this.heroesButton.position.set(512, startY + spacing * 3);
    
    // Position equipment and progression buttons
    const equipmentButton = this.children.find(child => 
      child instanceof Button && (child as any).text?.text === 'Equipment'
    ) as Button;
    if (equipmentButton) {
      equipmentButton.position.set(512, startY + spacing * 4);
    }
    
    const progressionButton = this.children.find(child => 
      child instanceof Button && (child as any).text?.text === 'Progression'
    ) as Button;
    if (progressionButton) {
      progressionButton.position.set(512, startY + spacing * 5);
    }
    
    const saveLoadButton = this.children.find(child => 
      child instanceof Button && (child as any).text?.text === 'Save / Load'
    ) as Button;
    if (saveLoadButton) {
      saveLoadButton.position.set(512, startY + spacing * 6);
    }
  }
}