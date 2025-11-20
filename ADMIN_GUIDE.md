# Quantum LMS - Administrator Guide

This guide will help you manage your Quantum LMS platform effectively. As an administrator, you have full control over courses, lessons, students, and enrollments.

---

## Getting Started

### First Time Login

1. **Access Admin Panel**
   - Log in with your admin credentials
   - You'll be redirected to `/admin` dashboard

2. **Admin Dashboard Overview**
   - View statistics at a glance
   - See total enrollments, courses, and students
   - Quick access to all management sections

---

## Managing Enrollments

### Reviewing Pending Enrollments

**Location:** `/admin/enrolments`

**What You'll See:**
- List of all enrollment requests
- Status: Pending, Approved, or Declined
- Student information and submission date

**How to Review:**

1. **View Enrollment Details**
   - Click on an enrollment to see:
     - Student full name, email, phone
     - Payment receipt (click to view)
     - Submission date
     - Current status

2. **Approve an Enrollment**
   - Click "Approve" button
   - Optionally add an admin comment
   - Student will be automatically approved and can log in
   - Enrollment status changes to "Approved"

3. **Decline an Enrollment**
   - Click "Decline" button
   - Add a comment explaining why (optional)
   - Enrollment status changes to "Declined"
   - Student will not be able to access courses

**Tips:**
- Always review payment receipts before approving
- Use comments to track why enrollments were declined
- You can filter enrollments by status

---

## Managing Courses

### Creating a New Course

**Location:** `/admin/courses`

**Steps:**

1. **Click "Create New Course"**
   - Fill in course details:
     - **Title** - Course name (required)
     - **Description** - Detailed course information
     - **Published** - Toggle to make course visible to students
     - **Ordering** - Number to control display order (lower = first)

2. **Save the Course**
   - Click "Save" or "Create Course"
   - Course appears in your course list

### Editing a Course

1. **Find the Course**
   - Scroll through your course list
   - Or use search if available

2. **Click "Edit"**
   - Modify any course details
   - Change published status
   - Update ordering

3. **Save Changes**
   - Click "Save" to update
   - Changes are immediately visible

### Deleting a Course

⚠️ **Warning:** This action cannot be undone!

1. **Click "Delete"** on the course
2. **Confirm deletion**
3. Course and all associated lessons will be removed

### Managing Course PDFs

**For Each Course:**

1. **Open Course Details**
   - Click on a course to expand
   - Scroll to "Course Materials" section

2. **Upload a PDF**
   - Click "Choose File"
   - Select a PDF file (max 20MB)
   - Click "Upload"
   - File appears in the list

3. **Delete a PDF**
   - Click "Delete" next to the file
   - Confirm deletion
   - File is removed from Cloudflare and database

**PDF Requirements:**
- Format: PDF only
- Max size: 20MB
- Files are stored securely in Cloudflare Images

---

## Managing Lessons

### Adding Lessons to a Course

**Location:** `/admin/lessons/:courseId`

**Steps:**

1. **Navigate to Lesson Manager**
   - From course list, click "Manage Lessons"
   - Or go to `/admin/lessons/:courseId`

2. **Create New Lesson**
   - Click "Create New Lesson"
   - Fill in lesson details:
     - **Title** - Lesson name (required)
     - **YouTube Video** - Video URL or ID
     - **Ordering** - Display order (lower = first)

3. **YouTube Video Setup**
   - **Option 1:** Paste full YouTube URL
     - Example: `https://www.youtube.com/watch?v=VIDEO_ID`
     - System extracts video ID automatically
   - **Option 2:** Paste just the video ID
     - Example: `VIDEO_ID`
   - Video must be unlisted or public

4. **Save Lesson**
   - Click "Save" or "Create Lesson"
   - Lesson appears in the list

### Editing a Lesson

1. **Find the Lesson**
   - Scroll through lesson list
   - Lessons are ordered by "Ordering" number

2. **Click "Edit"**
   - Modify title, video ID, or ordering
   - Save changes

### Deleting a Lesson

⚠️ **Warning:** This action cannot be undone!

1. **Click "Delete"** on the lesson
2. **Confirm deletion**
3. Lesson is removed from the course

### Managing Lesson Files

**For Each Lesson:**

1. **Open Lesson Details**
   - Click on a lesson to expand
   - Scroll to "Lesson Materials" section

