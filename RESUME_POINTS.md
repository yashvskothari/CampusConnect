# CampusConnect - Resume Points

## Project Summary
CampusConnect is a full-stack student freelance marketplace MVP inspired by Fiverr and Upwork. Built with React, Node.js, PostgreSQL, and Socket.io, it enables students to offer services, bid on jobs, chat in real-time, and receive AI-powered job recommendations.

## Architecture Decisions
- **Monolithic REST API** over microservices for rapid MVP delivery within 1-day scope
- **Prisma ORM** for type-safe database access and migration management
- **JWT stateless auth** for scalable authentication without session storage
- **Rule-based AI** instead of ML models for deterministic, zero-cost recommendations
- **Mock payment flow** simulating Stripe with commission tracking (15% platform fee)
- **Socket.io** for real-time one-to-one messaging with typing indicators

## Technologies Used
React, TypeScript, Vite, Tailwind CSS, Node.js, Express, PostgreSQL, Prisma, JWT, Bcrypt, Socket.io, Multer, React Hook Form, Zod, Axios, Vercel, Render, Neon

## Resume Bullets

1. **Built a full-stack freelance marketplace MVP** serving 3 user roles (Freelancer, Client, Admin) with 40+ REST API endpoints, real-time chat, and role-based dashboards — deployed on Vercel and Render with Neon PostgreSQL.

2. **Designed and implemented a PostgreSQL database schema** with 8 normalized models (User, Service, Job, Bid, Conversation, Message, Review, Payment) using Prisma ORM with migrations and seed data.

3. **Developed rule-based AI recommendation engine** matching freelancers to jobs using weighted scoring (40% skills, 30% category, 20% ratings, 10% experience) and a Smart Bid Assistant generating proposal templates and pricing suggestions.

4. **Implemented secure JWT authentication** with bcrypt password hashing, protected routes, and role-based authorization middleware supporting Freelancer, Client, and Admin access levels.

5. **Built real-time messaging system** using Socket.io with one-to-one conversations, typing indicators, and file upload support via Multer.

6. **Created responsive React frontend** with 15+ pages, form validation (React Hook Form + Zod), skeleton loading states, empty states, toast notifications, and modern SaaS UI design.

7. **Simulated payment processing flow** with mock Stripe checkout, 15% platform commission calculation, payment history tracking, and automated job completion on payment success.

8. **Authored comprehensive project documentation** including PRD, TRD, API reference, architecture diagrams, database schema docs, and deployment guides enabling zero-question onboarding for new developers.
