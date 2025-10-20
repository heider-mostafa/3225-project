import { NextRequest } from 'next/server'
import { metaTestHandler } from '@/lib/utils/test-meta-integration'

/**
 * Meta Integration Test API Endpoint
 * 
 * Usage:
 * GET /api/test-meta - Run all tests
 * GET /api/test-meta?test=connection - Test basic connection
 * GET /api/test-meta?test=lead - Test lead tracking
 * GET /api/test-meta?test=viewing - Test property viewing tracking
 * GET /api/test-meta?test=tour - Test virtual tour tracking
 */
export async function GET(request: NextRequest) {
  // Only allow in development or with admin auth
  if (process.env.NODE_ENV === 'production') {
    return Response.json({
      success: false,
      error: 'Test endpoint not available in production'
    }, { status: 403 })
  }

  return metaTestHandler(request)
}