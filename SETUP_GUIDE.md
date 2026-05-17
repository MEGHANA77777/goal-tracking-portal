# 🚀 Goal Tracking Portal - Setup & Implementation Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

---

## 🛠️ Quick Setup (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/MEGHANA77777/goal-tracking-portal.git
cd goal-tracking-portal
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for the monorepo.

### Step 3: Start Database Services

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis in Docker containers.

**Verify services are running:**
```bash
docker ps
```

You should see:
- `goaltracker-db` (PostgreSQL)
- `goaltracker-redis` (Redis)

### Step 4: Setup Database

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed
```

This will:
- Create all database tables
- Seed demo data (users, cycles, thrust areas, check-in windows)

### Step 5: Start the API Server

```bash
# From apps/api directory
npm run dev
```

Or from root:
```bash
cd ../..
npm run dev
```

**API will be available at:** `http://localhost:3001`

---

## ✅ Verify Installation

### 1. Check API Health

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T03:46:13.370Z"
}
```

### 2. Test Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@company.com",
      "name": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

---

## 👥 Demo Credentials

The seed script creates these users:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | admin@company.com | password123 | Full system access |
| **Manager** | manager@company.com | password123 | Team management |
| **Employee** | employee@company.com | password123 | Goal creation |
| **Employee** | employee2@company.com | password123 | Additional employee |

---

## 📁 Project Structure

```
goal-tracking-portal/
├── apps/
│   └── api/                    # Backend API (Express + Prisma)
│       ├── src/
│       │   ├── modules/        # Feature modules
│       │   │   ├── auth/       # Authentication
│       │   │   ├── goals/      # Goal management
│       │   │   ├── manager/    # Manager workflow
│       │   │   ├── checkins/   # Check-in system
│       │   │   ├── admin/      # Admin module
│       │   │   └── reports/    # Reporting & audit
│       │   ├── middleware/     # Auth, RBAC, validation
│       │   ├── lib/            # Utilities (JWT, logger, score calculator)
│       │   └── app.ts          # Express app
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   └── seed.ts         # Demo data
│       └── package.json
├── docker-compose.yml          # PostgreSQL + Redis
├── package.json                # Root package
└── README.md
```

---

## 🔧 Available Commands

### Root Level

```bash
npm run dev          # Start API in development mode
npm run build        # Build all packages
npm run typecheck    # Type check all packages
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio (DB GUI)
```

### API Level (from `apps/api/`)

```bash
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm start            # Start production build
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Create new migration
```

---

## 🗄️ Database Management

### View Database (Prisma Studio)

```bash
cd apps/api
npx prisma studio
```

Opens at `http://localhost:5555` - Visual database browser

### Reset Database

```bash
cd apps/api
npx prisma migrate reset
npx prisma db seed
```

**⚠️ Warning:** This deletes all data!

### Create New Migration

```bash
cd apps/api
npx prisma migrate dev --name your_migration_name
```

---

## 🧪 Testing the API

### Using cURL

See `API_TESTING.md`, `PHASE2_TESTING.md`, `PHASE3_TESTING.md`, etc. for comprehensive test scripts.

**Quick Test:**
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# 2. Get active cycle
curl -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $TOKEN"

# 3. Get my goal sheets
curl -X GET http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman/Insomnia

1. Import the API endpoints
2. Set base URL: `http://localhost:3001/api/v1`
3. Add Authorization header: `Bearer YOUR_TOKEN`

---

## 📊 Complete Workflow Demo

### 1. Employee Creates Goals

```bash
# Login as employee
EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Get active cycle
CYCLE_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" | jq -r '.data.cycle.id')

THRUST_AREA_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" | jq -r '.data.cycle.thrustAreas[0].id')

# Create goal sheet
SHEET_ID=$(curl -s -X POST http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"cycleId\": \"$CYCLE_ID\"}" | jq -r '.data.goalSheet.id')

# Add goals (total 100% weightage)
curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Increase user engagement by 25%\",
    \"uomType\": \"NUMERIC_MIN\",
    \"target\": 25,
    \"weightage\": 30
  }"

curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Reduce bug count to under 10\",
    \"uomType\": \"NUMERIC_MAX\",
    \"target\": 10,
    \"weightage\": 25
  }"

curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Launch feature by Q2\",
    \"uomType\": \"TIMELINE\",
    \"target\": 1,
    \"targetDate\": \"2026-10-01T00:00:00.000Z\",
    \"weightage\": 35
  }"

curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Zero security incidents\",
    \"uomType\": \"ZERO\",
    \"target\": 0,
    \"weightage\": 10
  }"

# Submit for approval
curl -s -X PATCH http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/submit \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"

echo "✅ Employee submitted goal sheet: $SHEET_ID"
```

### 2. Manager Approves

```bash
# Login as manager
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Get pending approvals
curl -s -X GET http://localhost:3001/api/v1/manager/approvals/pending \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq

# Approve goal sheet
curl -s -X POST http://localhost:3001/api/v1/manager/approvals/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"goalSheetId\": \"$SHEET_ID\"}"

echo "✅ Manager approved goal sheet"
```

