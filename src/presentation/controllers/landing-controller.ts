import { Request, Response, NextFunction } from 'express';
import ProductModel from '../../infrastructure/models/product-model';
import KnowledgeBaseModel from '../../infrastructure/models/kb-model';
import CompanyModel from '../../infrastructure/models/company-model';

export const getLandingData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [productCount, kbCount, companyCount] = await Promise.all([
      ProductModel.countDocuments(),
      KnowledgeBaseModel.countDocuments(),
      CompanyModel.countDocuments(),
    ]);

    // Retrieve a few popular tags
    const popularTags = await KnowledgeBaseModel.distinct('tags');

    res.status(200).json({
      status: 'success',
      data: {
        platformName: 'Mantis AI',
        tagline: 'Intelligent Product Support & Diagnostic Platform',
        stats: {
          companiesActive: companyCount,
          productsMonitored: productCount,
          troubleshootingGuides: kbCount,
        },
        features: [
          {
            title: 'Automated AI Diagnostics',
            description: 'Instantly resolve device anomalies via cognitive retrieval loops over engineering manuals.',
          },
          {
            title: 'RAG Knowledge Repositories',
            description: 'Centralized manual ingestion supporting structured plain text indexing and instant document search.',
          },
          {
            title: 'Technician Escalation Engine',
            description: 'Seamlessly shift complex diagnostic chats to live company Service Engineers under strict RBAC.',
          },
        ],
        popularTags: popularTags.slice(0, 8),
      },
    });
  } catch (error) {
    next(error);
  }
};
