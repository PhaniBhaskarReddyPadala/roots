# 🌳 ROOTS — Family Social Networking Platform

**ROOTS** is a family-focused social networking platform designed to bring relatives closer, organize family events, and preserve important family memories and milestones in one place.

Users can build family connections, create profiles for relatives who have not joined the platform, share posts, organize reunions and family functions, track event RSVPs, and maintain a timeline of meaningful family moments.

## ✨ Features

### 👨‍👩‍👧‍👦 Family Connections
- **User Authentication:** Secure registration and login using JWT authentication and bcrypt password hashing.
- **Relationship Management:** Send, accept, and reject family relationship requests.
- **Relationship Verification:** Verify accepted relationships and identify certain conflicting family connections.
- **Dummy Relative Profiles:** Create profiles for relatives who are not yet registered and support profile claiming.
- **Family Member Search:** Find registered users using their name, email, or family surname.
- **How Are We Related?:** Explore the connection between two family members.

### 🎉 Family Events and Invitations
- **Create Family Events:** Organize reunions, birthdays, anniversaries, celebrations, and family functions.
- **Event Invitations:** Invite registered family members to events.
- **RSVP Management:** Track responses such as Going, Interested, Can't Go, and Pending.
- **Event Details:** View event dates, times, locations, descriptions, hosts, and invitees.
- **Event Notifications:** Notify invited users and event hosts about invitations and RSVP updates.

### 📅 Family Milestones and Memories
- **Family Timeline:** View posts and memories from connected family members.
- **Milestone Tracking:** Record important moments using milestone timeline entries.
- **Event Memories:** Link timeline memories to family events.
- **Family Posts:** Share text-based updates and optional image URLs.
- **Social Interactions:** Like posts, comment on memories, and preserve shared family experiences.
- **Timeline Visibility:** Support Family and Public visibility options.

### 🔔 Additional Features
- **Notifications:** View notifications, track unread counts, and mark notifications as read.
- **Relative Suggestions:** Discover indirect family connections using graph-based recommendations.
- **Profile Management:** Maintain personal and family-related profile information.
- **Protected Pages:** Restrict application pages to authenticated users.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Routing | React Router |
| State Management | Zustand |
| Server State | TanStack React Query |
| API Communication | Axios |
| Family Tree Visualization | React Flow (`@xyflow/react`) |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma ORM |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| Icons and UI Utilities | Lucide React, React Hot Toast |
| Deployment Configuration | Vercel, Render |

## 🏗️ Architecture

ROOTS follows a client-server architecture.

```text
                 ROOTS PLATFORM
                       |
          +------------+------------+
          |                         |
     React Frontend           Express Backend
     TypeScript               Node.js + TypeScript
          |                         |
          | Axios                   |
          +---------- HTTP ----------+
                                    |
                               Prisma ORM
                                    |
                               PostgreSQL
```

**Request flow:** The frontend sends an API request through Axios. Express processes the request, validates input, applies authentication and business rules, and uses Prisma to access PostgreSQL. The API response is then displayed in the frontend.

## 🗄️ Database Design

The project uses PostgreSQL with Prisma ORM for relational data management.

| Model | Purpose |
|---|---|
| `User` | User accounts and profile information |
| `RelationshipRequest` | Family connection requests |
| `Relationship` | Accepted and verified family connections |
| `DummyProfileMeta` | Dummy profile metadata and claim status |
| `FamilyEvent` | Family event information |
| `EventInvitee` | Event participants and RSVP statuses |
| `Post` | Posts, milestones, and event memories |
| `Comment` | Comments on posts |
| `Like` | Post likes |
| `Notification` | User notifications |

The database schema uses relationships, enums, and unique constraints to maintain structured application data.

## 🔐 Authentication and Security

- Passwords are hashed using `bcryptjs`.
- JWT tokens are used to authenticate protected API requests.
- Express middleware verifies tokens and checks account status.
- Zod validates request data where schemas are configured.
- Route handlers check permissions for protected operations.
- Prisma and PostgreSQL enforce database relationships and uniqueness constraints.

