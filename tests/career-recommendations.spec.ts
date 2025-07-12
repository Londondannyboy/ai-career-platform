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

// Mock user with career history
async function setupTestUserWithCareerData(page: Page) {
  await page.route('/api/deep-repo/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        surface_repo_data: {
          experiences: [
            {
              title: 'Senior Software Engineer',
              company: 'Tech Corp',
              current: true,
              startDate: '2022-01',
              teamSize: 12,
              directReports: 2,
              impact: [
                { description: 'Reduced API latency', metric: '45%' },
                { description: 'Increased test coverage', metric: '80%' }
              ],
              technologies: ['React', 'Node.js', 'AWS'],
              methodologies: ['Agile', 'CI/CD']
            },
            {
              title: 'Software Engineer',
              company: 'StartupXYZ',
              startDate: '2020-03',
              endDate: '2021-12',
              teamSize: 6,
              impact: [
                { description: 'Built payment system', metric: '$2M processed' }
              ]
            },
            {
              title: 'Junior Developer',
              company: 'WebDev Inc',
              startDate: '2018-06',
              endDate: '2020-02',
              teamSize: 4
            }
          ],
          skills: [
            { name: 'JavaScript', proficiency: 'expert', yearsOfExperience: 8 },
            { name: 'React', proficiency: 'advanced', yearsOfExperience: 5 },
            { name: 'Node.js', proficiency: 'advanced', yearsOfExperience: 6 },
            { name: 'Leadership', proficiency: 'intermediate', yearsOfExperience: 2 },
            { name: 'System Design', proficiency: 'intermediate', yearsOfExperience: 3 }
          ],
          education: [
            {
              institution: 'University of Technology',
              degree: 'BS',
              field: 'Computer Science',
              endDate: '2018-05',
              gpa: 3.7
            }
          ]
        },
        personal_repo_data: {
          futureExperiences: [
            {
              title: 'Engineering Manager',
              company: 'Dream Company',
              targetDate: '2026-01',
              desiredSkills: ['Team Leadership', 'Strategic Planning']
            }
          ]
        }
      })
    })
  })
}

