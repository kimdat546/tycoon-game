import { HeroStats, HeroType } from './Hero';

export enum SkillType {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  ULTIMATE = 'ultimate',
}

export enum SkillTarget {
  SELF = 'self',
  ALLY = 'ally',
  ALL_ALLIES = 'all_allies',
  ENEMY = 'enemy',
  ALL_ENEMIES = 'all_enemies',
  RANDOM_ENEMY = 'random_enemy',
}

export interface SkillEffect {
  type: 'damage' | 'healing' | 'buff' | 'debuff' | 'shield' | 'special';
  value: number;
  duration?: number; // For buffs/debuffs
  scaling?: keyof HeroStats; // Which stat scales the effect
  scalingRatio?: number; // How much the stat affects the effect
}

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  target: SkillTarget;
  effects: SkillEffect[];
  
  // Requirements
  unlockLevel: number;
  requiredClass?: HeroType[];
  prerequisiteSkills?: string[];
  
  // Usage
  cooldown: number; // Turns for active skills
  manaCost: number;
  
  // Progression
  maxLevel: number;
  currentLevel: number;
  
  // Visual
  iconId: string;
  animationId: string;
}

export interface SkillTemplate {
  id: string;
  name: string;
  type: SkillType;
  description: string;
  target: SkillTarget;
  effects: SkillEffect[];
  unlockLevel: number;
  requiredClass?: HeroType[];
  prerequisiteSkills?: string[];
  cooldown: number;
  manaCost: number;
  maxLevel: number;
  iconId: string;
  animationId: string;
}

export class SkillUtils {
  // Calculate skill effect based on hero stats and skill level
  static calculateSkillEffect(
    skill: Skill,
    casterStats: HeroStats,
    effect: SkillEffect
  ): number {
    let finalValue = effect.value * skill.currentLevel; // Base scaling with skill level

    // Apply stat scaling
    if (effect.scaling && effect.scalingRatio) {
      const statValue = casterStats[effect.scaling];
      finalValue += statValue * effect.scalingRatio;
    }

    return Math.floor(finalValue);
  }

  // Check if hero can use skill
  static canUseSkill(skill: Skill, heroLevel: number, heroClass: HeroType): boolean {
    if (heroLevel < skill.unlockLevel) return false;
    if (skill.requiredClass && !skill.requiredClass.includes(heroClass)) return false;
    return true;
  }

  // Get skill power rating for comparison
  static getSkillPower(skill: Skill): number {
    let power = 0;
    
    skill.effects.forEach(effect => {
      const baseValue = effect.value * skill.currentLevel;
      
      switch (effect.type) {
        case 'damage':
          power += baseValue * 2;
          break;
        case 'healing':
          power += baseValue * 1.5;
          break;
        case 'buff':
        case 'debuff':
          power += baseValue * (effect.duration || 1);
          break;
        case 'shield':
          power += baseValue;
          break;
        default:
          power += baseValue;
      }
    });

    return Math.floor(power);
  }

  // Get skill cooldown display
  static getCooldownText(cooldown: number): string {
    if (cooldown === 0) return 'No Cooldown';
    if (cooldown === 1) return '1 Turn';
    return `${cooldown} Turns`;
  }

  // Create a skill from template
  static createSkillFromTemplate(template: SkillTemplate, initialLevel: number = 1): Skill {
    return {
      ...template,
      currentLevel: Math.min(initialLevel, template.maxLevel),
    };
  }

  // Level up a skill
  static levelUpSkill(skill: Skill): Skill {
    if (skill.currentLevel >= skill.maxLevel) return skill;
    
    return {
      ...skill,
      currentLevel: skill.currentLevel + 1,
    };
  }

  // Get skill upgrade cost
  static getSkillUpgradeCost(skill: Skill): { skillPoints: number; gold?: number } {
    const baseCost = skill.currentLevel;
    return {
      skillPoints: Math.max(1, baseCost),
      gold: skill.currentLevel * 1000,
    };
  }
}

