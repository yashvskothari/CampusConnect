# Admin API

Base: `/api/admin` — every endpoint needs `Authorization: Bearer <token>` of an **active ADMIN** user.
List endpoints return `{ data, pagination: { total, page, limit, totalPages } }` and accept `?page=&limit=` (limit max 100).

| Method | Path | Purpose |
|---|---|---|
| GET | `/stats` | Dashboard numbers: users by role/status, jobs by status, payment volume + commission, signups per day (30d) |
| GET | `/users` | List users. Query: `search` (name/email), `role`, `status`, `sortBy` (createdAt,name,email,rating,lastLoginAt), `order` |
| GET | `/users/export` | CSV download (same filters as list) |
| GET | `/users/:id` | Detail + activity counts + recent jobs/bids/payments |
| POST | `/users` | Create user `{ name, email, password, role: CLIENT\|FREELANCER, bio?, skills? }` |
| PUT | `/users/:id` | Edit `{ name?, email?, bio?, skills?, role? }` |
| PATCH | `/users/:id/suspend` | `{ reason? }` — locks the user out immediately |
| PATCH | `/users/:id/unsuspend` | Reactivate |
| POST | `/users/:id/reset-password` | `{ newPassword }` |
| DELETE | `/users/:id` | Permanent delete. Returns 409 if user has active work; add `?force=true` to override |
| POST | `/users/bulk` | `{ action: "suspend"\|"unsuspend"\|"delete", userIds: [...], reason? }` |
| GET / PATCH / DELETE | `/jobs`, `/jobs/:id/status`, `/jobs/:id` | Moderate jobs (`status` filter, `search`) |
| GET / DELETE | `/services`, `/services/:id` | Moderate services |
| GET / DELETE | `/reviews`, `/reviews/:id` | Remove abusive reviews (rating recalculated). `?maxRating=2` to find low ones |
| GET | `/payments` | Read-only payments list + totals (`status` filter) |
| GET | `/audit-logs` | Who did what. Filters: `action`, `targetType`, `targetId` |

Rules: admins cannot modify/suspend/delete other admins or themselves, and admin accounts are not creatable through the API.
Suspended users get `403 { code: "ACCOUNT_SUSPENDED" }` on login and on every request.
