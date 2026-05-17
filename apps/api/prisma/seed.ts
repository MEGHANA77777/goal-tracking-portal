import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.achievement.deleteMany();
  await prisma.checkinComment.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.checkinWindow.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.thrustArea.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create Departments
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering',
      code: 'ENG',
    },
  });

  const sales = await prisma.department.create({
    data: {
      name: 'Sales',
      code: 'SALES',
    },
  });

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'Admin User',
      employeeCode: 'EMP001',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      departmentId: engineering.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@company.com',
      name: 'John Manager',
      employeeCode: 'EMP002',
      passwordHash: hashedPassword,
      role: Role.MANAGER,
      departmentId: engineering.id,
    },
  });

  // Update department with manager
  await prisma.department.update({
    where: { id: engineering.id },
    data: { managerId: manager.id },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'employee@company.com',
      name: 'Jane Employee',
      employeeCode: 'EMP003',
      passwordHash: hashedPassword,
      role: Role.EMPLOYEE,
      departmentId: engineering.id,
      managerId: manager.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@company.com',
      name: 'Bob Developer',
      employeeCode: 'EMP004',
      passwordHash: hashedPassword,
      role: Role.EMPLOYEE,
      departmentId: engineering.id,
      managerId: manager.id,
    },
  });

  console.log('✅ Users created');

  // Create Cycle
  const currentYear = new Date().getFullYear();
  const cycle = await prisma.cycle.create({
    data: {
      name: `FY ${currentYear}-${currentYear + 1}`,
      year: currentYear,
      goalSettingOpen: new Date(`${currentYear}-04-01`),
      goalSettingClose: new Date(`${currentYear}-06-30`),
      isActive: true,
    },
  });

  console.log('✅ Cycle created');

  // Create Thrust Areas
  const thrustAreas = await Promise.all([
    prisma.thrustArea.create({
      data: {
        name: 'Product Development',
        description: 'Building and enhancing product features',
        cycleId: cycle.id,
      },
    }),
    prisma.thrustArea.create({
      data: {
        name: 'Customer Success',
        description: 'Improving customer satisfaction and retention',
        cycleId: cycle.id,
      },
    }),
    prisma.thrustArea.create({
      data: {
        name: 'Operational Excellence',
        description: 'Improving processes and efficiency',
        cycleId: cycle.id,
      },
    }),
    prisma.thrustArea.create({
      data: {
        name: 'Team Development',
        description: 'Building team capabilities and culture',
        cycleId: cycle.id,
      },
    }),
  ]);

  console.log('✅ Thrust Areas created');

  // Create Check-in Windows
  await Promise.all([
    prisma.checkinWindow.create({
      data: {
        cycleId: cycle.id,
        quarter: 1,
        label: 'Q1 Check-in',
        opensAt: new Date(`${currentYear}-07-01`),
        closesAt: new Date(`${currentYear}-07-15`),
        isActive: true,
      },
    }),
    prisma.checkinWindow.create({
      data: {
        cycleId: cycle.id,
        quarter: 2,
        label: 'Q2 Check-in',
        opensAt: new Date(`${currentYear}-10-01`),
        closesAt: new Date(`${currentYear}-10-15`),
        isActive: false,
      },
    }),
    prisma.checkinWindow.create({
      data: {
        cycleId: cycle.id,
        quarter: 3,
        label: 'Q3 Check-in',
        opensAt: new Date(`${currentYear + 1}-01-01`),
        closesAt: new Date(`${currentYear + 1}-01-15`),
        isActive: false,
      },
    }),
    prisma.checkinWindow.create({
      data: {
        cycleId: cycle.id,
        quarter: 4,
        label: 'Q4 Check-in',
        opensAt: new Date(`${currentYear + 1}-03-01`),
        closesAt: new Date(`${currentYear + 1}-03-15`),
        isActive: false,
      },
    }),
  ]);

  console.log('✅ Check-in Windows created');

  console.log('\n📋 Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:    admin@company.com / password123');
  console.log('Manager:  manager@company.com / password123');
  console.log('Employee: employee@company.com / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
