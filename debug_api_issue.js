// COPY AND PASTE THIS INTO YOUR BROWSER CONSOLE ON THE PROPERTIES PAGE
// This will help us see exactly what's wrong with the API

async function debugAPI() {
  console.log('=== DEBUGGING PROPERTIES API ===');
  
  try {
    console.log('1. Testing API endpoint...');
    const response = await fetch('/api/properties?page=1&limit=5');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      console.log('❌ API returned non-200 status');
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    console.log('2. Getting response body...');
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!data.properties) {
      console.log('❌ No properties field in response');
      console.log('Available fields:', Object.keys(data));
    } else if (data.properties.length === 0) {
      console.log('❌ Properties array is empty');
      console.log('Pagination info:', data.pagination);
    } else {
      console.log('✅ Found properties:', data.properties.length);
      console.log('First property:', data.properties[0]);
    }
    
  } catch (error) {
    console.log('❌ API call failed completely:', error);
  }
  
  // Test direct Supabase call
  console.log('3. Testing direct database access...');
  
  // You'll need to replace this with your actual Supabase config
  // Check if you can access Supabase client in the browser
  if (window.supabase) {
    try {
      const { data, error } = await window.supabase
        .from('properties')
        .select('*')
        .limit(3);
      
      if (error) {
        console.log('❌ Direct Supabase error:', error);
      } else {
        console.log('✅ Direct Supabase works:', data.length, 'properties');
      }
    } catch (err) {
      console.log('❌ Direct Supabase failed:', err);
    }
  } else {
    console.log('No window.supabase available');
  }
}

debugAPI();