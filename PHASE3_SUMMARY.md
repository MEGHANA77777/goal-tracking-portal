# Phase 3 Implementation Summary

## ✅ Feature: Manager Workflow & Approval System
**Objective**: Enable managers to review, edit, approve, or return goal sheets with complete audit trail

---

## 📁 Files Created

### Manager Module (`apps/api/src/modules/manager/`)
- `manager.schema.ts` - Validation schemas for approval operations
- `manager.service.ts` - Business logic (approve, return, inline edit, unlock)
- `manager.controller.ts` - Request handlers
- `manager.routes.ts` - Route definitions with RBAC

### Documentation
- `PHASE3_TESTING.md` - Comprehensive testing guide

---

## 📝 Files Updated

- `apps/api/src/app.ts` - Registered manager routes

---

## 🎯 Key Features Implemented

### 1. Manager Dashboard Data
- ✅ Get team members (direct reports)
- ✅ Get pending approvals count and list
- ✅ Get all team goal sheets with filters

### 2. Inline Editing by Manager
- ✅ Edit goal target (numeric or date)
- ✅ Edit goal weightage
- ✅ Cannot edit title (locked by design)
- ✅ Only works on SUBMITTED sheets
- ✅ Auto-recalculates total weightage
- ✅ Creates audit log for every change

### 3. Approval Workflow
- ✅ Approve goal sheet
  - Validates total weightage = 100%
  - Sets status to APPROVED
  - Locks the goal sheet (isLocked = true)
  - Records approver and timestamp
  - Creates audit log
  - Sends notification to employee

### 4. Return Workflow
- ✅ Return goal sheet with reason
  - Sets status to RETURNED
  - Employee can edit and resubmit
  - Stores return reason
  - Creates audit log
  - Sends notification to employee

### 5. Admin Unlock Feature
- ✅ Admin can unlock locked goal sheets
  - Requires reason (audit trail)
  - Sets status back to DRAFT
  - Unlocks for editing
  - Creates audit log
  - Sends notification to employee

### 6. Access Control
- ✅ Managers can only access their direct reports
- ✅ Admins can access all goal sheets
- ✅ Employees cannot access manager routes
- ✅ Row-level security enforced

### 7. Audit Trail
- ✅ Every approval logged
- ✅ Every rejection logged
- ✅ Every inline edit logged
- ✅ Every unlock logged
- ✅ Captures: who, what, when, why, IP, user agent

---

## 🔐 Important Logic

### Manager Access Control

```typescript
// Verify manager has access to employee's goal sheet
const goalSheet = await prisma.goalSheet.findUnique({
  where: { id },
  include: { user: { select: { managerId: true } } }
});

if (goalSheet.user.managerId !== managerId) {
  throw new Error('Access denied: Not your direct report');
}
```

### Approval with Validation

```typescript
// Validate weightage before approval
const total = goalSheet.goals.reduce((sum, g) => sum + g.weightage, 0);
if (Math.abs(total - 100) > 0.01) {
  throw new Error(`Cannot approve: Total weightage is ${total}%, must be 100%`);
}

// Approve and lock in single transaction
await prisma.goalSheet.update({
  where: { id },
  data: {
    status: 'APPROVED',
    approvedAt: new Date(),
    approvedById: managerId,
    isLocked: true,
    lockedAt: new Date(),
  }
});
```

### Audit Log Creation

```typescript
await prisma.auditLog.create({
  data: {
    entityType: 'GoalSheet',
    entityId: goalSheetId,
    action: 'APPROVE',
    changedById: managerId,
    previousValue: { status: 'SUBMITTED' },
    newValue: { status: 'APPROVED', isLocked: true },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  }
});
```

### Notification Creation

```typescript
await prisma.notification.create({
  data: {
    userId: employeeId,
    title: 'Goal Sheet Approved',
    body: 'Your goal sheet has been approved by your manager',
    type: 'GOAL_APPROVED',
    linkUrl: `/goals/${goalSheetId}`,
  }
});
```

---

## 📡 API Endpoints Added

### Manager Routes (Require MANAGER or ADMIN role)
- `GET /api/v1/manager/team` - Get direct reports
- `GET /api/v1/manager/approvals/pending` - Get pending approvals
- `GET /api/v1/manager/team/goal-sheets` - Get all team goal sheets
- `PATCH /api/v1/manager/goals/:goalId` - Inline edit goal (target/weightage only)
- `POST /api/v1/manager/approvals/approve` - Approve goal sheet
- `POST /api/v1/manager/approvals/return` - Return goal sheet with reason

### Admin Routes (Require ADMIN role)
- `POST /api/v1/manager/goal-sheets/unlock` - Unlock locked goal sheet

---

## 🔄 Status Workflow

```
DRAFT → SUBMITTED → APPROVED (locked)
           ↓
        RETURNED → SUBMITTED (resubmit)
           
APPROVED → DRAFT (admin unlock only)
```

---

## 🧪 Testing Checklist

