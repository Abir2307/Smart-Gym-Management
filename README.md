# Smart Gym Management System Documentation

## Overview

This workspace contains a web-first Smart Gym Management System built with React on the client and Node.js on the server. The goal is to manage gym members, trainers, memberships, attendance, payments, workout plans, notifications, and reports in one platform that can later be reused by mobile apps.

## What Was Implemented

### Client

- Responsive React dashboard built with Vite.
- JWT-based login flow with protected routes.
- Role-aware navigation for Super Admin, Staff, Trainer, and Member.
- Reusable CRUD UI for members, trainers, plans, and payments.
- Dedicated attendance check-in screen.
- Member photo upload support with preview.
- Dashboard summary cards, reports panel, and mobile-friendly layout.

### Server

- Express API under `/api/v1`.
- JWT authentication for login and request protection.
- Role-based authorization for management routes.
- PostgreSQL-backed persistence using `pg`.
- In-memory fallback for local development when `DATABASE_URL` is not set.
- CRUD endpoints for members, trainers, plans, and payments.
- Attendance listing and check-in endpoint.
- Notification and dashboard summary endpoints.

### Database

- PostgreSQL schema and seed SQL added for production deployment.
- Tables included:
  - `gym_users`
  - `gym_records`
  - `gym_attendance`

## Repository Structure

- `client/` React application.
- `server/` Node API.
- `server/sql/001_init.sql` production schema migration.
- `server/sql/002_seed.sql` production seed data.

## Main Screens

- Login
- Dashboard
- Attendance check-in
- Members CRUD
- Trainers CRUD
- Membership Plans CRUD
- Payments CRUD
- Reports

## API Contract

Base path: `/api/v1`

### Auth

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Dashboard

- `GET /api/v1/dashboard`

### Resources

- `GET /api/v1/members`
- `POST /api/v1/members`
- `PUT /api/v1/members/:id`
- `DELETE /api/v1/members/:id`

- `GET /api/v1/trainers`
- `POST /api/v1/trainers`
- `PUT /api/v1/trainers/:id`
- `DELETE /api/v1/trainers/:id`

- `GET /api/v1/plans`
- `POST /api/v1/plans`
- `PUT /api/v1/plans/:id`
- `DELETE /api/v1/plans/:id`

- `GET /api/v1/payments`
- `POST /api/v1/payments`
- `PUT /api/v1/payments/:id`
- `DELETE /api/v1/payments/:id`

- `GET /api/v1/attendance`
- `POST /api/v1/attendance/check-in`
- `GET /api/v1/notifications`

## Environment Variables

### Server

- `PORT` - API port. Defaults to `4000`.
- `JWT_SECRET` - secret used to sign JWT tokens. Defaults to a local development value.
- `DATABASE_URL` - PostgreSQL connection string. When omitted, the server runs in memory mode.
- `PGSSLMODE` - set to `require` when connecting to a managed Postgres instance that needs SSL.

## Commands

### Install Dependencies

```bash
npm install
```

### Run Client

```bash
npm run dev:client
```

### Run Server

```bash
npm run dev:server
```

### Build Client

```bash
npm run build
```

### Start Production Server

```bash
npm run start --prefix server
```

### Client-only Commands

```bash
npm run dev --prefix client
npm run build --prefix client
npm run preview --prefix client
```

### Server-only Commands

```bash
npm run dev --prefix server
npm run start --prefix server
```

## Database Deployment

Run these files in order for production PostgreSQL setup:

1. `server/sql/001_init.sql`
2. `server/sql/002_seed.sql`

The first file creates the schema and indexes. The second file seeds demo users, gym records, attendance history, and notifications.

## Validation Performed

- `npm install` at the workspace root.
- `npm run build --prefix client`.
- `node --check server/src/app.js`.

## Notes

- The starter currently uses JWT stored in browser local storage for session persistence.
- The client is ready to be reused by future Android or iOS clients through the same `/api/v1` contract.
- The seed SQL uses `pgcrypto` so production hashes can be generated inside PostgreSQL.
