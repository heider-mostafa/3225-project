-- Grant admin access to your user account
-- Replace the email with your actual login email

-- First, check what your user ID is
SELECT 'Your User Info' as info, id, email, created_at 
FROM auth.users 
WHERE email = 'mostafa.heider9@gmail.com';

-- Grant admin role to your user (replace email if different)
INSERT INTO user_roles (user_id, role, is_active, granted_by)
SELECT 
  u.id,
  'admin'::user_role,
  true,
  u.id  -- Self-granted for initial setup
FROM auth.users u
WHERE u.email = 'mostafa.heider9@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- Verify the role was granted
SELECT 'Admin Role Granted' as result, u.email, ur.role, ur.is_active, ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'mostafa.heider9@gmail.com';