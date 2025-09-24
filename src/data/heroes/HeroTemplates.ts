import { HeroTemplate, HeroType, HeroRarity, Element } from '../../entities/Hero';

export const HERO_TEMPLATES: HeroTemplate[] = [
  // 1-Star Common Heroes
  {
    id: 'farmer_tom',
    name: 'Tom the Farmer',
    type: HeroType.WARRIOR,
    rarity: HeroRarity.COMMON,
    element: Element.EARTH,
    baseStats: {
      attack: 15,
      defense: 18,
      hp: 120,
      speed: 8,
      magic: 5,
    },
    growthRates: {
      attack: 2.1,
      defense: 2.5,
      hp: 8.0,
      speed: 0.8,
      magic: 0.5,
    },
    description: 'A humble farmer who picked up a sword to protect his village.',
    skills: ['Basic Strike', 'Harvest Blessing', 'Earth Guard'],
    story: 'Once a simple farmer, Tom discovered his calling when bandits threatened his crops. His determination and connection to the earth make him a reliable ally.',
  },
  {
    id: 'village_healer',
    name: 'Maria the Healer',
    type: HeroType.HEALER,
    rarity: HeroRarity.COMMON,
    element: Element.LIGHT,
    baseStats: {
      attack: 8,
      defense: 12,
      hp: 95,
      speed: 12,
      magic: 22,
    },
    growthRates: {
      attack: 1.0,
      defense: 1.8,
      hp: 6.5,
      speed: 1.5,
      magic: 3.2,
    },
    description: 'A kind village healer with natural talent for light magic.',
    skills: ['Heal', 'Light Blessing', 'Purify'],
    story: 'Maria learned healing arts from her grandmother. Her gentle nature and pure heart amplify her magical abilities.',
  },

  // 2-Star Uncommon Heroes
  {
    id: 'scout_elena',
    name: 'Elena the Scout',
    type: HeroType.ARCHER,
    rarity: HeroRarity.UNCOMMON,
    element: Element.AIR,
    baseStats: {
      attack: 20,
      defense: 14,
      hp: 105,
      speed: 18,
      magic: 10,
    },
    growthRates: {
      attack: 2.8,
      defense: 1.9,
      hp: 7.0,
      speed: 2.5,
      magic: 1.2,
    },
    description: 'A skilled scout who never misses her target.',
    skills: ['Precise Shot', 'Wind Arrow', 'Eagle Eye', 'Storm Volley'],
    story: 'Elena served as a scout for the royal army. Her exceptional marksmanship and connection to wind magic make her invaluable in battle.',
  },
  {
    id: 'apprentice_wizard',
    name: 'Finn the Apprentice',
    type: HeroType.MAGE,
    rarity: HeroRarity.UNCOMMON,
    element: Element.FIRE,
    baseStats: {
      attack: 12,
      defense: 10,
      hp: 85,
      speed: 14,
      magic: 28,
    },
    growthRates: {
      attack: 1.5,
      defense: 1.4,
      hp: 5.8,
      speed: 1.8,
      magic: 4.2,
    },
    description: 'A promising young wizard with a talent for fire magic.',
    skills: ['Fireball', 'Flame Shield', 'Burning Passion', 'Meteor Strike'],
    story: 'Finn left his master\'s tower to prove himself in the world. His enthusiasm sometimes leads to explosive results.',
  },

  // 3-Star Rare Heroes
  {
    id: 'knight_captain',
    name: 'Sir Gareth',
    type: HeroType.TANK,
    rarity: HeroRarity.RARE,
    element: Element.LIGHT,
    baseStats: {
      attack: 18,
      defense: 32,
      hp: 180,
      speed: 10,
      magic: 15,
    },
    growthRates: {
      attack: 2.2,
      defense: 4.5,
      hp: 12.0,
      speed: 1.0,
      magic: 1.8,
    },
    description: 'A noble knight captain with unwavering loyalty and divine protection.',
    skills: ['Shield Bash', 'Divine Protection', 'Taunt', 'Holy Barrier', 'Righteous Strike'],
    story: 'Sir Gareth led the knights of the Silver Order. His unwavering faith and tactical brilliance inspire all who fight beside him.',
  },
  {
    id: 'shadow_assassin',
    name: 'Kira Shadowblade',
    type: HeroType.ROGUE,
    rarity: HeroRarity.RARE,
    element: Element.DARK,
    baseStats: {
      attack: 28,
      defense: 16,
      hp: 110,
      speed: 24,
      magic: 18,
    },
    growthRates: {
      attack: 3.8,
      defense: 2.0,
      hp: 7.5,
      speed: 3.2,
      magic: 2.5,
    },
    description: 'A mysterious assassin who strikes from the shadows with deadly precision.',
    skills: ['Backstab', 'Shadow Step', 'Poison Blade', 'Invisibility', 'Death Mark'],
    story: 'Once a member of a secret guild, Kira now walks her own path. Her mastery of shadow magic makes her a formidable ally.',
  },

  // 4-Star Epic Heroes
  {
    id: 'archmage_merlin',
    name: 'Archmage Merlin',
    type: HeroType.MAGE,
    rarity: HeroRarity.EPIC,
    element: Element.NEUTRAL,
    baseStats: {
      attack: 16,
      defense: 20,
      hp: 140,
      speed: 16,
      magic: 45,
    },
    growthRates: {
      attack: 2.0,
      defense: 2.8,
      hp: 9.0,
      speed: 2.0,
      magic: 6.5,
    },
    description: 'The legendary archmage who mastered all schools of magic.',
    skills: ['Arcane Missile', 'Time Warp', 'Elemental Mastery', 'Meteor Storm', 'Reality Tear', 'Wisdom of Ages'],
    story: 'Merlin has lived for centuries, accumulating vast knowledge of magic. His presence on the battlefield can turn the tide of any conflict.',
  },
  {
    id: 'dragon_knight',
    name: 'Valeria Dragonheart',
    type: HeroType.WARRIOR,
    rarity: HeroRarity.EPIC,
    element: Element.FIRE,
    baseStats: {
      attack: 35,
      defense: 28,
      hp: 200,
      speed: 18,
      magic: 25,
    },
    growthRates: {
      attack: 4.5,
      defense: 3.8,
      hp: 13.5,
      speed: 2.2,
      magic: 3.0,
    },
    description: 'A legendary warrior who bonded with an ancient dragon\'s spirit.',
    skills: ['Dragon Strike', 'Fire Breath', 'Dragon Wings', 'Inferno Rage', 'Dragon\'s Fury', 'Ancient Pact'],
    story: 'Valeria was chosen by the spirit of an ancient red dragon. Together, they are an unstoppable force of destruction and honor.',
  },

  // 5-Star Legendary Hero
  {
    id: 'void_emperor',
    name: 'Aethon the Void Emperor',
    type: HeroType.MAGE,
    rarity: HeroRarity.LEGENDARY,
    element: Element.DARK,
    baseStats: {
      attack: 25,
      defense: 35,
      hp: 250,
      speed: 22,
      magic: 60,
    },
    growthRates: {
      attack: 3.5,
      defense: 4.2,
      hp: 15.0,
      speed: 2.8,
      magic: 8.0,
    },
    description: 'The mysterious emperor who commands the power of the void itself.',
    skills: [
      'Void Bolt', 
      'Reality Rift', 
      'Dark Matter', 
      'Void Prison', 
      'Dimensional Collapse', 
      'Emperor\'s Domain',
      'Infinite Void'
    ],
    story: 'Aethon transcended mortal limits by mastering void magic. His very presence warps reality, and legends say he can erase enemies from existence itself.',
  },
];

export class HeroDatabase {
  private static templates = new Map<string, HeroTemplate>();

  static {
    // Initialize template map
    HERO_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  static getTemplate(id: string): HeroTemplate | undefined {
    return this.templates.get(id);
  }

  static getAllTemplates(): HeroTemplate[] {
    return HERO_TEMPLATES;
  }

  static getTemplatesByRarity(rarity: HeroRarity): HeroTemplate[] {
    return HERO_TEMPLATES.filter(template => template.rarity === rarity);
  }

  static getTemplatesByType(type: HeroType): HeroTemplate[] {
    return HERO_TEMPLATES.filter(template => template.type === type);
  }

  static getTemplatesByElement(element: Element): HeroTemplate[] {
    return HERO_TEMPLATES.filter(template => template.element === element);
  }

  static getRandomTemplate(): HeroTemplate {
    return HERO_TEMPLATES[Math.floor(Math.random() * HERO_TEMPLATES.length)];
  }
}