/**
 * Contract System Initialization API
 * Creates required tables and seeds initial data for the contract automation system
 */

import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Validate admin permissions
    const authResult = await authorizeAdminRequest(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check if contract automation tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['contract_templates', 'lead_contracts', 'contract_ai_reviews'])

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
    }

    const existingTables = tables?.map(t => t.table_name) || []
    const missingTables = ['contract_templates', 'lead_contracts', 'contract_ai_reviews']
      .filter(table => !existingTables.includes(table))

    let initializationSteps = []

    if (missingTables.length > 0) {
      initializationSteps.push(`Missing database tables: ${missingTables.join(', ')}`)
      
      return NextResponse.json({
        success: false,
        error: 'Contract system not initialized',
        details: {
          missingTables,
          message: 'Database migration required. Please run the contract automation migration.',
          steps: [
            'The contract automation system requires database tables that are not yet created.',
            'Please apply the migration: 20250623_contract_automation_system.sql',
            'This will create the required tables: contract_templates, lead_contracts, contract_ai_reviews, etc.',
            'After migration, you can run this initialization again.'
          ]
        }
      }, { status: 400 })
    }

    // Check if contract templates exist
    const { data: templates, error: templatesError } = await supabase
      .from('contract_templates')
      .select('id')
      .limit(1)

    if (templatesError) {
      console.error('Error checking templates:', templatesError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check contract templates',
        message: templatesError.message
      }, { status: 500 })
    }

    if (!templates || templates.length === 0) {
      // Seed initial contract templates
      const seedTemplates = [
        {
          name: 'Residential Exclusive Listing - Cairo',
          template_type: 'exclusive_listing',
          property_type: 'residential',
          jurisdiction: 'cairo',
          ownership_type: 'individual',
          template_content: {
            title: 'Exclusive Marketing Authorization Agreement',
            sections: {
              property_details: 'Property located at {{property_address}}, {{area}}, Cairo, with {{bedrooms}} bedrooms, {{bathrooms}} bathrooms, and {{size_sqm}} square meters.',
              listing_price: 'The agreed listing price is {{listing_price}} EGP, subject to market conditions and client approval.',
              commission: 'VirtualEstate commission is {{commission_rate}}% of the final sale price.',
              duration: 'This agreement is valid for {{contract_duration}} months from the date of signing.',
              marketing_rights: 'VirtualEstate has exclusive rights to market, advertise, and show the property through all channels.',
              termination: 'Either party may terminate this agreement with {{termination_notice}} days written notice.'
            }
          },
          legal_requirements: {
            required_clauses: ['property_details', 'listing_price', 'commission', 'duration', 'marketing_rights'],
            cairo_specific: ['property_registration_number', 'area_building_permits'],
            legal_compliance: ['egyptian_real_estate_law_2023', 'consumer_protection_law']
          },
          variable_definitions: {
            property_address: { type: 'string', required: true },
            area: { type: 'string', required: true },
            bedrooms: { type: 'number', required: true },
            bathrooms: { type: 'number', required: true },
            size_sqm: { type: 'number', required: true },
            listing_price: { type: 'number', required: true },
            commission_rate: { type: 'number', default: 2.5 },
            contract_duration: { type: 'number', default: 6 },
            termination_notice: { type: 'number', default: 30 }
          },
          success_rate: 95.0,
          is_active: true
        },
        {
          name: 'Sale Agreement - General',
          template_type: 'sale_agreement',
          property_type: 'all',
          jurisdiction: 'all',
          ownership_type: 'individual',
          template_content: {
            title: 'Property Sale Agreement',
            sections: {
              parties: 'This agreement is between {{seller_name}} (Seller) and {{buyer_name}} (Buyer) for the sale of property located at {{property_address}}.',
              purchase_price: 'The total purchase price is {{purchase_price}} EGP, to be paid as follows: {{payment_terms}}',
              property_condition: 'The property is sold in {{property_condition}} condition.',
              closing_date: 'The closing date is scheduled for {{closing_date}} or as mutually agreed.',
              broker_commission: 'Total broker commission of {{total_commission}}% will be paid at closing.'
            }
          },
          legal_requirements: {
            required_clauses: ['parties', 'purchase_price', 'property_condition', 'closing_date'],
            egyptian_law_compliance: ['title_verification', 'tax_clearance', 'building_permits']
          },
          variable_definitions: {
            seller_name: { type: 'string', required: true },
            buyer_name: { type: 'string', required: true },
            property_address: { type: 'string', required: true },
            purchase_price: { type: 'number', required: true },
            payment_terms: { type: 'string', required: true },
            property_condition: { type: 'string', required: true },
            closing_date: { type: 'date', required: true },
            total_commission: { type: 'number', default: 2.5 }
          },
          success_rate: 88.0,
          is_active: true
        },
        {
          name: 'Marketing Authorization - Universal',
          template_type: 'marketing_authorization',
          property_type: 'all',
          jurisdiction: 'all',
          ownership_type: 'all',
          template_content: {
            title: 'Property Marketing Authorization',
            sections: {
              authorization: 'I/We {{owner_name}} hereby authorize VirtualEstate to market my/our property located at {{property_address}}.',
              marketing_methods: 'Authorized marketing methods include: virtual tours, photography, social media marketing, online portals, and broker network distribution.',
              duration: 'This authorization is valid from {{start_date}} to {{end_date}}.',
              compensation: 'Marketing services will be provided at no upfront cost. Commission of {{commission_rate}}% will be paid only upon successful sale.',
              contact_authorization: 'VirtualEstate may contact potential buyers and brokers on my/our behalf regarding this property.'
            }
          },
          legal_requirements: {
            required_clauses: ['authorization', 'marketing_methods', 'duration', 'compensation'],
            universal_compliance: ['data_protection', 'marketing_regulations', 'consumer_rights']
          },
          variable_definitions: {
            owner_name: { type: 'string', required: true },
            property_address: { type: 'string', required: true },
            start_date: { type: 'date', required: true },
            end_date: { type: 'date', required: true },
            commission_rate: { type: 'number', default: 2.5 },
            notice_period: { type: 'number', default: 24 }
          },
          success_rate: 92.0,
          is_active: true
        }
      ]

      const { error: seedError } = await supabase
        .from('contract_templates')
        .insert(seedTemplates)

      if (seedError) {
        console.error('Error seeding templates:', seedError)
        return NextResponse.json({
          success: false,
          error: 'Failed to seed contract templates',
          message: seedError.message
        }, { status: 500 })
      }

      initializationSteps.push('Seeded 3 initial contract templates')
    } else {
      initializationSteps.push('Contract templates already exist')
    }

    // Update leads table to add contract-related columns if they don't exist
    try {
      // Check if contract_status column exists
      const { error: alterError } = await supabase.rpc('add_contract_columns_if_missing')
      
      if (alterError && !alterError.message.includes('already exists')) {
        console.warn('Could not add contract columns:', alterError)
        initializationSteps.push('Note: Some contract columns may be missing from leads table')
      } else {
        initializationSteps.push('Verified leads table has contract columns')
      }
    } catch (error) {
      console.warn('Could not check/add contract columns:', error)
      initializationSteps.push('Note: Could not verify contract columns in leads table')
    }

    return NextResponse.json({
      success: true,
      message: 'Contract system initialization completed',
      steps: initializationSteps,
      summary: {
        tablesExist: missingTables.length === 0,
        templatesSeeded: templates?.length === 0,
        systemReady: true
      }
    })

  } catch (error) {
    console.error('Contract initialization error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize contract system',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin permissions
    const authResult = await authorizeAdminRequest(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check system status
    const checks = {
      contractTemplatesTable: false,
      leadContractsTable: false,
      contractAIReviewsTable: false,
      templatesSeeded: false,
      leadsTableReady: false
    }

    try {
      const { data: templates } = await supabase.from('contract_templates').select('id').limit(1)
      checks.contractTemplatesTable = true
      checks.templatesSeeded = (templates?.length || 0) > 0
    } catch (error) {
      // Table doesn't exist
    }

    try {
      const { data } = await supabase.from('lead_contracts').select('id').limit(1)
      checks.leadContractsTable = true
    } catch (error) {
      // Table doesn't exist
    }

    try {
      const { data } = await supabase.from('contract_ai_reviews').select('id').limit(1)
      checks.contractAIReviewsTable = true
    } catch (error) {
      // Table doesn't exist
    }

    try {
      const { data } = await supabase.from('leads').select('contract_status').limit(1)
      checks.leadsTableReady = true
    } catch (error) {
      // Column doesn't exist
    }

    const systemReady = Object.values(checks).every(check => check)

    return NextResponse.json({
      success: true,
      systemReady,
      checks,
      recommendations: systemReady ? [] : [
        !checks.contractTemplatesTable && 'Run database migration to create contract_templates table',
        !checks.leadContractsTable && 'Run database migration to create lead_contracts table',
        !checks.contractAIReviewsTable && 'Run database migration to create contract_ai_reviews table',
        !checks.templatesSeeded && 'Run POST /api/admin/contracts/initialize to seed templates',
        !checks.leadsTableReady && 'Update leads table with contract automation columns'
      ].filter(Boolean)
    })

  } catch (error) {
    console.error('Contract status check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check contract system status',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 