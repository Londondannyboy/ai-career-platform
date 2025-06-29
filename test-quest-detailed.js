const puppeteer = require('puppeteer');

async function testQuestDetailed() {
  console.log('🎯 Detailed Quest Voice Testing with Hardcoded Config...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
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
    console.log('1️⃣ Loading Quest page...');
    
    // More detailed console logging
    const allConsoleMessages = [];
    page.on('console', msg => {
      const message = `${msg.type().toUpperCase()}: ${msg.text()}`;
      allConsoleMessages.push(message);
      console.log(`   📋 ${message}`);
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      console.log(`   🚨 PAGE ERROR: ${error.message}`);
      allConsoleMessages.push(`PAGE ERROR: ${error.message}`);
    });
    
    // Capture failed requests
    page.on('requestfailed', request => {
      console.log(`   ❌ REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
      allConsoleMessages.push(`REQUEST FAILED: ${request.url()}`);
    });
    
    await page.goto('https://ai-career-platform.vercel.app/quest', { 
      waitUntil: 'networkidle2',
      timeout: 45000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✅ Quest page loaded');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-detailed-initial-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\n2️⃣ Testing microphone access capability...');
    
    // Test microphone access directly
    const micTest = await page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tracks = stream.getTracks();
        stream.getTracks().forEach(track => track.stop());
        return { 
          success: true, 
          tracks: tracks.length,
          message: 'Microphone access successful'
        };
      } catch (error) {
        return { 
          success: false, 
          error: error.name + ': ' + error.message,
          message: 'Microphone access failed'
        };
      }
    });
    
    console.log(`   Microphone test: ${micTest.success ? '✅' : '❌'} - ${micTest.message}`);
    if (micTest.success) {
      console.log(`   Audio tracks available: ${micTest.tracks}`);
    } else {
      console.log(`   Error: ${micTest.error}`);
    }
    
    console.log('\n3️⃣ Clicking Start Quest and monitoring WebSocket...');
    
    const button = await page.$('button');
    if (button) {
      const buttonText = await button.evaluate(el => el.textContent);
      console.log(`   Found button: "${buttonText}"`);
      
      if (buttonText.includes('Start')) {
        console.log('   🎯 Clicking Start Quest...');
        await button.click();
        
        // Wait longer to see all the connection attempts
        console.log('   ⏳ Waiting 10 seconds to observe connection behavior...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Take screenshot after clicking
        await page.screenshot({ 
          path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-detailed-after-click-${Date.now()}.png`,
          fullPage: true 
        });
        
        console.log('\n4️⃣ Analyzing connection sequence...');
        
        // Filter messages by type
        const connectionMessages = allConsoleMessages.filter(msg => 
          msg.includes('Connecting') || 
          msg.includes('Connected') ||
          msg.includes('WebSocket') ||
          msg.includes('microphone') ||
          msg.includes('HUME') ||
          msg.includes('EVI')
        );
        
        const errorMessages = allConsoleMessages.filter(msg => 
          msg.includes('ERROR') || 
          msg.includes('Failed') ||
          msg.includes('failed')
        );
        
        console.log('   🔗 Connection-related messages:');
        connectionMessages.forEach(msg => console.log(`     ${msg}`));
        
        if (errorMessages.length > 0) {
          console.log('\n   🚨 Error messages:');
          errorMessages.forEach(msg => console.log(`     ${msg}`));
        }
        
        // Check current page state
        const finalState = await page.evaluate(() => {
          return {
            pageText: document.body.textContent.substring(0, 500),
            hasErrorMessages: document.body.textContent.includes('error') || 
                             document.body.textContent.includes('failed'),
            statusText: (() => {
              const statusElements = document.querySelectorAll('*');
              for (let elem of statusElements) {
                if (elem.textContent.includes('Status') || 
                    elem.textContent.includes('Connected') || 
                    elem.textContent.includes('Offline')) {
                  return elem.textContent;
                }
              }
              return 'No status found';
            })()
          };
        });
        
        console.log(`\n   📄 Page status: ${finalState.statusText}`);
        console.log(`   🔍 Has error messages: ${finalState.hasErrorMessages ? 'YES' : 'NO'}`);
      }
    }
    
    console.log('\n🎯 DETAILED VOICE TEST SUMMARY');
    console.log('===============================');
    
    if (micTest.success) {
      console.log('✅ Browser microphone access: WORKING');
    } else {
      console.log('❌ Browser microphone access: FAILED');
    }
    
    const hasCredentialSuccess = allConsoleMessages.some(msg => 
      msg.includes('configId: 8f16326f') && msg.includes('string')
    );
    
    if (hasCredentialSuccess) {
      console.log('✅ Hardcoded config ID: WORKING');
    } else {
      console.log('❌ Hardcoded config ID: NOT DETECTED');
    }
    
    const microphoneRequestSeen = allConsoleMessages.some(msg => 
      msg.includes('Requesting microphone')
    );
    
    if (microphoneRequestSeen) {
      console.log('✅ Microphone request initiated: YES');
    } else {
      console.log('❌ Microphone request initiated: NO');
    }
    
    console.log('\n📱 Next Steps:');
    console.log('1. Hardcoded config ID successfully bypasses environment variable issue');
    console.log('2. Need to investigate WebSocket connection after microphone request');
    console.log('3. May need to check Hume AI API credentials or WebSocket URL format');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testQuestDetailed().catch(console.error);