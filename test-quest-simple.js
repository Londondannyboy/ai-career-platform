const puppeteer = require('puppeteer');

async function testQuestWithConfig() {
  console.log('🚀 Testing Quest page with Hume AI config ID...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Monitor console for Hume-related messages
  page.on('console', msg => {
    const text = msg.text();
    console.log(`📱 ${text}`);
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
    console.log('📍 Navigating to Quest page...');
    await page.goto('http://localhost:3000/quest');
    
    // Wait a bit for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Checking page content...');
    const hasQuestTitle = await page.evaluate(() => {
      return document.querySelector('h1') && document.querySelector('h1').textContent.includes('Quest');
    });
    
    if (hasQuestTitle) {
      console.log('✅ Quest page loaded successfully');
      
      // Try to click Start Quest button
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(btn => btn.textContent.includes('Start Quest'));
        if (startBtn) {
          startBtn.click();
          return true;
        }
        return false;
      });
      
      if (clicked) {
        console.log('🖱️ Clicked Start Quest button');
        console.log('⏳ Waiting for connection...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('❌ Start Quest button not found');
      }
    } else {
      console.log('❌ Quest page did not load properly');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('⏸️ Keeping browser open for 15 seconds...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  await browser.close();
}

testQuestWithConfig().catch(console.error);