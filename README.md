# TimeWise – Smart Mobile Barcode-Based Student Late Entry Management & Punctuality Enhancement

> A production-grade, full-stack **MERN** web application engineered for colleges and educational institutions to eliminate manual late registers, scan student ID barcodes with a mobile camera, enforce server-authoritative timestamps, prevent duplicate late entries, analyze punctuality patterns, and export audit reports as PDF and Excel.

---

## 📌 Project Overview

Educational institutions struggle with slow, paper-based late entry recording at campus gates. Manual registers cause student bottlenecks, illegible records, inaccurate arrival times, and difficult reporting.

**TimeWise** transforms this process:
1. Gate staff opens TimeWise on any smartphone.
2. The smartphone camera scans the **existing barcode** printed on the student's college ID card.
3. TimeWise immediately queries the database, identifies the student, and checks if they have already been marked late today.
4. The staff selects a reason (traffic, bus delay, weather, etc.) and confirms the entry.
5. The backend generates an **authoritative server timestamp** (preventing device clock tampering), logs the record, and prevents duplicate markings.
6. Administrators gain real-time visibility into late entries, repeat offenders, department rankings, and downloadable PDF/Excel audit reports.

---

## 🚀 Key Features

* **Mobile Barcode Scanner**: Scans physical 1D/2D barcodes (Code 128, Code 39, EAN, UPC, QR) directly from mobile phone cameras using `@zxing` / `html5-qrcode`.
* **Zero-Setup Database with Resilient Fallback**: Connects seamlessly to MongoDB Atlas or local MongoDB; automatically falls back to an embedded in-memory MongoDB server if no local database daemon is running.
* **Hardware & Manual Barcode Fallback**: Includes instant keyboard wedge and manual text lookup for gate terminals with handheld USB scanners or desktop keyboards.
* **On-Screen Scannable Barcode Generator**: Built-in SVG barcode generator allows administrators and evaluators to display and print actual Code 128 barcodes or scan them directly off laptop screens.
* **Strict Duplicate Entry Prevention**: Compound database index (`student + date + session`) combined with application-level validation prevents double-marking the same student for the same gate session.
* **Server-Authoritative Timestamping**: Client timestamps are never trusted. The server stamps the official date and 24-hour time based on campus timezone.
* **Role-Based Access Control (RBAC)**:
  * **Admin**: Full control (Manage Students, Departments, Users, View Audits, Analytics, PDF/Excel Exports).
  * **Staff**: Focused gate workflow (Camera Scanner, Late Entry Logging, Student Verification, Entry Logs).
