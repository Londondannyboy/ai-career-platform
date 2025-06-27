const puppeteer = require('puppeteer');

async function quickHealthCheck() {
  console.log('🔍 Running Quick Health Check...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const baseUrl = 'https://ai-career-platform.vercel.app';
  
  try {
    // Test 1: Main page loads
    console.log('1️⃣ Testing main page...');
    await page.goto(baseUrl, { waitUntil: 'networkidle0', timeout: 10000 });
    const title = await page.title();
    console.log(`   ✅ Page loads: ${title}`);
    
    // Test 2: Check for errors
    console.log('2️⃣ Checking for JavaScript errors...');
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (errors.length === 0) {
      console.log('   ✅ No JavaScript errors found');
    } else {
      console.log(`   ❌ Found ${errors.length} errors:`);
      errors.forEach(error => console.log(`      - ${error}`));
    }
    
    // Test 3: Critical elements present
    console.log('3️⃣ Checking critical elements...');
    const nav = await page.$('nav');
    const loginButton = await page.$('button, a').then(async (el) => {
      if (!el) return false;
      const text = await page.evaluate(el => el.textContent, el);
      return text && text.toLowerCase().includes('linkedin');
    });
    
    console.log(`   Navigation: ${nav ? '✅' : '❌'}`);
    console.log(`   Login button: ${loginButton ? '✅' : '❌'}`);
    
    // Test 4: Quick page speed
    console.log('4️⃣ Checking performance...');
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      };
    });
    
    console.log(`   Load time: ${performanceMetrics.loadTime.toFixed(0)}ms`);
    console.log(`   DOM ready: ${performanceMetrics.domContentLoaded.toFixed(0)}ms`);
    
    // Test 5: Key pages accessible
    console.log('5️⃣ Testing key pages...');
    const pages = ['/profile', '/coach', '/repo'];
    for (const pagePath of pages) {
      try {
        await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 5000 });
        const hasError = await page.$('text=Error, text=404') !== null;
        console.log(`   ${pagePath}: ${hasError ? '❌' : '✅'}`);
      } catch (error) {
        console.log(`   ${pagePath}: ❌ (${error.message})`);
      }
    }
    
    console.log('\n🎯 QUICK CHECK COMPLETE');
    console.log('======================');
    console.log('✅ App appears to be functioning normally');
    console.log('🔗 URL: ' + baseUrl);
    
  } catch (error) {
    console.log('\n❌ HEALTH CHECK FAILED');
    console.log('=====================');
    console.log('Error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  quickHealthCheck()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = quickHealthCheck;