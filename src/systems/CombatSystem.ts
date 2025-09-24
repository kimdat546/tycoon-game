import { Hero } from '../entities/Hero';
import { Enemy, StatusEffect } from '../entities/Enemy';
import { EventBus } from '../core/EventBus';

export interface CombatUnit {
  id: string;
  name: string;
  isHero: boolean;
  stats: {
    attack: number;
    defense: number;
    hp: number;
    speed: number;
    magic: number;
  };
  currentHp: number;
  statusEffects: ActiveStatusEffect[];
  position: number;
  isAlive: boolean;
}

export interface ActiveStatusEffect extends StatusEffect {
  remainingTurns: number;
  source: string; // ID of the unit that applied this effect
}

export interface CombatAction {
  unitId: string;
  type: 'attack' | 'skill' | 'defend' | 'item';
  targetId?: string;
  skillId?: string;
  damage?: number;
  healing?: number;
  effect?: StatusEffect;
  description: string;
}

export interface CombatResult {
  winner: 'heroes' | 'enemies' | 'ongoing';
  survivors: CombatUnit[];
  rewards?: {
    experience: number;
    gold: number;
    items: string[];
  };
  turnCount: number;
  actions: CombatAction[];
}

export enum CombatPhase {
  PREPARATION = 'preparation',
  COMBAT = 'combat',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
}

export class CombatSystem {
  private eventBus: EventBus;
  private heroes: CombatUnit[] = [];
  private enemies: CombatUnit[] = [];
  private currentPhase: CombatPhase = CombatPhase.PREPARATION;
  private turnOrder: CombatUnit[] = [];
  private currentTurnIndex: number = 0;
  private turnCount: number = 0;
  private combatLog: CombatAction[] = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  // Initialize combat
  startCombat(heroTeam: Hero[], enemyTeam: Enemy[]): void {
    this.heroes = heroTeam.map((hero, index) => this.heroToCombatUnit(hero, index));
    this.enemies = enemyTeam.map((enemy, index) => this.enemyToCombatUnit(enemy, index));
    
    this.currentPhase = CombatPhase.COMBAT;
    this.turnCount = 0;
    this.combatLog = [];
    
    this.calculateTurnOrder();
    this.eventBus.emit('combat-started', {
      heroes: this.heroes,
      enemies: this.enemies,
      turnOrder: this.turnOrder,
    });
    
    console.log('Combat started!');
    this.nextTurn();
  }

  private heroToCombatUnit(hero: Hero, position: number): CombatUnit {
    return {
      id: hero.id,
      name: hero.name,
      isHero: true,
      stats: { ...hero.stats },
      currentHp: hero.stats.hp,
      statusEffects: [],
      position,
      isAlive: true,
    };
  }

  private enemyToCombatUnit(enemy: Enemy, position: number): CombatUnit {
    return {
      id: enemy.id,
      name: enemy.name,
      isHero: false,
      stats: { ...enemy.stats },
      currentHp: enemy.currentHp,
      statusEffects: [],
      position,
      isAlive: true,
    };
  }

  private calculateTurnOrder(): void {
    const allUnits = [...this.heroes, ...this.enemies].filter(unit => unit.isAlive);
    this.turnOrder = allUnits.sort((a, b) => {
      // Sort by speed, then by random for ties
      if (b.stats.speed === a.stats.speed) {
        return Math.random() - 0.5;
      }
      return b.stats.speed - a.stats.speed;
    });
    this.currentTurnIndex = 0;
  }

  // Turn management
  private nextTurn(): void {
    if (this.currentPhase !== CombatPhase.COMBAT) return;

    // Process status effects at start of turn
    this.processStatusEffects();
    
    // Check for combat end
    if (this.checkCombatEnd()) return;

    // Get current unit
    const currentUnit = this.getCurrentUnit();
    if (!currentUnit || !currentUnit.isAlive) {
      this.advanceTurn();
      return;
    }

    this.eventBus.emit('turn-started', {
      unit: currentUnit,
      turnIndex: this.currentTurnIndex,
      turnCount: this.turnCount,
    });

    if (currentUnit.isHero) {
      // Player's turn - wait for input
      this.eventBus.emit('player-turn', { hero: currentUnit });
    } else {
      // AI turn - execute automatically
      setTimeout(() => {
        this.executeAITurn(currentUnit);
      }, 1000);
    }
  }

  private advanceTurn(): void {
    this.currentTurnIndex++;
    
    if (this.currentTurnIndex >= this.turnOrder.length) {
      // Start new round
      this.currentTurnIndex = 0;
      this.turnCount++;
      this.calculateTurnOrder(); // Recalculate in case units died
    }
    
    this.nextTurn();
  }

  private getCurrentUnit(): CombatUnit | null {
    return this.turnOrder[this.currentTurnIndex] || null;
  }

