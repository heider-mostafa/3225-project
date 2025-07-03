import { NextResponse } from 'next/server';
import { PropertyCache } from '@/lib/redis';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// API endpoint to clear property search cache when properties are updated
// This should be called whenever properties are added, updated, or deleted

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check if user is admin (only admins can clear cache)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body to see what to clear
    const body = await request.json().catch(() => ({}));
    const { type, propertyId } = body;

    let clearCount = 0;

    if (type === 'property' && propertyId) {
      // Clear specific property cache
      await PropertyCache.clearPropertyCache(propertyId);
      clearCount = 1;
      console.log(`🗑️ Cleared cache for property: ${propertyId}`);
    } else {
      // Clear all property search cache
      await PropertyCache.clearSearchCache();
      clearCount = 999; // Placeholder for "all search cache"
      console.log('🗑️ Cleared all property search cache');
    }

    return NextResponse.json({
      success: true,
      message: `Cache cleared successfully`,
      type: type || 'all',
      propertyId: propertyId || null,
      estimatedKeysCleared: clearCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear cache', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Health check for cache system
export async function GET() {
  try {
    // Simple ping to check if Redis is working
    const startTime = Date.now();
    await PropertyCache.get('health-check');
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      cacheProvider: 'upstash-redis'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}