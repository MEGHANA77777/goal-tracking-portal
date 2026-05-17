# Phase 4 Testing Guide - Check-in System

## Prerequisites

1. Complete Phases 1-3
2. Have an approved goal sheet
3. Active check-in window (Q1 is active by default in seed data)
4. API running on `http://localhost:3001`

## Setup Tokens

```bash
# Employee token
EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Manager token
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')
```

---

## 1. Get Active Check-in Window

```bash
curl -X GET http://localhost:3001/api/v1/checkins/windows/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "window": {
      "id": "...",
      "quarter": 1,
      "label": "Q1 Check-in",
      "opensAt": "2026-07-01T00:00:00.000Z",
      "closesAt": "2026-07-15T00:00:00.000Z",
      "isActive": true,
      "cycle": {
        "id": "...",
        "name": "FY 2026-2027"
      }
    }
  }
}
```

---

## 2. Get or Create Check-in for Goal Sheet

```bash
# First, get your approved goal sheet ID
SHEET_ID=$(curl -s -X GET http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  | jq -r '.data.goalSheets[0].id')

# Get or create check-in
curl -X GET http://localhost:3001/api/v1/checkins/goal-sheets/$SHEET_ID/checkin \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "checkin": {
      "id": "...",
      "status": "OPEN",
      "window": {
        "quarter": 1,
        "label": "Q1 Check-in"
      },
      "achievements": [
        {
          "id": "...",
          "goalId": "...",
          "actualValue": null,
          "actualDate": null,
          "status": "NOT_STARTED",
          "progressScore": null,
          "goal": {
            "title": "Increase user engagement",
            "target": 25,
            "weightage": 30,
            "uomType": "NUMERIC_MIN"
          }
        }
      ]
    }
  }
}
```

**Save the checkinId and achievementIds**

---

## 3. Update Individual Achievement

### NUMERIC_MIN (Higher is better)

```bash
curl -X PATCH http://localhost:3001/api/v1/checkins/achievements/ACHIEVEMENT_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualValue": 30,
    "status": "COMPLETED",
    "notes": "Exceeded target by implementing new engagement features"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "achievement": {
      "id": "...",
      "actualValue": 30,
      "status": "COMPLETED",
      "progressScore": 100,
      "notes": "Exceeded target by implementing new engagement features"
    }
  }
}
```

**Score Calculation**: (30 / 25) * 100 = 120, capped at 100

---

### NUMERIC_MAX (Lower is better)

```bash
curl -X PATCH http://localhost:3001/api/v1/checkins/achievements/ACHIEVEMENT_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualValue": 8,
    "status": "COMPLETED"
  }'
```

**Score Calculation**: (10 / 8) * 100 = 125, capped at 100 = **100%**

---

### TIMELINE (Date-based)

```bash
# Completed on time
curl -X PATCH http://localhost:3001/api/v1/checkins/achievements/ACHIEVEMENT_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualDate": "2026-09-25T00:00:00.000Z",
    "status": "COMPLETED",
    "notes": "Feature launched ahead of schedule"
  }'
```

**Score Calculation**: If actualDate <= targetDate → **100%**

```bash
# Completed 3 days late
curl -X PATCH http://localhost:3001/api/v1/checkins/achievements/ACHIEVEMENT_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualDate": "2026-10-04T00:00:00.000Z",
    "status": "COMPLETED"
  }'
```

**Score Calculation**: 100 - (3 days * 5%) = **85%**

---

### ZERO (Zero = success)

```bash
curl -X PATCH http://localhost:3001/api/v1/checkins/achievements/ACHIEVEMENT_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualValue": 0,
    "status": "COMPLETED",
    "notes": "No security incidents this quarter"
  }'
```

**Score Calculation**: actualValue === 0 → **100%**, otherwise **0%**

---

## 4. Bulk Update Achievements

