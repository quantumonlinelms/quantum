-- ============================================
-- COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR
-- ============================================
-- This creates the get_user_profile function that's causing the timeout
-- ============================================

-- Step 1: Create the function
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

-- Step 2: Grant permissions (CRITICAL - without this it won't work!)
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;

-- Step 3: Verify it was created (should return 1 row)
SELECT 
  'Function created successfully!' as status,
  proname as function_name
FROM pg_proc 
WHERE proname = 'get_user_profile';

-- ============================================
-- AFTER RUNNING THIS:
-- 1. You should see "Function created successfully!"
-- 2. Refresh your browser
-- 3. Try logging in again
-- 4. Check console - should see "Profile fetched via RPC" instead of timeout
-- ============================================



