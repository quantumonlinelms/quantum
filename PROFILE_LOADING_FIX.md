# Profile Loading Fix - Comprehensive Solution

## Problem
Users were stuck in loading/pending state after login, unable to load user profiles.

## Root Causes Identified
1. RPC function `get_user_profile` might not exist or have wrong permissions
2. User profile might not exist in `users` table (trigger might not be working)
3. RLS policies might be blocking direct queries
4. No fallback mechanism if RPC fails
5. No timeout mechanism - infinite loading state

## Solutions Implemented

### 1. Multi-Strategy Profile Fetching (`AuthContext.jsx`)
The `fetchUserProfile` function now uses three strategies in order:

**Strategy 1: RPC Function (Primary)**
- Tries `get_user_profile` RPC function
- Bypasses RLS policies
- Handles both array and object return formats

**Strategy 2: Direct Query (Fallback)**
- If RPC fails, tries direct query to `users` table
- May be blocked by RLS, but worth trying

**Strategy 3: Create Profile from Metadata (Last Resort)**
- If no profile exists, creates one from auth user metadata
- Uses data from `auth.users.user_metadata`
- Sets `approved: false` by default

### 2. Enhanced Error Handling
- Detailed console logging at each step
- Clear error messages for debugging
- Graceful degradation through strategies

### 3. Timeout Mechanism
- 10-second timeout to prevent infinite loading
- Automatically sets `loading: false` if profile fetch takes too long
- Clears timeout when profile is successfully fetched

### 4. Better User Feedback (`LoginPage.jsx`)
- Shows loading message while fetching profile
- Shows error message if profile fails to load
- Provides "Try Again" button for recovery

## Debugging Steps

### Step 1: Check Browser Console
Open browser console and look for these messages:
- `"Fetching profile for user: [userId]"`
- `"Attempting RPC get_user_profile..."`
- `"Profile fetched via RPC"` or `"RPC error: [error]"`
- `"Attempting direct query fallback..."`
- `"Profile set successfully"` or `"No profile data found"`

### Step 2: Verify Supabase Functions
1. Go to Supabase Dashboard → SQL Editor
2. Run this query to check if function exists:
```sql
SELECT proname, proargtypes 
FROM pg_proc 
WHERE proname = 'get_user_profile';
```
3. If it doesn't exist, run the SQL from `SUPABASE_FUNCTIONS.sql`

### Step 3: Check User Profile Exists
1. Go to Supabase Dashboard → Table Editor → `users`
2. Search for your user ID (from auth.users)
3. If no record exists, the trigger might not be working

### Step 4: Verify RLS Policies
1. Go to Supabase Dashboard → Authentication → Policies
2. Check `users` table policies
3. Ensure authenticated users can SELECT their own profile

### Step 5: Check Trigger for Profile Creation
Run this query to check if trigger exists:
```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

If it doesn't exist, you need to create a trigger that:
- Listens to `auth.users` INSERT events
- Creates corresponding record in `public.users` table

## Required Database Setup

### 1. Create User Profile Trigger
If profiles aren't being created automatically, add this trigger:

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Verify RPC Function Permissions
Run this to check permissions:
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

### 3. Test RPC Function Manually
Test the function directly:
```sql
-- Replace with actual user ID
SELECT * FROM get_user_profile('your-user-id-here');
```

## Expected Behavior After Fix

1. **On Login:**
   - User authenticates successfully
   - Profile fetch starts (console: "Fetching profile for user...")
   - RPC is attempted first
   - If RPC fails, direct query is tried
   - If still no profile, profile is created from metadata
   - Profile is set and loading stops
   - User is redirected to dashboard/admin

2. **If Profile Doesn't Exist:**
   - System attempts to create profile from auth metadata
   - Profile is created with `approved: false`
   - User sees "Pending Approval" message

3. **If All Strategies Fail:**
   - After 10 seconds, loading stops
   - User sees error message with "Try Again" button
   - Console shows detailed error logs

## Console Log Examples

### Successful Profile Fetch:
```
Fetching profile for user: abc123...
Attempting RPC get_user_profile...
Profile fetched via RPC (array): {id: "...", email: "...", ...}
Profile set successfully: {...}
Profile fetch completed, loading set to false
```

### RPC Fails, Direct Query Works:
```
Fetching profile for user: abc123...
Attempting RPC get_user_profile...
RPC error: function get_user_profile(uuid) does not exist
Attempting direct query fallback...
Profile fetched via direct query: {...}
Profile set successfully: {...}
```

### Profile Created from Metadata:
```
Fetching profile for user: abc123...
Attempting RPC get_user_profile...
RPC returned empty data
Attempting direct query fallback...
Direct query error: ...
No profile found, checking auth user metadata...
Found auth metadata, attempting to create profile...
Profile created from metadata: {...}
Profile set successfully: {...}
```

## Next Steps if Still Not Working

1. **Check Console Logs:** Look for specific error messages
2. **Verify Functions:** Ensure all SQL functions are created
3. **Check Permissions:** Verify RPC functions have execute permissions
4. **Test Manually:** Try calling RPC function directly in SQL Editor
5. **Check Trigger:** Verify user profile trigger is working
6. **RLS Policies:** Ensure policies allow profile access

## Files Modified
- `src/contexts/AuthContext.jsx` - Enhanced profile fetching with multiple strategies
- `src/pages/LoginPage.jsx` - Better error handling and user feedback



