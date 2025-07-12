#!/usr/bin/env node

// Simple health check for Quest - no complex testing framework needed!

const http = require('http');

console.log('🏥 Quest Health Check\n');

// Check if dev server is running
const checkDevServer = () => {
  return new Promise((resolve) => {
    http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200 || res.statusCode === 307) {
        console.log('✅ Dev server is running at http://localhost:3000');
        resolve(true);
      } else {
        console.log('❌ Dev server returned status:', res.statusCode);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Dev server is not running');
      console.log('   Run: npm run dev');
      resolve(false);
    });
  });
};

// Check important pages
const checkPages = async () => {
  const pages = [
    { path: '/', name: 'Home page' },
    { path: '/repo/edit', name: 'Repo editor' },
    { path: '/visualization', name: 'Visualization dashboard' },
    { path: '/api/health', name: 'API health check' }
  ];

  console.log('\n📄 Checking pages:');
  
  for (const page of pages) {
    await new Promise((resolve) => {
      http.get(`http://localhost:3000${page.path}`, (res) => {
        // 200 = OK, 307 = Redirect (for auth), 404 = Not Found
        if (res.statusCode === 200 || res.statusCode === 307) {
          console.log(`   ✅ ${page.name} - OK`);
        } else if (res.statusCode === 404) {
          console.log(`   ❌ ${page.name} - Not Found`);
        } else {
          console.log(`   ⚠️  ${page.name} - Status ${res.statusCode}`);
        }
        resolve();
      }).on('error', () => {
        console.log(`   ❌ ${page.name} - Error`);
        resolve();
      });
    });
  }
};

// Main check
const runHealthCheck = async () => {
  const serverOk = await checkDevServer();
  
  if (serverOk) {
    await checkPages();
    
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Use SIMPLE_TEST_CHECKLIST.md to test features');
    console.log('3. If you see auth redirects (307), that\'s normal - just log in');
  } else {
    console.log('\n❌ Please start the dev server first with: npm run dev');
  }
  
  console.log('\n✨ For manual testing, see SIMPLE_TEST_CHECKLIST.md');
};

runHealthCheck();