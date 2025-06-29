const puppeteer = require('puppeteer');

async function debugQuestVoice() {
  console.log('🔍 Debugging Quest Voice Functionality...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',  // Allow microphone access
      '--use-fake-device-for-media-stream',
      '--disable-web-security',
      '--allow-running-insecure-content'
    ]
  });
  
  const page = await browser.newPage();
  
  // Grant microphone permissions
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://ai-career-platform.vercel.app', ['microphone']);
  
  try {
    console.log('1️⃣ Testing Quest Page Authentication Flow...');
    
    // Go to the Quest page directly
    await page.goto('https://ai-career-platform.vercel.app/quest', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load and take screenshot
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✅ Quest page loaded');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-debug-initial-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\n2️⃣ Checking Page Elements...');
    
    // Check for key elements
    const title = await page.$eval('h1', el => el.textContent).catch(() => 'No title found');
    console.log(`   Page title: ${title}`);
    
    const startButton = await page.$('button');
    console.log(`   Start Quest button found: ${startButton ? '✅' : '❌'}`);
    
    // Check for status indicators
    const statusElements = await page.$$eval('*', 
      elements => elements.filter(el => 
        el.className && (el.className.includes('status') || el.textContent.includes('Status'))
      ).map(el => el.textContent)
    ).catch(() => ['No status elements found']);
    console.log(`   Status elements: ${statusElements.join(', ')}`);
    
    console.log('\n3️⃣ Testing Console Messages and Errors...');
    
    // Listen for console messages
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`   Console: ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`   ❌ Page Error: ${error.message}`);
    });
    
    console.log('\n4️⃣ Testing Microphone Permissions...');
    
    // Test microphone access
    const microphoneAccess = await page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return { success: true, message: 'Microphone access granted' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    });
    
    console.log(`   Microphone access: ${microphoneAccess.success ? '✅' : '❌'} (${microphoneAccess.message})`);
    
    console.log('\n5️⃣ Testing Start Quest Button...');
    
    // Look for any start button with various selectors
    const buttonSelectors = [
      'button[aria-label*="start"]',
      '.start-button',
      'button.primary',
      '.quest-start',
      'button'  // Last resort - any button
    ];
    
    let foundButton = null;
    for (const selector of buttonSelectors) {
      try {
        foundButton = await page.$(selector);
        if (foundButton) {
          const buttonText = await foundButton.evaluate(el => el.textContent);
          console.log(`   Found button with selector "${selector}": "${buttonText}"`);
          break;
        }
      } catch (e) {
        // Selector not valid, continue
      }
    }
    
    if (foundButton) {
      console.log('   Attempting to click Start Quest button...');
      await foundButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for changes after clicking
      const postClickStatus = await page.evaluate(() => {
        const statusElements = document.querySelectorAll('[data-testid*="status"], .status, [class*="status"]');
        return Array.from(statusElements).map(el => el.textContent);
      });
      console.log(`   Post-click status: ${postClickStatus.join(', ')}`);
      
    } else {
      console.log('   ❌ No Start Quest button found');
    }
    
    console.log('\n6️⃣ Testing Hume AI Integration...');
    
    // Check for Hume AI specific elements and functions
    const humeStatus = await page.evaluate(() => {
      // Check if Hume AI scripts/functions are loaded
      const hasHumeGlobals = typeof window.hume !== 'undefined';
      const hasVoiceProvider = document.querySelector('[data-hume], [class*="hume"], [data-voice]') !== null;
      const hasAudioElements = document.querySelector('audio, [data-audio]') !== null;
      
      return {
        humeGlobals: hasHumeGlobals,
        voiceProvider: hasVoiceProvider,
        audioElements: hasAudioElements,
        userAgent: navigator.userAgent.includes('Chrome')
      };
    });
    
    console.log(`   Hume globals: ${humeStatus.humeGlobals ? '✅' : '❌'}`);
    console.log(`   Voice provider: ${humeStatus.voiceProvider ? '✅' : '❌'}`);
    console.log(`   Audio elements: ${humeStatus.audioElements ? '✅' : '❌'}`);
    console.log(`   Chrome browser: ${humeStatus.userAgent ? '✅' : '❌'}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-debug-final-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\n7️⃣ Summary of Issues Found...');
    
    if (errors.length > 0) {
      console.log('   ❌ JavaScript Errors:');
      errors.forEach(error => console.log(`     - ${error}`));
    }
    
    if (!microphoneAccess.success) {
      console.log('   ❌ Microphone access denied');
    }
    
    if (!foundButton) {
      console.log('   ❌ Start Quest button not accessible');
    }
    
    console.log('\n📸 Screenshots saved to tests/screenshots/');
    console.log('🔍 Debug completed - check console output above for issues');
    
  } catch (error) {
    console.error(`❌ Debug test failed: ${error.message}`);
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-debug-error-${Date.now()}.png`,
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

debugQuestVoice().catch(console.error);