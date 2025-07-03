import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// DELETE /api/admin/broker-availability/[id] - Delete availability slot (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const slotId = resolvedParams.id;

    if (!slotId) {
      return NextResponse.json({
        error: 'Slot ID is required'
      }, { status: 400 })
    }

    // Use service role for admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Check if slot exists first
    const { data: existingSlot, error: checkError } = await supabase
      .from('broker_availability')
      .select('id, broker_id, current_bookings')
      .eq('id', slotId)
      .single()

    if (checkError || !existingSlot) {
      return NextResponse.json({ 
        error: 'Availability slot not found' 
      }, { status: 404 })
    }

    // Check if there are existing bookings
    if (existingSlot.current_bookings > 0) {
      return NextResponse.json({
        error: `Cannot delete availability slot with ${existingSlot.current_bookings} existing booking(s). Please cancel bookings first.`
      }, { status: 409 })
    }

    // Delete the availability slot
    const { error: deleteError } = await supabase
      .from('broker_availability')
      .delete()
      .eq('id', slotId)

    if (deleteError) {
      console.error('Error deleting availability slot:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete availability slot: ' + deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Availability slot deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in delete broker availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}