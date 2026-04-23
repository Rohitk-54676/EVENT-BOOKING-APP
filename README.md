#      🎪 EventPulse — Event Booking Platform

<div align="center">

**A full-stack event discovery and ticket booking platform built with Node.js, Express, PostgreSQL, and Vanilla JavaScript.**

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment-02042B?style=flat-square&logo=razorpay&logoColor=white)](https://razorpay.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-reference) • [Screenshots](#-screenshots)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Frontend Pages](#-frontend-pages)
- [Payment Flow](#-payment-flow)
- [Security](#-security)
- [Known Issues & Notes](#-known-issues--notes)
- [Contributing](#-contributing)

---

## 🎯 About the Project

EventPulse is a full-stack web application that lets users **discover, register for, and book tickets to live events** — from intimate workshops to large-scale concerts. After booking, users receive a **QR-coded digital ticket** via email, which can be scanned at the venue by an admin.

The platform includes a complete **Admin Panel** for organizers to create and manage events, view attendee registrations, export data to Excel, and scan QR tickets using a live camera scanner.

Built with **no frontend framework** — pure HTML5, CSS3, and Vanilla JavaScript — served directly by Express.js as static files.

---

## ✨ Features

### 👤 User Features
- **Event Discovery** — Browse all upcoming events with live search (debounced, searches title + description + location)
- **Event Detail Page** — Full event info, ticket type selection, seat availability indicator
- **Ticket Booking** — Multi-step booking flow with member details form (supports team events)
- **Razorpay Payment** — Secure online payment via Razorpay checkout modal
- **Free Event Booking** — Events with ₹0 price are booked instantly without Razorpay
- **QR Ticket** — After payment, receive a QR-coded ticket via email and view it in My Bookings
- **Flip Ticket Cards** — My Bookings page shows 3D flip cards revealing QR on the back
- **Wishlist** — Save events to a local wishlist (localStorage)
- **Share Events** — Share event links via WhatsApp, Twitter, or Copy Link

### 🔐 Authentication
- **Register with OTP** — Email-based OTP verification before account creation
- **Login with JWT** — 24-hour JWT tokens stored in localStorage
- **Forgot / Reset Password** — OTP-based secure password reset flow
- **Resend OTP** — Cooldown-protected resend with 60-second countdown in UI

### 🛡️ Admin Features
- **Create / Edit Events** — Full event form with dynamic ticket rows (multiple ticket types per event)
- **OTP-Protected Delete** — Admin receives OTP before deleting an event (soft delete)
- **View Registrations** — Paginated, searchable table of all registered attendees
- **Export to Excel** — One-click `.xlsx` download of registration data
- **Ticket Scanner** — Live QR camera scanner + manual code entry to verify and mark tickets as used

### 🎨 UI / UX
- Vibrant dark theme — Pink · Violet · Cyan · Yellow on `#0D0D1A` base
- Glassmorphism navbar with `backdrop-filter: blur(24px)`
- Animated floating blob backgrounds on every page
- 3D card hover effects (`translateY + rotateX + scale`)
- Staggered entrance animations using CSS `nth-child` delays
- Shimmer skeleton loaders while data fetches
- Canvas particle animation on auth pages and home hero
- Fully responsive at **6 breakpoints**: 1024 · 860 · 768 · 560 · 480 · 360px

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** (ESM) | Runtime — all files use `import/export` |
| **Express.js** | HTTP server, routing, static file serving |
| **PostgreSQL** | Primary relational database |
| **pg** (node-postgres) | Database driver with connection pooling |
| **bcrypt** | Password and OTP hashing (10 salt rounds) |
| **jsonwebtoken** | JWT auth tokens (24h expiry) |
| **Razorpay SDK** | Payment gateway — orders + signature verification |
| **crypto** (built-in) | HMAC-SHA256 payment signature verification |
| **Nodemailer** | Email delivery — OTP + ticket emails |
| **Brevo SMTP** | SMTP relay (`smtp-relay.brevo.com:587`) |
| **qrcode** | QR code generation as base64 PNG |
| **ExcelJS** | `.xlsx` generation for registration export |
| **uuid** (v4) | Unique ticket code generation |
| **express-rate-limit** | Rate limiting on OTP, login, booking endpoints |
| **node-cron** | Scheduled cleanup of expired pending bookings |
| **dotenv** | Environment variable management |
| **cors** | Cross-origin resource sharing |

### Frontend
| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure — 13 pages |
| **CSS3** | 9 dedicated stylesheets — custom properties, grid, flexbox, keyframes |
| **Vanilla JavaScript** | 15 JS files — Fetch API, DOM, localStorage, Canvas API |
| **Google Fonts** | Syne (headings) + DM Sans (body) |
| **Font Awesome 6.5** | Icons in admin and booking pages |
| **html5-qrcode** | QR camera scanner library |
| **Razorpay Checkout.js** | Frontend payment SDK |

---

## 📁 Project Structure

```
event-booking-app/
│
├── server/                         ← Backend (Node.js / Express)
│   ├── server.js                   ← Entry point
│   ├── .env                        ← Environment variables (not committed)
│   │
│   ├── config/
│   │   └── db.js                   ← PostgreSQL Pool connection
│   │
│   ├── controllers/
│   │   ├── authController.js       ← Register, Login, OTP, Forgot/Reset password
│   │   ├── eventcontroller.js      ← Events CRUD, Booking, Registrations, Scanner
│   │   ├── paymentController.js    ← Razorpay order, verify, free booking, cleanup
│   │   └── contactController.js    ← Contact form messages
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       ← JWT verify (required + optional)
│   │   └── rateLimiter.js          ← OTP / Login / Booking rate limiters
│   │
│   ├── routes/
│   │   ├── authRoutes.js           ← /api/auth/*
│   │   ├── eventRoutes.js          ← /api/events/*
│   │   ├── paymentRoutes.js        ← /api/payment/*
│   │   └── contactRoute.js         ← /api/contact
│   │
│   ├── utils/
│   │   ├── generateOTP.js          ← 6-digit OTP generator
│   │   ├── sendEmail.js            ← Nodemailer (legacy OTP — moved to frontend)
│   │   ├── sendTicket.js           ← Ticket email with embedded QR code
│   │   └── cleanupExpired.js       ← Cron: delete expired pending bookings
│   │
│   └── public/                     ← Frontend (served as static files)
│       ├── css/
│       │   ├── auth.css            ← Auth pages theme (Login, Register, OTP, etc.)
│       │   ├── index.css           ← Home page
│       │   ├── main.css            ← Events listing page
│       │   ├── event.css           ← Event detail page
│       │   ├── payment.css         ← Payment page
│       │   ├── my-bookings.css     ← My Bookings page
│       │   ├── about.css           ← About page
│       │   ├── contact.css         ← Contact page
│       │   └── admin.css           ← Admin + Registrations + Scanner (shared)
│       │
│       ├── js/
│       │   ├── main.js             ← Home page
│       │   ├── list-events.js      ← Events listing
│       │   ├── event.js            ← Event detail
│       │   ├── payment.js          ← Payment + Razorpay
│       │   ├── my-bookings.js      ← Booking management
│       │   ├── about.js            ← About page
│       │   ├── contact.js          ← Contact form
│       │   ├── admin.js            ← Admin dashboard
│       │   ├── registrations.js    ← Registrations table
│       │   ├── scan.js             ← QR scanner
│       │   ├── login.js            ← Login
│       │   ├── register.js         ← Registration
│       │   ├── verifyotp.js        ← OTP verification
│       │   ├── forgot.js           ← Forgot password
│       │   ├── reset.js            ← Reset password
│       │   └── particles.js        ← Shared canvas particle animation
│       │
│       ├── pages/
│       │   ├── index.html
│       │   ├── login.html
│       │   ├── register.html
│       │   ├── verify-otp.html
│       │   ├── forgot.html
│       │   ├── reset-password.html
│       │   ├── list-events.html
│       │   ├── event.html
│       │   ├── payment.html
│       │   ├── my-bookings.html
│       │   ├── about.html
│       │   ├── contact.html
│       │   ├── admin.html
│       │   ├── registrations.html
│       │   └── scan.html
│       │
│       └── images/
│           └── event-bg.jpg        ← Auth page background image
```

---

## 🗄 Database Schema

```sql
-- Users
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  phone       VARCHAR(15),
  password    TEXT NOT NULL,                    -- bcrypt hash
  role        VARCHAR(20) DEFAULT 'user',       -- 'user' | 'admin'
  is_verified BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- OTP Verifications (temporary store)
CREATE TABLE otp_verifications (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(150) NOT NULL,
  otp         TEXT NOT NULL,                    -- bcrypt hash
  expiry_time TIMESTAMP NOT NULL,
  attempts    INT DEFAULT 0,
  name        VARCHAR(100),
  phone       VARCHAR(15),
  password    TEXT                              -- bcrypt hash (stored during register)
);

-- Events
CREATE TABLE events (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  date         TIMESTAMP NOT NULL,
  location     VARCHAR(255),
  image_url    TEXT,
  created_by   INT REFERENCES users(id),
  is_deleted   BOOLEAN DEFAULT false,           -- soft delete
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Event Tickets (multiple per event)
CREATE TABLE event_tickets (
  id           SERIAL PRIMARY KEY,
  event_id     INT REFERENCES events(id),
  name         VARCHAR(100) NOT NULL,
  price        NUMERIC(10,2) DEFAULT 0,
  max_quantity INT NOT NULL,
  team_size    INT DEFAULT 1,
  is_active    BOOLEAN DEFAULT true
);

-- Registrations
CREATE TABLE registrations (
  id                   SERIAL PRIMARY KEY,
  user_id              INT REFERENCES users(id),
  event_id             INT REFERENCES events(id),
  ticket_id            INT REFERENCES event_tickets(id),
  ticket_code          UUID UNIQUE NOT NULL,     -- for QR
  payment_status       VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'paid'
  status               VARCHAR(20) DEFAULT 'inactive', -- 'inactive' | 'active' | 'used'
  razorpay_order_id    TEXT,
  razorpay_payment_id  TEXT,
  expires_at           TIMESTAMP,               -- pending bookings expire in 10 min
  created_at           TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_ticket UNIQUE (user_id, ticket_id)
);

-- Registration Members (team members per booking)
CREATE TABLE registration_members (
  id                SERIAL PRIMARY KEY,
  registration_id   INT REFERENCES registrations(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  reg_no            VARCHAR(50),
  phone             VARCHAR(15),
  email             VARCHAR(150)
);

-- Contact Messages
CREATE TABLE contact_messages (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  subject     VARCHAR(255) NOT NULL,
  category    VARCHAR(50) DEFAULT 'general',
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL database (local or cloud — Neon, Supabase, Railway all work)
- Razorpay account (test mode keys)
- Brevo account (free SMTP for emails)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Rohitk-54676/EVENT-BOOKING-APP.git
cd eventpulse/server
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

**4. Set up the database**

Run the SQL schema above in your PostgreSQL client, or use:
```bash
psql -U postgres -d your_database -f schema.sql
```

**5. Create an admin user**
```sql
-- After registering normally, update role to admin
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

**6. Start the server**
```bash
# Development
node server.js

# Or with auto-restart
npx nodemon server.js
```

**7. Open the app**
```
http://localhost:5000
```

---

## 🔑 Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (Brevo SMTP)
EMAIL_USER=your_brevo_login_email@example.com
EMAIL_PASS=your_brevo_smtp_password

# Server
PORT=5000
```

### Getting the credentials

**Razorpay:**
1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to Settings → API Keys → Generate Test Key
3. Copy Key ID and Key Secret

**Brevo SMTP:**
1. Sign up at [brevo.com](https://brevo.com) (free — 300 emails/day)
2. Go to SMTP & API → SMTP tab
3. Copy login and password

**PostgreSQL (Neon — free cloud):**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a project → copy the connection string

---

## 📡 API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/register` | — | `{ name, email, phone, password }` | Register user, returns OTP |
| POST | `/verify-otp` | — | `{ email, otp }` | Verify OTP, creates user account |
| POST | `/login` | — | `{ email, password }` | Login, returns JWT token + role |
| POST | `/forgot-password` | — | `{ email }` | Send reset OTP |
| POST | `/reset-password` | — | `{ email, otp, newPassword }` | Reset password with OTP |
| POST | `/resend-otp` | — | `{ email }` | Resend OTP (rate limited) |

### Events — `/api/events`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Optional | Get all active events |
| POST | `/` | Admin | Create new event with tickets |
| GET | `/admin/events` | Admin | Get events created by this admin |
| GET | `/my-bookings` | Required | Get current user's paid bookings |
| POST | `/verify-ticket` | Admin | Verify and mark QR ticket as used |
| GET | `/:id` | Optional | Get single event with tickets and user booking status |
| PUT | `/:id` | Admin | Update event and tickets |
| POST | `/:id/register` | Required | Create booking (pre-payment) |
| GET | `/:id/registrations` | Admin | Get all paid registrations for event |
| GET | `/:id/export` | Admin | Download `.xlsx` of registrations |
| POST | `/:id/send-delete-otp` | Admin | Send OTP for event deletion |
| POST | `/:id/delete` | Admin | Soft-delete event with OTP confirmation |

### Payment — `/api/payment`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/create-order` | Required | `{ registrationId }` | Create Razorpay order |
| POST | `/verify` | Required | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId }` | Verify payment signature, confirm booking |
| POST | `/delete` | Required | `{ registrationId }` | Delete failed/cancelled booking |
| POST | `/free-booking` | Required | `{ registrationId }` | Confirm free (₹0) booking directly |

### Contact — `/api/contact`

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/` | — | `{ name, email, subject, category, message }` | Submit contact message |
| GET | `/` | — | — | Get all messages (add admin auth in production) |

---

## 🖥 Frontend Pages

| Page | URL | Description |
|---|---|---|
| Home | `/` | Hero, stats counter, latest events, city explorer, testimonials, newsletter |
| Login | `/pages/login.html` | JWT login with error handling (wrong password shows forgot link) |
| Register | `/pages/register.html` | OTP registration with password strength meter |
| Verify OTP | `/pages/verify-otp.html` | 6-box OTP input with auto-advance and resend timer |
| Forgot Password | `/pages/forgot.html` | Email entry to trigger password reset OTP |
| Reset Password | `/pages/reset-password.html` | OTP + new password with strength bar |
| Events | `/pages/list-events.html` | All events with live search, 3D tilt cards, wishlist |
| Event Detail | `/pages/event.html?id=X` | Event info, ticket selection, share buttons |
| Payment | `/pages/payment.html?id=X&ticket=Y` | Member forms, Razorpay checkout |
| My Bookings | `/pages/my-bookings.html` | Flip-to-QR ticket cards with status filter |
| About | `/pages/about.html` | Team, mission, animated orbital visual |
| Contact | `/pages/contact.html` | FAQ accordion, validated contact form |
| Admin | `/pages/admin.html` | Event CRUD with OTP delete |
| Registrations | `/pages/registrations.html?id=X` | Searchable attendee table |
| Scanner | `/pages/scan.html` | Live QR camera + manual entry verification |

---

## 💳 Payment Flow

```
User selects ticket on event.html
            │
            ▼
POST /api/events/:id/register
→ Creates registration (payment_status: 'pending', expires_at: +10 min)
→ Returns registrationId
            │
            ▼
POST /api/payment/create-order
→ Extends expires_at by 15 min
→ Creates Razorpay order (amount in paise)
→ Returns orderId + key
            │
            ▼
Razorpay.open() ── modal opens ──► User pays
            │                            │
      ondismiss                     handler()
            │                            │
            ▼                            ▼
POST /api/payment/delete      POST /api/payment/verify
(cleans up pending row)       → HMAC-SHA256 signature check
                              → UPDATE: payment_status='paid', status='active'
                              → Generate QR code (base64)
                              → COMMIT transaction
                              → Send ticket email (background)
                              → Redirect to /my-bookings.html

── FREE TICKET PATH (price = 0) ──────────────────────────────
POST /api/events/:id/register  →  POST /api/payment/free-booking
→ Skip Razorpay entirely           → Mark paid, generate QR, send email
```

---

## 🔒 Security

| Layer | Implementation |
|---|---|
| Password storage | bcrypt hash, 10 salt rounds |
| OTP storage | bcrypt hash — never plain text in DB |
| OTP brute force | Max 3 attempts per session, then locked |
| OTP expiry | 5-minute TTL, auto-cleaned |
| JWT | Signed with `JWT_SECRET`, 24h expiry |
| Payment verification | HMAC-SHA256 signature check against Razorpay secret |
| Rate limiting | OTP: 3/5min · Login: 10/5min · Booking: 10/1min |
| DB transactions | `BEGIN/COMMIT/ROLLBACK` on all multi-step operations |
| Race condition prevention | `SELECT ... FOR UPDATE` row lock on ticket booking |
| Duplicate payment guard | `payment_status !== 'paid'` check with row lock |
| Duplicate booking guard | DB `UNIQUE (user_id, ticket_id)` constraint |
| Role-based access | `req.user.role === 'admin'` check on protected endpoints |
| Seat expiry | Pending bookings expire in 10 minutes via cron cleanup |

---

## 📧 Email System

EventPulse uses **Nodemailer with Brevo SMTP** for ticket delivery:

- After a paid booking (Razorpay or free), a ticket confirmation email is sent
- Email contains event name, date, location, ticket type, and an **inline QR code image**
- QR image is embedded as a CID attachment (`cid:qrcode`) — displays in all major email clients
- Email sending runs in `setImmediate()` — non-blocking, does not delay API response
- OTP delivery has been moved to the frontend side (returned directly in API response)

---

## 🔧 Known Issues & Notes

- **OTP in API response:** For development simplicity, OTPs are returned directly in the API response instead of being emailed. In production, remove the `otp` field from responses and rely on `sendEmail.js` / `sendOTP()` to deliver OTPs via email.

- **node-cron missed execution warnings:** On server restart, `node-cron` logs WARN messages for every minute the server was offline. These are informational only — functionality is not affected. Add `recoverMissedExecutions: false` to suppress them.

- **Admin delete OTP store:** The OTP for event deletion is stored in a JavaScript in-memory object (`otpStore`). This resets on server restart. For production, move to Redis or a DB table.

- **Contact GET endpoint:** `GET /api/contact` is currently open. Add `authMiddleware` + admin role check before deploying to production.

- **CORS:** Currently set to `origin: '*'`. Restrict to your frontend domain in production:
  ```js
  app.use(cors({ origin: 'https://yourdomain.com' }));
  ```

- **Razorpay test mode:** The project ships configured for Razorpay test mode. Use test card `4111 1111 1111 1111`, CVV `123`, any future expiry, OTP `1234`.

---

## 🧪 Testing the Payment Flow

Use Razorpay test credentials:

| Field | Value |
|---|---|
| Card Number | `4111 1111 1111 1111` |
| Expiry | Any future date (e.g. `12/26`) |
| CVV | `123` |
| OTP | `1234` |

Or use UPI test ID: `success@razorpay`

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "bcrypt": "^5.x",
    "cors": "^2.x",
    "dotenv": "^17.x",
    "exceljs": "^4.x",
    "express": "^4.x",
    "express-rate-limit": "^7.x",
    "jsonwebtoken": "^9.x",
    "node-cron": "^3.x",
    "nodemailer": "^6.x",
    "pg": "^8.x",
    "qrcode": "^1.x",
    "razorpay": "^2.x",
    "uuid": "^9.x"
  }
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**EventPulse** — Built with ❤️ for event lovers

*Node.js · Express · PostgreSQL · Razorpay · Vanilla JS*

</div>
