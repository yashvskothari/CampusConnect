# CampusConnect - Architecture

## System Architecture

```mermaid
flowchart LR
    User --> ReactFrontend
    ReactFrontend --> ExpressAPI
    ExpressAPI --> PostgreSQL
    ExpressAPI --> SocketServer
```

## Request Flow

```mermaid
sequenceDiagram
    User->>Frontend: Click action
    Frontend->>Backend: API request + JWT
    Backend->>Database: Prisma query
    Database-->>Backend: Data
    Backend-->>Frontend: JSON response
    Frontend-->>User: Render update
```

## Deployment Architecture

```mermaid
flowchart TD
    Browser --> Vercel
    Vercel --> Render
    Render --> NeonDB
```

## Folder Structure

```
campusconnect/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   ├── layouts/        # Layout wrappers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client
│   │   ├── context/        # Auth context
│   │   ├── routes/         # Protected route wrapper
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Helper functions
│   └── vercel.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── services/       # Business logic (AI engine)
│   │   ├── socket/         # Socket.io handlers
│   │   ├── utils/          # JWT, Prisma, helpers
│   │   └── types/          # TypeScript declarations
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Demo data
└── docs/                   # Documentation
```

## Authentication Flow

```mermaid
sequenceDiagram
    User->>Frontend: Login form
    Frontend->>Backend: POST /auth/login
    Backend->>Database: Find user + verify password
    Backend-->>Frontend: JWT + user object
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Backend: Subsequent requests with Bearer token
    Backend->>Backend: Verify JWT middleware
    Backend-->>Frontend: Protected data
```

## Real-time Chat Flow

```mermaid
sequenceDiagram
    User->>Frontend: Open conversation
    Frontend->>Socket: join_conversation(id)
    User->>Frontend: Type message
    Frontend->>Socket: send_message
    Socket->>Database: Save message
    Socket->>Socket: Broadcast new_message
    Socket-->>Frontend: Receive message
```

## AI Recommendation Flow

```mermaid
flowchart TD
    A[Freelancer requests recommendations] --> B[Fetch user skills + rating]
    B --> C[Fetch all OPEN jobs]
    C --> D[Calculate skill overlap per job]
    D --> E[Calculate category match]
    E --> F[Apply weighted formula]
    F --> G[Sort by score descending]
    G --> H[Return ranked jobs with breakdown]
```

## Key Design Decisions

1. **Monolithic API** - Single Express server handles all routes and WebSocket connections for simplicity
2. **Prisma ORM** - Type-safe database access with auto-generated client
3. **JWT over sessions** - Stateless auth suitable for deployment across Render instances
4. **Rule-based AI** - Deterministic scoring avoids external API costs and latency
5. **Mock payments** - Simulates full payment lifecycle without PCI compliance requirements
