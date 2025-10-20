# ROLLBACK STRATEGY - If Changes Break Something

## 🚨 IMMEDIATE ROLLBACK STEPS

If something breaks after running the policy changes, follow these steps:

### **Step 1: Run the Backup Script First**
```bash
# BEFORE making any changes, run this to create rollback scripts:
psql $DATABASE_URL -f backup_current_policies_before_changes.sql > policy_backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 2: Test After Each Change**
```bash
# After each policy fix, test functionality:
psql $DATABASE_URL -f test_functionality_after_changes.sql
```

### **Step 3: If Something Breaks - ROLLBACK**

#### **Option A: Quick Rollback (Manual)**
1. **Drop the new consolidated policy:**
   ```sql
   DROP POLICY IF EXISTS "consolidated_objects_access" ON storage.objects;
   DROP POLICY IF EXISTS "consolidated_appraisal_requests_access" ON appraisal_requests;
   DROP POLICY IF EXISTS "consolidated_appraiser_bookings_access" ON appraiser_bookings;
   ```

2. **Re-create the original policies from backup file**
   ```bash
   # Use the backup file created in Step 1
   psql $DATABASE_URL -f policy_backup_YYYYMMDD_HHMMSS.sql
   ```

#### **Option B: Automated Rollback Script**
```sql
-- EMERGENCY ROLLBACK - Run this if everything breaks

-- 1. Drop all our new consolidated policies
DROP POLICY IF EXISTS "consolidated_objects_access" ON storage.objects;
DROP POLICY IF EXISTS "consolidated_appraisal_requests_access" ON appraisal_requests;
DROP POLICY IF EXISTS "consolidated_appraiser_bookings_access" ON appraiser_bookings;

-- 2. Re-enable RLS if it was disabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_bookings ENABLE ROW LEVEL SECURITY;

-- 3. Restore minimal access (emergency only)
CREATE POLICY "emergency_admin_access" ON storage.objects FOR ALL TO public USING (is_admin(auth.uid()));
CREATE POLICY "emergency_admin_access" ON appraisal_requests FOR ALL TO public USING (is_admin(auth.uid()));
CREATE POLICY "emergency_admin_access" ON appraiser_bookings FOR ALL TO public USING (is_admin(auth.uid()));
```

## 🔄 SAFE EXECUTION STRATEGY

### **One Table at a Time**
1. **Start with appraiser_bookings** (smallest impact)
2. **Then appraisal_requests** (medium impact)  
3. **Finally storage.objects** (biggest impact)

### **Test Between Each Change**
```bash
# After each table fix:
psql $DATABASE_URL -f test_functionality_after_changes.sql

# If tests pass, continue to next table
# If tests fail, rollback immediately
```

## 🛡️ SAFETY CHECKS

### **Before Each Change:**
- [ ] Backup current policies created
- [ ] Current functionality tested and working
- [ ] Admin access confirmed working

### **After Each Change:**
- [ ] New policy created successfully  
- [ ] Basic table access still works
- [ ] Auth functions still work
- [ ] Policy count reduced as expected

## 📞 EMERGENCY CONTACTS

If rollback doesn't work:
1. **Disable RLS temporarily:** `ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;`
2. **Re-enable with basic admin policy:** `CREATE POLICY "temp_admin" ON tablename FOR ALL TO public USING (is_admin(auth.uid()));`
3. **Investigate and fix gradually**

## 🎯 SUCCESS CRITERIA

**Policy consolidation is successful when:**
- ✅ All functionality still works
- ✅ Policy count reduced (22→1, 6→1, 6→1)  
- ✅ No performance warnings in Supabase
- ✅ Users can still access their data
- ✅ Public pages still load correctly