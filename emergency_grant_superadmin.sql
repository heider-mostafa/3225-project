-- ================================================================
-- EMERGENCY SUPER ADMIN GRANT SCRIPT
-- This script will guarantee super admin access regardless of constraints
-- ================================================================

-- Step 1: Get your user ID (replace YOUR_EMAIL with your actual email)
-- Run this first to get your user_id:
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'mostafa.heider@umontreal.ca';  -- Replace with your email

-- Copy the 'id' from the result above, then use it in the script below
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID

-- ================================================================
-- MAIN SCRIPT: Replace YOUR_USER_ID_HERE with your actual UUID
-- ================================================================

DO $$
DECLARE
    target_user_id UUID := 'YOUR_USER_ID_HERE';  -- REPLACE THIS WITH YOUR USER ID
    existing_role_id UUID;
BEGIN
    -- Step 1: Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
    END IF;

    -- Step 2: Deactivate any existing super_admin roles for this user
    UPDATE user_roles 
    SET is_active = false, 
        revoked_at = NOW()
    WHERE user_id = target_user_id 
      AND role = 'super_admin' 
      AND is_active = true;
    
    RAISE NOTICE 'Deactivated % existing super_admin roles', ROW_COUNT();

    -- Step 3: Check if there's already an inactive super_admin role we can reactivate
    SELECT id INTO existing_role_id
    FROM user_roles 
    WHERE user_id = target_user_id 
      AND role = 'super_admin'
      AND is_active = false
    LIMIT 1;

    IF existing_role_id IS NOT NULL THEN
        -- Reactivate existing role
        UPDATE user_roles 
        SET is_active = true,
            revoked_at = NULL,
            granted_at = NOW(),
            granted_by = target_user_id
        WHERE id = existing_role_id;
        
        RAISE NOTICE 'Reactivated existing super_admin role with ID: %', existing_role_id;
    ELSE
        -- Create new super_admin role
        INSERT INTO user_roles (
            user_id, 
            role, 
            granted_by, 
            granted_at, 
            is_active
        ) VALUES (
            target_user_id,
            'super_admin',
            target_user_id,
            NOW(),
            true
        );
        
        RAISE NOTICE 'Created new super_admin role for user: %', target_user_id;
    END IF;

    -- Step 4: Verify the grant worked
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = target_user_id 
          AND role = 'super_admin' 
          AND is_active = true
    ) THEN
        RAISE NOTICE '✅ SUCCESS: Super admin role is now active for user: %', target_user_id;
    ELSE
        RAISE EXCEPTION '❌ FAILED: Could not grant super admin role';
    END IF;

END $$;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Run these to verify the script worked:

-- 1. Check your current roles
SELECT ur.*, u.email 
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'mostafa.heider@umontreal.ca'  -- Replace with your email
ORDER BY ur.created_at DESC;

-- 2. Test the is_admin function
SELECT is_admin('YOUR_USER_ID_HERE');  -- Replace with your user ID

-- 3. Check if you can access admin functions
SELECT has_permission('users:read', 'YOUR_USER_ID_HERE');  -- Replace with your user ID

-- ================================================================
-- ALTERNATIVE: If the above fails, use this NUCLEAR OPTION
-- ================================================================

-- ONLY USE THIS IF THE ABOVE SCRIPT FAILS
-- This bypasses all constraints and directly manipulates the table

/*
-- First, get your user ID:
SELECT id FROM auth.users WHERE email = 'mostafa.heider@umontreal.ca';

-- Then delete ANY existing roles for your user:
DELETE FROM user_roles WHERE user_id = 'YOUR_USER_ID_HERE';

-- Force insert new super_admin role:
INSERT INTO user_roles (
    id,
    user_id, 
    role, 
    granted_by, 
    granted_at, 
    is_active
) VALUES (
    gen_random_uuid(),
    'YOUR_USER_ID_HERE',  -- Replace with your user ID
    'super_admin',
    'YOUR_USER_ID_HERE',  -- Replace with your user ID
    NOW(),
    true
) ON CONFLICT DO NOTHING;
*/

-- ================================================================
-- QUICK ONE-LINER (if you just want to force it)
-- ================================================================

-- Replace YOUR_EMAIL and run this single line:
/*
INSERT INTO user_roles (user_id, role, granted_by, granted_at, is_active) 
SELECT id, 'super_admin', id, NOW(), true 
FROM auth.users 
WHERE email = 'mostafa.heider@umontreal.ca'
ON CONFLICT DO NOTHING;
*/ 