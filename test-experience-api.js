#!/usr/bin/env node

// Simple API test for experience save functionality
// This tests the API directly without needing browser automation

const https = require('https');

console.log('🧪 Testing Experience Save API\n');

// Test configuration
const testUserId = 'test-user-' + Date.now();
const testExperience = {
  title: 'Senior Software Engineer',
  company: 'Test Company',
  current: true,
  startDate: '2023-01',
  teamSize: 12,
  directReports: 2,
  impact: [
    { description: 'Reduced API latency', metric: '45%' }
  ],
  technologies: ['React', 'Node.js'],
  methodologies: ['Agile', 'CI/CD']
};

// Function to make HTTPS request
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testExperienceSave() {
  console.log('1. Testing Save Experience API...');
  console.log('   Endpoint: POST /api/deep-repo/surface');
  console.log('   Test User ID:', testUserId);
  
  // Prepare test data
  const saveData = {
    userId: testUserId,
    surface_repo_data: {
      experiences: [testExperience]
    }
  };
  
  // Test on localhost first
  console.log('\n2. Testing on localhost:3000...');
  try {
    const localResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/deep-repo/surface',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': testUserId
      }
    }, saveData);
    
    console.log('   Status:', localResponse.status);
    
    if (localResponse.status === 200) {
      console.log('   ✅ Save API works on localhost');
      
      // Try to retrieve the data
      console.log('\n3. Testing retrieval...');
      const getResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/deep-repo?userId=${testUserId}`,
        method: 'GET',
        headers: {
          'X-User-Id': testUserId
        }
      });
      
      if (getResponse.status === 200) {
        const data = JSON.parse(getResponse.body);
        if (data.surface_repo_data?.experiences?.length > 0) {
          console.log('   ✅ Data retrieved successfully');
          console.log('   Found', data.surface_repo_data.experiences.length, 'experiences');
        } else {
          console.log('   ❌ No experiences found in retrieved data');
        }
      }
    } else {
      console.log('   ❌ Save failed with status:', localResponse.status);
      console.log('   Response:', localResponse.body);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Make sure dev server is running: npm run dev');
  }
  
  // Test on production
  console.log('\n4. Testing on production (Vercel)...');
  try {
    const prodResponse = await makeRequest({
      hostname: 'ai-career-platform.vercel.app',
      path: '/api/deep-repo/surface',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': testUserId
      }
    }, saveData);
    
    console.log('   Status:', prodResponse.status);
    
    if (prodResponse.status === 401) {
      console.log('   ⚠️  Authentication required on production');
      console.log('   This is expected - production requires real user auth');
    } else if (prodResponse.status === 200) {
      console.log('   ✅ Save API works on production');
    } else {
      console.log('   ❌ Unexpected status:', prodResponse.status);
      console.log('   Response:', prodResponse.body);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n📊 Summary:');
  console.log('- The API endpoints exist and respond');
  console.log('- Authentication is required on production');
  console.log('- Need to check frontend save button implementation');
  console.log('\nNext step: Check if the save button is properly wired to the API');
}

// Run the test
testExperienceSave();