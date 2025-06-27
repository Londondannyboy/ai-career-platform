const puppeteer = require('puppeteer');

async function testHumeLive() {
  console.log('🚀 Testing Hume AI with real credentials...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--disable-web-security']
  });
  
  const page = await browser.newPage();
  
  // Monitor all console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log(`🖥️ Console: ${text}`);
  });
  
  // Monitor page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  // Mock getUserMedia
  await page.evaluateOnNewDocument(() => {
    navigator.mediaDevices.getUserMedia = async () => ({
      getTracks: () => [{ kind: 'audio', stop: () => {} }],
      getAudioTracks: () => [{ kind: 'audio', stop: () => {} }],
      active: true
    });
  });
  
  try {
    console.log('📍 Loading /quest with real credentials...');
    await page.goto('http://localhost:3000/quest', { timeout: 15000 });
    
    // Wait for page load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if authenticated
    const url = page.url();
    if (url.includes('/sign-in')) {
      console.log('🔐 Redirected to sign-in - authentication required');
      return;
    }
    
    console.log('✅ Page loaded, looking for Start Quest button...');
    
    // Find and click Start Quest button
    const startButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(btn => btn.textContent.includes('Start Quest'));
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    });
    
    if (startButton) {
      console.log('🖱️ Clicked Start Quest button');
      
      // Wait for connection attempt and capture detailed logs
      console.log('⏳ Waiting for Hume AI connection...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } else {
      console.log('❌ Start Quest button not found');
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
  }
  
  console.log('🛑 Keeping browser open for inspection...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  await browser.close();
}

testHumeLive().catch(console.error);