test.describe('Career Recommendations Engine', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page)
    await setupTestUserWithCareerData(page)
  })

  test('should display AI insights tab with career analysis', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Wait for page load
    await page.waitForLoadState('networkidle')
    
    // Navigate to AI Insights tab
    await page.locator('button:has-text("AI Insights")').click()
    await page.waitForTimeout(500)
    
    // Check for career analysis overview
    await expect(page.locator('text=Career Analysis')).toBeVisible()
    
    // Check for career velocity metric
    await expect(page.locator('text=Career Velocity')).toBeVisible()
    await expect(page.locator('text=months per promotion')).toBeVisible()
    
    // Check for years of experience
    await expect(page.locator('text=Total Experience')).toBeVisible()
    await expect(page.locator('text=years')).toBeVisible()
    
    // Check for current level assessment
    await expect(page.locator('text=Current Level')).toBeVisible()
    await expect(page.locator('text=Senior')).toBeVisible()
  })

  test('should show 5 types of career recommendations', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Check for all 5 recommendation types
    const recommendationTypes = [
      'Next Role Progression',
      'Skill Gap Analysis',
      'Lateral Move Opportunities',
      'Leadership Transition',
      'Specialization Paths'
    ]
    
    for (const type of recommendationTypes) {
      await expect(page.locator(`text=${type}`)).toBeVisible()
    }
    
    // Check for recommendation cards
    const recommendationCards = page.locator('[data-testid="recommendation-card"]')
    await expect(recommendationCards).toHaveCount(5)
  })

  test('should display detailed next role progression', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Click on Next Role Progression card
    await page.locator('text=Next Role Progression').click()
    await page.waitForTimeout(500)
    
    // Should show detailed recommendation
    await expect(page.locator('text=Staff Software Engineer')).toBeVisible()
    await expect(page.locator('text=Timeline: 12-18 months')).toBeVisible()
    await expect(page.locator('text=Confidence: High')).toBeVisible()
    
    // Should show required skills
    await expect(page.locator('text=Required Skills')).toBeVisible()
    await expect(page.locator('text=System Architecture')).toBeVisible()
    await expect(page.locator('text=Cross-team Collaboration')).toBeVisible()
    
    // Should show action items
    await expect(page.locator('text=Action Items')).toBeVisible()
    await expect(page.locator('text=Lead a cross-functional project')).toBeVisible()
    await expect(page.locator('text=Mentor junior engineers')).toBeVisible()
  })

  test('should analyze skill gaps for future goals', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Click on Skill Gap Analysis
    await page.locator('text=Skill Gap Analysis').click()
    await page.waitForTimeout(500)
    
    // Should show gap analysis for Engineering Manager goal
    await expect(page.locator('text=Gap Analysis: Engineering Manager')).toBeVisible()
    
    // Should show missing skills
    await expect(page.locator('text=Missing Skills')).toBeVisible()
    await expect(page.locator('text=Team Leadership')).toBeVisible()
    await expect(page.locator('text=Strategic Planning')).toBeVisible()
    await expect(page.locator('text=Budget Management')).toBeVisible()
    
    // Should show skill development plan
    await expect(page.locator('text=Development Plan')).toBeVisible()
    await expect(page.locator('text=Take leadership courses')).toBeVisible()
    await expect(page.locator('text=Lead team meetings')).toBeVisible()
  })

  test('should suggest lateral career moves', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Click on Lateral Move Opportunities
    await page.locator('text=Lateral Move Opportunities').click()
    await page.waitForTimeout(500)
    
    // Should show lateral move options
    await expect(page.locator('text=DevOps Engineer')).toBeVisible()
    await expect(page.locator('text=Technical Product Manager')).toBeVisible()
    await expect(page.locator('text=Solutions Architect')).toBeVisible()
    
    // Each option should show transferable skills
    await expect(page.locator('text=Transferable Skills')).toBeVisible()
    await expect(page.locator('text=System Design')).toBeVisible()
    await expect(page.locator('text=Problem Solving')).toBeVisible()
  })

  test('should provide leadership transition guidance', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Click on Leadership Transition
    await page.locator('text=Leadership Transition').click()
    await page.waitForTimeout(500)
    
    // Should show leadership readiness assessment
    await expect(page.locator('text=Leadership Readiness')).toBeVisible()
    await expect(page.locator('text=70%')).toBeVisible() // Readiness score
    
    // Should show current leadership experience
    await expect(page.locator('text=Current Experience')).toBeVisible()
    await expect(page.locator('text=2 direct reports')).toBeVisible()
    
    // Should show recommended next steps
    await expect(page.locator('text=Next Steps')).toBeVisible()
    await expect(page.locator('text=Increase team size to 5-7')).toBeVisible()
    await expect(page.locator('text=Take on project management')).toBeVisible()
  })

  test('should suggest specialization paths', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Click on Specialization Paths
    await page.locator('text=Specialization Paths').click()
    await page.waitForTimeout(500)
    
    // Should show specialization options based on skills
    await expect(page.locator('text=Frontend Architecture Specialist')).toBeVisible()
    await expect(page.locator('text=Full-Stack Principal Engineer')).toBeVisible()
    await expect(page.locator('text=Cloud Solutions Expert')).toBeVisible()
    
    // Each path should show requirements
    await expect(page.locator('text=Requirements')).toBeVisible()
    await expect(page.locator('text=Deep expertise in React ecosystem')).toBeVisible()
  })

  test('should show career trajectory visualization', async ({ page }) => {
    await page.goto('/visualization/3d/career-trajectory')
    
    // Wait for 3D visualization to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Check for canvas (3D visualization)
    await expect(page.locator('canvas')).toBeVisible()
    
    // Check for timeline markers
    await expect(page.locator('text=2018')).toBeVisible() // Start year
    await expect(page.locator('text=2025')).toBeVisible() // Current year
    await expect(page.locator('text=2026')).toBeVisible() // Future goal
    
    // Check for experience nodes
    await expect(page.locator('text=Junior Developer')).toBeVisible()
    await expect(page.locator('text=Software Engineer')).toBeVisible()
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible()
    
    // Check for future experience (different color)
    await expect(page.locator('[data-future="true"]')).toBeVisible()
  })

  test('should export career recommendations', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Look for export button
    await expect(page.locator('button:has-text("Export Recommendations")').first()).toBeVisible()
    
    // Set up download promise
    const downloadPromise = page.waitForEvent('download')
    await page.locator('button:has-text("Export Recommendations")').first().click()
    
    // Wait for download
    const download = await downloadPromise
    
    // Check filename
    expect(download.suggestedFilename()).toContain('career-recommendations')
    expect(download.suggestedFilename()).toMatch(/\.(pdf|json)$/)
  })

  test('should update recommendations based on profile changes', async ({ page }) => {
    await page.goto('/profile/test-user')
    
    // Navigate to AI Insights
    await page.locator('button:has-text("AI Insights")').click()
    
    // Note current recommendations
    const initialRecommendation = await page.locator('[data-testid="primary-recommendation"]').textContent()
    
    // Go to edit profile
    await page.goto('/repo/edit')
    
    // Add a new skill
    await page.locator('button:has-text("Skills")').click()
    await page.locator('button:has-text("Add Skill")').click()
    await page.fill('input[placeholder="Skill name"]', 'Kubernetes')
    await page.selectOption('select[name="proficiency"]', 'intermediate')
    await page.locator('button:has-text("Save")').click()
    
    // Go back to recommendations
    await page.goto('/profile/test-user')
    await page.locator('button:has-text("AI Insights")').click()
    
    // Check if recommendations updated
    await expect(page.locator('text=Recommendations updated')).toBeVisible()
    
    // DevOps path should now be more prominent
    await expect(page.locator('text=DevOps Engineer').first()).toBeVisible()
  })
})

test.describe('Career Recommendations Error Handling', () => {
  test('should handle users with no experience gracefully', async ({ page }) => {
    await mockAuthentication(page)
    
    // Mock user with no experience
    await page.route('/api/deep-repo/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          surface_repo_data: {
            experiences: [],
            skills: [{ name: 'Python', proficiency: 'beginner' }],
            education: []
          }
        })
      })
    })
    
    await page.goto('/profile/test-user')
    await page.locator('button:has-text("AI Insights")').click()
    
    // Should show entry-level recommendations
    await expect(page.locator('text=Entry-Level Recommendations')).toBeVisible()
    await expect(page.locator('text=Junior Developer')).toBeVisible()
    await expect(page.locator('text=Intern')).toBeVisible()
    
    // Should focus on learning
    await expect(page.locator('text=Focus on building foundational skills')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    await mockAuthentication(page)
    
    // Mock API error
    await page.route('/api/career-recommendations', async route => {
      await route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      })
    })
    
    await page.goto('/profile/test-user')
    await page.locator('button:has-text("AI Insights")').click()
    
    // Should show error state
    await expect(page.locator('text=Unable to generate recommendations')).toBeVisible()
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()
  })
})