import { logger } from '../../core/utils/logger';

export class PDFService {
  /**
   * Lightweight PDF text extractor placeholder. If a real PDF parser is available,
   * replace implementation with `pdf-parse` or similar.
   */
  public static async extractText(buffer: Buffer, fileName = 'document.pdf'): Promise<string> {
    logger.info(`PDF Parser - extracting text for ${fileName}`);
    try {
      // naive fallback: attempt to decode as utf-8
      const txt = buffer.toString('utf-8');
      if (txt && txt.length > 50) return txt;
    } catch (err) {
      // ignore
    }
    // default placeholder
    return `PDF document ${fileName} ingested. Content extraction unavailable in this environment.`;
  }
}

export default PDFService;
