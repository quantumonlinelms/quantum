# LMS System Requirements

Build a minimal LMS using **React (frontend), Supabase (auth + database + storage), Cloudflare Images (receipt upload), and YouTube (unlisted/private videos)**.

System runs fully inside the platform—**no email verification, no notifications, no external messaging**.

---

# **1. System Overview**

Implement:

### **Student Flow**

1. Register (full name, email, phone, password).

2. Upload payment receipt.

3. Registration = pending until admin approves.

4. After approval:

   * Student can log in

   * Access courses

   * Watch lessons (YouTube embed)

   * Download/view course PDFs

   * Mark lessons as completed

### **Admin Flow**

* View pending enrolments

* Approve/decline

* Manage courses (title, description, PDFs)

* Manage lessons (YouTube videos)

---

# **2. Supabase Setup**

### **2.1 Authentication**

* Email + password

* Students create password during registration

* `approved` flag controls login access

* Admins have `role=admin`

---

## **2.2 Database Schema**

### **users**

* `id`

* `full_name`

* `phone`

* `role` (student/admin)

* `approved` (boolean)

### **courses**

* `id`

* `title`

* `description`

* `published`

* `ordering`

### **lessons**

* `id`

* `course_id`

* `title`

* `youtube_video_id`

* `ordering`

### **course_files** *(NEW TABLE — PDF STORAGE)*

Stores PDF materials per course.

* `id`

* `course_id` (FK → courses.id)

* `file_name`

* `file_url` (Supabase Storage URL or Cloudflare URL)

* `uploaded_at`

### **enrolments**

* `id`

* `user_id`

* `course_id`

* `receipt_url`

* `status` (pending/approved/declined)

* `submitted_at`

* `reviewed_by`

* `reviewed_at`

* `admin_comment`

### **lesson_progress**

* `id`

* `lesson_id`

* `user_id`

* `completed`

* `completed_at`

---

# **3. Storage Instructions**

### **Receipts**

* Store in **Cloudflare Images**.

### **PDF Course Materials**

Store in **Supabase Storage** (recommended) with:

* Bucket: `course-materials`

* Private access only

* Students can only access PDFs from courses they are approved + enrolled in

### **Validation**

* PDFs only

* Max size (e.g., 10–20MB)

---

# **4. Frontend (React) Architecture**

### **Student Pages**

* **Landing Page** (course list)

* **Registration Page**

* **Login Page**

* **Student Dashboard**

* **Course Page**

  Includes:

  * List of lessons

  * List of course PDFs

* **Lesson Page**

  * YouTube embed

  * Mark as completed

* **PDF Viewer/Downloader**

  * Secure download from Supabase Storage

### **Admin Pages**

* **Admin Login**

* **Admin Dashboard**

* **Enrolment Review**

* **Course Manager**

  * Add/edit/delete courses

  * Upload PDFs to course_files

  * Remove PDFs

* **Lesson Manager**

  * Add/edit/delete lessons

---

# **5. Component Breakdown**

### **Course-Related Components**

* `CourseList`

* `CourseDetails` (includes PDF list)

* `PdfList` *(NEW)*

* `PdfUploader` *(NEW, admin only)*

* `PdfViewer` or download button

* `LessonList`

* `LessonViewer` (YouTube)

### **Admin Components**

* `AdminCourseManager`

* `CoursePdfManager` *(NEW)*

* `AdminLessonManager`

* `EnrolmentTable`

* `EnrolmentDetails`

---

# **6. PDF Management Logic**

### **Admin Uploads PDFs**

Flow:

1. Open Course Manager → Course PDF Section

2. Upload PDF using Supabase Storage upload

3. Return URL

4. Insert into `course_files` table

### **Students Access PDFs**

* Only after login

* Only if approved = true

* Only for courses they are enrolled in

* Provide secure download or preview

### **Permission Handling**

* Use RLS to:

  * Allow admin full access

  * Allow students read access only for:

    * PDFs of courses they are enrolled in

  * Deny access to all other users

---

# **7. Revised Login Logic**

* Check auth credentials

* Fetch user profile

* If `approved = false`:

  * Block login inside portal

  * Show "Your enrolment is pending approval."

---

# **8. Testing Checklist**

### **PDF-Related Tests**

* Admin can upload PDF successfully

* PDF appears in course

* Only enrolled + approved student can access

* Non-approved student = access denied

* PDF downloads correctly

* RLS rules prevent unauthorized access

### **General Tests**

* Registration

* Receipt upload

* Approval workflow

* Login restrictions

* Lesson viewing

* Progress tracking

* Admin CRUD for courses + lessons

---

# **9. Developer Deliverables**

* Updated database schema including `course_files`

* RLS policy definitions

* Storage rules for PDF bucket

* Frontend component structure including PDF support

* Full flow documentation

* No hosting, no deployment, no emails




