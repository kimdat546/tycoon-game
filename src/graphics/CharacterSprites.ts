import * as PIXI from 'pixi.js';
import { HeroRarity } from '../entities/Hero';

export interface CharacterSpriteOptions {
  width?: number;
  height?: number;
  scale?: number;
  showHealthBar?: boolean;
  showLevel?: boolean;
}

export class CharacterSprites {
  private static textureCache: Map<string, PIXI.Texture> = new Map();
  private static renderer: PIXI.Renderer | null = null;

  static setRenderer(renderer: PIXI.Renderer): void {
    this.renderer = renderer;
  }

  // Hero sprite creation based on class and rarity
  static createHeroSprite(
    heroClass: string,
    rarity: HeroRarity,
    options: CharacterSpriteOptions = {}
  ): PIXI.Container {
    const container = new PIXI.Container();
    const cacheKey = `hero_${heroClass}_${rarity}`;
    
    // Get or create base texture
    let texture = this.textureCache.get(cacheKey);
    if (!texture) {
      texture = this.generateHeroTexture(heroClass, rarity, options);
      this.textureCache.set(cacheKey, texture);
    }

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    container.addChild(sprite);

    // Add rarity glow effect
    const glowEffect = this.createRarityGlow(rarity);
    if (glowEffect) {
      container.addChild(glowEffect);
    }

    return container;
  }

  // Enemy sprite creation based on type and level
  static createEnemySprite(
    enemyType: string,
    level: number,
    options: CharacterSpriteOptions = {}
  ): PIXI.Container {
    const container = new PIXI.Container();
    const cacheKey = `enemy_${enemyType}_${Math.floor(level/5)}`;
    
    let texture = this.textureCache.get(cacheKey);
    if (!texture) {
      texture = this.generateEnemyTexture(enemyType, level, options);
      this.textureCache.set(cacheKey, texture);
    }

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    container.addChild(sprite);

    return container;
  }

  // Generate hero texture based on class and rarity
  private static generateHeroTexture(
    heroClass: string,
    rarity: HeroRarity,
    options: CharacterSpriteOptions
  ): PIXI.Texture {
    const width = options.width || 48;
    const height = options.height || 48;
    const graphics = new PIXI.Graphics();

    // Base colors by class
    const classColors = this.getClassColors(heroClass);
    const rarityColors = this.getRarityColors(rarity);

    // Draw character body (circle)
    graphics.circle(width/2, height/2, width/3);
    graphics.fill(classColors.primary);
    graphics.stroke({ width: 2, color: rarityColors.border });

    // Draw class-specific details
    this.drawClassDetails(graphics, heroClass, width, height, classColors);

    // Draw rarity indicators
    this.drawRarityIndicators(graphics, rarity, width, height, rarityColors);

    return this.renderer?.generateTexture(graphics) || new PIXI.Texture(PIXI.BaseTexture.WHITE);
  }

  // Generate enemy texture based on type and level
  private static generateEnemyTexture(
    enemyType: string,
    level: number,
    options: CharacterSpriteOptions
  ): PIXI.Texture {
    const width = options.width || 40;
    const height = options.height || 40;
    const graphics = new PIXI.Graphics();

    const enemyColors = this.getEnemyColors(enemyType);
    const levelTier = Math.floor(level / 10);

    // Draw enemy body (depends on type)
    switch (enemyType.toLowerCase()) {
      case 'goblin':
        this.drawGoblinShape(graphics, width, height, enemyColors, levelTier);
        break;
      case 'orc':
        this.drawOrcShape(graphics, width, height, enemyColors, levelTier);
        break;
      case 'skeleton':
        this.drawSkeletonShape(graphics, width, height, enemyColors, levelTier);
        break;
      case 'dragon':
        this.drawDragonShape(graphics, width, height, enemyColors, levelTier);
        break;
      default:
        this.drawGenericEnemyShape(graphics, width, height, enemyColors, levelTier);
    }

    return this.renderer?.generateTexture(graphics) || new PIXI.Texture(PIXI.BaseTexture.WHITE);
  }

  // Helper methods for class colors
  private static getClassColors(heroClass: string): { primary: number; secondary: number; accent: number } {
    switch (heroClass.toLowerCase()) {
      case 'warrior':
        return { primary: 0x8B4513, secondary: 0xA0522D, accent: 0xCD853F }; // Brown/Bronze
      case 'mage':
        return { primary: 0x4169E1, secondary: 0x6495ED, accent: 0x87CEEB }; // Blue
      case 'archer':
        return { primary: 0x228B22, secondary: 0x32CD32, accent: 0x90EE90 }; // Green
      case 'thief':
        return { primary: 0x483D8B, secondary: 0x6A5ACD, accent: 0x9370DB }; // Purple
      case 'healer':
        return { primary: 0xFFD700, secondary: 0xFFA500, accent: 0xFFFFE0 }; // Gold/Yellow
      default:
        return { primary: 0x696969, secondary: 0x808080, accent: 0xA9A9A9 }; // Gray
    }
  }

