/**
 * Quest Pre-Commit Validation System
 * 
 * Pragmatic validation with advisory mode, escape hatches, and progressive enforcement.
 * Ensures code quality while maintaining development velocity.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, statSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { 
  loadConfig, 
  shouldSkipValidation, 
  getCurrentBranch, 
  shouldSuggestUpgrade,
  type ValidationConfig 
} from './config';

// Validation result types
interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string[];
  severity: 'error' | 'warning' | 'info';
}

interface PrincipleValidation {
  principle: string;
  checks: ValidationResult[];
  passed: boolean;
  critical: boolean;
}

interface ValidationReport {
  overallPassed: boolean;
  principleResults: PrincipleValidation[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    criticalFailures: number;
    warnings: number;
  };
}

// Core validation class
export class QuestPreCommitValidator {
  private changedFiles: string[] = [];
  private results: PrincipleValidation[] = [];
  private config: ValidationConfig;
  private commitMessage: string = '';
  private branchName: string = '';

  constructor() {
    this.config = loadConfig();
    this.loadGitContext();
    this.loadChangedFiles();
  }

  private loadGitContext(): void {
    try {
      this.branchName = getCurrentBranch();
      // Try to get commit message from git prepare-commit-msg hook
      try {
        this.commitMessage = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
      } catch {
        this.commitMessage = ''; // No previous commits or can't access
      }
    } catch (error) {
      console.warn('Could not load git context');
    }
  }

  private loadChangedFiles(): void {
    try {
      // Get staged files for commit
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      this.changedFiles = output.trim().split('\n').filter(Boolean);
      
      // Apply performance limits
      if (this.changedFiles.length > this.config.performance.maxFilesToValidate) {
        console.log(`ℹ️  Limiting validation to ${this.config.performance.maxFilesToValidate} files for performance`);
        this.changedFiles = this.changedFiles.slice(0, this.config.performance.maxFilesToValidate);
      }
    } catch (error) {
      console.warn('Could not load changed files, validating all files');
      this.changedFiles = [];
    }
  }

  async validateAll(): Promise<ValidationReport> {
    // Check for escape hatches first
    if (shouldSkipValidation(this.commitMessage, this.branchName, this.config)) {
      console.log('🚀 Skipping validation due to escape hatch (emergency/hotfix/wip commit)');
      return this.createSkippedReport();
    }

    // Show current mode
    const modeEmoji = {
      advisory: '💡',
      selective: '⚖️',
      strict: '🔒',
      emergency: '🚨'
    };
    
    console.log(`${modeEmoji[this.config.mode]} Quest validation (${this.config.mode} mode)\n`);
    
    // Set timeout for performance
    const timeoutPromise = new Promise<ValidationReport>((_, reject) => {
      setTimeout(() => reject(new Error('Validation timeout')), this.config.performance.timeoutMs);
    });
    
    const validationPromise = this.runValidations();
    
    try {
      const result = await Promise.race([validationPromise, timeoutPromise]);
      
      // Show upgrade suggestion if applicable
      if (shouldSuggestUpgrade(this.config)) {
        console.log('\n💡 Tip: After 10+ commits, consider upgrading to selective mode:');
        console.log('   QUEST_VALIDATION_MODE=selective npm run validate');
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'Validation timeout') {
        console.log(`⏱️  Validation timed out after ${this.config.performance.timeoutMs}ms`);
        return this.createTimeoutReport();
      }
      throw error;
    }
  }

  private async runValidations(): Promise<ValidationReport> {
    // Run principle validations based on configuration
    if (this.config.principles.modularity.enabled) {
      await this.validateModularity();
    }
    if (this.config.principles.typeSafety.enabled) {
      await this.validateTypeSafety();
    }
    if (this.config.principles.testing.enabled) {
      await this.validateTesting();
    }
    if (this.config.principles.accessibility.enabled) {
      await this.validateAccessibility();
    }
    if (this.config.principles.performance.enabled) {
      await this.validatePerformance();
    }
    if (this.config.principles.security.enabled) {
      await this.validateSecurity();
    }
    if (this.config.principles.documentation.enabled) {
      await this.validateDocumentation();
    }

    return this.generateReport();
  }

  // Principle 1: Modularity
  private async validateModularity(): Promise<void> {
    const checks: ValidationResult[] = [];

    // Check for clear component interfaces
    const componentFiles = this.getRelevantFiles(['**/*.tsx', '**/*.ts'], ['**/*.test.*', '**/*.spec.*']);
    
    for (const file of componentFiles) {
      if (file.includes('/components/')) {
        const content = readFileSync(file, 'utf8');
        
        // Check for exported interface or proper props typing
        const hasPropsInterface = /interface\s+\w+Props/m.test(content) || 
                                /type\s+\w+Props/m.test(content) ||
                                /\w+:\s*React\.FC<\w+>/m.test(content);
        
        if (!hasPropsInterface && content.includes('export function') && content.includes('Props')) {
          checks.push({
            passed: false,
            message: `Component ${path.basename(file)} missing typed props interface`,
            severity: 'error',
            details: ['Define props interface for better type safety and documentation']
          });
        } else {
          checks.push({
            passed: true,
            message: `Component ${path.basename(file)} has proper interface`,
            severity: 'info'
          });
        }
      }
    }

    // Check for global state coupling
    for (const file of componentFiles) {
      const content = readFileSync(file, 'utf8');
      const hasGlobalStateCoupling = /useGlobal|globalState|window\./m.test(content);
      
      if (hasGlobalStateCoupling) {
        checks.push({
          passed: false,
          message: `${path.basename(file)} may be tightly coupled to global state`,
          severity: 'warning',
          details: ['Consider dependency injection or context for better modularity']
        });
      }
    }

    this.results.push({
      principle: 'Modularity',
      checks,
      passed: this.evaluatePrinciplePassed('modularity', checks),
      critical: this.config.principles.modularity.severity === 'error'
    });
  }

  // Principle 2: Type Safety
  private async validateTypeSafety(): Promise<void> {
    const checks: ValidationResult[] = [];

    try {
      // Run TypeScript compiler check
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      checks.push({
        passed: true,
        message: 'TypeScript compilation successful',
        severity: 'info'
      });
    } catch (error) {
      checks.push({
        passed: false,
        message: 'TypeScript compilation failed',
        severity: 'error',
        details: ['Fix TypeScript errors before committing']
      });
    }

    // Check for any types
    const tsFiles = this.getRelevantFiles(['**/*.ts', '**/*.tsx'], ['**/*.d.ts']);
    for (const file of tsFiles) {
      const content = readFileSync(file, 'utf8');
      const anyTypeUsage = content.match(/:\s*any\b|as\s+any\b/g);
      
      if (anyTypeUsage && anyTypeUsage.length > 0) {
        checks.push({
          passed: false,
          message: `${path.basename(file)} contains ${anyTypeUsage.length} 'any' types`,
          severity: 'warning',
          details: ['Replace any types with specific types for better type safety']
        });
      }
    }

    this.results.push({
      principle: 'Type Safety',
      checks,
      passed: this.evaluatePrinciplePassed('typeSafety', checks),
      critical: this.config.principles.typeSafety.severity === 'error'
    });
  }

  // Principle 3: Testing
  private async validateTesting(): Promise<void> {
    const checks: ValidationResult[] = [];

    // Check test coverage for new components
    const newComponents = this.changedFiles.filter(f => 
      f.includes('/components/') && (f.endsWith('.tsx') || f.endsWith('.ts'))
    );

    for (const component of newComponents) {
      const testFile = component.replace(/\.(tsx?|jsx?)$/, '.test.$1');
      const specFile = component.replace(/\.(tsx?|jsx?)$/, '.spec.$1');
      
      if (!existsSync(testFile) && !existsSync(specFile)) {
        checks.push({
          passed: false,
          message: `Missing tests for ${path.basename(component)}`,
          severity: 'error',
          details: ['Create corresponding test file for new components']
        });
      } else {
        checks.push({
          passed: true,
          message: `Tests found for ${path.basename(component)}`,
          severity: 'info'
        });
      }
    }

    // Run existing tests
    try {
      execSync('npm test -- --passWithNoTests --watchAll=false', { stdio: 'pipe' });
      checks.push({
        passed: true,
        message: 'All tests passing',
        severity: 'info'
      });
    } catch (error) {
      checks.push({
        passed: false,
        message: 'Some tests are failing',
        severity: 'error',
        details: ['Fix failing tests before committing']
      });
    }

    this.results.push({
      principle: 'Testing',
      checks,
      passed: this.evaluatePrinciplePassed('testing', checks),
      critical: this.config.principles.testing.severity === 'error'
    });
  }

  // Principle 4: Accessibility
  private async validateAccessibility(): Promise<void> {
    const checks: ValidationResult[] = [];

    // Check for accessibility patterns in components
    const componentFiles = this.getRelevantFiles(['**/*.tsx'], ['**/*.test.*']);
    
    for (const file of componentFiles) {
      const content = readFileSync(file, 'utf8');
      
      // Check for buttons without proper accessibility
      if (content.includes('<button') && !content.includes('aria-label') && !content.includes('aria-describedby')) {
        const hasTextContent = /<button[^>]*>[^<]+<\/button>/.test(content);
        if (!hasTextContent) {
          checks.push({
            passed: false,
            message: `${path.basename(file)} has buttons without accessible labels`,
            severity: 'warning',
            details: ['Add aria-label or ensure button has descriptive text content']
          });
        }
      }

      // Check for images without alt text
      if (content.includes('<img') && !content.includes('alt=')) {
        checks.push({
          passed: false,
          message: `${path.basename(file)} has images without alt text`,
          severity: 'error',
          details: ['Add alt attributes to all images']
        });
      }

      // Check for form inputs without labels
      if (content.includes('<input') && !content.includes('aria-label') && !content.includes('id=')) {
        checks.push({
          passed: false,
          message: `${path.basename(file)} has inputs without proper labeling`,
          severity: 'warning',
          details: ['Connect inputs to labels using id/htmlFor or aria-label']
        });
      }
    }

    this.results.push({
      principle: 'Accessibility',
      checks,
      passed: this.evaluatePrinciplePassed('accessibility', checks),
      critical: this.config.principles.accessibility.severity === 'error'
    });
  }

  // Principle 5: Performance
  private async validatePerformance(): Promise<void> {
    const checks: ValidationResult[] = [];

    // Check bundle size impact
    try {
      execSync('npm run build', { stdio: 'pipe' });
      
      // Check for large new dependencies
      const packageJsonFiles = this.changedFiles.filter(f => f.includes('package.json'));
      for (const file of packageJsonFiles) {
        const content = JSON.parse(readFileSync(file, 'utf8'));
        
        // Check for potentially large dependencies
        const largeDeps = ['lodash', 'moment', 'rxjs'];
        const dependencies = { ...content.dependencies, ...content.devDependencies };
        
        for (const dep of largeDeps) {
          if (dependencies[dep]) {
            checks.push({
              passed: false,
              message: `Added potentially large dependency: ${dep}`,
              severity: 'warning',
              details: ['Consider lighter alternatives or tree-shaking']
            });
          }
        }
      }
      
      checks.push({
        passed: true,
        message: 'Build successful - no obvious performance issues',
        severity: 'info'
      });
    } catch (error) {
      checks.push({
        passed: false,
        message: 'Build failed - check for performance impact',
        severity: 'error'
      });
    }

    this.results.push({
      principle: 'Performance',
      checks,
      passed: this.evaluatePrinciplePassed('performance', checks),
      critical: this.config.principles.performance.severity === 'error'
    });
  }

  // Principle 6: Security
  private async validateSecurity(): Promise<void> {
    const checks: ValidationResult[] = [];

    // Check for exposed secrets
    const allFiles = this.getRelevantFiles(['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']);
    
    for (const file of allFiles) {
      const content = readFileSync(file, 'utf8');
      
      // Check for potential secrets
      const secretPatterns = [
        /api[_-]?key[_-]?=\s*['"]\w+/i,
        /secret[_-]?=\s*['"]\w+/i,
        /password[_-]?=\s*['"]\w+/i,
        /token[_-]?=\s*['"]\w+/i,
      ];
      
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          checks.push({
            passed: false,
            message: `Potential secret found in ${path.basename(file)}`,
            severity: 'error',
            details: ['Move secrets to environment variables']
          });
        }
      }

      // Check for SQL injection risks
      if (content.includes('query') && content.includes('${') && !content.includes('sql`')) {
        checks.push({
          passed: false,
          message: `Potential SQL injection risk in ${path.basename(file)}`,
          severity: 'error',
          details: ['Use parameterized queries or prepared statements']
        });
      }
    }

    this.results.push({
      principle: 'Security',
      checks,
      passed: this.evaluatePrinciplePassed('security', checks),
      critical: this.config.principles.security.severity === 'error'
    });
  }

  // Principle 7: Documentation
  private async validateDocumentation(): Promise<void> {
    const checks: ValidationResult[] = [];

    // Check for JSDoc on public APIs
    const newApiFiles = this.changedFiles.filter(f => 
      f.includes('/api/') && (f.endsWith('.ts') || f.endsWith('.tsx'))
    );

    for (const file of newApiFiles) {
      const content = readFileSync(file, 'utf8');
      
      if (content.includes('export') && !content.includes('/**')) {
        checks.push({
          passed: false,
          message: `API file ${path.basename(file)} missing JSDoc documentation`,
          severity: 'warning',
          details: ['Add JSDoc comments to public API functions']
        });
      }
    }

    // Check for README updates when adding new features
    const newFeatureFiles = this.changedFiles.filter(f => 
      f.includes('/src/') && !f.includes('.test.') && !f.includes('.spec.')
    );

    if (newFeatureFiles.length > 3 && !this.changedFiles.includes('README.md')) {
      checks.push({
        passed: false,
        message: 'Large changes without README update',
        severity: 'warning',
        details: ['Consider updating README for significant feature additions']
      });
    }

    this.results.push({
      principle: 'Documentation',
      checks,
      passed: this.evaluatePrinciplePassed('documentation', checks),
      critical: this.config.principles.documentation.severity === 'error'
    });
  }

  private getRelevantFiles(include: string[], exclude: string[] = []): string[] {
    if (this.changedFiles.length > 0) {
      return this.changedFiles.filter(file => {
        const included = include.some(pattern => 
          file.match(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
        );
        const excluded = exclude.some(pattern => 
          file.match(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
        );
        return included && !excluded && existsSync(file);
      });
    }

    // Fallback to all files if no changes detected
    return glob.sync(include[0], { ignore: exclude });
  }

  private generateReport(): ValidationReport {
    const allChecks = this.results.flatMap(r => r.checks);
    const criticalFailures = this.results.filter(r => r.critical && !r.passed).length;
    
    const report: ValidationReport = {
      overallPassed: criticalFailures === 0,
      principleResults: this.results,
      summary: {
        totalChecks: allChecks.length,
        passedChecks: allChecks.filter(c => c.passed).length,
        criticalFailures,
        warnings: allChecks.filter(c => c.severity === 'warning').length,
      }
    };

    this.printReport(report);
    return report;
  }

  // Helper methods for pragmatic validation
  private evaluatePrinciplePassed(
    principle: keyof ValidationConfig['principles'], 
    checks: ValidationResult[]
  ): boolean {
    const severity = this.config.principles[principle].severity;
    
    // In advisory mode, only block on errors if severity is 'error'
    if (this.config.mode === 'advisory') {
      return severity !== 'error' || checks.every(c => c.passed || c.severity !== 'error');
    }
    
    // In other modes, respect the configured severity
    return checks.every(c => c.passed || c.severity === 'info');
  }

  private createSkippedReport(): ValidationReport {
    return {
      overallPassed: true,
      principleResults: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        criticalFailures: 0,
        warnings: 0,
      }
    };
  }

  private createTimeoutReport(): ValidationReport {
    return {
      overallPassed: this.config.mode === 'advisory', // Don't block in advisory mode
      principleResults: [{
        principle: 'Performance',
        checks: [{
          passed: false,
          message: 'Validation timed out - consider using emergency mode for urgent commits',
          severity: this.config.mode === 'advisory' ? 'warning' : 'error'
        }],
        passed: this.config.mode === 'advisory',
        critical: this.config.mode !== 'advisory'
      }],
      summary: {
        totalChecks: 1,
        passedChecks: this.config.mode === 'advisory' ? 1 : 0,
        criticalFailures: this.config.mode === 'advisory' ? 0 : 1,
        warnings: this.config.mode === 'advisory' ? 1 : 0,
      }
    };
  }

  private printReport(report: ValidationReport): void {
    console.log('\n📊 Quest Validation Report\n');
    console.log('='.repeat(50));

    // Show mode-specific guidance
    if (this.config.mode === 'advisory') {
      console.log('💡 Advisory Mode: Showing recommendations, not blocking commits');
    } else if (this.config.mode === 'emergency') {
      console.log('🚨 Emergency Mode: Minimal validation only');
    }

    for (const principle of report.principleResults) {
      const icon = principle.passed ? '✅' : principle.critical ? '❌' : '⚠️';
      console.log(`\n${icon} ${principle.principle} ${principle.critical ? '(Critical)' : ''}`);
      
      for (const check of principle.checks) {
        const checkIcon = check.passed ? '  ✓' : check.severity === 'error' ? '  ✗' : '  ⚠';
        console.log(`${checkIcon} ${check.message}`);
        
        if (check.details) {
          check.details.forEach(detail => console.log(`    • ${detail}`));
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Summary: ${report.summary.passedChecks}/${report.summary.totalChecks} checks passed`);
    
    if (this.config.mode === 'advisory') {
      if (report.summary.warnings > 0) {
        console.log(`💡 ${report.summary.warnings} recommendations - commit proceeding`);
      } else {
        console.log('✅ All recommendations followed!');
      }
    } else {
      if (report.summary.criticalFailures > 0) {
        console.log(`❌ ${report.summary.criticalFailures} critical failures - commit blocked`);
        console.log('\n🚀 Emergency override: git commit --no-verify');
        console.log('🚨 Emergency mode: QUEST_VALIDATION_MODE=emergency git commit');
      } else if (report.summary.warnings > 0) {
        console.log(`⚠️  ${report.summary.warnings} warnings - commit allowed but consider fixes`);
      } else {
        console.log('✅ All validations passed!');
      }
    }
  }
}

// CLI entry point
if (require.main === module) {
  const validator = new QuestPreCommitValidator();
  validator.validateAll().then(report => {
    // In advisory mode, always allow commits (exit 0)
    // In other modes, respect the validation results
    const config = loadConfig();
    const shouldExit = config.mode === 'advisory' ? 0 : (report.overallPassed ? 0 : 1);
    process.exit(shouldExit);
  }).catch(error => {
    console.error('Validation failed:', error);
    // In advisory mode, don't block on unexpected errors
    const config = loadConfig();
    process.exit(config.mode === 'advisory' ? 0 : 1);
  });
}