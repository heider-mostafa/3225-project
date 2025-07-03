import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'
import { cookies } from 'next/headers'

interface StagingOptions {
  design: string
  room_type: string
  transformation_type: string
  block_element: string
  high_details_resolution: boolean
  num_images: number
}

interface StagingRequest {
  propertyId: string
  imageIds: string[]
  stagingOptions: StagingOptions
}

// Mock function to simulate InstantDeco API call
async function callInstantDecoAPI(imageUrl: string, stagingOptions: StagingOptions): Promise<{
  status: string
  request_id: string
  message: string
}> {
  // TODO: Replace with real API call when you have the API key
  /*
  const response = await fetch('https://app.instantdeco.ai/virtual-stage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INSTANTDECO_API_KEY}`
    },
    body: JSON.stringify({
      design: stagingOptions.design,
      room_type: stagingOptions.room_type,
      transformation_type: stagingOptions.transformation_type,
      block_element: stagingOptions.block_element,
      high_details_resolution: stagingOptions.high_details_resolution,
      img_url: imageUrl,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/staging/webhook`,
      num_images: stagingOptions.num_images
    })
  })
  
  return await response.json()
  */
  
  // Mock response for development
  return {
    status: 'success',
    request_id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message: 'Request initiated successfully'
  }
}

// Mock function to simulate webhook callback after a delay
async function simulateWebhookCallback(requestId: string, imageId: string, stagingOptions: StagingOptions) {
  // Simulate processing time (2-5 minutes in real API, 30 seconds for demo)
  setTimeout(async () => {
    try {
      // Create mock staged image URL (in production, this comes from the webhook)
      const mockStagedImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`
      
      // Call our webhook endpoint to process the completion
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/staging/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          output: mockStagedImageUrl,
          status: 'succeeded',
          request_id: requestId,
          original_image_id: imageId,
          staging_options: stagingOptions
        })
      })
    } catch (error) {
      console.error('Failed to simulate webhook callback:', error)
    }
  }, 30000) // 30 seconds for demo (real API takes 2-5 minutes)
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()
    const { propertyId, imageRequests, globalOptions } = await request.json()
    
    // Validate input
    if (!propertyId || !imageRequests || !Array.isArray(imageRequests) || imageRequests.length === 0) {
      return NextResponse.json(
        { error: 'propertyId and imageRequests array are required' },
        { status: 400 }
      )
    }

    // Validate each image request
    for (const imageRequest of imageRequests) {
      if (!imageRequest.imageId || !imageRequest.roomType) {
        return NextResponse.json(
          { error: 'Each image request must have imageId and roomType' },
          { status: 400 }
        )
      }
    }

    // Verify property exists and user has access
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Verify all images exist and belong to this property
    const imageIds = imageRequests.map(req => req.imageId)
    const { data: existingImages, error: fetchError } = await supabase
      .from('property_photos')
      .select('id, property_id, url, filename, is_virtually_staged, category, alt_text')
      .in('id', imageIds)
      .eq('property_id', propertyId)

    if (fetchError) {
      console.error('Error fetching images:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      )
    }

    if (!existingImages || existingImages.length !== imageIds.length) {
      return NextResponse.json(
        { error: 'Some images not found or do not belong to this property' },
        { status: 400 }
      )
    }

    // Check if any images are already staged
    const alreadyStaged = existingImages.filter(img => img.is_virtually_staged)
    if (alreadyStaged.length > 0) {
      return NextResponse.json(
        { error: `Some images are already virtually staged: ${alreadyStaged.map(img => img.filename).join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique request ID for this batch
    const requestId = `batch_${propertyId}_${Date.now()}`
    
    // Process each image with its specific room type
    const stagingResults: Array<{
      imageId: string
      roomType: string
      design: string
      transformationType: string
      status: string
      estimatedCompletion: string
    }> = []
    
    for (const imageRequest of imageRequests) {
      const image = existingImages.find(img => img.id === imageRequest.imageId)
      if (!image) continue

      // MOCK: In production, this would call the actual InstantDeco API
      // const stagingResponse = await fetch('https://api.instantdeco.com/stage', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.INSTANTDECO_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     image_url: image.url,
      //     design: globalOptions.design,
      //     room_type: imageRequest.roomType,
      //     transformation_type: globalOptions.transformationType,
      //     ...imageRequest.options
      //   })
      // })

      // MOCK RESPONSE - Replace with real API call
      const mockStagingResult = {
        imageId: imageRequest.imageId,
        roomType: imageRequest.roomType,
        design: globalOptions.design,
        transformationType: globalOptions.transformationType,
        status: 'processing',
        estimatedCompletion: new Date(Date.now() + 30000).toISOString() // 30 seconds from now
      }

      stagingResults.push(mockStagingResult)

      // Update database with processing status
      const { error: updateError } = await supabase
        .from('property_photos')
        .update({
          staging_status: 'processing',
          staging_request_id: requestId,
          staging_design: globalOptions.design,
          staging_room_type: imageRequest.roomType,
          staging_transformation_type: globalOptions.transformationType,
          staging_settings: {
            ...imageRequest.options,
            roomType: imageRequest.roomType,
            globalOptions
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', imageRequest.imageId)

      if (updateError) {
        console.error('Error updating image status:', updateError)
        // Continue with other images even if one fails
      }
    }

    // Mock webhook completion after delay (in production, InstantDeco would call your webhook)
    setTimeout(async () => {
      try {
        // Simulate completed staging for each image
        for (const result of stagingResults) {
          const originalImage = existingImages.find(img => img.id === result.imageId)
          if (!originalImage) continue

          // Create staged image record
          const stagedImageData = {
            property_id: propertyId,
            url: `${originalImage.url}?staged=${result.design}&room=${result.roomType}`, // Mock staged URL
            filename: `staged_${result.design}_${originalImage.filename}`,
            category: originalImage.category,
            is_primary: false,
            order_index: 999, // Put staged images at the end
            alt_text: `${originalImage.alt_text || ''} (${result.design} virtual staging)`,
            caption: `Virtually staged ${result.roomType} in ${result.design} style`,
            is_virtually_staged: true,
            original_image_id: originalImage.id,
            staging_status: 'completed',
            staging_design: result.design,
            staging_room_type: result.roomType,
            staging_transformation_type: result.transformationType,
            staging_settings: {
              roomType: result.roomType,
              design: result.design,
              transformationType: result.transformationType
            }
          }

          const { error: insertError } = await supabase
            .from('property_photos')
            .insert(stagedImageData)

          if (insertError) {
            console.error('Error creating staged image:', insertError)
          }

          // Update original image status
          await supabase
            .from('property_photos')
            .update({
              staging_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', result.imageId)
        }
      } catch (error) {
        console.error('Error in mock completion:', error)
      }
    }, 5000) // Complete first image after 5 seconds

    // Log activity
    await logAdminActivity(
      'property_updated',
      'property',
      propertyId,
      {
        action: 'virtual_staging_started',
        propertyTitle: property.title,
        stagedImageCount: stagingResults.length,
        stagingOptions: {
          design: globalOptions.design,
          room_type: globalOptions.room_type,
          transformation_type: globalOptions.transformation_type
        }
      }
    )

    return NextResponse.json({
      success: true,
      requestId,
      message: `Started virtual staging for ${imageRequests.length} images`,
      details: stagingResults,
      estimatedCompletion: '30 seconds'
    })

  } catch (error) {
    console.error('Error in virtual staging:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 