/**
 * Skill Normalization System
 * Prevents duplicates and provides consistent skill naming
 */

// Master skill database with canonical names and categories
export const SKILL_DATABASE: Record<string, { canonical: string; category: string; aliases: string[] }> = {
  // Programming Languages
  'javascript': {
    canonical: 'JavaScript',
    category: 'Programming Languages',
    aliases: ['js', 'javascript', 'java script']
  },
  'typescript': {
    canonical: 'TypeScript',
    category: 'Programming Languages',
    aliases: ['ts', 'typescript', 'type script']
  },
  'python': {
    canonical: 'Python',
    category: 'Programming Languages',
    aliases: ['python', 'py']
  },
  'java': {
    canonical: 'Java',
    category: 'Programming Languages',
    aliases: ['java']
  },
  'csharp': {
    canonical: 'C#',
    category: 'Programming Languages',
    aliases: ['c#', 'csharp', 'c sharp']
  },
  'go': {
    canonical: 'Go',
    category: 'Programming Languages',
    aliases: ['go', 'golang']
  },
  'rust': {
    canonical: 'Rust',
    category: 'Programming Languages',
    aliases: ['rust', 'rust-lang']
  },
  
  // Frontend Frameworks
  'react': {
    canonical: 'React',
    category: 'Frontend',
    aliases: ['react', 'reactjs', 'react.js']
  },
  'nextjs': {
    canonical: 'Next.js',
    category: 'Frontend',
    aliases: ['next', 'nextjs', 'next.js']
  },
  'vue': {
    canonical: 'Vue.js',
    category: 'Frontend',
    aliases: ['vue', 'vuejs', 'vue.js']
  },
  'angular': {
    canonical: 'Angular',
    category: 'Frontend',
    aliases: ['angular', 'angularjs']
  },
  'svelte': {
    canonical: 'Svelte',
    category: 'Frontend',
    aliases: ['svelte', 'sveltejs']
  },
  
  // Backend & Databases
  'nodejs': {
    canonical: 'Node.js',
    category: 'Backend',
    aliases: ['node', 'nodejs', 'node.js']
  },
  'express': {
    canonical: 'Express.js',
    category: 'Backend',
    aliases: ['express', 'expressjs', 'express.js']
  },
  'postgresql': {
    canonical: 'PostgreSQL',
    category: 'Databases',
    aliases: ['postgres', 'postgresql', 'postgre']
  },
  'mongodb': {
    canonical: 'MongoDB',
    category: 'Databases',
    aliases: ['mongo', 'mongodb', 'mongo db']
  },
  'mysql': {
    canonical: 'MySQL',
    category: 'Databases',
    aliases: ['mysql', 'my sql']
  },
  'redis': {
    canonical: 'Redis',
    category: 'Databases',
    aliases: ['redis']
  },
  
  // Cloud & DevOps
  'aws': {
    canonical: 'AWS',
    category: 'Cloud',
    aliases: ['aws', 'amazon web services']
  },
  'gcp': {
    canonical: 'Google Cloud Platform',
    category: 'Cloud',
    aliases: ['gcp', 'google cloud', 'google cloud platform']
  },
  'azure': {
    canonical: 'Microsoft Azure',
    category: 'Cloud',
    aliases: ['azure', 'microsoft azure']
  },
  'docker': {
    canonical: 'Docker',
    category: 'DevOps',
    aliases: ['docker']
  },
  'kubernetes': {
    canonical: 'Kubernetes',
    category: 'DevOps',
    aliases: ['k8s', 'kubernetes', 'kube']
  },
  
  // AI/ML
  'machine-learning': {
    canonical: 'Machine Learning',
    category: 'AI/ML',
    aliases: ['ml', 'machine learning', 'machine-learning']
  },
  'artificial-intelligence': {
    canonical: 'Artificial Intelligence',
    category: 'AI/ML',
    aliases: ['ai', 'artificial intelligence', 'artificial-intelligence']
  },
  'tensorflow': {
    canonical: 'TensorFlow',
    category: 'AI/ML',
    aliases: ['tensorflow', 'tensor flow']
  },
  'pytorch': {
    canonical: 'PyTorch',
    category: 'AI/ML',
    aliases: ['pytorch', 'py torch']
  },
  
  // Business & Soft Skills
  'project-management': {
    canonical: 'Project Management',
    category: 'Business',
    aliases: ['project management', 'pm', 'project-management']
  },
  'marketing': {
    canonical: 'Marketing',
    category: 'Business',
    aliases: ['marketing', 'mkt']
  },
  'leadership': {
    canonical: 'Leadership',
    category: 'Leadership',
    aliases: ['leadership', 'leader']
  },
  'communication': {
    canonical: 'Communication',
    category: 'Soft Skills',
    aliases: ['communication', 'communications']
  },
  'team-management': {
    canonical: 'Team Management',
    category: 'Leadership',
    aliases: ['team management', 'team-management', 'managing teams']
  }
};

