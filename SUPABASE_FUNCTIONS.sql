-- Required Supabase RPC Functions
-- These functions must exist in your Supabase database for the application to work correctly

-- 1. get_user_profile: Fetches user profile bypassing RLS
-- This function is used by AuthContext to fetch user profiles reliably
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

-- 2. get_user_email_by_phone: Gets user email by phone number (for phone-based login)
-- This function normalizes phone numbers for matching
CREATE OR REPLACE FUNCTION get_user_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  normalized_input TEXT;
BEGIN
  -- Normalize input phone (remove +, spaces, dashes, parentheses)
  normalized_input := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Find user by normalized phone
  SELECT email INTO v_email
  FROM public.users
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = normalized_input
  LIMIT 1;
  
  RETURN v_email;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email_by_phone(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_user_email_by_phone(TEXT) TO authenticated;

-- 3. create_enrolments: Creates enrolment records bypassing RLS
-- This function is used during registration to create enrolments for new users
CREATE OR REPLACE FUNCTION create_enrolments(
  p_user_id UUID,
  p_course_ids UUID[],
  p_receipt_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_id UUID;
BEGIN
  -- Create enrolment for each course
  FOREACH course_id IN ARRAY p_course_ids
  LOOP
    INSERT INTO public.enrolments (user_id, course_id, receipt_url, status)
    VALUES (p_user_id, course_id, p_receipt_url, 'pending')
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_enrolments(UUID, UUID[], TEXT) TO anon;
GRANT EXECUTE ON FUNCTION create_enrolments(UUID, UUID[], TEXT) TO authenticated;

-- 4. is_admin: Checks if current user is an admin (used in RLS policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if auth.uid() is NULL (unauthenticated)
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is admin
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 5. Auto-confirm user email on signup (trigger function)
CREATE OR REPLACE FUNCTION handle_new_user_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_confirmation();

-- 6. Create user profile on signup (trigger function)
-- This creates a record in public.users when a user signs up
-- NOTE: users table does NOT have an email column - email is only in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, phone, role, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    role = COALESCE(EXCLUDED.role, users.role),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

