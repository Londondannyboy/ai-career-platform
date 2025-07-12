#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}${colors.bright}🧪 Quest Automated Test Suite${colors.reset}`);
console.log(`${colors.cyan}=============================${colors.reset}\n`);

// Check if Playwright is installed
try {
  execSync('npx playwright --version', { stdio: 'ignore' });
} catch (error) {
  console.log(`${colors.yellow}⚠️  Playwright not installed. Installing...${colors.reset}`);
  try {
    execSync('npx playwright install', { stdio: 'inherit' });
    console.log(`${colors.green}✅ Playwright installed successfully${colors.reset}\n`);
  } catch (installError) {
    console.error(`${colors.red}❌ Failed to install Playwright${colors.reset}`);
    process.exit(1);
  }
}

// Test configurations
const tests = [
  {
    name: 'Data Enrichment Tests',
    command: 'npx playwright test tests/data-enrichment.spec.ts --reporter=list',
    description: 'Testing rich data objects, forms, and migration'
  },
  {
    name: 'Skill Relationships Tests',
    command: 'npx playwright test tests/skill-relationships.spec.ts --reporter=list',
    description: 'Testing 3D visualization and learning paths'
  },
  {
    name: 'Career Recommendations Tests',
    command: 'npx playwright test tests/career-recommendations.spec.ts --reporter=list',
    description: 'Testing AI insights and career analysis'
  }
];

// Run each test suite
let totalPassed = 0;
let totalFailed = 0;
const results = [];

tests.forEach((test, index) => {
  console.log(`${colors.blue}📋 ${test.name}${colors.reset}`);
  console.log(`   ${test.description}`);
  
  try {
    const startTime = Date.now();
    const output = execSync(test.command, { encoding: 'utf8' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Parse results from output
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    
    totalPassed += passed;
    totalFailed += failed;
    
    results.push({
      name: test.name,
      passed,
      failed,
      duration,
      status: failed === 0 ? 'PASS' : 'FAIL'
    });
    
    if (failed === 0) {
      console.log(`   ${colors.green}✅ All tests passed (${passed} tests in ${duration}s)${colors.reset}`);
    } else {
      console.log(`   ${colors.red}❌ ${failed} tests failed${colors.reset}`);
      console.log(`   ${colors.green}✅ ${passed} tests passed${colors.reset}`);
    }
    
    // Show output if there are failures
    if (failed > 0 && output.includes('✘')) {
      console.log(`${colors.red}   Failed tests:${colors.reset}`);
      const failedTests = output.split('\n').filter(line => line.includes('✘'));
      failedTests.forEach(line => console.log(`     ${line.trim()}`));
    }
    
  } catch (error) {
    console.log(`   ${colors.red}❌ Test suite failed to run${colors.reset}`);
    console.log(`   ${colors.yellow}Make sure the dev server is running: npm run dev${colors.reset}`);
    results.push({
      name: test.name,
      passed: 0,
      failed: 1,
      duration: 0,
      status: 'ERROR'
    });
    totalFailed += 1;
  }
  
  console.log('');
});

// Summary
console.log(`${colors.cyan}${colors.bright}📊 Summary${colors.reset}`);
console.log(`${colors.cyan}==========${colors.reset}\n`);

results.forEach(result => {
  const statusColor = result.status === 'PASS' ? colors.green : colors.red;
  console.log(`${statusColor}${result.status}${colors.reset} ${result.name}`);
  console.log(`     Passed: ${result.passed}, Failed: ${result.failed}, Duration: ${result.duration}s`);
});

console.log(`\n${colors.bright}Total:${colors.reset}`);
console.log(`  Tests run: ${totalPassed + totalFailed}`);
console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}\n`);

// Recommendations
if (totalFailed > 0) {
  console.log(`${colors.yellow}${colors.bright}⚠️  To fix failing tests:${colors.reset}`);
  console.log(`${colors.yellow}1. Ensure the dev server is running: npm run dev`);
  console.log(`2. Check that all environment variables are set`);
  console.log(`3. Review test output above for specific failures`);
  console.log(`4. Run individual tests with: npx playwright test [test-file] --debug`);
  console.log(`5. View test report: npx playwright show-report${colors.reset}\n`);
} else if (totalPassed > 0) {
  console.log(`${colors.green}${colors.bright}✨ All tests passed! The recent features are working correctly.${colors.reset}\n`);
}

// Generate simple test report
const reportPath = path.join(__dirname, 'test-results-summary.json');
const report = {
  timestamp: new Date().toISOString(),
  totalPassed,
  totalFailed,
  results,
  recommendations: totalFailed > 0 ? [
    'Ensure dev server is running',
    'Check environment variables',
    'Review authentication setup',
    'Check for TypeScript errors with npm run build'
  ] : []
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`${colors.blue}📄 Test report saved to: ${reportPath}${colors.reset}\n`);

// Exit with appropriate code
process.exit(totalFailed > 0 ? 1 : 0);