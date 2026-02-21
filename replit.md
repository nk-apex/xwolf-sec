# WolfHost - Premium Hosting Platform

## Overview
WolfHost is a premium hosting infrastructure platform clone of host.xwolf.space. It features a dark-themed landing page with pricing plans, user authentication (registration/login), and a client dashboard.

## Architecture
- **Frontend**: React + TypeScript + Vite, using Tailwind CSS + shadcn/ui components
- **Backend**: Express.js with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter for client-side routing

## Pages
- `/` - Landing page with hero, region selector, pricing plans, stats, features, CTA
- `/login` - User login page
- `/register` - User registration page  
- `/dashboard` - Client dashboard (authenticated)

## Key Files
- `shared/schema.ts` - Database schema and validation types
- `server/db.ts` - Database connection
- `server/routes.ts` - API routes with auth endpoints
- `server/storage.ts` - Database CRUD operations
- `client/src/pages/home.tsx` - Landing page
- `client/src/pages/login.tsx` - Login page
- `client/src/pages/register.tsx` - Registration page
- `client/src/pages/dashboard.tsx` - Dashboard page

## API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout user

## Theme
- Dark-themed with green (#22c55e-ish) primary color
- Uses Inter font family
- Consistent dark card backgrounds with subtle borders

## Recent Changes
- 2026-02-21: Initial build - complete WolfHost clone with landing, auth, dashboard
