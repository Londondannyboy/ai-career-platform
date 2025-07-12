// BROWSER CONSOLE TEST FOR EXPERIENCE SAVE
// Instructions:
// 1. Open https://ai-career-platform.vercel.app/repo/edit in your browser
// 2. Log in if needed
// 3. Open browser console (F12)
// 4. Paste and run this code

console.log('🧪 Testing Experience Save Functionality\n');

// Monitor network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (url.includes('/api/deep-repo')) {
    console.log('📤 API Call:', args[0], args[1]?.method || 'GET');
    
    return originalFetch.apply(this, args).then(response => {
      console.log('📥 API Response:', response.status, response.statusText);
      
      // Clone response to read body
      const cloned = response.clone();
      cloned.json().then(data => {
        console.log('📥 Response data:', data);
      }).catch(() => {
        cloned.text().then(text => {
          console.log('📥 Response text:', text);
        });
      });
      
      return response;
    });
  }
  return originalFetch.apply(this, args);
};

console.log('✅ Network monitoring active');
console.log('\n📋 Now manually test:');
console.log('1. Click "Experience" tab');
console.log('2. Click "Add Experience"');
console.log('3. Fill in: Title="Test Engineer", Company="Test Co"');
console.log('4. Click "Add Experience" button in the form');
console.log('5. Click "Save Surface Repository"');
console.log('\n👀 Watch this console for API calls...');