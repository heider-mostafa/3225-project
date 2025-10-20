/**
 * Debug script to test API routes accessibility
 * Run this in browser console to check if routes are working
 */

async function debugAPIRoutes() {
  console.log('🔍 Testing API Route Accessibility...\n');
  
  const routes = [
    '/api/verification/send-phone-otp',
    '/api/verification/verify-phone-otp',
    '/api/verification/send-email-otp',
    '/api/verification/verify-email-otp',
    '/api/verification/validate-cso',
    '/api/verification/validate-ntra',
    '/api/verification/initiate',
    '/api/verification/webhook'
  ];
  
  for (const route of routes) {
    try {
      console.log(`Testing ${route}...`);
      
      // Test with OPTIONS request first (should always work)
      const optionsResponse = await fetch(route, { 
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`  OPTIONS: ${optionsResponse.status} ${optionsResponse.statusText}`);
      
      // Test with POST request (will likely fail due to auth/validation, but shouldn't be 404)
      const postResponse = await fetch(route, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      console.log(`  POST: ${postResponse.status} ${postResponse.statusText}`);
      
      if (postResponse.status === 404) {
        console.log(`  ❌ Route not found: ${route}`);
      } else if (postResponse.status === 401) {
        console.log(`  ✅ Route exists but requires authentication: ${route}`);
      } else if (postResponse.status === 400) {
        console.log(`  ✅ Route exists but has validation errors: ${route}`);
      } else {
        console.log(`  ✅ Route accessible: ${route}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Network error for ${route}:`, error.message);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function testSpecificRoute() {
  console.log('🧪 Testing send-phone-otp route specifically...\n');
  
  try {
    const response = await fetch('/api/verification/send-phone-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: '+201234567890',
        appraiser_id: 'test-id'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 404) {
      console.log('\n❌ 404 Error - This means the API route file is not being recognized by Next.js');
      console.log('Possible solutions:');
      console.log('1. Restart the development server (npm run dev)');
      console.log('2. Check if the route.ts file is in the correct location');
      console.log('3. Check for TypeScript compilation errors');
      console.log('4. Verify Next.js is configured correctly');
    } else if (response.status === 401) {
      console.log('\n✅ Route exists! The 401 error means authentication is required');
      console.log('You need to be logged in to test this endpoint');
    } else if (response.status === 400) {
      console.log('\n✅ Route exists! The 400 error means validation failed');
      console.log('The endpoint is working but requires valid data');
    }
    
  } catch (error) {
    console.log('❌ Network error:', error);
  }
}

async function checkAuthStatus() {
  console.log('🔐 Checking authentication status...\n');
  
  try {
    // Check if we have auth tokens
    const authToken = localStorage.getItem('supabase.auth.token');
    console.log('Auth token exists:', !!authToken);
    
    // Try to get current user session
    const response = await fetch('/api/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('User API status:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('Current user:', userData);
    } else {
      console.log('Not authenticated or user API not available');
    }
    
  } catch (error) {
    console.log('Error checking auth:', error);
  }
}

// Export functions for console use
window.debugAPIRoutes = debugAPIRoutes;
window.testSpecificRoute = testSpecificRoute;
window.checkAuthStatus = checkAuthStatus;

console.log('🚀 Debug functions loaded! Run these in console:');
console.log('- debugAPIRoutes() - Test all verification routes');
console.log('- testSpecificRoute() - Test the phone OTP route specifically');
console.log('- checkAuthStatus() - Check if you are authenticated');