export class SkillNormalizer {
  private aliasMap: Map<string, string>;
  
  constructor() {
    this.aliasMap = new Map();
    this.buildAliasMap();
  }
  
  private buildAliasMap() {
    Object.entries(SKILL_DATABASE).forEach(([key, skill]) => {
      // Add the key itself
      this.aliasMap.set(key.toLowerCase(), skill.canonical);
      
      // Add all aliases
      skill.aliases.forEach(alias => {
        this.aliasMap.set(alias.toLowerCase(), skill.canonical);
      });
    });
  }
  
  /**
   * Normalizes a skill name to its canonical form
   */
  normalize(skillName: string): string {
    const lowercased = skillName.trim().toLowerCase();
    
    // Check if we have a canonical name for this skill
    const canonical = this.aliasMap.get(lowercased);
    if (canonical) {
      return canonical;
    }
    
    // If not in our database, apply basic normalization
    return skillName.trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  /**
   * Gets the category for a skill
   */
  getCategory(skillName: string): string {
    const normalized = this.normalize(skillName);
    
    // Find in database
    const skill = Object.values(SKILL_DATABASE).find(s => s.canonical === normalized);
    if (skill) {
      return skill.category;
    }
    
    // Basic categorization for unknown skills
    const lowercased = skillName.toLowerCase();
    if (/language|speak|spanish|french|german|chinese/.test(lowercased)) {
      return 'Languages';
    }
    if (/manage|lead|team|strategy/.test(lowercased)) {
      return 'Leadership';
    }
    if (/design|ux|ui|figma|sketch/.test(lowercased)) {
      return 'Design';
    }
    if (/test|qa|quality/.test(lowercased)) {
      return 'Testing';
    }
    
    return 'General';
  }
  
  /**
   * Checks if two skills are the same (after normalization)
   */
  areEqual(skill1: string, skill2: string): boolean {
    return this.normalize(skill1) === this.normalize(skill2);
  }
  
  /**
   * Removes duplicate skills from an array
   */
  deduplicateSkills(skills: (string | { name: string; category?: string })[]): { name: string; category: string }[] {
    const seen = new Set<string>();
    const result: { name: string; category: string }[] = [];
    
    skills.forEach(skill => {
      const skillName = typeof skill === 'string' ? skill : skill.name;
      const normalized = this.normalize(skillName);
      
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push({
          name: normalized,
          category: this.getCategory(normalized)
        });
      }
    });
    
    return result;
  }
  
  /**
   * Gets autocomplete suggestions for a partial skill name
   */
  getAutocompleteSuggestions(partial: string, limit = 10): string[] {
    const lowercased = partial.toLowerCase();
    const suggestions: string[] = [];
    
    // First, check exact matches
    Object.values(SKILL_DATABASE).forEach(skill => {
      if (skill.canonical.toLowerCase().startsWith(lowercased)) {
        suggestions.push(skill.canonical);
      }
    });
    
    // Then check aliases
    if (suggestions.length < limit) {
      Object.values(SKILL_DATABASE).forEach(skill => {
        if (suggestions.includes(skill.canonical)) return;
        
        const matchingAlias = skill.aliases.some(alias => 
          alias.toLowerCase().includes(lowercased)
        );
        
        if (matchingAlias) {
          suggestions.push(skill.canonical);
        }
      });
    }
    
    return suggestions.slice(0, limit);
  }
  
  /**
   * Validates if a skill exists in our database
   */
  isKnownSkill(skillName: string): boolean {
    const normalized = this.normalize(skillName);
    return Object.values(SKILL_DATABASE).some(skill => skill.canonical === normalized);
  }
  
  /**
   * Gets all skills in a specific category
   */
  getSkillsByCategory(category: string): string[] {
    return Object.values(SKILL_DATABASE)
      .filter(skill => skill.category === category)
      .map(skill => skill.canonical);
  }
  
  /**
   * Gets all available categories
   */
  getAllCategories(): string[] {
    const categories = new Set<string>();
    Object.values(SKILL_DATABASE).forEach(skill => {
      categories.add(skill.category);
    });
    return Array.from(categories).sort();
  }
}

export const skillNormalizer = new SkillNormalizer();