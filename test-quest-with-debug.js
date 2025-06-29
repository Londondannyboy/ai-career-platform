const puppeteer = require('puppeteer');

async function testQuestWithDebug() {
  console.log('🎯 Testing Quest Page with Debug Logging...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('1️⃣ Loading Quest page with debug information...');
    
    // Capture ALL console messages including our debug logs
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      console.log(`   [BROWSER] ${message}`);
    });
    
    await page.goto('https://ai-career-platform.vercel.app/quest', { 
      waitUntil: 'networkidle2',
      timeout: 45000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✅ Quest page loaded');
    
    console.log('\n2️⃣ Looking for authentication and Start Quest button...');
    
    // Check page state
    const pageState = await page.evaluate(() => {
      return {
        hasSignIn: document.body.textContent.includes('Sign in'),
        hasStartQuest: document.body.textContent.includes('Start Quest'),
        hasQuestInterface: document.body.textContent.includes('Quest Conversation')
      };
    });
    
    console.log(`   Has sign in prompt: ${pageState.hasSignIn ? '❌' : '✅'}`);
    console.log(`   Has Start Quest button: ${pageState.hasStartQuest ? '✅' : '❌'}`);
    console.log(`   Has Quest interface: ${pageState.hasQuestInterface ? '✅' : '❌'}`);
    
    if (pageState.hasStartQuest) {
      console.log('\n3️⃣ Clicking Start Quest to trigger debug logging...');
      
      // Find and click the Start Quest button
      const button = await page.$('button');
      if (button) {
        const buttonText = await button.evaluate(el => el.textContent);
        console.log(`   Found button: "${buttonText}"`);
        
        if (buttonText.includes('Start') || buttonText.includes('Quest')) {
          console.log('   🎯 Clicking to trigger environment debug logs...');
          await button.click();
          
          // Wait for debug logs to appear
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          console.log('\n4️⃣ Analyzing debug console output...');
          
          // Filter for our debug messages
          const debugMessages = consoleMessages.filter(msg => 
            msg.includes('ENVIRONMENT DEBUG') || 
            msg.includes('configId:') ||
            msg.includes('Hume AI credentials') ||
            msg.includes('All HUME env vars')
          );
          
          if (debugMessages.length > 0) {
            console.log('   ✅ Found debug messages:');
            debugMessages.forEach(msg => console.log(`     📋 ${msg}`));
          } else {
            console.log('   ❌ No debug messages found');
          }
          
          // Look for specific error patterns
          const errorMessages = consoleMessages.filter(msg => 
            msg.includes('error') || msg.includes('Error') || msg.includes('credentials')
          );
          
          if (errorMessages.length > 0) {
            console.log('\n   🚨 Error messages:');
            errorMessages.forEach(msg => console.log(`     ❌ ${msg}`));
          }
        }
      }
    } else {
      console.log('\n   ⚠️ Cannot test Start Quest - authentication required or button not found');
    }
    
    console.log('\n🎯 QUEST DEBUG TEST SUMMARY');
    console.log('============================');
    
    const hasEnvironmentDebug = consoleMessages.some(msg => 
      msg.includes('ENVIRONMENT DEBUG') || msg.includes('configId:')
    );
    
    if (hasEnvironmentDebug) {
      console.log('✅ Debug logging is working in production');
      console.log('✅ Can see detailed environment variable information');
    } else {
      console.log('❌ Debug logging not triggered or not working');
    }
    
    const relevantMessages = consoleMessages.filter(msg => 
      msg.includes('HUME') || msg.includes('config') || msg.includes('credentials')
    ).slice(0, 10); // Limit output
    
    if (relevantMessages.length > 0) {
      console.log('\n📋 Relevant console messages:');
      relevantMessages.forEach(msg => console.log(`  - ${msg}`));
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testQuestWithDebug().catch(console.error);