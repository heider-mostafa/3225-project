-- Quick Admin Status Check
-- Run this to verify your current admin access before we fix policies

SELECT 
    'CURRENT ADMIN STATUS' as check_type,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as your_email,
    (SELECT COUNT(*) FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true) as your_admin_roles,
    (SELECT COUNT(*) FROM admin_permissions WHERE user_id = auth.uid() AND is_active = true) as your_admin_permissions;

-- Test property access
SELECT 
    'PROPERTY ACCESS TEST' as test_type,
    COUNT(*) as properties_you_can_see
FROM properties;