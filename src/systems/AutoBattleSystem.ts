import { EventBus } from '../core/EventBus';
import { Hero } from '../entities/Hero';
import { Enemy, EnemyFactory } from '../entities/Enemy';
import { Skill, SkillType, SkillTarget, SkillUtils } from '../entities/Skill';
import { HeroProgression } from './HeroProgression';
import { SkillManager } from './SkillManager';

export interface BattleZone {
  id: string;
  name: string;
  level: number;
  monstersPerWave: number;
  waveDelay: number; // seconds between waves
  baseRewards: {
    experience: number;
    gold: number;
    dropChance: number;
  };
  requiredHeroes: number;
  assignedHeroes: Hero[];
  isActive: boolean;
  currentWave: number;
  activeEnemies: Enemy[];
  lastWaveTime: number;
}

export interface AutoBattleState {
  heroId: string;
  zoneId: string;
  currentTarget?: string;
  lastAttackTime: number;
  attackSpeed: number; // attacks per second
  killCount: number;
  totalDamageDealt: number;
  timeInZone: number;
  skillCooldowns: Map<string, number>; // skillId -> cooldown remaining
  lastSkillUsed: number;
  manaRegenTime: number;
}

export class AutoBattleSystem {
  private eventBus: EventBus;
  private battleZones: Map<string, BattleZone> = new Map();
  private heroBattleStates: Map<string, AutoBattleState> = new Map();
  private updateInterval: number = 0;
  private lastUpdateTime: number = 0;
  private heroProgression?: HeroProgression;
  private skillManager?: SkillManager;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.initializeDefaultZones();
    this.setupSystemReferences();
    this.startUpdateLoop();
  }

  private setupSystemReferences(): void {
    // Listen for system initialization
    this.eventBus.on('systems-initialized', (data: any) => {
      this.heroProgression = data.heroProgression;
      this.skillManager = data.skillManager;
      console.log('AutoBattleSystem connected to progression systems');
    });
  }

  private initializeDefaultZones(): void {
    const zones: BattleZone[] = [
      {
        id: 'goblin_camp',
        name: 'Goblin Camp',
        level: 1,
        monstersPerWave: 3,
        waveDelay: 5,
        baseRewards: {
          experience: 20,
          gold: 15,
          dropChance: 0.2,
        },
        requiredHeroes: 1,
        assignedHeroes: [],
        isActive: false,
        currentWave: 1,
        activeEnemies: [],
        lastWaveTime: Date.now(),
      },
      {
        id: 'dark_forest',
        name: 'Dark Forest',
        level: 3,
        monstersPerWave: 4,
        waveDelay: 7,
        baseRewards: {
          experience: 35,
          gold: 25,
          dropChance: 0.3,
        },
        requiredHeroes: 2,
        assignedHeroes: [],
        isActive: false,
        currentWave: 1,
        activeEnemies: [],
        lastWaveTime: Date.now(),
      },
      {
        id: 'orc_stronghold',
        name: 'Orc Stronghold',
        level: 5,
        monstersPerWave: 2,
        waveDelay: 10,
        baseRewards: {
          experience: 60,
          gold: 40,
          dropChance: 0.4,
        },
        requiredHeroes: 3,
        assignedHeroes: [],
        isActive: false,
        currentWave: 1,
        activeEnemies: [],
        lastWaveTime: Date.now(),
      },
      {
        id: 'shadow_realm',
        name: 'Shadow Realm',
        level: 8,
        monstersPerWave: 5,
        waveDelay: 12,
        baseRewards: {
          experience: 100,
          gold: 70,
          dropChance: 0.5,
        },
        requiredHeroes: 4,
        assignedHeroes: [],
        isActive: false,
        currentWave: 1,
        activeEnemies: [],
        lastWaveTime: Date.now(),
      },
    ];

    zones.forEach(zone => {
      this.battleZones.set(zone.id, zone);
    });
  }

  // Hero assignment to zones
  assignHeroToZone(hero: Hero, zoneId: string): boolean {
    const zone = this.battleZones.get(zoneId);
    if (!zone) {
      console.warn(`Zone ${zoneId} not found`);
      return false;
    }

    // Remove hero from current zone if assigned
    this.removeHeroFromAllZones(hero.id);

    // Check if zone has space
    if (zone.assignedHeroes.length >= zone.requiredHeroes) {
      console.warn(`Zone ${zoneId} is full`);
      return false;
    }

    // Assign hero
    zone.assignedHeroes.push(hero);
    zone.isActive = zone.assignedHeroes.length > 0;

    // Create battle state
    this.heroBattleStates.set(hero.id, {
      heroId: hero.id,
      zoneId: zoneId,
      lastAttackTime: Date.now(),
      attackSpeed: this.calculateAttackSpeed(hero),
      killCount: 0,
      totalDamageDealt: 0,
      timeInZone: 0,
      skillCooldowns: new Map(),
      lastSkillUsed: 0,
      manaRegenTime: 0,
    });

    this.eventBus.emit('hero-assigned-to-zone', { hero, zone });
    console.log(`${hero.name} assigned to ${zone.name}`);
    return true;
  }

  removeHeroFromZone(heroId: string): boolean {
    const battleState = this.heroBattleStates.get(heroId);
    if (!battleState) return false;

    const zone = this.battleZones.get(battleState.zoneId);
    if (!zone) return false;

    // Remove from zone
    zone.assignedHeroes = zone.assignedHeroes.filter(h => h.id !== heroId);
    zone.isActive = zone.assignedHeroes.length > 0;

    // Remove battle state
    this.heroBattleStates.delete(heroId);

    this.eventBus.emit('hero-removed-from-zone', { heroId, zoneId: zone.id });
    return true;
  }

  private removeHeroFromAllZones(heroId: string): void {
    this.battleZones.forEach(zone => {
      zone.assignedHeroes = zone.assignedHeroes.filter(h => h.id !== heroId);
      zone.isActive = zone.assignedHeroes.length > 0;
    });
    this.heroBattleStates.delete(heroId);
  }

  // Real-time update loop
  private startUpdateLoop(): void {
    this.lastUpdateTime = Date.now();
    
    const update = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = currentTime;

      this.updateAllZones(deltaTime);
      this.updateHeroBattles(deltaTime);

      this.updateInterval = requestAnimationFrame(update);
    };

    this.updateInterval = requestAnimationFrame(update);
  }

  private updateAllZones(deltaTime: number): void {
    this.battleZones.forEach(zone => {
      if (zone.isActive) {
        this.updateZone(zone, deltaTime);
      }
    });
  }

  private updateZone(zone: BattleZone, deltaTime: number): void {
    const currentTime = Date.now();
    
    // Check if it's time to spawn new wave
    if (zone.activeEnemies.length === 0 && 
        (currentTime - zone.lastWaveTime) >= (zone.waveDelay * 1000)) {
      this.spawnWave(zone);
    }

    // Update existing enemies
    zone.activeEnemies = zone.activeEnemies.filter(enemy => enemy.currentHp > 0);
  }

  private spawnWave(zone: BattleZone): void {
    const enemies: Enemy[] = [];
    
    for (let i = 0; i < zone.monstersPerWave; i++) {
      const enemy = EnemyFactory.generateRandomEnemy(zone.level);
      enemies.push(enemy);
    }

    zone.activeEnemies = enemies;
    zone.currentWave++;
    zone.lastWaveTime = Date.now();

    this.eventBus.emit('wave-spawned', { zone, enemies, wave: zone.currentWave });
    console.log(`Wave ${zone.currentWave} spawned in ${zone.name}: ${enemies.length} enemies`);
  }

  private updateHeroBattles(deltaTime: number): void {
    this.heroBattleStates.forEach((battleState, heroId) => {
      this.updateHeroBattle(battleState, deltaTime);
    });
  }

  private updateHeroBattle(battleState: AutoBattleState, deltaTime: number): void {
    const zone = this.battleZones.get(battleState.zoneId);
    if (!zone || !zone.isActive) return;

    battleState.timeInZone += deltaTime;

    // Update skill cooldowns
    this.updateSkillCooldowns(battleState, deltaTime);

    // Update mana regeneration
    battleState.manaRegenTime += deltaTime;
    if (battleState.manaRegenTime >= 1.0) {
      this.regenerateMana(battleState);
      battleState.manaRegenTime = 0;
    }

    // Check if hero can perform actions
    const currentTime = Date.now();
    const timeSinceLastAttack = (currentTime - battleState.lastAttackTime) / 1000;
    
    if (timeSinceLastAttack >= (1 / battleState.attackSpeed)) {
      this.performHeroAction(battleState, zone);
      battleState.lastAttackTime = currentTime;
    }
  }

  private performHeroAction(battleState: AutoBattleState, zone: BattleZone): void {
    if (zone.activeEnemies.length === 0) return;

    const hero = zone.assignedHeroes.find(h => h.id === battleState.heroId);
    if (!hero) return;

    // Try to use a skill first
    if (this.tryUseSkill(hero, battleState, zone)) {
      return; // Skill was used
    }

    // Fall back to basic attack
    this.performBasicAttack(hero, battleState, zone);
  }

  private performBasicAttack(hero: Hero, battleState: AutoBattleState, zone: BattleZone): void {
    // Select target (first alive enemy)
    const target = zone.activeEnemies.find(e => e.currentHp > 0);
    if (!target) return;

    // Get hero's current stats from progression system
    const heroStats = this.heroProgression?.calculateHeroStats(hero) || hero.stats;

    // Calculate damage
    const damage = this.calculateBasicDamage(heroStats, target);
    target.currentHp = Math.max(0, target.currentHp - damage);
    battleState.totalDamageDealt += damage;

    // Check if enemy is defeated
    if (target.currentHp <= 0) {
      this.handleEnemyDefeated(hero, target, zone, battleState);
    }

    this.eventBus.emit('auto-attack', {
      hero,
      target,
      damage,
      zone: zone.name,
      action: 'basic-attack',
    });
  }

  private handleEnemyDefeated(hero: Hero, enemy: Enemy, zone: BattleZone, battleState: AutoBattleState): void {
    battleState.killCount++;

    // Calculate rewards
    const expGain = zone.baseRewards.experience + Math.floor(enemy.level * 5);
    const goldGain = zone.baseRewards.gold + Math.floor(enemy.level * 2);

    // Use progression system for experience gain
    if (this.heroProgression) {
      this.heroProgression.giveExperience(hero.id, expGain);
    } else {
      // Fallback to old system
      hero.experience += expGain;
      this.checkHeroLevelUp(hero);
    }

    // Generate loot
    const loot = this.generateLoot(enemy, zone);

    this.eventBus.emit('enemy-defeated', {
      hero,
      enemy,
      zone: zone.name,
      rewards: { experience: expGain, gold: goldGain },
      loot,
    });

    this.eventBus.emit('resources-gained', {
      gold: goldGain,
      experience: expGain,
    });

    console.log(`${hero.name} defeated ${enemy.name} for ${expGain} EXP and ${goldGain} gold`);
  }

  private checkHeroLevelUp(hero: Hero): void {
    const expRequired = this.getExpRequired(hero.level);
    if (hero.experience >= expRequired) {
      hero.level++;
      hero.experience -= expRequired;
      
      // Recalculate stats
      // TODO: Integrate with HeroFactory.calculateStats
      
      this.eventBus.emit('hero-level-up', { hero });
      console.log(`${hero.name} leveled up to ${hero.level}!`);
    }
  }

  private generateLoot(enemy: Enemy, zone: BattleZone): string[] {
    const loot: string[] = [];
    
    if (Math.random() < zone.baseRewards.dropChance) {
      // Simple loot table
      const possibleItems = ['iron', 'wood', 'crystal', 'potion'];
      const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      loot.push(item);
    }

    return loot;
  }

  // Helper methods
  private calculateAttackSpeed(hero: Hero): number {
    // Get current hero stats from progression system
    const heroStats = this.heroProgression?.calculateHeroStats(hero) || hero.stats;
    // Base attack speed (attacks per second) based on hero speed
    return 0.5 + (heroStats.speed / 100);
  }

  private calculateBasicDamage(heroStats: any, enemy: Enemy): number {
    const baseDamage = heroStats.attack;
    const defense = enemy.stats.defense;
    const damage = Math.max(1, baseDamage - defense / 2);
    
    // Add some randomness
    const variance = 0.2; // ±20%
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    
    return Math.floor(damage * randomFactor);
  }

  private tryUseSkill(hero: Hero, battleState: AutoBattleState, zone: BattleZone): boolean {
    if (!this.skillManager) return false;

    const equippedSkills = this.skillManager.getEquippedSkills(hero.id);
    if (equippedSkills.length === 0) return false;

    // Find a skill that's available and appropriate
    const availableSkills = equippedSkills.filter(skill => {
      // Check cooldown
      const cooldownRemaining = battleState.skillCooldowns.get(skill.id) || 0;
      if (cooldownRemaining > 0) return false;

      // Check mana cost
      if (hero.currentMp < skill.manaCost) return false;

      // Check if skill is useful in current situation
      return this.isSkillUseful(skill, hero, zone);
    });

    if (availableSkills.length === 0) return false;

    // Use the most powerful available skill
    const bestSkill = availableSkills.reduce((best, current) => 
      SkillUtils.getSkillPower(current) > SkillUtils.getSkillPower(best) ? current : best
    );

    return this.useSkill(hero, bestSkill, battleState, zone);
  }

  private isSkillUseful(skill: Skill, hero: Hero, zone: BattleZone): boolean {
    switch (skill.target) {
      case SkillTarget.ENEMY:
      case SkillTarget.ALL_ENEMIES:
      case SkillTarget.RANDOM_ENEMY:
        // Offensive skills - useful if there are enemies
        return zone.activeEnemies.some(e => e.currentHp > 0);
      
      case SkillTarget.SELF:
        // Self-buff skills - always useful
        // Healing skills - useful if HP is low
        if (skill.effects.some(e => e.type === 'healing')) {
          return hero.currentHp < hero.stats.hp * 0.7; // Use healing when below 70% HP
        }
        return true;
      
      case SkillTarget.ALLY:
      case SkillTarget.ALL_ALLIES:
        // Support skills - useful if allies need help (for now, just use on self)
        return true;
      
      default:
        return false;
    }
  }

  private useSkill(hero: Hero, skill: Skill, battleState: AutoBattleState, zone: BattleZone): boolean {
    // Consume mana
    hero.currentMp = Math.max(0, hero.currentMp - skill.manaCost);

    // Set cooldown
    battleState.skillCooldowns.set(skill.id, skill.cooldown);
    battleState.lastSkillUsed = Date.now();

    // Get hero's current stats
    const heroStats = this.heroProgression?.calculateHeroStats(hero) || hero.stats;

    // Apply skill effects
    let totalDamage = 0;
    skill.effects.forEach(effect => {
      const effectValue = SkillUtils.calculateSkillEffect(skill, heroStats, effect);
      
      switch (effect.type) {
        case 'damage':
          totalDamage += this.applyDamageEffect(effect, effectValue, skill.target, zone);
          break;
        case 'healing':
          this.applyHealingEffect(effect, effectValue, skill.target, hero, zone);
          break;
        case 'buff':
        case 'debuff':
          this.applyStatusEffect(effect, effectValue, skill.target, hero, zone);
          break;
        case 'shield':
          this.applyShieldEffect(effect, effectValue, skill.target, hero, zone);
          break;
      }
    });

    if (totalDamage > 0) {
      battleState.totalDamageDealt += totalDamage;
    }

    this.eventBus.emit('auto-skill-used', {
      hero,
      skill,
      zone: zone.name,
      damage: totalDamage,
    });

    console.log(`${hero.name} used ${skill.name} for ${totalDamage} damage`);
    return true;
  }

  private applyDamageEffect(effect: any, effectValue: number, target: SkillTarget, zone: BattleZone): number {
    let totalDamage = 0;
    const aliveEnemies = zone.activeEnemies.filter(e => e.currentHp > 0);
    
    switch (target) {
      case SkillTarget.ENEMY:
        if (aliveEnemies.length > 0) {
          const enemy = aliveEnemies[0];
          const damage = Math.max(1, effectValue - enemy.stats.defense / 4);
          enemy.currentHp = Math.max(0, enemy.currentHp - damage);
          totalDamage += damage;
          
          if (enemy.currentHp <= 0) {
            // Handle defeated enemy but without double rewards
            zone.activeEnemies = zone.activeEnemies.filter(e => e.id !== enemy.id);
          }
        }
        break;
        
      case SkillTarget.ALL_ENEMIES:
        aliveEnemies.forEach(enemy => {
          const damage = Math.max(1, effectValue - enemy.stats.defense / 4);
          enemy.currentHp = Math.max(0, enemy.currentHp - damage);
          totalDamage += damage;
          
          if (enemy.currentHp <= 0) {
            zone.activeEnemies = zone.activeEnemies.filter(e => e.id !== enemy.id);
          }
        });
        break;
        
      case SkillTarget.RANDOM_ENEMY:
        if (aliveEnemies.length > 0) {
          const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          const damage = Math.max(1, effectValue - randomEnemy.stats.defense / 4);
          randomEnemy.currentHp = Math.max(0, randomEnemy.currentHp - damage);
          totalDamage += damage;
          
          if (randomEnemy.currentHp <= 0) {
            zone.activeEnemies = zone.activeEnemies.filter(e => e.id !== randomEnemy.id);
          }
        }
        break;
    }
    
    return totalDamage;
  }

  private applyHealingEffect(effect: any, effectValue: number, target: SkillTarget, hero: Hero, zone: BattleZone): void {
    switch (target) {
      case SkillTarget.SELF:
        hero.currentHp = Math.min(hero.stats.hp, hero.currentHp + effectValue);
        break;
      case SkillTarget.ALLY:
      case SkillTarget.ALL_ALLIES:
        // For now, just heal self since we don't have party system
        hero.currentHp = Math.min(hero.stats.hp, hero.currentHp + effectValue);
        break;
    }
  }

  private applyStatusEffect(effect: any, effectValue: number, target: SkillTarget, hero: Hero, zone: BattleZone): void {
    // Status effects would need a buff/debuff system to track duration
    // For now, just log the effect
    console.log(`Applied ${effect.type} effect: ${effectValue}`);
  }

  private applyShieldEffect(effect: any, effectValue: number, target: SkillTarget, hero: Hero, zone: BattleZone): void {
    // Shield effects would need a shield system
    // For now, just add temporary HP
    switch (target) {
      case SkillTarget.SELF:
        hero.currentHp = Math.min(hero.stats.hp * 1.5, hero.currentHp + effectValue);
        break;
    }
  }

  private updateSkillCooldowns(battleState: AutoBattleState, deltaTime: number): void {
    battleState.skillCooldowns.forEach((cooldown, skillId) => {
      const newCooldown = Math.max(0, cooldown - deltaTime);
      battleState.skillCooldowns.set(skillId, newCooldown);
    });
  }

  private regenerateMana(battleState: AutoBattleState): void {
    const hero = this.getHeroFromBattleState(battleState);
    if (!hero) return;

    const heroStats = this.heroProgression?.calculateHeroStats(hero) || hero.stats;
    const manaRegen = Math.max(1, heroStats.magic / 10); // Regen based on magic stat
    hero.currentMp = Math.min(heroStats.mp, hero.currentMp + manaRegen);
  }

  private getHeroFromBattleState(battleState: AutoBattleState): Hero | undefined {
    const zone = this.battleZones.get(battleState.zoneId);
    return zone?.assignedHeroes.find(h => h.id === battleState.heroId);
  }

  private getExpRequired(level: number): number {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  // Getters
  getBattleZones(): BattleZone[] {
    return Array.from(this.battleZones.values());
  }

  getBattleZone(zoneId: string): BattleZone | undefined {
    return this.battleZones.get(zoneId);
  }

  getHeroBattleState(heroId: string): AutoBattleState | undefined {
    return this.heroBattleStates.get(heroId);
  }

  getActiveZones(): BattleZone[] {
    return Array.from(this.battleZones.values()).filter(zone => zone.isActive);
  }

  // Statistics
  getZoneStats(zoneId: string): any {
    const zone = this.battleZones.get(zoneId);
    if (!zone) return null;

    return {
      zone: zone.name,
      level: zone.level,
      assignedHeroes: zone.assignedHeroes.length,
      requiredHeroes: zone.requiredHeroes,
      currentWave: zone.currentWave,
      activeEnemies: zone.activeEnemies.length,
      isActive: zone.isActive,
    };
  }

  getHeroStats(heroId: string): any {
    const battleState = this.heroBattleStates.get(heroId);
    if (!battleState) return null;

    const zone = this.battleZones.get(battleState.zoneId);

    return {
      heroId,
      zone: zone?.name || 'Unknown',
      timeInZone: Math.floor(battleState.timeInZone),
      killCount: battleState.killCount,
      totalDamage: battleState.totalDamageDealt,
      averageDamage: battleState.killCount > 0 ? 
        Math.floor(battleState.totalDamageDealt / battleState.killCount) : 0,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      cancelAnimationFrame(this.updateInterval);
    }
  }
}