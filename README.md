# Scriptorium

A full-stack code execution and blogging platform built with Next.js, Prisma, and Docker. Write, execute, and share code in 11+ programming languages through a sandboxed environment. Create blog posts, link code templates, and collaborate with the community.

Developed as part of CSC309 (Web Programming) at the University of Toronto.

**Team:** David Zheglov, Daniel Lee, Jodhvir Bassi

> **Note:** The commit history preserves original author attribution (e.g., `... [by Daniel Lee]`). The original course repository is private.

---

## Features

- **Multi-language code execution** — Python, JavaScript, Java, C, C++, Go, Ruby, PHP, Rust, Kotlin, Dart — each runs in an isolated Docker container with resource limits
- **Code templates** — Save, search, and fork reusable code snippets with tags
- **Blog posts** — Create posts linked to code templates, with tagging and search
- **Comments & voting** — Upvote/downvote posts and comments, sort by date or rating
- **Content moderation** — Report inappropriate content; admin dashboard to review and hide reported posts/comments
- **User profiles** — Avatar upload, profile editing, JWT-based authentication
- **Admin panel** — Admin users can view reported content and hide posts/comments

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, TypeScript |
| Backend | Next.js API Routes (Pages Router) |
| Database | SQLite via Prisma ORM |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Code Execution | Docker containers (one per language) |
| Styling | Tailwind CSS with custom glassmorphism design system |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Docker** (for sandboxed code execution)
- **SQLite3** (usually pre-installed on Linux/macOS)

### 1. Clone and install

```bash
git clone https://github.com/davidzheglov/Scriptorium-Project-2.git
cd Scriptorium-Project-2/PP2/my-app
npm install
```

### 2. Set up environment variables

Create a `.env` file in `PP2/my-app/`:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your_secret_key_here"
BCRYPT_SALT_ROUNDS=10
```

### 3. Build Docker images for code execution

```bash
bash startup.sh
```

This builds Docker images for all 11 supported languages and also:
- Installs dependencies
- Generates the Prisma client
- Runs database migrations
- Creates a default admin user (`admin@example.com` / `adminpassword`)

### 4. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### Quick start (alternative)

If you just want to run it without Docker (code execution will not work):

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

---

## Project Structure

```
PP2/my-app/
├── components/          # Shared React components (Navbar)
├── middleware/           # JWT auth middleware
├── pages/
│   ├── api/
│   │   ├── blogs/       # Blog CRUD + comments endpoints
│   │   ├── code/        # Code execution endpoint + Dockerfiles
│   │   ├── comments/    # Comment CRUD
│   │   ├── reports/     # Content reporting + admin hide
│   │   ├── templates/   # Template CRUD
│   │   ├── users/       # Auth (login, signup, profile, avatar)
│   │   └── votes.ts     # Voting endpoint
│   ├── admin/           # Admin reports dashboard
│   ├── blogposts/       # Blog listing + detail pages
│   ├── codespace.tsx    # Code editor + execution
│   ├── templates.tsx    # Template browser
│   ├── settings.tsx     # User profile settings
│   ├── login.tsx        # Login page
│   ├── signup.tsx       # Signup page
│   └── index.tsx        # Landing page
├── prisma/
│   └── schema.prisma    # Database schema
├── styles/
│   └── globals.css      # Tailwind + custom design system
├── utils/               # DB connection, helpers
├── startup.sh           # Full setup script (Docker + DB + admin)
└── run.sh               # Start dev server
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/signup` | Create account |
| POST | `/api/users/login` | Login (returns JWT) |
| POST | `/api/users/logout` | Logout |
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update profile fields |
| POST | `/api/users/avatar-upload` | Upload avatar image |

### Blog Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs` | List posts (paginated, searchable, sortable) |
| POST | `/api/blogs` | Create post |
| GET | `/api/blogs/:id` | Get single post |
| PUT | `/api/blogs/:id` | Update post |
| DELETE | `/api/blogs/:id` | Delete post |

### Code Execution
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/code/execute` | Execute code in Docker sandbox |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates/visitor_get` | List all templates (public) |
| POST | `/api/templates` | Create template (auth required) |

### Voting & Reporting
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/votes` | Vote on post or comment |
| POST | `/api/reports/create` | Report content |
| GET | `/api/reports` | List reports (admin only) |
| PATCH | `/api/reports/hide` | Hide content (admin only) |

---

## Database Schema

The app uses SQLite with Prisma ORM. Key models:

- **User** — email, password hash, name, avatar, role (USER/ADMIN)
- **Template** — code snippets with title, explanation, tags
- **BlogPost** — posts with title, description, linked templates, tags, votes
- **Comment** — nested comments on blog posts with votes
- **Report** — content reports (on posts or comments)
- **Vote** — upvote/downvote tracking per user
- **Tag** — shared tags across templates and blog posts

---

## Default Accounts

After running `startup.sh`:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | adminpassword | ADMIN |