```bash
curl -X PUT http://localhost:3001/api/v1/checkins/CHECKIN_ID/achievements \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "achievements": [
      {
        "goalId": "GOAL_ID_1",
        "actualValue": 30,
        "status": "COMPLETED",
        "notes": "Exceeded target"
      },
      {
        "goalId": "GOAL_ID_2",
        "actualValue": 8,
        "status": "COMPLETED"
      },
      {
        "goalId": "GOAL_ID_3",
        "actualDate": "2026-09-25T00:00:00.000Z",
        "status": "COMPLETED"
      },
      {
        "goalId": "GOAL_ID_4",
        "actualValue": 0,
        "status": "COMPLETED"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "...",
        "actualValue": 30,
        "progressScore": 100,
        "status": "COMPLETED"
      },
      {
        "id": "...",
        "actualValue": 8,
        "progressScore": 100,
        "status": "COMPLETED"
      },
      {
        "id": "...",
        "actualDate": "2026-09-25T00:00:00.000Z",
        "progressScore": 100,
        "status": "COMPLETED"
      },
      {
        "id": "...",
        "actualValue": 0,
        "progressScore": 100,
        "status": "COMPLETED"
      }
    ]
  }
}
```

---

## 5. Submit Check-in

```bash
curl -X POST http://localhost:3001/api/v1/checkins/checkins/submit \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkinId\": \"$CHECKIN_ID\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "checkin": {
      "id": "...",
      "status": "SUBMITTED",
      "submittedAt": "2026-05-17T04:30:00.000Z",
      "achievements": [...]
    }
  }
}
```

**Side Effects:**
- Status → SUBMITTED
- Notification sent to manager

---

## 6. Add Comment to Check-in

### Employee Comment

```bash
curl -X POST http://localhost:3001/api/v1/checkins/checkins/comments \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkinId\": \"$CHECKIN_ID\",
    \"content\": \"Overall good progress this quarter. The engagement feature took longer than expected but delivered great results.\",
    \"isManagerComment\": false
  }"
```

### Manager Comment

```bash
curl -X POST http://localhost:3001/api/v1/checkins/checkins/comments \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkinId\": \"$CHECKIN_ID\",
    \"content\": \"Excellent work on exceeding the engagement target. Keep up the momentum for Q2.\",
    \"isManagerComment\": true
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "...",
      "content": "Excellent work on exceeding the engagement target...",
      "isManagerComment": true,
      "createdAt": "2026-05-17T04:35:00.000Z",
      "author": {
        "id": "...",
        "name": "John Manager",
        "role": "MANAGER"
      }
    }
  }
}
```

---

## 7. Manager: Get Team Check-ins

```bash
curl -X GET http://localhost:3001/api/v1/checkins/team-checkins \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "checkins": [
      {
        "id": "...",
        "status": "SUBMITTED",
        "submittedAt": "2026-05-17T04:30:00.000Z",
        "employee": {
          "name": "Jane Employee",
          "email": "employee@company.com"
        },
        "window": {
          "quarter": 1,
          "label": "Q1 Check-in"
        },
        "achievements": [
          {
            "progressScore": 100,
            "status": "COMPLETED",
            "goal": {
              "title": "Increase user engagement",
              "weightage": 30
            }
          }
        ]
      }
    ]
  }
}
```

---

## 8. Manager: Review Check-in

```bash
curl -X POST http://localhost:3001/api/v1/checkins/checkins/review \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"checkinId\": \"$CHECKIN_ID\"
  }"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "checkin": {
      "id": "...",
      "status": "REVIEWED",
      "reviewedAt": "2026-05-17T04:40:00.000Z",
      "reviewedById": "..."
    }
  }
}
```

**Side Effects:**
- Status → REVIEWED
- Notification sent to employee

---

## 9. Get My Check-ins History

