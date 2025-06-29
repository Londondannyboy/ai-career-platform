const puppeteer = require('puppeteer');

async function testVoiceAfterFix() {
  console.log('🎯 Testing Voice Functionality After Environment Variable Fix...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--disable-web-security'
    ]
  });
  
  const page = await browser.newPage();
  
  // Grant microphone permissions
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://ai-career-platform.vercel.app', ['microphone']);
  
  try {
    console.log('1️⃣ Loading Quest page after environment fix...');
    
    await page.goto('https://ai-career-platform.vercel.app/quest', { 
      waitUntil: 'networkidle2',
      timeout: 45000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('   ✅ Quest page loaded');
    
    // Capture console messages to see if we get different error messages
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      console.log(`   Console: ${message}`);
    });
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-after-env-fix-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\n2️⃣ Checking for authentication status...');
    
    // Check if we can see the Quest interface
    const pageContent = await page.evaluate(() => {
      return {
        hasAuthPrompt: document.body.textContent.includes('Sign in') || document.body.textContent.includes('Sign up'),
        hasQuestTitle: document.body.textContent.includes('Quest'),
        hasStartButton: document.body.textContent.includes('Start Quest'),
        hasStatus: document.body.textContent.includes('Status'),
        hasOfflineStatus: document.body.textContent.includes('Offline'),
        hasConnectedStatus: document.body.textContent.includes('Connected'),
        currentPageText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log(`   Authentication needed: ${pageContent.hasAuthPrompt ? '❌' : '✅'}`);
    console.log(`   Quest interface visible: ${pageContent.hasQuestTitle ? '✅' : '❌'}`);
    console.log(`   Start button present: ${pageContent.hasStartButton ? '✅' : '❌'}`);
    console.log(`   Status indicator: ${pageContent.hasStatus ? '✅' : '❌'}`);
    console.log(`   Offline status: ${pageContent.hasOfflineStatus ? '❌ (still offline)' : '✅ (not offline)'}`);
    console.log(`   Connected status: ${pageContent.hasConnectedStatus ? '✅ (connected!)' : '❌ (not connected)'}`);
    
    if (pageContent.hasAuthPrompt) {
      console.log('\n   ⚠️ User needs to authenticate first to test voice functionality');
      console.log('   💡 The environment variable fix won\'t be testable until user signs in');
    } else if (pageContent.hasStartButton) {
      console.log('\n3️⃣ Testing Start Quest button with potentially fixed environment...');
      
      // Look for and click the Start Quest button
      const startButton = await page.$('button');
      if (startButton) {
        const buttonText = await startButton.evaluate(el => el.textContent);
        console.log(`   Found button: "${buttonText}"`);
        
        if (buttonText.includes('Start') || buttonText.includes('Quest')) {
          console.log('   🎯 Clicking Start Quest button...');
          await startButton.click();
          
          // Wait for potential connection and check for new messages
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          console.log('\n4️⃣ Checking for improved error messages...');
          
          // Look for different error patterns
          const errorMessages = consoleMessages.filter(msg => 
            msg.includes('error') || msg.includes('Error') || msg.includes('failed') || msg.includes('Failed')
          );
          
          const successMessages = consoleMessages.filter(msg => 
            msg.includes('Connected') || msg.includes('✅') || msg.includes('success') || 
            msg.includes('Hume AI') || msg.includes('WebSocket') || msg.includes('microphone')
          );
          
          console.log(`   Error messages found: ${errorMessages.length}`);
          if (errorMessages.length > 0) {
            errorMessages.forEach(msg => console.log(`     - ${msg}`));
          }
          
          console.log(`   Success messages found: ${successMessages.length}`);
          if (successMessages.length > 0) {
            successMessages.forEach(msg => console.log(`     + ${msg}`));
          }
          
          // Check if the error message changed
          const credentialErrors = consoleMessages.filter(msg => 
            msg.includes('credentials not found') || msg.includes('Hume AI credentials')
          );
          
          if (credentialErrors.length > 0) {
            console.log('   ❌ Still getting credential errors:');
            credentialErrors.forEach(msg => console.log(`     - ${msg}`));
          } else {
            console.log('   ✅ No credential errors detected - environment fix may be working!');
          }
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-after-fix-final-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\n🎯 POST-FIX TEST SUMMARY');
    console.log('=========================');
    
    const hasCredentialErrors = consoleMessages.some(msg => 
      msg.includes('credentials not found') || msg.includes('Hume AI credentials')
    );
    
    if (!hasCredentialErrors) {
      console.log('✅ Environment variable fix appears successful - no credential errors!');
    } else {
      console.log('❌ Still experiencing credential errors - may need more investigation');
    }
    
    if (pageContent.hasAuthPrompt) {
      console.log('⚠️ Cannot fully test until user authenticates');
    } else {
      console.log('✅ Ready for authenticated voice testing');
    }
    
    console.log('\n📸 Screenshots saved with -after-env-fix suffix');
    console.log('🔍 Check console output above for detailed analysis');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-after-fix-error-${Date.now()}.png`,
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testVoiceAfterFix().catch(console.error);