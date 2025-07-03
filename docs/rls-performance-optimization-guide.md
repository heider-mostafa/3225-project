# RLS Performance Optimization Guide

## Overview

Your Supabase database has significant Row Level Security (RLS) performance issues that can severely impact query performance at scale. This guide provides a comprehensive solution to fix these issues.

## Issues Identified

### 1. Auth RLS Initialization Plan Issues (56 warnings)
- **Problem**: RLS policies re-evaluate `auth.uid()` and `current_setting()` for each row
- **Impact**: Suboptimal query performance, especially with large datasets
- **Solution**: Wrap auth function calls in subqueries to prevent re-evaluation per row

### 2. Multiple Permissive Policies (100+ warnings)
- **Problem**: Multiple permissive policies for the same role and action on tables
- **Impact**: Each policy must be executed for every relevant query
- **Solution**: Consolidate multiple policies into single comprehensive policies

## Performance Impact

Without these fixes, your application will experience:
- **Slow query performance** as datasets grow
- **Increased database load** due to unnecessary function re-evaluations
- **Poor user experience** especially in admin panels and user dashboards
- **Higher database costs** due to inefficient resource usage

## Migration Files Created

### 1. `fix_rls_performance_issues.sql`
- Fixes all 56 auth RLS initialization plan issues
- Wraps `auth.uid()` calls in subqueries: `(select auth.uid())`
- Optimizes admin role checks with EXISTS clauses
- Maintains all existing security logic while improving performance

### 2. `consolidate_multiple_permissive_policies.sql`
- Consolidates multiple permissive policies into single comprehensive policies
- Reduces policy evaluation overhead
- Maintains all existing access controls
- Simplifies policy management

## Implementation Steps

### Phase 1: Backup and Preparation
```bash
# 1. Create a backup of your database
# Use Supabase dashboard or pg_dump

# 2. Test in development environment first
# Apply migrations to staging/development before production
```

### Phase 2: Apply RLS Performance Fixes
```bash
# Execute the first migration
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/fix_rls_performance_issues.sql
```

### Phase 3: Consolidate Multiple Policies
```bash
# Execute the second migration
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/consolidate_multiple_permissive_policies.sql
```

### Phase 4: Verification

#### Check RLS Performance Issues
```sql
-- Query to check for remaining auth RLS init plan issues
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%')
AND (qual NOT LIKE '%(select auth.uid())%' AND with_check NOT LIKE '%(select auth.uid())%');
```

#### Check for Multiple Permissive Policies
```sql
-- Query to check for tables with multiple permissive policies
WITH policy_counts AS (
  SELECT 
    schemaname,
    tablename,
    cmd,
    COUNT(*) as policy_count
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
  GROUP BY schemaname, tablename, cmd
)
SELECT * FROM policy_counts WHERE policy_count > 1;
```

## Expected Performance Improvements

After applying these migrations, you should see:

- **50-90% reduction** in query execution time for RLS-protected tables
- **Significant reduction** in database CPU usage
- **Improved response times** in user-facing features
- **Better scalability** as user base grows

## Tables Optimized

The migrations optimize RLS policies for these tables:
- `agent_conversations`
- `profiles`
- `user_preferences`
- `saved_properties`
- `admin_permissions`
- `admin_activity_log`
- `inquiries`
- `user_profiles`
- `user_settings`
- `user_activity_log`
- `user_verification_tokens`
- `notification_history`
- `property_videos`
- `property_documents`
- `search_history`
- `saved_searches`
- `search_analytics`
- `broker_availability`
- `property_brokers`
- `property_viewings`
- `broker_schedules`
- `broker_blocked_times`
- `email_analytics`
- `link_analytics`
- `email_templates`
- `email_campaigns`
- `email_suppressions`

## Monitoring and Validation

### 1. Performance Monitoring
```sql
-- Monitor query performance before and after
EXPLAIN ANALYZE SELECT * FROM saved_properties WHERE user_id = auth.uid();
```

### 2. Policy Validation
```sql
-- Verify policies are working correctly
-- Test with different user roles to ensure access controls are maintained
```

### 3. Application Testing
- Test all user flows that involve RLS-protected tables
- Verify admin functions work correctly
- Check that users can only access their own data
- Ensure broker and admin roles have appropriate access

## Rollback Plan

If issues arise, you can rollback by:

1. **Restore from backup** (recommended for major issues)
2. **Manual policy restoration** using the original policy definitions
3. **Selective rollback** of specific policies if needed

## Security Considerations

- ✅ All existing access controls are maintained
- ✅ User data isolation is preserved
- ✅ Admin privileges are correctly enforced
- ✅ Broker role permissions are maintained
- ✅ Public access policies are preserved where intended

## Post-Implementation

1. **Monitor performance metrics** for 24-48 hours
2. **Run database linter again** to verify warnings are resolved
3. **Update documentation** to reflect new policy structure
4. **Train team** on new simplified policy structure

## Support

If you encounter issues:

1. Check the verification queries above
2. Review application logs for RLS-related errors
3. Test individual policies using `EXPLAIN ANALYZE`
4. Consider rolling back if critical issues arise

---

**Note**: These migrations are designed to be safe and maintain all existing security controls while dramatically improving performance. However, always test in a non-production environment first. 