## 📂 Project Structure

```text
roots/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── lib/
│   │   └── index.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── lib/
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
│
└── render.yaml
```

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/PhaniBhaskarReddyPadala/roots.git
cd roots-main
```

If the cloned repository uses a different root directory name, enter that directory instead.

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a reference.

Configure the following variables:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secure-random-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

Replace the database URL and JWT secret with your own values. Do not commit secrets to GitHub.

### 3. Set up the database

Make sure PostgreSQL is running and the database connection is valid.

```bash
npm run db:generate
npm run db:push
```

These commands generate the Prisma Client and synchronize the database schema. For an established production database, use a properly managed migration workflow instead of relying on schema pushes.

Optional: run the seed script if you want to populate the database with the project's seed data.

```bash
npm run db:seed
```

### 4. Start the backend

```bash
npm run dev
```

The backend should run at:

```text
http://localhost:3001
```

Check the health endpoint:

```text
http://localhost:3001/health
```

### 5. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file based on `frontend/.env.example` and configure:

```env
VITE_API_URL="http://localhost:3001"
```

This points the frontend to the local backend API.

### 6. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://localhost:5173
```

Register an account and explore the available features.

## 🔗 Main Application Routes

| Route | Purpose |
|---|---|
| `/login` | User login |
| `/register` | User registration |
| `/feed` | Main social feed |
| `/profile` | Personal profile |
| `/profile/edit` | Edit profile |
| `/search` | Search family members |
| `/relationships` | Manage family connections |
| `/relationships/requests` | Manage relationship requests |
| `/family-tree` | Visual family tree |
| `/dummy-profiles` | Manage dummy relative profiles |
| `/how-related/:userId` | Explore a family connection |
| `/timeline` | Family timeline and memories |
| `/events` | Family events |
| `/events/:id` | Event details |
| `/notifications` | View notifications |

## 🔌 Main Backend API Endpoints

The backend mounts these route groups at the root of the configured API URL.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Register a user |
| `POST` | `/auth/login` | Authenticate a user |
| `GET` | `/auth/me` | Get the authenticated user |
| `GET` | `/users/search?q=...` | Search registered users |
| `POST` | `/relationships/requests` | Send a relationship request |
| `PATCH` | `/relationships/requests/:id` | Accept or reject a request |
| `GET` | `/family/graph` | Retrieve family graph data |
| `POST` | `/timeline` | Create a timeline entry |
| `GET` | `/timeline/me` | Retrieve the family timeline |
| `POST` | `/events` | Create a family event |
| `GET` | `/events` | List events for the current user |
| `PATCH` | `/events/:id/rsvp` | Update an event RSVP |
| `GET` | `/notifications` | Retrieve notifications |
| `GET` | `/health` | Check backend health |

Protected endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

## 🌐 Deployment

The repository includes configuration for deploying the frontend to Vercel and the backend to Render.

Before deploying:

1. Configure the production PostgreSQL database.
2. Set `DATABASE_URL` and a secure `JWT_SECRET` in the backend environment.
3. Configure `CORS_ORIGIN` to allow the deployed frontend origin.
4. Set `VITE_API_URL` to the deployed backend URL in the frontend environment.
5. Build and deploy both applications.
6. Verify the backend health endpoint and test authentication, events, invitations, and timeline functionality.

Deployment configuration is included in the repository; successful live deployment depends on the environment configuration and deployment checks.

## 🔮 Future Enhancements

- Stronger identity verification for claimed relative profiles.
- Richer photo and video storage for family memories.
- Improved privacy controls for family posts and events.
- More comprehensive relationship-label rules.
- Automated tests for authentication, relationship conflicts, and event workflows.
- Enhanced family-history and milestone discovery features.

## 🎯 Project Objective

ROOTS aims to make family connections easier to maintain by combining social networking, event organization, relationship management, and digital memory preservation in one application.

**Built with React, TypeScript, Node.js, Express, PostgreSQL, and Prisma ORM.**
