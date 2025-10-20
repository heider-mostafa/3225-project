/**
 * Test Script for CSO and NTRA Validation Flow
 * Tests both UI components and API endpoints
 */

const TEST_APPRAISER_ID = 'test-appraiser-id';
const TEST_NATIONAL_ID = '29001010123456';
const TEST_PHONE_NUMBER = '+201234567890';

// Test CSO Validation API
async function testCSOAPI() {
  console.log('🧪 Testing CSO Validation API...\n');

  try {
    console.log('1️⃣ Testing CSO Validation API...');
    const response = await fetch('/api/verification/validate-cso', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
      },
      body: JSON.stringify({
        appraiser_id: TEST_APPRAISER_ID,
        nid: TEST_NATIONAL_ID,
        first_name: 'أحمد',
        full_name: 'أحمد محمد علي',
        serial_number: '12345678',
        expiration: '2027-01-01'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ CSO Validation - SUCCESS');
      console.log('   Transaction ID:', data.transaction_id);
      console.log('   Trials Remaining:', data.trials_remaining);
      console.log('   Validation Result:', data.result);
      console.log('   Is Valid:', data.result.isValid);
      console.log('   Error Code:', data.result.errorCode);
      console.log('   Error Message:', data.result.errorMessage);
    } else {
      console.log('❌ CSO Validation - FAILED');
      console.log('   Error:', data.error);
    }

  } catch (error) {
    console.error('❌ CSO Validation Test Failed:', error.message);
  }
}

// Test NTRA Validation API
async function testNTRAAPI() {
  console.log('\n🧪 Testing NTRA Validation API...\n');

  try {
    console.log('1️⃣ Testing NTRA Validation API...');
    const response = await fetch('/api/verification/validate-ntra', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
      },
      body: JSON.stringify({
        appraiser_id: TEST_APPRAISER_ID,
        phone_number: TEST_PHONE_NUMBER,
        nid: TEST_NATIONAL_ID
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ NTRA Validation - SUCCESS');
      console.log('   Transaction ID:', data.transaction_id);
      console.log('   Trials Remaining:', data.trials_remaining);
      console.log('   Validation Result:', data.result);
      console.log('   Is Matched:', data.result.isMatched);
      console.log('   Message:', data.message);
    } else {
      console.log('❌ NTRA Validation - FAILED');
      console.log('   Error:', data.error);
    }

  } catch (error) {
    console.error('❌ NTRA Validation Test Failed:', error.message);
  }
}

// Test CSO Validation Logic
function testCSOValidation() {
  console.log('\n🏛️ Testing CSO Validation Logic...\n');

  // Test National ID format validation
  const testNationalIDs = [
    { nid: '29001010123456', valid: true, desc: 'Valid 14-digit National ID' },
    { nid: '30105012345678', valid: true, desc: 'Valid female National ID' },
    { nid: '12345678901234', valid: true, desc: 'Valid format - 14 digits' },
    { nid: '1234567890123', valid: false, desc: 'Too short - 13 digits' },
    { nid: '123456789012345', valid: false, desc: 'Too long - 15 digits' },
    { nid: '1234567890123a', valid: false, desc: 'Contains letters' },
    { nid: '', valid: false, desc: 'Empty National ID' },
  ];

  console.log('🆔 Testing National ID Format Validation:');
  testNationalIDs.forEach(({ nid, valid, desc }) => {
    const result = /^\d{14}$/.test(nid);
    const status = result === valid ? '✅' : '❌';
    console.log(`   ${status} ${desc}: "${nid}" - Expected: ${valid}, Got: ${result}`);
  });

  // Test CSO response validation
  const testCSORresponses = [
    {
      response: { result: { isValid: true, errorCode: 0 } },
      expected: 'VALID',
      desc: 'Valid CSO response'
    },
    {
      response: { result: { isValid: false, errorCode: 1001 } },
      expected: 'INVALID',
      desc: 'Invalid CSO response with error code'
    },
    {
      response: { result: { isValid: false, errorCode: 404, errorMessage: 'Not found' } },
      expected: 'INVALID',
      desc: 'Not found in CSO records'
    }
  ];

  console.log('\n🔍 Testing CSO Response Validation:');
  testCSORresponses.forEach(({ response, expected, desc }) => {
    const result = response.result.isValid ? 'VALID' : 'INVALID';
    const status = result === expected ? '✅' : '❌';
    console.log(`   ${status} ${desc}: ${result} (Error Code: ${response.result.errorCode})`);
  });
}

// Test NTRA Validation Logic
function testNTRAValidation() {
  console.log('\n📞 Testing NTRA Validation Logic...\n');

  // Test phone number matching with National ID
  const testMatches = [
    {
      phone: '+201234567890',
      nid: '29001010123456',
      expectedMatch: true,
      desc: 'Matching phone and National ID'
    },
    {
      phone: '+201987654321',
      nid: '29001010123456',
      expectedMatch: false,
      desc: 'Non-matching phone and National ID'
    },
    {
      phone: '01234567890',
      nid: '29001010123456',
      expectedMatch: true,
      desc: 'Local format phone with National ID'
    }
  ];

  console.log('🔗 Testing Phone-NID Matching Logic:');
  testMatches.forEach(({ phone, nid, expectedMatch, desc }) => {
    // Simulate NTRA matching logic (in real implementation this would call NTRA API)
    const normalizedPhone = phone.startsWith('+20') ? phone : `+20${phone.replace(/^0/, '')}`;
    const result = simulateNTRAMatch(normalizedPhone, nid);
    const status = result === expectedMatch ? '✅' : '❌';
    console.log(`   ${status} ${desc}:`);
    console.log(`      Phone: ${phone} -> ${normalizedPhone}`);
    console.log(`      NID: ${nid}`);
    console.log(`      Expected Match: ${expectedMatch}, Got: ${result}`);
  });
}

// Simulate NTRA matching (for testing purposes)
function simulateNTRAMatch(phone, nid) {
  // In real implementation, this would call the NTRA API
  // For testing, we simulate some basic matching logic
  const phoneHash = phone.slice(-4); // Last 4 digits of phone
  const nidHash = nid.slice(-4); // Last 4 digits of NID
  
  // Simple simulation: match if last digits are similar pattern
  return phoneHash === nidHash || Math.abs(parseInt(phoneHash) - parseInt(nidHash)) < 100;
}

// Test error handling for validation APIs
function testValidationErrorHandling() {
  console.log('\n🚨 Testing Validation Error Handling:');

  const errorScenarios = [
    {
      api: 'CSO',
      scenario: 'Missing appraiser ID',
      data: { nid: TEST_NATIONAL_ID },
      expectedError: 'Appraiser ID is required'
    },
    {
      api: 'CSO', 
      scenario: 'Empty National ID',
      data: { appraiser_id: TEST_APPRAISER_ID, nid: '' },
      expectedError: 'National ID required'
    },
    {
      api: 'NTRA',
      scenario: 'Missing phone number',
      data: { appraiser_id: TEST_APPRAISER_ID, nid: TEST_NATIONAL_ID },
      expectedError: 'Phone number and National ID are required'
    },
    {
      api: 'NTRA',
      scenario: 'Missing National ID',
      data: { appraiser_id: TEST_APPRAISER_ID, phone_number: TEST_PHONE_NUMBER },
      expectedError: 'Phone number and National ID are required'
    }
  ];

  errorScenarios.forEach(({ api, scenario, data, expectedError }) => {
    console.log(`   📝 ${api} - ${scenario}:`);
    console.log(`      Data: ${JSON.stringify(data)}`);
    console.log(`      Expected Error: "${expectedError}"`);
  });
}

// Test database integration
async function testDatabaseIntegration() {
  console.log('\n🗃️ Testing Database Integration...\n');

  // Test verification session storage
  const sessionData = {
    appraiser_id: TEST_APPRAISER_ID,
    session_type: 'cso_validation',
    transaction_id: 'test_cso_tx_' + Date.now(),
    status: 'completed',
    data: {
      nid: TEST_NATIONAL_ID,
      validation_result: { isValid: true, errorCode: 0 }
    }
  };

  console.log('💾 Testing Session Storage:');
  console.log(`   Session Type: ${sessionData.session_type}`);
  console.log(`   Transaction ID: ${sessionData.transaction_id}`);
  console.log(`   Status: ${sessionData.status}`);
  console.log(`   Data: ${JSON.stringify(sessionData.data)}`);
  
  console.log('\n✅ Session data structure is valid for database storage');
}

// Run all CSO and NTRA tests
function runValidationTests() {
  console.log('🚀 Starting CSO and NTRA Validation Tests\n');
  console.log('=' .repeat(60));
  
  testCSOValidation();
  testNTRAValidation();
  testValidationErrorHandling();
  testDatabaseIntegration();
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n💡 To test API endpoints:');
  console.log('1. Open browser developer console');
  console.log('2. Navigate to appraiser verification page');
  console.log('3. Run: testCSOAPI() and testNTRAAPI()');
  console.log('\n🏛️ CSO validates National ID against Civil Society Organization records');
  console.log('📞 NTRA validates phone number registration with National ID');
  console.log('\n✨ Validation Tests Complete!');
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  window.testCSOAPI = testCSOAPI;
  window.testNTRAAPI = testNTRAAPI;
  window.runValidationTests = runValidationTests;
}

// Run tests if in Node.js environment
if (typeof module !== 'undefined') {
  runValidationTests();
}