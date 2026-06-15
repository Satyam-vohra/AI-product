/**
 * Simple deterministic embedding generator for offline/local use.
 * Produces fixed-size numeric vectors from text using hashing.
 */
export declare class EmbeddingsService {
    private static dim;
    static embedText(text: string, language?: string): number[];
    private static simpleHash;
    static cosineSim(a: number[], b: number[]): number;
}
export default EmbeddingsService;