2. **Upload a File**
   - Click "Choose File"
   - Select a file (PDF, images, etc.)
   - Click "Upload"
   - File appears in the list

3. **Delete a File**
   - Click "Delete" next to the file
   - Confirm deletion
   - File is removed

---

## Best Practices

### Enrollment Management

✅ **Do:**
- Review payment receipts carefully
- Approve promptly to improve student experience
- Use comments to track decisions
- Decline with clear reasons

❌ **Don't:**
- Approve without checking receipts
- Leave enrollments pending for too long
- Delete enrollments (use decline instead)

### Course Management

✅ **Do:**
- Write clear, detailed descriptions
- Use ordering numbers to organize courses
- Keep unpublished courses as drafts
- Upload relevant PDF materials

❌ **Don't:**
- Delete courses with active students
- Leave courses without descriptions
- Upload very large PDF files (>20MB)

### Lesson Management

✅ **Do:**
- Use clear, descriptive lesson titles
- Number lessons logically (1, 2, 3...)
- Test YouTube videos before publishing
- Add lesson materials when helpful

❌ **Don't:**
- Use private YouTube videos (use unlisted)
- Skip lesson ordering
- Delete lessons students are actively using

---

## Understanding the Dashboard

### Statistics Shown:

- **Total Enrollments** - All enrollment requests
- **Total Courses** - All courses in system
- **Total Students** - All approved users

### Quick Actions:

- **View Enrollments** - Go to enrollment management
- **Manage Courses** - Go to course management
- **View Dashboard** - Return to admin home

---

## User Management

### Creating Admin Users

**To make a user an admin:**

1. **User must register first** (as normal student)
2. **Go to Supabase Dashboard**
   - Navigate to Table Editor → `users` table
   - Find the user by email
   - Edit the record:
     - Set `role` to `'admin'`
     - Set `approved` to `true`
3. **User can now log in as admin**

### Student Accounts

- Students are automatically created when they register
- Approval status controls login access
- You can view all students in the enrollments section

---

## Troubleshooting

### Common Issues:

**Problem: Student can't log in**
- Check if enrollment is approved
- Verify `users.approved = true` in database
- Check if user exists in `users` table

**Problem: Video won't play**
- Verify YouTube video ID is correct
- Check if video is unlisted or public (not private)
- Test video URL directly in YouTube

**Problem: PDF won't upload**
- Check file size (must be < 20MB)
- Verify file is PDF format
- Check Cloudflare API credentials in `.env`

**Problem: Course not showing to students**
- Check if course is published
- Verify student is enrolled
- Check course ordering

---

## Security Considerations

### Access Control:
- Only users with `role = 'admin'` can access admin panel
- Students can only see enrolled courses
- RLS policies enforce data security

### File Security:
- Receipts stored securely in Cloudflare
- PDFs accessible only to enrolled students
- Admin can view all files

### Best Practices:
- Don't share admin credentials
- Review enrollments regularly
- Keep course content updated
- Monitor enrollment activity

---

## Advanced Features

### Course Ordering
- Use numbers to control display order
- Lower numbers appear first
- Example: 1, 2, 3... or 10, 20, 30...

### Lesson Sequencing
- Order lessons logically
- Students typically follow order
- Use clear numbering (1, 2, 3...)

### Bulk Operations
- Currently, operations are one-by-one
- Future updates may include bulk actions

---

## Getting Help

### Documentation:
- Check this guide first
- Review README.md for technical details
- Check IMPLEMENTATION.md for system architecture

### Support:
- For technical issues, check error messages
- Review Supabase logs if needed
- Contact development team for platform issues

---

## Quick Reference

### Common Tasks:

**Approve a student:**
1. Go to `/admin/enrolments`
2. Click enrollment → Approve

**Add a course:**
1. Go to `/admin/courses`
2. Click "Create New Course"
3. Fill details → Save

**Add a lesson:**
1. Go to course → "Manage Lessons"
2. Click "Create New Lesson"
3. Fill details → Save

**Upload PDF:**
1. Open course/lesson details
2. Scroll to materials section
3. Choose file → Upload

---

## You're Ready!

You now have everything you need to manage your Quantum LMS platform effectively. Start by reviewing pending enrollments, then create your first course!

**Happy managing! 🎓**

