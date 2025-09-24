import { EquipmentTemplate, EquipmentType, EquipmentRarity, SocketType } from '../../entities/Equipment';

export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  // COMMON WEAPONS
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      attack: 15,
      accuracy: 5,
    },
    statGrowth: {
      attack: 2,
      accuracy: 1,
    },
    requirements: {
      level: 1,
      class: ['warrior'],
    },
    description: 'A basic iron sword. Reliable and sturdy.',
    iconId: 'sword_iron',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },
  {
    id: 'wooden_staff',
    name: 'Wooden Staff',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      magic: 12,
      hp: 10,
    },
    statGrowth: {
      magic: 2,
      hp: 1,
    },
    requirements: {
      level: 1,
      class: ['mage'],
    },
    description: 'A simple wooden staff imbued with minor magic.',
    iconId: 'staff_wood',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },
  {
    id: 'hunting_bow',
    name: 'Hunting Bow',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      attack: 13,
      speed: 3,
      accuracy: 8,
    },
    statGrowth: {
      attack: 1,
      speed: 1,
      accuracy: 1,
    },
    requirements: {
      level: 1,
      class: ['archer'],
    },
    description: 'A well-crafted hunting bow for precise shots.',
    iconId: 'bow_hunting',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },
  {
    id: 'iron_dagger',
    name: 'Iron Dagger',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      attack: 10,
      speed: 5,
      critRate: 5,
    },
    statGrowth: {
      attack: 1,
      speed: 1,
      critRate: 1,
    },
    requirements: {
      level: 1,
      class: ['thief'],
    },
    description: 'A sharp dagger perfect for quick strikes.',
    iconId: 'dagger_iron',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },
  {
    id: 'holy_symbol',
    name: 'Holy Symbol',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      magic: 8,
      hp: 15,
      defense: 3,
    },
    statGrowth: {
      magic: 1,
      hp: 2,
      defense: 1,
    },
    requirements: {
      level: 1,
      class: ['healer'],
    },
    description: 'A blessed symbol that channels healing power.',
    iconId: 'symbol_holy',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },

  // UNCOMMON WEAPONS
  {
    id: 'steel_sword',
    name: 'Steel Sword',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.UNCOMMON,
    baseStats: {
      attack: 25,
      accuracy: 8,
      critRate: 3,
    },
    statGrowth: {
      attack: 3,
      accuracy: 1,
      critRate: 1,
    },
    requirements: {
      level: 10,
      class: ['warrior'],
    },
    description: 'A finely forged steel sword with improved balance.',
    iconId: 'sword_steel',
    socketCount: 2,
    dropSources: ['dark_forest', 'shop'],
  },
  {
    id: 'crystal_staff',
    name: 'Crystal Staff',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.UNCOMMON,
    baseStats: {
      magic: 22,
      hp: 15,
      critDamage: 10,
    },
    statGrowth: {
      magic: 3,
      hp: 2,
      critDamage: 2,
    },
    requirements: {
      level: 10,
      class: ['mage'],
    },
    description: 'A staff topped with a resonating crystal.',
    iconId: 'staff_crystal',
    socketCount: 2,
    dropSources: ['dark_forest', 'shop'],
  },

  // RARE WEAPONS
  {
    id: 'enchanted_blade',
    name: 'Enchanted Blade',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.RARE,
    baseStats: {
      attack: 40,
      accuracy: 12,
      critRate: 8,
      magic: 5,
    },
    statGrowth: {
      attack: 4,
      accuracy: 2,
      critRate: 1,
      magic: 1,
    },
    requirements: {
      level: 25,
      class: ['warrior'],
    },
    description: 'A blade infused with magical energy, glowing with power.',
    iconId: 'sword_enchanted',
    socketCount: 3,
    dropSources: ['orc_stronghold'],
  },
  {
    id: 'arcane_orb',
    name: 'Arcane Orb',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.RARE,
    baseStats: {
      magic: 35,
      hp: 25,
      critDamage: 20,
      speed: 5,
    },
    statGrowth: {
      magic: 4,
      hp: 3,
      critDamage: 3,
      speed: 1,
    },
    requirements: {
      level: 25,
      class: ['mage'],
    },
    description: 'An orb containing swirling arcane energy.',
    iconId: 'orb_arcane',
    socketCount: 3,
    dropSources: ['orc_stronghold'],
  },

  // ARMOR PIECES
  {
    id: 'leather_armor',
    name: 'Leather Armor',
    type: EquipmentType.ARMOR,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      defense: 8,
      hp: 20,
      evasion: 2,
    },
    statGrowth: {
      defense: 1,
      hp: 3,
      evasion: 1,
    },
    requirements: {
      level: 1,
    },
    description: 'Basic leather armor providing light protection.',
    iconId: 'armor_leather',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },
  {
    id: 'chain_mail',
    name: 'Chain Mail',
    type: EquipmentType.ARMOR,
    baseRarity: EquipmentRarity.UNCOMMON,
    baseStats: {
      defense: 15,
      hp: 35,
      speed: -2,
    },
    statGrowth: {
      defense: 2,
      hp: 4,
    },
    requirements: {
      level: 10,
    },
    description: 'Interlocked metal rings provide solid protection.',
    iconId: 'armor_chain',
    socketCount: 2,
    dropSources: ['dark_forest', 'shop'],
  },
  {
    id: 'plate_armor',
    name: 'Plate Armor',
    type: EquipmentType.ARMOR,
    baseRarity: EquipmentRarity.RARE,
    baseStats: {
      defense: 25,
      hp: 60,
      speed: -5,
      magic: -3,
    },
    statGrowth: {
      defense: 3,
      hp: 6,
    },
    requirements: {
      level: 25,
      class: ['warrior'],
    },
    description: 'Heavy plate armor offering maximum protection.',
    iconId: 'armor_plate',
    socketCount: 3,
    dropSources: ['orc_stronghold'],
  },

  // HELMETS
  {
    id: 'iron_helmet',
    name: 'Iron Helmet',
    type: EquipmentType.HELMET,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      defense: 5,
      hp: 15,
    },
    statGrowth: {
      defense: 1,
      hp: 2,
    },
    requirements: {
      level: 5,
    },
    description: 'A sturdy iron helmet protecting the head.',
    iconId: 'helmet_iron',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },
  {
    id: 'mage_hat',
    name: 'Mage Hat',
    type: EquipmentType.HELMET,
    baseRarity: EquipmentRarity.UNCOMMON,
    baseStats: {
      magic: 12,
      hp: 10,
      defense: 3,
    },
    statGrowth: {
      magic: 2,
      hp: 1,
      defense: 1,
    },
    requirements: {
      level: 10,
      class: ['mage', 'healer'],
    },
    description: 'A pointed hat that enhances magical abilities.',
    iconId: 'hat_mage',
    socketCount: 2,
    dropSources: ['dark_forest'],
  },

  // BOOTS
  {
    id: 'leather_boots',
    name: 'Leather Boots',
    type: EquipmentType.BOOTS,
    baseRarity: EquipmentRarity.COMMON,
    baseStats: {
      speed: 3,
      evasion: 2,
      defense: 2,
    },
    statGrowth: {
      speed: 1,
      evasion: 1,
    },
    requirements: {
      level: 1,
    },
    description: 'Comfortable leather boots for swift movement.',
    iconId: 'boots_leather',
    socketCount: 1,
    dropSources: ['goblin_camp', 'shop'],
  },
  {
    id: 'steel_boots',
    name: 'Steel Boots',
    type: EquipmentType.BOOTS,
    baseRarity: EquipmentRarity.UNCOMMON,
    baseStats: {
      speed: 2,
      defense: 8,
      hp: 10,
    },
    statGrowth: {
      speed: 1,
      defense: 1,
      hp: 2,
    },
    requirements: {
      level: 15,
    },
    description: 'Heavy steel boots providing protection and stability.',
    iconId: 'boots_steel',
    socketCount: 2,
    dropSources: ['dark_forest', 'orc_stronghold'],
  },

  // ACCESSORIES
  {
    id: 'power_ring',
    name: 'Ring of Power',
    type: EquipmentType.RING,
    baseRarity: EquipmentRarity.RARE,
    baseStats: {
      attack: 8,
      magic: 8,
      critRate: 5,
    },
    statGrowth: {
      attack: 1,
      magic: 1,
      critRate: 1,
    },
    requirements: {
      level: 20,
    },
    description: 'A ring that enhances the wearer\'s inner power.',
    iconId: 'ring_power',
    socketCount: 1,
    dropSources: ['orc_stronghold', 'shadow_realm'],
  },
  {
    id: 'health_amulet',
    name: 'Amulet of Health',
    type: EquipmentType.ACCESSORY,
    baseRarity: EquipmentRarity.UNCOMMON,
    baseStats: {
      hp: 50,
      defense: 5,
      magic: 3,
    },
    statGrowth: {
      hp: 5,
      defense: 1,
      magic: 1,
    },
    requirements: {
      level: 12,
    },
    description: 'An amulet that bolsters the wearer\'s vitality.',
    iconId: 'amulet_health',
    socketCount: 1,
    dropSources: ['dark_forest', 'orc_stronghold'],
  },

  // LEGENDARY WEAPONS
  {
    id: 'excalibur',
    name: 'Excalibur',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.LEGENDARY,
    baseStats: {
      attack: 60,
      accuracy: 20,
      critRate: 15,
      critDamage: 30,
      magic: 10,
    },
    statGrowth: {
      attack: 6,
      accuracy: 3,
      critRate: 2,
      critDamage: 4,
      magic: 1,
    },
    requirements: {
      level: 40,
      class: ['warrior'],
    },
    description: 'The legendary sword of kings, radiating holy power.',
    iconId: 'sword_excalibur',
    setId: 'legendary_knight',
    socketCount: 4,
    dropSources: ['shadow_realm'],
  },
  {
    id: 'staff_of_cosmos',
    name: 'Staff of Cosmos',
    type: EquipmentType.WEAPON,
    baseRarity: EquipmentRarity.LEGENDARY,
    baseStats: {
      magic: 55,
      hp: 40,
      critDamage: 40,
      speed: 8,
      defense: 5,
    },
    statGrowth: {
      magic: 6,
      hp: 5,
      critDamage: 5,
      speed: 1,
      defense: 1,
    },
    requirements: {
      level: 40,
      class: ['mage'],
    },
    description: 'A staff containing the power of stars and cosmic energy.',
    iconId: 'staff_cosmos',
    setId: 'cosmic_mage',
    socketCount: 4,
    dropSources: ['shadow_realm'],
  },
];

// Equipment Sets
export const EQUIPMENT_SETS = [
  {
    id: 'legendary_knight',
    name: 'Legendary Knight Set',
    description: 'The complete armor of a legendary paladin.',
    pieces: ['excalibur', 'holy_plate_armor', 'crown_of_valor', 'boots_of_justice'],
    bonuses: {
      2: { attack: 15, defense: 15 },
      4: { attack: 30, defense: 30, hp: 100, critRate: 10 },
    },
  },
  {
    id: 'cosmic_mage',
    name: 'Cosmic Mage Set',
    description: 'Robes and accessories infused with cosmic power.',
    pieces: ['staff_of_cosmos', 'robes_of_stars', 'crown_of_wisdom', 'boots_of_levitation'],
    bonuses: {
      2: { magic: 20, hp: 50 },
      4: { magic: 40, hp: 100, critDamage: 25, speed: 10 },
    },
  },
];