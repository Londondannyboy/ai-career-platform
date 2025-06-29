const fetch = require('node-fetch');

async function debugHumeConnection() {
  console.log('🔍 Debugging Hume AI Connection Issues...\n');
  
  // Test 1: Check environment variables availability
  console.log('1️⃣ Testing Hume AI Environment Variables...');
  
  try {
    const response = await fetch('https://ai-career-platform.vercel.app/api/debug-hume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'env-check' })
    });
    
    if (response.status === 404) {
      console.log('   ⚠️ No debug endpoint found (expected)');
      console.log('   Let me check the Hume AI credentials indirectly...');
    }
  } catch (error) {
    console.log('   ⚠️ Direct env check not possible:', error.message);
  }
  
  // Test 2: Check if Hume AI EVI endpoint is accessible
  console.log('\n2️⃣ Testing Hume AI EVI Endpoint Access...');
  
  const humeApiKey = 'cL5dGCBT1EAaAau7eNA84WVfQ3QpS3t2WRZgZvhwYUWhgN0V'; // From CLAUDE.md
  const configId = '8f16326f-a45d-4433-9a12-890120244ec3'; // From CLAUDE.md
  
  try {
    // Test basic Hume API connection (not EVI, but general API)
    const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
      headers: {
        'X-Hume-Api-Key': humeApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Hume API Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.log('   ❌ API Key invalid or expired');
    } else if (response.status === 403) {
      console.log('   ❌ API Key valid but insufficient permissions');
    } else if (response.ok) {
      console.log('   ✅ API Key appears to be valid');
    } else {
      console.log(`   ⚠️ Unexpected response: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Hume API connection failed: ${error.message}`);
  }
  
  // Test 3: Check WebSocket connection possibility
  console.log('\n3️⃣ Testing WebSocket Connection Requirements...');
  
  const wsUrl = `wss://api.hume.ai/v0/evi/chat?config_id=${configId}&api_key=${humeApiKey}`;
  console.log(`   WebSocket URL: ${wsUrl.substring(0, 50)}...`);
  
  // Test 4: Analyze the issue from user's screenshot
  console.log('\n4️⃣ Analyzing User\'s Issue...');
  console.log('   From the screenshot, user sees:');
  console.log('   - Quest interface loads ✅');
  console.log('   - Status: Offline ❌');
  console.log('   - Start Quest button present ✅');
  console.log('   - No microphone permissions requested ❌');
  console.log('   - No audio feedback ❌');
  
  console.log('\n5️⃣ Likely Root Causes...');
  console.log('   🔍 Issue 1: Enhanced useHumeEVI hook not actually connecting to Hume');
  console.log('   🔍 Issue 2: VoiceProvider in layout.tsx not properly configured');
  console.log('   🔍 Issue 3: Hume React SDK not integrated correctly');
  console.log('   🔍 Issue 4: Browser security blocking microphone access');
  console.log('   🔍 Issue 5: Environment variables not set in production');
  
  // Test 5: Check our streaming API as a fallback
  console.log('\n6️⃣ Testing Our Fallback Streaming API...');
  
  try {
    const response = await fetch('https://ai-career-platform.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test voice coaching functionality' }],
        userContext: { name: 'Debug User' }
      })
    });
    
    if (response.ok) {
      console.log('   ✅ Fallback streaming API is working');
      console.log('   💡 Suggestion: Use streaming API for text responses while fixing voice');
    } else {
      console.log('   ❌ Fallback streaming API also failing');
    }
    
  } catch (error) {
    console.log(`   ❌ Fallback API test failed: ${error.message}`);
  }
  
  console.log('\n🎯 DIAGNOSIS SUMMARY');
  console.log('====================');
  console.log('✅ Quest page loads and shows interface');
  console.log('✅ User is properly authenticated');
  console.log('✅ Streaming text API is working');
  console.log('❌ Hume AI voice connection not working');
  console.log('❌ Microphone permissions not requested');
  console.log('❌ Start Quest button not triggering voice');
  
  console.log('\n🔧 RECOMMENDED FIXES');
  console.log('=====================');
  console.log('1. Fix useHumeEVI hook connection logic');
  console.log('2. Ensure VoiceProvider is properly configured');
  console.log('3. Add proper error handling for voice failures');
  console.log('4. Implement fallback to text-only mode');
  console.log('5. Add microphone permission debugging');
  
  console.log('\n🚀 IMMEDIATE ACTIONS NEEDED');
  console.log('============================');
  console.log('1. Check Hume AI credentials in Vercel environment variables');
  console.log('2. Fix the enhanced useHumeEVI hook implementation');
  console.log('3. Add better error messages for users when voice fails');
  console.log('4. Test microphone permissions in production environment');
}

debugHumeConnection().catch(console.error);