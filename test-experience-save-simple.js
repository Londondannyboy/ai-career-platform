const puppeteer = require('puppeteer');

// Simple test for experience save at /repo/edit
async function testExperienceSave() {
  console.log('🧪 Testing Experience Save at /repo/edit\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser so you can see what's happening
    slowMo: 100 // Slow down actions so they're visible
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/deep-repo') && request.method() === 'POST') {
        console.log('📤 Save API called:', request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/deep-repo') && response.request().method() === 'POST') {
        console.log('📥 Save API response:', response.status());
      }
    });
    
    console.log('1. Going to /repo/edit on production...');
    await page.goto('https://ai-career-platform.vercel.app/repo/edit', { 
      waitUntil: 'networkidle0' 
    });
    
    // Check if redirected to sign-in
    if (page.url().includes('/sign-in')) {
      console.log('\n❌ FAIL: Redirected to sign-in page');
      console.log('   You need to be logged in to test this feature');
      console.log('\n📋 Manual Test Instructions:');
      console.log('   1. Log in to the app');
      console.log('   2. Go to /repo/edit');
      console.log('   3. Click "Experience" section');
      console.log('   4. Add an experience');
      console.log('   5. Click "Save Surface Repository"');
      console.log('   6. Check browser console for errors');
      console.log('   7. Refresh and see if data persisted');
      return;
    }
    
    // Wait a bit for page to fully load
    await page.waitFor(2000);
    
    console.log('2. Clicking Experience section...');
    // Try different selectors
    const experienceButton = await page.$('button:has-text("Experience")') || 
                            await page.$('text=Experience') ||
                            await page.$('button[data-testid="experience-tab"]');
    
    if (!experienceButton) {
      console.log('❌ Could not find Experience button');
      console.log('   Taking screenshot...');
      await page.screenshot({ path: 'experience-button-not-found.png' });
      return;
    }
    
    await experienceButton.click();
    await page.waitFor(1000);
    
    console.log('3. Looking for Add Experience button...');
    const addButton = await page.$('button:has-text("Add Experience")') ||
                     await page.$('text=Add Experience');
    
    if (!addButton) {
      console.log('❌ Could not find Add Experience button');
      await page.screenshot({ path: 'add-experience-not-found.png' });
      return;
    }
    
    await addButton.click();
    await page.waitFor(500);
    
    console.log('4. Filling out form...');
    // Type in the form fields
    await page.type('input[placeholder*="Job Title"]', 'Test Engineer ' + Date.now());
    await page.type('input[placeholder*="Company"]', 'Test Company');
    
    console.log('5. Looking for inner Add Experience button...');
    // Find the button inside the form
    const submitButton = await page.$$eval('button', buttons => {
      const button = buttons.find(b => b.textContent?.includes('Add Experience'));
      if (button) button.click();
      return !!button;
    });
    
    if (!submitButton) {
      console.log('❌ Could not find submit button');
      return;
    }
    
    await page.waitFor(1000);
    
    console.log('6. Looking for Save button...');
    const saveButton = await page.$('button:has-text("Save Surface Repository")');
    
    if (!saveButton) {
      console.log('❌ Could not find Save button');
      await page.screenshot({ path: 'save-button-not-found.png' });
      return;
    }
    
    console.log('7. Clicking Save...');
    await saveButton.click();
    
    // Wait for potential API call
    await page.waitFor(3000);
    
    console.log('8. Checking if save worked...');
    console.log('   Check the browser window and console for any errors');
    console.log('   The page will stay open for 10 seconds...');
    
    await page.waitFor(10000);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete - check the output above');
  }
}

// Run the test
testExperienceSave();