### 3. Employee Logs Check-in

```bash
# Get or create check-in
CHECKIN=$(curl -s -X GET http://localhost:3001/api/v1/checkins/goal-sheets/$SHEET_ID/checkin \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN")

CHECKIN_ID=$(echo $CHECKIN | jq -r '.data.checkin.id')

# Get goal IDs
GOAL_IDS=$(echo $CHECKIN | jq -r '.data.checkin.achievements[].goalId')

# Update achievements
curl -s -X PUT http://localhost:3001/api/v1/checkins/$CHECKIN_ID/achievements \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"achievements\": [
      {\"goalId\": \"$(echo $GOAL_IDS | awk '{print $1}')\", \"actualValue\": 30, \"status\": \"COMPLETED\"},
      {\"goalId\": \"$(echo $GOAL_IDS | awk '{print $2}')\", \"actualValue\": 8, \"status\": \"COMPLETED\"},
      {\"goalId\": \"$(echo $GOAL_IDS | awk '{print $3}')\", \"actualDate\": \"2026-09-25T00:00:00.000Z\", \"status\": \"COMPLETED\"},
      {\"goalId\": \"$(echo $GOAL_IDS | awk '{print $4}')\", \"actualValue\": 0, \"status\": \"COMPLETED\"}
    ]
  }"

# Submit check-in
curl -s -X POST http://localhost:3001/api/v1/checkins/checkins/submit \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"checkinId\": \"$CHECKIN_ID\"}"

echo "✅ Employee submitted check-in"
```

### 4. Admin Views Reports

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Get completion dashboard
curl -s -X GET http://localhost:3001/api/v1/admin/dashboard/completion \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Export achievement report (Excel)
curl -X GET "http://localhost:3001/api/v1/reports/achievement?format=excel" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  --output achievement-report.xlsx

echo "✅ Admin exported report"
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d

# Check logs
docker logs goaltracker-db
docker logs goaltracker-redis
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps | grep goaltracker-db

# Restart PostgreSQL
docker restart goaltracker-db

# Check connection
docker exec -it goaltracker-db psql -U postgres -d goaltracker -c "SELECT 1;"
```

### Prisma Client Not Generated

```bash
cd apps/api
npx prisma generate
```

### Migration Issues

```bash
cd apps/api
npx prisma migrate reset  # ⚠️ Deletes all data
npx prisma migrate dev
npx prisma db seed
```

---

## 🔒 Environment Variables

The `.env` file is already configured for local development. For production:

```bash
# Copy example
cp .env.example .env

# Update these values:
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-super-secret-key"
REDIS_URL="redis://host:6379"
NODE_ENV="production"
```

---

## 📦 Production Deployment

### Option 1: Railway (Recommended)

1. Push code to GitHub
2. Go to [Railway](https://railway.app)
3. Create new project from GitHub repo
4. Add PostgreSQL and Redis services
5. Set environment variables
6. Deploy!

### Option 2: Docker

```bash
# Build
docker build -t goal-tracker-api -f infrastructure/docker/Dockerfile.api .

# Run
docker run -p 3001:3001 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="..." \
  -e JWT_SECRET="..." \
  goal-tracker-api
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication
All protected routes require:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Key Endpoints

**Authentication:**
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Current user

**Goals:**
- `POST /goal-sheets` - Create goal sheet
- `POST /goal-sheets/:id/goals` - Add goal
- `PATCH /goal-sheets/:id/submit` - Submit for approval

**Manager:**
- `GET /manager/approvals/pending` - Pending approvals
- `POST /manager/approvals/approve` - Approve
- `POST /manager/approvals/return` - Return for rework

**Check-ins:**
- `GET /checkins/goal-sheets/:id/checkin` - Get/create check-in
- `PUT /checkins/:id/achievements` - Update achievements
- `POST /checkins/checkins/submit` - Submit check-in

**Admin:**
- `GET /admin/users` - All users
- `POST /admin/shared-goals/push` - Push shared goal
- `GET /admin/dashboard/completion` - Completion dashboard

**Reports:**
- `GET /reports/achievement?format=excel` - Export report
- `GET /reports/audit-logs` - Audit logs

See testing guides for detailed examples.

---

## 🎯 Next Steps

1. ✅ **Setup Complete** - API is running
2. 📱 **Build Frontend** - Create Next.js app (Phase 7)
3. 🔔 **Add Notifications** - Email integration
4. 🚀 **Deploy** - Railway/Vercel deployment
5. 📊 **Monitor** - Add logging and monitoring

---

## 💡 Tips

- Use **Prisma Studio** (`npm run db:studio`) to view/edit data visually
- Check **PHASE*_TESTING.md** files for detailed API examples
- All passwords are hashed with bcrypt
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Audit logs track all important changes

---

## 📞 Support

- **Documentation**: See PHASE*_SUMMARY.md files
- **Testing**: See PHASE*_TESTING.md files
- **Issues**: Check troubleshooting section above

---

**🎉 You're all set! The Goal Tracking Portal is ready to use.**
