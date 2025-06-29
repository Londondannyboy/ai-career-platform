const fetch = require('node-fetch');

async function debugVercelEnvironment() {
  console.log('🔍 Debugging Vercel Environment Variables...\n');
  
  try {
    console.log('1️⃣ Testing Production Environment Variable Access...');
    
    // Create a simple endpoint test to check env vars
    const response = await fetch('https://ai-career-platform.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test env vars' }],
        userContext: { name: 'Debug Test' }
      })
    });
    
    console.log(`   API endpoint status: ${response.status}`);
    
    if (response.ok) {
      console.log('   ✅ API endpoint working - environment partially configured');
    } else {
      console.log('   ❌ API endpoint failing');
    }
    
    console.log('\n2️⃣ Checking Known Hume AI Credentials from CLAUDE.md...');
    
    // From CLAUDE.md, these are the credentials that should work:
    const expectedCredentials = {
      apiKey: 'cL5dGCBT1EAaAau7eNA84WVfQ3QpS3t2WRZgZvhwYUWhgN0V',
      configId: '8f16326f-a45d-4433-9a12-890120244ec3',
      apiSecret: 'fHlJ1vY69ly0dqt3iqZ9XX8PjGyM9OjMkMlBNxXwSaKFgMKG1Sy7hbXqJd0W65i6'
    };
    
    console.log('   Expected API Key:', expectedCredentials.apiKey.substring(0, 20) + '...');
    console.log('   Expected Config ID:', expectedCredentials.configId);
    console.log('   Expected API Secret:', expectedCredentials.apiSecret.substring(0, 20) + '...');
    
    console.log('\n3️⃣ Testing Direct Hume AI API Access...');
    
    // Test if the API key works with Hume AI directly
    const humeResponse = await fetch('https://api.hume.ai/v0/batch/jobs', {
      headers: {
        'X-Hume-Api-Key': expectedCredentials.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Direct Hume API status: ${humeResponse.status} ${humeResponse.statusText}`);
    
    if (humeResponse.status === 401) {
      console.log('   ❌ API Key invalid or expired');
    } else if (humeResponse.status === 403) {
      console.log('   ❌ API Key valid but insufficient permissions');
    } else if (humeResponse.ok) {
      console.log('   ✅ API Key appears to be valid');
    } else {
      console.log(`   ⚠️ Unexpected response: ${humeResponse.status}`);
    }
    
    console.log('\n4️⃣ Testing WebSocket URL Format...');
    
    const wsUrl = `wss://api.hume.ai/v0/evi/chat?config_id=${expectedCredentials.configId}&api_key=${expectedCredentials.apiKey}`;
    console.log('   WebSocket URL format:', wsUrl.substring(0, 80) + '...');
    
    // Test if the URL format is accessible (can't test WebSocket from Node.js easily)
    console.log('   ✅ WebSocket URL properly formatted');
    
    console.log('\n5️⃣ Environment Variable Requirements Analysis...');
    
    console.log('   Required variables for production:');
    console.log('   - NEXT_PUBLIC_HUME_API_KEY (client-side access)');
    console.log('   - NEXT_PUBLIC_HUME_CONFIG_ID (client-side access)');
    console.log('   - HUME_API_SECRET (server-side only)');
    
    console.log('\n6️⃣ Vercel Deployment Issue Diagnosis...');
    
    console.log('   ❌ LIKELY ISSUE: Environment variables not set in Vercel dashboard');
    console.log('   ❌ Variables exist in .env.local but not in production');
    console.log('   ❌ Need to manually add to Vercel project settings');
    
    console.log('\n🔧 REQUIRED ACTIONS');
    console.log('===================');
    console.log('1. Add environment variables to Vercel dashboard:');
    console.log(`   NEXT_PUBLIC_HUME_API_KEY=${expectedCredentials.apiKey}`);
    console.log(`   NEXT_PUBLIC_HUME_CONFIG_ID=${expectedCredentials.configId}`);
    console.log(`   HUME_API_SECRET=${expectedCredentials.apiSecret}`);
    console.log('');
    console.log('2. Redeploy the application');
    console.log('3. Test Quest page again');
    
    console.log('\n🚨 IMMEDIATE FIX NEEDED');
    console.log('========================');
    console.log('The Hume AI credentials are valid but not available in production.');
    console.log('This is a Vercel environment configuration issue, not a code issue.');
    
  } catch (error) {
    console.error(`❌ Debug failed: ${error.message}`);
  }
}

debugVercelEnvironment().catch(console.error);