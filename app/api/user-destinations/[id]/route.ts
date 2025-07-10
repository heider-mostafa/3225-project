/**
 * =============================================================================
 * USER DESTINATIONS API - DELETE OPERATION
 * =============================================================================
 * 
 * PURPOSE:
 * Handles deletion of specific user destinations by ID. Allows users to remove
 * personal places from their lifestyle compatibility analysis.
 *
 * ENDPOINTS:
 * • DELETE /api/user-destinations/[id] - Delete specific destination by ID
 *
 * FEATURES:
 * • Secure deletion with user ownership verification
 * • Automatic cleanup of related commute data (via database cascading)
 * • Authentication required for all operations
 *
 * INTEGRATES WITH:
 * • user_destinations table in Supabase
 * • commute_data table (automatically cleaned via foreign key cascade)
 * • LifestyleCompatibilityTool component (triggers deletion)
 *
 * SECURITY:
 * • Requires user authentication
 * • Double verification: RLS + explicit user_id check
 * • Only allows users to delete their own destinations
 *
 * USAGE:
 * Called when user clicks "Remove" button on destination cards
 * in the LifestyleCompatibilityTool component
 * =============================================================================
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('user_destinations')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting destination:', error)
      return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/user-destinations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 