import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding photographers...')
    
    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Insert sample photographers
    const photographers = [
      {
        email: 'ahmed.photographer@gmail.com',
        name: 'Ahmed Photographer',
        phone: '+201012345678',
        preferred_areas: ['New Cairo', 'Heliopolis'],
        equipment: 'Insta360 X5',
        rating: 4.8
      },
      {
        email: 'sara.photographer@gmail.com',
        name: 'Sara Photographer',
        phone: '+201087654321',
        preferred_areas: ['Zamalek', 'Maadi', 'Giza'],
        equipment: 'Insta360 X5',
        rating: 4.9
      },
      {
        email: 'omar.photographer@gmail.com',
        name: 'Omar Photographer',
        phone: '+201555666777',
        preferred_areas: ['6th October', 'Sheikh Zayed'],
        equipment: 'Insta360 X5',
        rating: 4.7
      },
      {
        email: 'layla.photographer@gmail.com',
        name: 'Layla Photographer',
        phone: '+201234567890',
        preferred_areas: ['New Cairo', 'Maadi'],
        equipment: 'Insta360 X5',
        rating: 4.6
      }
    ]

    const results = []
    
    for (const photographer of photographers) {
      const { data, error } = await supabase
        .from('photographers')
        .upsert(photographer, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error inserting ${photographer.name}:`, error)
        results.push({ photographer: photographer.name, error: error.message })
      } else {
        console.log(`✅ Inserted ${photographer.name}`)
        results.push({ photographer: photographer.name, success: true, id: data?.id })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Photographers seeded',
      results
    })

  } catch (error) {
    console.error('❌ Exception seeding photographers:', error)
    return NextResponse.json(
      { error: 'Failed to seed photographers', details: (error as Error).message },
      { status: 500 }
    )
  }
}