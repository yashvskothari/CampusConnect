# Student Gig Marketplace

> A full-stack freelance marketplace MVP where students offer services, post jobs, bid on tasks, chat in real-time, and receive AI-powered recommendations.

![CampusConnect Banner](docs/screenshots/banner.png)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Folder Structure](#folder-structure)
5. [Tech Stack](#tech-stack)
6. [Database Design](#database-design)
7. [API Documentation](#api-documentation)
8. [Environment Variables](#environment-variables)
9. [Local Setup](#local-setup)
10. [Build Commands](#build-commands)
11. [Deployment Instructions](#deployment-instructions)
12. [Troubleshooting](#troubleshooting)
13. [Future Improvements](#future-improvements)
14. [Internship Learnings](#internship-learnings)

---

## Project Overview

CampusConnect is a freelance marketplace inspired by Fiverr, Freelancer.com, and Upwork — simplified and tailored for students. It demonstrates full-stack development including authentication, role-based access, CRUD operations, real-time features, clean UI/UX, database modeling, and production deployment.

**Live Demo:** Deploy to Vercel + Render (see [Deployment](#deployment-instructions))

### Architecture

```mermaid
flowchart LR
    User --> ReactFrontend
    ReactFrontend --> ExpressAPI
    ExpressAPI --> PostgreSQL
    ExpressAPI --> SocketServer
```

### Request Flow

```mermaid
sequenceDiagram
    User->>Frontend: Click action
    Frontend->>Backend: API request
    Backend->>Database: Query
    Database-->>Backend: Data
    Backend-->>Frontend: Response
    Frontend-->>User: Render update
```

### Deployment

```mermaid
flowchart TD
    Browser --> Vercel
    Vercel --> Render
    Render --> NeonDB
```

---

## Features

### Authentication

- Signup / Login with JWT
- Password hashing (bcrypt)
- Protected routes
- Role-based access (Freelancer, Client, Admin)

### Marketplace

- Browse services with search, category, price, and rating filters
- Post jobs with budget, deadline, and category
- Submit bids with proposal, quote, and delivery estimate
- Accept/reject bids with automatic payment initiation

### Dashboards

- **Freelancer:** Profile summary, services, bids, active jobs, AI recommendations
- **Client:** Posted jobs, received bids, hired freelancers, payment history

### Real-time Chat

- Socket.io one-to-one messaging
- Typing indicators
- File upload support (optional)

### AI Features (Rule-Based)

- **Job Matchmaker:** Weighted compatibility scoring (skills 40%, category 30%, rating 20%, experience 10%)
- **Smart Bid Assistant:** Suggested bid amount, delivery time, and proposal template

### Mock Payments

- Simulated Stripe checkout flow
- 15% platform commission calculation
- Payment history records

### Reviews

- Rate users 1-5 stars with comments
- Aggregate ratings on profiles

---

## Screenshots

| Page                                         | Description                                  |
| -------------------------------------------- | -------------------------------------------- |
| ![Landing](docs/screenshots/landing.png)     | Landing page with hero, features, and CTA    |
| ![Dashboard](docs/screenshots/dashboard.png) | Freelancer dashboard with AI recommendations |
| ![Jobs](docs/screenshots/jobs.png)           | Job listings with bid submission             |
| ![Services](docs/screenshots/services.png)   | Services listings with proposed prices       |
| ![Chat](docs/screenshots/chat.png)           | Real-time messaging interface                |

---

## Folder Structure

```
campusconnect/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Button, Card, Navbar, Avatar, etc.
│   │   ├── pages/              # Landing, Login, Jobs, Dashboards, Chat
│   │   │   └── dashboard/      # Freelancer & Client dashboard pages
│   │   ├── layouts/            # MainLayout, DashboardLayout
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # Axios API client
│   │   ├── context/            # AuthContext
│   │   ├── routes/             # ProtectedRoute
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Helpers (formatCurrency, cn, etc.)
│   ├── vercel.json             # Vercel SPA routing
│   └── .env.example
├── server/                     # Express backend
│   ├── src/
│   │   ├── routes/             # auth, users, services, jobs, bids, etc.
│   │   ├── middleware/         # JWT auth + role authorization
│   │   ├── services/           # AI recommendation engine
│   │   ├── socket/             # Socket.io handlers
│   │   ├── utils/              # JWT, Prisma client, params helper
│   │   └── types/              # Express type extensions
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Demo data seeder
│   └── render.yaml             # Render deployment notes
├── docs/                       # Documentation
│   ├── PRD.md                  # Product Requirements
│   ├── TRD.md                  # Technical Requirements
│   ├── API.md                  # API Reference
│   ├── DATABASE.md             # Database schema docs
│   ├── ARCHITECTURE.md         # Architecture diagrams
│   └── DEVELOPMENT_PLAN.md     # Development timeline
├── README.md                   # This file
├── TASKS.md                    # Feature checklist
├── PROJECT_STATUS.md           # Progress tracker
├── PROJECT_COMPLETE.md         # Completion confirmation
├── RESUME_POINTS.md            # Resume bullet points
├── .env.example                # Environment template
└── package.json                # Root scripts
```

---

## Tech Stack

| Category          | Technology                                           |
| ----------------- | ---------------------------------------------------- |
| **Frontend**      | React 19, TypeScript, Vite 8, Tailwind CSS 4         |
| **Routing**       | React Router 7                                       |
| **Forms**         | React Hook Form + Zod                                |
| **HTTP**          | Axios                                                |
| **State**         | Context API                                          |
| **Notifications** | React Hot Toast                                      |
| **Icons**         | Lucide React                                         |
| **Backend**       | Node.js, Express 5, TypeScript                       |
| **Database**      | PostgreSQL (Neon)                                    |
| **ORM**           | Prisma 6                                             |
| **Auth**          | JWT + Bcrypt                                         |
| **Real-time**     | Socket.io 4                                          |
| **File Upload**   | Multer                                               |
| **Deployment**    | Vercel (frontend), Render (backend), Neon (database) |

---

## Database Design

### ER Diagram

```mermaid
erDiagram
    USER ||--o{ SERVICE : creates
    USER ||--o{ JOB : posts
    JOB ||--o{ BID : receives
    USER ||--o{ REVIEW : writes
    USER ||--o{ PAYMENT : receives
```

### Models

- **User** – Authentication, profile, skills, rating
- **Service** – Freelancer service listings
- **Job** – Client job postings with status tracking
- **Bid** – Freelancer proposals on jobs
- **Conversation / Message** – Real-time chat
- **Review** – User ratings and comments
- **Payment** – Mock payment records with commission

See [docs/DATABASE.md](docs/DATABASE.md) for full schema details.

---

## API Documentation

Full API reference: [docs/API.md](docs/API.md)

| Module          | Base Path              | Endpoints                        |
| --------------- | ---------------------- | -------------------------------- |
| Auth            | `/api/auth`            | signup, login, me, logout        |
| Users           | `/api/users`           | list, get, update                |
| Services        | `/api/services`        | CRUD + search/filter             |
| Jobs            | `/api/jobs`            | CRUD + status update             |
| Bids            | `/api/bids`            | create, accept, reject           |
| Messages        | `/api/messages`        | conversations, messages          |
| Reviews         | `/api/reviews`         | create, list                     |
| Payments        | `/api/payments`        | mock checkout, complete, history |
| Recommendations | `/api/recommendations` | job matches, bid suggestions     |

Health check: `GET /api/health`

---

## Environment Variables

Copy templates and fill in your values:

```bash
cp .env.example server/.env
cp client/.env.example client/.env
```

### Server (`server/.env`)

| Variable       | Example                              | Description                       |
| -------------- | ------------------------------------ | --------------------------------- |
| `DATABASE_URL` | `postgresql://user:pass@host/campusconnect` | Neon PostgreSQL connection string |
| `JWT_SECRET`   | `your-secret-key-here`               | JWT signing secret                |
| `JWT_EXPIRES`  | `7d`                                 | Token expiration                  |
| `PORT`         | `5000`                               | Server port                       |
| `CLIENT_URL`   | `http://localhost:5173`              | Frontend URL for CORS             |

### Client (`client/.env`)

| Variable          | Example                     | Description          |
| ----------------- | --------------------------- | -------------------- |
| `VITE_API_URL`    | `http://localhost:5000/api` | Backend API URL      |
| `VITE_SOCKET_URL` | `http://localhost:5000`     | Socket.io server URL |

---

## Local Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database ([Neon](https://neon.tech) free tier recommended)

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/pleasingsunlight/student-gig-marketplace.git
cd student-gig-marketplace

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with your DATABASE_URL from Neon

# 4. Setup database
cd server
npx prisma migrate dev --name init
npx prisma db seed
cd ..

# 5. Install root dependencies (for concurrently)
npm install

# 6. Start development servers
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Health check:** http://localhost:5000/api/health

### Demo Accounts

| Role       | Email                 | Password    |
| ---------- | --------------------- | ----------- |
| Freelancer | freelancer@campusconnect.com | password123 |
| Client     | client@campusconnect.com     | password123 |
| Admin      | admin@campusconnect.com      | password123 |
| Designer   | designer@campusconnect.com   | password123 |
| Writer     | writer@campusconnect.com     | password123 |

---

## Build Commands

```bash
# Install dependencies
npm install                          # Root
cd server && npm install             # Server
cd client && npm install --legacy-peer-deps  # Client

# Development
npm run dev                            # Start both servers
npm run dev:server                     # Server only
npm run dev:client                     # Client only

# Database
npx prisma migrate dev                 # Run migrations (in server/)
npx prisma generate                    # Generate Prisma client
npx prisma db seed                     # Seed demo data
npx prisma db push                     # Push schema without migration
npx prisma studio                      # Visual database browser

# Production build
npm run build                          # Build both
npm run build:server                   # Server TypeScript compile
npm run build:client                   # Client Vite build

# Production start
cd server && npm start                 # Start compiled server
cd client && npm run preview           # Preview production build
```

---

## Deployment Instructions

### 1. Database (Neon PostgreSQL)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Use as `DATABASE_URL` in Render environment

### 2. Backend (Render)

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
4. Set environment variables:
   - `DATABASE_URL` – Neon connection string
   - `JWT_SECRET` – Strong random secret
   - `CLIENT_URL` – Your Vercel frontend URL
   - `PORT` – `5000`
5. After deploy, run seed: `npx prisma db seed` (via Render shell)

### 3. Frontend (Vercel)

1. Import project on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `client`
3. Set environment variables:
   - `VITE_API_URL` – `https://your-render-app.onrender.com/api`
   - `VITE_SOCKET_URL` – `https://your-render-app.onrender.com`
4. Deploy

### 4. Post-Deploy Verification

```bash
# Health check
curl https://your-render-app.onrender.com/api/health

# Test login
curl -X POST https://your-render-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer@campusconnect.com","password":"password123"}'
```

---

## Troubleshooting

| Issue                             | Solution                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `PrismaClientInitializationError` | Verify `DATABASE_URL` in `server/.env` is correct and Neon project is active |
| CORS errors in browser            | Ensure `CLIENT_URL` in server env matches your frontend URL exactly          |
| Socket.io not connecting          | Check `VITE_SOCKET_URL` points to backend (not `/api` path)                  |
| JWT expired errors                | Login again; tokens expire after 7 days by default                           |
| `npm install` fails in client     | Use `npm install --legacy-peer-deps` due to Vite 8 plugin compatibility      |
| Build fails on Render             | Ensure `npx prisma generate` runs before `npm run build`                     |
| Empty pages after deploy          | Verify Vercel rewrites are configured (`vercel.json` included)               |
| Seed fails with unique constraint | Run `npx prisma migrate reset` then re-seed                                  |

---

## Future Improvements

1. Real Stripe/Razorpay payment integration with webhooks
2. Email verification and password reset flows
3. OAuth social login (Google, GitHub)
4. Push notifications for new bids and messages
5. Full-text search with PostgreSQL tsvector
6. Portfolio image gallery with cloud storage (S3/Cloudinary)
7. Admin analytics dashboard
8. Mobile app with React Native
9. ML-based recommendation pipeline
10. Escrow payment system with milestone tracking

---

## Internship Learnings

Building CampusConnect taught key full-stack engineering skills:

1. **System Design** – Designing a normalized database schema with proper relationships, enums, and constraints before writing code
2. **API Design** – RESTful endpoint design with consistent patterns, error handling, and role-based authorization
3. **Authentication** – Implementing secure JWT auth with bcrypt hashing, token interceptors, and protected routes
4. **Real-time Systems** – Building WebSocket communication with Socket.io including room management and event handling
5. **Frontend Architecture** – Component-based React with Context API, custom hooks, form validation, and responsive design
6. **AI Without ML** – Creating useful recommendation systems using deterministic scoring algorithms
7. **DevOps** – Configuring multi-service deployment across Vercel, Render, and Neon with environment management
8. **Documentation** – Writing comprehensive docs (PRD, TRD, API reference) that enable others to onboard without assistance

---

## Progress Tracking

- **Tasks:** See [TASKS.md](TASKS.md)
- **Status:** See [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **Resume:** See [RESUME_POINTS.md](RESUME_POINTS.md)

To continue development after interruption:

```
Continue implementation by reading:
1. PROJECT_STATUS.md
2. TASKS.md
3. PROJECT_COMPLETE.md (if it exists)
```

---
