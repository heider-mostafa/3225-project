import { supabase } from '@/lib/supabase/config'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'user' | 'admin' | 'super_admin'

export interface AdminUser extends User {
  role: UserRole
  permissions: string[]
}

// Client-side admin checks (for use in client components)
export async function getCurrentUserRole(): Promise<UserRole> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'user'

    const { data: role, error } = await supabase.rpc('get_user_role', { 
      user_id_param: user.id 
    })
    
    if (error) {
      console.error('Error getting user role:', error)
      return 'user'
    }
    
    return role || 'user'
  } catch (error) {
    console.error('Error in getCurrentUserRole:', error)
    return 'user'
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    // Check if user has any admin role directly from user_roles table
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .in('role', ['admin', 'super_admin'])

    if (error) {
      console.error('Error checking admin status:', error)
      
      // Fallback to RPC function
      const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { 
        user_id_param: session.user.id 
      })
      
      return isAdmin || false
    }
    
    // Return true if user has any admin role
    return (userRoles && userRoles.length > 0) || false
  } catch (error) {
    console.error('Error in isCurrentUserAdmin:', error)
    return false
  }
}

export async function isCurrentUserPhotographer(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    // Check if user has photographer role from user_roles table
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .eq('role', 'photographer')

    if (error) {
      console.error('Error checking photographer status:', error)
      return false
    }
    
    // Return true if user has photographer role
    return (userRoles && userRoles.length > 0) || false
  } catch (error) {
    console.error('Error in isCurrentUserPhotographer:', error)
    return false
  }
}

export async function hasCurrentUserPermission(
  permission: string, 
  resource?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: hasPermission, error } = await supabase.rpc('has_permission', {
      permission_name: permission,
      user_id_param: user.id,
      resource_name: resource || null
    })
    
    if (error) {
      console.error('Error checking permission:', error)
      return false
    }
    
    return hasPermission || false
  } catch (error) {
    console.error('Error in hasCurrentUserPermission:', error)
    return false
  }
}

// Client-side activity logging
export async function logAdminActivity(
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const activityData = {
      admin_user_id: user.id,
      action,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
      details: details || null,
      ip_address: null, // Client can't access IP
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
    }

    await supabase
      .from('admin_activity_log')
      .insert(activityData)

  } catch (error) {
    console.error('Error logging admin activity:', error)
  }
}

// Grant admin role (super admin only) - client version
export async function grantAdminRole(
  targetUserId: string, 
  role: UserRole = 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if current user is super admin
    const currentRole = await getCurrentUserRole()
    if (currentRole !== 'super_admin') {
      return { success: false, error: 'Insufficient permissions' }
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUserId,
        role,
        granted_by: user.id
      })

    if (error) {
      return { success: false, error: error.message }
    }

    await logAdminActivity(
      'grant_role',
      'user',
      targetUserId,
      { role, granted_by: user.id }
    )

    return { success: true }
  } catch (error) {
    console.error('Error granting admin role:', error)
    return { success: false, error: 'Internal error' }
  }
}

// Permission constants
export const ADMIN_PERMISSIONS = {
  // Property management
  PROPERTIES_CREATE: 'properties:create',
  PROPERTIES_READ: 'properties:read',
  PROPERTIES_UPDATE: 'properties:update',
  PROPERTIES_DELETE: 'properties:delete',
  
  // User management
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_ROLES: 'users:roles',
  
  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Inquiries
  INQUIRIES_READ: 'inquiries:read',
  INQUIRIES_UPDATE: 'inquiries:update',
  INQUIRIES_DELETE: 'inquiries:delete',
  
  // System
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_LOGS: 'system:logs',
} as const 