# Quick Fix: RPC Timeout Issue

## Problem
The `get_user_profile` RPC function is timing out, which means it either:
1. Doesn't exist in your Supabase database
2. Exists but lacks proper permissions
3. Has a network/connection issue

## Immediate Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run This SQL
Copy and paste this entire SQL block and run it:

```sql
-- Create get_user_profile function
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;

-- Verify it was created
SELECT proname, proargtypes 
FROM pg_proc 
WHERE proname = 'get_user_profile';
```

### Step 3: Test the Function
Run this to test (replace with your user ID):
```sql
SELECT * FROM get_user_profile('e048b796-b3cf-4ab6-9fb3-6b8ef691fa43');
```

### Step 4: Verify Users Table Exists
Run this to check if users table exists:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'users';
```

If the table doesn't exist, you need to create it first. Check your database schema.

### Step 5: Refresh Browser
After running the SQL:
1. Refresh your browser
2. Try logging in again
3. Check the console - you should see "Profile fetched via RPC" instead of timeout

## Alternative: Run Complete Setup

If you want to set up everything at once, run the entire `SUPABASE_FUNCTIONS.sql` file in the SQL Editor. This will create:
- `get_user_profile` function
- `get_user_email_by_phone` function  
- `create_enrolments` function
- `is_admin` function
- Auto-confirmation trigger
- User profile creation trigger

## What Happens After Fix

Once the function exists:
1. RPC call will succeed (no more timeout)
2. Profile will load immediately
3. User will be redirected to dashboard/admin
4. No more "Profile fetch timeout" errors

## If Still Not Working

1. **Check Function Permissions:**
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

Both should show `can_execute = true`

2. **Check if User Profile Exists:**
```sql
SELECT * FROM public.users WHERE id = 'e048b796-b3cf-4ab6-9fb3-6b8ef691fa43';
```

3. **Check RLS Policies:**
Go to Supabase Dashboard → Authentication → Policies → `users` table
Ensure there's a policy allowing users to SELECT their own profile.



