import prisma from '../../lib/prisma';

export class CyclesService {
  async getActiveCycle() {
    const cycle = await prisma.cycle.findFirst({
      where: { isActive: true },
      include: {
        thrustAreas: { where: { isActive: true }, orderBy: { name: 'asc' } },
      },
    });

    if (!cycle) {
      throw new Error('No active cycle found');
    }

    return cycle;
  }

  async getAllCycles() {
    return prisma.cycle.findMany({
      include: {
        thrustAreas: { where: { isActive: true } },
      },
      orderBy: { year: 'desc' },
    });
  }

  async getThrustAreas(cycleId: string) {
    return prisma.thrustArea.findMany({
      where: { cycleId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
