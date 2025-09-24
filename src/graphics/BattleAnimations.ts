import * as PIXI from 'pixi.js';
import { CharacterSprites } from './CharacterSprites';
import { Hero } from '../entities/Hero';
import { Enemy } from '../entities/Enemy';

export interface AnimationConfig {
  duration: number;
  easing?: (t: number) => number;
  repeat?: boolean;
  yoyo?: boolean;
}

export class BattleAnimations {
  private static activeAnimations: Map<string, PIXI.Ticker> = new Map();

  // Basic easing functions
  static easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  static easeElastic(t: number): number {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * (2 * Math.PI) / 0.4) + 1;
  }

  // Create animated character sprite for battle
  static createAnimatedCharacter(
    hero: Hero,
    position: { x: number; y: number },
    isInBattle: boolean = false
  ): PIXI.Container {
    const container = new PIXI.Container();
    container.x = position.x;
    container.y = position.y;

    // Create character sprite
    const characterSprite = CharacterSprites.createHeroSprite(
      hero.class || 'warrior',
      hero.rarity,
      { width: 48, height: 48 }
    );
    container.addChild(characterSprite);

    // Add health bar
    const healthBar = CharacterSprites.createHealthBar(
      hero.stats.hp,
      hero.stats.hp,
      40
    );
    container.addChild(healthBar);

    // Add name label
    const nameText = new PIXI.Text({
      text: hero.name,
      style: {
        fontSize: 10,
        fill: 0xFFFFFF,
        fontFamily: 'Arial'
      }
    });
    nameText.anchor.set(0.5);
    nameText.y = 35;
    container.addChild(nameText);

    // Add battle animations if in battle
    if (isInBattle) {
      this.addIdleAnimation(characterSprite, hero.id);
      this.addBattleReadyEffect(container);
    }

    return container;
  }

  // Create animated enemy sprite
  static createAnimatedEnemy(
    enemy: Enemy,
    position: { x: number; y: number }
  ): PIXI.Container {
    const container = new PIXI.Container();
    container.x = position.x;
    container.y = position.y;

    // Create enemy sprite
    const enemySprite = CharacterSprites.createEnemySprite(
      enemy.type,
      enemy.level,
      { width: 40, height: 40 }
    );
    container.addChild(enemySprite);

    // Add health bar
    const healthBar = CharacterSprites.createHealthBar(
      enemy.currentHp,
      enemy.stats.hp,
      35
    );
    container.addChild(healthBar);

    // Add level indicator
    const levelText = new PIXI.Text({
      text: `Lv.${enemy.level}`,
      style: {
        fontSize: 8,
        fill: 0xFFFF00,
        fontFamily: 'Arial'
      }
    });
    levelText.anchor.set(0.5);
    levelText.y = 30;
    container.addChild(levelText);

    // Add idle animation
    this.addIdleAnimation(enemySprite, enemy.id);

    return container;
  }

  // Idle breathing animation
  static addIdleAnimation(sprite: PIXI.Container, id: string): void {
    if (this.activeAnimations.has(`idle_${id}`)) {
      this.activeAnimations.get(`idle_${id}`)?.destroy();
    }

    const ticker = new PIXI.Ticker();
    let elapsed = 0;

    ticker.add(() => {
      elapsed += ticker.deltaTime * 0.02;
      const breathe = Math.sin(elapsed) * 0.1 + 1;
      sprite.scale.set(breathe, breathe);
    });

    ticker.start();
    this.activeAnimations.set(`idle_${id}`, ticker);
  }

  // Battle ready glow effect
  static addBattleReadyEffect(container: PIXI.Container): void {
    const glow = new PIXI.Graphics();
    glow.circle(0, 0, 35);
    glow.stroke({ width: 2, color: 0x00FF00, alpha: 0.7 });
    container.addChildAt(glow, 0);

    const ticker = new PIXI.Ticker();
    let elapsed = 0;

    ticker.add(() => {
      elapsed += ticker.deltaTime * 0.03;
      glow.alpha = (Math.sin(elapsed) + 1) * 0.3 + 0.2;
    });

    ticker.start();
    // Auto-cleanup after 5 seconds
    setTimeout(() => {
      ticker.destroy();
      if (glow.parent) {
        glow.parent.removeChild(glow);
      }
    }, 5000);
  }

  // Attack animation
  static playAttackAnimation(
    attacker: PIXI.Container,
    target: PIXI.Container,
    onComplete?: () => void
  ): void {
    const originalX = attacker.x;
    const originalY = attacker.y;
    const targetX = target.x;
    const targetY = target.y;

    // Calculate attack direction
    const dx = targetX - originalX;
    const dy = targetY - originalY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;

    // Move towards target (25% of the way)
    const moveX = originalX + normalizedDx * (distance * 0.25);
    const moveY = originalY + normalizedDy * (distance * 0.25);

    const config: AnimationConfig = {
      duration: 300,
      easing: this.easeInOut
    };

    // Attack forward
    this.animateToPosition(attacker, { x: moveX, y: moveY }, config)
      .then(() => {
        // Flash effect on attacker
        this.playFlashEffect(attacker, 0xFF0000);
        
        // Return to original position
        return this.animateToPosition(attacker, { x: originalX, y: originalY }, {
          ...config,
          duration: 200
        });
      })
      .then(() => {
        if (onComplete) onComplete();
      });
  }

  // Damage animation
  static playDamageAnimation(
    target: PIXI.Container,
    damage: number,
    onComplete?: () => void
  ): void {
    // Flash red
    this.playFlashEffect(target, 0xFF0000);

    // Shake animation
    const originalX = target.x;
    const shakeIntensity = Math.min(damage / 10, 5);
    
    const ticker = new PIXI.Ticker();
    let elapsed = 0;
    const duration = 300;

    ticker.add(() => {
      elapsed += ticker.deltaTime * 16.67; // ~60fps
      
      if (elapsed >= duration) {
        target.x = originalX;
        ticker.destroy();
        if (onComplete) onComplete();
        return;
      }

      const progress = elapsed / duration;
      const shake = Math.sin(progress * Math.PI * 8) * shakeIntensity * (1 - progress);
      target.x = originalX + shake;
    });

    ticker.start();

    // Show damage number
    this.showDamageNumber(target, damage);
  }

  // Healing animation
  static playHealingAnimation(
    target: PIXI.Container,
    healing: number,
    onComplete?: () => void
  ): void {
    // Flash green
    this.playFlashEffect(target, 0x00FF00);

    // Gentle float animation
    const originalY = target.y;
    
    const config: AnimationConfig = {
      duration: 500,
      easing: this.easeOut
    };

    this.animateToPosition(target, { x: target.x, y: originalY - 10 }, config)
      .then(() => {
        return this.animateToPosition(target, { x: target.x, y: originalY }, {
          ...config,
          duration: 300
        });
      })
      .then(() => {
        if (onComplete) onComplete();
      });

    // Show healing number
    this.showHealingNumber(target, healing);
  }

  // Death animation
  static playDeathAnimation(
    target: PIXI.Container,
    onComplete?: () => void
  ): void {
    const ticker = new PIXI.Ticker();
    let elapsed = 0;
    const duration = 1000;

    ticker.add(() => {
      elapsed += ticker.deltaTime * 16.67;
      
      if (elapsed >= duration) {
        ticker.destroy();
        if (onComplete) onComplete();
        return;
      }

      const progress = elapsed / duration;
      // Fade out and shrink
      target.alpha = 1 - progress;
      target.scale.set(1 - progress * 0.5);
      // Rotate slightly
      target.rotation = progress * Math.PI * 0.5;
    });

    ticker.start();
  }

  // Flash effect
  static playFlashEffect(target: PIXI.Container, color: number): void {
    const flash = new PIXI.Graphics();
    flash.circle(0, 0, 30);
    flash.fill({ color, alpha: 0.8 });
    target.addChild(flash);

    const ticker = new PIXI.Ticker();
    let elapsed = 0;
    const duration = 150;

    ticker.add(() => {
      elapsed += ticker.deltaTime * 16.67;
      
      if (elapsed >= duration) {
        if (flash.parent) {
          flash.parent.removeChild(flash);
        }
        ticker.destroy();
        return;
      }

      const progress = elapsed / duration;
      flash.alpha = 0.8 * (1 - progress);
    });

    ticker.start();
  }

  // Show floating damage number
  static showDamageNumber(target: PIXI.Container, damage: number): void {
    const damageText = new PIXI.Text({
      text: `-${damage}`,
      style: {
        fontSize: 14,
        fill: 0xFF0000,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    
    damageText.anchor.set(0.5);
    damageText.x = target.x;
    damageText.y = target.y - 30;
    
    if (target.parent) {
      target.parent.addChild(damageText);
    }

    // Animate upward and fade
    const ticker = new PIXI.Ticker();
    let elapsed = 0;
    const duration = 1000;

    ticker.add(() => {
      elapsed += ticker.deltaTime * 16.67;
      
      if (elapsed >= duration) {
        if (damageText.parent) {
          damageText.parent.removeChild(damageText);
        }
        ticker.destroy();
        return;
      }

      const progress = elapsed / duration;
      damageText.y -= 1;
      damageText.alpha = 1 - progress;
    });

    ticker.start();
  }

  // Show floating healing number
  static showHealingNumber(target: PIXI.Container, healing: number): void {
    const healText = new PIXI.Text({
      text: `+${healing}`,
      style: {
        fontSize: 14,
        fill: 0x00FF00,
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }
    });
    
    healText.anchor.set(0.5);
    healText.x = target.x;
    healText.y = target.y - 30;
    
    if (target.parent) {
      target.parent.addChild(healText);
    }

    // Animate upward and fade
    const ticker = new PIXI.Ticker();
    let elapsed = 0;
    const duration = 1000;

    ticker.add(() => {
      elapsed += ticker.deltaTime * 16.67;
      
      if (elapsed >= duration) {
        if (healText.parent) {
          healText.parent.removeChild(healText);
        }
        ticker.destroy();
        return;
      }

      const progress = elapsed / duration;
      healText.y -= 1;
      healText.alpha = 1 - progress;
    });

    ticker.start();
  }

  // Generic position animation
  static animateToPosition(
    target: PIXI.Container,
    endPosition: { x: number; y: number },
    config: AnimationConfig
  ): Promise<void> {
    return new Promise((resolve) => {
      const startX = target.x;
      const startY = target.y;
      const deltaX = endPosition.x - startX;
      const deltaY = endPosition.y - startY;

      const ticker = new PIXI.Ticker();
      let elapsed = 0;

      ticker.add(() => {
        elapsed += ticker.deltaTime * 16.67;
        
        if (elapsed >= config.duration) {
          target.x = endPosition.x;
          target.y = endPosition.y;
          ticker.destroy();
          resolve();
          return;
        }

        const progress = elapsed / config.duration;
        const easedProgress = config.easing ? config.easing(progress) : progress;
        
        target.x = startX + deltaX * easedProgress;
        target.y = startY + deltaY * easedProgress;
      });

      ticker.start();
    });
  }

  // Update health bar animation
  static updateHealthBar(
    character: PIXI.Container,
    currentHp: number,
    maxHp: number
  ): void {
    const healthBarContainer = character.children.find(child => 
      child instanceof PIXI.Container && 
      child.children.some(c => c instanceof PIXI.Graphics)
    );

    if (healthBarContainer) {
      // Remove old health bar
      character.removeChild(healthBarContainer);
    }

    // Add new health bar
    const newHealthBar = CharacterSprites.createHealthBar(currentHp, maxHp, 40);
    character.addChild(newHealthBar);
  }

  // Victory animation
  static playVictoryAnimation(winner: PIXI.Container): void {
    // Jumping animation
    const originalY = winner.y;
    
    this.animateToPosition(winner, { x: winner.x, y: originalY - 20 }, {
      duration: 300,
      easing: this.easeOut
    }).then(() => {
      return this.animateToPosition(winner, { x: winner.x, y: originalY }, {
        duration: 300,
        easing: this.easeInOut
      });
    }).then(() => {
      // Sparkle effect
      this.addSparkleEffect(winner);
    });
  }

  // Sparkle effect for victory
  static addSparkleEffect(target: PIXI.Container): void {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const sparkle = new PIXI.Graphics();
        sparkle.circle(0, 0, 2);
        sparkle.fill(0xFFD700);
        
        const angle = (i / 10) * Math.PI * 2;
        const radius = 30;
        sparkle.x = target.x + Math.cos(angle) * radius;
        sparkle.y = target.y + Math.sin(angle) * radius;
        
        if (target.parent) {
          target.parent.addChild(sparkle);
        }

        // Animate sparkle
        const ticker = new PIXI.Ticker();
        let elapsed = 0;
        const duration = 500;

        ticker.add(() => {
          elapsed += ticker.deltaTime * 16.67;
          
          if (elapsed >= duration) {
            if (sparkle.parent) {
              sparkle.parent.removeChild(sparkle);
            }
            ticker.destroy();
            return;
          }

          const progress = elapsed / duration;
          sparkle.alpha = 1 - progress;
          sparkle.scale.set(1 + progress);
        });

        ticker.start();
      }, i * 100);
    }
  }

  // Cleanup all animations for a character
  static cleanupAnimations(id: string): void {
    const animationsToRemove = Array.from(this.activeAnimations.keys()).filter(key => 
      key.includes(id)
    );
    
    animationsToRemove.forEach(key => {
      const ticker = this.activeAnimations.get(key);
      if (ticker) {
        ticker.destroy();
        this.activeAnimations.delete(key);
      }
    });
  }

  // Cleanup all animations
  static cleanupAllAnimations(): void {
    this.activeAnimations.forEach(ticker => ticker.destroy());
    this.activeAnimations.clear();
  }
}