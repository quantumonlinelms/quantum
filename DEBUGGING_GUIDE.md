# Debugging Guide - Turn Things On/Off

## What I Added

I've added comprehensive logging with emojis to help you see exactly what's happening at each step:

- 🔍 = Debug/Info message
- ✅ = Success
- ❌ = Error/Failure
- ⚠️ = Warning
- ⏱️ = Timeout
- ⏭️ = Skipped

## How to Debug

### Step 1: Open Browser Console
1. Press F12 (or right-click → Inspect)
2. Go to "Console" tab
3. Clear the console (trash icon)
4. Try logging in

### Step 2: Look for These Logs

#### Initial Setup
```
🔍 [STEP 1] Starting profile fetch for user: [userId]
🔍 [STEP 1] Current session check...
🔍 [STEP 1] Current session exists: true/false
🔍 [STEP 1] Session user ID: [userId]
🔍 [STEP 2] Waiting 1 second for session to propagate...
```

#### Strategy 1: RPC Call
```
🔍 [STRATEGY 1] Attempting RPC get_user_profile...
🔍 [STRATEGY 1] Supabase client URL: [url]
🔍 [STRATEGY 1] Supabase client configured: true/false
🔍 [STRATEGY 1] Calling RPC with userId: [userId]
🔍 [STRATEGY 1] RPC promise created, waiting for response...
🔍 [STRATEGY 1] Racing RPC call vs timeout...
```

**If it succeeds:**
```
✅ [STRATEGY 1] RPC completed in [X] ms
✅ [STRATEGY 1] SUCCESS - Profile fetched via RPC
```

**If it fails:**
```
⏱️ [STRATEGY 1] TIMEOUT after [X] ms
❌ [STRATEGY 1] RPC call timed out
```

#### Strategy 2: Direct Query
```
🔍 [STRATEGY 2] RPC failed, attempting direct query fallback...
🔍 [STRATEGY 2] Direct query promise created
🔍 [STRATEGY 2] Racing direct query vs timeout...
```

**If it succeeds:**
```
✅ [STRATEGY 2] SUCCESS - Profile fetched via direct query
```

**If it fails:**
```
⏱️ [STRATEGY 2] TIMEOUT after [X] ms
❌ [STRATEGY 2] Direct query timed out
```

#### Strategy 3: Metadata Fallback
```
🔍 [STRATEGY 3] No profile found, checking auth user metadata...
🔍 [STRATEGY 3] Calling supabase.auth.getUser()...
✅ [STRATEGY 3] Found auth user: [userId]
🔍 [STRATEGY 3] Created profile from metadata: [profile]
```

#### Final Summary
```
🔍 [FINAL] Summary:
🔍 [FINAL] Profile data found: true/false
✅ [FINAL] SUCCESS - Profile set successfully
OR
❌ [FINAL] FAILED - No profile data found after all strategies
```

## What to Check Based on Logs

### If RPC Times Out (Strategy 1)
**Look for:**
- `⏱️ [STRATEGY 1] TIMEOUT after 5000 ms`

**Possible causes:**
1. Function doesn't exist → Check Supabase SQL Editor
2. Network issue → Check Network tab in DevTools
3. RLS blocking → Check RLS policies
4. Wrong Supabase URL → Check `.env` file

**Action:**
- Check Network tab → Look for request to `/rest/v1/rpc/get_user_profile`
- If request exists but hangs → Network/RLS issue
- If no request → Function call not being made

### If Direct Query Times Out (Strategy 2)
**Look for:**
- `⏱️ [STRATEGY 2] TIMEOUT after 3000 ms`

**Possible causes:**
1. RLS policy blocking → Check RLS policies on `users` table
2. Table doesn't exist → Check database schema
3. Network issue → Check Network tab

**Action:**
- Check Network tab → Look for request to `/rest/v1/users`
- Check RLS policies in Supabase Dashboard

### If Strategy 3 Works
**Look for:**
- `✅ [STRATEGY 3] SUCCESS - Profile created and saved to database`
OR
- `✅ [STRATEGY 3] Using in-memory profile from metadata`

**This means:**
- RPC and direct query both failed
- But we created a profile from auth metadata
- App will work, but profile is in-memory only (not in database)

## Network Tab Debugging

### Step 1: Open Network Tab
1. Press F12
2. Go to "Network" tab
3. Filter by "Fetch/XHR"

### Step 2: Try Login
Watch for these requests:

1. **RPC Call:**
   - URL: `https://[project].supabase.co/rest/v1/rpc/get_user_profile`
   - Method: POST
   - Status: Should be 200 (success) or error code
   - If pending forever → Timeout issue

2. **Direct Query:**
   - URL: `https://[project].supabase.co/rest/v1/users?id=eq.[userId]`
   - Method: GET
   - Status: Should be 200 or 401/403 (RLS blocking)

3. **Auth Get User:**
   - URL: `https://[project].supabase.co/auth/v1/user`
   - Method: GET
   - Status: Should be 200

### Step 3: Check Request Details
Click on each request and check:
- **Headers** → Authorization header present?
- **Payload** → Correct parameters?
- **Response** → What error message?
- **Timing** → How long did it take?

## Quick Tests

### Test 1: Disable Strategy 1 (RPC)
Temporarily comment out Strategy 1 to test if Strategy 2 works:
```javascript
// Strategy 1: Try RPC function (bypasses RLS) with timeout
// COMMENTED OUT FOR TESTING
// try { ... } catch { ... }
```

### Test 2: Disable Strategy 2 (Direct Query)
Temporarily comment out Strategy 2 to test if Strategy 3 works:
```javascript
// Strategy 2: If RPC failed, try direct query
// COMMENTED OUT FOR TESTING
// if (!profileData) { ... }
```

### Test 3: Check Supabase Connection
Add this to test connection:
```javascript
console.log('Testing Supabase connection...')
const test = await supabase.from('users').select('count').limit(1)
console.log('Connection test result:', test)
```

## Common Issues and Solutions

### Issue: All Strategies Timeout
**Cause:** Network/connection issue or Supabase URL wrong
**Solution:** 
- Check `.env` file has correct `VITE_SUPABASE_URL`
- Check Network tab for failed requests
- Verify Supabase project is active

### Issue: RPC Works But Returns Empty
**Cause:** User profile doesn't exist in `users` table
**Solution:**
- Check if user exists: `SELECT * FROM users WHERE id = '[userId]'`
- Create profile manually or fix trigger

### Issue: Direct Query Works But RPC Doesn't
**Cause:** RPC function has wrong permissions or doesn't exist
**Solution:**
- Verify function exists in Supabase
- Check GRANT permissions
- Test function manually in SQL Editor

### Issue: Strategy 3 Creates Profile But It's In-Memory
**Cause:** Database insert is blocked by RLS
**Solution:**
- Check RLS policies on `users` table
- Ensure INSERT policy allows authenticated users

## Next Steps

1. **Refresh browser** and try logging in
2. **Copy all console logs** and share them
3. **Check Network tab** for failed requests
4. **Share the logs** so we can identify the exact issue

The detailed logging will show us exactly where the problem is!



