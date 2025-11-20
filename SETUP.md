# LMS Setup Guide

## Phase 1: Supabase Database Setup ✅

### Database Schema
All tables, RLS policies, and triggers have been created via migration `initial_schema`.

### Cloudflare Images Setup

1. Get Cloudflare Account ID:
   - Go to https://dash.cloudflare.com/
   - Your Account ID is shown in the right sidebar

2. Create API Token:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Images" template
   - Or create custom token with `Account.Cloudflare Images:Edit` permission
   - Copy the token

3. Add to `.env` file:
   ```
   VITE_CLOUDFLARE_ACCOUNT_ID=your-account-id
   VITE_CLOUDFLARE_API_TOKEN=your-api-token
   ```

**Note:** All files (receipts and PDFs) are stored in Cloudflare Images. Supabase only stores the Cloudflare URLs in the database.

---

## Phase 2: React Project Setup

### Dependencies Required

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/storage-js": "^2.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

### Environment Variables

Create `.env` file (copy from `.env.example`):
```
VITE_SUPABASE_URL=https://bmfqcvqqzzrhnkvbyidy.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Cloudflare Images API credentials
VITE_CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
VITE_CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
```

---

## Phase 3-5: Implementation Phases

See individual phase documentation below.

