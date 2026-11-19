# ScaleChat

A scalable chat backend built with **Node.js, Express.js, and PostgreSQL**, following a modular monolith architecture.

ScaleChat focuses on building a reliable messaging system with secure authentication, efficient database operations, clean architecture, and real-time communication capabilities.

## 🚀 Features

### Implemented

- Modular monolith architecture with feature-based modules.
- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based authentication with short-lived access tokens.
- Refresh token rotation and reuse detection.
- Protected API routes and authentication middleware.
- Direct conversation creation and participant management.
- Prevention of duplicate direct conversations using PostgreSQL constraints.
- Conversation listing with cursor-based pagination.
- Request validation using Zod.
- Centralized error handling.
- API rate limiting.
- Structured logging using Pino.
- Graceful server shutdown.
- PostgreSQL connection pooling.
- Database migrations using node-pg-migrate.

### Planned

- Message creation and persistence.
- Paginated message history.
- Real-time messaging using Socket.IO.
- Message delivery and read receipts.
- Online user presence.
- Automated integration testing.

## 🛠️ Tech Stack

| Technology      | Purpose                           |
| --------------- | --------------------------------- |
| Node.js         | Backend runtime                   |
| JavaScript      | Programming language              |
| Express.js      | REST API framework                |
| PostgreSQL      | Relational database               |
| pg              | PostgreSQL driver                 |
| JWT             | Authentication                    |
| bcryptjs        | Password hashing                  |
| Zod             | Request validation                |
| Socket.IO       | Real-time communication (planned) |
| Pino            | Structured logging                |
| Docker          | Local database environment        |
| node-pg-migrate | Database migrations               |

## 🏗️ Architecture

ScaleChat follows a **Modular Monolith Architecture** with clear separation of responsibilities.

```text
src/
├── config/
├── infrastructure/
│   └── database/
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

### Request Lifecycle

```text
Client Request
      |
      v
Routes & Middleware
      |
      v
Controller
      |
      v
Service Layer
      |
      v
Repository Layer
      |
      v
PostgreSQL
```

Each layer has a dedicated responsibility:

- **Routes:** API endpoint definitions and middleware configuration.
- **Controllers:** Handle HTTP requests and responses.
- **Services:** Contain business logic and application rules.
- **Repositories:** Handle database queries and persistence.
- **Infrastructure:** Manage database connections and external integrations.
- **Shared:** Reusable middleware, utilities, and error handling.

## 🔐 Authentication & Security

- Passwords are hashed using bcrypt.
- Access tokens are short-lived JWTs.
- Refresh tokens are generated using cryptographically secure randomness.
- Only hashed refresh tokens are stored in PostgreSQL.
- Refresh token rotation and reuse detection improve session security.
- Protected routes verify JWT signatures and claims.
- SQL queries use parameterized statements.
- Authentication endpoints have rate limiting.
- Sensitive information is redacted from application logs.

## 🗄️ Database Design

The core database entities include:

- **Users:** Stores user account information.
- **Conversations:** Stores direct and group conversation metadata.
- **Conversation Participants:** Manages conversation membership.
- **Messages:** Stores messages associated with conversations.
- **Refresh Tokens:** Tracks token rotation, expiration, and revocation.

PostgreSQL constraints, indexes, and transactions help maintain data integrity and support efficient queries.

## ⚙️ Getting Started

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

Create a `.env` file:

```bash
cp .env.example .env
```

Configure the required variables:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://scalechat:local_dev_password@localhost:5432/scalechat
JWT_SECRET=your_secure_random_secret_at_least_32_characters
JWT_EXPIRES_IN=15m
```

Never commit your `.env` file or production secrets.

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

The API runs on:

```text
http://localhost:4000
```

## 📡 API Endpoints

Base URL: `/api/v1`

| Method | Endpoint                                  | Description                            |
| ------ | ----------------------------------------- | -------------------------------------- |
| POST   | `/auth/register`                          | Register a new user                    |
| POST   | `/auth/login`                             | Authenticate a user                    |
| POST   | `/auth/refresh`                           | Rotate refresh token                   |
| POST   | `/auth/logout`                            | Revoke refresh token                   |
| GET    | `/users/me`                               | Get authenticated user profile         |
| POST   | `/conversations/direct`                   | Create or retrieve direct conversation |
| GET    | `/conversations`                          | List user conversations                |
| POST   | `/conversations/:conversationId/messages` | Send a message (planned)               |
| GET    | `/conversations/:conversationId/messages` | Retrieve message history (planned)     |

Protected endpoints require a valid access token:

```http
Authorization: Bearer <access_token>
```

## 🧠 Key Engineering Decisions

- **Modular Monolith:** Keeps deployment simple while maintaining clear domain boundaries.
- **Refresh Token Rotation:** Reduces the risk associated with compromised refresh tokens.
- **Database Constraints:** Enforces data integrity at the database level, including duplicate conversation prevention.
- **Transactions:** Ensures related database operations succeed or fail together.
- **Cursor-Based Pagination:** Supports efficient retrieval of conversation lists as data grows.
- **Connection Pooling:** Reuses database connections to reduce connection overhead.

## 🗺️ Roadmap

- [x] Project setup and modular architecture
- [x] PostgreSQL integration
- [x] Database migrations
- [x] User authentication
- [x] JWT access and refresh tokens
- [x] Refresh token rotation and reuse detection
- [x] Direct conversations
- [x] Conversation listing and pagination
- [ ] Message persistence
- [ ] Message history pagination
- [ ] Real-time messaging with Socket.IO
- [ ] Message delivery and read receipts
- [ ] Online presence
- [ ] Automated integration testing
- [ ] Performance and load testing

## 📌 Project Status

ScaleChat is actively under development. The current focus is building a solid backend foundation before introducing real-time messaging and advanced chat features.

## 📄 License

No open-source license has been added yet.
