# Goal Setting & Tracking Portal

Enterprise-grade goal management system with quarterly check-ins, manager approvals, and comprehensive reporting.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Setup Instructions

1. **Clone and Install Dependencies**
```bash
git clone https://github.com/MEGHANA77777/goal-tracking-portal.git
cd goal-tracking-portal
npm install
```

2. **Start Database Services**
```bash
docker-compose up -d
```

3. **Setup Database**
```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

4. **Start Development Server**
```bash
# From root directory
npm run dev
```

The API will be available at `http://localhost:3001`

### Demo Credentials

```
Admin:    admin@company.com / password123
Manager:  manager@company.com / password123
Employee: employee@company.com / password123
```

**📖 For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## 📁 Project Structure

```
goal-tracking-portal/
├── apps/
│   ├── api/          # Express.js Backend
│   └── web/          # Next.js Frontend (coming next)
├── packages/
│   └── shared/       # Shared types & schemas
└── docker-compose.yml
```

## 🛠️ Available Commands

```bash
npm run dev          # Start all services in dev mode
npm run build        # Build all packages
npm run typecheck    # Type check all packages
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
```

## 📊 Database Schema

- **Users & Departments**: Role-based access (Admin, Manager, Employee)
- **Cycles & Thrust Areas**: Annual goal-setting periods
- **Goal Sheets & Goals**: Employee goals with weightage validation
- **Check-ins & Achievements**: Quarterly progress tracking
- **Audit Logs**: Complete change history

## 🔐 Authentication

- JWT-based authentication
- Access tokens (15min expiry)
- Refresh tokens (7 days, httpOnly cookies)
- Role-based access control (RBAC)

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

## 🎯 Development Roadmap

- [x] Phase 1: Foundation (Auth, Database, RBAC)
- [ ] Phase 2: Goal Management
- [ ] Phase 3: Manager Workflow
- [ ] Phase 4: Check-in System
- [ ] Phase 5: Admin Module
- [ ] Phase 6: Reporting & Audit
- [ ] Phase 7: Bonus Features

## 📄 License

MIT
