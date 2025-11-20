# Quantum LMS

A minimal Learning Management System built with React, Supabase, Cloudflare Images, and YouTube.

## Features

### Student Features
- User registration with payment receipt upload
- Pending approval workflow
- Course browsing and enrollment
- Lesson viewing with YouTube video embeds
- PDF course materials download
- Lesson progress tracking

### Admin Features
- Enrolment approval/decline workflow
- Course management (CRUD)
- Lesson management (CRUD)
- PDF upload and management for courses
- Dashboard with statistics

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (Auth + Database only)
- **File Storage**: Cloudflare Images (receipts + PDFs)
- **Video Hosting**: YouTube (unlisted/private videos)

**Note:** Supabase does NOT store files. All files are uploaded to Cloudflare Images, and Supabase only stores the Cloudflare URLs.

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Supabase project (already configured)
- Cloudflare account with Images API access
  - Account ID from Cloudflare dashboard
  - API token with Cloudflare Images:Edit permission

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase anon key
   - Add Cloudflare Account ID and API token:
     ```
     VITE_SUPABASE_URL=https://bmfqcvqqzzrhnkvbyidy.supabase.co
     VITE_SUPABASE_ANON_KEY=<your-anon-key>
     VITE_CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
     VITE_CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
     ```
   
   **Get Cloudflare credentials:**
   - Account ID: https://dash.cloudflare.com/ (right sidebar)
   - API Token: https://dash.cloudflare.com/profile/api-tokens
     - Create token with "Edit Cloudflare Images" template

4. Run development server:
```bash
npm run dev
```

### Database Schema

All tables, RLS policies, and triggers have been created via migration `initial_schema`.

**Tables:**
- `users` - User profiles with approval status
- `courses` - Course information
- `lessons` - Lesson content with YouTube video IDs
- `course_files` - PDF materials per course
- `enrolments` - Student course enrollments with receipt URLs
- `lesson_progress` - Student lesson completion tracking

**RLS Policies:**
- Students can only access courses they're enrolled in
- Students can only access PDFs from enrolled courses (via URL access)
- Admins have full access to all resources
- Users can only view/update their own data

**File Storage:**
- Receipts: Uploaded to Cloudflare Images → URL stored in `enrolments.receipt_url`
- PDFs: Uploaded to Cloudflare Images → URL stored in `course_files.file_url`
- No Supabase Storage bucket needed

## Project Structure

```
src/
├── components/
│   ├── AdminRoute.jsx          # Admin-only route protection
│   ├── ProtectedRoute.jsx       # Authenticated route protection
│   ├── CoursePdfManager.jsx    # Admin PDF management component
│   └── PdfList.jsx             # Student PDF list component
├── contexts/
│   └── AuthContext.jsx         # Authentication context provider
├── lib/
│   └── supabase.js            # Supabase client configuration
├── pages/
│   ├── LandingPage.jsx        # Public course listing
│   ├── RegisterPage.jsx       # Student registration
│   ├── LoginPage.jsx          # User login
│   ├── StudentDashboard.jsx   # Student dashboard
│   ├── CoursePage.jsx         # Course details with lessons & PDFs
│   ├── LessonPage.jsx         # Lesson viewer with YouTube embed
│   ├── AdminDashboard.jsx     # Admin dashboard
│   ├── AdminEnrolments.jsx    # Enrolment management
│   ├── AdminCourseManager.jsx # Course CRUD
│   └── AdminLessonManager.jsx # Lesson CRUD
└── App.jsx                    # Main app with routing
```

## Usage

### Creating an Admin User

1. Register a user normally through the registration page
2. In Supabase Dashboard → Table Editor → `users`:
   - Set `role` to `'admin'`
   - Set `approved` to `true`

### Student Registration Flow

1. Student registers with full name, email, phone, password
2. Student uploads payment receipt (currently placeholder - needs Cloudflare Images integration)
3. Enrolment created with `status='pending'`
4. Admin reviews enrolment in `/admin/enrolments`
5. Admin approves → `users.approved` set to `true`
6. Student can now log in and access courses

### Admin Workflow

1. Login as admin → `/admin`
2. Review pending enrolments → `/admin/enrolments`
3. Manage courses → `/admin/courses`
   - Create/edit/delete courses
   - Upload PDFs to courses
   - Manage lessons for each course
4. Manage lessons → `/admin/lessons/:courseId`
   - Add/edit/delete lessons
   - Set YouTube video IDs

## File Storage Architecture

All files are stored in **Cloudflare Images**, not Supabase Storage:

- **Receipts**: Uploaded during registration → Cloudflare Images → URL stored in database
- **PDFs**: Uploaded by admin → Cloudflare Images → URL stored in database
- **Frontend**: Reads URLs from Supabase database → Accesses files directly from Cloudflare

## TODO / Known Issues

1. **Cloudflare Images API**: Fully implemented. Make sure to configure credentials in `.env`.

2. **Error Handling**: Some error handling could be improved with better user feedback.

3. **File Validation**: PDF upload validation could be enhanced (currently checks file type and size).

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

Private project - All rights reserved

