/**
 * Quest Validation Configuration
 * 
 * Pragmatic configuration for validation system with advisory mode,
 * escape hatches, and progressive enforcement.
 */

export interface ValidationConfig {
  // Validation modes
  mode: 'advisory' | 'selective' | 'strict' | 'emergency';
  
  // Skip patterns
  skipOnCommitMessage: RegExp[];
  skipOnBranch: string[];
  skipOnFilePatterns: string[];
  
  // Progressive enforcement
  progressiveMode: {
    enabled: boolean;
    firstCommitMode: 'advisory' | 'selective';
    subsequentCommitMode: 'advisory' | 'selective' | 'strict';
    commitCountThreshold: number;
  };
  
  // Performance settings
  performance: {
    timeoutMs: number;
    validateOnlyChanged: boolean;
    maxFilesToValidate: number;
  };
  
  // Principle-specific settings
  principles: {
    modularity: { enabled: boolean; severity: 'error' | 'warning' | 'info' };
    typeSafety: { enabled: boolean; severity: 'error' | 'warning' | 'info' };
    testing: { enabled: boolean; severity: 'error' | 'warning' | 'info' };
    accessibility: { enabled: boolean; severity: 'error' | 'warning' | 'info' };
    performance: { enabled: boolean; severity: 'error' | 'warning' | 'info' };
    security: { enabled: boolean; severity: 'error' | 'warning' | 'info' };
    documentation: { enabled: boolean; severity: 'error' | 'warning' | 'info' };
  };
}

// Default pragmatic configuration
export const defaultConfig: ValidationConfig = {
  // Start with advisory mode - show warnings, don't block
  mode: 'advisory',
  
  // Escape hatches for emergency situations
  skipOnCommitMessage: [
    /^(hotfix|emergency|urgent):/i,
    /^wip:/i,
    /^fixup!/i,
    /^temp:/i,
  ],
  
  skipOnBranch: [
    'hotfix/*',
    'emergency/*',
    'temp/*',
  ],
  
  skipOnFilePatterns: [
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/.git/**',
    '**/coverage/**',
  ],
  
  // Progressive enforcement - ease teams into strict mode
  progressiveMode: {
    enabled: true,
    firstCommitMode: 'advisory',      // First commit: warnings only
    subsequentCommitMode: 'advisory', // Stay advisory until manually changed
    commitCountThreshold: 10,         // After 10 commits, suggest upgrading
  },
  
  // Performance optimizations
  performance: {
    timeoutMs: 30000,        // 30 second timeout
    validateOnlyChanged: true, // Only validate changed files
    maxFilesToValidate: 50,   // Limit to prevent long waits
  },
  
  // Principle enforcement levels - start lenient
  principles: {
    modularity: { enabled: true, severity: 'warning' },
    typeSafety: { enabled: true, severity: 'error' },    // TypeScript errors should block
    testing: { enabled: true, severity: 'warning' },     // Tests recommended but not required
    accessibility: { enabled: true, severity: 'warning' },
    performance: { enabled: true, severity: 'info' },    // Performance tracking only
    security: { enabled: true, severity: 'error' },      // Security issues should block
    documentation: { enabled: true, severity: 'info' },  // Documentation encouraged
  },
};

// Emergency mode - minimal checks only
export const emergencyConfig: ValidationConfig = {
  ...defaultConfig,
  mode: 'emergency',
  performance: {
    ...defaultConfig.performance,
    timeoutMs: 5000, // 5 second timeout
  },
  principles: {
    modularity: { enabled: false, severity: 'info' },
    typeSafety: { enabled: true, severity: 'warning' },  // Still check TypeScript
    testing: { enabled: false, severity: 'info' },
    accessibility: { enabled: false, severity: 'info' },
    performance: { enabled: false, severity: 'info' },
    security: { enabled: true, severity: 'error' },      // Always check security
    documentation: { enabled: false, severity: 'info' },
  },
};

// Strict mode for mature teams
export const strictConfig: ValidationConfig = {
  ...defaultConfig,
  mode: 'strict',
  skipOnCommitMessage: [
    /^emergency:/i, // Only allow emergency override
  ],
  progressiveMode: {
    ...defaultConfig.progressiveMode,
    enabled: false,
  },
  principles: {
    modularity: { enabled: true, severity: 'error' },
    typeSafety: { enabled: true, severity: 'error' },
    testing: { enabled: true, severity: 'error' },
    accessibility: { enabled: true, severity: 'error' },
    performance: { enabled: true, severity: 'warning' },
    security: { enabled: true, severity: 'error' },
    documentation: { enabled: true, severity: 'warning' },
  },
};

// Load configuration from environment or use defaults
export function loadConfig(): ValidationConfig {
  const configMode = process.env.QUEST_VALIDATION_MODE as ValidationConfig['mode'];
  
  switch (configMode) {
    case 'emergency':
      return emergencyConfig;
    case 'strict':
      return strictConfig;
    case 'selective':
    case 'advisory':
    default:
      return defaultConfig;
  }
}

// Configuration helpers
export function shouldSkipValidation(
  commitMessage: string,
  branchName: string,
  config: ValidationConfig
): boolean {
  // Check commit message patterns
  for (const pattern of config.skipOnCommitMessage) {
    if (pattern.test(commitMessage)) {
      return true;
    }
  }
  
  // Check branch patterns
  for (const pattern of config.skipOnBranch) {
    if (branchName.includes(pattern.replace('*', ''))) {
      return true;
    }
  }
  
  return false;
}

export function getCommitCount(): number {
  try {
    const { execSync } = require('child_process');
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' });
    return parseInt(count.trim(), 10);
  } catch {
    return 0;
  }
}

export function shouldSuggestUpgrade(config: ValidationConfig): boolean {
  if (!config.progressiveMode.enabled) return false;
  
  const commitCount = getCommitCount();
  return commitCount >= config.progressiveMode.commitCountThreshold &&
         config.mode === 'advisory';
}

export function getCurrentBranch(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'main';
  }
}