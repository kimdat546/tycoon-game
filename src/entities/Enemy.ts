import { HeroStats, Element } from './Hero';

export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  element: Element;
  level: number;
  
  // Combat stats
  stats: HeroStats;
  currentHp: number;
  
  // AI behavior
  aiType: AIType;
  skills: EnemySkill[];
  
  // Rewards
  rewards: {
    experience: number;
    gold: number;
    dropChance: number;
    possibleDrops: string[];
  };
  
  // Visual
  sprite?: string;
  description: string;
}

export enum EnemyType {
  MINION = 'minion',
  ELITE = 'elite',
  BOSS = 'boss',
  SPECIAL = 'special',
}

export enum AIType {
  AGGRESSIVE = 'aggressive',  // Always attacks strongest target
  DEFENSIVE = 'defensive',    // Focuses on healing/buffing
  BALANCED = 'balanced',      // Mix of attacks and abilities
  TACTICAL = 'tactical',      // Targets weakest or uses strategy
}

export interface EnemySkill {
  id: string;
  name: string;
  type: SkillType;
  damage?: number;
  healing?: number;
  effect?: StatusEffect;
  cooldown: number;
  currentCooldown: number;
  targetType: TargetType;
  description: string;
}

export enum SkillType {
  ATTACK = 'attack',
  HEAL = 'heal',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  SPECIAL = 'special',
}

export enum TargetType {
  SINGLE_ENEMY = 'single_enemy',
  ALL_ENEMIES = 'all_enemies',
  RANDOM_ENEMY = 'random_enemy',
  WEAKEST_ENEMY = 'weakest_enemy',
  STRONGEST_ENEMY = 'strongest_enemy',
  SELF = 'self',
  ALL_ALLIES = 'all_allies',
}

export interface StatusEffect {
  id: string;
  name: string;
  type: StatusType;
  value: number;
  duration: number;
  description: string;
}

export enum StatusType {
  POISON = 'poison',
  BURN = 'burn',
  FREEZE = 'freeze',
  STUN = 'stun',
  ATTACK_UP = 'attack_up',
  ATTACK_DOWN = 'attack_down',
  DEFENSE_UP = 'defense_up',
  DEFENSE_DOWN = 'defense_down',
  SPEED_UP = 'speed_up',
  SPEED_DOWN = 'speed_down',
  REGENERATION = 'regeneration',
}

export class EnemyFactory {
  static createBasicGoblin(level: number = 1): Enemy {
    return {
      id: 'goblin_' + Math.random().toString(36).substr(2, 9),
      name: 'Goblin Warrior',
      type: EnemyType.MINION,
      element: Element.EARTH,
      level,
      stats: {
        attack: 12 + level * 2,
        defense: 8 + level * 1.5,
        hp: 80 + level * 15,
        speed: 10 + level * 1,
        magic: 5 + level * 0.5,
      },
      currentHp: 80 + level * 15,
      aiType: AIType.AGGRESSIVE,
      skills: [
        {
          id: 'slash',
          name: 'Slash',
          type: SkillType.ATTACK,
          damage: 15 + level * 2,
          cooldown: 0,
          currentCooldown: 0,
          targetType: TargetType.SINGLE_ENEMY,
          description: 'A basic sword attack',
        },
        {
          id: 'war_cry',
          name: 'War Cry',
          type: SkillType.BUFF,
          effect: {
            id: 'attack_boost',
            name: 'Attack Boost',
            type: StatusType.ATTACK_UP,
            value: 0.2,
            duration: 3,
            description: 'Increases attack by 20%',
          },
          cooldown: 3,
          currentCooldown: 0,
          targetType: TargetType.SELF,
          description: 'Boosts own attack power',
        },
      ],
      rewards: {
        experience: 25 + level * 5,
        gold: 15 + level * 3,
        dropChance: 0.3,
        possibleDrops: ['iron', 'wood'],
      },
      description: 'A crude but fierce goblin warrior with basic combat skills.',
    };
  }

  static createOrcBrute(level: number = 5): Enemy {
    return {
      id: 'orc_' + Math.random().toString(36).substr(2, 9),
      name: 'Orc Brute',
      type: EnemyType.ELITE,
      element: Element.FIRE,
      level,
      stats: {
        attack: 20 + level * 3,
        defense: 15 + level * 2.5,
        hp: 150 + level * 25,
        speed: 6 + level * 0.8,
        magic: 8 + level * 1,
      },
      currentHp: 150 + level * 25,
      aiType: AIType.BALANCED,
      skills: [
        {
          id: 'heavy_strike',
          name: 'Heavy Strike',
          type: SkillType.ATTACK,
          damage: 25 + level * 4,
          cooldown: 1,
          currentCooldown: 0,
          targetType: TargetType.SINGLE_ENEMY,
          description: 'A powerful melee attack',
        },
        {
          id: 'rage',
          name: 'Berserk Rage',
          type: SkillType.BUFF,
          effect: {
            id: 'berserk',
            name: 'Berserk',
            type: StatusType.ATTACK_UP,
            value: 0.5,
            duration: 2,
            description: 'Massively increases attack but reduces defense',
          },
          cooldown: 4,
          currentCooldown: 0,
          targetType: TargetType.SELF,
          description: 'Enters a berserker rage',
        },
        {
          id: 'ground_slam',
          name: 'Ground Slam',
          type: SkillType.ATTACK,
          damage: 18 + level * 2,
          cooldown: 3,
          currentCooldown: 0,
          targetType: TargetType.ALL_ENEMIES,
          description: 'Slams the ground, damaging all enemies',
        },
      ],
      rewards: {
        experience: 75 + level * 12,
        gold: 50 + level * 8,
        dropChance: 0.5,
        possibleDrops: ['iron', 'crystal'],
      },
      description: 'A massive orc with incredible strength and berserker tendencies.',
    };
  }