  // Helper methods for rarity colors
  private static getRarityColors(rarity: HeroRarity): { border: number; glow: number; star: number } {
    switch (rarity) {
      case HeroRarity.COMMON:
        return { border: 0x808080, glow: 0x404040, star: 0xC0C0C0 }; // Gray
      case HeroRarity.UNCOMMON:
        return { border: 0x00FF00, glow: 0x004000, star: 0x90EE90 }; // Green
      case HeroRarity.RARE:
        return { border: 0x0080FF, glow: 0x002040, star: 0x87CEEB }; // Blue
      case HeroRarity.EPIC:
        return { border: 0x8000FF, glow: 0x200040, star: 0xDA70D6 }; // Purple
      case HeroRarity.LEGENDARY:
        return { border: 0xFFD700, glow: 0x404000, star: 0xFFFF00 }; // Gold
      default:
        return { border: 0x808080, glow: 0x404040, star: 0xC0C0C0 };
    }
  }

  // Helper methods for enemy colors
  private static getEnemyColors(enemyType: string): { primary: number; secondary: number; accent: number } {
    switch (enemyType.toLowerCase()) {
      case 'goblin':
        return { primary: 0x8FBC8F, secondary: 0x556B2F, accent: 0x9ACD32 }; // Green
      case 'orc':
        return { primary: 0x8B4513, secondary: 0x654321, accent: 0xA0522D }; // Brown
      case 'skeleton':
        return { primary: 0xF5F5DC, secondary: 0xE5E5E5, accent: 0xFFFFFF }; // Bone white
      case 'dragon':
        return { primary: 0xDC143C, secondary: 0xB22222, accent: 0xFF6347 }; // Red
      default:
        return { primary: 0x2F4F4F, secondary: 0x1C1C1C, accent: 0x696969 }; // Dark gray
    }
  }

  // Draw class-specific details
  private static drawClassDetails(
    graphics: PIXI.Graphics,
    heroClass: string,
    width: number,
    height: number,
    colors: { primary: number; secondary: number; accent: number }
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    switch (heroClass.toLowerCase()) {
      case 'warrior':
        // Draw sword
        graphics.rect(centerX - 2, centerY - 15, 4, 20);
        graphics.fill(colors.accent);
        graphics.rect(centerX - 4, centerY - 18, 8, 3);
        graphics.fill(colors.secondary);
        break;

      case 'mage':
        // Draw staff
        graphics.rect(centerX - 1, centerY - 15, 2, 18);
        graphics.fill(colors.secondary);
        graphics.circle(centerX, centerY - 15, 3);
        graphics.fill(colors.accent);
        break;

      case 'archer':
        // Draw bow
        graphics.moveTo(centerX - 6, centerY - 8);
        graphics.quadraticCurveTo(centerX - 10, centerY, centerX - 6, centerY + 8);
        graphics.stroke({ width: 2, color: colors.secondary });
        break;

      case 'thief':
        // Draw daggers
        graphics.rect(centerX - 6, centerY - 8, 2, 8);
        graphics.rect(centerX + 4, centerY - 8, 2, 8);
        graphics.fill(colors.accent);
        break;

      case 'healer':
        // Draw cross
        graphics.rect(centerX - 1, centerY - 8, 2, 16);
        graphics.rect(centerX - 6, centerY - 1, 12, 2);
        graphics.fill(colors.accent);
        break;
    }
  }

  // Draw rarity indicators (stars)
  private static drawRarityIndicators(
    graphics: PIXI.Graphics,
    rarity: HeroRarity,
    width: number,
    height: number,
    colors: { border: number; glow: number; star: number }
  ): void {
    const starCount = rarity + 1;
    const starSize = 3;
    const startX = width/2 - (starCount * starSize);

    for (let i = 0; i < starCount; i++) {
      const x = startX + (i * starSize * 2);
      const y = height - 8;
      this.drawStar(graphics, x, y, starSize, colors.star);
    }
  }

  // Draw enemy shapes
  private static drawGoblinShape(
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    colors: { primary: number; secondary: number; accent: number },
    levelTier: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Body
    graphics.circle(centerX, centerY, width/3);
    graphics.fill(colors.primary);

    // Ears
    graphics.moveTo(centerX - 8, centerY - 8);
    graphics.lineTo(centerX - 12, centerY - 15);
    graphics.lineTo(centerX - 4, centerY - 12);
    graphics.fill(colors.secondary);

    graphics.moveTo(centerX + 8, centerY - 8);
    graphics.lineTo(centerX + 12, centerY - 15);
    graphics.lineTo(centerX + 4, centerY - 12);
    graphics.fill(colors.secondary);

    // Level tier effects
    if (levelTier > 0) {
      graphics.circle(centerX, centerY, width/3 + 2);
      graphics.stroke({ width: levelTier, color: colors.accent });
    }
  }

