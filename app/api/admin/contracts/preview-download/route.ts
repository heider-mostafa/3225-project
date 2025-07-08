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
    const { htmlContent, format = 'pdf', fileName } = body

    if (!htmlContent) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    if (format === 'pdf') {
      try {
        // Generate PDF from HTML content
        const pdfUrl = await contractGenerator.generatePDFFromHTML(htmlContent, fileName)
        
        // If it's a data URL, convert to blob for download
        if (pdfUrl.startsWith('data:application/pdf;base64,')) {
          const base64Data = pdfUrl.split(',')[1]
          const pdfBuffer = Buffer.from(base64Data, 'base64')
          
          // Log admin activity
          await logAdminActivity(
            'property_created', // Using existing action type
            'api',
            fileName || 'preview',
            {
              action: 'contract_preview_downloaded',
              format: 'pdf',
              size: pdfBuffer.length
            },
            request
          )

          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${fileName || 'contract_preview'}.pdf"`,
              'Content-Length': pdfBuffer.length.toString(),
            },
          })
        } else {
          // Return URL for external storage
          return NextResponse.json({
            success: true,
            downloadUrl: pdfUrl
          })
        }
      } catch (error) {
        console.error('PDF generation error:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to generate PDF'
        }, { status: 500 })
      }
    } else if (format === 'html') {
      // Return HTML content as downloadable file
      const htmlBuffer = Buffer.from(htmlContent, 'utf-8')
      
      // Log admin activity
      await logAdminActivity(
        'property_created', // Using existing action type
        'api',
        fileName || 'preview',
        {
          action: 'contract_preview_downloaded',
          format: 'html',
          size: htmlBuffer.length
        },
        request
      )

      return new NextResponse(htmlBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${fileName || 'contract_preview'}.html"`,
          'Content-Length': htmlBuffer.length.toString(),
        },
      })
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Contract preview download error:', error)
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