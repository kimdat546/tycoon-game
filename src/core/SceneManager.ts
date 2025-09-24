import * as PIXI from 'pixi.js';
import { EventBus } from './EventBus';
import { Scene } from './Scene';

export class SceneManager {
  private stage: PIXI.Container;
  private eventBus: EventBus;
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private currentSceneId: string | null = null;

  constructor(stage: PIXI.Container, eventBus: EventBus) {
    this.stage = stage;
    this.eventBus = eventBus;

    // Listen for scene change events
    this.eventBus.on('scene-change', (sceneId: string) => {
      this.switchTo(sceneId);
    });
  }

  addScene(id: string, scene: Scene): void {
    this.scenes.set(id, scene);
    scene.setEventBus(this.eventBus);
  }

  removeScene(id: string): void {
    const scene = this.scenes.get(id);
    if (scene) {
      if (this.currentSceneId === id) {
        this.currentScene = null;
        this.currentSceneId = null;
        this.stage.removeChildren();
      }
      scene.cleanup();
      this.scenes.delete(id);
    }
  }

  switchTo(sceneId: string): void {
    const newScene = this.scenes.get(sceneId);
    if (!newScene) {
      console.error(`Scene '${sceneId}' not found`);
      return;
    }

    // Cleanup current scene
    if (this.currentScene) {
      this.currentScene.cleanup();
      this.stage.removeChildren();
    }

    // Switch to new scene
    this.currentScene = newScene;
    this.currentSceneId = sceneId;
    
    // Initialize and add to stage
    this.currentScene.init();
    this.stage.addChild(this.currentScene);

    console.log(`Switched to scene: ${sceneId}`);
  }

  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  getCurrentSceneId(): string | null {
    return this.currentSceneId;
  }

  update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }
}