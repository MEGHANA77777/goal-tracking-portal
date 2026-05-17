# Phase 2 Testing Guide - Goal Management

## Prerequisites

1. Complete Phase 1 setup
2. API running on `http://localhost:3001`
3. Have an access token from login

## Get Access Token

```bash
# Login as employee
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}'

# Save the accessToken from response
export TOKEN="your_access_token_here"
```

---

## 1. Get Active Cycle

```bash
curl -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "cycle": {
      "id": "...",
      "name": "FY 2026-2027",
      "year": 2026,
      "isActive": true,
      "thrustAreas": [
        {
          "id": "...",
          "name": "Product Development",
          "description": "Building and enhancing product features"
        },
        {
          "id": "...",
          "name": "Customer Success",
          "description": "Improving customer satisfaction and retention"
        }
      ]
    }
  }
}
```

**Save the cycleId and thrustAreaId for next steps**

---

## 2. Create/Get Goal Sheet

```bash
# Replace CYCLE_ID with actual ID from previous step
curl -X POST http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cycleId": "CYCLE_ID"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goalSheet": {
      "id": "...",
      "userId": "...",
      "cycleId": "...",
      "status": "DRAFT",
      "isLocked": false,
      "totalWeightage": 0,
      "goals": []
    }
  }
}
```

**Save the goalSheetId**

---

## 3. Add Goals to Sheet

### Goal 1: NUMERIC_MIN (Higher is better)

```bash
curl -X POST http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thrustAreaId": "THRUST_AREA_ID",
    "title": "Increase user engagement by 25%",
    "description": "Improve daily active users metric",
    "uomType": "NUMERIC_MIN",
    "target": 25,
    "weightage": 30
  }'
```

### Goal 2: NUMERIC_MAX (Lower is better)

```bash
curl -X POST http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thrustAreaId": "THRUST_AREA_ID",
    "title": "Reduce bug count to under 10",
    "description": "Minimize production bugs",
    "uomType": "NUMERIC_MAX",
    "target": 10,
    "weightage": 25
  }'
```

### Goal 3: TIMELINE (Date-based)

```bash
curl -X POST http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thrustAreaId": "THRUST_AREA_ID",
    "title": "Launch new feature by Q2",
    "description": "Complete feature development and deployment",
    "uomType": "TIMELINE",
    "target": 1,
    "targetDate": "2026-10-01T00:00:00.000Z",
    "weightage": 35
  }'
```

### Goal 4: ZERO (Zero = success)

```bash
curl -X POST http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thrustAreaId": "THRUST_AREA_ID",
    "title": "Zero security incidents",
    "description": "Maintain zero security breaches",
    "uomType": "ZERO",
    "target": 0,
    "weightage": 10
  }'
```

**Total weightage: 30 + 25 + 35 + 10 = 100%** ✅

---

## 4. Validate Weightage

```bash
curl -X POST http://localhost:3001/api/v1/goals/validate-weightage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goals": [
      {"weightage": 30},
      {"weightage": 25},
      {"weightage": 35},
      {"weightage": 10}
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "total": 100
  }
}
```

---

## 5. Get My Goal Sheets

```bash
curl -X GET http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Get Specific Goal Sheet

```bash
curl -X GET http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Update a Goal

```bash
curl -X PATCH http://localhost:3001/api/v1/goals/GOAL_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Increase user engagement by 30%",
    "target": 30
  }'
```

---

## 8. Submit Goal Sheet for Approval

```bash
curl -X PATCH http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "goalSheet": {
      "id": "...",
      "status": "SUBMITTED",
      "submittedAt": "2026-05-17T03:30:00.000Z",
      "totalWeightage": 100
    }
  }
}
```

---

## 9. Delete a Goal

