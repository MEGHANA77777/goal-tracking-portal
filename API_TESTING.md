# API Testing Guide - Phase 1

## Setup

1. Ensure services are running:
```bash
docker-compose up -d
npm run dev
```

2. API Base URL: `http://localhost:3001`

---

## Authentication Endpoints

### 1. Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@company.com",
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
      "email": "employee@company.com",
      "name": "Jane Employee",
      "role": "EMPLOYEE",
      "employeeCode": "EMP003",
      "department": {
        "id": "...",
        "name": "Engineering",
        "code": "ENG"
      }
    }
  }
}
```

### 2. Get Current User
```bash
# Replace YOUR_ACCESS_TOKEN with the token from login response
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "employee@company.com",
      "name": "Jane Employee",
      "role": "EMPLOYEE",
      "employeeCode": "EMP003",
      "department": {
        "id": "...",
        "name": "Engineering",
        "code": "ENG"
      },
      "manager": {
        "id": "...",
        "name": "John Manager",
        "email": "manager@company.com"
      }
    }
  }
}
```

### 3. Refresh Token
```bash
# This uses the httpOnly cookie set during login
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Logout
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Cookie: refreshToken=YOUR_REFRESH_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Test All Roles

### Employee Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}'
```

### Manager Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@company.com", "password": "password123"}'
```

### Admin Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "password123"}'
```

---

## Error Cases

### Invalid Credentials
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "wrong@company.com", "password": "wrong"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "LOGIN_FAILED",
    "message": "Invalid credentials"
  }
}
```

### Missing Token
```bash
curl -X GET http://localhost:3001/api/v1/auth/me
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

### Invalid Token
```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired token"
  }
}
```

### Validation Error
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "123"}'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address"
      },
      {
        "field": "password",
        "message": "Password must be at least 6 characters"
      }
    ]
  }
}
```

---

## Using Postman/Insomnia

### Import Collection

Create a new collection with these requests:

1. **Login** - POST `{{baseUrl}}/api/v1/auth/login`
2. **Get Me** - GET `{{baseUrl}}/api/v1/auth/me`
3. **Refresh** - POST `{{baseUrl}}/api/v1/auth/refresh`
4. **Logout** - POST `{{baseUrl}}/api/v1/auth/logout`

### Environment Variables
- `baseUrl`: `http://localhost:3001`
- `accessToken`: (set automatically from login response)

---

## Database Inspection

### Using Prisma Studio
```bash
cd apps/api
npx prisma studio
```

Opens at `http://localhost:5555`

### Direct PostgreSQL Access
```bash
docker exec -it goaltracker-db psql -U postgres -d goaltracker
```

Useful queries:
```sql
-- View all users
SELECT id, email, name, role FROM "User";

-- View refresh tokens
SELECT token, "userId", "expiresAt", "revokedAt" FROM "RefreshToken";

-- View cycles
SELECT * FROM "Cycle";

-- View thrust areas
SELECT * FROM "ThrustArea";
```

---

## Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T03:15:00.000Z"
}
```

---

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep goaltracker-db

# Check logs
docker logs goaltracker-db

# Restart services
docker-compose restart
```

### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Prisma Client Not Generated
```bash
cd apps/api
npx prisma generate
```

### Migration Issues
```bash
cd apps/api
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate dev
npx prisma db seed
```
