import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/appraisals/[id]/clear-images - Clear base64 images from form_data after upload
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    console.log(`🧹 Clearing extracted images from appraisal ${id}`)

    // Get current appraisal data
    const { data: appraisal, error: fetchError } = await supabase
      .from('property_appraisals')
      .select('form_data, id')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching appraisal:', fetchError)
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      )
    }

    if (!appraisal) {
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      )
    }

    // Update form_data to remove extracted_images while preserving other data
    const currentFormData = appraisal.form_data || {}
    const updatedFormData = {
      ...currentFormData,
      extracted_images: [], // Clear the extracted images array
      images_uploaded: true, // Mark as uploaded
      images_cleared_at: new Date().toISOString() // Track when cleared
    }

    // Update the appraisal with cleared image data
    const { error: updateError } = await supabase
      .from('property_appraisals')
      .update({ 
        form_data: updatedFormData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('❌ Error updating appraisal:', updateError)
      return NextResponse.json(
        { error: 'Failed to clear images from form_data' },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully cleared extracted images from appraisal ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Extracted images cleared from form_data',
      cleared_at: updatedFormData.images_cleared_at
    })

  } catch (error) {
    console.error('❌ Error in clear-images endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}