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
   PORT=5001
   ```
4. Start the backend server:
   cd backend
   node server.js

The backend runs at `http://localhost:5001` by default.

## Frontend Setup

1. From the project root, install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend runs at `http://localhost:5173`.

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
