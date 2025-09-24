import * as PIXI from 'pixi.js';

export class AssetManager {
  private assets: Map<string, any> = new Map();
  private loadPromises: Map<string, Promise<any>> = new Map();

  async loadAsset(key: string, url: string): Promise<any> {
    if (this.assets.has(key)) {
      return this.assets.get(key);
    }

    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key);
    }

    const loadPromise = PIXI.Assets.load(url).then(asset => {
      this.assets.set(key, asset);
      this.loadPromises.delete(key);
      return asset;
    }).catch(error => {
      console.error(`Failed to load asset ${key} from ${url}:`, error);
      this.loadPromises.delete(key);
      throw error;
    });

    this.loadPromises.set(key, loadPromise);
    return loadPromise;
  }

  getAsset(key: string): any {
    return this.assets.get(key);
  }

  hasAsset(key: string): boolean {
    return this.assets.has(key);
  }

  unloadAsset(key: string): void {
    this.assets.delete(key);
  }

  clear(): void {
    this.assets.clear();
    this.loadPromises.clear();
  }
}