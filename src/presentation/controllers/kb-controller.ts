import { Request, Response, NextFunction } from 'express';
import KnowledgeBaseModel from '../../infrastructure/models/kb-model';
import EmbeddingsService from '../../application/services/embeddings-service';
import VectorDB from '../../application/services/vector-db-service';
import ProductModel from '../../infrastructure/models/product-model';
import { uploadToCloudinary } from '../../core/utils/uploader';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../core/errors/app-error';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';
import { UserRole } from '../../core/constants/roles';

export const createKBEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    if (!companyId && authReq.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only company representatives or administrators can create knowledge base documents');
    }

    const { title, content, tags, productId } = req.body;

    let fileUrl = undefined;
    let extractedContent = content;

    // Check if file is uploaded
    if (req.file) {
      const uploadRes = await uploadToCloudinary(req.file.buffer, 'kb-documents', req.file.originalname);
      fileUrl = uploadRes.url;

      // Automatically ingest text content from plain text file uploads if content body is blank
      if (req.file.mimetype === 'text/plain' && !extractedContent) {
        extractedContent = req.file.buffer.toString('utf-8');
      }
    }

    if (!extractedContent && !fileUrl) {
      throw new BadRequestError('Either content text or an uploaded document must be provided');
    }

    // Default placeholder if file is document pdf but no manual content
    if (!extractedContent) {
      extractedContent = `Technical Document attachment index at ${fileUrl}`;
    }

    // Parse tags if stringified array
    let parsedTags = tags;
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map((t) => t.trim());
      }
    }

    // Verify Product belongs to the company if linked
    if (productId) {
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new NotFoundError('Linked product not found');
      }
      if (authReq.user?.role !== UserRole.ADMIN && product.companyId.toString() !== companyId) {
        throw new ForbiddenError('Linked product must belong to your company');
      }
    }

    const kbEntry = await KnowledgeBaseModel.create({
      title,
      content: extractedContent,
      tags: parsedTags || [],
      productId: productId || undefined,
      companyId: companyId || req.body.companyId, // Admin override
      fileUrl,
    });

    // Compute embeddings asynchronously and upsert to vector index
    try {
      const v = EmbeddingsService.embedText(kbEntry.content || kbEntry.title || '');
      await VectorDB.upsertRecord(String(kbEntry._id), kbEntry.title, v, { productId: kbEntry.productId, fileUrl: fileUrl });
    } catch (err) {
      // non-fatal
    }

    res.status(201).json({
      status: 'success',
      data: { kbEntry },
    });
  } catch (error) {
    next(error);
  }
};

export const getKBEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId, tags, search, page = 1, limit = 10 } = req.query;

    const query: any = {};

    if (productId) {
      query.productId = String(productId);
    }

    if (tags) {
      const tagList = String(tags).split(',').map((t) => t.trim());
      query.tags = { $in: tagList };
    }

    if (search) {
      query.$text = { $search: String(search) };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skipNum = (pageNum - 1) * limitNum;

    const kbEntries = await KnowledgeBaseModel.find(query)
      .populate('productId', 'sku name')
      .populate('companyId', 'name domain')
      .skip(skipNum)
      .limit(limitNum);

    const total = await KnowledgeBaseModel.countDocuments(query);

    res.status(200).json({
      status: 'success',
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      data: { kbEntries },
    });
  } catch (error) {
    next(error);
  }
};

export const getKBById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const kbEntry = await KnowledgeBaseModel.findById(id)
      .populate('productId', 'sku name')
      .populate('companyId', 'name domain');

    if (!kbEntry) {
      throw new NotFoundError('Knowledge base entry not found');
    }

    res.status(200).json({
      status: 'success',
      data: { kbEntry },
    });
  } catch (error) {
    next(error);
  }
};

export const updateKBEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    const kbEntry = await KnowledgeBaseModel.findById(id);
    if (!kbEntry) {
      throw new NotFoundError('Knowledge base entry not found');
    }

    // Verify ownership
    if (authReq.user?.role !== UserRole.ADMIN && kbEntry.companyId.toString() !== companyId) {
      throw new ForbiddenError('You are not authorized to update this document');
    }

    const { title, content, tags, productId } = req.body;

    if (title) kbEntry.title = title;
    if (content) kbEntry.content = content;

    if (tags) {
      let parsedTags = tags;
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map((t: string) => t.trim());
        }
      }
      kbEntry.tags = parsedTags;
    }

    if (productId) {
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new NotFoundError('Linked product not found');
      }
      if (authReq.user?.role !== UserRole.ADMIN && product.companyId.toString() !== companyId) {
        throw new ForbiddenError('Linked product must belong to your company');
      }
      kbEntry.productId = productId;
    }

    // Handle new file attachments
    if (req.file) {
      const uploadRes = await uploadToCloudinary(req.file.buffer, 'kb-documents', req.file.originalname);
      kbEntry.fileUrl = uploadRes.url;
      if (req.file.mimetype === 'text/plain' && !content) {
        kbEntry.content = req.file.buffer.toString('utf-8');
      }
    }

    await kbEntry.save();

    // Recompute embeddings if content/title changed
    try {
      const v = EmbeddingsService.embedText(kbEntry.content || kbEntry.title || '');
      await VectorDB.upsertRecord(String(kbEntry._id), kbEntry.title, v, { productId: kbEntry.productId, fileUrl: kbEntry.fileUrl });
    } catch (err) {
      // non-fatal
    }

    res.status(200).json({
      status: 'success',
      data: { kbEntry },
    });
  } catch (error) {
    next(error);
  }
};

export const serveKBFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const kbEntry = await KnowledgeBaseModel.findById(id);

    if (!kbEntry || !kbEntry.fileUrl) {
      throw new NotFoundError('File not found for this knowledge base entry');
    }

    const fileUrl = kbEntry.fileUrl;
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      throw new NotFoundError('Could not retrieve file from storage');
    }

    // Always derive content-type from URL extension — Cloudinary raw/image uploads return
    // application/octet-stream regardless of the actual file type, so never trust their header.
    const urlPath = fileUrl.split('?')[0].toLowerCase();
    let contentType: string;
    if (urlPath.endsWith('.pdf')) contentType = 'application/pdf';
    else if (urlPath.endsWith('.mp4')) contentType = 'video/mp4';
    else if (urlPath.endsWith('.webm')) contentType = 'video/webm';
    else if (urlPath.endsWith('.png')) contentType = 'image/png';
    else if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const deleteKBEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    const kbEntry = await KnowledgeBaseModel.findById(id);
    if (!kbEntry) {
      throw new NotFoundError('Knowledge base entry not found');
    }

    // Verify ownership
    if (authReq.user?.role !== UserRole.ADMIN && kbEntry.companyId.toString() !== companyId) {
      throw new ForbiddenError('You are not authorized to delete this document');
    }

    await KnowledgeBaseModel.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
      message: 'Knowledge base entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
