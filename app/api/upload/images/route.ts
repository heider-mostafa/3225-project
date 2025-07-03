import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// POST /api/upload/images - Upload property images
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions for image upload
    const isAdmin = await isServerUserAdmin(cookieStore)
    
    // Temporarily bypass authentication for testing
    if (!isAdmin) {
      
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    // Parse multipart form data
    const formData = await request.formData() as any
    const files = formData.getAll('files') as File[]
    const property_id = formData.get('property_id') as string
    const is_primary = formData.get('is_primary') === 'true'
    const category = formData.get('category') as string || 'general' // general, exterior, interior, amenities

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      )
    }

    if (!property_id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Validate property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const uploadResults = []
    const errors = []

    // Process each file
    console.log(`🔄 Processing ${files.length} files for property ${property_id}`)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`📁 Processing file ${i + 1}: ${file.name} (${file.size} bytes)`)
      
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          errors.push({
            filename: file.name,
            error: 'Invalid file type. Only images are allowed.'
          })
          continue
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          errors.push({
            filename: file.name,
            error: 'File too large. Maximum size is 10MB.'
          })
          continue
        }

        // Generate unique filename
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const filename = `property_${property_id}_${category}_${timestamp}_${i}.${fileExtension}`
        
        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage
        console.log(`☁️ Uploading to storage: ${filename}`)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(filename, fileBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('❌ Storage upload error:', uploadError)
          errors.push({
            filename: file.name,
            error: 'Failed to upload file: ' + uploadError.message
          })
          continue
        }
        console.log(`✅ Storage upload successful: ${uploadData?.path}`)

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('property-photos')
          .getPublicUrl(filename)

        // If this is the first primary image, unset other primary images
        if (is_primary && i === 0) {
          await supabase
            .from('property_photos')
            .update({ is_primary: false })
            .eq('property_id', property_id)
        }

        // Get current max order_index for this property
        const { data: maxOrderData } = await supabase
          .from('property_photos')
          .select('order_index')
          .eq('property_id', property_id)
          .order('order_index', { ascending: false })
          .limit(1)

        const nextOrderIndex = (maxOrderData?.[0]?.order_index || 0) + 1

        // Save image metadata to database
        console.log(`💾 Saving to database: ${file.name}`)
        const insertData = {
          property_id,
          url: urlData.publicUrl,
          filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          is_primary: is_primary && i === 0,
          category,
          order_index: nextOrderIndex,
          storage_path: uploadData.path
        }
        console.log(`📝 Insert data:`, insertData)

        const { data: photoData, error: photoError } = await supabase
          .from('property_photos')
          .insert(insertData)
          .select()
          .single()

        if (photoError) {
          console.error('❌ Database error:', photoError)
          // Try to clean up uploaded file
          await supabase.storage
            .from('property-photos')
            .remove([filename])
          
          errors.push({
            filename: file.name,
            error: 'Failed to save image metadata'
          })
          continue
        }
        console.log(`✅ Database save successful: ${photoData.id}`)

                uploadResults.push({
          filename: file.name,
          url: urlData.publicUrl,
          id: photoData.id,
          size: file.size,
          category,
          is_primary: is_primary && i === 0
        })

      } catch (error) {
        console.error('Unexpected error processing file:', error)
        errors.push({
          filename: file.name,
          error: 'Unexpected error processing file'
        })
      }
    }

    // Log upload activity
    await logAdminActivity(
      'property_updated',
      'property',
      property_id,
      {
        action: 'images_uploaded',
        propertyTitle: property.title,
        uploadedCount: uploadResults.length,
        errorCount: errors.length,
        category,
        totalSize: uploadResults.reduce((sum, r) => sum + r.size, 0)
      }
    )

    const response = {
      success: true,
      uploaded: uploadResults,
      errors,
      summary: {
        total: files.length,
        succeeded: uploadResults.length,
        failed: errors.length
      }
    }
    
    console.log(`🎉 Upload complete - Success: ${uploadResults.length}, Errors: ${errors.length}`)
    console.log(`📤 Response:`, response)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Unexpected error in image upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/upload/images - Delete property images
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { imageIds } = await request.json()

    if (!imageIds || !Array.isArray(imageIds)) {
      return NextResponse.json(
        { error: 'imageIds array is required' },
        { status: 400 }
      )
    }

    const deletedImages = []
    const errors = []

    for (const imageId of imageIds) {
      try {
        // Get image data for cleanup
        const { data: imageData, error: fetchError } = await supabase
          .from('property_photos')
          .select('storage_path, property_id, filename, properties(title)')
          .eq('id', imageId)
          .single()

        if (fetchError || !imageData) {
          errors.push({
            imageId,
            error: 'Image not found'
          })
          continue
        }

        // Delete from storage
        if (imageData.storage_path) {
          const { error: storageError } = await supabase.storage
            .from('property-photos')
            .remove([imageData.storage_path])

          if (storageError) {
            console.error('Storage deletion error:', storageError)
            // Continue with database deletion even if storage fails
          }
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('property_photos')
          .delete()
          .eq('id', imageId)

        if (dbError) {
          errors.push({
            imageId,
            error: 'Failed to delete from database'
          })
          continue
        }

        deletedImages.push({
          imageId,
          filename: imageData.filename,
          property_id: imageData.property_id
        })

        // Log deletion
        await logAdminActivity(
          'property_updated',
          'property',
          imageData.property_id,
          {
            action: 'image_deleted',
            imageId,
            filename: imageData.filename,
            propertyTitle: (imageData.properties as any)?.title
          }
        )

      } catch (error) {
        console.error('Error deleting image:', error)
        errors.push({
          imageId,
          error: 'Unexpected error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      deleted: deletedImages,
      errors,
      summary: {
        total: imageIds.length,
        succeeded: deletedImages.length,
        failed: errors.length
      }
    })

  } catch (error) {
    console.error('Unexpected error in image deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/upload/images - Update image metadata (reorder, set primary, etc.)
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { updates } = await request.json()

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      )
    }

    const updatedImages = []

    for (const update of updates) {
      const { imageId, alt_text, caption, category, is_primary } = update

      // Build update query
      let query = supabase
        .from('property_photos')
        .update({
          ...(alt_text !== undefined && { alt_text }),
          ...(caption !== undefined && { caption }),
          ...(category !== undefined && { category }),
          ...(is_primary !== undefined && { is_primary }),
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId)
        .select()

      // If setting as primary, first unset all other primary images for this property
      if (is_primary === true) {
        const { data: currentImage } = await supabase
          .from('property_photos')
          .select('property_id')
          .eq('id', imageId)
          .single()

        if (currentImage) {
          await supabase
            .from('property_photos')
            .update({ is_primary: false })
            .eq('property_id', currentImage.property_id)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Error updating image:', error)
        return NextResponse.json(
          { error: 'Failed to update image' },
          { status: 500 }
        )
      }

      if (data && data[0]) {
        updatedImages.push(data[0])
      }
    }

    return NextResponse.json({
      success: true,
      images: updatedImages
    })

  } catch (error) {
    console.error('Error in PUT /api/upload/images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 