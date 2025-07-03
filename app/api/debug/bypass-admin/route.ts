import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Set a debug flag that temporarily grants admin access
    cookieStore.set('debug_admin_bypass', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({
      success: true,
      message: 'Debug admin bypass enabled for 24 hours'
    })

  } catch (error) {
    console.error('Error setting debug bypass:', error)
    return NextResponse.json(
      { error: 'Failed to set debug bypass' },
      { status: 500 }
    )
  }
}