  private static drawOrcShape(
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    colors: { primary: number; secondary: number; accent: number },
    levelTier: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Body (larger than goblin)
    graphics.circle(centerX, centerY, width/2.5);
    graphics.fill(colors.primary);

    // Tusks
    graphics.rect(centerX - 4, centerY + 5, 2, 6);
    graphics.rect(centerX + 2, centerY + 5, 2, 6);
    graphics.fill(colors.accent);

    if (levelTier > 0) {
      graphics.circle(centerX, centerY, width/2.5 + 2);
      graphics.stroke({ width: levelTier + 1, color: colors.accent });
    }
  }

  private static drawSkeletonShape(
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    colors: { primary: number; secondary: number; accent: number },
    levelTier: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Skull
    graphics.circle(centerX, centerY, width/3);
    graphics.fill(colors.primary);

    // Eye sockets
    graphics.circle(centerX - 4, centerY - 2, 2);
    graphics.circle(centerX + 4, centerY - 2, 2);
    graphics.fill(0x000000);

    if (levelTier > 0) {
      graphics.circle(centerX, centerY, width/3 + 2);
      graphics.stroke({ width: levelTier, color: 0x800080 }); // Purple for undead
    }
  }

  private static drawDragonShape(
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    colors: { primary: number; secondary: number; accent: number },
    levelTier: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Dragon head (triangle)
    graphics.moveTo(centerX, centerY - 10);
    graphics.lineTo(centerX - 12, centerY + 8);
    graphics.lineTo(centerX + 12, centerY + 8);
    graphics.fill(colors.primary);

    // Wings
    graphics.moveTo(centerX - 15, centerY);
    graphics.quadraticCurveTo(centerX - 20, centerY - 10, centerX - 10, centerY - 5);
    graphics.moveTo(centerX + 15, centerY);
    graphics.quadraticCurveTo(centerX + 20, centerY - 10, centerX + 10, centerY - 5);
    graphics.fill(colors.secondary);

    if (levelTier > 0) {
      // Fire breath effect
      graphics.circle(centerX, centerY + 10, 4 + levelTier);
      graphics.fill(0xFF4500);
    }
  }

  private static drawGenericEnemyShape(
    graphics: PIXI.Graphics,
    width: number,
    height: number,
    colors: { primary: number; secondary: number; accent: number },
    levelTier: number
  ): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Generic enemy (hexagon)
    const sides = 6;
    const radius = width / 3;
    
    graphics.moveTo(centerX + radius, centerY);
    for (let i = 1; i <= sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      graphics.lineTo(x, y);
    }
    graphics.fill(colors.primary);

    if (levelTier > 0) {
      graphics.circle(centerX, centerY, radius + 2);
      graphics.stroke({ width: levelTier, color: colors.accent });
    }
  }

  // Create rarity glow effect
  private static createRarityGlow(rarity: HeroRarity): PIXI.Graphics | null {
    if (rarity < HeroRarity.RARE) return null;

    const graphics = new PIXI.Graphics();
    const colors = this.getRarityColors(rarity);
    
    // Animated glow ring
    graphics.circle(0, 0, 30);
    graphics.stroke({ width: 2, color: colors.glow, alpha: 0.5 });
    
    return graphics;
  }

  // Helper to draw star shape
  private static drawStar(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    size: number,
    color: number
  ): void {
    const points = 5;
    const outerRadius = size;
    const innerRadius = size / 2;

    graphics.moveTo(x + outerRadius, y);
    
    for (let i = 1; i <= points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + radius * Math.cos(angle - Math.PI / 2);
      const py = y + radius * Math.sin(angle - Math.PI / 2);
      graphics.lineTo(px, py);
    }
    
    graphics.fill(color);
  }

  // Create health bar for combat display
  static createHealthBar(currentHp: number, maxHp: number, width: number = 40): PIXI.Container {
    const container = new PIXI.Container();
    
    // Background
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, width, 4);
    bg.fill(0x800000);
    container.addChild(bg);
    
    // Health bar
    const healthWidth = (currentHp / maxHp) * width;
    const health = new PIXI.Graphics();
    health.rect(0, 0, healthWidth, 4);
    health.fill(currentHp > maxHp * 0.3 ? 0x00FF00 : 0xFF0000);
    container.addChild(health);
    
    container.x = -width / 2;
    container.y = -30;
    
    return container;
  }

  // Cleanup cache
  static clearCache(): void {
    this.textureCache.clear();
  }
}