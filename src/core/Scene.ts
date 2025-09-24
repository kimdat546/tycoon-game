import * as PIXI from 'pixi.js';
import { EventBus } from './EventBus';

export abstract class Scene extends PIXI.Container {
  protected eventBus?: EventBus;

  setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  abstract init(): void;
  abstract update(deltaTime?: number): void;
  abstract cleanup(): void;
}