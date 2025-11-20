# Step-by-Step Fix for RPC Timeout

## The Problem
Your Supabase database is missing the `get_user_profile` function. This is why you're seeing timeout errors.

## Solution: Create the Function in Supabase

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Create New Query
1. Click **"New query"** button (top right)
2. You'll see a blank SQL editor

### Step 3: Copy and Paste This SQL
Copy this ENTIRE block and paste it into the SQL editor:

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

-- Grant execute permissions (CRITICAL - without this, function won't work)
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
```

### Step 4: Run the SQL
1. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
2. You should see "Success. No rows returned" or similar success message

### Step 5: Verify It Worked
Run this verification query:

```sql
SELECT proname, proargtypes 
FROM pg_proc 
WHERE proname = 'get_user_profile';
```

**Expected Result:** Should return 1 row showing the function exists

### Step 6: Test the Function
Test it with your user ID (replace with your actual user ID):

```sql
SELECT * FROM get_user_profile('e048b796-b3cf-4ab6-9fb3-6b8ef691fa43');
```

**Expected Result:** Should return your user profile data (or empty if profile doesn't exist yet)

### Step 7: Refresh Your Browser
1. Go back to your application
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. Try logging in again

### Step 8: Check Console
You should now see:
- ✅ "Profile fetched via RPC" (instead of timeout)
- ✅ Profile loads successfully
- ✅ No more timeout errors

## If You Still See Errors

### Error: "relation 'public.users' does not exist"
**Meaning:** The `users` table doesn't exist

**Fix:** You need to create the users table first. Check your database schema or run your migration files.

### Error: "permission denied for function get_user_profile"
**Meaning:** Permissions weren't granted correctly

**Fix:** Run the GRANT statements again:
```sql
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
```

### Error: "function get_user_profile(uuid) does not exist"
**Meaning:** Function wasn't created

**Fix:** 
1. Check for typos in the SQL
2. Make sure you ran the CREATE FUNCTION statement
3. Try running it again

## Complete Setup (All Functions)

If you want to set up ALL required functions at once, run the entire `SUPABASE_FUNCTIONS.sql` file. This includes:
- `get_user_profile` ✅
- `get_user_email_by_phone` (for phone login)
- `create_enrolments` (for registration)
- `is_admin` (for admin checks)
- Triggers for auto-confirmation and profile creation

## Quick Test After Fix

After running the SQL, test in browser console:
1. Open browser console (F12)
2. Try logging in
3. Look for: `"Profile fetched via RPC"` ✅
4. Should NOT see: `"RPC timeout"` ❌

## Still Having Issues?

1. **Check Supabase Connection:**
   - Verify your `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Check Supabase dashboard shows your project is active

2. **Check Network Tab:**
   - Open browser DevTools → Network tab
   - Look for failed requests to Supabase
   - Check if requests are reaching Supabase

3. **Verify Function Exists:**
   - Run the verification query from Step 5
   - If it returns nothing, the function wasn't created

4. **Check Permissions:**
   - Run: `SELECT has_function_privilege('anon', 'get_user_profile(uuid)', 'EXECUTE');`
   - Should return `true`



