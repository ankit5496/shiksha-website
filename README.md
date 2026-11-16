# Shiksha Public School, Beawar – School Website & Management Platform (Client Demo)

A premium public website plus a complete school ERP prototype for **Shiksha Public School, Beawar, Rajasthan**:
public website, Parent Portal, Office/Admin Portal, Online Fees Portal, Learning Management System (students & teachers),
photo/video gallery and live school-bus tracking.

> **Demo build.** Only the school's name and town were provided. Contact details, statistics, names, photographs,
> fee amounts and all records are **sample content** and are labelled as such in the UI. See
> [Replacing demo content](#replacing-demo-content) before going live.

---

## Contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Demo credentials](#demo-credentials)
- [Data modes](#data-modes)
- [Architecture](#architecture)
- [Environment variables](#environment-variables)
- [Integrations](#integrations): Google Maps · Payment gateway · GPS hardware · Cloudinary
- [Replacing demo content](#replacing-demo-content)
- [Security notes](#security-notes)
- [API reference](docs/API.md)

---

## Features

| Module | Highlights |
|---|---|
| **Public website** | Home (hero, welcome, about, principal's message, programmes, facilities, why choose us, highlights, news, events, gallery preview, testimonials, admission enquiry, map), About, Academics, Admissions (process, eligibility, documents, enquiry form, downloadable PDF form), Gallery (category filters, image & video lightbox), Contact (form, map, office timings). |
| **Authentication** | Role-based login for Admin, Office Staff, Parent, Teacher and Student; each role is routed to its own portal and blocked from others (frontend route guards + backend JWT/permission checks). |
| **Parent Portal** | Student profile, multi-child switcher, attendance summary & calendar, today's timetable, homework, exam schedule, results & progress, announcements, circulars, leave applications, notifications, fee history & receipts, bus details & live tracking. |
| **Office / Admin Portal** | Student CRUD & admissions, teacher management (admin), attendance marking & monthly reports, fee structures / assignment / discounts / late fees / reports, classes, subjects, timetables, exams & results (admin), announcements, notifications, circulars, events, buses, drivers, routes, student-route assignment and live fleet monitor, website enquiries. |
| **Online Fees Portal** | Annual total, paid, outstanding, due dates, category breakdown, payment history, PDF receipts, simulated checkout (UPI / card / net-banking) with **success and failure** states. |
| **LMS – Student** | Subject-wise materials, downloadable notes, video lectures, exam preparation, assignments with submission, deadlines & status, grades and feedback. |
| **LMS – Teacher** | Upload materials & videos, create assignments, review submissions, award marks & feedback, mark attendance, personal timetable. |
| **Transport tracking** | Map-centred dashboard with route polyline, stops, animated bus marker on **simulated GPS**, ETA, status (On Route / Stopped / Reached School), driver & bus details. Ready for real GPS via `POST /api/transport/location`. |

---

## Tech stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · React Router · Framer Motion · Lucide icons · Leaflet (OpenStreetMap) / Google Maps · jsPDF
**Backend:** Node.js · Express · JWT (jsonwebtoken) · bcryptjs · Helmet · express-rate-limit
**Database:** MongoDB via Mongoose (production) — with a zero-setup JSON file store used automatically when `MONGODB_URI` is not set.

**Why MongoDB?** School records vary a lot per module (fee structures with nested items/instalments, routes with stop arrays,
LMS content with mixed attachments). A document model maps 1:1 to the TypeScript domain types and lets the demo evolve without migrations.

---

## Quick start

Requirements: **Node.js 18+** (tested on Node 24).

```bash
# 1. install everything (root + frontend + backend)
npm install
npm run install:all

# 2a. Frontend only – fully interactive demo, data stored in the browser (no backend needed)
npm run dev:web                 # http://localhost:5173

# 2b. Full stack – frontend + Express API
cp backend/.env.example backend/.env
echo "VITE_DATA_MODE=api" > frontend/.env.local
npm run dev                     # web :5173, API :5000 (Vite proxies /api → :5000)
```

Other useful scripts:

| Command | Where | What it does |
|---|---|---|
| `npm run build` | root | Type-checks and builds the frontend into `frontend/dist` |
| `npm run export-seed` | frontend | Regenerates `backend/data/seed.json` from the same generator the browser demo uses |
| `npm run seed` | backend | Resets the database (JSON store or MongoDB) from `data/seed.json` |
| `npm start` | backend | Runs the API without file watching |

In mock mode, use **Reset demo data** in the profile menu of any portal to restore all sample records.

---

## Demo credentials

All demo accounts use the password **`Demo@123`**.

| Role | Email | Lands on |
|---|---|---|
| Admin | `admin@schooldemo.com` | `/admin` |
| Office Staff | `office@schooldemo.com` | `/office` |
| Parent (2 children: Aarav – Class 8 A, Bus 01; Ananya – Class 4 A, Bus 02) | `parent@schooldemo.com` | `/parent` (Fees Portal at `/fees`) |
| Teacher (Neha Mathur – Science) | `teacher@schooldemo.com` | `/teacher` |
| Student (Aarav Sharma – Class 8 A) | `student@schooldemo.com` | `/student` |

---

## Data modes

The frontend talks to data only through `frontend/src/services/dataService.ts` (a generic repository) and a few domain services.

| `VITE_DATA_MODE` | Behaviour |
|---|---|
| `mock` *(default)* | In-browser database in `localStorage`, seeded from `src/data/seed.ts`. Works on any static host. |
| `api` | Same calls go to the Express API (`GET/POST /api/:collection`, `PUT/DELETE /api/:collection/:id`, `/api/auth/*`, `/api/fees/*`). |

Because both modes share one interface and the same seed generator, replacing mock data with the real API requires no UI changes.

---

## Architecture

```
web-template/
├── package.json                 # root scripts (concurrently)
├── frontend/
│   ├── scripts/export-seed.ts   # writes backend/data/seed.json
│   └── src/
│       ├── components/ui/       # Button, Form (Input/Select/SearchSelect), Modal, DataTable, Badge, StatCard…
│       ├── components/site/     # Logo, Navbar, Footer, PageHero, SectionHeading
│       ├── layouts/             # PublicLayout, DashboardLayout (sidebar, topbar, notifications, profile menu)
│       ├── pages/public/        # Home, About, Academics, Admissions, Gallery, Contact, Login, NotFound
│       ├── modules/
│       │   ├── parent/          # dashboard, profile, attendance, timetable, homework, exams, notices, leave, messages
│       │   ├── admin/           # students, teachers, attendance, fees, academics, communication, transport, enquiries, settings
│       │   ├── office/          # office dashboard (reuses admin modules with office permissions)
│       │   ├── teacher/ student/ lms/   # LMS for both roles
│       │   ├── fees/            # Fees overview, standalone Fees Portal, checkout
│       │   └── transport/       # bus simulation hook, map component, parent tracker, fleet monitor
│       ├── routes/              # AppRoutes, ProtectedRoute, role navigation
│       ├── services/            # config, http client, mockDb, dataService, authService, paymentService
│       ├── hooks/               # useCollection, useForm, useStudentContext
│       ├── context/             # AuthContext, ToastContext
│       ├── data/                # school profile (demo-flagged), image catalogue, seed generator
│       ├── types/               # domain types shared conceptually with the backend
│       └── utils/               # formatting, fee maths, PDF generation
└── backend/
    ├── server.js                # Express app: helmet, CORS, JSON, rate limiting, routes, errors
    ├── config/                  # env, db connection, permissions matrix
    ├── models/                  # Mongoose models (User + one per collection)
    ├── services/                # repository (Mongo / JSON adapters), auth, payment gateway, transport, seed
    ├── middleware/              # auth (JWT), authorize (role/collection), scope (parent/student data), validate, errors
    ├── controllers/             # auth, generic resources, fees, transport
    ├── routes/                  # /api/auth, /api/fees, /api/transport, /api/:collection
    ├── utils/                   # logger, HttpError, seed script
    └── data/                    # seed.json (committed), db.json (runtime, git-ignored)
```

**Access control (backend).** `config/permissions.js` defines read/write roles per collection.
Parents only receive records for their own children and students only their own (`middleware/scope.js`);
parents can create leave requests and pay fees only for their children; students can submit but never grade work;
user accounts are never exposed through the generic API.

---

## Environment variables

### `frontend/.env.local`
| Variable | Default | Purpose |
|---|---|---|
| `VITE_DATA_MODE` | `mock` | `mock` or `api` |
| `VITE_GOOGLE_MAPS_API_KEY` | *(empty)* | Enables Google Maps in the bus tracker; falls back to OpenStreetMap/Leaflet when empty |

### `backend/.env` (see `backend/.env.example`)
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `JWT_SECRET` | dev placeholder | **Required in production** – long random string |
| `JWT_EXPIRES_IN` | `8h` | Token lifetime |
| `MONGODB_URI` | *(empty)* | Use MongoDB; empty → JSON file store |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
| `DEMO_PASSWORD` | `Demo@123` | Password hashed into every seeded account |
| `PAYMENT_GATEWAY` | `simulated` | `simulated` or `razorpay` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | – | Gateway credentials (production) |
| `GPS_DEVICE_KEY` | `demo-gps-device-key` | Shared secret for GPS devices |
| `CLOUDINARY_URL` | – | Media storage (production) |

---

## Integrations

### Google Maps (bus tracking)
1. In Google Cloud Console enable **Maps JavaScript API** and create an API key.
2. Restrict the key to your domains (HTTP referrers) and to the Maps JavaScript API.
3. Set `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env.local` and restart Vite.

Without a key, the tracker uses **OpenStreetMap via Leaflet** so the demo always works. The contact page uses a keyless Google Maps embed.

### Payment gateway (online fees)
The demo uses `SimulatedGateway` — **no real money moves**; the presenter chooses success or failure.
Production flow (`backend/services/paymentGateway.js`, `controllers/feesController.js`):
1. `POST /api/fees/orders` – server creates a gateway order with the secret key (amount is decided server-side).
2. Frontend opens the gateway checkout with the public key + `orderId`.
3. `POST /api/fees/verify` – server verifies the signature (HMAC SHA-256 of `order_id|payment_id`), records the payment and issues the receipt number.
4. `POST /api/fees/webhook` – gateway notifications for reconciliation (verify the webhook signature on the raw body; make it idempotent).

To go live with Razorpay: `npm i razorpay` in `backend`, complete the TODOs in `RazorpayGateway`, set `PAYMENT_GATEWAY=razorpay` and the keys, persist orders in a collection, compute the amount due on the server (do not trust the client), and test in Razorpay test mode first.

### GPS hardware / driver app
Devices (or a driver mobile app) push positions:

```http
POST /api/transport/location
x-device-key: <GPS_DEVICE_KEY>
Content-Type: application/json

{ "busId": "b1", "lat": 26.1052, "lng": 74.3268, "speed": 28, "heading": 90 }
```

`GET /api/transport/live` returns the latest fix per bus (`source: "gps"`), falling back to the route simulator when no fix has arrived in the last 2 minutes.
For production: issue one key per device, persist location history (MongoDB time-series collection), and push updates to clients over WebSockets/SSE instead of polling.

### Cloudinary (photos & videos)
Planned media flow: admin uploads → backend requests a **signed upload** (`CLOUDINARY_URL`) → browser uploads directly to Cloudinary →
the returned `secure_url` / `public_id` is saved in the `gallery` / `materials` collections. Use Cloudinary transformations for thumbnails
(`w_600,c_fill,q_auto,f_auto`) and adaptive video streaming. In the demo, gallery images are Unsplash stock photos and videos are CC0 sample clips.

---

## Replacing demo content

Everything below is **placeholder** and must be confirmed with the school management:

- [ ] **Contact details** – street address, phone, email, office timings, social links (`frontend/src/data/school.ts`)
- [ ] **Map location** – campus coordinates (`school.coords`) and the bus-route school point (`SCHOOL_PT` in `seed.ts`)
- [ ] **Logo / crest** – replace the placeholder crest in `components/site/Logo.tsx`
- [ ] **Principal** – name, photograph and message
- [ ] **Board affiliation, classes offered** (Senior Secondary not shown because it is unverified), school history, vision & mission wording
- [ ] **Statistics, achievements, results, testimonials** – none are real
- [ ] **Photographs** – all images are Unsplash stock (`data/images.ts`); videos are CC0 MDN samples
- [ ] **People** – every student, parent, teacher, driver and staff name is fictional
- [ ] **Fees** – amounts, instalment dates, late-fee rules and concessions are illustrative
- [ ] **Transport** – bus numbers, registrations, routes, stops, timings and GPS positions are simulated
- [ ] **Academic data** – timetables, exams, homework, circulars, events and announcements are samples
- [ ] **Demo accounts** – remove or disable all `@schooldemo.com` accounts

---

## Security notes

- The demo password `Demo@123` is public — **never** use seeded accounts in production.
- Set a strong `JWT_SECRET` (the server refuses to start in production without one) and keep `.env` files out of git (already ignored).
- Passwords are stored as bcrypt hashes; login is rate-limited; Helmet sets secure headers; CORS is restricted to `CORS_ORIGIN`.
- The backend enforces role permissions and record scoping independently of the UI — frontend guards are for UX only.
- Mock mode stores data in the browser's `localStorage` and performs no real authentication; use it for presentations only.
- Before launch: move tokens to httpOnly cookies, add refresh tokens & account lockout, add audit logging for fee and attendance changes, enable HTTPS, and run a security review.
