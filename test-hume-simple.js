const puppeteer = require('puppeteer');

async function testHumeIntegration() {
  console.log('🚀 Starting Hume AI integration test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--disable-web-security', '--allow-running-insecure-content']
  });
  
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Hume') || text.includes('EVI') || text.includes('WebSocket') || text.includes('API key')) {
      console.log(`📝 Console: ${text}`);
    }
  });
  
  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Mock microphone permission
  await page.evaluateOnNewDocument(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      console.log('🎤 Mock getUserMedia called');
      return {
        getTracks: () => [{ kind: 'audio', stop: () => {} }],
        getAudioTracks: () => [{ kind: 'audio', stop: () => {} }],
        active: true,
        id: 'mock'
      };
    };
  });
  
  try {
    console.log('📍 Navigating to /quest...');
    await page.goto('http://localhost:3000/quest', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to sign-in
    const currentUrl = page.url();
    if (currentUrl.includes('/sign-in')) {
      console.log('🔐 User not authenticated - redirected to sign-in page');
      console.log('✅ This is expected behavior for unauthenticated users');
      return;
    }
    
    // Check for Quest page elements
    const questTitle = await page.$('h1');
    if (questTitle) {
      const titleText = await page.evaluate(el => el.textContent, questTitle);
      console.log(`📄 Page title: ${titleText}`);
    }
    
    // Look for Start Quest button
    const startButton = await page.$('button:contains("Start Quest")');
    if (startButton) {
      console.log('🟢 Found Start Quest button');
      
      console.log('🖱️ Clicking Start Quest...');
      await startButton.click();
      
      // Wait for connection attempt
      await page.waitForTimeout(5000);
      
    } else {
      console.log('🔍 Start Quest button not found, looking for alternative...');
      
      // Try to find any button with "Quest" in it
      const buttons = await page.$$('button');
      for (let button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        console.log(`🔘 Found button: "${text}"`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
  
  console.log('⏸️ Keeping browser open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('✅ Test completed');
}

// Run the test
testHumeIntegration().catch(console.error);