```bash
curl -X DELETE http://localhost:3001/api/v1/goals/GOAL_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Cases to Test

### 1. Weightage Not 100%

```bash
curl -X POST http://localhost:3001/api/v1/goals/validate-weightage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goals": [
      {"weightage": 30},
      {"weightage": 25},
      {"weightage": 35}
    ]
  }'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "total": 90,
    "message": "Total weightage must be 100% (currently 90.00%)"
  }
}
```

### 2. More Than 8 Goals

```bash
curl -X POST http://localhost:3001/api/v1/goals/validate-weightage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goals": [
      {"weightage": 11}, {"weightage": 11}, {"weightage": 11},
      {"weightage": 11}, {"weightage": 11}, {"weightage": 11},
      {"weightage": 11}, {"weightage": 11}, {"weightage": 12}
    ]
  }'
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
        "field": "goals",
        "message": "Maximum 8 goals allowed"
      }
    ]
  }
}
```

### 3. Weightage Less Than 10%

```bash
curl -X POST http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thrustAreaId": "THRUST_AREA_ID",
    "title": "Test goal",
    "uomType": "NUMERIC_MIN",
    "target": 10,
    "weightage": 5
  }'
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
        "field": "weightage",
        "message": "Minimum weightage is 10%"
      }
    ]
  }
}
```

### 4. Submit Without 100% Weightage

```bash
# Add only 2 goals totaling 50%
# Then try to submit
curl -X PATCH http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "SUBMIT_ERROR",
    "message": "Total weightage must be 100% (currently 50.00%)"
  }
}
```

### 5. Modify Locked Goal Sheet

```bash
# After submission, try to add a goal
curl -X POST http://localhost:3001/api/v1/goal-sheets/GOAL_SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "thrustAreaId": "THRUST_AREA_ID",
    "title": "New goal",
    "uomType": "NUMERIC_MIN",
    "target": 10,
    "weightage": 10
  }'
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "code": "ADD_GOAL_ERROR",
    "message": "Can only add goals to draft or returned goal sheets"
  }
}
```

---

## Complete Test Flow

```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@company.com", "password": "password123"}' \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# 2. Get active cycle
CYCLE=$(curl -s -X GET http://localhost:3001/api/v1/cycles/active \
  -H "Authorization: Bearer $TOKEN")

CYCLE_ID=$(echo $CYCLE | jq -r '.data.cycle.id')
THRUST_AREA_ID=$(echo $CYCLE | jq -r '.data.cycle.thrustAreas[0].id')

echo "Cycle ID: $CYCLE_ID"
echo "Thrust Area ID: $THRUST_AREA_ID"

# 3. Create goal sheet
SHEET=$(curl -s -X POST http://localhost:3001/api/v1/goal-sheets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"cycleId\": \"$CYCLE_ID\"}")

SHEET_ID=$(echo $SHEET | jq -r '.data.goalSheet.id')
echo "Goal Sheet ID: $SHEET_ID"

# 4. Add goals (30% + 25% + 35% + 10% = 100%)
curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Goal 1\",
    \"uomType\": \"NUMERIC_MIN\",
    \"target\": 25,
    \"weightage\": 30
  }" | jq

curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Goal 2\",
    \"uomType\": \"NUMERIC_MAX\",
    \"target\": 10,
    \"weightage\": 25
  }" | jq

curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Goal 3\",
    \"uomType\": \"TIMELINE\",
    \"target\": 1,
    \"targetDate\": \"2026-10-01T00:00:00.000Z\",
    \"weightage\": 35
  }" | jq

curl -s -X POST http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"thrustAreaId\": \"$THRUST_AREA_ID\",
    \"title\": \"Goal 4\",
    \"uomType\": \"ZERO\",
    \"target\": 0,
    \"weightage\": 10
  }" | jq

# 5. Submit
curl -s -X PATCH http://localhost:3001/api/v1/goal-sheets/$SHEET_ID/submit \
  -H "Authorization: Bearer $TOKEN" | jq

echo "✅ Test complete!"
```

---

## Prisma Studio Verification

```bash
cd apps/api
npx prisma studio
```

Check:
- GoalSheet table: status should be "SUBMITTED", totalWeightage = 100
- Goal table: 4 goals with correct weightages
- All goals linked to the same goalSheetId
