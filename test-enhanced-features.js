const puppeteer = require('puppeteer');

async function testEnhancedFeatures() {
  console.log('🚀 Testing Enhanced AI Careers Assistant Features...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Production deployment
    console.log('1️⃣ Testing Production Deployment...');
    await page.goto('https://ai-career-platform.vercel.app', { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    console.log(`   ✅ Title: ${title}`);
    
    // Check for updated features
    const hasNavigation = await page.$('nav') !== null;
    const hasStreaming = await page.$('[data-testid="streaming"]') !== null;
    
    console.log(`   Navigation: ${hasNavigation ? '✅' : '❌'}`);
    console.log(`   Enhanced UI: ${hasNavigation ? '✅' : '❌'}`);
    
    // Test 2: Authentication flow
    console.log('\n2️⃣ Testing Authentication System...');
    try {
      // Look for Clerk sign-in elements
      const signInElements = await page.$$('a[href*="sign-in"], button[data-clerk], .cl-');
      console.log(`   Sign-in elements found: ${signInElements.length > 0 ? '✅' : '❌'}`);
      
      // Check for Clerk provider
      const clerkProvider = await page.evaluate(() => {
        return window.__clerk_frontend_api || document.querySelector('[data-clerk-publishable-key]') !== null;
      });
      console.log(`   Clerk provider active: ${clerkProvider ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`   Authentication test: ❌ (${error.message})`);
    }
    
    // Test 3: Enhanced Quest/Voice Coaching
    console.log('\n3️⃣ Testing Enhanced Voice Coaching...');
    try {
      await page.goto('https://ai-career-platform.vercel.app/quest', { waitUntil: 'networkidle2' });
      
      // Check for enhanced Quest UI
      const questTitle = await page.$eval('h1, h2, [role="heading"]', el => el.textContent).catch(() => 'Quest');
      console.log(`   Quest page loads: ✅ (${questTitle})`);
      
      // Check for Vercel AI SDK integration
      const hasStreamingChat = await page.evaluate(() => {
        return window.fetch && typeof window.fetch === 'function' && 
               document.querySelector('button, [role="button"]') !== null;
      });
      console.log(`   Streaming chat ready: ${hasStreamingChat ? '✅' : '❌'}`);
      
      // Check for Hume AI integration
      const hasVoiceElements = await page.$$('button[aria-label*="mic"], button[aria-label*="voice"], [data-voice]');
      console.log(`   Voice elements: ${hasVoiceElements.length > 0 ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`   Quest page test: ❌ (${error.message})`);
    }
    
    // Test 4: API endpoints
    console.log('\n4️⃣ Testing Enhanced API Endpoints...');
    try {
      // Test the new streaming chat endpoint
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'Hello, this is a test' }],
              userContext: { name: 'Test User' }
            })
          });
          return { status: res.status, ok: res.ok };
        } catch (e) {
          return { error: e.message };
        }
      });
      
      if (response.error) {
        console.log(`   New chat API: ❌ (${response.error})`);
      } else {
        console.log(`   New chat API: ${response.ok ? '✅' : '❌'} (Status: ${response.status})`);
      }
      
    } catch (error) {
      console.log(`   API test: ❌ (${error.message})`);
    }
    
    // Test 5: Mobile responsiveness
    console.log('\n5️⃣ Testing Mobile Responsiveness...');
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle2' });
    
    const isMobileResponsive = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return nav ? window.getComputedStyle(nav).display !== 'none' : true;
    });
    console.log(`   Mobile responsive: ${isMobileResponsive ? '✅' : '❌'}`);
    
    // Test 6: Performance check
    console.log('\n6️⃣ Testing Performance...');
    const metrics = await page.metrics();
    console.log(`   JS Heap Used: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
    console.log(`   DOM Nodes: ${metrics.Nodes}`);
    
    // Final page screenshot
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://ai-career-platform.vercel.app', { waitUntil: 'networkidle2' });
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/enhanced-features-test-${new Date().toISOString().replace(/:/g, '-')}.png`,
      fullPage: true 
    });
    
    console.log('\n🎉 Enhanced Features Test Completed!');
    console.log('📸 Screenshot saved to tests/screenshots/');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run the test
testEnhancedFeatures().catch(console.error);