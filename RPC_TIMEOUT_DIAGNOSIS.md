# RPC Timeout Diagnosis Guide

## Problem
The `get_user_profile` RPC call is timing out after 5 seconds, indicating the function may not exist, have wrong permissions, or there's a network issue.

## Quick Fix Steps

### Step 1: Verify Function Exists in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
```sql
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'get_user_profile';
```

**Expected Result:** Should return the function definition
**If Empty:** Function doesn't exist - run `SUPABASE_FUNCTIONS.sql`

### Step 2: Check Function Permissions
Run this query:
```sql
SELECT 
  p.proname as function_name,
  r.rolname as role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.proname = 'get_user_profile'
  AND r.rolname IN ('anon', 'authenticated');
```

**Expected Result:** Both `anon` and `authenticated` should have `can_execute = true`
**If False:** Run the GRANT statements from `SUPABASE_FUNCTIONS.sql`

### Step 3: Test Function Manually
Run this in SQL Editor (replace with your user ID):
```sql
SELECT * FROM get_user_profile('e048b796-b3cf-4ab6-9fb3-6b8ef691fa43');
```

**Expected Result:** Should return user profile data
**If Error:** Check the error message - it will tell you what's wrong

### Step 4: Check if User Profile Exists
Run this query:
```sql
SELECT * FROM public.users WHERE id = 'e048b796-b3cf-4ab6-9fb3-6b8ef691fa43';
```

**Expected Result:** Should return user record
**If Empty:** Profile doesn't exist - check if trigger is working

### Step 5: Verify Trigger Exists
Run this query:
```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created_profile';
```

**Expected Result:** Should return trigger info
**If Empty:** Trigger doesn't exist - run the trigger creation SQL from `SUPABASE_FUNCTIONS.sql`

## Most Likely Issues

### Issue 1: Function Doesn't Exist
**Solution:** Run the entire `SUPABASE_FUNCTIONS.sql` file in Supabase SQL Editor

### Issue 2: Function Exists But No Permissions
**Solution:** Run these GRANT statements:
```sql
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
```

### Issue 3: Function Has Wrong Return Type
**Solution:** Check if function returns TABLE vs single row. The code handles both, but verify the function signature matches.

### Issue 4: User Profile Doesn't Exist
**Solution:** 
1. Check if trigger `on_auth_user_created_profile` exists
2. If not, create it using SQL from `SUPABASE_FUNCTIONS.sql`
3. For existing users without profiles, manually create them or use the metadata fallback (which the code now does)

## Console Log Interpretation

### If you see: "RPC timeout after 5 seconds"
- Function doesn't exist OR
- Function exists but has permission issues OR
- Network/connection issue

**Action:** Check Step 1 and Step 2 above

### If you see: "RPC error: function get_user_profile(uuid) does not exist"
- Function definitely doesn't exist

**Action:** Run `SUPABASE_FUNCTIONS.sql` in Supabase SQL Editor

### If you see: "RPC error: permission denied for function get_user_profile"
- Function exists but permissions are wrong

**Action:** Run GRANT statements from Step 2

### If you see: "Profile fetched via direct query"
- RPC failed but direct query worked (RLS is allowing it)
- This is acceptable - profile will load

### If you see: "Profile created from metadata"
- Profile didn't exist, but was created from auth metadata
- This is acceptable - profile will load

## Quick Fix Script

Run this complete script in Supabase SQL Editor to ensure everything is set up:

```sql
-- 1. Create/get_user_profile function
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  approved BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.phone,
    u.role,
    u.approved,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;

-- 3. Test the function (replace with your user ID)
-- SELECT * FROM get_user_profile('e048b796-b3cf-4ab6-9fb3-6b8ef691fa43');
```

## After Running Fix

1. Refresh your browser
2. Try logging in again
3. Check console - you should see either:
   - "Profile fetched via RPC" (success)
   - "Profile fetched via direct query" (fallback success)
   - "Profile created from metadata" (created successfully)
   - Specific error message (will tell you what's wrong)



