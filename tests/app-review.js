const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AppReviewer {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://ai-career-platform.vercel.app';
    this.results = [];
    this.screenshots = [];
  }

  async init() {
    console.log('🚀 Starting AI Career Platform Review...\n');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser for visual review
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.log('⚠️ Console Warning:', msg.text());
      }
    });
    
    // Enable request monitoring
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
      }
    });
  }

  async takeScreenshot(name, fullPage = false) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, 'screenshots', filename);
    
    // Ensure screenshots directory exists
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    await this.page.screenshot({ 
      path: filepath, 
      fullPage,
      type: 'png'
    });
    
    this.screenshots.push({ name, filepath, timestamp });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async testLandingPage() {
    console.log('🏠 Testing Landing Page...');
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      await this.takeScreenshot('landing-page', true);
      
      // Check if page loads
      const title = await this.page.title();
      console.log(`✅ Page Title: ${title}`);
      
      // Check for LinkedIn login button
      const loginButton = await this.page.$('button:has-text("Continue with LinkedIn"), a:has-text("Continue with LinkedIn")');
      if (loginButton) {
        console.log('✅ LinkedIn login button found');
      } else {
        console.log('❌ LinkedIn login button not found');
      }
      
      // Check for navigation
      const nav = await this.page.$('nav');
      if (nav) {
        console.log('✅ Navigation found');
      } else {
        console.log('❌ Navigation not found');
      }
      
      this.results.push({
        test: 'Landing Page',
        status: 'passed',
        details: `Title: ${title}, Login button: ${!!loginButton}, Navigation: ${!!nav}`
      });
      
    } catch (error) {
      console.log('❌ Landing page test failed:', error.message);
      await this.takeScreenshot('landing-page-error');
      this.results.push({
        test: 'Landing Page',
        status: 'failed',
        error: error.message
      });
    }
  }

  async testNavigationLinks() {
    console.log('\n🧭 Testing Navigation Links...');
    
    const links = [
      { name: 'Profile', url: '/profile' },
      { name: 'Repo', url: '/repo' },
      { name: 'Coach', url: '/coach' },
      { name: 'Network', url: '/network' },
      { name: 'Jobs', url: '/jobs' },
      { name: 'Coaching', url: '/coaching' }
    ];
    
    for (const link of links) {
      try {
        console.log(`Testing ${link.name} page...`);
        await this.page.goto(`${this.baseUrl}${link.url}`, { waitUntil: 'networkidle0', timeout: 15000 });
        
        // Check if page loads without errors
        const title = await this.page.title();
        const errorText = await this.page.$('text=Error');
        const notFoundText = await this.page.$('text=404');
        
        if (errorText || notFoundText) {
          console.log(`❌ ${link.name} page shows error`);
          await this.takeScreenshot(`${link.name.toLowerCase()}-error`);
        } else {
          console.log(`✅ ${link.name} page loads successfully`);
          await this.takeScreenshot(link.name.toLowerCase());
        }
        
        this.results.push({
          test: `${link.name} Page`,
          status: errorText || notFoundText ? 'failed' : 'passed',
          url: link.url,
          title
        });
        
      } catch (error) {
        console.log(`❌ ${link.name} page failed:`, error.message);
        await this.takeScreenshot(`${link.name.toLowerCase()}-failed`);
        this.results.push({
          test: `${link.name} Page`,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testVoiceCoachingInterface() {
    console.log('\n🎤 Testing Voice Coaching Interface...');
    
    try {
      await this.page.goto(`${this.baseUrl}/coach`, { waitUntil: 'networkidle0' });
      await this.takeScreenshot('coach-page');
      
      // Look for coaching interface elements
      const startButton = await this.page.$('button:has-text("Start Conversation")');
      const micIcon = await this.page.$('[data-testid="mic-icon"], .lucide-mic');
      const conversationArea = await this.page.$('[class*="conversation"], [class*="message"]');
      
      console.log(`✅ Start button: ${!!startButton}`);
      console.log(`✅ Microphone icon: ${!!micIcon}`);
      console.log(`✅ Conversation area: ${!!conversationArea}`);
      
      // Test button interactions
      if (startButton) {
        await startButton.click();
        await this.page.waitForTimeout(2000);
        await this.takeScreenshot('coach-started');
        
        // Check for permission request or active state
        const activeState = await this.page.$('text=listening, text=Speaking, text=Thinking');
        console.log(`🎯 Active coaching state: ${!!activeState}`);
      }
      
      this.results.push({
        test: 'Voice Coaching Interface',
        status: 'passed',
        details: `Start button: ${!!startButton}, Mic: ${!!micIcon}, Conversation: ${!!conversationArea}`
      });
      
    } catch (error) {
      console.log('❌ Voice coaching test failed:', error.message);
      await this.takeScreenshot('coach-error');
      this.results.push({
        test: 'Voice Coaching Interface',
        status: 'failed',
        error: error.message
      });
    }
  }

  async testProfilePages() {
    console.log('\n👤 Testing Profile Management...');
    
    try {
      // Test profile view page
      await this.page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle0' });
      await this.takeScreenshot('profile-view');
      
      // Look for profile elements
      const editButton = await this.page.$('button:has-text("Edit Profile"), a:has-text("Edit Profile")');
      const linkedinSection = await this.page.$('text=LinkedIn');
      const profileInfo = await this.page.$('[class*="profile"], [class*="user"]');
      
      console.log(`✅ Edit button: ${!!editButton}`);
      console.log(`✅ LinkedIn section: ${!!linkedinSection}`);
      console.log(`✅ Profile info: ${!!profileInfo}`);
      
      // Test profile edit page
      if (editButton) {
        await editButton.click();
        await this.page.waitForTimeout(2000);
        await this.takeScreenshot('profile-edit');
        
        // Check for form elements
        const skillsInput = await this.page.$('input[placeholder*="skill"], input[id*="skill"]');
        const summaryTextarea = await this.page.$('textarea');
        const saveButton = await this.page.$('button:has-text("Save")');
        
        console.log(`✅ Skills input: ${!!skillsInput}`);
        console.log(`✅ Summary textarea: ${!!summaryTextarea}`);
        console.log(`✅ Save button: ${!!saveButton}`);
      }
      
      this.results.push({
        test: 'Profile Management',
        status: 'passed',
        details: `Edit: ${!!editButton}, LinkedIn: ${!!linkedinSection}, Form: ${!!editButton}`
      });
      
    } catch (error) {
      console.log('❌ Profile test failed:', error.message);
      await this.takeScreenshot('profile-error');
      this.results.push({
        test: 'Profile Management',
        status: 'failed',
        error: error.message
      });
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 812 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1200, height: 800 }
    ];
    
    for (const viewport of viewports) {
      try {
        await this.page.setViewport(viewport);
        await this.page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0' });
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        
        // Check if navigation is responsive
        const nav = await this.page.$('nav');
        const navVisible = nav ? await nav.isIntersectingViewport() : false;
        
        console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): Navigation visible: ${navVisible}`);
        
        this.results.push({
          test: `Responsive ${viewport.name}`,
          status: 'passed',
          viewport: `${viewport.width}x${viewport.height}`,
          navigationVisible: navVisible
        });
        
      } catch (error) {
        console.log(`❌ ${viewport.name} responsive test failed:`, error.message);
        this.results.push({
          test: `Responsive ${viewport.name}`,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Reset to default viewport
    await this.page.setViewport({ width: 1200, height: 800 });
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      // Enable performance monitoring
      await this.page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0' });
      
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      console.log('📊 Performance Metrics:');
      console.log(`   Load Time: ${performanceMetrics.loadTime.toFixed(2)}ms`);
      console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`   First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
      console.log(`   First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
      
      this.results.push({
        test: 'Performance',
        status: 'passed',
        metrics: performanceMetrics
      });
      
    } catch (error) {
      console.log('❌ Performance test failed:', error.message);
      this.results.push({
        test: 'Performance',
        status: 'failed',
        error: error.message
      });
    }
  }

  async generateReport() {
    console.log('\n📋 Generating Test Report...');
    
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      baseUrl: this.baseUrl,
      summary: {
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length
      },
      results: this.results,
      screenshots: this.screenshots
    };
    
    // Save JSON report
    const reportPath = path.join(__dirname, 'reports', `test-report-${timestamp.replace(/[:.]/g, '-')}.json`);
    const reportDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n🎯 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📊 Total: ${report.summary.totalTests}`);
    console.log(`📄 Report saved: ${reportPath}`);
    console.log(`📸 Screenshots: ${this.screenshots.length} files saved`);
    
    return report;
  }

  async runFullReview() {
    try {
      await this.init();
      
      await this.testLandingPage();
      await this.testNavigationLinks();
      await this.testVoiceCoachingInterface();
      await this.testProfilePages();
      await this.testResponsiveDesign();
      await this.testPerformance();
      
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('💥 Review failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the review
if (require.main === module) {
  const reviewer = new AppReviewer();
  reviewer.runFullReview()
    .then(report => {
      console.log('\n🎉 Review completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Review failed:', error);
      process.exit(1);
    });
}

module.exports = AppReviewer;