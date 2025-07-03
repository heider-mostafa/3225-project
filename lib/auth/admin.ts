import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type UserRole = 'user' | 'admin' | 'super_admin'

export interface AdminUser {
  id: string
  email: string
  role: UserRole
  permissions: string[]
}

export type AdminAction = 
  | 'user_created'
  | 'user_updated' 
  | 'user_deleted'
  | 'role_granted'
  | 'role_revoked'
  | 'permission_granted'
  | 'permission_revoked'
  | 'property_created'
  | 'property_updated'
  | 'property_deleted'
  | 'inquiry_updated'
  | 'inquiry_deleted'
  | 'users_list_viewed'
  | 'users_page_accessed'
  | 'role_change'
  | 'settings_updated'
  | 'system_backup'
  | 'system_restore'

export type ResourceType = 'user' | 'property' | 'inquiry' | 'setting' | 'system' | 'page' | 'api'

/**
 * Enhanced server-side admin authorization with multiple security layers
 */
export async function isServerUserAdmin(cookieStore?: any): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()

    // Enhanced authorization check with multiple validation layers
    console.log('🔒 Server-side admin authorization check starting...')

    // Layer 1: Session validation
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.log('❌ No valid session found')
      return false
    }

    console.log('✅ Session validated for user:', session.user.email)

    // Layer 2: Primary role check using RPC function
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { 
      user_id_param: session.user.id 
    })

    if (rpcError) {
      console.error('⚠️ RPC admin check failed, using fallback method:', rpcError)
      
      // Layer 3: Fallback - Direct database query
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .in('role', ['admin', 'super_admin'])

      if (roleError) {
        console.error('❌ Fallback role check failed:', roleError)
        return false
      }

      const hasAdminRole = userRoles && userRoles.length > 0
      console.log('✅ Fallback check result:', hasAdminRole)
      return hasAdminRole
    }

    console.log('✅ RPC admin check result:', isAdmin)
    return isAdmin || false

  } catch (error) {
    console.error('❌ Exception in server admin check:', error)
    return false
  }
}

/**
 * Enhanced authorization with specific permission checking
 */
export async function hasServerPermission(
  permission: string, 
  cookieStore?: any,
  resourceId?: string
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    // Check if user has the specific permission
    const { data: hasPermission, error } = await supabase.rpc('has_permission', {
      permission_name: permission,
      user_id_param: session.user.id,
      resource_name: resourceId || null
    })

    if (error) {
      console.error('Permission check failed:', error)
      // Fallback to admin check for critical permissions
      if (permission.includes('users:') || permission.includes('system:')) {
        return await isServerUserAdmin(cookieStore)
      }
      return false
    }

    return hasPermission || false
  } catch (error) {
    console.error('Exception checking permission:', error)
    return false
  }
}

/**
 * Comprehensive authorization middleware for admin API routes
 */
export async function authorizeAdminRequest(
  request: NextRequest,
  requiredPermission?: string,
  resourceId?: string
): Promise<{ authorized: boolean; user?: AdminUser; error?: string }> {
  try {
    // Step 1: Basic admin check
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return { 
        authorized: false, 
        error: 'Admin access required' 
      }
    }

    // Step 2: Get user session for additional info
    const supabase = await createServerSupabaseClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { 
        authorized: false, 
        error: 'Invalid session' 
      }
    }

    // Step 3: Get user role and permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .order('role', { ascending: false })
      .limit(1)

    const userRole = userRoles?.[0]?.role || 'user'

    // Step 4: Check specific permission if required
    if (requiredPermission) {
      const hasPermission = await hasServerPermission(
        requiredPermission, 
        null, 
        resourceId
      )
      
      if (!hasPermission) {
        return { 
          authorized: false, 
          error: `Permission '${requiredPermission}' required` 
        }
      }
    }

    // Step 5: Additional security checks
    const userAgent = request.headers.get('user-agent') || ''
    const adminAction = request.headers.get('x-admin-action')
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown'
    
    // Log security-relevant access
    if (adminAction) {
      await logAdminActivity(
        'api_access' as AdminAction,
        'api',
        undefined,
        {
          action: adminAction,
          permission: requiredPermission,
          userAgent: userAgent,
          ip: clientIP
        },
        request
      )
    }

    return {
      authorized: true,
      user: {
        id: session.user.id,
        email: session.user.email || '',
        role: userRole as UserRole,
        permissions: [] // Could be populated with actual permissions if needed
      }
    }

  } catch (error) {
    console.error('Error in authorization check:', error)
    return { 
      authorized: false, 
      error: 'Authorization check failed' 
    }
  }
}

export async function getCurrentServerUserRole(cookieStore?: any): Promise<UserRole> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return 'user'

    const { data: role } = await supabase.rpc('get_user_role', {
      user_id_param: session.user.id
    })

    return role || 'user'
  } catch (error) {
    console.error('Error getting server user role:', error)
    return 'user'
  }
}

export async function grantAdminRole(
  userId: string,
  role: UserRole,
  grantedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    // Revoke existing roles
    await supabase
      .from('user_roles')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true)

    // Grant new role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        granted_by: grantedBy,
        is_active: true
      })

    if (error) {
      console.error('Error granting role:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception granting role:', error)
    return { success: false, error: 'Failed to grant role' }
  }
}

export async function logAdminActivity(
  action: AdminAction,
  resourceType: ResourceType,
  resourceId?: string,
  details?: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const logData = {
      admin_user_id: session.user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
      ip_address: request?.headers.get('x-forwarded-for') || 
                 request?.headers.get('x-real-ip') || 
                 request?.headers.get('cf-connecting-ip') || 
                 'unknown',
      user_agent: request?.headers.get('user-agent') || 'unknown'
    }

    await supabase
      .from('admin_activity_log')
      .insert(logData)

  } catch (error) {
    console.error('Error logging admin activity:', error)
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