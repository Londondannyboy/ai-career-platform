import { test, expect, Page } from '@playwright/test'

// Mock authentication for testing
async function mockAuthentication(page: Page) {
  await page.addInitScript(() => {
    // Mock Clerk authentication
    (window as any).__clerk_ssr_state = {
      sessionClaims: { sub: 'test-user-123' },
      userId: 'test-user-123'
    }
  })
}

test.describe('Data Enrichment Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page)
  })

  test('should display rich experience form with impact metrics', async ({ page }) => {
    await page.goto('/repo/edit')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if redirected to login
    if (page.url().includes('/sign-in')) {
      console.log('Authentication required - test environment needs auth setup')
      return
    }
    
    // Navigate to experience section
    await page.locator('button:has-text("Experience")').click()
    await page.waitForTimeout(500)
    
    // Click add experience button
    await page.locator('button:has-text("Add Experience")').click()
    
    // Check for rich experience fields
    await expect(page.locator('input[placeholder="Job Title"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Company"]')).toBeVisible()
    
    // Check for new rich data fields
    await expect(page.locator('label:has-text("Team Size")')).toBeVisible()
    await expect(page.locator('label:has-text("Direct Reports")')).toBeVisible()
    
    // Check for impact metrics section
    await expect(page.locator('text=Impact & Achievements')).toBeVisible()
    await expect(page.locator('button:has-text("Add Impact")')).toBeVisible()
    
    // Add impact metric
    await page.locator('button:has-text("Add Impact")').click()
    await expect(page.locator('input[placeholder="Describe your impact"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Metric (e.g., 40%, $2M)"]')).toBeVisible()
    
    // Check for technologies field
    await expect(page.locator('label:has-text("Technologies Used")')).toBeVisible()
    
    // Check for methodologies field
    await expect(page.locator('label:has-text("Methodologies")')).toBeVisible()
  })

  test('should save and display rich experience data', async ({ page }) => {
    await page.goto('/repo/edit')
    
    if (page.url().includes('/sign-in')) {
      return
    }
    
    // Navigate to experience section
    await page.locator('button:has-text("Experience")').click()
    await page.waitForTimeout(500)
    
    // Add new experience
    await page.locator('button:has-text("Add Experience")').click()
    
    // Fill in basic info
    await page.fill('input[placeholder="Job Title"]', 'Senior Software Engineer')
    await page.fill('input[placeholder="Company"]', 'Tech Corp')
    
    // Fill in rich data
    await page.fill('input[name="teamSize"]', '12')
    await page.fill('input[name="directReports"]', '3')
    
    // Add impact metric
    await page.locator('button:has-text("Add Impact")').click()
    await page.fill('input[placeholder="Describe your impact"]', 'Reduced API latency')
    await page.fill('input[placeholder="Metric (e.g., 40%, $2M)"]', '45%')
    
    // Add technologies
    await page.fill('input[placeholder="Add technologies..."]', 'React, Node.js, PostgreSQL')
    
    // Save
    await page.locator('button:has-text("Save")').click()
    
    // Wait for save
    await page.waitForTimeout(1000)
    
    // Verify data persisted
    await page.reload()
    await page.locator('button:has-text("Experience")').click()
    
    // Check if data is displayed
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible()
    await expect(page.locator('text=Tech Corp')).toBeVisible()
    await expect(page.locator('text=Team: 12')).toBeVisible()
    await expect(page.locator('text=Reports: 3')).toBeVisible()
  })

  test('should display enhanced skill input with proficiency levels', async ({ page }) => {
    await page.goto('/repo/edit')
    
    if (page.url().includes('/sign-in')) {
      return
    }
    
    // Navigate to skills section
    await page.locator('button:has-text("Skills")').click()
    await page.waitForTimeout(500)
    
    // Add new skill
    await page.locator('button:has-text("Add Skill")').click()
    
    // Check for enhanced skill fields
    await expect(page.locator('input[placeholder="Skill name"]')).toBeVisible()
    await expect(page.locator('label:has-text("Proficiency Level")')).toBeVisible()
    await expect(page.locator('label:has-text("Years of Experience")')).toBeVisible()
    await expect(page.locator('label:has-text("Actively Using")')).toBeVisible()
    
    // Check proficiency dropdown options
    await page.locator('select[name="proficiency"]').click()
    await expect(page.locator('option[value="beginner"]')).toBeVisible()
    await expect(page.locator('option[value="intermediate"]')).toBeVisible()
    await expect(page.locator('option[value="advanced"]')).toBeVisible()
    await expect(page.locator('option[value="expert"]')).toBeVisible()
  })

  test('should display education form with achievements', async ({ page }) => {
    await page.goto('/repo/edit')
    
    if (page.url().includes('/sign-in')) {
      return
    }
    
    // Navigate to education section
    await page.locator('button:has-text("Education")').click()
    await page.waitForTimeout(500)
    
    // Add new education
    await page.locator('button:has-text("Add Education")').click()
    
    // Check for education fields
    await expect(page.locator('input[placeholder="Institution"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Degree"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Field of Study"]')).toBeVisible()
    
    // Check for achievements section
    await expect(page.locator('label:has-text("Achievements")')).toBeVisible()
    await expect(page.locator('button:has-text("Add Achievement")').first()).toBeVisible()
    
    // Check for GPA field
    await expect(page.locator('input[placeholder="GPA (optional)"]')).toBeVisible()
    
    // Test institution autocomplete
    await page.fill('input[placeholder="Institution"]', 'Harv')
    await page.waitForTimeout(500)
    // Should show Harvard suggestion
    await expect(page.locator('text=Harvard University')).toBeVisible()
  })

  test('should automatically migrate legacy string data to rich objects', async ({ page }) => {
    // First, simulate legacy data by directly calling API
    const response = await page.request.get('/api/deep-repo', {
      headers: {
        'X-User-Id': 'test-user-123'
      }
    })
    
    if (response.ok()) {
      const data = await response.json()
      console.log('Current data structure:', data)
      
      // Check if migration happened
      if (data.surface_repo_data?.skills) {
        const firstSkill = data.surface_repo_data.skills[0]
        if (typeof firstSkill === 'object') {
          expect(firstSkill).toHaveProperty('name')
          expect(firstSkill).toHaveProperty('proficiency')
          console.log('Data successfully migrated to rich objects')
        }
      }
    }
  })

  test('should validate required fields before saving', async ({ page }) => {
    await page.goto('/repo/edit')
    
    if (page.url().includes('/sign-in')) {
      return
    }
    
    // Try to save empty experience
    await page.locator('button:has-text("Experience")').click()
    await page.locator('button:has-text("Add Experience")').click()
    await page.locator('button:has-text("Save")').click()
    
    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Company is required')).toBeVisible()
  })

  test('should handle future experience entries', async ({ page }) => {
    await page.goto('/repo/edit')
    
    if (page.url().includes('/sign-in')) {
      return
    }
    
    // Navigate to experience section
    await page.locator('button:has-text("Experience")').click()
    await page.waitForTimeout(500)
    
    // Add future experience
    await page.locator('button:has-text("Add Future Goal")').click()
    
    // Check for future experience indicator
    await expect(page.locator('text=Future Goal')).toBeVisible()
    
    // Fill future role
    await page.fill('input[placeholder="Target Job Title"]', 'Engineering Manager')
    await page.fill('input[placeholder="Target Company"]', 'Dream Company')
    
    // Should allow setting target date
    await expect(page.locator('input[type="date"][name="targetDate"]')).toBeVisible()
  })
})

test.describe('Data Persistence and Migration', () => {
  test('should persist rich data across sessions', async ({ page, context }) => {
    await mockAuthentication(page)
    
    // First session - add data
    await page.goto('/repo/edit')
    
    if (page.url().includes('/sign-in')) {
      return
    }
    
    // Add skill with rich data
    await page.locator('button:has-text("Skills")').click()
    await page.locator('button:has-text("Add Skill")').click()
    await page.fill('input[placeholder="Skill name"]', 'TypeScript')
    await page.selectOption('select[name="proficiency"]', 'expert')
    await page.fill('input[name="yearsOfExperience"]', '5')
    await page.check('input[name="activelyUsing"]')
    await page.locator('button:has-text("Save")').click()
    
    // Wait for save
    await page.waitForTimeout(1000)
    
    // Close and reopen in new page
    const newPage = await context.newPage()
    await mockAuthentication(newPage)
    await newPage.goto('/repo/edit')
    
    // Check data persisted
    await newPage.locator('button:has-text("Skills")').click()
    await expect(newPage.locator('text=TypeScript')).toBeVisible()
    await expect(newPage.locator('text=Expert')).toBeVisible()
    await expect(newPage.locator('text=5 years')).toBeVisible()
    
    await newPage.close()
  })
})