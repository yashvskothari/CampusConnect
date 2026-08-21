# CampusConnect - Technical Requirements Document (TRD)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL (Neon free tier) |
| ORM | Prisma 6 |
| Auth | JWT + Bcrypt |
| Real-time | Socket.io 4 |
| File Upload | Multer |
| Deployment | Vercel (frontend), Render (backend) |

## Frontend Libraries
- React Router 7 (routing)
- Axios (HTTP client)
- React Hook Form + Zod (forms/validation)
- React Hot Toast (notifications)
- Lucide React (icons)
- Context API (state management)

## API Design
- RESTful JSON API under `/api/*`
- JWT Bearer token authentication
- Role-based authorization middleware
- Consistent error response format: `{ error: string }`

## Security
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- CORS restricted to client URL
- Input validation on all endpoints
- Protected routes require valid JWT

## Real-time Architecture
- Socket.io server attached to HTTP server
- JWT authentication on socket connection
- Room-based messaging (`conversation:{id}`)
- Events: `join_conversation`, `send_message`, `typing`, `new_message`

## AI Recommendation Engine
Deterministic scoring (no external APIs):
```
score = 0.4 × skillMatch + 0.3 × categoryMatch + 0.2 × rating + 0.1 × experience
```

## Performance Targets
- API response < 500ms for list endpoints
- Page load < 3s on 3G connection
- Support 100+ concurrent socket connections

## Environment Variables

### Server
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret key for JWT signing |
| JWT_EXPIRES | Token expiration (default: 7d) |
| PORT | Server port (default: 5000) |
| CLIENT_URL | Frontend URL for CORS |

### Client
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |
| VITE_SOCKET_URL | Socket.io server URL |
