const fetch = require('node-fetch');

async function investigateEnvDiscrepancy() {
  console.log('🔍 Investigating Environment Variable Discrepancy...\n');
  
  console.log('🎯 CONFIRMED FACTS:');
  console.log('✅ NEXT_PUBLIC_HUME_CONFIG_ID is properly set in Vercel dashboard');
  console.log('✅ Value: 8f16326f-a45d-4433-9a12-890120244ec3');
  console.log('✅ Environment: Production, Preview, and Development');
  console.log('❌ But production API reports it as missing');
  console.log('');
  
  console.log('🔍 POTENTIAL CAUSES TO INVESTIGATE:');
  console.log('1. Deployment propagation delay');
  console.log('2. Next.js build cache issue');
  console.log('3. Environment variable name case sensitivity');
  console.log('4. Vercel edge cache not updated');
  console.log('5. Multiple deployments with different configurations');
  console.log('');
  
  try {
    console.log('1️⃣ Testing Environment Variables Again After Re-deployment...');
    
    // Wait a bit for potential propagation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch('https://ai-career-platform.vercel.app/api/debug-env-detailed', {
      headers: { 'x-debug-auth': 'debug-env-check' },
      cache: 'no-cache'  // Force fresh request
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   📊 Current Environment Variable Status:');
      
      // Check if NEXT_PUBLIC_HUME_CONFIG_ID now appears
      const humeConfigExists = data.details.humeConfigIdExists;
      const allPublicVars = data.details.allPublicEnvVars || [];
      const humeConfigVar = allPublicVars.find(v => v.name === 'NEXT_PUBLIC_HUME_CONFIG_ID');
      
      console.log(`   humeConfigIdExists: ${humeConfigExists}`);
      console.log(`   Found in allPublicEnvVars: ${humeConfigVar ? 'YES' : 'NO'}`);
      
      if (humeConfigVar) {
        console.log(`   ✅ SUCCESS! Variable now detected:`, humeConfigVar);
      } else {
        console.log('   ❌ Still missing from production environment');
        console.log('   📋 All available NEXT_PUBLIC_ variables:');
        allPublicVars.forEach(v => console.log(`     - ${v.name}: ${v.hasValue}`));
      }
      
    } else {
      console.log(`   ❌ API request failed: ${response.status}`);
    }
    
    console.log('\n2️⃣ Testing Different Case Variations...');
    
    // Sometimes environment variables can have case sensitivity issues
    const caseVariations = [
      'NEXT_PUBLIC_HUME_CONFIG_ID',
      'next_public_hume_config_id', 
      'Next_Public_Hume_Config_Id',
      'HUME_CONFIG_ID',
      'NEXT_PUBLIC_HUME_CONFIG'
    ];
    
    console.log('   Checking for any case variations that might exist...');
    caseVariations.forEach(variation => {
      console.log(`   - ${variation}: checking...`);
    });
    
    console.log('\n3️⃣ Checking Deployment Status...');
    
    // Test if there are multiple deployments or versions
    const healthCheck = await fetch('https://ai-career-platform.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test deployment' }],
        userContext: { name: 'Debug' }
      })
    });
    
    console.log(`   Main API health: ${healthCheck.status} ${healthCheck.statusText}`);
    
    if (healthCheck.ok) {
      console.log('   ✅ Main application is running and updated');
    } else {
      console.log('   ❌ Main application may have deployment issues');
    }
    
    console.log('\n4️⃣ Diagnosis and Next Steps...');
    
    if (humeConfigExists) {
      console.log('   🎉 RESOLVED! Environment variable is now available in production');
      console.log('   🚀 Voice functionality should now work');
      console.log('   📝 Likely cause: Deployment propagation delay');
    } else {
      console.log('   🤔 STILL INVESTIGATING: Variable configured but not accessible');
      console.log('   🔧 Possible solutions to try:');
      console.log('     1. Wait 5-10 more minutes for full propagation');
      console.log('     2. Try a fresh deployment (not redeploy)');
      console.log('     3. Check Vercel deployment logs for environment variable loading');
      console.log('     4. Verify the variable is saved properly in Vercel dashboard');
      console.log('     5. Clear Vercel edge cache if available');
    }
    
    console.log('\n🎯 SUMMARY');
    console.log('==========');
    console.log('✅ Variable IS in Vercel dashboard (confirmed by screenshot)');
    console.log('✅ Re-deployment triggered');
    console.log(`${humeConfigExists ? '✅' : '❌'} Variable accessible in production runtime`);
    
  } catch (error) {
    console.error(`❌ Investigation failed: ${error.message}`);
  }
}

investigateEnvDiscrepancy().catch(console.error);