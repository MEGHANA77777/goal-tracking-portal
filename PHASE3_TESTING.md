# Phase 3 Testing Guide - Manager Workflow

## Prerequisites

1. Complete Phase 1 & 2 setup
2. Have an employee goal sheet in SUBMITTED status
3. API running on `http://localhost:3001`

## Setup Test Data

### 1. Login as Employee and Submit Goal Sheet

```bash
# Login as employee
EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Get active cycle
CYCLE_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  | jq -r '.data.cycle.id')

THRUST_AREA_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  | jq -r '.data.cycle.thrustAreas[0].id')

# Create goal sheet
SHEET_ID=$(curl -s -X POST http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"cycleId\": \"$CYCLE_ID\"}" \
  | jq -r '.data.goalSheet.id')

# Add 4 goals (total 100%)
curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Increase user engagement\",
    \"uomType\": \"NUMERIC_MIN\",
    \"target\": 25,
    \"weightage\": 30
  }"

curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Reduce bug count\",
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

GOAL_ID=$(curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Zero security incidents\",
    \"uomType\": \"ZERO\",
    \"target\": 0,
    \"weightage\": 10
  }" | jq -r '.data.goal.id')

# Submit for approval
curl -s -X PATCH http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/submit \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" | jq

echo "Goal Sheet ID: $SHEET_ID"
echo "Goal ID: $GOAL_ID"
```

### 2. Login as Manager

```bash
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

echo "Manager Token: $MANAGER_TOKEN"
```

---

## Manager Workflow Tests

### 1. Get Team Members

```bash
curl -X GET http://localhost:3001/api/v1/manager/team \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "team": [
      {
        "id": "...",
        "name": "Jane Employee",
        "email": "employee@company.com",
        "employeeCode": "EMP003",
        "department": {
          "id": "...",
          "name": "Engineering"
        }
      },
      {
        "id": "...",
        "name": "Bob Developer",
        "email": "employee2@company.com",
        "employeeCode": "EMP004"
      }
    ]
  }
}
```

---

### 2. Get Pending Approvals

```bash
curl -X GET http://localhost:3001/api/v1/manager/approvals/pending \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goalSheets": [
      {
        "id": "...",
        "status": "SUBMITTED",
        "submittedAt": "2026-05-17T03:30:00.000Z",
        "totalWeightage": 100,
        "user": {
          "id": "...",
          "name": "Jane Employee",
          "email": "employee@company.com"
        },
        "goals": [
          {
            "id": "...",
            "title": "Increase user engagement",
            "target": 25,
            "weightage": 30,
            "uomType": "NUMERIC_MIN"
          }
        ]
      }
    ],
    "count": 1
  }
}
```

---

### 3. Get All Team Goal Sheets

```bash
curl -X GET http://localhost:3001/api/v1/manager/team/goal-sheets \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

---

### 4. Manager Inline Edit Goal

```bash
# Edit target and weightage
curl -X PATCH http://localhost:3001/api/v1/manager/goals/$GOAL_ID \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target": 30,
    "weightage": 15
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goal": {
      "id": "...",
      "title": "Zero security incidents",
      "target": 30,
      "weightage": 15,
      "uomType": "ZERO"
    }
  }
}
```

**Note**: This creates an audit log entry automatically

---

### 5. Approve Goal Sheet

```bash
curl -X POST http://localhost:3001/api/v1/manager/approvals/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"goalSheetId\": \"$SHEET_ID\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goalSheet": {
      "id": "...",
      "status": "APPROVED",
      "isLocked": true,
      "approvedAt": "2026-05-17T04:00:00.000Z",
      "approvedBy": {
        "id": "...",
        "name": "John Manager"
      },
      "totalWeightage": 100
    }
  }
}
```

**Side Effects:**
- Goal sheet status → APPROVED
- isLocked → true
- Audit log created
- Notification sent to employee

---

### 6. Return Goal Sheet for Rework

```bash
# First, create another submitted goal sheet to test return
# Then return it:

curl -X POST http://localhost:3001/api/v1/manager/approvals/return \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"goalSheetId\": \"$SHEET_ID\",
    \"reason\": \"Please revise the targets for Q2 goals. The timeline seems too aggressive given current resource constraints.\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goalSheet": {
      "id": "...",
      "status": "RETURNED",
      "returnedAt": "2026-05-17T04:05:00.000Z",
      "returnReason": "Please revise the targets for Q2 goals..."
    }
  }
}
```

**Side Effects:**
- Goal sheet status → RETURNED
- Employee can now edit and resubmit
- Audit log created
- Notification sent to employee

---

### 7. Admin: Unlock Locked Goal Sheet

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Unlock an approved goal sheet
curl -X POST http://localhost:3001/api/v1/manager/goal-sheets/unlock \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"goalSheetId\": \"$SHEET_ID\",
    \"reason\": \"Organizational restructuring requires goal revision\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goalSheet": {
      "id": "...",
      "status": "DRAFT",
      "isLocked": false
    }
  }
}
```

