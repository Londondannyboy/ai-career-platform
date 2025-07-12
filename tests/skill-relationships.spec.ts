import { test, expect, Page } from '@playwright/test'

// Mock authentication
async function mockAuthentication(page: Page) {
  await page.addInitScript(() => {
    (window as any).__clerk_ssr_state = {
      sessionClaims: { sub: 'test-user-123' },
      userId: 'test-user-123'
    }
  })
}

// Mock user with skills for testing
async function setupTestUserWithSkills(page: Page) {
  // Intercept API calls to provide test data
  await page.route('/api/deep-repo/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        surface_repo_data: {
          skills: [
            { name: 'JavaScript', proficiency: 'expert', yearsOfExperience: 8 },
            { name: 'React', proficiency: 'advanced', yearsOfExperience: 5 },
            { name: 'Node.js', proficiency: 'advanced', yearsOfExperience: 6 },
            { name: 'Python', proficiency: 'intermediate', yearsOfExperience: 3 },
            { name: 'TypeScript', proficiency: 'advanced', yearsOfExperience: 4 },
            { name: 'GraphQL', proficiency: 'intermediate', yearsOfExperience: 2 },
            { name: 'Docker', proficiency: 'intermediate', yearsOfExperience: 3 },
            { name: 'AWS', proficiency: 'beginner', yearsOfExperience: 1 }
          ]
        }
      })
    })
  })
}

test.describe('Skill Relationships and Learning Paths', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page)
    await setupTestUserWithSkills(page)
  })

  test('should display skill relationship 3D graph', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Wait for page load
    await page.waitForLoadState('networkidle')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    await page.waitForTimeout(500)
    
    // Check for 3D visualization section
    await expect(page.locator('text=Skill Relationships')).toBeVisible()
    
    // Check for 3D graph container
    const graphContainer = page.locator('[data-testid="skill-relationship-graph"]')
    await expect(graphContainer).toBeVisible()
    
    // Check for graph controls
    await expect(page.locator('text=Zoom')).toBeVisible()
    await expect(page.locator('text=Rotate')).toBeVisible()
    
    // Check for cluster analysis
    await expect(page.locator('text=Skill Clusters')).toBeVisible()
    await expect(page.locator('text=Frontend')).toBeVisible()
    await expect(page.locator('text=Backend')).toBeVisible()
    
    // Check cluster coverage percentages
    await expect(page.locator('text=Coverage:')).toBeVisible()
  })

  test('should show skill prerequisites and relationships', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    
    // Click on a skill node to see relationships
    await page.locator('text=React').first().click()
    await page.waitForTimeout(500)
    
    // Should show skill details modal
    await expect(page.locator('text=Skill Details')).toBeVisible()
    
    // Check for prerequisites
    await expect(page.locator('text=Prerequisites')).toBeVisible()
    await expect(page.locator('text=JavaScript')).toBeVisible() // React requires JS
    
    // Check for complementary skills
    await expect(page.locator('text=Complementary Skills')).toBeVisible()
    await expect(page.locator('text=TypeScript')).toBeVisible()
    await expect(page.locator('text=GraphQL')).toBeVisible()
    
    // Check for next skills to learn
    await expect(page.locator('text=Next Skills')).toBeVisible()
  })

  test('should display learning path generator', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    
    // Find learning path section
    await expect(page.locator('text=Generate Learning Path')).toBeVisible()
    await page.locator('button:has-text("Generate Learning Path")').click()
    
    // Should show learning path modal
    await expect(page.locator('text=Create Your Learning Path')).toBeVisible()
    
    // Enter target skill
    await page.fill('input[placeholder="Enter target skill..."]', 'Machine Learning')
    await page.locator('button:has-text("Generate Path")').click()
    
    // Wait for path generation
    await page.waitForTimeout(1000)
    
    // Should show learning path steps
    await expect(page.locator('text=Learning Path to Machine Learning')).toBeVisible()
    
    // Check for prerequisite skills
    await expect(page.locator('text=Step 1: Python')).toBeVisible()
    await expect(page.locator('text=Step 2: Statistics')).toBeVisible()
    await expect(page.locator('text=Step 3: NumPy')).toBeVisible()
    
    // Check time estimates
    await expect(page.locator('text=Estimated time:')).toBeVisible()
    await expect(page.locator('text=months')).toBeVisible()
    
    // Check difficulty indicators
    await expect(page.locator('text=Difficulty:')).toBeVisible()
  })

  test('should show skill cluster analysis', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    
    // Check cluster analysis section
    const clusterSection = page.locator('[data-testid="skill-clusters"]')
    await expect(clusterSection).toBeVisible()
    
    // Check for different clusters
    const clusters = ['Frontend', 'Backend', 'DevOps', 'Data Science', 'Mobile', 'Databases', 'Other']
    
    for (const cluster of clusters) {
      const clusterElement = page.locator(`text=${cluster}`).first()
      if (await clusterElement.isVisible()) {
        // Check for coverage percentage
        const coverageText = await clusterElement.locator('..').locator('text=%').textContent()
        expect(coverageText).toMatch(/\d+%/)
        
        // Check for skill count
        const skillCount = await clusterElement.locator('..').locator('text=skills').textContent()
        expect(skillCount).toMatch(/\d+ skills/)
      }
    }
  })

  test('should highlight skill gaps and recommendations', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    
    // Look for skill gap analysis
    await expect(page.locator('text=Skill Gaps')).toBeVisible()
    
    // Should show recommended skills to learn
    await expect(page.locator('text=Recommended Skills')).toBeVisible()
    
    // Check for specific recommendations based on current skills
    // User has React/JS but might need testing skills
    await expect(page.locator('text=Jest')).toBeVisible()
    await expect(page.locator('text=Testing Library')).toBeVisible()
    
    // User has basic AWS, might need more cloud skills
    await expect(page.locator('text=Kubernetes')).toBeVisible()
  })

  test('should allow filtering skills by proficiency', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    
    // Check for filter options
    await expect(page.locator('text=Filter by proficiency')).toBeVisible()
    
    // Filter by expert level
    await page.locator('button:has-text("Expert")').click()
    
    // Should only show expert skills
    await expect(page.locator('text=JavaScript')).toBeVisible()
    await expect(page.locator('text=Python')).not.toBeVisible() // Intermediate
    
    // Filter by beginner level
    await page.locator('button:has-text("Beginner")').click()
    
    // Should only show beginner skills
    await expect(page.locator('text=AWS')).toBeVisible()
    await expect(page.locator('text=JavaScript')).not.toBeVisible() // Expert
  })

  test('should show skill progression timeline', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    
    // Check for timeline view
    await page.locator('button:has-text("Timeline View")').click()
    
    // Should show skills on a timeline
    await expect(page.locator('text=Skill Progression Timeline')).toBeVisible()
    
    // Check for year markers
    const currentYear = new Date().getFullYear()
    await expect(page.locator(`text=${currentYear}`)).toBeVisible()
    await expect(page.locator(`text=${currentYear - 1}`)).toBeVisible()
    
    // Skills should be positioned based on experience
    const jsSkill = page.locator('[data-skill="JavaScript"]')
    const awsSkill = page.locator('[data-skill="AWS"]')
    
    // JavaScript (8 years) should appear earlier than AWS (1 year)
    const jsPosition = await jsSkill.boundingBox()
    const awsPosition = await awsSkill.boundingBox()
    
    if (jsPosition && awsPosition) {
      expect(jsPosition.x).toBeLessThan(awsPosition.x)
    }
  })

  test('should export skill data', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to skills tab
    await page.locator('button:has-text("Skills")').click()
    
    // Look for export button
    await expect(page.locator('button:has-text("Export Skills")').first()).toBeVisible()
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download')
    await page.locator('button:has-text("Export Skills")').first().click()
    
    // Wait for download
    const download = await downloadPromise
    
    // Check download filename
    expect(download.suggestedFilename()).toContain('skills')
    expect(download.suggestedFilename()).toMatch(/\.(json|csv)$/)
  })
})

