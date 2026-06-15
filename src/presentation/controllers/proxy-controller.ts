import { Request, Response, NextFunction } from 'express';
import { BadRequestError, NotFoundError } from '../../core/errors/app-error';

export const proxyFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      throw new BadRequestError('url query parameter is required');
    }

    let fileUrl: URL;
    try {
      fileUrl = new URL(rawUrl);
    } catch {
      throw new BadRequestError('Invalid URL');
    }

    if (fileUrl.hostname !== 'res.cloudinary.com') {
      throw new BadRequestError('Only Cloudinary file URLs may be proxied');
    }

    const fileResponse = await fetch(rawUrl);
    if (!fileResponse.ok) {
      throw new NotFoundError('Could not retrieve file from storage');
    }

    // Always derive content-type from URL extension — Cloudinary raw/image uploads return
    // application/octet-stream regardless of the actual file type, so never trust their header.
    const urlPath = fileUrl.pathname.toLowerCase();
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
