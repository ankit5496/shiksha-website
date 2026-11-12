# API Reference

Base URL: `http://localhost:5000/api` (the Vite dev server proxies `/api`).
Authenticated requests send `Authorization: Bearer <token>`. Errors return `{ "message": string, "details"?: object }`.

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | `{ status, storage: "json" \| "mongo", time }` |

## Authentication

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/login` | – (rate-limited: 30 / 15 min) | `{ email, password, role? }` | `{ user, token }` · `401` bad credentials · `403` account not allowed in the requested portal |
| GET | `/auth/me` | any | – | `{ user }` |

`user` never includes the password hash. The JWT carries `sub`, `role`, `studentIds` (parent), `studentId` (student), `teacherId` (teacher).

## Generic resources

`/:collection` is one of:
`students, teachers, classes, subjects, timetable, attendance, homework, exams, results, announcements, circulars, events, leaves, notifications, feeStructures, studentFees, payments, drivers, routes, buses, materials, assignments, submissions, gallery, enquiries`

| Method | Path | Description |
|---|---|---|
| GET | `/:collection` | List. Query-string equality filters supported (`?classId=c8&section=A`). |
| GET | `/:collection/:id` | Single record. |
| POST | `/:collection` | Create (required fields validated; `id` generated if omitted). `201`. |
| PUT / PATCH | `/:collection/:id` | Merge-update. |
| DELETE | `/:collection/:id` | Delete. `204`. |
| POST | `/:collection/bulk` | Upsert an array of records by `id` (e.g. a day's attendance, mark-all-read). |

### Permissions (`backend/config/permissions.js`)

| Collection | Read | Write | Extra |
|---|---|---|---|
| students | all roles* | admin, office | |
| teachers | admin, office, teacher | admin | |
| classes, subjects, timetable, exams | all | admin | |
| attendance | all* | admin, office, teacher | |
| homework, materials, assignments | all | admin, teacher | |
| results | all* | admin, teacher | |
| announcements, events | all + public read | admin, office | |
| circulars, feeStructures, drivers, routes, buses | all | admin, office | |
| studentFees, payments | all* | admin, office | parents pay via `/fees/*` |
| leaves | all* | admin, office, teacher | parents may **create** for own child (status forced to `Pending`) |
| submissions | all* | admin, teacher | students may create/update **own**, cannot set marks/feedback |
| notifications | own target only | admin, office | any user may set `read` on own notifications |
| gallery | all + public read | admin, office | |
| enquiries | admin, office | admin, office | **public create** (status forced to `New`) |

\* Scoped: parents only see their children's records, students only their own (`students`, `attendance`, `results`, `leaves`, `studentFees`, `payments`, `submissions`).
`users` is not exposed.

## Fees

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/fees/orders` | parent (own child), admin, office | `{ studentId, amount, installment, method }` | `201 { orderId, amount, currency, gateway }` · `400` if the instalment is already paid |
| POST | `/fees/verify` | same user who created the order | `{ orderId, simulate?: "success"\|"failure", paymentId?, signature? }` | `{ ok, payment, message }` – records a `Success` (with receipt no. `SPS/2026-27/NNNN`) or `Failed` payment |
| POST | `/fees/webhook` | gateway | gateway payload | `{ received: true }` (placeholder – verify signature in production) |

## Transport

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/transport/live` | any (parents: only their child's bus) | – | `{ updatedAt, buses: [{ bus, location: { busId, lat, lng, speed, heading, updatedAt, source: "gps"\|"simulated" } }] }` |
| POST | `/transport/location` | header `x-device-key: <GPS_DEVICE_KEY>` | `{ busId, lat, lng, speed?, heading? }` | `202` latest fix |

## Examples

```bash
# login
curl -X POST localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"parent@schooldemo.com","password":"Demo@123","role":"parent"}'

# list my children
curl localhost:5000/api/students -H "Authorization: Bearer $TOKEN"

# pay an instalment (simulated)
curl -X POST localhost:5000/api/fees/orders -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"studentId":"s1","amount":9000,"installment":"Quarter 3 (Oct–Dec)","method":"UPI"}'
curl -X POST localhost:5000/api/fees/verify -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"orderId":"<orderId>","simulate":"success"}'
```
