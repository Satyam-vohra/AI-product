import { IChatMessage } from '../../infrastructure/models/session-model';
export declare class AIService {
    /**
     * Generates a context-aware diagnostic response based on Knowledge Base (KB) lookup.
     * This is a complete implementation of a RAG (Retrieval-Augmented Generation) pipeline.
     */
    static generateDiagnosticResponse(productId: string, userMessage: string, history: IChatMessage[]): Promise<string>;
}
export default AIService;
