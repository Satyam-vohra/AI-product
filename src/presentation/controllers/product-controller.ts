import { Request, Response, NextFunction } from 'express';
import ProductModel from '../../infrastructure/models/product-model';
import ReviewModel from '../../infrastructure/models/review-model';
import { uploadToCloudinary } from '../../core/utils/uploader';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../core/errors/app-error';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    if (!companyId && authReq.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only company representatives or administrators can create products');
    }

    const { sku, name, category, description, specifications } = req.body;

    // Check SKU duplicates
    const duplicate = await ProductModel.findOne({ sku });
    if (duplicate) {
      throw new BadRequestError(`Product with SKU ${sku} already exists`);
    }

    let manualUrl = undefined;
    const imageUrls: string[] = [];

    // Extract files uploaded via Multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    if (files) {
      if (files['manual'] && files['manual'][0]) {
        const manualFile = files['manual'][0];
        const uploadRes = await uploadToCloudinary(manualFile.buffer, 'manuals', manualFile.originalname);
        manualUrl = uploadRes.url;
      }
      if (files['images']) {
        for (const imgFile of files['images']) {
          const uploadRes = await uploadToCloudinary(imgFile.buffer, 'products', imgFile.originalname);
          imageUrls.push(uploadRes.url);
        }
      }
    }

    // Parse specifications if stringified JSON
    let parsedSpecs = specifications;
    if (typeof specifications === 'string') {
      try {
        parsedSpecs = JSON.parse(specifications);
      } catch {
        parsedSpecs = {};
      }
    }

    const product = await ProductModel.create({
      sku,
      name,
      category,
      companyId: companyId || req.body.companyId, // Admin can explicitly set companyId
      description,
      manualUrl,
      imageUrls,
      specifications: parsedSpecs,
    });

    res.status(201).json({
      status: 'success',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    const query: any = {};

    if (category) {
      query.category = String(category);
    }

    if (search) {
      // Use Mongo Text search index
      query.$text = { $search: String(search) };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skipNum = (pageNum - 1) * limitNum;

    const products = await ProductModel.find(query)
      .populate('companyId', 'name domain')
      .skip(skipNum)
      .limit(limitNum);

    const total = await ProductModel.countDocuments(query);

    res.status(200).json({
      status: 'success',
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id).populate('companyId', 'name domain');

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Get average review rating
    const reviewStats = await ReviewModel.aggregate([
      { $match: { productId: product._id } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);

    const stats = reviewStats[0] || { avgRating: 0, totalReviews: 0 };

    res.status(200).json({
      status: 'success',
      data: {
        product,
        ratingAverage: parseFloat(stats.avgRating.toFixed(1)),
        reviewCount: stats.totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify ownership
    if (authReq.user?.role !== UserRole.ADMIN && product.companyId.toString() !== companyId) {
      throw new ForbiddenError('You are not authorized to update this product');
    }

    const { name, category, description, specifications } = req.body;

    if (name) product.name = name;
    if (category) product.category = category;
    if (description) product.description = description;

    if (specifications) {
      let parsedSpecs = specifications;
      if (typeof specifications === 'string') {
        try {
          parsedSpecs = JSON.parse(specifications);
        } catch {
          parsedSpecs = {};
        }
      }
      product.specifications = parsedSpecs;
    }

    // File updates
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files['manual'] && files['manual'][0]) {
        const manualFile = files['manual'][0];
        const uploadRes = await uploadToCloudinary(manualFile.buffer, 'manuals', manualFile.originalname);
        product.manualUrl = uploadRes.url;
      }
      if (files['images']) {
        const imageUrls: string[] = [];
        for (const imgFile of files['images']) {
          const uploadRes = await uploadToCloudinary(imgFile.buffer, 'products', imgFile.originalname);
          imageUrls.push(uploadRes.url);
        }
        product.imageUrls = [...product.imageUrls, ...imageUrls];
      }
    }

    await product.save();

    res.status(200).json({
      status: 'success',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    const product = await ProductModel.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Verify ownership
    if (authReq.user?.role !== UserRole.ADMIN && product.companyId.toString() !== companyId) {
      throw new ForbiddenError('You are not authorized to delete this product');
    }

    await ProductModel.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Review handlers
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: productId } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    const { rating, comment } = req.body;

    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check duplicate reviews
    const existingReview = await ReviewModel.findOne({ userId, productId });
    if (existingReview) {
      throw new BadRequestError('You have already reviewed this product');
    }

    const review = await ReviewModel.create({
      userId,
      productId,
      rating,
      comment,
    });

    res.status(201).json({
      status: 'success',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: productId } = req.params;
    const reviews = await ReviewModel.find({ productId }).populate('userId', 'name email');

    res.status(200).json({
      status: 'success',
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};
