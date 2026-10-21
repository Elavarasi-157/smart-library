# Smart Library - Production-Ready University Library Management System

Smart Library is a full-stack, mobile-friendly university library management platform designed for students, librarians, Heads of Departments (HODs), and administrators.

---

## 🌟 Key Capabilities & Business Rules

### 1. Intelligent Ranked Search Engine
- Multi-factor search with weighted relevance scoring based on exact/partial/fuzzy keyword match on book title, author, description, syllabus keywords, department, and category.
- Boosts results with active physical copy availability and verified student ratings.

### 2. Physical Copy & Live Shelf Location Tracking
- Real-time physical location coordinates displayed on every copy: `Building A | Floor 2 | Rack A12 | Shelf 4`.
- Copy conditions tracked across `GOOD`, `FAIR`, `DAMAGED`, `MISSING`, and `MAINTENANCE`.

### 3. Borrowing Limits & 14-Day Renewal Engine
- **Max Books Limit:** Each student is strictly restricted to a maximum of **4 books** at any time.
- **14-Day Renewal Rule:** Every renewal extends the loan due date by **14 days** after checkout or previous renewal date.
- **Renewal Blocking:** Automatically blocks renewal if a book copy has active waiting list reservations.

### 4. Transparent Overdue Fines & Cashfree Sandbox Payments
- **Fine Rate:** Overdue fines are strictly calculated at **₹1 per day** overdue.
- **Cashfree Sandbox Online Payments:** Students can initiate online checkout sessions, simulate sandbox payments via UPI/Card, receive immediate status clearance, and download official payment receipts.

### 5. Sequential Due Date Reminders & Calendar Integration
- **Sequential Alerts:** Background cron worker triggers sequential reminders: `DUE_IN_2_DAYS`, `DUE_IN_1_DAY`, `DUE_TODAY`, and `OVERDUE` with duplicate delivery protection.
- **Calendar Sync:** "Add to Calendar" prompt (YES/NO) allows 1-click Google Calendar integration and `.ics` iCalendar download.

### 6. Academic Syllabus & Semester Recommendations
- Automatically maps department, year, and semester to official course subjects.
- Categorizes prescribed core textbooks and recommended reference books with real-time physical shelf availability.

### 7. Peer-to-Peer Academic Resource Sharing
- Repository for Previous Year Question Papers (PYQ), Lecture Notes, Lab Manuals, and Study Guides.
- Includes copyright validation, faculty/librarian moderation, 1-5 star ratings, and reporting workflows.

### 8. Multi-Tier Procurement Approval Workflow
- Book procurement pipeline: `Student Request` $\rightarrow$ `HOD Review` $\rightarrow$ `Admin Approval` $\rightarrow$ `Library Catalog & Copy Creation`.

### 9. Real-Time Crowd & Turnstile Management
- Live seat occupancy meter with visual capacity progress, peak hour analytics, and "Best Time to Visit" predictions.
- Optical QR Turnstile simulation for student check-in (occupancy +1) and check-out (occupancy -1).

### 10. Grounded Gemini AI Assistant
- Live AI conversational assistant grounded in real database records to answer questions about book shelf locations, syllabus requirements, and library rules without hallucinations.

---

## 👥 Default Demo User Credentials

In development mode, you can log in directly using the 1-click role switcher in the navbar or using these credentials:

| Role | Name | Email / Institutional ID | Password | Department |
| :--- | :--- | :--- | :--- | :--- |
| **STUDENT** | Rahul Sharma | `student@smartlib.edu` / `STU2024001` | `Password@123` | Information Technology (Sem 4) |
| **LIBRARIAN** | Meera Nair | `librarian@smartlib.edu` / `LIB2024001` | `Password@123` | Central Circulation Desk |
| **HOD** | Dr. Ramesh Chandra | `hod.it@smartlib.edu` / `HOD-IT-001` | `Password@123` | Head of IT Department |
| **ADMIN** | Dr. Arvind Swaminathan | `admin@smartlib.edu` / `ADM2024001` | `Password@123` | University Administration |

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express, `sql.js` (WebAssembly SQLite with disk persistence), `node-cron`, `jsonwebtoken`, `bcryptjs`, `qrcode`
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts
- **Payment Gateway:** Cashfree Sandbox Integration
- **AI Engine:** Google Gemini Grounded Assistant

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# In the root folder
npm run install:all
```

### 2. Seed Database
```bash
node server/seeds/seedData.js
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Development Servers
```bash
# Starts Express backend on port 5000 and Vite frontend on port 5173
npm run dev
```

Open `http://localhost:5173` in your browser.

## ☁️ Deploying to Render

1. In Render, create a new **Blueprint** and connect this GitHub repository.
2. Render detects `render.yaml` and creates the free `smart-library` web service.
3. Wait for the deploy to finish, then open the service URL. Render checks `/api/health`.

The free service uses temporary storage. Its SQLite database and uploaded files can be lost when Render restarts or redeploys the service. The service starts with an empty database; it does not automatically seed the sample accounts. For persistent library data, use a paid persistent disk and configure `SQLITE_DB_PATH` to a path on that disk. Configure optional integrations such as Gemini and Cashfree in the Render environment settings.
