// Quick test for the leads API endpoint
async function testLeadsAPI() {
  try {
    console.log('🔍 Testing leads API endpoint...')
    
    const response = await fetch('http://localhost:3000/api/admin/leads?limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Action': 'load-leads',
        'X-Requested-With': 'XMLHttpRequest'
      },
    })

    console.log('📊 Response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Error:', errorData)
      return
    }

    const data = await response.json()
    console.log('✅ Success! Response structure:')
    console.log('- Leads count:', data.leads?.length || 0)
    console.log('- Stats:', data.stats)
    console.log('- Locations:', data.locations?.length || 0, 'unique locations')
    console.log('- Pagination:', data.pagination)
    
    if (data.leads && data.leads.length > 0) {
      console.log('\n📋 Sample lead:')
      const sampleLead = data.leads[0]
      console.log('- Name:', sampleLead.name)
      console.log('- Status:', sampleLead.status)
      console.log('- Score:', sampleLead.initial_score)
      console.log('- Location:', sampleLead.location)
    }
    
  } catch (error) {
    console.error('💥 API test failed:', error.message)
  }
}

// Run the test
testLeadsAPI() 