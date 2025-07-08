import { NextRequest, NextResponse } from 'next/server'
import { contractGenerator } from '@/lib/contracts/generator'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, contractType = 'standard', expedited = false, manualReview = false, customVariables } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    console.log('Preview request:', { leadId, contractType, expedited, manualReview })

    // Generate contract preview
    const result = await contractGenerator.generateContractPreview({
      leadId,
      contractType,
      expedited,
      manualReview,
      customVariables
    })

    if (!result.success) {
      console.error('Contract preview generation failed:', result.errors)
      return NextResponse.json({
        success: false,
        error: result.errors?.[0] || 'Failed to generate contract preview',
        details: result.errors
      }, { status: 400 })
    }

    // Log admin activity
    await logAdminActivity(
      'property_created', // Using existing action type
      'api',
      leadId,
      {
        action: 'contract_preview_generated',
        contractType,
        expedited,
        aiConfidenceScore: result.aiReview.confidenceScore,
        riskFactors: result.aiReview.riskFactors.length
      },
      request
    )

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Contract preview generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}