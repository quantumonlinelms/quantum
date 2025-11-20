# Cloudflare Images Migration Summary

## Changes Made

The system has been updated to use **Cloudflare Images** for all file storage instead of Supabase Storage. Supabase now only stores Cloudflare URLs in the database.

## Architecture Changes

### Before
- Receipts: Placeholder URL (not implemented)
- PDFs: Supabase Storage bucket (`course-materials`)
- Frontend: Signed URLs from Supabase Storage

### After
- Receipts: Cloudflare Images → URL stored in `enrolments.receipt_url`
- PDFs: Cloudflare Images → URL stored in `course_files.file_url`
- Frontend: Direct Cloudflare URLs (no signed URLs needed)

## Files Modified

### 1. New File: `src/lib/cloudflare.js`
- Cloudflare Images API utility functions
- `uploadToCloudflareImages()` - Upload files and get URL
- `deleteFromCloudflareImages()` - Delete files from Cloudflare

### 2. Updated: `src/pages/RegisterPage.jsx`
- Imports `uploadToCloudflareImages` from cloudflare utility
- Replaces placeholder with actual Cloudflare upload
- Uploads receipt image to Cloudflare Images
- Stores Cloudflare URL in database

### 3. Updated: `src/components/CoursePdfManager.jsx`
- Removed Supabase Storage upload logic
- Added Cloudflare Images upload for PDFs
- Added Cloudflare Images delete functionality
- Stores Cloudflare URLs in database

### 4. Updated: `src/components/PdfList.jsx`
- Removed Supabase Storage signed URL logic
- Simplified to use direct Cloudflare URLs
- Opens PDFs directly from Cloudflare

### 5. Updated: `.env.example`
- Added Cloudflare credentials:
  - `VITE_CLOUDFLARE_ACCOUNT_ID`
  - `VITE_CLOUDFLARE_API_TOKEN`

### 6. Updated Documentation
- `README.md` - Updated storage architecture section
- `SETUP.md` - Removed Supabase Storage setup, added Cloudflare setup
- `IMPLEMENTATION.md` - Updated all storage references

## Setup Required

1. **Get Cloudflare Credentials:**
   - Account ID: https://dash.cloudflare.com/ (right sidebar)
   - API Token: https://dash.cloudflare.com/profile/api-tokens
     - Create token with "Edit Cloudflare Images" template
     - Or custom token with `Account.Cloudflare Images:Edit` permission

2. **Add to `.env`:**
   ```
   VITE_CLOUDFLARE_ACCOUNT_ID=your-account-id
   VITE_CLOUDFLARE_API_TOKEN=your-api-token
   ```

3. **No Supabase Storage Setup Needed:**
   - No bucket creation required
   - No storage policies needed
   - RLS on `course_files` table still controls who can see PDF records

## Benefits

1. **Simplified Architecture**: No need for Supabase Storage bucket
2. **Better Performance**: Cloudflare Images CDN for fast file delivery
3. **Cost Effective**: Cloudflare Images has generous free tier
4. **Unified Storage**: Both receipts and PDFs use same service
5. **Direct URLs**: No signed URL generation needed

## Security

- RLS policies still protect database records
- Only enrolled students can see PDF records in database
- Cloudflare URLs are public, but protected by:
  - RLS preventing unauthorized users from seeing URLs
  - Cloudflare Images can be configured with signed URLs if needed (future enhancement)

## Testing Checklist

- [ ] Configure Cloudflare credentials in `.env`
- [ ] Test receipt upload during registration
- [ ] Test PDF upload in admin course manager
- [ ] Test PDF download/viewing for students
- [ ] Test PDF deletion
- [ ] Verify URLs are stored correctly in database
- [ ] Verify files are accessible from Cloudflare URLs

## Notes

- Cloudflare Images supports various file types including PDFs
- File size limits: Cloudflare Images free tier allows up to 10MB per image
- For larger PDFs, consider Cloudflare R2 (object storage) as alternative
- Current implementation uses Cloudflare Images API directly from frontend
- For production, consider moving uploads to backend API for better security




