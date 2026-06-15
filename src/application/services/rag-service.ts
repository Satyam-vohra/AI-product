import { logger } from '../../core/utils/logger';
import ProductModel from '../../infrastructure/models/product-model';
import KnowledgeBaseModel from '../../infrastructure/models/kb-model';
import EmbeddingsService from './embeddings-service';
import VectorDB from './vector-db-service';

export interface DocumentChunk {
  id: string;
  kbId: string;
  title: string;
  content: string;
  score: number;
}

export interface ProductPassport {
  productId: string;
  sku: string;
  name: string;
  category: string;
  manufacturer: string;
  warrantyStatus: string;
  productionDate: string;
  healthScore: number;
  expectedLifespan: string;
  sparesList: string[];
}

export class RAGService {
  /**
   * Splits long technical documents into overlapping sentences/chunks for granular search indexes.
   */
  public static chunkText(text: string, chunkSize = 200, chunkOverlap = 50): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    let i = 0;
    while (i < words.length) {
      const chunkWords = words.slice(i, i + chunkSize);
      chunks.push(chunkWords.join(' '));
      i += chunkSize - chunkOverlap;
    }
    
    return chunks;
  }

  /**
   * Performs semantic query matches over cached KB chunks, returning matched citations and confidence scores.
   */
  public static async queryKnowledgeBase(
    productId: string,
    queryText: string
  ): Promise<DocumentChunk[]> {
    logger.info(`RAG Search - Indexing semantic query: "${queryText}" for product: ${productId}`);
    // Attempt semantic vector query using Embeddings/VectorDB
    try {
      const qVec = EmbeddingsService.embedText(queryText);
      // Ensure index loaded
      await VectorDB.loadIndex();
      const hits = VectorDB.query(qVec, 5);
      const kbById = new Map(
        (
          await KnowledgeBaseModel.find({
            _id: { $in: hits.map((hit) => hit.record.kbId) },
          })
            .select('title content productId')
            .lean()
        ).map((doc) => [String(doc._id), doc])
      );
      const results: DocumentChunk[] = [];
      for (const h of hits) {
        const doc = kbById.get(h.record.kbId);
        // Only return items that belong to productId when possible
        const docProductId = doc?.productId || h.record.metadata?.productId;
        if (docProductId && String(docProductId) !== productId) continue;
        results.push({
          id: `${h.record.kbId}_vec`,
          kbId: h.record.kbId,
          title: doc?.title || h.record.title,
          content: doc?.content?.slice(0, 320) || '',
          score: parseFloat(h.score.toFixed(2)),
        });
      }
      if (results.length) return results.slice(0, 3);
    } catch (err) {
      logger.warn('VectorDB semantic query failed, falling back to textual search');
    }

    // Fallback: classic text-based chunk search
    const kbItems = await KnowledgeBaseModel.find({ productId });
    const results: DocumentChunk[] = [];
    const searchTerms = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    for (const doc of kbItems) {
      const chunks = this.chunkText(doc.content, 120, 30);
      
      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const chunkText = chunks[cIdx].toLowerCase();
        let matchCount = 0;

        // Calculate a simple matching score based on search terms frequency (TF-IDF simulation)
        searchTerms.forEach((term) => {
          if (chunkText.includes(term)) {
            matchCount += 1;
            const occurrences = chunkText.split(term).length - 1;
            matchCount += occurrences * 0.25;
          }
        });

        if (matchCount > 0) {
          const rawScore = matchCount / (searchTerms.length || 1);
          const normalizedScore = Math.min(0.99, 0.3 + rawScore * 0.7);

          results.push({
            id: `${doc._id}_chunk_${cIdx}`,
            kbId: doc.id,
            title: `${doc.title} (Part ${cIdx + 1})`,
            content: chunks[cIdx],
            score: parseFloat(normalizedScore.toFixed(2)),
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  /**
   * Simulates OCR engine text extraction from diagnostic screens or hardware log photos.
   */
  public static async performOCR(fileBuffer: Buffer, fileName: string): Promise<string> {
    logger.info(`OCR Engine - Processing file buffer for: ${fileName}`);
    const nameLower = fileName.toLowerCase();

    // Check for common crash keywords in file names to trigger special mock codes
    if (nameLower.includes('compressor') || nameLower.includes('overheat')) {
      return 'SYSTEM STATUS LOG: ERR_COMPRESSOR_TEMP_OVER_LIMIT_92C (DEVICE CORE 0)';
    }
    if (nameLower.includes('battery') || nameLower.includes('voltage')) {
      return 'HARDWARE CHECKLIST: BATTERY_CELL_3_VOLTAGE_DEVIATION_0_8V (LOW_VOLT_FAULT)';
    }
    if (nameLower.includes('leak') || nameLower.includes('pressure')) {
      return 'SENSOR MATRIX: PRESS_PUMP_VALVE_LEAKAGE_DETECTED_0_04BAR';
    }

    // Default general OCR extraction simulation
    return `MANTIS DIAGNOSTIC MODULE - BOOT SECTOR LOG\n[SYSTEM STATUS]: ERROR_FAULT_CODE_A04\n[HARDWARE FAULT]: INDICATOR LEDS BLINKING 4x RED`;
  }

  /**
   * Generates a dynamic Digital Product Passport (DPP) containing parts and warranty stats.
   */
  public static async generateProductPassport(productId: string): Promise<ProductPassport | null> {
    const product = await ProductModel.findById(productId).populate('companyId');
    if (!product) return null;

    // Calculate a dynamic health score based on category
    let baseHealth = 88;
    if (product.sku.includes('COMP')) baseHealth = 74; // Compressor units wear faster
    if (product.sku.includes('BATT')) baseHealth = 92;

    const companyName = (product.companyId as any)?.name || 'Mantis Manufacturing Corp';

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      manufacturer: companyName,
      warrantyStatus: 'Active (Expires 2028-12-31)',
      productionDate: '2025-01-10',
      healthScore: baseHealth,
      expectedLifespan: '5 Years (43,800 Active Hours)',
      sparesList: ['OEM Compressor Valve-G3', 'Primary Copper Filter Mesh', 'Thermal Regulator Probe'],
    };
  }
}
export default RAGService;
