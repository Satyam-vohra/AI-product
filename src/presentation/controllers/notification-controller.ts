import { Request, Response, NextFunction } from 'express';
import DiagnosticSessionModel from '../../infrastructure/models/session-model';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';
import { cache } from '../../config/redis';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId, role } = authReq.user!;

    // Compile dynamic notifications based on active diagnostic sessions
    const activeSessions = await DiagnosticSessionModel.find({ userId })
      .populate('productId', 'name')
      .populate('assignedEngineerId', 'name')
      .sort({ updatedAt: -1 })
      .limit(10);

    const notifications = await Promise.all(activeSessions.map(async (session, idx) => {
      const prod = session.productId as any;
      const eng = session.assignedEngineerId as any;

      if (session.assignedEngineerId && idx === 0) {
        const id = `notif_${session._id}_eng`;
        const read = await cache.get(`notification_ack:${userId}:${id}`);
        return {
          id,
          title: 'Technician Assigned',
          message: `Service Engineer ${eng.name} has been assigned to help diagnose your ${prod ? prod.name : 'Device'}.`,
          read: Boolean(read),
          createdAt: session.updatedAt,
          type: 'ASSIGNMENT',
          link: `/dashboard/session?sessionId=${session._id}`,
        };
      }

      const id = `notif_${session._id}_status`;
      const read = await cache.get(`notification_ack:${userId}:${id}`);
      return {
        id,
        title: 'Diagnostic Ticket Update',
        message: `Your session for ${prod ? prod.name : 'Device'} is currently marked: ${session.resolutionStatus}.`,
        read: Boolean(read),
        createdAt: session.updatedAt,
        type: 'STATUS_UPDATE',
        link: `/dashboard/session?sessionId=${session._id}`,
      };
    }));

    res.status(200).json({
      status: 'success',
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { userId } = authReq.user!;
    const { id } = req.params;

    await cache.set(`notification_ack:${userId}:${id}`, '1', 30 * 24 * 60 * 60);

    res.status(200).json({
      status: 'success',
      data: { id, read: true },
    });
  } catch (error) {
    next(error);
  }
};
