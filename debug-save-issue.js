// Debug script to test save functionality
// Run this in browser console at /repo/edit

console.log('🔍 Debugging Experience Save\n');

// 1. Check what data is in React state
const checkReactState = () => {
  // Find React fiber
  const element = document.querySelector('[class*="container"]');
  if (!element) {
    console.log('❌ Could not find React element');
    return;
  }
  
  const reactFiber = element._reactInternalFiber || 
                    element.__reactInternalFiber ||
                    Object.keys(element).find(key => key.startsWith('__reactFiber'));
  
  if (reactFiber) {
    console.log('✅ Found React fiber:', reactFiber);
  }
};

// 2. Monitor all fetch calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  console.log('\n📤 API Call:', {
    url,
    method: options?.method || 'GET',
    headers: options?.headers,
    body: options?.body ? JSON.parse(options.body) : undefined
  });
  
  return originalFetch.apply(this, args).then(response => {
    const cloned = response.clone();
    cloned.json().then(data => {
      console.log('📥 Response:', {
        status: response.status,
        data
      });
    }).catch(() => {
      cloned.text().then(text => {
        console.log('📥 Response:', {
          status: response.status,
          text
        });
      });
    });
    
    return response;
  }).catch(error => {
    console.error('❌ Fetch error:', error);
    throw error;
  });
};

// 3. Try to trigger save programmatically
const triggerSave = () => {
  console.log('\n🔧 Attempting to trigger save...');
  
  // Find save button
  const saveButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => btn.textContent.includes('Save Surface Repository')
  );
  
  if (saveButtons.length > 0) {
    console.log('✅ Found save button, clicking...');
    saveButtons[0].click();
  } else {
    console.log('❌ Could not find save button');
  }
};

// 4. Check localStorage for any cached data
const checkLocalStorage = () => {
  console.log('\n💾 Checking localStorage:');
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('profile') || key.includes('repo') || key.includes('user')) {
      console.log(`  ${key}:`, localStorage.getItem(key));
    }
  });
};

// 5. Simple test to add data
const testAddExperience = () => {
  console.log('\n🧪 Test: Adding experience manually');
  
  // Find experience button
  const expButton = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent === 'Experience'
  );
  
  if (expButton) {
    expButton.click();
    console.log('✅ Clicked Experience tab');
    
    setTimeout(() => {
      // Find Add Experience button
      const addButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent.includes('Add Experience')
      );
      
      if (addButton) {
        addButton.click();
        console.log('✅ Clicked Add Experience');
        
        setTimeout(() => {
          // Fill fields
          const titleInput = document.querySelector('input[placeholder*="Job Title"]');
          const companyInput = document.querySelector('input[placeholder*="Company"]');
          
          if (titleInput && companyInput) {
            titleInput.value = 'Test Engineer ' + Date.now();
            titleInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            companyInput.value = 'Test Company';
            companyInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            console.log('✅ Filled form fields');
            
            // Find the inner Add Experience button
            setTimeout(() => {
              const submitButtons = Array.from(document.querySelectorAll('button')).filter(
                btn => btn.textContent === 'Add Experience' && 
                       btn.closest('.bg-gray-800') // Inside the form card
              );
              
              if (submitButtons.length > 0) {
                submitButtons[0].click();
                console.log('✅ Clicked submit button');
              }
            }, 500);
          }
        }, 500);
      }
    }, 500);
  }
};

console.log('📋 Available commands:');
console.log('  checkReactState() - Check React component state');
console.log('  triggerSave() - Click the save button');
console.log('  checkLocalStorage() - Check cached data');
console.log('  testAddExperience() - Automatically add test experience');
console.log('\n👀 Fetch monitoring is active - try saving manually');

// Make functions global
window.debugTools = {
  checkReactState,
  triggerSave,
  checkLocalStorage,
  testAddExperience
};