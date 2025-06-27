const puppeteer = require('puppeteer');

async function testLiveDeployment() {
  console.log('🌐 Testing live deployment at https://ai-career-platform.vercel.app/quest');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Monitor console for Hume AI messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Hume') || text.includes('EVI') || text.includes('API') || text.includes('Quest') || text.includes('🔑') || text.includes('⚙️')) {
      console.log(`🌐 Live: ${text}`);
    }
  });
  
  try {
    console.log('📍 Loading live Quest page...');
    await page.goto('https://ai-career-platform.vercel.app/quest', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if we're on the quest page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasQuestTitle: !!document.querySelector('h1') && document.querySelector('h1').textContent.includes('Quest'),
        url: window.location.href,
        buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim()),
        hasStartQuest: !!Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Start Quest'))
      };
    });
    
    console.log('📊 Live page analysis:', pageContent);
    
    if (pageContent.hasStartQuest) {
      console.log('✅ Found Start Quest button on live site');
      
      // Try to click it
      const clicked = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Start Quest'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      
      if (clicked) {
        console.log('🖱️ Clicked Start Quest on live site');
        console.log('⏳ Waiting for Hume AI connection...');
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    } else {
      console.log('⚠️ Start Quest button not found on live site');
    }
    
  } catch (error) {
    console.log(`❌ Live test error: ${error.message}`);
  }
  
  console.log('⏸️ Keeping browser open for manual inspection...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  await browser.close();
}

testLiveDeployment().catch(console.error);