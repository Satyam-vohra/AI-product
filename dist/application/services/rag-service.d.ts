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
export declare class RAGService {
    /**
     * Splits long technical documents into overlapping sentences/chunks for granular search indexes.
     */
    static chunkText(text: string, chunkSize?: number, chunkOverlap?: number): string[];
    /**
     * Performs semantic query matches over cached KB chunks, returning matched citations and confidence scores.
     */
    static queryKnowledgeBase(productId: string, queryText: string): Promise<DocumentChunk[]>;
    /**
     * Simulates OCR engine text extraction from diagnostic screens or hardware log photos.
     */
    static performOCR(fileBuffer: Buffer, fileName: string): Promise<string>;
    /**
     * Generates a dynamic Digital Product Passport (DPP) containing parts and warranty stats.
     */
    static generateProductPassport(productId: string): Promise<ProductPassport | null>;
}
export default RAGService;