```bash
curl -X GET http://localhost:3001/api/v1/checkins/my-checkins \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

---

## Score Calculation Examples

### Example 1: NUMERIC_MIN (Revenue increase)
- **Target**: 25% increase
- **Actual**: 30% increase
- **Score**: (30 / 25) * 100 = 120 → **100%** (capped)

### Example 2: NUMERIC_MAX (Bug count)
- **Target**: Under 10 bugs
- **Actual**: 8 bugs
- **Score**: (10 / 8) * 100 = 125 → **100%** (capped)

### Example 3: TIMELINE (Feature launch)
- **Target Date**: Oct 1, 2026
- **Actual Date**: Oct 4, 2026 (3 days late)
- **Score**: 100 - (3 * 5) = **85%**

### Example 4: ZERO (Security incidents)
- **Target**: 0 incidents
- **Actual**: 0 incidents
- **Score**: **100%**

### Example 5: ZERO (Failed)
- **Target**: 0 incidents
- **Actual**: 2 incidents
- **Score**: **0%**

---

## Weighted Score Calculation

Given 4 goals with:
- Goal 1: 30% weightage, 100% progress = 30 points
- Goal 2: 25% weightage, 100% progress = 25 points
- Goal 3: 35% weightage, 85% progress = 29.75 points
- Goal 4: 10% weightage, 100% progress = 10 points

**Total Weighted Score**: 30 + 25 + 29.75 + 10 = **94.75%**

---

## Error Cases

### 1. Update Achievement After Review

```bash
curl -X PATCH http://localhost:3001/api/v1/checkins/achievements/ACHIEVEMENT_ID \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"actualValue": 50}'
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "UPDATE_ERROR",
    "message": "Cannot modify reviewed check-in"
  }
}
```

---

### 2. No Active Check-in Window

```bash
# If no window is active
curl -X GET http://localhost:3001/api/v1/checkins/windows/active \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_WINDOW",
    "message": "No active check-in window"
  }
}
```

---

### 3. Check-in for Unapproved Goal Sheet

```bash
# Try to create check-in for DRAFT goal sheet
curl -X GET http://localhost:3001/api/v1/checkins/goal-sheets/DRAFT_SHEET_ID/checkin \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN"
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "CHECKIN_ERROR",
    "message": "Can only create check-ins for approved goal sheets"
  }
}
```

---

## Complete Test Script

```bash
#!/bin/bash

echo "🧪 Phase 4: Check-in System Test"
echo "================================"

# Login
EMPLOYEE_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

MANAGER_TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "manager@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

# Get approved goal sheet
SHEET_ID=$(curl -s -X GET http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  | jq -r '.data.goalSheets[] | select(.status == "APPROVED") | .id' | head -1)

echo "✅ Goal Sheet ID: $SHEET_ID"

# Get or create check-in
CHECKIN=$(curl -s -X GET http://localhost:3001/api/v1/checkins/goal-sheets/$SHEET_ID/checkin \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN")

CHECKIN_ID=$(echo $CHECKIN | jq -r '.data.checkin.id')
echo "✅ Check-in ID: $CHECKIN_ID"

# Update achievements
ACHIEVEMENTS=$(echo $CHECKIN | jq -r '.data.checkin.achievements')
GOAL_IDS=$(echo $ACHIEVEMENTS | jq -r '.[].goalId')

# Bulk update
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
  }" | jq '.data.achievements[] | {progressScore, status}'

echo "✅ Achievements updated with progress scores"

# Submit check-in
curl -s -X POST http://localhost:3001/api/v1/checkins/checkins/submit \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"checkinId\": \"$CHECKIN_ID\"}" | jq '.data.checkin | {status, submittedAt}'

echo "✅ Check-in submitted"

# Manager reviews
curl -s -X POST http://localhost:3001/api/v1/checkins/checkins/review \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"checkinId\": \"$CHECKIN_ID\"}" | jq '.data.checkin | {status, reviewedAt}'

echo "✅ Check-in reviewed by manager"
echo ""
echo "🎉 Phase 4 test complete!"
```

---

## Verify in Prisma Studio

```bash
cd apps/api
npx prisma studio
```

**Check:**
1. **Checkin** table: status = "REVIEWED", submittedAt and reviewedAt set
2. **Achievement** table: progressScore calculated for all goals
3. **CheckinComment** table: Comments from employee and manager
4. **Notification** table: CHECKIN_SUBMITTED and CHECKIN_REVIEWED notifications
