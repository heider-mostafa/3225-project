#!/usr/bin/env node

// Simple test script to verify OpenAI voice chat integration
const https = require('https');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing OpenAI Voice Chat Integration...\n');

// Test 1: Check environment variables
console.log('1. Checking environment variables...');
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
if (apiKey) {
  console.log('   ✅ OpenAI API Key found');
  console.log(`   🔑 Key starts with: ${apiKey.substring(0, 7)}...`);
} else {
  console.log('   ❌ OpenAI API Key not found');
  process.exit(1);
}

// Test 2: Test OpenAI API access
console.log('\n2. Testing OpenAI API access...');
const testOpenAI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ OpenAI API access confirmed');
          resolve();
        } else {
          console.log(`   ❌ OpenAI API error: ${res.statusCode}`);
          reject();
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Network error: ${e.message}`);
      reject();
    });

    req.end();
  });
};

// Test 3: Test Realtime API access
console.log('\n3. Testing Realtime API access...');
const testRealtimeAPI = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-10-01',
      modalities: ['audio', 'text']
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/realtime/sessions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('   ✅ Realtime API access confirmed');
          console.log(`   🎯 Session ID: ${response.id}`);
          console.log(`   🔑 Client Secret: ${response.client_secret.value.substring(0, 10)}...`);
          resolve();
        } else {
          console.log(`   ❌ Realtime API error: ${res.statusCode}`);
          console.log(`   📝 Response: ${data}`);
          reject();
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Network error: ${e.message}`);
      reject();
    });

    req.write(postData);
    req.end();
  });
};

// Test 4: Test local server (after 5 seconds to let it start)
const testLocalServer = () => {
  return new Promise((resolve, reject) => {
    console.log('\n4. Testing local server endpoint...');
    
    const postData = JSON.stringify({ propertyId: 'test-property-123' });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/realtime/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('   ✅ Local token endpoint working');
          console.log(`   🎯 Session ID: ${response.session_id || 'N/A'}`);
          console.log(`   🔑 Ephemeral Key: ${response.ephemeral_key?.substring(0, 10)}...`);
          resolve();
        } else {
          console.log(`   ❌ Local server error: ${res.statusCode}`);
          console.log(`   📝 Response: ${data}`);
          reject();
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Local server connection error: ${e.message}`);
      console.log('   💡 Make sure your dev server is running: npm run dev');
      reject();
    });

    req.write(postData);
    req.end();
  });
};

// Run all tests
async function runTests() {
  try {
    await testOpenAI();
    await testRealtimeAPI();
    
    // Wait 10 seconds for dev server to start
    console.log('\n⏳ Waiting 10 seconds for dev server to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    await testLocalServer();
    
    console.log('\n🎉 All tests passed! Your OpenAI voice chat integration should work!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Navigate to a property page');
    console.log('   3. Look for the "AI Voice" button in the tour viewer');
    console.log('   4. Click it and test voice interaction');
    console.log('   5. Check browser console (F12) for detailed logs');
    
  } catch (error) {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    console.log('\n📖 Refer to VOICE_CHAT_TROUBLESHOOTING.md for help.');
  }
}

runTests(); 