-- Add admin system to existing authentication
-- Extend auth.users with roles and permissions

-- Create roles enum
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Add role column to auth.users metadata (using user_metadata)
-- This is handled in the application layer, but we'll create helper functions

-- Create user_roles table for more complex role management
CREATE TABLE user_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create admin_permissions table
CREATE TABLE admin_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  resource TEXT,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);

-- Create partial unique index for active user roles (replaces the table constraint)
CREATE UNIQUE INDEX idx_user_roles_unique_active 
ON user_roles(user_id, role) 
WHERE is_active = true;

CREATE INDEX idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX idx_admin_permissions_permission ON admin_permissions(permission);
CREATE INDEX idx_admin_permissions_active ON admin_permissions(is_active);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Super admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Users can view their own permissions"
  ON admin_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions"
  ON admin_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_id_param UUID)
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SELECT role INTO user_role_result
  FROM user_roles
  WHERE user_id = user_id_param
  AND is_active = true
  ORDER BY 
    CASE 
      WHEN role = 'super_admin' THEN 1
      WHEN role = 'admin' THEN 2
      WHEN role = 'user' THEN 3
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role_result, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id_param
    AND role IN ('admin', 'super_admin')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(
  permission_name TEXT,
  user_id_param UUID DEFAULT auth.uid(),
  resource_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins have all permissions
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id_param
    AND role = 'super_admin'
    AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  -- Check specific permission
  RETURN EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE user_id = user_id_param
    AND permission = permission_name
    AND (resource_name IS NULL OR resource = resource_name)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default super admin (replace with your email)
-- You'll need to update this with the actual user ID after creating the account
-- INSERT INTO user_roles (user_id, role, granted_by)
-- VALUES ('YOUR_USER_ID_HERE', 'super_admin', 'YOUR_USER_ID_HERE');

-- Create admin activity log
CREATE TABLE admin_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX idx_admin_activity_log_created_at ON admin_activity_log(created_at);

-- Enable RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for admin activity log
CREATE POLICY "Admins can view activity log"
  ON admin_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "System can insert activity log"
  ON admin_activity_log FOR INSERT
  WITH CHECK (true); 