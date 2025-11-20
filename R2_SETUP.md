# Cloudflare R2 Setup Guide

## Step 1: Create R2 Bucket

1. Go to https://dash.cloudflare.com/
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Enter bucket name (e.g., `lms-files`)
5. Choose location (optional)
6. Click **Create bucket**

## Step 2: Get R2 API Credentials

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure:
   - **Token name**: `LMS R2 Upload`
   - **Permissions**: 
     - **Object Read & Write** (or **Admin Read & Write**)
   - **Bucket**: Select your bucket or "All buckets"
4. Click **Create API Token**
5. **Copy both**:
   - **Access Key ID**
   - **Secret Access Key** (you won't see it again!)

## Step 3: Configure Public Access (Optional but Recommended)

### Option A: Use R2.dev Public URL (Easiest)

1. In your bucket settings, go to **Settings** tab
2. Enable **Public Access**
3. Copy the **R2.dev subdomain** (format: `https://pub-xxxxx.r2.dev`)
4. This will be your `VITE_CLOUDFLARE_R2_PUBLIC_URL`

### Option B: Use Custom Domain

1. In bucket settings, go to **Settings** → **Public Access**
2. Click **Connect Domain**
3. Follow instructions to connect your domain
4. Use your custom domain as `VITE_CLOUDFLARE_R2_PUBLIC_URL`

## Step 4: Configure CORS (Required for Browser Uploads)

1. In your bucket, go to **Settings** → **CORS Policy**
2. Add CORS configuration:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**For production**, replace `"*"` in `AllowedOrigins` with your actual domain:
```json
{
  "AllowedOrigins": ["https://yourdomain.com", "http://localhost:5173"]
}
```

## Step 5: Add Credentials to .env

Add these to your `.env` file:

```env
# Cloudflare R2 Storage
VITE_CLOUDFLARE_R2_BUCKET_NAME=lms-files
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

**Note:** If using custom domain, use that instead of R2.dev URL.

## Step 6: Restart Dev Server

```bash
npm run dev
```

## Troubleshooting

### CORS Errors
- Make sure CORS is configured in R2 bucket settings
- Check that your origin matches the CORS policy

### 403 Forbidden
- Verify Access Key ID and Secret Access Key are correct
- Check that API token has proper permissions
- Ensure bucket name matches exactly

### Files Not Accessible
- Verify public access is enabled
- Check that `VITE_CLOUDFLARE_R2_PUBLIC_URL` is correct
- Test URL directly in browser

## Security Notes

- **Never commit** `.env` file to git (already in `.gitignore`)
- Use **least privilege** for API tokens (Object Read & Write, not Admin)
- For production, restrict CORS origins to your domain only
- Consider using presigned URLs for private files (requires backend)

## Alternative: Use Backend for Uploads

For better security, you can:
1. Create a backend API endpoint
2. Generate presigned POST URLs from backend
3. Upload directly from frontend to R2 using presigned URL
4. This keeps credentials server-side only




