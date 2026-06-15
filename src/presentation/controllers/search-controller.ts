import { Request, Response, NextFunction } from 'express';
import ProductModel from '../../infrastructure/models/product-model';
import KnowledgeBaseModel from '../../infrastructure/models/kb-model';

export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 5), 1), 20);

    if (!query) {
      res.status(200).json({
        status: 'success',
        data: { query, products: [], knowledge: [] },
      });
      return;
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [products, knowledge] = await Promise.all([
      ProductModel.find({
        $or: [{ name: regex }, { sku: regex }, { category: regex }, { description: regex }],
      })
        .select('sku name category description imageUrls manualUrl updatedAt')
        .limit(limit)
        .lean(),
      KnowledgeBaseModel.find({
        $or: [{ title: regex }, { content: regex }, { tags: regex }],
      })
        .select('title tags fileUrl productId updatedAt')
        .populate('productId', 'sku name')
        .limit(limit)
        .lean(),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        query,
        products,
        knowledge,
      },
    });
  } catch (error) {
    next(error);
  }
};
