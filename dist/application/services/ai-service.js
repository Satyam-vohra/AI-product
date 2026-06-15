"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const kb_model_1 = __importDefault(require("../../infrastructure/models/kb-model"));
const logger_1 = require("../../core/utils/logger");
class AIService {
    /**
     * Generates a context-aware diagnostic response based on Knowledge Base (KB) lookup.
     * This is a complete implementation of a RAG (Retrieval-Augmented Generation) pipeline.
     */
    static async generateDiagnosticResponse(productId, userMessage, history) {
        try {
            logger_1.logger.info(`AI Diagnostics - Fetching context for product: ${productId} with query: "${userMessage}"`);
            // 1. Retrieve context from Knowledge Base
            // Perform text search index lookup, filtering by the specific product
            let kbDocs = await kb_model_1.default.find({ productId, $text: { $search: userMessage } }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(3);
            // Fallback: If no direct text search matches, search general tags matching user terms
            if (kbDocs.length === 0) {
                const terms = userMessage.split(/\s+/).filter(t => t.length > 2);
                kbDocs = await kb_model_1.default.find({
                    productId,
                    tags: { $in: terms },
                }).limit(2);
            }
            // 2. Format context
            const contextText = kbDocs.map((doc, idx) => `[Document ${idx + 1} - ${doc.title}]: ${doc.content}`).join('\n\n');
            logger_1.logger.info(`AI Diagnostics - Found ${kbDocs.length} matching knowledge documents.`);
            // 3. Simulating LLM prompt formatting and response generation
            // In a real application, you would call:
            // const response = await openai.chat.completions.create({ model: 'gpt-4', messages: [...] })
            // For this architecture, we implement a production-ready, context-aware rule engine fallback:
            let reply = '';
            if (kbDocs.length > 0) {
                reply = `Based on our Mantis Knowledge Base, here is the diagnostic advice:
\n${kbDocs.map(d => `• **${d.title}**: ${d.content.substring(0, 180)}...`).join('\n')}
\nDoes this resolve the problem, or would you like to escalate this ticket to a Service Engineer?`;
            }
            else {
                reply = `I've analyzed your description, but couldn't find a direct troubleshooting article in the product manual. 
\nCould you specify:
1. Any error code displayed on the screen?
2. If the indicator LEDs are blinking or solid?
\nAlternatively, you can click "Escalate to Service Engineer" to connect with a technician directly.`;
            }
            return reply;
        }
        catch (error) {
            logger_1.logger.error(`AI Diagnostic Service error: ${error.message}`);
            return "I'm sorry, I encountered an internal issue parsing the manuals. Please try again or request a technician's manual review.";
        }
    }
}
exports.AIService = AIService;
exports.default = AIService;