  // Combat actions
  executePlayerAction(action: CombatAction): void {
    if (this.currentPhase !== CombatPhase.COMBAT) return;
    
    const currentUnit = this.getCurrentUnit();
    if (!currentUnit || !currentUnit.isHero || currentUnit.id !== action.unitId) {
      console.warn('Invalid player action');
      return;
    }

    this.executeAction(action);
    this.advanceTurn();
  }

  private executeAITurn(unit: CombatUnit): void {
    const enemy = this.enemies.find(e => e.id === unit.id);
    if (!enemy) return;

    const action = this.generateAIAction(unit);
    this.executeAction(action);
    this.advanceTurn();
  }

  private generateAIAction(unit: CombatUnit): CombatAction {
    // Simple AI: randomly choose between attack and skills
    const validTargets = this.heroes.filter(h => h.isAlive);
    if (validTargets.length === 0) {
      return this.createBasicAttack(unit, validTargets[0]);
    }

    // 70% chance to use basic attack, 30% chance to use skill
    if (Math.random() < 0.7) {
      const target = this.selectTarget(unit, validTargets);
      return this.createBasicAttack(unit, target);
    } else {
      // Use a skill (simplified - just boost self for now)
      return {
        unitId: unit.id,
        type: 'skill',
        targetId: unit.id,
        skillId: 'self_buff',
        description: `${unit.name} uses a skill`,
      };
    }
  }

  private selectTarget(_attacker: CombatUnit, validTargets: CombatUnit[]): CombatUnit {
    // Simple targeting: lowest HP target
    return validTargets.reduce((weakest, current) => 
      current.currentHp < weakest.currentHp ? current : weakest
    );
  }

  private createBasicAttack(attacker: CombatUnit, target: CombatUnit): CombatAction {
    const damage = this.calculateDamage(attacker, target);
    return {
      unitId: attacker.id,
      type: 'attack',
      targetId: target.id,
      damage,
      description: `${attacker.name} attacks ${target.name} for ${damage} damage`,
    };
  }

  private executeAction(action: CombatAction): void {
    this.combatLog.push(action);
    
    switch (action.type) {
      case 'attack':
        this.executeAttack(action);
        break;
      case 'skill':
        this.executeSkill(action);
        break;
      case 'defend':
        this.executeDefend(action);
        break;
    }

    this.eventBus.emit('action-executed', action);
  }

  private executeAttack(action: CombatAction): void {
    const target = this.findUnit(action.targetId!);
    if (!target || !target.isAlive) return;

    const damage = action.damage || 0;
    target.currentHp = Math.max(0, target.currentHp - damage);
    
    if (target.currentHp <= 0) {
      target.isAlive = false;
      this.eventBus.emit('unit-defeated', { unit: target });
    }

    this.eventBus.emit('damage-dealt', {
      target,
      damage,
    });
  }

  private executeSkill(action: CombatAction): void {
    // Simplified skill execution
    if (action.healing) {
      const target = this.findUnit(action.targetId!);
      if (target) {
        target.currentHp = Math.min(target.stats.hp, target.currentHp + action.healing);
        this.eventBus.emit('healing-done', { target, healing: action.healing });
      }
    }
    
    if (action.effect) {
      const target = this.findUnit(action.targetId!);
      if (target) {
        this.applyStatusEffect(target, action.effect, action.unitId);
      }
    }
  }

  private executeDefend(action: CombatAction): void {
    const unit = this.findUnit(action.unitId);
    if (unit) {
      // Defending reduces incoming damage by 50% until next turn
      this.applyStatusEffect(unit, {
        id: 'defending',
        name: 'Defending',
        type: 'defense_up' as any,
        value: 0.5,
        duration: 1,
        description: 'Reduces incoming damage',
      }, unit.id);
    }
  }

  // Damage calculation
  private calculateDamage(attacker: CombatUnit, target: CombatUnit): number {
    const baseAttack = attacker.stats.attack;
    const defense = target.stats.defense;
    
    // Apply status effect modifiers
    let attackModifier = 1;
    let defenseModifier = 1;
    
    attacker.statusEffects.forEach(effect => {
      if (effect.type === 'attack_up') attackModifier += effect.value;
      if (effect.type === 'attack_down') attackModifier -= effect.value;
    });
    
    target.statusEffects.forEach(effect => {
      if (effect.type === 'defense_up') defenseModifier += effect.value;
      if (effect.type === 'defense_down') defenseModifier -= effect.value;
    });
    
    const finalAttack = baseAttack * attackModifier;
    const finalDefense = defense * defenseModifier;
    
    // Damage formula: attack - defense/2, with random variance
    const baseDamage = Math.max(1, finalAttack - finalDefense / 2);
    const variance = 0.15; // ±15% variance
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * variance;
    
    return Math.floor(baseDamage * randomFactor);
  }

