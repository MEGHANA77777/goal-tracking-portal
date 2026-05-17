import { Response } from 'express';
import { ReportsService } from './reports.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import logger from '../../lib/logger';
import ExcelJS from 'exceljs';

const reportsService = new ReportsService();

export class ReportsController {
  async getAchievementReport(req: AuthRequest, res: Response) {
    try {
      const { cycleId, departmentId, format = 'json' } = req.query;

      const report = await reportsService.getAchievementReport({
        cycleId: cycleId as string,
        departmentId: departmentId as string,
        format: format as 'json' | 'csv' | 'excel',
      });

      if (format === 'json') {
        return res.json({
          success: true,
          data: { report },
        });
      }

      if (format === 'csv') {
        return this.exportCSV(report, res);
      }

      if (format === 'excel') {
        return this.exportExcel(report, res);
      }
    } catch (error: any) {
      logger.error({ error }, 'Get achievement report error');
      res.status(400).json({
        success: false,
        error: { code: 'REPORT_ERROR', message: error.message },
      });
    }
  }

  private exportCSV(report: any[], res: Response) {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Email',
      'Department',
      'Manager',
      'Cycle',
      'Goal Sheet Status',
      'Total Weightage',
      'Weighted Score',
      'Goal Title',
      'Thrust Area',
      'UoM Type',
      'Target',
      'Target Date',
      'Goal Weightage',
      'Actual Value',
      'Actual Date',
      'Status',
      'Progress Score',
      'Quarter',
    ];

    const rows = report.flatMap((employee) =>
      employee.goals.map((goal: any) => [
        employee.employeeCode,
        employee.employeeName,
        employee.email,
        employee.department,
        employee.manager,
        employee.cycle,
        employee.goalSheetStatus,
        employee.totalWeightage,
        employee.weightedScore,
        goal.title,
        goal.thrustArea,
        goal.uomType,
        goal.target,
        goal.targetDate || '',
        goal.weightage,
        goal.actualValue || '',
        goal.actualDate || '',
        goal.status,
        goal.progressScore,
        goal.quarter,
      ])
    );

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="achievement-report-${Date.now()}.csv"`);
    res.send(csv);
  }

  private async exportExcel(report: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Achievement Report');

    // Define columns
    worksheet.columns = [
      { header: 'Employee Code', key: 'employeeCode', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Manager', key: 'manager', width: 20 },
      { header: 'Cycle', key: 'cycle', width: 15 },
      { header: 'Goal Sheet Status', key: 'goalSheetStatus', width: 15 },
      { header: 'Total Weightage', key: 'totalWeightage', width: 15 },
      { header: 'Weighted Score', key: 'weightedScore', width: 15 },
      { header: 'Goal Title', key: 'goalTitle', width: 30 },
      { header: 'Thrust Area', key: 'thrustArea', width: 20 },
      { header: 'UoM Type', key: 'uomType', width: 15 },
      { header: 'Target', key: 'target', width: 10 },
      { header: 'Target Date', key: 'targetDate', width: 15 },
      { header: 'Goal Weightage', key: 'goalWeightage', width: 15 },
      { header: 'Actual Value', key: 'actualValue', width: 15 },
      { header: 'Actual Date', key: 'actualDate', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Progress Score', key: 'progressScore', width: 15 },
      { header: 'Quarter', key: 'quarter', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    report.forEach((employee) => {
      employee.goals.forEach((goal: any) => {
        worksheet.addRow({
          employeeCode: employee.employeeCode,
          employeeName: employee.employeeName,
          email: employee.email,
          department: employee.department,
          manager: employee.manager,
          cycle: employee.cycle,
          goalSheetStatus: employee.goalSheetStatus,
          totalWeightage: employee.totalWeightage,
          weightedScore: employee.weightedScore,
          goalTitle: goal.title,
          thrustArea: goal.thrustArea,
          uomType: goal.uomType,
          target: goal.target,
          targetDate: goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '',
          goalWeightage: goal.weightage,
          actualValue: goal.actualValue || '',
          actualDate: goal.actualDate ? new Date(goal.actualDate).toLocaleDateString() : '',
          status: goal.status,
          progressScore: goal.progressScore,
          quarter: goal.quarter,
        });
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="achievement-report-${Date.now()}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  }

  async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const query = {
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        action: req.query.action as any,
        changedById: req.query.changedById as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await reportsService.getAuditLogs(query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ error }, 'Get audit logs error');
      res.status(400).json({
        success: false,
        error: { code: 'AUDIT_LOG_ERROR', message: error.message },
      });
    }
  }

  async getGoalProgressAnalytics(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.query;
      const analytics = await reportsService.getGoalProgressAnalytics(cycleId as string);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      logger.error({ error }, 'Get analytics error');
      res.status(400).json({
        success: false,
        error: { code: 'ANALYTICS_ERROR', message: error.message },
      });
    }
  }

  async getUserActivity(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const activities = await reportsService.getUserActivity(userId, limit);

      res.json({
        success: true,
        data: { activities },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get user activity error');
      res.status(400).json({
        success: false,
        error: { code: 'ACTIVITY_ERROR', message: error.message },
      });
    }
  }
}