**Side Effects:**
- isLocked → false
- status → DRAFT
- Audit log created with reason
- Notification sent to employee

---

## Error Cases to Test

### 1. Manager Tries to Approve Without 100% Weightage

```bash
# After inline editing, if total ≠ 100%
curl -X POST http://localhost:3001/api/v1/manager/approvals/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"goalSheetId\": \"$SHEET_ID\"}"
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "APPROVE_ERROR",
    "message": "Cannot approve: Total weightage is 95%, must be 100%"
  }
}
```

---

### 2. Manager Tries to Edit Another Manager's Team

```bash
# Login as different manager (if available)
# Try to edit goal from another manager's team

curl -X PATCH http://localhost:3001/api/v1/manager/goals/$GOAL_ID \
  -H "Authorization: Bearer $OTHER_MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target": 50}'
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "UPDATE_ERROR",
    "message": "Access denied: Not your direct report"
  }
}
```

---

### 3. Employee Tries to Access Manager Routes

```bash
curl -X GET http://localhost:3001/api/v1/manager/approvals/pending \
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

### 4. Try to Approve Already Approved Sheet

```bash
curl -X POST http://localhost:3001/api/v1/manager/approvals/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"goalSheetId\": \"$SHEET_ID\"}"
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "APPROVE_ERROR",
    "message": "Can only approve submitted goal sheets"
  }
}
```

---

### 5. Return Reason Too Short

```bash
curl -X POST http://localhost:3001/api/v1/manager/approvals/return \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"goalSheetId\": \"$SHEET_ID\",
    \"reason\": \"Too short\"
  }"
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "reason",
        "message": "Return reason must be at least 10 characters"
      }
    ]
  }
}
```

---

### 6. Non-Admin Tries to Unlock

```bash
curl -X POST http://localhost:3001/api/v1/manager/goal-sheets/unlock \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"goalSheetId\": \"$SHEET_ID\",
    \"reason\": \"Need to make changes\"
  }"
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

## Complete Workflow Test Script

```bash
#!/bin/bash

echo "🧪 Phase 3: Manager Workflow Test"
echo "=================================="

# 1. Employee creates and submits
echo "1️⃣ Employee: Creating goal sheet..."
EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

CYCLE_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" | jq -r '.data.cycle.id')

THRUST_AREA_ID=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" | jq -r '.data.cycle.thrustAreas[0].id')

SHEET_ID=$(curl -s -X POST http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"cycleId\": \"$CYCLE_ID\"}" | jq -r '.data.goalSheet.id')

# Add goals
for i in 30 25 35 10; do
  curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
    -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"thrustAreaId\": \"$THRUST_AREA_ID\",
      \"title\": \"Goal with $i% weightage\",
      \"uomType\": \"NUMERIC_MIN\",
      \"target\": 10,
      \"weightage\": $i
    }" > /dev/null
done

curl -s -X PATCH http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/submit \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" > /dev/null

echo "✅ Goal sheet submitted: $SHEET_ID"

# 2. Manager reviews
echo "2️⃣ Manager: Checking pending approvals..."
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

PENDING_COUNT=$(curl -s -X GET http://localhost:3001/api/v1/manager/approvals/pending \
  -H "Authorization: Bearer $MANAGER_TOKEN" | jq -r '.data.count')

echo "✅ Pending approvals: $PENDING_COUNT"

# 3. Manager approves
echo "3️⃣ Manager: Approving goal sheet..."
curl -s -X POST http://localhost:3001/api/v1/manager/approvals/approve \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"goalSheetId\": \"$SHEET_ID\"}" | jq '.data.goalSheet | {status, isLocked, approvedBy}'

echo "✅ Goal sheet approved and locked"

echo ""
echo "🎉 Phase 3 test complete!"
```

---

## Verify in Prisma Studio

```bash
cd apps/api
npx prisma studio
```

**Check:**
1. **GoalSheet** table: status = "APPROVED", isLocked = true, approvedById set
2. **AuditLog** table: APPROVE action logged with manager ID
3. **Notification** table: Employee has "Goal Sheet Approved" notification
