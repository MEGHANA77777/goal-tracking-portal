# Phase 5 Testing Guide - Admin Module

## Prerequisites

1. Complete Phases 1-4
2. API running on `http://localhost:3001`
3. Admin access token

## Setup

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

echo "Admin Token: $ADMIN_TOKEN"
```

---

## 1. User Management

### Get All Users

```bash
curl -X GET http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "...",
        "email": "admin@company.com",
        "name": "Admin User",
        "employeeCode": "EMP001",
        "role": "ADMIN",
        "department": {
          "name": "Engineering"
        },
        "manager": null
      }
    ]
  }
}
```

---

### Create New User

```bash
curl -X POST http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemployee@company.com",
    "name": "New Employee",
    "employeeCode": "EMP005",
    "password": "password123",
    "role": "EMPLOYEE",
    "departmentId": "DEPARTMENT_ID",
    "managerId": "MANAGER_ID"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "newemployee@company.com",
      "name": "New Employee",
      "employeeCode": "EMP005",
      "role": "EMPLOYEE"
    }
  }
}
```

---

### Update User

```bash
curl -X PATCH http://localhost:3001/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "MANAGER",
    "isActive": true
  }'
```

---

### Delete User

```bash
curl -X DELETE http://localhost:3001/api/v1/admin/users/USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 2. Cycle Management

### Get All Cycles

```bash
curl -X GET http://localhost:3001/api/v1/admin/cycles \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "cycles": [
      {
        "id": "...",
        "name": "FY 2026-2027",
        "year": 2026,
        "isActive": true,
        "goalSettingOpen": "2026-04-01T00:00:00.000Z",
        "goalSettingClose": "2026-06-30T00:00:00.000Z",
        "thrustAreas": [...],
        "_count": {
          "goalSheets": 5
        }
      }
    ]
  }
}
```

---

### Create New Cycle

```bash
curl -X POST http://localhost:3001/api/v1/admin/cycles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FY 2027-2028",
    "year": 2027,
    "goalSettingOpen": "2027-04-01T00:00:00.000Z",
    "goalSettingClose": "2027-06-30T00:00:00.000Z"
  }'
```

---

### Update Cycle

```bash
curl -X PATCH http://localhost:3001/api/v1/admin/cycles/CYCLE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FY 2027-2028 (Updated)",
    "isActive": false
  }'
```

---

### Activate Cycle

```bash
curl -X POST http://localhost:3001/api/v1/admin/cycles/CYCLE_ID/activate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Side Effect**: Deactivates all other cycles

---

## 3. Thrust Area Management

### Create Thrust Area

```bash
curl -X POST http://localhost:3001/api/v1/admin/thrust-areas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Innovation & R&D",
    "description": "Research and development initiatives",
    "cycleId": "CYCLE_ID"
  }'
```

---

### Update Thrust Area

```bash
curl -X PATCH http://localhost:3001/api/v1/admin/thrust-areas/THRUST_AREA_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Innovation & Research",
    "isActive": true
  }'
```

---

## 4. Shared Goals

### Get All Shared Goals

```bash
curl -X GET http://localhost:3001/api/v1/admin/shared-goals \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sharedGoals": [
      {
        "id": "...",
        "title": "Reduce customer churn by 15%",
        "uomType": "NUMERIC_MAX",
        "target": 15,
        "thrustAreaId": "...",
        "cycleId": "...",
        "_count": {
          "goals": 3
        },
        "goals": [
          {
            "goalSheet": {
              "user": {
                "name": "Jane Employee"
              }
            }
          }
        ]
      }
    ]
  }
}
```

---

### Create Shared Goal

```bash
# Get cycle and thrust area IDs first
CYCLE_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.cycle.id')

THRUST_AREA_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.cycle.thrustAreas[0].id')

# Create shared goal
curl -X POST http://localhost:3001/api/v1/admin/shared-goals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Reduce customer churn by 15%\",
    \"description\": \"Company-wide initiative to improve retention\",
    \"uomType\": \"NUMERIC_MAX\",
    \"target\": 15,
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"cycleId\": \"$CYCLE_ID\"
  }"
```

**Save the sharedGoalId**

---

### Push Shared Goal to Employees

```bash
# Get employee IDs
EMPLOYEE_IDS=$(curl -s -X GET http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq -r '.data.users[] | select(.role == "EMPLOYEE") | .id' \
  | jq -R -s -c 'split("\n")[:-1]')

