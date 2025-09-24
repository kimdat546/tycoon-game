import * as PIXI from 'pixi.js';
import { Scene } from '../core/Scene';
import { Button } from '../ui/components/Button';

export class SaveLoadScene extends Scene {
  private title!: PIXI.Text;
  private backButton!: Button;
  private saveSlotContainer!: PIXI.Container;
  private infoContainer!: PIXI.Container;
  private storageInfo!: PIXI.Text;
  private selectedSlot: number = 0;

  // Save slot buttons
  private saveButtons: Button[] = [];
  private loadButtons: Button[] = [];
  private deleteButtons: Button[] = [];
  private slotInfoTexts: PIXI.Text[] = [];

  // Additional controls
  private exportButton!: Button;
  private importButton!: Button;
  private autoSaveToggle!: Button;

  init(): void {
    this.createBackground();
    this.createTitle();
    this.createBackButton();
    this.createSaveSlots();
    this.createStorageInfo();
    this.createAdditionalControls();
    this.layoutElements();
    this.setupEventListeners();
  }

  update(): void {
    this.updateStorageInfo();
  }

  cleanup(): void {
    this.removeChildren();
  }

  private createBackground(): void {
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 1024, 768);
    bg.fill(0x0a0a1a);
    this.addChild(bg);
  }

  private createTitle(): void {
    this.title = new PIXI.Text({
      text: 'Save & Load',
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

  private createBackButton(): void {
    this.backButton = new Button('Back to Menu', 150, 50);
    this.backButton.onClick = () => {
      this.eventBus?.emit('scene-change', 'menu');
    };
    this.addChild(this.backButton);
  }

  private createSaveSlots(): void {
    this.saveSlotContainer = new PIXI.Container();
    this.addChild(this.saveSlotContainer);

    for (let i = 0; i < 5; i++) {
      // Slot background
      const slotBg = new PIXI.Graphics();
      slotBg.rect(0, 0, 800, 80);
      slotBg.fill(0x1a1a2a);
      slotBg.stroke({ width: 2, color: 0x3a3a5a });
      slotBg.y = i * 90;
      this.saveSlotContainer.addChild(slotBg);

      // Slot info text
      const slotInfo = new PIXI.Text({
        text: `Slot ${i + 1}: Empty`,
        style: {
          fontSize: 18,
          fill: 0xcccccc,
          fontFamily: 'Arial',
        },
      });
      slotInfo.position.set(20, i * 90 + 30);
      this.saveSlotContainer.addChild(slotInfo);
      this.slotInfoTexts.push(slotInfo);

      // Save button
      const saveBtn = new Button('Save', 80, 30);
      saveBtn.position.set(600, i * 90 + 25);
      saveBtn.onClick = () => this.saveGame(i);
      this.saveSlotContainer.addChild(saveBtn);
      this.saveButtons.push(saveBtn);

      // Load button  
      const loadBtn = new Button('Load', 80, 30);
      loadBtn.position.set(690, i * 90 + 25);
      loadBtn.onClick = () => this.loadGame(i);
      loadBtn.alpha = 0.5; // Start disabled
      this.saveSlotContainer.addChild(loadBtn);
      this.loadButtons.push(loadBtn);

      // Delete button (small)
      const deleteBtn = new Button('×', 30, 30);
      deleteBtn.position.set(780, i * 90 + 25);
      deleteBtn.onClick = () => this.deleteSlot(i);
      deleteBtn.alpha = 0.5; // Start disabled
      this.saveSlotContainer.addChild(deleteBtn);
      this.deleteButtons.push(deleteBtn);
    }

    this.updateSlotInfo();
  }

  private createStorageInfo(): void {
    this.infoContainer = new PIXI.Container();
    this.addChild(this.infoContainer);

    const infoBg = new PIXI.Graphics();
    infoBg.rect(0, 0, 400, 120);
    infoBg.fill(0x1a1a3a);
    infoBg.stroke({ width: 2, color: 0x3a3a6a });
    this.infoContainer.addChild(infoBg);

    this.storageInfo = new PIXI.Text({
      text: 'Loading storage info...',
      style: {
        fontSize: 14,
        fill: 0xcccccc,
        fontFamily: 'Arial',
        wordWrap: true,
        wordWrapWidth: 380,
      },
    });
    this.storageInfo.position.set(10, 10);
    this.infoContainer.addChild(this.storageInfo);
  }

  private createAdditionalControls(): void {
    this.exportButton = new Button('Export Save', 120, 40);
    this.exportButton.onClick = () => this.exportSave();
    this.addChild(this.exportButton);

    this.importButton = new Button('Import Save', 120, 40);
    this.importButton.onClick = () => this.importSave();
    this.addChild(this.importButton);

    this.autoSaveToggle = new Button('Auto-Save: ON', 120, 40);
    this.autoSaveToggle.onClick = () => this.toggleAutoSave();
    this.addChild(this.autoSaveToggle);
  }

  private layoutElements(): void {
    this.title.position.set(512, 50);
    this.backButton.position.set(100, 700);
    
    this.saveSlotContainer.position.set(112, 120);
    this.infoContainer.position.set(550, 580);

    this.exportButton.position.set(100, 580);
    this.importButton.position.set(230, 580);
    this.autoSaveToggle.position.set(360, 580);
  }

  private setupEventListeners(): void {
    this.eventBus?.on('game-saved', () => {
      this.updateSlotInfo();
      console.log('Save completed, updated slot info');
    });

    this.eventBus?.on('save-failed', (data: any) => {
      console.error('Save failed:', data.reason);
      // Could show error notification here
    });
  }

  private updateSlotInfo(): void {
    // Get save manager from application (we'll need to expose this)
    this.eventBus?.emit('request-save-slots', (slots: any[]) => {
      slots.forEach((slot, index) => {
        if (index < this.slotInfoTexts.length) {
          if (slot.exists) {
            const date = new Date(slot.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            this.slotInfoTexts[index].text = `Slot ${index + 1}: ${dateStr} (v${slot.version})`;
            this.loadButtons[index].alpha = 1.0;
            this.deleteButtons[index].alpha = 1.0;
          } else {
            this.slotInfoTexts[index].text = `Slot ${index + 1}: Empty`;
            this.loadButtons[index].alpha = 0.5;
            this.deleteButtons[index].alpha = 0.5;
          }
        }
      });
    });
  }

  private updateStorageInfo(): void {
    this.eventBus?.emit('request-storage-info', (info: any) => {
      const usedMB = (info.used / 1024 / 1024).toFixed(2);
      const availableMB = (info.available / 1024 / 1024).toFixed(2);
      
      this.storageInfo.text = 
        `Storage Usage:\n` +
        `Used: ${usedMB} MB\n` +
        `Available: ${availableMB} MB\n` +
        `Percentage: ${info.percentage}%\n\n` +
        `Auto-save: Every 5 minutes\n` +
        `Last save: Game start`;
    });
  }

  private saveGame(slot: number): void {
    this.eventBus?.emit('manual-save', slot);
    console.log(`Saving to slot ${slot}`);
  }

  private loadGame(slot: number): void {
    this.eventBus?.emit('manual-load', slot);
    console.log(`Loading from slot ${slot}`);
  }

  private deleteSlot(slot: number): void {
    if (confirm(`Are you sure you want to delete save slot ${slot + 1}?`)) {
      this.eventBus?.emit('delete-save', slot);
      this.updateSlotInfo();
      console.log(`Deleted save slot ${slot}`);
    }
  }

  private exportSave(): void {
    this.eventBus?.emit('export-save', this.selectedSlot, (saveString: string | null) => {
      if (saveString) {
        // Create download link
        const blob = new Blob([saveString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eternal-tower-save-slot-${this.selectedSlot}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Save exported successfully');
      } else {
        console.error('Failed to export save');
      }
    });
  }

  private importSave(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const saveString = e.target?.result as string;
          this.eventBus?.emit('import-save', { saveString, slot: this.selectedSlot }, (success: boolean) => {
            if (success) {
              console.log('Save imported successfully');
              this.updateSlotInfo();
            } else {
              console.error('Failed to import save');
            }
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private toggleAutoSave(): void {
    // This would toggle auto-save setting
    console.log('Auto-save toggle clicked (not implemented)');
  }
}