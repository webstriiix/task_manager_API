# Junior Backend Developer - Technical Test: Task Manager Full-Stack

A robust Full-Stack Task Management application built with Node.js, Express, and React to help teams record, organize, and manage daily tasks with full user authentication and database relations.

## 📌 Project Overview

This project implements a task management system where users can register, login, and manage their personal tasks through a modern web interface. It features a one-to-many relationship between Users and Tasks, ensuring data integrity and security through JWT authentication.

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js (v18+) installed
- PostgreSQL instance running

### 2. Clone & Setup Environment
```bash
git clone <your-repository-url>
cd TaskManagerApi
cp .env.example .env
```

### 3. Build & Run (Single Command)
The project is configured to build both the backend and frontend together:
```bash
npm run build
npm start
```
The application will be accessible at `http://localhost:8080`.

---

## 🖥 Frontend Interface

The application includes a clean, responsive interface with the following features:
- **Auth Pages**: Toggle between Login and Register.
- **Dashboard**: View your personalized task list.
- **Task Management**: Create new tasks, edit existing ones, and delete with confirmation.
- **Task Actions**: Quickly toggle task completion status and view priority levels.
- **Persistent Session**: JWT is stored securely in `localStorage` to keep you logged in.

---

## 🧪 Testing

The project includes a comprehensive test suite (Unit & Integration) covering 96% of the codebase.

### Run all tests:
```bash
npm test
```

### Key coverage areas:
- **Authentication**: JWT validation, token expiration, unauthorized access.
- **CRUD Operations**: User and Task management.
- **Error Handling**: 400 (Validation), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), and 500 (Internal Server Error).
- **Relational Integrity**: Ownership checks for updates/deletes.

---

## 📖 API Documentation

### User Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users` | Register/Create user | ❌ No |
| POST | `/users/login` | User login | ❌ No |
| GET | `/users` | List all users | ❌ No |
| GET | `/users/:id` | Get user by ID | ❌ No |
| PUT | `/users/:id` | Update user | ✅ Yes (Owner) |
| DELETE | `/users/:id` | Delete user | ✅ Yes (Owner) |
| GET | `/users/:id/tasks` | Get tasks by user ID | ❌ No |

### Task Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/tasks` | Create task | ✅ Yes |
| GET | `/tasks` | List all tasks | ❌ No |
| GET | `/tasks/my-tasks` | Get current user's tasks | ✅ Yes |
| GET | `/tasks/:id` | Get task by ID | ❌ No |
| PUT | `/tasks/:id` | Update task | ✅ Yes (Owner) |
| DELETE | `/tasks/:id` | Delete task | ✅ Yes (Owner) |

---

## 📝 Request/Response Examples

### User Registration
**POST** `/users`
```json
{
  "email": "dev@example.com",
  "name": "Junior Dev",
  "password": "securepassword123"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "id": 1, "email": "dev@example.com", "name": "Junior Dev" }
}
```

### User Login
**POST** `/users/login`
```json
{
  "email": "dev@example.com",
  "password": "securepassword123"
}
```
**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "dev@example.com" },
    "token": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

### Create Task
**POST** `/tasks` (Headers: `Authorization: Bearer <token>`)
```json
{
  "title": "Complete Technical Test",
  "description": "Finish the task manager API by today",
  "priority": "high",
  "dueDate": "2026-03-10"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "data": { "id": 5, "title": "Complete Technical Test", "userId": 1 }
}
```

---

## ⚙️ Environment Variables (.env.example)

```env
PORT=8080
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskmanager?schema=public"
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

### 💡 Configuration Notes

#### 1. Port Changes
If you change the `PORT` in `.env`, ensure you also update:
- `docker-compose.yml`: Both sides of the `ports` mapping (e.g., `"8080:8080"`).
- `Dockerfile`: The `EXPOSE` instruction.

#### 2. Database URL (Networking)
The `DATABASE_URL` differs depending on your runtime environment:
- **Local (npm start):** Use `localhost` as the host (e.g., `postgresql://user:pass@localhost:5432/db`).
- **Docker (docker-compose):** Use the service name `postgres` as the host (e.g., `postgresql://user:pass@postgres:5432/db`).

*Note: The `docker-compose.yml` is already configured to automatically override the `.env` value with the correct Docker-internal URL when running in containers.*

## 📂 Project Structure
- `src/controllers`: Business logic for Users and Tasks.
- `src/middleware`: JWT authentication and request validation.
- `src/routes`: API endpoint definitions.
- `src/config`: Database connection (Prisma).
- `tests/`: Automated test suites.
- `prisma/`: Database schema and migrations.
