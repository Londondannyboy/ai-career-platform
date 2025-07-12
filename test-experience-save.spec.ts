import { test, expect } from '@playwright/test'

test.describe('Experience Save Test', () => {
  test('should save experience at /repo/edit', async ({ page }) => {
    // Test on production URL
    const baseUrl = 'https://ai-career-platform.vercel.app'
    
    console.log('1. Going to repo/edit page...')
    await page.goto(`${baseUrl}/repo/edit`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if redirected to login
    if (page.url().includes('/sign-in')) {
      console.log('❌ FAIL: Redirected to sign-in page - need authentication')
      console.log('   This test needs to run with a logged-in user')
      return
    }
    
    // Click on Experience tab
    console.log('2. Clicking Experience tab...')
    const experienceTab = page.locator('button:has-text("Experience")')
    await experienceTab.click()
    await page.waitForTimeout(1000)
    
    // Click Add Experience
    console.log('3. Clicking Add Experience...')
    const addButton = page.locator('button:has-text("Add Experience")')
    await addButton.click()
    await page.waitForTimeout(500)
    
    // Fill in the form
    console.log('4. Filling experience form...')
    const timestamp = new Date().toISOString()
    const testData = {
      title: `Test Engineer ${timestamp}`,
      company: 'Test Company',
      teamSize: '10',
      directReports: '2'
    }
    
    await page.fill('input[placeholder="Job Title"]', testData.title)
    await page.fill('input[placeholder="Company"]', testData.company)
    
    // Look for team size field (new rich data)
    const teamSizeField = page.locator('input[name="teamSize"]')
    if (await teamSizeField.isVisible()) {
      await teamSizeField.fill(testData.teamSize)
      console.log('   ✓ Found team size field (rich data)')
    }
    
    // Monitor network for save request
    console.log('5. Setting up network monitoring...')
    const saveRequestPromise = page.waitForRequest(req => 
      req.url().includes('/api/deep-repo') && 
      req.method() === 'POST'
    )
    
    const saveResponsePromise = page.waitForResponse(res => 
      res.url().includes('/api/deep-repo') && 
      res.request().method() === 'POST'
    )
    
    // Click Save
    console.log('6. Clicking Save button...')
    const saveButton = page.locator('button:has-text("Save")').last()
    await saveButton.click()
    
    // Wait for API call
    console.log('7. Waiting for API response...')
    try {
      const [request, response] = await Promise.all([
        saveRequestPromise,
        saveResponsePromise
      ]).catch(() => [null, null])
      
      if (!request || !response) {
        console.log('❌ FAIL: No API request detected when saving')
        throw new Error('Save API call not made')
      }
      
      console.log(`   API Request: ${request.method()} ${request.url()}`)
      console.log(`   API Response: ${response.status()}`)
      
      if (response.status() !== 200) {
        console.log('❌ FAIL: API returned error status')
        const body = await response.text()
        console.log('   Error:', body)
        throw new Error(`API error: ${response.status()}`)
      }
      
      console.log('   ✓ API call successful')
      
    } catch (error) {
      console.log('❌ FAIL: Save request failed')
      throw error
    }
    
    // Refresh page to check persistence
    console.log('8. Refreshing page to check persistence...')
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Go back to Experience tab
    await page.locator('button:has-text("Experience")').click()
    await page.waitForTimeout(1000)
    
    // Check if our test data is there
    console.log('9. Checking if data persisted...')
    const savedTitle = page.locator(`text="${testData.title}"`)
    const savedCompany = page.locator(`text="${testData.company}"`)
    
    try {
      await expect(savedTitle).toBeVisible({ timeout: 5000 })
      await expect(savedCompany).toBeVisible({ timeout: 5000 })
      console.log('✅ PASS: Experience was saved and persisted!')
      
    } catch (error) {
      console.log('❌ FAIL: Experience was NOT saved')
      console.log('   Could not find the test data after refresh')
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'experience-save-fail.png' })
      console.log('   Screenshot saved: experience-save-fail.png')
      
      throw new Error('Experience not persisted after save')
    }
  })
})