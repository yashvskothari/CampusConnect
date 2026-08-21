# CampusConnect - API Documentation

Base URL: `http://localhost:5000/api` (development)

All protected routes require header: `Authorization: Bearer <token>`

---

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Login and receive JWT |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/auth/logout` | Yes | Logout (client-side token removal) |

### POST /auth/signup
```json
{
  "name": "Alex Rivera",
  "email": "alex@example.com",
  "password": "password123",
  "role": "FREELANCER",
  "bio": "CS student",
  "skills": ["React", "Node.js"]
}
```

### POST /auth/login
```json
{ "email": "alex@example.com", "password": "password123" }
```

---

## Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | No | List users (search, role filter) |
| GET | `/users/:id` | No | Get user profile with reviews |
| PUT | `/users/:id` | Yes | Update profile (own or admin) |

---

## Services

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/services` | No | - | List services (search, category, price, rating filters) |
| GET | `/services/:id` | No | - | Get service details |
| POST | `/services` | Yes | FREELANCER, ADMIN | Create service |
| PUT | `/services/:id` | Yes | Owner, ADMIN | Update service |
| DELETE | `/services/:id` | Yes | Owner, ADMIN | Delete service |

Query params for GET: `search`, `category`, `minPrice`, `maxPrice`, `minRating`

---

## Jobs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/jobs` | No | - | List jobs |
| GET | `/jobs/:id` | No | - | Get job with bids |
| POST | `/jobs` | Yes | CLIENT, ADMIN | Create job |
| PATCH | `/jobs/:id/status` | Yes | Owner, ADMIN | Update job status |

---

## Bids

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/bids` | Yes | - | List bids (filter by jobId, freelancerId, status) |
| POST | `/bids` | Yes | FREELANCER, ADMIN | Submit bid |
| PATCH | `/bids/:id/accept` | Yes | CLIENT, ADMIN | Accept bid (creates payment) |
| PATCH | `/bids/:id/reject` | Yes | CLIENT, ADMIN | Reject bid |

---

## Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages/conversations` | Yes | List user's conversations |
| POST | `/messages/conversations` | Yes | Create/get conversation |
| GET | `/messages/conversations/:id/messages` | Yes | Get messages |
| POST | `/messages/conversations/:id/messages` | Yes | Send message (multipart for files) |

---

## Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reviews` | No | List reviews (filter by revieweeId) |
| POST | `/reviews` | Yes | Create review (updates user rating) |

---

## Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payments` | Yes | List payments |
| POST | `/payments/mock-checkout` | Yes | Initiate mock checkout |
| POST | `/payments/mock-complete` | Yes | Complete mock payment |

---

## Recommendations

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/recommendations/jobs` | Yes | FREELANCER | AI job matches with scores |
| GET | `/recommendations/bid/:jobId` | Yes | FREELANCER | Bid suggestion for a job |

---

## Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_conversation` | Client → Server | `conversationId` |
| `leave_conversation` | Client → Server | `conversationId` |
| `send_message` | Client → Server | `{ conversationId, text, fileUrl? }` |
| `new_message` | Server → Client | Message object |
| `typing` | Both | `{ conversationId, userId, isTyping }` |

Connect with: `io(SOCKET_URL, { auth: { token } })`
