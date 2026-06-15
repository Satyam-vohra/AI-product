import RAGService from './rag-service';
import { logger } from '../../core/utils/logger';

export class ImageService {
  /**
   * Simple image diagnostic routine: runs OCR and looks for keywords.
   */
  public static async diagnoseImage(buffer: Buffer, fileName: string) {
    logger.info(`Image Diagnosis - processing ${fileName}`);
    const ocr = await RAGService.performOCR(buffer, fileName);
    const findings: string[] = [];
    const lower = ocr.toLowerCase();
    if (lower.includes('compressor')) findings.push('Compressor temperature flags detected');
    if (lower.includes('voltage') || lower.includes('battery')) findings.push('Power subsystem irregularity reported');
    if (lower.includes('leak') || lower.includes('pressure')) findings.push('Pressure leak or valve anomaly detected');

    return {
      ocrText: ocr,
      findings,
      summary: findings.length ? findings.join('; ') : 'No clear hardware indicators found in image OCR',
    };
  }
}

export default ImageService;
