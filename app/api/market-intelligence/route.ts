import { NextRequest, NextResponse } from 'next/server'
import { marketIntelligenceService } from '@/lib/services/market-intelligence-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'compound' | 'area' | 'predictive'
    const location = searchParams.get('location')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!type || !location) {
      return NextResponse.json({ 
        error: 'Missing required parameters: type and location' 
      }, { status: 400 })
    }

    let dateRange = undefined
    if (startDate && endDate) {
      dateRange = {
        from: new Date(startDate),
        to: new Date(endDate)
      }
    }

    switch (type) {
      case 'compound':
        const compoundAnalytics = await marketIntelligenceService.getCompoundAnalytics(location, dateRange)
        if (!compoundAnalytics) {
          return NextResponse.json({ 
            error: 'No data available for this compound',
            location,
            suggestion: 'Try a broader area search or check if the compound name is correct'
          }, { status: 404 })
        }
        return NextResponse.json(compoundAnalytics)

      case 'area':
        const areaAnalytics = await marketIntelligenceService.getAreaAnalytics(location)
        if (!areaAnalytics) {
          return NextResponse.json({ 
            error: 'No data available for this area',
            location,
            suggestion: 'Try a different area name or check spelling'
          }, { status: 404 })
        }
        return NextResponse.json(areaAnalytics)

      case 'predictive':
        const predictiveInsights = await marketIntelligenceService.getMarketPredictiveInsights(location)
        if (!predictiveInsights) {
          return NextResponse.json({ 
            error: 'Insufficient data for predictive analysis',
            location,
            suggestion: 'Predictive insights require at least 10 appraisals in the area over 24 months'
          }, { status: 404 })
        }
        return NextResponse.json(predictiveInsights)

      default:
        return NextResponse.json({ 
          error: 'Invalid type parameter',
          valid_types: ['compound', 'area', 'predictive']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Market intelligence API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve market intelligence data'
    }, { status: 500 })
  }
}

// Example usage endpoints:
// GET /api/market-intelligence?type=compound&location=Rehab City
// GET /api/market-intelligence?type=area&location=New Cairo
// GET /api/market-intelligence?type=predictive&location=6th of October City
// GET /api/market-intelligence?type=compound&location=Madinaty&start_date=2024-01-01&end_date=2024-12-31