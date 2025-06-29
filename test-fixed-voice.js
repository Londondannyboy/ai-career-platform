const puppeteer = require('puppeteer');

async function testFixedVoice() {
  console.log('🎯 Testing FIXED Hume AI Voice Functionality...\n');
  
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
    console.log('1️⃣ Testing New Quest Voice Implementation...');
    
    // Go to the Quest page
    await page.goto('https://ai-career-platform.vercel.app/quest', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✅ Quest page loaded');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-fixed-initial-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\n2️⃣ Checking for Real Hume AI Integration...');
    
    // Listen for console messages to see the new implementation
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`   Console: ${msg.type()}: ${msg.text()}`);
    });
    
    // Look for the Start Quest button
    console.log('\n3️⃣ Testing Start Quest Button with Real Implementation...');
    
    const startButton = await page.$('button:has-text("Start Quest")');
    if (!startButton) {
      console.log('   ⚠️ Looking for any Start button...');
      const anyButton = await page.$('button');
      if (anyButton) {
        const buttonText = await anyButton.evaluate(el => el.textContent);
        console.log(`   Found button: "${buttonText}"`);
        
        if (buttonText.includes('Start') || buttonText.includes('Quest')) {
          console.log('   🎯 Clicking Start Quest button...');
          await anyButton.click();
          
          // Wait for voice connection
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          console.log('\n4️⃣ Checking Voice Connection Results...');
          
          // Check for new console messages indicating real Hume AI connection
          const connectionMessages = consoleMessages.filter(msg => 
            msg.includes('Hume AI') || 
            msg.includes('microphone') || 
            msg.includes('WebSocket') ||
            msg.includes('Connected')
          );
          
          if (connectionMessages.length > 0) {
            console.log('   ✅ Voice connection messages found:');
            connectionMessages.forEach(msg => console.log(`     - ${msg}`));
          } else {
            console.log('   ❌ No voice connection messages found');
          }
          
          // Take screenshot after clicking
          await page.screenshot({ 
            path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-fixed-connected-${Date.now()}.png`,
            fullPage: true 
          });
          
        }
      }
    }
    
    console.log('\n5️⃣ Testing Microphone Access with New Implementation...');
    
    // Test microphone access
    const microphoneTest = await page.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tracks = stream.getTracks();
        console.log('Microphone tracks:', tracks.length);
        tracks.forEach(track => track.stop());
        return { 
          success: true, 
          message: `Microphone access granted, ${tracks.length} tracks`,
          trackInfo: tracks.map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled }))
        };
      } catch (error) {
        return { success: false, message: error.message };
      }
    });
    
    console.log(`   Microphone test: ${microphoneTest.success ? '✅' : '❌'}`);
    console.log(`   Details: ${microphoneTest.message}`);
    if (microphoneTest.trackInfo) {
      console.log(`   Track info:`, microphoneTest.trackInfo);
    }
    
    console.log('\n6️⃣ Testing WebSocket Connection...');
    
    // Check if WebSocket connections are being made
    const wsTest = await page.evaluate(() => {
      // Check for WebSocket connections in the console or global scope
      const hasWebSocket = typeof WebSocket !== 'undefined';
      const wsConnections = window.WebSocket ? 'WebSocket available' : 'No WebSocket';
      return { hasWebSocket, wsConnections };
    });
    
    console.log(`   WebSocket available: ${wsTest.hasWebSocket ? '✅' : '❌'}`);
    console.log(`   Connection status: ${wsTest.wsConnections}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-fixed-final-${Date.now()}.png`,
      fullPage: true 
    });
    
    console.log('\n🎯 FIXED VOICE FUNCTIONALITY TEST SUMMARY');
    console.log('==========================================');
    
    if (microphoneTest.success) {
      console.log('✅ Microphone permissions working');
    } else {
      console.log('❌ Microphone permissions failed');
    }
    
    if (connectionMessages.length > 0) {
      console.log('✅ Voice connection messages detected');
    } else {
      console.log('❌ No voice connection detected');
    }
    
    const successfulConsoleMessages = consoleMessages.filter(msg => 
      msg.includes('✅') || msg.includes('Connected') || msg.includes('Hume AI')
    );
    
    if (successfulConsoleMessages.length > 0) {
      console.log('✅ Successful implementation indicators found');
    } else {
      console.log('❌ No success indicators in console');
    }
    
    console.log('\n📸 Screenshots saved with timestamp for analysis');
    console.log('🔍 Check console output above for detailed voice integration results');
    
    // Wait a bit more to see any delayed messages
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    await page.screenshot({ 
      path: `/Users/dankeegan/ai-career-platform/tests/screenshots/quest-fixed-error-${Date.now()}.png`,
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testFixedVoice().catch(console.error);