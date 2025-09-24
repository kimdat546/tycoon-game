import { EventBus } from '../core/EventBus';
import { Skill, SkillTemplate, SkillUtils, SKILL_TEMPLATES } from '../entities/Skill';
import { Hero, HeroType } from '../entities/Hero';

export interface HeroSkillData {
  heroId: string;
  learnedSkills: Map<string, Skill>; // skillId -> Skill
  equippedSkills: string[]; // Max 4 equipped skills for combat
  availableSkillPoints: number;
}

export class SkillManager {
  private eventBus: EventBus;
  private heroSkills: Map<string, HeroSkillData> = new Map();
  private skillTemplates: Map<string, SkillTemplate> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.initializeSkillTemplates();
    this.setupEventListeners();
  }

  private initializeSkillTemplates(): void {
    SKILL_TEMPLATES.forEach(template => {
      this.skillTemplates.set(template.id, template);
    });
    console.log(`Loaded ${this.skillTemplates.size} skill templates`);
  }

  private setupEventListeners(): void {
    // Listen for hero creation
    this.eventBus.on('hero-created', (data: { hero: Hero }) => {
      this.initializeHeroSkills(data.hero);
    });

    // Listen for level ups to unlock skills
    this.eventBus.on('hero-leveled-up', (data: { heroId: string; newLevel: number }) => {
      this.checkSkillUnlocks(data.heroId, data.newLevel);
    });

    // Listen for skill unlock events from progression system
    this.eventBus.on('skill-unlocked', (data: { heroId: string; skill: string }) => {
      this.unlockSkill(data.heroId, data.skill);
    });
  }

  // Initialize skills for a new hero
  private initializeHeroSkills(hero: Hero): void {
    if (this.heroSkills.has(hero.id)) return;

    const skillData: HeroSkillData = {
      heroId: hero.id,
      learnedSkills: new Map(),
      equippedSkills: [],
      availableSkillPoints: 1, // Start with 1 skill point
    };

    // Learn basic skills for the hero's class
    this.learnBasicSkills(skillData, hero.type);

    this.heroSkills.set(hero.id, skillData);
    console.log(`Initialized skills for ${hero.name} (${hero.type})`);
  }

  private learnBasicSkills(skillData: HeroSkillData, heroType: HeroType): void {
    // Give heroes their basic class skill at level 1
    const basicSkills = SKILL_TEMPLATES.filter(template => 
      template.unlockLevel <= 1 && 
      template.requiredClass?.includes(heroType)
    );

    basicSkills.forEach(template => {
      const skill = SkillUtils.createSkillFromTemplate(template, 1);
      skillData.learnedSkills.set(skill.id, skill);
      
      // Auto-equip the first skill
      if (skillData.equippedSkills.length < 4) {
        skillData.equippedSkills.push(skill.id);
      }
    });
  }

  // Check for skill unlocks when hero levels up
  private checkSkillUnlocks(heroId: string, newLevel: number): void {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return;

    // Find skills that can be unlocked at this level
    const availableSkills = this.getAvailableSkills(heroId);
    let skillsUnlocked = 0;

    availableSkills.forEach(template => {
      if (template.unlockLevel === newLevel && !skillData.learnedSkills.has(template.id)) {
        this.unlockSkill(heroId, template.id);
        skillsUnlocked++;
      }
    });

    if (skillsUnlocked > 0) {
      this.eventBus.emit('skills-auto-unlocked', {
        heroId,
        level: newLevel,
        skillsUnlocked,
      });
    }
  }

  // Unlock a specific skill
  unlockSkill(heroId: string, skillId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    const template = this.skillTemplates.get(skillId);
    
    if (!skillData || !template) return false;
    if (skillData.learnedSkills.has(skillId)) return false; // Already learned

    const skill = SkillUtils.createSkillFromTemplate(template, 1);
    skillData.learnedSkills.set(skillId, skill);

    this.eventBus.emit('skill-learned', {
      heroId,
      skill,
      autoEquipped: this.autoEquipSkill(heroId, skillId),
    });

    console.log(`Hero ${heroId} learned skill: ${skill.name}`);
    return true;
  }

  // Learn a skill using skill points
  learnSkill(heroId: string, skillId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    const template = this.skillTemplates.get(skillId);
    
    if (!skillData || !template) return false;
    if (skillData.learnedSkills.has(skillId)) return false;
    if (skillData.availableSkillPoints < 1) return false;

    // Check if skill is available to learn
    if (!this.canLearnSkill(heroId, skillId)) return false;

    const skill = SkillUtils.createSkillFromTemplate(template, 1);
    skillData.learnedSkills.set(skillId, skill);
    skillData.availableSkillPoints--;

    this.eventBus.emit('skill-learned', {
      heroId,
      skill,
      skillPointsUsed: 1,
      autoEquipped: this.autoEquipSkill(heroId, skillId),
    });

    console.log(`Hero ${heroId} learned skill: ${skill.name} (${skillData.availableSkillPoints} points remaining)`);
    return true;
  }

  // Level up a skill
  levelUpSkill(heroId: string, skillId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return false;

    const skill = skillData.learnedSkills.get(skillId);
    if (!skill) return false;

    const upgradeCost = SkillUtils.getSkillUpgradeCost(skill);
    if (skillData.availableSkillPoints < upgradeCost.skillPoints) return false;

    const upgradedSkill = SkillUtils.levelUpSkill(skill);
    if (upgradedSkill.currentLevel === skill.currentLevel) return false; // Already at max level

    skillData.learnedSkills.set(skillId, upgradedSkill);
    skillData.availableSkillPoints -= upgradeCost.skillPoints;

    this.eventBus.emit('skill-leveled-up', {
      heroId,
      skill: upgradedSkill,
      oldLevel: skill.currentLevel,
      cost: upgradeCost,
    });

    console.log(`Upgraded ${skill.name} to level ${upgradedSkill.currentLevel}`);
    return true;
  }

  // Skill equipment management
  equipSkill(heroId: string, skillId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return false;

    const skill = skillData.learnedSkills.get(skillId);
    if (!skill) return false;

    if (skillData.equippedSkills.includes(skillId)) return false; // Already equipped
    if (skillData.equippedSkills.length >= 4) return false; // Max 4 equipped skills

    skillData.equippedSkills.push(skillId);
    
    this.eventBus.emit('skill-equipped', { heroId, skillId, skill });
    return true;
  }

  unequipSkill(heroId: string, skillId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return false;

    const index = skillData.equippedSkills.indexOf(skillId);
    if (index === -1) return false;

    skillData.equippedSkills.splice(index, 1);
    
    this.eventBus.emit('skill-unequipped', { heroId, skillId });
    return true;
  }

  private autoEquipSkill(heroId: string, skillId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData || skillData.equippedSkills.length >= 4) return false;

    return this.equipSkill(heroId, skillId);
  }

  // Query methods
  getHeroSkills(heroId: string): HeroSkillData | undefined {
    return this.heroSkills.get(heroId);
  }

  getLearnedSkills(heroId: string): Skill[] {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return [];
    
    return Array.from(skillData.learnedSkills.values());
  }

  getEquippedSkills(heroId: string): Skill[] {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return [];
    
    return skillData.equippedSkills.map(skillId => skillData.learnedSkills.get(skillId)).filter(Boolean) as Skill[];
  }

  getAvailableSkills(heroId: string): SkillTemplate[] {
    // This would need hero data to check class and level requirements
    // For now, return all skills
    return Array.from(this.skillTemplates.values());
  }

  canLearnSkill(heroId: string, skillId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    const template = this.skillTemplates.get(skillId);
    
    if (!skillData || !template) return false;
    if (skillData.learnedSkills.has(skillId)) return false;

    // Check prerequisite skills
    if (template.prerequisiteSkills) {
      for (const prereq of template.prerequisiteSkills) {
        if (!skillData.learnedSkills.has(prereq)) return false;
      }
    }

    // Additional checks would include hero level and class requirements
    return true;
  }

  // Add skill points (from leveling up, items, etc.)
  addSkillPoints(heroId: string, points: number): void {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return;

    skillData.availableSkillPoints += points;
    
    this.eventBus.emit('skill-points-gained', {
      heroId,
      pointsGained: points,
      totalPoints: skillData.availableSkillPoints,
    });
  }

  // Get skill statistics
  getSkillStats(heroId: string): {
    totalSkills: number;
    equippedSkills: number;
    maxSkillLevel: number;
    averageSkillLevel: number;
    skillPoints: number;
  } {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) {
      return { totalSkills: 0, equippedSkills: 0, maxSkillLevel: 0, averageSkillLevel: 0, skillPoints: 0 };
    }

    const skills = Array.from(skillData.learnedSkills.values());
    const totalSkills = skills.length;
    const maxSkillLevel = skills.reduce((max, skill) => Math.max(max, skill.currentLevel), 0);
    const averageSkillLevel = totalSkills > 0 ? 
      skills.reduce((sum, skill) => sum + skill.currentLevel, 0) / totalSkills : 0;

    return {
      totalSkills,
      equippedSkills: skillData.equippedSkills.length,
      maxSkillLevel,
      averageSkillLevel: Math.round(averageSkillLevel * 10) / 10,
      skillPoints: skillData.availableSkillPoints,
    };
  }

  // Get skills by category
  getSkillsByType(heroId: string, type: string): Skill[] {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return [];

    return Array.from(skillData.learnedSkills.values()).filter(skill => skill.type === type);
  }

  // Reset all skills for a hero (for respec items)
  resetHeroSkills(heroId: string): boolean {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return false;

    // Calculate refunded skill points
    let refundedPoints = skillData.availableSkillPoints;
    skillData.learnedSkills.forEach(skill => {
      refundedPoints += skill.currentLevel - 1; // Refund upgrade costs
      refundedPoints += 1; // Refund initial learning cost
    });

    // Reset skills but keep basic class skills
    skillData.learnedSkills.clear();
    skillData.equippedSkills = [];
    skillData.availableSkillPoints = refundedPoints;

    this.eventBus.emit('skills-reset', {
      heroId,
      refundedPoints,
    });

    console.log(`Reset skills for hero ${heroId}, refunded ${refundedPoints} skill points`);
    return true;
  }

  // Save/Load
  serialize(): any {
    return {
      heroSkills: Array.from(this.heroSkills.entries()).map(([heroId, data]) => [
        heroId,
        {
          ...data,
          learnedSkills: Array.from(data.learnedSkills.entries()),
        },
      ]),
    };
  }

  deserialize(data: any): void {
    if (data.heroSkills) {
      this.heroSkills = new Map(data.heroSkills.map(([heroId, skillData]: [string, any]) => [
        heroId,
        {
          ...skillData,
          learnedSkills: new Map(skillData.learnedSkills),
        },
      ]));
    }
  }

  // Debug methods
  giveAllSkills(heroId: string): void {
    const skillData = this.heroSkills.get(heroId);
    if (!skillData) return;

    this.skillTemplates.forEach((template, skillId) => {
      if (!skillData.learnedSkills.has(skillId)) {
        const skill = SkillUtils.createSkillFromTemplate(template, template.maxLevel);
        skillData.learnedSkills.set(skillId, skill);
      }
    });

    skillData.availableSkillPoints = 100;
    console.log(`Gave all skills to hero ${heroId}`);
  }

  giveSkillPoints(heroId: string, amount: number): void {
    this.addSkillPoints(heroId, amount);
  }
}