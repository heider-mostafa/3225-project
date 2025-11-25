import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const announcementId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get announcement details
    const { data: announcement, error } = await supabase
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
          address,
          developer_id,
          compound_manager_user_id
        ),
        user_profiles!community_announcements_created_by_user_id_fkey (
          id,
          full_name,
          profile_photo_url
        )
      `)
      .eq('id', announcementId)
      .single();

    if (error || !announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check user access permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const hasAnnouncementAccess = hasAdminAccess || 
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === announcement.compounds.developer_id) ||
        (role.role === 'compound_manager' && announcement.compounds.compound_manager_user_id === user.id) ||
        (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === announcement.compound_id)
      );

    if (!hasAnnouncementAccess) {
      return NextResponse.json({ error: 'Access denied to this announcement' }, { status: 403 });
    }

    // For residents, check if announcement is published and active
    const isResident = userRoles?.some((role: UserRole) => 
      ['resident_owner', 'resident_tenant'].includes(role.role)
    );

    if (isResident && !hasAdminAccess) {
      const now = new Date();
      const publishDate = new Date(announcement.publish_at);
      const expiryDate = announcement.expires_at ? new Date(announcement.expires_at) : null;

      if (!announcement.is_published || 
          !announcement.is_active || 
          publishDate > now || 
          (expiryDate && expiryDate <= now)) {
        return NextResponse.json({ error: 'Announcement not available' }, { status: 404 });
      }

      // Increment view count for residents viewing the announcement
      const { error: updateError } = await supabase
        .from('community_announcements')
        .update({ view_count: announcement.view_count + 1 })
        .eq('id', announcementId);

      if (!updateError) {
        announcement.view_count += 1;
      }
    }

    return NextResponse.json({
      success: true,
      announcement
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const announcementId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get existing announcement to verify permissions
    const { data: existingAnnouncement } = await supabase
      .from('community_announcements')
      .select(`
        id,
        compound_id,
        created_by_user_id,
        compounds (
          developer_id,
          compound_manager_user_id
        )
      `)
      .eq('id', announcementId)
      .single();

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const canUpdateAnnouncement = hasAdminAccess ||
      existingAnnouncement.created_by_user_id === user.id ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === existingAnnouncement.compounds.developer_id) ||
        (role.role === 'compound_manager' && existingAnnouncement.compounds.compound_manager_user_id === user.id)
      );

    if (!canUpdateAnnouncement) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to update this announcement' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
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
      action_button_url
    } = body;

    // Build update object with only provided fields
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (announcement_type !== undefined) updateData.announcement_type = announcement_type;
    if (priority !== undefined) updateData.priority = priority;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (is_published !== undefined) updateData.is_published = is_published;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (publish_at !== undefined) updateData.publish_at = publish_at;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (image_urls !== undefined) updateData.image_urls = image_urls;
    if (action_button_text !== undefined) updateData.action_button_text = action_button_text;
    if (action_button_url !== undefined) updateData.action_button_url = action_button_url;

    // Validate announcement type if provided
    if (updateData.announcement_type) {
      const validTypes = [
        'general', 'maintenance', 'emergency', 'event', 'policy', 'payment', 'amenity', 'security'
      ];
      
      if (!validTypes.includes(updateData.announcement_type)) {
        return NextResponse.json({ 
          error: `Invalid announcement type. Must be one of: ${validTypes.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate priority if provided
    if (updateData.priority) {
      const validPriorities = ['low', 'medium', 'high', 'emergency'];
      
      if (!validPriorities.includes(updateData.priority)) {
        return NextResponse.json({ 
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate target audience if provided
    if (updateData.target_audience) {
      const validAudiences = ['all', 'owners', 'tenants', 'residents', 'staff'];
      
      if (!validAudiences.includes(updateData.target_audience)) {
        return NextResponse.json({ 
          error: `Invalid target audience. Must be one of: ${validAudiences.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate dates if provided
    if (updateData.publish_at) {
      const publishDate = new Date(updateData.publish_at);
      if (isNaN(publishDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid publish_at date format' 
        }, { status: 400 });
      }
    }

    if (updateData.expires_at) {
      const expiryDate = new Date(updateData.expires_at);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid expires_at date format' 
        }, { status: 400 });
      }

      // Check if expiry is after publish date (if both are being updated)
      if (updateData.publish_at) {
        const publishDate = new Date(updateData.publish_at);
        if (expiryDate <= publishDate) {
          return NextResponse.json({ 
            error: 'Expiry date must be after publish date' 
          }, { status: 400 });
        }
      }
    }

    // Update announcement
    const { data: updatedAnnouncement, error: updateError } = await supabase
      .from('community_announcements')
      .update(updateData)
      .eq('id', announcementId)
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
        )
      `)
      .single();

    if (updateError) {
      console.error('Announcement update error:', updateError);
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
    }

    // TODO: Send notifications if announcement was just published or priority changed
    // TODO: Log announcement changes for audit trail

    return NextResponse.json({
      success: true,
      announcement: updatedAnnouncement,
      message: 'Announcement updated successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const announcementId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get existing announcement to verify permissions
    const { data: existingAnnouncement } = await supabase
      .from('community_announcements')
      .select(`
        id,
        compound_id,
        title,
        created_by_user_id,
        compounds (
          developer_id,
          compound_manager_user_id
        )
      `)
      .eq('id', announcementId)
      .single();

    if (!existingAnnouncement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check permissions (only super admins, creators, or compound managers can delete)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isSuperAdmin = userRoles?.some((role: UserRole) => role.role === 'super_admin');
    const isCreator = existingAnnouncement.created_by_user_id === user.id;
    const isCompoundManager = userRoles?.some((role: UserRole) => 
      role.role === 'compound_manager' && 
      existingAnnouncement.compounds.compound_manager_user_id === user.id
    );

    if (!isSuperAdmin && !isCreator && !isCompoundManager) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to delete this announcement' 
      }, { status: 403 });
    }

    // Soft delete (set is_active = false)
    const { data: deletedAnnouncement, error: deleteError } = await supabase
      .from('community_announcements')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', announcementId)
      .select('id, title')
      .single();

    if (deleteError) {
      console.error('Announcement deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Announcement "${existingAnnouncement.title}" deleted successfully`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}