  static createShadowMage(level: number = 8): Enemy {
    return {
      id: 'shadow_mage_' + Math.random().toString(36).substr(2, 9),
      name: 'Shadow Mage',
      type: EnemyType.ELITE,
      element: Element.DARK,
      level,
      stats: {
        attack: 10 + level * 1.5,
        defense: 12 + level * 1.8,
        hp: 120 + level * 18,
        speed: 14 + level * 1.5,
        magic: 25 + level * 3.5,
      },
      currentHp: 120 + level * 18,
      aiType: AIType.TACTICAL,
      skills: [
        {
          id: 'shadow_bolt',
          name: 'Shadow Bolt',
          type: SkillType.ATTACK,
          damage: 20 + level * 3,
          cooldown: 0,
          currentCooldown: 0,
          targetType: TargetType.SINGLE_ENEMY,
          description: 'Fires a bolt of dark energy',
        },
        {
          id: 'curse',
          name: 'Curse',
          type: SkillType.DEBUFF,
          effect: {
            id: 'cursed',
            name: 'Cursed',
            type: StatusType.ATTACK_DOWN,
            value: 0.3,
            duration: 4,
            description: 'Reduces attack and defense',
          },
          cooldown: 2,
          currentCooldown: 0,
          targetType: TargetType.SINGLE_ENEMY,
          description: 'Curses target, reducing their combat effectiveness',
        },
        {
          id: 'dark_heal',
          name: 'Dark Regeneration',
          type: SkillType.HEAL,
          healing: 30 + level * 5,
          cooldown: 3,
          currentCooldown: 0,
          targetType: TargetType.SELF,
          description: 'Heals using dark magic',
        },
      ],
      rewards: {
        experience: 100 + level * 15,
        gold: 80 + level * 12,
        dropChance: 0.7,
        possibleDrops: ['crystal', 'magic_essence'],
      },
      description: 'A cunning mage who wields shadow magic with deadly precision.',
    };
  }

  static createFloorBoss(floor: number): Enemy {
    const level = Math.max(1, Math.floor(floor / 5) * 5); // Boss every 5 floors
    const bossTypes = ['Dragon Guardian', 'Void Lord', 'Crystal Titan', 'Storm King'];
    const bossName = bossTypes[Math.floor(Math.random() * bossTypes.length)];

    return {
      id: `boss_floor_${floor}_` + Math.random().toString(36).substr(2, 9),
      name: `${bossName} (Floor ${floor})`,
      type: EnemyType.BOSS,
      element: Object.values(Element)[Math.floor(Math.random() * Object.values(Element).length)],
      level,
      stats: {
        attack: 30 + level * 5,
        defense: 25 + level * 4,
        hp: 300 + level * 50,
        speed: 12 + level * 1.2,
        magic: 20 + level * 3,
      },
      currentHp: 300 + level * 50,
      aiType: AIType.TACTICAL,
      skills: [
        {
          id: 'boss_attack',
          name: 'Devastating Strike',
          type: SkillType.ATTACK,
          damage: 40 + level * 6,
          cooldown: 1,
          currentCooldown: 0,
          targetType: TargetType.SINGLE_ENEMY,
          description: 'A powerful attack that can devastate enemies',
        },
        {
          id: 'boss_aoe',
          name: 'Area Destruction',
          type: SkillType.ATTACK,
          damage: 25 + level * 3,
          cooldown: 3,
          currentCooldown: 0,
          targetType: TargetType.ALL_ENEMIES,
          description: 'Damages all enemies with a devastating area attack',
        },
        {
          id: 'boss_rage',
          name: 'Enrage',
          type: SkillType.BUFF,
          effect: {
            id: 'enraged',
            name: 'Enraged',
            type: StatusType.ATTACK_UP,
            value: 0.8,
            duration: 5,
            description: 'Massively increases all combat abilities',
          },
          cooldown: 5,
          currentCooldown: 0,
          targetType: TargetType.SELF,
          description: 'Enters an enraged state, becoming much more dangerous',
        },
      ],
      rewards: {
        experience: 200 + level * 30,
        gold: 150 + level * 25,
        dropChance: 0.9,
        possibleDrops: ['crystal', 'magic_essence', 'legendary_material'],
      },
      description: `A fearsome boss guarding floor ${floor} of the Eternal Tower.`,
    };
  }

  static generateRandomEnemy(floor: number): Enemy {
    const level = Math.max(1, Math.floor(floor / 2) + Math.floor(Math.random() * 3));
    
    if (floor % 5 === 0) {
      return this.createFloorBoss(floor);
    }

    const enemyTypes = [
      () => this.createBasicGoblin(level),
      () => this.createOrcBrute(level),
      () => this.createShadowMage(level),
    ];

    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    return randomType();
  }
}