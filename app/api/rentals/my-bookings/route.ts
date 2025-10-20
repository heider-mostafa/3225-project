import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's rental bookings using the view we created
    const { data: bookings, error: bookingsError } = await supabase
      .from('guest_rental_bookings')
      .select('*')
      .eq('guest_user_id', user.id)
      .order('check_in_date', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching rental bookings:', bookingsError)
      return NextResponse.json({ 
        error: 'Failed to fetch rental bookings',
        details: bookingsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      bookings: bookings || [],
      count: bookings?.length || 0
    })

  } catch (error) {
    console.error('Error in /api/rentals/my-bookings:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}