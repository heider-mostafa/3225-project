import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get compound_id filter - required for non-admin users
    const compoundId = searchParams.get('compound_id');
    
    // Check user permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isResident = userRoles?.some((role: UserRole) => 
      ['resident_owner', 'resident_tenant'].includes(role.role)
    );

    // Get user's compound access
    const { data: userResident } = isResident ? await supabase
      .from('compound_residents')
      .select('compound_id:community_units(compound_id)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single() : { data: null };

    if (!compoundId && !hasAdminAccess) {
      // For residents, default to their compound
      if (isResident && userResident?.compound_id) {
        // Use resident's compound
      } else {
        return NextResponse.json({ 
          error: 'compound_id is required' 
        }, { status: 400 });
      }
    }

    // Verify access to compound
    if (compoundId) {
      const { data: compound } = await supabase
        .from('compounds')
        .select('developer_id, compound_manager_user_id')
        .eq('id', compoundId)
        .single();

      if (!compound) {
        return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
      }

      if (!hasAdminAccess) {
        const canAccess = userRoles?.some((role: UserRole) => 
          (role.role === 'developer' && role.developer_id === compound.developer_id) ||
          (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id) ||
          (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === compoundId)
        );

        if (!canAccess) {
          return NextResponse.json({ 
            error: 'Access denied to this compound' 
          }, { status: 403 });
        }
      }
    }

    let query = supabase
      .from('community_announcements')
      .select(`
        id,
        compound_id,
        title,
        content,
        announcement_type,
        priority,
        target_audience,
        is_published,
        is_active,
        publish_at,
        expires_at,
        image_urls,
        action_button_text,
        action_button_url,
        view_count,
        created_by_user_id,
        created_at,
        updated_at,
        compounds (
          id,
          name,
          address
        ),
        user_profiles!community_announcements_created_by_user_id_fkey (
          id,
          full_name,
          profile_photo_url
        )
      `, { count: 'exact' });

    // Apply compound filter
    if (compoundId) {
      query = query.eq('compound_id', compoundId);
    } else if (isResident && userResident?.compound_id) {
      query = query.eq('compound_id', userResident.compound_id);
    }

    // For residents, only show published and active announcements
    if (isResident && !hasAdminAccess) {
      const now = new Date().toISOString();
      query = query
        .eq('is_published', true)
        .eq('is_active', true)
        .lte('publish_at', now)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
    }

    // Apply filters
    const announcementType = searchParams.get('announcement_type');
    const priority = searchParams.get('priority');
    const targetAudience = searchParams.get('target_audience');
    const isPublished = searchParams.get('is_published');
    const isActive = searchParams.get('is_active');

    if (announcementType) {
      query = query.eq('announcement_type', announcementType);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (targetAudience) {
      query = query.eq('target_audience', targetAudience);
    }

    if (isPublished !== null && !isResident) {
      query = query.eq('is_published', isPublished === 'true');
    }

    if (isActive !== null && !isResident) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'publish_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? { ascending: true } : { ascending: false };

    switch (sortBy) {
      case 'publish_at':
        query = query.order('publish_at', sortOrder);
        break;
      case 'priority':
        // Sort by priority: emergency, high, medium, low
        query = query.order('priority', { ascending: false });
        break;
      case 'title':
        query = query.order('title', sortOrder);
        break;
      case 'view_count':
        query = query.order('view_count', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('publish_at', { ascending: false });
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: announcements, error, count } = await query;

    if (error) {
      console.error('Announcements fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      announcements: announcements || [],
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      compound_id,
      title,
      content,
      announcement_type,
      priority,
      target_audience,
      is_published,
      publish_at,
      expires_at,
      image_urls,
      action_button_text,
      action_button_url
    } = body;

    // Validate required fields
    if (!compound_id || !title || !content) {
      return NextResponse.json({ 
        error: 'compound_id, title, and content are required' 
      }, { status: 400 });
    }

    // Check user permissions
    const { data: compound } = await supabase
      .from('compounds')
      .select('developer_id, compound_manager_user_id')
      .eq('id', compound_id)
      .single();

    if (!compound) {
      return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const canCreateAnnouncement = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === compound.developer_id) ||
        (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id)
      );

    if (!canCreateAnnouncement) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to create announcements for this compound' 
      }, { status: 403 });
    }

    // Validate announcement type
    const validTypes = [
      'general', 'maintenance', 'emergency', 'event', 'policy', 'payment', 'amenity', 'security'
    ];
    
    if (announcement_type && !validTypes.includes(announcement_type)) {
      return NextResponse.json({ 
        error: `Invalid announcement type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'emergency'];
    const announcementPriority = priority || 'medium';
    
    if (!validPriorities.includes(announcementPriority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      }, { status: 400 });
    }

    // Validate target audience
    const validAudiences = ['all', 'owners', 'tenants', 'residents', 'staff'];
    const targetAud = target_audience || 'all';
    
    if (!validAudiences.includes(targetAud)) {
      return NextResponse.json({ 
        error: `Invalid target audience. Must be one of: ${validAudiences.join(', ')}` 
      }, { status: 400 });
    }

    // Set publish time
    const publishTime = publish_at || new Date().toISOString();
    const publishDate = new Date(publishTime);
    
    if (isNaN(publishDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid publish_at date format' 
      }, { status: 400 });
    }

    // Validate expiry date if provided
    let expiryDate = null;
    if (expires_at) {
      expiryDate = new Date(expires_at);
      if (isNaN(expiryDate.getTime()) || expiryDate <= publishDate) {
        return NextResponse.json({ 
          error: 'Expiry date must be after publish date' 
        }, { status: 400 });
      }
    }

    // Create announcement
    const { data: announcement, error: announcementError } = await supabase
      .from('community_announcements')
      .insert({
        compound_id,
        title,
        content,
        announcement_type: announcement_type || 'general',
        priority: announcementPriority,
        target_audience: targetAud,
        is_published: is_published !== false, // Default to true
        is_active: true,
        publish_at: publishTime,
        expires_at: expires_at || null,
        image_urls: image_urls || [],
        action_button_text,
        action_button_url,
        view_count: 0,
        created_by_user_id: user.id
      })
      .select(`
        id,
        compound_id,
        title,
        content,
        announcement_type,
        priority,
        target_audience,
        is_published,
        is_active,
        publish_at,
        expires_at,
        image_urls,
        action_button_text,
        action_button_url,
        view_count,
        created_by_user_id,
        created_at,
        updated_at,
        compounds (
          id,
          name
        ),
        user_profiles!community_announcements_created_by_user_id_fkey (
          full_name
        )
      `)
      .single();

    if (announcementError) {
      console.error('Announcement creation error:', announcementError);
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }

    // TODO: Send push notifications to residents based on target_audience
    // TODO: If emergency priority, send immediate notifications
    // TODO: Log announcement creation for analytics

    return NextResponse.json({
      success: true,
      announcement,
      message: is_published !== false 
        ? 'Announcement published successfully' 
        : 'Announcement saved as draft'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}