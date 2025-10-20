/**
 * Meta Integration Test Utility
 * Use this to test your Meta Conversions API integration
 */

import { metaConversions } from '@/lib/services/meta-conversions'

export interface MetaTestResult {
  test: string
  success: boolean
  error?: string
  details?: any
}

/**
 * Test basic Meta Conversions API connection
 */
export async function testMetaConnection(): Promise<MetaTestResult> {
  try {
    const result = await metaConversions.trackConversion({
      eventName: 'Lead',
      userEmail: 'test@openbeit.com',
      userPhone: '+201234567890',
      customData: {
        content_category: 'test_event',
        content_name: 'Meta Integration Test',
        value: 1,
        test_event: true
      }
    })

    return {
      test: 'Meta Connection Test',
      success: result.success,
      error: result.error,
      details: result
    }
  } catch (error) {
    return {
      test: 'Meta Connection Test',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

/**
 * Test lead tracking functionality
 */
export async function testLeadTracking(): Promise<MetaTestResult> {
  try {
    const result = await metaConversions.trackLead({
      userEmail: 'test-lead@openbeit.com',
      userPhone: '+201234567890',
      leadScore: 45,
      propertyType: 'apartment',
      location: 'New Cairo',
      timeline: 'Soon (2-4 months)',
      priceRange: '3M-5M EGP',
      utmSource: 'meta_test',
      utmMedium: 'test',
      utmCampaign: 'integration_test'
    })

    return {
      test: 'Lead Tracking Test',
      success: result.success,
      error: result.error,
      details: result
    }
  } catch (error) {
    return {
      test: 'Lead Tracking Test',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

/**
 * Test property viewing tracking functionality
 */
export async function testPropertyViewingTracking(): Promise<MetaTestResult> {
  try {
    const result = await metaConversions.trackPropertyViewing({
      userEmail: 'test-viewing@openbeit.com',
      userPhone: '+201234567890',
      propertyId: 'test-property-123',
      propertyValue: 5000000, // 5M EGP
      viewingType: 'in_person',
      partySize: 2,
      leadQualityScore: 55,
      brokerId: 'test-broker-123'
    })

    return {
      test: 'Property Viewing Tracking Test',
      success: result.success,
      error: result.error,
      details: result
    }
  } catch (error) {
    return {
      test: 'Property Viewing Tracking Test',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

/**
 * Test virtual tour engagement tracking
 */
export async function testTourEngagementTracking(): Promise<MetaTestResult> {
  try {
    const result = await metaConversions.trackTourEngagement({
      userEmail: 'test-tour@openbeit.com',
      propertyId: 'test-property-123',
      engagementScore: 85,
      tourType: 'realsee',
      duration: 420, // 7 minutes
      completed: true
    })

    return {
      test: 'Tour Engagement Tracking Test',
      success: result.success,
      error: result.error,
      details: result
    }
  } catch (error) {
    return {
      test: 'Tour Engagement Tracking Test',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

/**
 * Run all Meta integration tests
 */
export async function runAllMetaTests(): Promise<{
  overall_success: boolean
  results: MetaTestResult[]
  summary: {
    total_tests: number
    passed: number
    failed: number
  }
}> {
  console.log('🚀 Starting Meta Integration Tests...')
  
  const tests = [
    testMetaConnection,
    testLeadTracking,
    testPropertyViewingTracking,
    testTourEngagementTracking
  ]

  const results: MetaTestResult[] = []

  for (const test of tests) {
    console.log(`Running ${test.name}...`)
    const result = await test()
    results.push(result)
    
    if (result.success) {
      console.log(`✅ ${result.test} passed`)
    } else {
      console.log(`❌ ${result.test} failed: ${result.error}`)
    }
    
    // Wait 1 second between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const passed = results.filter(r => r.success).length
  const failed = results.length - passed

  console.log(`\n📊 Test Summary:`)
  console.log(`Total Tests: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`)

  return {
    overall_success: failed === 0,
    results,
    summary: {
      total_tests: results.length,
      passed,
      failed
    }
  }
}

/**
 * Check Meta environment configuration
 */
export function checkMetaConfig(): {
  configured: boolean
  missing: string[]
  warnings: string[]
} {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required environment variables
  if (!process.env.META_CONVERSIONS_API_ACCESS_TOKEN) {
    missing.push('META_CONVERSIONS_API_ACCESS_TOKEN')
  }

  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) {
    missing.push('NEXT_PUBLIC_META_PIXEL_ID')
  }

  // Check optional but recommended variables
  if (!process.env.META_TEST_EVENT_CODE && process.env.NODE_ENV !== 'production') {
    warnings.push('META_TEST_EVENT_CODE not set (recommended for development)')
  }

  // Check if in production without proper setup
  if (process.env.NODE_ENV === 'production' && missing.length > 0) {
    warnings.push('Missing Meta configuration in production environment')
  }

  return {
    configured: missing.length === 0,
    missing,
    warnings
  }
}

/**
 * Create a test API endpoint for Meta integration testing
 * Add this to your API routes for easy testing
 */
export const metaTestHandler = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('test') || 'all'

    // Check configuration first
    const config = checkMetaConfig()
    if (!config.configured) {
      return Response.json({
        success: false,
        error: 'Meta not properly configured',
        missing: config.missing,
        warnings: config.warnings
      }, { status: 400 })
    }

    let results

    switch (testType) {
      case 'connection':
        results = await testMetaConnection()
        break
      case 'lead':
        results = await testLeadTracking()
        break
      case 'viewing':
        results = await testPropertyViewingTracking()
        break
      case 'tour':
        results = await testTourEngagementTracking()
        break
      case 'all':
      default:
        results = await runAllMetaTests()
        break
    }

    return Response.json({
      success: true,
      config: config,
      test_results: results
    })

  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}