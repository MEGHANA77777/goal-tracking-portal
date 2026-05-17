import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import logger from '../../lib/logger';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error: any) {
      logger.error({ error }, 'Login error');
      res.status(401).json({
        success: false,
        error: { code: 'LOGIN_FAILED', message: error.message },
      });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token not found' },
        });
      }

      const result = await authService.refresh(refreshToken);

      res.json({
        success: true,
        data: { accessToken: result.accessToken },
      });
    } catch (error: any) {
      logger.error({ error }, 'Refresh error');
      res.status(401).json({
        success: false,
        error: { code: 'REFRESH_FAILED', message: error.message },
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken');

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error: any) {
      logger.error({ error }, 'Logout error');
      res.status(500).json({
        success: false,
        error: { code: 'LOGOUT_FAILED', message: error.message },
      });
    }
  }

  async getMe(req: AuthRequest, res: Response) {
    try {
      const user = await authService.getMe(req.user!.userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get me error');
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: error.message },
      });
    }
  }
}
