# Supabase Settings Configuration

## Email Confirmation Settings

To disable email confirmation and allow users to login immediately after registration:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Under **Email Auth**, find **"Enable email confirmations"**
5. **Disable** this setting (toggle it off)
6. Save the changes

## Why This is Needed

- Users can register and login immediately without email confirmation
- Users can login with either email or phone number
- No email verification emails will be sent

## Current Implementation

The codebase includes:
- Auto-confirmation trigger that sets `email_confirmed_at` and `confirmed_at` on user creation
- Login support for both email and phone number
- No email redirect URLs in signup flow

Even with the trigger, it's recommended to disable email confirmation in Supabase dashboard settings for the best user experience.




