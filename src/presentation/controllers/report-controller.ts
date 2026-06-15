import { Request, Response, NextFunction } from 'express';
import DiagnosticSessionModel from '../../infrastructure/models/session-model';
import ProductModel from '../../infrastructure/models/product-model';
import { ForbiddenError } from '../../core/errors/app-error';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

export const exportDiagnosticReportCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { companyId, role } = authReq.user!;

    if (!companyId && role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only Company administrators can download technical reports');
    }

    const targetCompanyId = companyId || req.query.companyId;

    // Retrieve company products
    const products = await ProductModel.find({ companyId: targetCompanyId });
    const productIds = products.map((p) => p._id);

    const sessions = await DiagnosticSessionModel.find({ productId: { $in: productIds } })
      .populate('productId', 'sku name')
      .populate('userId', 'name email')
      .populate('assignedEngineerId', 'name');

    // Generate CSV contents
    let csvContent = 'Session ID,Product SKU,Product Name,User Name,User Email,Status,Assigned Technician,Messages Count,Created Date\n';

    for (const session of sessions) {
      const prod = session.productId as any;
      const usr = session.userId as any;
      const eng = session.assignedEngineerId as any;

      const row = [
        session._id,
        prod ? prod.sku : 'N/A',
        prod ? `"${prod.name.replace(/"/g, '""')}"` : 'N/A',
        usr ? `"${usr.name.replace(/"/g, '""')}"` : 'N/A',
        usr ? usr.email : 'N/A',
        session.resolutionStatus,
        eng ? `"${eng.name.replace(/"/g, '""')}"` : 'Unassigned',
        session.chatHistory.length,
        session.createdAt.toISOString(),
      ].join(',');

      csvContent += row + '\n';
    }

    // Set download headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=mantis_diagnostic_report_${targetCompanyId}.csv`);
    
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
