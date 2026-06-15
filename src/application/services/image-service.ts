import { RAGService } from './rag-service';
import { logger } from '../../core/utils/logger';

export class ImageService {
  /**
   * Diagnoses an image from a URL by running OCR and returning findings.
   * TODO: Fetch the image from the URL and run OCR/diagnosis on the buffer.
   */
  public static async diagnoseImageFromUrl(imageUrl: string): Promise<{
    imageUrl: string;
    findings: string;
    summary: string;
  }> {
    logger.info(`ImageService - Diagnosing image from URL: ${imageUrl}`);

    // TODO: Fetch the image buffer from imageUrl (e.g. via axios/fetch) and
    // pass it to RAGService.performOCR for real OCR extraction.
    const fileName = imageUrl.split('/').pop() || 'image';
    const findings = await RAGService.performOCR(Buffer.alloc(0), fileName);

    return {
      imageUrl,
      findings,
      summary: `Diagnosis complete for image: ${fileName}`,
    };
  }
}

export default ImageService;
