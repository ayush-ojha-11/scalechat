# ScaleChat Backend

A real-time chat backend built with **Node.js, Express.js, PostgreSQL, and Socket.IO**. It follows a feature-based **Modular Monolith Architecture**, designed to keep the codebase maintainable, scalable, and easy to extend.

## Features

- User registration and login
- Secure password hashing with bcrypt
- JWT authentication with short-lived access tokens
- Refresh token rotation and reuse detection
- Protected API endpoints
- Direct conversation creation and participant management
- Prevention of duplicate direct conversations using database constraints
- Cursor-based pagination for conversations and messages
- Message persistence and history retrieval
- Real-time messaging with Socket.IO
- Typing indicators
- Request validation using Zod
- Centralized error handling
- API rate limiting and structured logging
- PostgreSQL connection pooling and database migrations
- Graceful server shutdown

## Tech Stack

| Technology      | Purpose                    |
| --------------- | -------------------------- |
| Node.js         | Runtime                    |
| JavaScript      | Programming language       |
| Express.js      | REST API                   |
| PostgreSQL      | Database                   |
| `pg`            | PostgreSQL driver          |
| Socket.IO       | Real-time communication    |
| JWT             | Authentication             |
| bcryptjs        | Password hashing           |
| Zod             | Request validation         |
| Pino            | Structured logging         |
| Docker          | Local database environment |
| node-pg-migrate | Database migrations        |

## Architecture

ScaleChat uses a modular monolith with feature-based modules and clear separation of responsibilities.

```text
src/
├── config/
├── infrastructure/
│   ├── database/
│   └── realtime/
├── shared/
│   ├── errors/
│   ├── middleware/
│   └── utils/
└── modules/
    ├── auth/
    ├── users/
    ├── conversations/
    ├── messages/
    └── health/
```

Each feature contains its own business logic and supporting components.

**Request flow:**

```text
Client
  ↓
Routes & Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
PostgreSQL
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- Docker Desktop or Docker Engine

### 1. Clone the repository

```bash
git clone https://github.com/ayush-ojha-11/scalechat.git
cd scalechat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://scalechat:local_dev_password@localhost:5432/scalechat
JWT_SECRET=your_secure_secret_at_least_32_characters
JWT_EXPIRES_IN=15m
```

Generate a secure JWT secret for your local environment. Never commit `.env` or expose production credentials.

### 4. Start PostgreSQL

```bash
docker compose up -d
```

### 5. Run database migrations

```bash
npm run db:migrate
```

### 6. Start the development server

```bash
npm run dev
```

The API will be available at:

`http://localhost:4000`

## API Endpoints

Base path: `/api/v1`

| Method | Endpoint                                  | Description                              |
| ------ | ----------------------------------------- | ---------------------------------------- |
| POST   | `/auth/register`                          | Register a user                          |
| POST   | `/auth/login`                             | Log in                                   |
| POST   | `/auth/refresh`                           | Refresh access token                     |
| POST   | `/auth/logout`                            | Revoke refresh token                     |
| GET    | `/users/me`                               | Get current user                         |
| GET    | `/users/search`                           | Search users                             |
| GET    | `/users/:userId`                          | Get public user profile                  |
| POST   | `/conversations/direct`                   | Create or retrieve a direct conversation |
| GET    | `/conversations`                          | List conversations                       |
| POST   | `/conversations/:conversationId/messages` | Send a message                           |
| GET    | `/conversations/:conversationId/messages` | Retrieve message history                 |

Protected REST endpoints require a valid access token:

```http
Authorization: Bearer <access_token>
```

Real-time events are handled through the Socket.IO connection.

## Engineering Decisions

- **Modular monolith:** Keeps deployment straightforward while maintaining clear feature boundaries.
- **Refresh token rotation:** Helps detect token reuse and compromised sessions.
- **Database constraints:** Enforces data integrity at the database level.
- **Transactions:** Keeps related database operations consistent.
- **Cursor-based pagination:** Supports efficient retrieval of growing conversation and message histories.
- **Connection pooling:** Reuses database connections to reduce overhead.

## Roadmap

- [x] Project setup and modular architecture
- [x] PostgreSQL integration and migrations
- [x] Authentication and refresh token rotation
- [x] Direct conversations
- [x] Conversation listing and pagination
- [x] Message persistence and history pagination
- [x] Socket.IO authentication and real-time messaging
- [x] Typing indicators
- [x] Complete delivery and read receipt verification
- [x] Complete presence and last-seen verification
- [x] Automated integration testing
- [x] Performance and load testing

## Project Status

ScaleChat is actively under development. The backend foundation and core messaging functionality are in place, with frontend development and further reliability improvements planned.

## License

No open-source license has been added yet.