* **Comprehensive Analytics**:
  * 6 KPI Scorecards (Total Students, Today's Late, This Week, This Month, Top Recurrent Student, Worst Department).
  * Visualizations via Recharts (7-Day Daily Trend, Branch Breakdown, Monthly Trajectory, Common Reason Analysis).
  * Habitual Latecomer Leaderboard prioritizing students who need counseling.
* **Institutional Reports & Exports**:
  * Filter by Custom Date Range, Branch/Department, Study Year, and Gate Session.
  * **Download PDF**: Formatted with institutional header, summary statistics, and audit table via `jspdf` and `jspdf-autotable`.
  * **Export Excel**: Structured `.xlsx` spreadsheet with auto-sized columns.

---

## 🛠️ Technology Stack

### Frontend
* **Core**: React 19, Vite, JavaScript (ES Modules)
* **Routing**: React Router Dom v7
* **Styling**: Tailwind CSS v4, Custom CSS Animations (Reticle Laser Line)
* **Icons**: Lucide React
* **Charts**: Recharts
* **Scanner**: `html5-qrcode`
* **Barcode Generator**: `jsbarcode`
* **Document Exports**: `jspdf`, `jspdf-autotable`, `xlsx`
* **HTTP Client**: Axios with JWT request & response interceptors

### Backend
* **Runtime**: Node.js & Express.js
* **Database**: MongoDB & Mongoose ORM (with `mongodb-memory-server` fallback)
* **Security**: JSON Web Tokens (JWT), `bcryptjs` password hashing, `helmet`, `cors`, `express-rate-limit`
* **Logging**: Morgan HTTP logger
* **Architecture**: Controller-Service-Route-Model separation

---

## 📂 Project Architecture

```
Time_Wise/
├── package.json               # Root scripts (run client & server concurrently)
├── README.md                  # Comprehensive documentation
├── server/                    # Node.js + Express backend
│   ├── .env                   # Environment variables
│   ├── .env.example           # Environment template
│   ├── package.json           # Backend dependencies
│   ├── test-api.js            # Automated verification test suite
│   └── src/
│       ├── config/
│       │   └── db.js          # Resilient MongoDB & In-memory connection
│       ├── models/
│       │   ├── User.js        # Staff & Admin accounts
│       │   ├── Department.js  # Engineering/Science departments
│       │   ├── Student.js     # Students with unique barcodes & roll numbers
│       │   └── LateEntry.js   # Late records with compound duplicate index
│       ├── middleware/
│       │   ├── auth.js        # JWT verify & role authorize
│       │   └── errorHandler.js# Centralized error handler
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── departmentController.js
│       │   ├── studentController.js
│       │   ├── lateEntryController.js
│       │   ├── analyticsController.js
│       │   └── reportController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── userRoutes.js
│       │   ├── departmentRoutes.js
│       │   ├── studentRoutes.js
│       │   ├── lateEntryRoutes.js
│       │   ├── analyticsRoutes.js
│       │   └── reportRoutes.js
│       ├── seed/
│       │   └── seedData.js    # Comprehensive demo seeder
│       └── server.js          # Express app entry point
└── client/                    # React + Vite frontend
    ├── index.html             # HTML entry with Plus Jakarta Sans font
    ├── vite.config.js         # Vite configuration with Tailwind & API proxy
    ├── package.json           # Frontend dependencies
    └── src/
        ├── index.css          # Tailwind CSS v4 & custom laser animation
        ├── main.jsx           # React DOM root
        ├── App.jsx            # Router and Protected Routes
        ├── context/
        │   └── AuthContext.jsx# Persistent JWT auth state
        ├── services/
        │   ├── api.js         # Axios interceptor
        │   ├── authService.js
        │   ├── studentService.js
        │   ├── lateEntryService.js
        │   ├── departmentService.js
        │   ├── analyticsService.js
        │   ├── reportService.js
        │   └── userService.js
        ├── components/
        │   ├── Navbar.jsx     # Header with campus clock & user pill
        │   ├── Sidebar.jsx    # Desktop sidebar navigation
        │   ├── MobileNav.jsx  # Mobile phone bottom navigation bar
        │   ├── Layout.jsx     # Master responsive layout
        │   ├── ProtectedRoute.jsx
        │   ├── DashboardCard.jsx
        │   ├── BarcodeScanner.jsx # Mobile camera scanner & laser reticle
        │   ├── BarcodeBadge.jsx   # SVG barcode renderer
        │   ├── Modal.jsx      # Dialog component
        │   ├── Toast.jsx      # Notification alerts
        │   └── LoadingSpinner.jsx
        └── pages/
            ├── Login.jsx      # Login with 1-click Demo Fill buttons
            ├── Dashboard.jsx  # 6 KPI cards & Recharts
            ├── ScanBarcode.jsx# Mobile gate scanner & duplicate blocker
            ├── LateEntries.jsx# Late entries management table & search
            ├── Students.jsx   # Student directory & barcode ID card modal
            ├── Departments.jsx# Department management & stats
            ├── Reports.jsx    # Audit reports with PDF & Excel export
            ├── Analytics.jsx  # Habitual latecomer insights & rankings
            ├── Users.jsx      # Staff & Admin user accounts
            └── Profile.jsx    # User profile & password change
```

---

## 🔐 Default Credentials & Demo Data

The database automatically seeds realistic departments, students, barcodes, and late entries:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@timewise.edu` | `Admin@123` | Full administrative control, all pages |
| **Staff** | `staff@timewise.edu` | `Staff@123` | Barcode scanning, logging, viewing records |

### Sample Student Barcodes for Testing
Point your camera or use the on-screen quick-test buttons:
* `BC-CSE-101` — Aarav Sharma (Computer Science & Engineering)
* `BC-ECE-101` — Rohan Verma (Electronics & Communication)
* `BC-ME-101` — Vikram Singh (Mechanical Engineering)
* `BC-IT-101` — Siddharth Rao (Information Technology)
* `BC-CE-101` — Aditya Joshi (Civil Engineering)

---

## ⚡ Getting Started

### Prerequisites
* **Node.js**: v18+ (tested on v24)
* **npm**: v9+ (tested on v11)
* **MongoDB**: Optional! Connects to local/Atlas MongoDB, or uses embedded in-memory MongoDB automatically.

### Installation

1. **Clone or enter the project directory**:
   ```bash
   cd Time_Wise
   ```

2. **Install all dependencies** (root, server, and client):
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables** (Optional):
   Create `server/.env` based on `server/.env.example`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/timewise
   JWT_SECRET=timewise_super_secret_jwt_key_987654321
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   COLLEGE_NAME=Apex Institute of Engineering & Technology
   ```

4. **Run the Application**:
   Run both backend and frontend concurrently from the root directory:
   ```bash
   npm run dev
   ```
   Or run each service separately:
   * **Backend**: `npm run server` (runs on `http://localhost:5000`)
   * **Frontend**: `npm run client` (runs on `http://localhost:5173`)

5. **Open in Browser**:
   Visit [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & Verification

Run the automated backend test suite:
```bash
node server/test-api.js
```
Expected output:
* `[1] Health Check Status: 200 ✓ PASS`
* `[2] Admin Login Status: 200 ✓ PASS`
* `[3] Staff Login Status: 200 ✓ PASS`
* `[4] Student Barcode Lookup: 200 ✓ PASS`
* `[5] Clean Student Lookup: 200 ✓ PASS`
* `[6] Record Late Entry: 201 ✓ PASS`
* `[7] Duplicate Prevention Check (400 Bad Request): ✓ PASS`
* `[8] Dashboard Analytics: 200 ✓ PASS`
* `[9] Report Export Data: 200 ✓ PASS`

---

## 📡 REST API Specification

### Authentication (`/api/auth`)
* `POST /api/auth/login`: Authenticate user & issue JWT
* `POST /api/auth/logout`: End user session
* `GET /api/auth/me`: Get current authenticated user
* `PUT /api/auth/profile`: Update name and phone
* `PUT /api/auth/change-password`: Update password

### Students (`/api/students`)
* `GET /api/students`: Paginated students with search and department/year filters
* `GET /api/students/:id`: Student details with complete late entry history
* `GET /api/students/barcode/:barcode`: Barcode scan lookup with today's late check
* `POST /api/students`: Register student with unique barcode validation (Admin)
* `PUT /api/students/:id`: Update student details (Admin)
* `DELETE /api/students/:id`: Remove student and associated records (Admin)

### Late Entries (`/api/late-entries`)
* `GET /api/late-entries`: Paginated late entries with multi-filter queries
* `POST /api/late-entries`: Record late entry with duplicate prevention & server timestamp
* `GET /api/late-entries/:id`: Single late entry audit record
* `GET /api/late-entries/student/:studentId`: History for specific student
* `DELETE /api/late-entries/:id`: Remove late entry (Admin)

### Departments (`/api/departments`)
* `GET /api/departments`: List departments with student & late entry aggregations
* `POST /api/departments`: Create department (Admin)
* `PUT /api/departments/:id`: Update department (Admin)
* `DELETE /api/departments/:id`: Delete department (Admin)

### Analytics & Reports (`/api/analytics`, `/api/reports`)
* `GET /api/analytics/dashboard`: 6 KPI metrics, 7-day daily trend, department distribution
* `GET /api/analytics/frequent-late-students`: Top 10 recurrent latecomers
* `GET /api/analytics/monthly`: Academic year monthly trend
* `GET /api/reports/export-data`: Query-filtered dataset for PDF and Excel generation

### User Management (`/api/users` - Admin)
* `GET /api/users`: List staff & admin users
* `POST /api/users`: Create user account
* `PUT /api/users/:id`: Edit user details/role/status
* `DELETE /api/users/:id`: Delete user account

---

## 📱 Mobile Scanner Instructions

1. Open TimeWise on a mobile device and log in as Staff (`staff@timewise.edu` / `Staff@123`).
2. Navigate to **Scan ID Barcode** (`/scan`).
3. Tap **Start Camera** and grant camera permissions.
4. Align the student's physical ID card barcode within the targeting frame.
5. The application extracts the barcode, queries the student, and displays their verified profile.
6. Select the gate session (Morning/Afternoon) and reason cited.
7. Click **Confirm & Record Late Entry**. The system records the entry with an accurate server-side timestamp and shows the confirmation receipt.
8. Tap **Scan Next Student** to immediately scan the next arrival.

---

## 🛡️ License

This project is licensed under the MIT License.
