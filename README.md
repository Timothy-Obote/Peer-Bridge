# Peer Bridge

Peer Bridge is a peer tutoring platform built with React, TypeScript, Vite, and an Express backend. It supports tutor and tutee registration, course selection, automated matching, chat, and admin workflows.

## Features

- Tutor and tutee registration
- Secure JWT-based authentication
- Course selection and profile management
- Automated matching and suggestion generation
- Chat support for matched pairs
- Admin overview and debugging endpoints
- Departments, programs, and course APIs
- Cloudinary file upload support
- Scheduled matching using `node-cron`

## Tech Stack

- Frontend
  - React
  - TypeScript
  - Vite
  - React Router
  - Socket.io client
  - Supabase client utilities
- Backend
  - Node.js
  - Express
  - PostgreSQL (`pg`)
  - JWT authentication
  - bcrypt
  - Socket.io
  - Cloudinary
  - node-cron

## Repository Structure

- `src/` — React frontend source code
- `backend/` — Express backend source code
- `backend/routes/` — API route modules
- `backend/server.js` — backend app entrypoint
- `backend/db.js` — PostgreSQL connection
- `Dockerfile.backend` — backend Dockerfile
- `Dockerfile.frontend` — frontend Dockerfile
- `docker-compose.yml` — container orchestration

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL database
- Optional: Docker and Docker Compose

## Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `backend/` with the required values:
   ```env
   DATABASE_URL=postgres://user:password@host:port/database
   JWT_SECRET=your_jwt_secret
   DB_SSL=false
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   SMTP_FROM=PeerBridge <no-reply@example.com>
   FRONTEND_URL=http://localhost:5173
   PORT=5001
   ```
   SMTP settings and `FRONTEND_URL` are required for password recovery. Reset links expire after one hour and can only be used once.
4. Start the backend server:
   cd backend
   node server.js

The backend runs at `http://localhost:5001` by default.

Check `http://localhost:5001/health` to verify startup. A `200` response means the API and database are ready; `503` means the API is listening but PostgreSQL is unavailable. In that case, check the backend terminal's `[db] Connection failed` message and verify `DATABASE_URL`, `DB_SSL`, and network access to the database.

## Frontend Setup

1. From the project root, install dependencies:
   ```bash
   npm install
   ```
2. Set `VITE_API_URL=http://localhost:5001` in the project-root `.env` file.
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend runs at `http://localhost:5173`. Restart Vite after changing `.env` values.

## Docker Setup

To run the project with Docker Compose:

```bash
docker-compose up --build
```

> Make sure `docker-compose.yml` is configured for your local database and ports.

## Scripts

- `npm run dev` — start the frontend in development mode
- `npm run build` — type-check and build the frontend
- `npm run lint` — lint frontend source files
- `node server.js` (in `backend/`) — run the backend server

## Useful API Endpoints

- `POST /signin` — login endpoint
- `POST /signup` — sign up new users
- `POST /password-reset/request` — email a one-time password reset link
- `POST /password-reset/confirm` — set a new password using a valid reset token
- `POST /api/tutees` — register tutees
- `POST /api/tutors` — register tutors
- `POST /api/matching/run` — manually run matching
- `GET /api/matches/:userId` — get matches for a user
- `GET /api/chats/:matchId/messages` — get chat history
- `GET /api/courses` — list courses
- `GET /api/departments` — list departments


## Notes

- Backend environment variables are loaded from `backend/.env`
- Database SSL can be enabled using `DB_SSL=true`
- Chat and matching features use matching data from `matches`, `tutor_courses`, and `tutee_courses`
- The backend supports scheduled matching every hour
