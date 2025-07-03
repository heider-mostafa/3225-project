import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST /api/auth/password-reset - Request password reset
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single()

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (!userError && userData) {
      // Generate password reset token using our function
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_verification_token', {
          user_id_param: userData.id,
          token_type_param: 'password_reset',
          expires_in_hours: 2 // 2 hour expiry for password reset
        })

      if (!tokenError && tokenResult) {
        // In a real app, you would send an email here
        // For now, we'll just log the token (remove in production)
        console.log(`Password reset token for ${email}: ${tokenResult}`)
        
        // You can integrate with email service here:
        // await sendPasswordResetEmail(email, tokenResult)
        
        // Log the password reset request
        await supabase
          .from('user_activity_log')
          .insert({
            user_id: userData.id,
            activity_type: 'password_reset_request',
            entity_type: 'auth',
            entity_id: userData.id,
            activity_data: { email, requested_at: new Date().toISOString() }
          })
      }
    }

    return NextResponse.json({
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    })

  } catch (error) {
    console.error('Error requesting password reset:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/password-reset - Reset password with token
export async function PUT(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Verify the token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_verification_tokens')
      .select('user_id, expires_at, used_at')
      .eq('token', token)
      .eq('token_type', 'password_reset')
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (tokenData.used_at) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    // Update the user's password using Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark token as used
    await supabase
      .from('user_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    // Log the password reset completion
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: tokenData.user_id,
        activity_type: 'password_reset_complete',
        entity_type: 'auth',
        entity_id: tokenData.user_id,
        activity_data: { reset_at: new Date().toISOString() }
      })

    return NextResponse.json({
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 