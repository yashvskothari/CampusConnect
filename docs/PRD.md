# CampusConnect - Product Requirements Document (PRD)

## Overview
CampusConnect is a freelance marketplace designed specifically for students, connecting talented student freelancers with clients who need affordable, quality work.

## Target Users
- **Freelancers (Students):** Offer services, bid on jobs, build portfolio
- **Clients:** Post jobs, hire freelancers, manage payments
- **Admin:** Platform oversight

## Core Features (MVP)

### Authentication
- Email/password signup and login
- JWT-based session management
- Role selection at registration (Freelancer or Client)

### Marketplace
- Browse and search services with category/price/rating filters
- Post jobs with budget, deadline, and category
- Submit bids with proposal, quote, and delivery estimate
- Accept/reject bids with automatic payment initiation

### Communication
- Real-time one-to-one messaging via Socket.io
- Typing indicators
- Optional file attachments

### Reviews
- Rate users 1-5 stars with written comments
- Aggregate ratings displayed on profiles

### AI Features (Rule-Based)
- **Job Matchmaker:** Ranks open jobs by compatibility score
- **Smart Bid Assistant:** Suggests bid amount, delivery time, and proposal template

### Payments (Mock)
- Simulated checkout flow (no real money)
- 15% platform commission on all transactions
- Payment history for clients

## Success Metrics
- User can register, login, and access role-appropriate dashboard
- Freelancer can list services and bid on jobs
- Client can post jobs and accept bids
- Real-time chat works between users
- AI recommendations display on freelancer dashboard

## Out of Scope (MVP)
- Real payment processing (Stripe/Razorpay integration)
- Email verification, OAuth login
- Microservices, Docker, Redis, Elasticsearch
- ML-based recommendation pipelines
