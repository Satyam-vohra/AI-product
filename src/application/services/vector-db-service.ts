import EmbeddingsService from './embeddings-service';
import KnowledgeBaseModel from '../../infrastructure/models/kb-model';

export interface VectorRecord {
  id: string;
  kbId: string;
  title: string;
  vector: number[];
  metadata?: any;
}

/**
 * Lightweight in-memory vector index backed by KB entries with embeddings.
 * On startup, it can load existing KB embeddings and provide nearest-neighbour queries.
 */
export class VectorDB {
  private static index: Map<string, VectorRecord> = new Map();

  public static async loadIndex(): Promise<void> {
    const docs = await KnowledgeBaseModel.find({ embeddings: { $exists: true } }).lean();
    for (const d of docs) {
      if (d.embeddings && d.embeddings.length) {
        this.index.set(String(d._id), {
          id: String(d._id),
          kbId: String(d._id),
          title: d.title,
          vector: d.embeddings as number[],
          metadata: { productId: d.productId, fileUrl: d.fileUrl },
        });
      }
    }
  }

  public static async upsertRecord(kbId: string, title: string, vector: number[], metadata?: any) {
    this.index.set(kbId, { id: kbId, kbId, title, vector, metadata });
    // persist to KB document as well
    await KnowledgeBaseModel.findByIdAndUpdate(kbId, { embeddings: vector }).exec();
  }

  public static query(vector: number[], topK = 5): Array<{ record: VectorRecord; score: number }> {
    const hits: Array<{ record: VectorRecord; score: number }> = [];
    for (const rec of this.index.values()) {
      const score = EmbeddingsService.cosineSim(vector, rec.vector);
      hits.push({ record: rec, score });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

export default VectorDB;