- [ ] Manager can see list of direct reports
- [ ] Manager sees pending approvals count
- [ ] Manager can view team goal sheets
- [ ] Manager can inline edit goal target
- [ ] Manager can inline edit goal weightage
- [ ] Total weightage recalculates after edit
- [ ] Manager cannot edit goal title
- [ ] Manager cannot edit goals in DRAFT status
- [ ] Manager cannot edit goals in APPROVED status
- [ ] Manager can approve goal sheet with 100% weightage
- [ ] Cannot approve if weightage ≠ 100%
- [ ] Approval locks the goal sheet
- [ ] Approval creates audit log
- [ ] Approval sends notification to employee
- [ ] Manager can return goal sheet with reason
- [ ] Return reason must be at least 10 characters
- [ ] Return sets status to RETURNED
- [ ] Return creates audit log
- [ ] Return sends notification to employee
- [ ] Employee can edit returned goal sheet
- [ ] Admin can unlock locked goal sheet
- [ ] Unlock requires reason
- [ ] Unlock creates audit log
- [ ] Unlock sends notification to employee
- [ ] Manager cannot access other manager's team
- [ ] Employee cannot access manager routes

---

## 🎨 Frontend Integration Points

### Manager Dashboard
```typescript
// 1. Get pending approvals count for badge
GET /api/v1/manager/approvals/pending
// Response: { count: 5, goalSheets: [...] }

// 2. Display pending approval cards
goalSheets.map(sheet => (
  <ApprovalCard
    employee={sheet.user.name}
    submittedAt={sheet.submittedAt}
    totalWeightage={sheet.totalWeightage}
    goalsCount={sheet.goals.length}
  />
))
```

### Inline Edit Component
```typescript
const InlineEditGoal = ({ goal, onSave }) => {
  const [target, setTarget] = useState(goal.target);
  const [weightage, setWeightage] = useState(goal.weightage);
  
  const handleSave = async () => {
    await fetch(`/api/v1/manager/goals/${goal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ target, weightage })
    });
    onSave();
  };
  
  return (
    <div>
      <input value={target} onChange={e => setTarget(e.target.value)} />
      <input value={weightage} onChange={e => setWeightage(e.target.value)} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

### Approval Actions
```typescript
const ApprovalActions = ({ goalSheetId }) => {
  const handleApprove = async () => {
    await fetch('/api/v1/manager/approvals/approve', {
      method: 'POST',
      body: JSON.stringify({ goalSheetId })
    });
  };
  
  const handleReturn = async (reason) => {
    await fetch('/api/v1/manager/approvals/return', {
      method: 'POST',
      body: JSON.stringify({ goalSheetId, reason })
    });
  };
  
  return (
    <>
      <button onClick={handleApprove}>Approve</button>
      <button onClick={() => handleReturn(reason)}>Return</button>
    </>
  );
};
```

---

## 📝 Git Workflow

### Branch Name
```
feature/phase3-manager-workflow
```

### Commit Message
```
feat: implement phase 3 manager workflow with approval system

- Create manager module with approval operations
- Implement inline editing for managers (target/weightage only)
- Add approve goal sheet with validation and locking
- Add return goal sheet with reason
- Implement admin unlock functionality
- Create comprehensive audit logging for all actions
- Add notification system for approval/return/unlock
- Enforce manager access control (direct reports only)
- Add RBAC middleware to manager routes
- Auto-recalculate weightage on inline edits

API Endpoints:
- GET /api/v1/manager/team
- GET /api/v1/manager/approvals/pending
- GET /api/v1/manager/team/goal-sheets
- PATCH /api/v1/manager/goals/:id
- POST /api/v1/manager/approvals/approve
- POST /api/v1/manager/approvals/return
- POST /api/v1/manager/goal-sheets/unlock (admin only)

Audit Actions: APPROVE, REJECT, UPDATE, UNLOCK
Notifications: GOAL_APPROVED, GOAL_RETURNED, GOAL_UNLOCKED
```

---

## 🚀 Next Steps: Phase 4 - Check-in System

### Upcoming Features
1. Quarterly check-in windows
2. Achievement tracking per goal
3. Progress score calculation (all 4 UoM types)
4. Manager review of check-ins
5. Manager comments on achievements
6. Check-in status workflow

### Files to Create
- `apps/api/src/modules/checkins/` - Check-in module
- `apps/api/src/lib/score-calculator.ts` - UoM score computation
- Check-in window management
- Achievement CRUD operations

---

## 💡 Key Achievements

✅ **Complete approval workflow** - Approve, return, unlock with full audit trail  
✅ **Inline editing** - Managers can adjust targets/weightage before approval  
✅ **Access control** - Strict manager-employee relationship enforcement  
✅ **Audit logging** - Every action tracked with who/what/when/why  
✅ **Notifications** - Real-time alerts to employees on status changes  
✅ **Lock mechanism** - Approved goals cannot be modified (except by admin unlock)  
✅ **Validation** - Cannot approve without 100% weightage  

---

**Phase 3 Status**: ✅ COMPLETE  
**Ready for**: Phase 4 - Check-in System  
**Estimated Phase 4 Time**: 3-4 hours