  // Status effects
  private applyStatusEffect(unit: CombatUnit, effect: StatusEffect, sourceId: string): void {
    const activeEffect: ActiveStatusEffect = {
      ...effect,
      remainingTurns: effect.duration,
      source: sourceId,
    };
    
    unit.statusEffects.push(activeEffect);
    this.eventBus.emit('status-effect-applied', { unit, effect: activeEffect });
  }

  private processStatusEffects(): void {
    const allUnits = [...this.heroes, ...this.enemies];
    
    allUnits.forEach(unit => {
      unit.statusEffects = unit.statusEffects.filter(effect => {
        // Apply effect
        this.applyStatusEffectTick(unit, effect);
        
        // Reduce duration
        effect.remainingTurns--;
        
        // Remove if expired
        if (effect.remainingTurns <= 0) {
          this.eventBus.emit('status-effect-expired', { unit, effect });
          return false;
        }
        
        return true;
      });
    });
  }

  private applyStatusEffectTick(unit: CombatUnit, effect: ActiveStatusEffect): void {
    switch (effect.type) {
      case 'poison':
      case 'burn':
        const damage = Math.floor(unit.stats.hp * effect.value);
        unit.currentHp = Math.max(0, unit.currentHp - damage);
        this.eventBus.emit('status-damage', { unit, effect, damage });
        break;
      
      case 'regeneration':
        const healing = Math.floor(unit.stats.hp * effect.value);
        unit.currentHp = Math.min(unit.stats.hp, unit.currentHp + healing);
        this.eventBus.emit('status-healing', { unit, effect, healing });
        break;
    }
    
    if (unit.currentHp <= 0) {
      unit.isAlive = false;
      this.eventBus.emit('unit-defeated', { unit });
    }
  }

  // Combat end conditions
  private checkCombatEnd(): boolean {
    const aliveHeroes = this.heroes.filter(h => h.isAlive);
    const aliveEnemies = this.enemies.filter(e => e.isAlive);
    
    if (aliveHeroes.length === 0) {
      this.endCombat('enemies');
      return true;
    }
    
    if (aliveEnemies.length === 0) {
      this.endCombat('heroes');
      return true;
    }
    
    return false;
  }

  private endCombat(winner: 'heroes' | 'enemies'): void {
    this.currentPhase = winner === 'heroes' ? CombatPhase.VICTORY : CombatPhase.DEFEAT;
    
    const result: CombatResult = {
      winner,
      survivors: winner === 'heroes' ? this.heroes.filter(h => h.isAlive) : this.enemies.filter(e => e.isAlive),
      turnCount: this.turnCount,
      actions: this.combatLog,
    };
    
    if (winner === 'heroes') {
      result.rewards = this.calculateRewards();
    }
    
    this.eventBus.emit('combat-ended', result);
    console.log(`Combat ended! Winner: ${winner}`);
  }

  private calculateRewards(): { experience: number; gold: number; items: string[] } {
    let totalExp = 0;
    let totalGold = 0;
    const items: string[] = [];
    
    // Calculate rewards based on defeated enemies
    this.enemies.forEach(enemy => {
      if (!enemy.isAlive) {
        totalExp += 50 + enemy.stats.hp / 10; // Base exp calculation
        totalGold += 20 + enemy.stats.attack; // Base gold calculation
        
        // Random item drops (simplified)
        if (Math.random() < 0.3) {
          const possibleItems = ['iron', 'wood', 'crystal'];
          items.push(possibleItems[Math.floor(Math.random() * possibleItems.length)]);
        }
      }
    });
    
    return { experience: totalExp, gold: totalGold, items };
  }

  // Utility methods
  private findUnit(unitId: string): CombatUnit | null {
    return [...this.heroes, ...this.enemies].find(unit => unit.id === unitId) || null;
  }

  // Getters
  getHeroes(): CombatUnit[] {
    return [...this.heroes];
  }

  getEnemies(): CombatUnit[] {
    return [...this.enemies];
  }

  getCurrentPhase(): CombatPhase {
    return this.currentPhase;
  }

  getTurnCount(): number {
    return this.turnCount;
  }

  getCombatLog(): CombatAction[] {
    return [...this.combatLog];
  }

  // Create quick combat actions for UI
  createAttackAction(attackerId: string, targetId: string): CombatAction {
    const attacker = this.findUnit(attackerId);
    const target = this.findUnit(targetId);
    
    if (!attacker || !target) {
      throw new Error('Invalid attacker or target');
    }
    
    return this.createBasicAttack(attacker, target);
  }

  createDefendAction(unitId: string): CombatAction {
    return {
      unitId,
      type: 'defend',
      description: `${this.findUnit(unitId)?.name} defends`,
    };
  }
}