// Skill Templates Database
export const SKILL_TEMPLATES: SkillTemplate[] = [
  // WARRIOR SKILLS
  {
    id: 'warrior_slash',
    name: 'Power Slash',
    type: SkillType.ACTIVE,
    description: 'A powerful sword strike that deals high damage to a single enemy.',
    target: SkillTarget.ENEMY,
    effects: [
      {
        type: 'damage',
        value: 150,
        scaling: 'attack',
        scalingRatio: 1.5,
      },
    ],
    unlockLevel: 5,
    requiredClass: [HeroType.WARRIOR],
    cooldown: 3,
    manaCost: 15,
    maxLevel: 10,
    iconId: 'skill_power_slash',
    animationId: 'attack_slash',
  },
  {
    id: 'warrior_defense',
    name: 'Iron Will',
    type: SkillType.PASSIVE,
    description: 'Permanently increases defense and damage reduction.',
    target: SkillTarget.SELF,
    effects: [
      {
        type: 'buff',
        value: 20,
        scaling: 'defense',
        scalingRatio: 0.2,
      },
    ],
    unlockLevel: 15,
    requiredClass: [HeroType.WARRIOR],
    cooldown: 0,
    manaCost: 0,
    maxLevel: 5,
    iconId: 'skill_iron_will',
    animationId: 'buff_defense',
  },
  {
    id: 'warrior_ultimate',
    name: 'Berserker Rage',
    type: SkillType.ULTIMATE,
    description: 'Enter a rage state, dramatically increasing attack but reducing defense.',
    target: SkillTarget.SELF,
    effects: [
      {
        type: 'buff',
        value: 100,
        duration: 5,
        scaling: 'attack',
        scalingRatio: 0.5,
      },
      {
        type: 'debuff',
        value: -30,
        duration: 5,
        scaling: 'defense',
        scalingRatio: 0.3,
      },
    ],
    unlockLevel: 40,
    requiredClass: [HeroType.WARRIOR],
    prerequisiteSkills: ['warrior_slash', 'warrior_defense'],
    cooldown: 8,
    manaCost: 40,
    maxLevel: 3,
    iconId: 'skill_berserker_rage',
    animationId: 'ultimate_rage',
  },

  // MAGE SKILLS
  {
    id: 'mage_fireball',
    name: 'Fireball',
    type: SkillType.ACTIVE,
    description: 'Launch a fireball that deals magic damage to an enemy.',
    target: SkillTarget.ENEMY,
    effects: [
      {
        type: 'damage',
        value: 120,
        scaling: 'magic',
        scalingRatio: 1.8,
      },
    ],
    unlockLevel: 5,
    requiredClass: [HeroType.MAGE],
    cooldown: 2,
    manaCost: 20,
    maxLevel: 10,
    iconId: 'skill_fireball',
    animationId: 'magic_fireball',
  },
  {
    id: 'mage_shield',
    name: 'Magic Shield',
    type: SkillType.ACTIVE,
    description: 'Create a protective barrier that absorbs damage.',
    target: SkillTarget.SELF,
    effects: [
      {
        type: 'shield',
        value: 200,
        duration: 4,
        scaling: 'magic',
        scalingRatio: 1.0,
      },
    ],
    unlockLevel: 15,
    requiredClass: [HeroType.MAGE],
    cooldown: 5,
    manaCost: 25,
    maxLevel: 8,
    iconId: 'skill_magic_shield',
    animationId: 'magic_shield',
  },
  {
    id: 'mage_ultimate',
    name: 'Meteor',
    type: SkillType.ULTIMATE,
    description: 'Call down a devastating meteor that damages all enemies.',
    target: SkillTarget.ALL_ENEMIES,
    effects: [
      {
        type: 'damage',
        value: 300,
        scaling: 'magic',
        scalingRatio: 2.5,
      },
    ],
    unlockLevel: 60,
    requiredClass: [HeroType.MAGE],
    prerequisiteSkills: ['mage_fireball', 'mage_shield'],
    cooldown: 12,
    manaCost: 80,
    maxLevel: 3,
    iconId: 'skill_meteor',
    animationId: 'ultimate_meteor',
  },

  // HEALER SKILLS
  {
    id: 'healer_heal',
    name: 'Healing Light',
    type: SkillType.ACTIVE,
    description: 'Restore health to an ally.',
    target: SkillTarget.ALLY,
    effects: [
      {
        type: 'healing',
        value: 100,
        scaling: 'magic',
        scalingRatio: 1.2,
      },
    ],
    unlockLevel: 5,
    requiredClass: [HeroType.HEALER],
    cooldown: 1,
    manaCost: 15,
    maxLevel: 10,
    iconId: 'skill_healing_light',
    animationId: 'heal_light',
  },
  {
    id: 'healer_regeneration',
    name: 'Regeneration Aura',
    type: SkillType.ACTIVE,
    description: 'Grant all allies health regeneration over time.',
    target: SkillTarget.ALL_ALLIES,
    effects: [
      {
        type: 'healing',
        value: 50,
        duration: 6,
        scaling: 'magic',
        scalingRatio: 0.8,
      },
    ],
    unlockLevel: 25,
    requiredClass: [HeroType.HEALER],
    cooldown: 6,
    manaCost: 35,
    maxLevel: 6,
    iconId: 'skill_regeneration',
    animationId: 'heal_aura',
  },

  // ARCHER SKILLS
  {
    id: 'archer_multishot',
    name: 'Multi-Shot',
    type: SkillType.ACTIVE,
    description: 'Fire multiple arrows at random enemies.',
    target: SkillTarget.RANDOM_ENEMY,
    effects: [
      {
        type: 'damage',
        value: 80,
        scaling: 'attack',
        scalingRatio: 1.2,
      },
    ],
    unlockLevel: 5,
    requiredClass: [HeroType.ARCHER],
    cooldown: 3,
    manaCost: 18,
    maxLevel: 10,
    iconId: 'skill_multishot',
    animationId: 'archer_multishot',
  },
  {
    id: 'archer_precision',
    name: 'Eagle Eye',
    type: SkillType.PASSIVE,
    description: 'Permanently increases accuracy and critical hit rate.',
    target: SkillTarget.SELF,
    effects: [
      {
        type: 'buff',
        value: 15,
      },
    ],
    unlockLevel: 15,
    requiredClass: [HeroType.ARCHER],
    cooldown: 0,
    manaCost: 0,
    maxLevel: 5,
    iconId: 'skill_eagle_eye',
    animationId: 'buff_accuracy',
  },

  // ROGUE SKILLS
  {
    id: 'rogue_backstab',
    name: 'Backstab',
    type: SkillType.ACTIVE,
    description: 'A critical strike with high damage and chance to ignore defense.',
    target: SkillTarget.ENEMY,
    effects: [
      {
        type: 'damage',
        value: 200,
        scaling: 'attack',
        scalingRatio: 1.8,
      },
    ],
    unlockLevel: 5,
    requiredClass: [HeroType.ROGUE],
    cooldown: 4,
    manaCost: 20,
    maxLevel: 10,
    iconId: 'skill_backstab',
    animationId: 'rogue_backstab',
  },
  {
    id: 'rogue_stealth',
    name: 'Stealth',
    type: SkillType.ACTIVE,
    description: 'Become invisible, increasing evasion and next attack damage.',
    target: SkillTarget.SELF,
    effects: [
      {
        type: 'buff',
        value: 50,
        duration: 3,
      },
    ],
    unlockLevel: 20,
    requiredClass: [HeroType.ROGUE],
    cooldown: 6,
    manaCost: 25,
    maxLevel: 6,
    iconId: 'skill_stealth',
    animationId: 'rogue_stealth',
  },

  // UNIVERSAL SKILLS (any class can learn)
  {
    id: 'universal_focus',
    name: 'Inner Focus',
    type: SkillType.PASSIVE,
    description: 'Increases mana regeneration and skill effectiveness.',
    target: SkillTarget.SELF,
    effects: [
      {
        type: 'buff',
        value: 10,
      },
    ],
    unlockLevel: 10,
    cooldown: 0,
    manaCost: 0,
    maxLevel: 3,
    iconId: 'skill_inner_focus',
    animationId: 'buff_focus',
  },
  {
    id: 'universal_endurance',
    name: 'Endurance Training',
    type: SkillType.PASSIVE,
    description: 'Permanently increases HP and stamina.',
    target: SkillTarget.SELF,
    effects: [
      {
        type: 'buff',
        value: 50,
        scaling: 'hp',
        scalingRatio: 0.1,
      },
    ],
    unlockLevel: 12,
    cooldown: 0,
    manaCost: 0,
    maxLevel: 5,
    iconId: 'skill_endurance',
    animationId: 'buff_endurance',
  },
];