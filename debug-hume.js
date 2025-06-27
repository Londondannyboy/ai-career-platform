const puppeteer = require('puppeteer');

async function debugHume() {
  console.log('🔍 Debugging Hume AI integration...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Monitor console for Hume-related messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Hume') || text.includes('API key') || text.includes('WebSocket') || text.includes('EVI') || text.includes('🔑')) {
      console.log(`🔍 ${text}`);
    }
  });
  
  // Mock getUserMedia for the test
  await page.evaluateOnNewDocument(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      console.log('🎤 Mock getUserMedia granted');
      return {
        getTracks: () => [{ kind: 'audio', stop: () => {} }],
        getAudioTracks: () => [{ kind: 'audio', stop: () => {} }],
        active: true
      };
    };
  });
  
  try {
    await page.goto('http://localhost:3000/quest');
    console.log('📄 Page loaded, waiting for JavaScript to execute...');
    
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Page elements loaded');
    
    // Check for Start Quest button and API key issues
    const pageContent = await page.evaluate(() => {
      // Try to access the environment variable like the component does
      const hasApiKey = !!process.env.NEXT_PUBLIC_HUME_API_KEY;
      const apiKeyValue = process.env.NEXT_PUBLIC_HUME_API_KEY;
      
      return {
        hasStartButton: !!document.querySelector('button:contains("Start Quest")') || 
                       !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start Quest')),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent),
        hasApiKey,
        apiKeyValue,
        url: window.location.href
      };
    });
    
    console.log('🔧 Page analysis:', pageContent);
    
    if (pageContent.url.includes('/sign-in')) {
      console.log('🚪 User needs to authenticate first');
    } else {
      console.log('✅ User is authenticated, proceeding with test');
      
      // Try to find and click the Start Quest button
      const startButtons = await page.$$('button');
      let clicked = false;
      
      for (let button of startButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text.includes('Start Quest')) {
          console.log('🖱️ Found and clicking Start Quest button');
          await button.click();
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        console.log('⚠️ Start Quest button not found');
      }
    }
    
    // Wait for any connection attempts
    console.log('⏳ Waiting for connection attempts...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('⏹️ Keeping browser open for manual inspection...');
  await page.waitForTimeout(15000);
  
  await browser.close();
}

debugHume().catch(console.error);