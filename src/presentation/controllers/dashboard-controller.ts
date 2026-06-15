import { Request, Response, NextFunction } from 'express';
import UserModel from '../../infrastructure/models/user-model';
import CompanyModel from '../../infrastructure/models/company-model';
import ProductModel from '../../infrastructure/models/product-model';
import DiagnosticSessionModel from '../../infrastructure/models/session-model';
import KnowledgeBaseModel from '../../infrastructure/models/kb-model';
import ReviewModel from '../../infrastructure/models/review-model';
import { ForbiddenError } from '../../core/errors/app-error';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';
import { UserRole, ResolutionStatus } from '../../core/constants/roles';

export const getAdminDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only Administrators can access global platform analytics');
    }

    const [
      totalUsers,
      totalCompanies,
      totalProducts,
      totalKBEntries,
      roleDistribution,
      sessionStatusCounts,
    ] = await Promise.all([
      UserModel.countDocuments(),
      CompanyModel.countDocuments(),
      ProductModel.countDocuments(),
      KnowledgeBaseModel.countDocuments(),
      UserModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      DiagnosticSessionModel.aggregate([
        { $group: { _id: '$resolutionStatus', count: { $sum: 1 } } }
      ]),
    ]);

    const formattedRoles = roleDistribution.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const formattedSessions = sessionStatusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate resolution rate
    const totalSessions = await DiagnosticSessionModel.countDocuments();
    const resolvedSessions = formattedSessions[ResolutionStatus.RESOLVED] || 0;
    const resolutionRate = totalSessions > 0 ? parseFloat(((resolvedSessions / totalSessions) * 100).toFixed(1)) : 100;

    res.status(200).json({
      status: 'success',
      data: {
        counters: {
          users: totalUsers,
          companies: totalCompanies,
          products: totalProducts,
          knowledgeDocuments: totalKBEntries,
          diagnosticSessions: totalSessions,
        },
        distributions: {
          roles: formattedRoles,
          sessionStatus: formattedSessions,
        },
        metrics: {
          resolutionRatePercent: resolutionRate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    if (!companyId && authReq.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only Company managers can access tenant analytics');
    }

    const targetCompanyId = companyId || req.query.companyId; // Admin can specify in query

    // Find company products
    const products = await ProductModel.find({ companyId: targetCompanyId });
    const productIds = products.map((p) => p._id);

    const [
      totalProducts,
      technicianCount,
      sessions,
      averageRatingStats,
    ] = await Promise.all([
      ProductModel.countDocuments({ companyId: targetCompanyId }),
      UserModel.countDocuments({ companyId: targetCompanyId, role: UserRole.SERVICE_ENGINEER }),
      DiagnosticSessionModel.aggregate([
        { $match: { productId: { $in: productIds } } },
        { $group: { _id: '$resolutionStatus', count: { $sum: 1 } } }
      ]),
      ReviewModel.aggregate([
        { $match: { productId: { $in: productIds } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
      ]),
    ]);

    const formattedSessions = sessions.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const ratingStats = averageRatingStats[0] || { avgRating: 0, totalReviews: 0 };

    res.status(200).json({
      status: 'success',
      data: {
        productsCount: totalProducts,
        engineersCount: technicianCount,
        reviewsCount: ratingStats.totalReviews,
        averageRating: parseFloat(ratingStats.avgRating.toFixed(1)),
        sessionsStatusDistribution: formattedSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    const [
      totalSessions,
      resolvedSessions,
      totalReviews,
      recentSessions,
    ] = await Promise.all([
      DiagnosticSessionModel.countDocuments({ userId }),
      DiagnosticSessionModel.countDocuments({ userId, resolutionStatus: ResolutionStatus.RESOLVED }),
      ReviewModel.countDocuments({ userId }),
      DiagnosticSessionModel.find({ userId })
        .populate('productId', 'name category')
        .sort({ updatedAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          totalDiagnosticSessions: totalSessions,
          resolvedSessions,
          openSessions: totalSessions - resolvedSessions,
          reviewsWritten: totalReviews,
        },
        recentDiagnosticSessions: recentSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};