test.describe('3D Skill Visualization Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page)
    await setupTestUserWithSkills(page)
  })

  test('should interact with 3D skill graph', async ({ page }) => {
    await page.goto('/visualization/3d/skills')
    
    // Wait for 3D graph to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Give time for 3D rendering
    
    // Check for canvas element (3D graph)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    
    // Test mouse interactions
    const box = await canvas.boundingBox()
    if (box) {
      // Simulate rotation
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2)
      await page.mouse.up()
      
      // Simulate zoom
      await page.mouse.wheel(0, -100)
      await page.waitForTimeout(500)
      await page.mouse.wheel(0, 100)
    }
    
    // Check for node labels
    await expect(page.locator('text=JavaScript')).toBeVisible()
    await expect(page.locator('text=React')).toBeVisible()
    
    // Check for relationship lines (edges)
    await expect(page.locator('[data-testid="skill-edge"]').first()).toBeVisible()
  })

  test('should show skill details on node click', async ({ page }) => {
    await page.goto('/visualization/3d/skills')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Click on a skill node
    await page.locator('text=JavaScript').first().click()
    
    // Should show skill details panel
    await expect(page.locator('[data-testid="skill-details-panel"]')).toBeVisible()
    await expect(page.locator('text=JavaScript Details')).toBeVisible()
    await expect(page.locator('text=Proficiency: Expert')).toBeVisible()
    await expect(page.locator('text=Experience: 8 years')).toBeVisible()
    
    // Should show related skills
    await expect(page.locator('text=Related Skills')).toBeVisible()
    await expect(page.locator('text=TypeScript')).toBeVisible()
    await expect(page.locator('text=Node.js')).toBeVisible()
  })
})