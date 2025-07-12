# Quest Automated Testing Guide

## 🚀 Quick Start

Run all feature tests with a single command:

```bash
node run-tests.js
```

This will:
1. Check if Playwright is installed (installs if needed)
2. Run all test suites sequentially
3. Display results in the terminal
4. Generate a summary report

## 📋 Test Suites

### 1. **Data Enrichment Tests** (`tests/data-enrichment.spec.ts`)
Tests the new rich data objects implementation:
- Rich experience forms with impact metrics
- Enhanced skill input with proficiency levels
- Education forms with achievements
- Automatic data migration from strings to objects
- Data persistence across sessions

### 2. **Skill Relationships Tests** (`tests/skill-relationships.spec.ts`)
Tests the skill intelligence features:
- 3D skill relationship visualization
- Skill clustering and analysis
- Learning path generation
- Prerequisite detection
- Skill progression timeline

### 3. **Career Recommendations Tests** (`tests/career-recommendations.spec.ts`)
Tests the AI-powered career analysis:
- Career velocity calculations
- 5 types of recommendations
- Gap analysis for future goals
- Career trajectory visualization
- Recommendation updates based on profile changes

## 🛠️ Running Individual Tests

### Run a specific test suite:
```bash
npx playwright test tests/data-enrichment.spec.ts
```

### Run tests in debug mode (opens browser):
```bash
npx playwright test tests/skill-relationships.spec.ts --debug
```

### Run tests with UI mode:
```bash
npx playwright test --ui
```

### Run tests in headed mode (see browser):
```bash
npx playwright test --headed
```

## 📊 Test Reports

### View HTML test report:
```bash
npx playwright show-report
```

### Test results are saved to:
- `test-results-summary.json` - Quick summary
- `playwright-report/` - Detailed HTML report
- `test-results/` - Screenshots and videos of failures

## 🔧 Prerequisites

1. **Dev server must be running:**
   ```bash
   npm run dev
   ```

2. **Environment variables must be set:**
   - Copy `.env.example` to `.env.local`
   - Ensure all required variables are set

3. **Install dependencies:**
   ```bash
   npm install
   ```

## 🐛 Debugging Failed Tests

### 1. Check screenshots
Failed tests automatically capture screenshots:
```
test-results/[test-name]/test-failed-1.png
```

### 2. Check videos
Videos are saved for failed tests:
```
test-results/[test-name]/video.webm
```

### 3. Run single test in debug mode
```bash
npx playwright test tests/career-recommendations.spec.ts -g "should display AI insights" --debug
```

### 4. Use Playwright Inspector
```bash
npx playwright test --debug
```

## 📝 Writing New Tests

### Test Structure:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  })

  test('should do something', async ({ page }) => {
    await page.goto('/some-page')
    await expect(page.locator('text=Something')).toBeVisible()
  })
})
```

### Best Practices:
1. Use data-testid attributes for reliable selectors
2. Wait for network idle when testing 3D visualizations
3. Mock authentication for consistent tests
4. Use page.waitForTimeout() sparingly
5. Always check for loading states

## 🔄 Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Install dependencies
  run: npm ci
  
- name: Install Playwright
  run: npx playwright install --with-deps
  
- name: Run tests
  run: npm test
  
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## ⚡ Performance Tips

1. **Run tests in parallel:**
   ```bash
   npx playwright test --workers=4
   ```

2. **Run only changed tests:**
   ```bash
   npx playwright test --only-changed
   ```

3. **Skip browser downloads:**
   ```bash
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
   ```

## 🎯 Test Coverage Goals

- [ ] All new features have tests
- [ ] Critical user paths are covered
- [ ] Error states are tested
- [ ] Data persistence is verified
- [ ] UI responsiveness is checked

## 💡 Common Issues

### "Page closed" errors
- Ensure dev server is running
- Check for unhandled promise rejections

### "Timeout" errors
- Increase timeout: `test.setTimeout(60000)`
- Check if elements are actually visible

### "Element not found" errors
- Use more specific selectors
- Add proper wait conditions
- Check if authentication is required

---

**Remember**: Good tests catch bugs before users do! 🐛🔍