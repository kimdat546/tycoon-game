export interface SaveData {
  timestamp: number;
  version: string;
  player: {
    level: number;
    experience: number;
  };
  resources: {
    gold: number;
    mana: number;
    wood: number;
    stone: number;
    iron: number;
    crystal: number;
  };
  heroes: any[]; // Legacy field - kept for compatibility
  heroCollection: any;
  heroProgression: any;
  skills: any;
  equipment: any;
  town: {
    buildings: any[];
    population: number;
    level: number;
  };
  battleZones: any;
  tower: {
    currentFloor: number;
    clearedFloors: number[];
  };
  settings: {
    autoSaveEnabled: boolean;
    autoSaveInterval: number; // minutes
  };
}

export class SaveManager {
  private readonly SAVE_KEY = 'eternal-tower-save';
  private readonly BACKUP_SAVE_KEY = 'eternal-tower-save-backup';
  private readonly MAX_SAVE_SLOTS = 5;

  save(data: SaveData, slot: number = 0): boolean {
    try {
      // Create backup before saving
      this.createBackup();
      
      // Add metadata
      const saveWithMeta = {
        ...data,
        timestamp: Date.now(),
        version: '0.2.0',
      };
      
      const serialized = JSON.stringify(saveWithMeta, null, 2);
      const saveKey = slot === 0 ? this.SAVE_KEY : `${this.SAVE_KEY}-slot-${slot}`;
      
      // Check localStorage space
      if (this.getStorageSize() + serialized.length > 5000000) { // 5MB limit
        console.warn('Save data too large, compressing...');
        // Could implement compression here
      }
      
      localStorage.setItem(saveKey, serialized);
      console.log(`Game saved successfully to slot ${slot}`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  load(slot: number = 0): SaveData | null {
    try {
      const saveKey = slot === 0 ? this.SAVE_KEY : `${this.SAVE_KEY}-slot-${slot}`;
      const serialized = localStorage.getItem(saveKey);
      
      if (!serialized) {
        console.log(`No save data found in slot ${slot}`);
        return null;
      }
      
      const data = JSON.parse(serialized) as SaveData;
      
      // Validate save data structure
      if (this.validateSaveData(data)) {
        console.log(`Game loaded successfully from slot ${slot}`);
        return this.migrateOldSaveData(data);
      } else {
        console.warn(`Invalid save data structure in slot ${slot}`);
        // Try to load from backup
        return this.loadFromBackup();
      }
    } catch (error) {
      console.error(`Failed to load game from slot ${slot}:`, error);
      return this.loadFromBackup();
    }
  }

  delete(slot: number = 0): boolean {
    try {
      const saveKey = slot === 0 ? this.SAVE_KEY : `${this.SAVE_KEY}-slot-${slot}`;
      localStorage.removeItem(saveKey);
      console.log(`Save data deleted from slot ${slot}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete save data from slot ${slot}:`, error);
      return false;
    }
  }

  exists(slot: number = 0): boolean {
    const saveKey = slot === 0 ? this.SAVE_KEY : `${this.SAVE_KEY}-slot-${slot}`;
    return localStorage.getItem(saveKey) !== null;
  }

  private validateSaveData(data: any): data is SaveData {
    return (
      data &&
      typeof data.timestamp === 'number' &&
      typeof data.version === 'string' &&
      data.player &&
      typeof data.player.level === 'number' &&
      typeof data.player.experience === 'number' &&
      data.resources &&
      typeof data.resources.gold === 'number' &&
      Array.isArray(data.heroes) &&
      data.tower &&
      typeof data.tower.currentFloor === 'number' &&
      Array.isArray(data.tower.clearedFloors)
    );
  }

  private createBackup(): void {
    try {
      const currentSave = localStorage.getItem(this.SAVE_KEY);
      if (currentSave) {
        localStorage.setItem(this.BACKUP_SAVE_KEY, currentSave);
      }
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
  }

  private loadFromBackup(): SaveData | null {
    try {
      console.log('Attempting to load from backup...');
      const backupData = localStorage.getItem(this.BACKUP_SAVE_KEY);
      if (backupData) {
        const data = JSON.parse(backupData) as SaveData;
        if (this.validateSaveData(data)) {
          console.log('Successfully loaded from backup');
          return data;
        }
      }
      console.warn('No valid backup found');
      return null;
    } catch (error) {
      console.error('Failed to load from backup:', error);
      return null;
    }
  }

  private migrateOldSaveData(data: SaveData): SaveData {
    // Handle migration from older save versions
    const migrated = { ...data };
    
    // Ensure all required fields exist with defaults
    if (!migrated.resources.wood) migrated.resources.wood = 0;
    if (!migrated.resources.stone) migrated.resources.stone = 0;
    if (!migrated.resources.iron) migrated.resources.iron = 0;
    if (!migrated.resources.crystal) migrated.resources.crystal = 0;
    
    if (!migrated.heroProgression) migrated.heroProgression = {};
    if (!migrated.skills) migrated.skills = {};
    if (!migrated.equipment) migrated.equipment = {};
    if (!migrated.heroCollection) migrated.heroCollection = {};
    
    if (!migrated.town) {
      migrated.town = {
        buildings: [],
        population: 0,
        level: 1,
      };
    }
    
    if (!migrated.battleZones) migrated.battleZones = {};
    
    if (!migrated.settings) {
      migrated.settings = {
        autoSaveEnabled: true,
        autoSaveInterval: 5,
      };
    }
    
    return migrated;
  }

  // Save slot management
  getAllSaveSlots(): { slot: number; exists: boolean; timestamp: number; version: string }[] {
    const slots = [];
    for (let i = 0; i < this.MAX_SAVE_SLOTS; i++) {
      const exists = this.exists(i);
      let timestamp = 0;
      let version = 'unknown';
      
      if (exists) {
        try {
          const data = this.load(i);
          if (data) {
            timestamp = data.timestamp;
            version = data.version;
          }
        } catch (error) {
          console.warn(`Failed to read save slot ${i}:`, error);
        }
      }
      
      slots.push({ slot: i, exists, timestamp, version });
    }
    return slots;
  }

  // Storage management
  getStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
      if (key.startsWith('eternal-tower')) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }

  getStorageInfo(): { used: number; available: number; percentage: number } {
    const used = this.getStorageSize();
    const available = 10 * 1024 * 1024; // 10MB typical localStorage limit
    const percentage = Math.round((used / available) * 100);
    
    return { used, available, percentage };
  }

  // Export/Import functionality
  exportSave(slot: number = 0): string | null {
    const data = this.load(slot);
    if (!data) return null;
    
    return JSON.stringify(data, null, 2);
  }

  importSave(saveString: string, slot: number = 0): boolean {
    try {
      const data = JSON.parse(saveString) as SaveData;
      if (this.validateSaveData(data)) {
        return this.save(data, slot);
      } else {
        console.error('Invalid save data for import');
        return false;
      }
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  // Cleanup old saves
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('eternal-tower') && key.includes('old') || key.includes('temp')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Save cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup saves:', error);
    }
  }
}