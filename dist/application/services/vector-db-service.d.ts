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
export declare class VectorDB {
    private static index;
    static loadIndex(): Promise<void>;
    static upsertRecord(kbId: string, title: string, vector: number[], metadata?: any): Promise<void>;
    static query(vector: number[], topK?: number): Array<{
        record: VectorRecord;
        score: number;
    }>;
}
export default VectorDB;
