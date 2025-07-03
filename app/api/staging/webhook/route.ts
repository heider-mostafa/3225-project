import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface WebhookPayload {
  output: string // URL of the staged image
  status: 'succeeded' | 'failed'
  request_id: string
  original_image_id?: string // Added for our mock implementation
  staging_options?: any // Added for our mock implementation
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const payload: WebhookPayload = await request.json()
    
    console.log('📥 Received virtual staging webhook:', payload)

    const { output, status, request_id, original_image_id, staging_options } = payload

    if (!request_id) {
      console.error('❌ Missing request_id in webhook payload')
      return NextResponse.json(
        { error: 'Missing request_id' },
        { status: 400 }
      )
    }

    // Find the original image by request_id
    const { data: originalImage, error: findError } = await supabase
      .from('property_photos')
      .select('*')
      .eq('staging_request_id', request_id)
      .single()

    if (findError || !originalImage) {
      console.error('❌ Original image not found for request_id:', request_id)
      return NextResponse.json(
        { error: 'Original image not found' },
        { status: 404 }
      )
    }

    if (status === 'succeeded' && output) {
      try {
        // Download the staged image from InstantDeco
        console.log('🖼️ Downloading staged image from:', output)
        const imageResponse = await fetch(output)
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download staged image: ${imageResponse.statusText}`)
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        const imageUint8Array = new Uint8Array(imageBuffer)

        // Generate filename for staged image
        const originalFilename = originalImage.filename || 'image.jpg'
        const fileExtension = originalFilename.split('.').pop()
        const baseFilename = originalFilename.replace(/\.[^/.]+$/, '')
        const stagedFilename = `${baseFilename}_staged_${staging_options?.design || 'furnished'}.${fileExtension}`
        const storagePath = `property_${originalImage.property_id}_staged_${Date.now()}.${fileExtension}`

        // Upload staged image to Supabase Storage
        console.log('☁️ Uploading staged image to storage:', storagePath)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(storagePath, imageUint8Array, {
            contentType: originalImage.mime_type || 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Failed to upload staged image:', uploadError)
          throw uploadError
        }

        // Get public URL for staged image
        const { data: urlData } = supabase.storage
          .from('property-photos')
          .getPublicUrl(storagePath)

        // Get current max order_index for this property
        const { data: maxOrderData } = await supabase
          .from('property_photos')
          .select('order_index')
          .eq('property_id', originalImage.property_id)
          .order('order_index', { ascending: false })
          .limit(1)

        const nextOrderIndex = (maxOrderData?.[0]?.order_index || 0) + 1

        // Create new staged image record
        const stagedImageData = {
          property_id: originalImage.property_id,
          url: urlData.publicUrl,
          filename: stagedFilename,
          file_size: imageBuffer.byteLength,
          mime_type: originalImage.mime_type,
          category: originalImage.category,
          is_primary: false, // Staged images are never primary by default
          order_index: nextOrderIndex,
          storage_path: uploadData.path,
          alt_text: `${originalImage.alt_text || ''} (Virtually Staged - ${staging_options?.design || 'Furnished'})`,
          caption: `Virtually staged version - ${staging_options?.design || 'Furnished'} style`,
          // Virtual staging fields
          is_virtually_staged: true,
          original_image_id: originalImage.id,
          staging_request_id: request_id,
          staging_design: staging_options?.design,
          staging_room_type: staging_options?.room_type,
          staging_transformation_type: staging_options?.transformation_type,
          staging_status: 'completed',
          staging_settings: staging_options
        }

        console.log('💾 Creating staged image record:', stagedImageData)
        const { data: stagedImage, error: createError } = await supabase
          .from('property_photos')
          .insert(stagedImageData)
          .select()
          .single()

        if (createError) {
          console.error('❌ Failed to create staged image record:', createError)
          throw createError
        }

        // Update original image status to completed
        const { error: updateError } = await supabase
          .from('property_photos')
          .update({
            staging_status: 'completed'
          })
          .eq('id', originalImage.id)

        if (updateError) {
          console.error('❌ Failed to update original image status:', updateError)
        }

        console.log('✅ Virtual staging completed successfully')
        console.log(`📊 Staged image created: ${stagedImage.id}`)

        // TODO: Send notification to admin about completion
        // Could integrate with your notification system here

        return NextResponse.json({
          success: true,
          message: 'Virtual staging completed successfully',
          original_image_id: originalImage.id,
          staged_image_id: stagedImage.id,
          staged_image_url: urlData.publicUrl
        })

      } catch (error: any) {
        console.error('❌ Error processing staged image:', error)
        
        // Update original image status to failed
        await supabase
          .from('property_photos')
          .update({
            staging_status: 'failed'
          })
          .eq('id', originalImage.id)

        return NextResponse.json(
          { error: 'Failed to process staged image: ' + error.message },
          { status: 500 }
        )
      }

    } else if (status === 'failed') {
      console.log('❌ Virtual staging failed for request:', request_id)
      
      // Update original image status to failed
      const { error: updateError } = await supabase
        .from('property_photos')
        .update({
          staging_status: 'failed'
        })
        .eq('id', originalImage.id)

      if (updateError) {
        console.error('❌ Failed to update original image status:', updateError)
      }

      return NextResponse.json({
        success: true,
        message: 'Virtual staging failed, status updated'
      })

    } else {
      console.error('❌ Invalid webhook payload status:', status)
      return NextResponse.json(
        { error: 'Invalid status in webhook payload' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('❌ Unexpected error in staging webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 