# Push shared goal
curl -X POST http://localhost:3001/api/v1/admin/shared-goals/push \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sharedGoalId\": \"$SHARED_GOAL_ID\",
    \"userIds\": $EMPLOYEE_IDS,
    \"weightage\": 20
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "userId": "...",
        "success": true
      },
      {
        "userId": "...",
        "success": false,
        "reason": "Goal sheet is locked"
      }
    ]
  }
}
```

**Side Effects:**
- Creates goal in each employee's goal sheet
- Goal title and target are locked
- Weightage is adjustable by employee
- Updates total weightage

---

## 5. Completion Dashboard

```bash
curl -X GET http://localhost:3001/api/v1/admin/dashboard/completion \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalGoalSheets": 10,
    "statusCounts": {
      "DRAFT": 2,
      "SUBMITTED": 1,
      "APPROVED": 6,
      "RETURNED": 1
    },
    "checkinCompletion": [
      {
        "quarter": 1,
        "label": "Q1 Check-in",
        "total": 6,
        "reviewed": 4,
        "percentage": 67
      },
      {
        "quarter": 2,
        "label": "Q2 Check-in",
        "total": 0,
        "reviewed": 0,
        "percentage": 0
      }
    ],
    "departmentSummary": [
      {
        "id": "...",
        "name": "Engineering",
        "totalEmployees": 3,
        "totalGoalSheets": 3,
        "approvedGoalSheets": 2,
        "approvalRate": 67
      },
      {
        "id": "...",
        "name": "Sales",
        "totalEmployees": 0,
        "totalGoalSheets": 0,
        "approvedGoalSheets": 0,
        "approvalRate": 0
      }
    ]
  }
}
```

---

### Filter by Cycle

```bash
curl -X GET "http://localhost:3001/api/v1/admin/dashboard/completion?cycleId=CYCLE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 6. Department Management

### Get All Departments

```bash
curl -X GET http://localhost:3001/api/v1/admin/departments \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### Create Department

```bash
curl -X POST http://localhost:3001/api/v1/admin/departments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing",
    "code": "MKT",
    "managerId": "MANAGER_ID"
  }'
```

---

### Update Department

```bash
curl -X PATCH http://localhost:3001/api/v1/admin/departments/DEPT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marketing & Communications",
    "managerId": "NEW_MANAGER_ID"
  }'
```

---

## Error Cases

### 1. Non-Admin Tries to Access

```bash
# Login as employee
EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Try to access admin route
curl -X GET http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

---

### 2. Create User with Duplicate Email

```bash
curl -X POST http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "name": "Duplicate User",
    "employeeCode": "EMP999",
    "password": "password123",
    "role": "EMPLOYEE"
  }'
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "CREATE_USER_ERROR",
    "message": "User with this email or employee code already exists"
  }
}
```

---

### 3. Push Shared Goal to Locked Sheet

```bash
# If employee's goal sheet is already approved/locked
curl -X POST http://localhost:3001/api/v1/admin/shared-goals/push \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sharedGoalId": "SHARED_GOAL_ID",
    "userIds": ["LOCKED_USER_ID"],
    "weightage": 20
  }'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "userId": "...",
        "success": false,
        "reason": "Goal sheet is locked"
      }
    ]
  }
}
```

---

## Complete Test Script

```bash
#!/bin/bash

echo "🧪 Phase 5: Admin Module Test"
echo "=============================="

# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

echo "✅ Admin logged in"

# Get completion dashboard
echo ""
echo "📊 Completion Dashboard:"
curl -s -X GET http://localhost:3001/api/v1/admin/dashboard/completion \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '{
    totalGoalSheets,
    statusCounts,
    checkinCompletion: .checkinCompletion[] | {quarter, percentage}
  }'

# Get all users
USER_COUNT=$(curl -s -X GET http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.data.users | length')

echo ""
echo "✅ Total users: $USER_COUNT"

# Create shared goal
CYCLE_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.cycle.id')

THRUST_AREA_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.cycle.thrustAreas[0].id')

SHARED_GOAL_ID=$(curl -s -X POST http://localhost:3001/api/v1/admin/shared-goals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Shared Goal\",
    \"uomType\": \"NUMERIC_MIN\",
    \"target\": 100,
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"cycleId\": \"$CYCLE_ID\"
  }" | jq -r '.data.sharedGoal.id')

echo "✅ Shared goal created: $SHARED_GOAL_ID"

# Get employee IDs
EMPLOYEE_IDS=$(curl -s -X GET http://localhost:3001/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq -r '.data.users[] | select(.role == "EMPLOYEE") | .id' \
  | head -2 | jq -R -s -c 'split("\n")[:-1]')

# Push shared goal
PUSH_RESULTS=$(curl -s -X POST http://localhost:3001/api/v1/admin/shared-goals/push \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sharedGoalId\": \"$SHARED_GOAL_ID\",
    \"userIds\": $EMPLOYEE_IDS,
    \"weightage\": 15
  }" | jq '.data.results')

echo ""
echo "📤 Shared goal push results:"
echo "$PUSH_RESULTS" | jq

echo ""
echo "🎉 Phase 5 test complete!"
```

---

## Verify in Prisma Studio

```bash
cd apps/api
npx prisma studio
```

**Check:**
1. **User** table: New users created
2. **Cycle** table: New cycles, isActive flag
3. **SharedGoal** table: Shared goals created
4. **Goal** table: Shared goals pushed to employees (isShared=true, isTitleLocked=true)
5. **GoalSheet** table: Total weightage updated after push
