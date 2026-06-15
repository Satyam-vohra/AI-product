import { Request, Response, NextFunction } from 'express';
import AnalyticsEventModel from '../../infrastructure/models/analytics-event-model';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';

export const trackAnalyticsEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, path, sessionId, properties = {} } = req.body;

    const event = await AnalyticsEventModel.create({
      name,
      path,
      sessionId,
      properties,
      userId: authReq.user?.userId,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    res.status(202).json({
      status: 'success',
      data: { eventId: event._id },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = Math.min(Math.max(Number(req.query.days || 14), 1), 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalEvents, eventsByName, pageViewsByPath, dailyActivity] = await Promise.all([
      AnalyticsEventModel.countDocuments({ createdAt: { $gte: since } }),
      AnalyticsEventModel.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      AnalyticsEventModel.aggregate([
        { $match: { createdAt: { $gte: since }, name: 'page_view', path: { $exists: true } } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      AnalyticsEventModel.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        windowDays: days,
        totalEvents,
        eventsByName,
        pageViewsByPath,
        dailyActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
