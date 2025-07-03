/**
 * Test Script for Contract Generation System
 * Run this to verify the contract automation system is working
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase environment variables not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testContractSystem() {
  console.log('🔍 Testing Contract Generation System...\n')

  try {
    // 1. Check if required tables exist
    console.log('1. Checking database tables...')
    
    const tables = ['contract_templates', 'lead_contracts', 'contract_ai_reviews', 'leads']
    const tableResults = {}
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1)
        if (error) {
          tableResults[tableName] = '❌ Missing or inaccessible'
          console.log(`   ❌ ${tableName}: ${error.message}`)
        } else {
          tableResults[tableName] = '✅ Available'
          console.log(`   ✅ ${tableName}: Available`)
        }
      } catch (e) {
        tableResults[tableName] = '❌ Error'
        console.log(`   ❌ ${tableName}: Error checking`)
      }
    }

    // 2. Check contract templates
    console.log('\n2. Checking contract templates...')
    
    const { data: templates, error: templatesError } = await supabase
      .from('contract_templates')
      .select('*')
    
    if (templatesError) {
      console.log(`   ❌ Error fetching templates: ${templatesError.message}`)
    } else if (!templates || templates.length === 0) {
      console.log('   ⚠️  No contract templates found')
      console.log('   💡 Hint: Run the contract automation migration to seed templates')
    } else {
      console.log(`   ✅ Found ${templates.length} contract templates:`)
      templates.forEach(template => {
        console.log(`      - ${template.name} (${template.template_type})`)
      })
    }

    // 3. Check for sample leads
    console.log('\n3. Checking sample leads...')
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5)
    
    if (leadsError) {
      console.log(`   ❌ Error fetching leads: ${leadsError.message}`)
    } else if (!leads || leads.length === 0) {
      console.log('   ⚠️  No leads found in database')
      console.log('   💡 Hint: Create some test leads to test contract generation')
    } else {
      console.log(`   ✅ Found ${leads.length} leads (showing first 5):`)
      leads.forEach(lead => {
        console.log(`      - ${lead.name} (${lead.status || 'no status'})`)
      })
    }

    // 4. Test contract generation (if we have leads and templates)
    if (templates && templates.length > 0 && leads && leads.length > 0) {
      console.log('\n4. Testing contract generation...')
      
      const testLead = leads[0]
      const testTemplate = templates[0]
      
      console.log(`   📝 Testing with lead: ${testLead.name}`)
      console.log(`   📄 Using template: ${testTemplate.name}`)
      
      try {
        // Test the contract generation logic
        const contractData = {
          property_address: testLead.location || 'Test Property Address, Cairo',
          property_type: testLead.property_type || 'residential',
          owner_name: testLead.name,
          seller_phone: testLead.whatsapp_number,
          seller_email: testLead.email,
          listing_price: 1000000, // 1M EGP
          commission_rate: 2.5,
          contract_duration: 6,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }

        console.log('   ✅ Contract data structure created successfully')
        console.log('   💡 Full API test requires OpenAI integration')
        
      } catch (error) {
        console.log(`   ❌ Error in contract generation test: ${error.message}`)
      }
    }

    // 5. Environment check
    console.log('\n5. Checking environment configuration...')
    
    const envChecks = {
      'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      'NEXT_PUBLIC_OPENAI_API_KEY': !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      'OPENAI_API_KEY': !!process.env.OPENAI_API_KEY
    }
    
    for (const [key, exists] of Object.entries(envChecks)) {
      console.log(`   ${exists ? '✅' : '❌'} ${key}: ${exists ? 'Configured' : 'Missing'}`)
    }

    // Summary
    console.log('\n📊 SYSTEM STATUS SUMMARY:')
    console.log('=' .repeat(50))
    
    const allTablesOk = Object.values(tableResults).every(result => result.includes('✅'))
    const hasTemplates = templates && templates.length > 0
    const hasLeads = leads && leads.length > 0
    const hasOpenAI = envChecks['NEXT_PUBLIC_OPENAI_API_KEY'] || envChecks['OPENAI_API_KEY']
    
    console.log(`Database Tables: ${allTablesOk ? '✅ Ready' : '❌ Issues detected'}`)
    console.log(`Contract Templates: ${hasTemplates ? '✅ Available' : '❌ Missing'}`)
    console.log(`Test Data (Leads): ${hasLeads ? '✅ Available' : '⚠️  None found'}`)
    console.log(`OpenAI Integration: ${hasOpenAI ? '✅ Configured' : '❌ Missing API key'}`)
    
    const systemReady = allTablesOk && hasTemplates && hasOpenAI
    console.log(`\n🎯 Overall Status: ${systemReady ? '✅ SYSTEM READY' : '⚠️  SETUP REQUIRED'}`)
    
    if (!systemReady) {
      console.log('\n🛠️  NEXT STEPS:')
      if (!allTablesOk) {
        console.log('   1. Run Supabase migration: 20250623_contract_automation_system.sql')
      }
      if (!hasTemplates) {
        console.log('   2. Seed contract templates via the migration or admin panel')
      }
      if (!hasOpenAI) {
        console.log('   3. Add OpenAI API key to your environment variables')
      }
      if (!hasLeads) {
        console.log('   4. Create some test leads to try contract generation')
      }
    } else {
      console.log('\n🚀 You can now test contract generation through the admin panel!')
      console.log('   → Go to /admin/leads')
      console.log('   → Select a lead and click "Contract Options"')
      console.log('   → Choose a template and generate a contract')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testContractSystem().then(() => {
  console.log('\n✨ Test completed!')
}).catch(error => {
  console.error('💥 Test crashed:', error)
  process.exit(1)
}) 