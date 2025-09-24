import * as PIXI from 'pixi.js';

export class Button extends PIXI.Container {
  private background!: PIXI.Graphics;
  private buttonLabel!: PIXI.Text;
  private _width: number;
  private _height: number;
  private _onClick?: () => void;

  constructor(text: string, width: number = 200, height: number = 60) {
    super();

    this._width = width;
    this._height = height;

    this.createBackground();
    this.createLabel(text);
    this.setupInteractivity();
  }

  set onClick(callback: () => void) {
    this._onClick = callback;
  }

  private createBackground(): void {
    this.background = new PIXI.Graphics();
    this.updateBackground(false);
    this.addChild(this.background);
  }

  private createLabel(text: string): void {
    this.buttonLabel = new PIXI.Text({
      text,
      style: {
        fontSize: 18,
        fill: 0xffffff,
        fontFamily: 'Arial',
        fontWeight: 'bold',
      },
    });
    
    this.buttonLabel.anchor.set(0.5);
    this.buttonLabel.position.set(this._width / 2, this._height / 2);
    this.addChild(this.buttonLabel);
  }

  private setupInteractivity(): void {
    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerdown', () => {
      this.updateBackground(true);
      this.scale.set(0.95);
    });

    this.on('pointerup', () => {
      this.updateBackground(false);
      this.scale.set(1);
      if (this._onClick) {
        this._onClick();
      }
    });

    this.on('pointerupoutside', () => {
      this.updateBackground(false);
      this.scale.set(1);
    });

    this.on('pointerover', () => {
      if (!this.isPressed()) {
        this.updateBackground(false, true);
      }
    });

    this.on('pointerout', () => {
      if (!this.isPressed()) {
        this.updateBackground(false, false);
      }
    });
  }

  private updateBackground(pressed: boolean = false, hovered: boolean = false): void {
    this.background.clear();
    
    let fillColor = 0x4a4a8a;
    let strokeColor = 0x6a6aaa;
    
    if (pressed) {
      fillColor = 0x3a3a7a;
      strokeColor = 0x5a5a9a;
    } else if (hovered) {
      fillColor = 0x5a5a9a;
      strokeColor = 0x7a7aba;
    }
    
    this.background.roundRect(0, 0, this._width, this._height, 8);
    this.background.fill(fillColor);
    this.background.stroke({ width: 2, color: strokeColor });
  }

  private isPressed(): boolean {
    return this.scale.x < 1;
  }

  setText(text: string): void {
    this.buttonLabel.text = text;
  }

  setEnabled(enabled: boolean): void {
    this.interactive = enabled;
    this.alpha = enabled ? 1 : 0.6;
    this.cursor = enabled ? 'pointer' : 'default';
  }
}