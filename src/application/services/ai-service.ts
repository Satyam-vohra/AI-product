import { env } from '../../config/environment';
import { logger } from '../../core/utils/logger';
import { IChatMessage } from '../../infrastructure/models/session-model';
import RAGService from './rag-service';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OpenAIResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

export class AIService {
  public static async generateDiagnosticResponse(
    productId: string,
    userMessage: string,
    history: IChatMessage[],
    contextPart?: string
  ): Promise<string> {
    try {
      logger.info(`AI Diagnostics - Generating LLM response for product: ${productId}`);

      const conversationText = [...history, { sender: 'user', message: userMessage, timestamp: new Date() }]
        .filter((entry) => entry.sender === 'user')
        .map((entry) => entry.message.trim())
        .filter(Boolean)
        .join('\n');

      const [citations, passport] = await Promise.all([
        RAGService.queryKnowledgeBase(productId, conversationText || userMessage),
        RAGService.generateProductPassport(productId),
      ]);

      if (!this.hasUsableApiKey()) {
        return this.generateFallbackResponse(userMessage, citations, contextPart);
      }

      if (env.GEMINI_API_KEY?.trim()) {
        return await this.callGemini(history, userMessage, contextPart, passport, citations);
      }

      const useGroq = Boolean(env.GROQ_API_KEY?.trim());
      const apiUrl = useGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const apiKey = useGroq ? env.GROQ_API_KEY!.trim() : env.OPENAI_API_KEY!.trim();
      const model = useGroq ? 'llama-3.1-8b-instant' : env.OPENAI_MODEL;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 700,
          messages: this.buildMessages(history, userMessage, contextPart, passport, citations),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`OpenAI response generation failed with ${response.status}: ${errorText}`);
        return this.generateFallbackResponse(userMessage, citations, contextPart);
      }

      const payload = (await response.json()) as OpenAIResponse;
      const outputText = payload.choices?.[0]?.message?.content?.trim() ?? '';

      if (!outputText) {
        logger.warn('OpenAI response generation returned an empty output_text payload');
        return this.generateFallbackResponse(userMessage, citations, contextPart);
      }

      return outputText.trim();
    } catch (error: any) {
      logger.error(`AI Diagnostic Service error: ${error.message}`);
      return this.generateFallbackResponse(userMessage, [], contextPart);
    }
  }

  private static hasUsableApiKey(): boolean {
    const apiKey = env.OPENAI_API_KEY?.trim();
    return Boolean(apiKey && apiKey.toLowerCase() !== 'mock');
  }

  private static buildInstructions(
    contextPart: string | undefined,
    passport: Awaited<ReturnType<typeof RAGService.generateProductPassport>>,
    citations: Awaited<ReturnType<typeof RAGService.queryKnowledgeBase>>
  ): string {
    const passportBlock = passport
      ? [
          `Product: ${passport.name}`,
          `SKU: ${passport.sku}`,
          `Category: ${passport.category}`,
          `Manufacturer: ${passport.manufacturer}`,
          `Warranty: ${passport.warrantyStatus}`,
          `Health score: ${passport.healthScore}%`,
          `Expected lifespan: ${passport.expectedLifespan}`,
          `Suggested spares: ${passport.sparesList.join(', ')}`,
        ].join('\n')
      : 'Product passport unavailable.';

    const manualBlock = citations.length > 0
      ? citations
          .map((citation, index) => {
            const excerpt = citation.content?.trim() || 'No excerpt available.';
            return `${index + 1}. ${citation.title} (score ${citation.score})\n${excerpt}`;
          })
          .join('\n\n')
      : 'No high-confidence manual excerpt was retrieved.';

    const focusLine = contextPart ? `Focused component: ${contextPart}` : 'Focused component: not specified';

    return [
      'You are Mantis AI, a diagnostic assistant for product troubleshooting.',
      'Use the provided product and manual context to answer the user directly and practically.',
      'Do not invent manuals, measurements, or fault codes that are not supported by the provided context.',
      'If the evidence is weak, say what is known, what is uncertain, and ask the single best next diagnostic question.',
      'When giving a likely cause or repair, reference the relevant manual titles in plain text.',
      'Keep the answer concise, technical, and useful for troubleshooting.',
      '',
      focusLine,
      passportBlock,
      '',
      'Retrieved manual context:',
      manualBlock,
    ].join('\n');
  }

  private static buildMessages(
    history: IChatMessage[],
    userMessage: string,
    contextPart: string | undefined,
    passport: Awaited<ReturnType<typeof RAGService.generateProductPassport>>,
    citations: Awaited<ReturnType<typeof RAGService.queryKnowledgeBase>>
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.buildInstructions(contextPart, passport, citations) },
    ];

    history.slice(-8).forEach((entry) => {
      messages.push({
        role: entry.sender === 'user' ? 'user' : 'assistant',
        content: entry.message,
      });
    });

    const finalUserMessage = contextPart
      ? `${userMessage}\nFocused component: ${contextPart}`
      : userMessage;

    messages.push({ role: 'user', content: finalUserMessage });
    return messages;
  }

  private static async callGemini(
    history: IChatMessage[],
    userMessage: string,
    contextPart: string | undefined,
    passport: Awaited<ReturnType<typeof RAGService.generateProductPassport>>,
    citations: Awaited<ReturnType<typeof RAGService.queryKnowledgeBase>>
  ): Promise<string> {
    const systemText = this.buildInstructions(contextPart, passport, citations);
    const messages = this.buildMessages(history, userMessage, contextPart, passport, citations);

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY!.trim(),
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents,
        generationConfig: { maxOutputTokens: 700 },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(`Gemini response generation failed with ${response.status}: ${errorText}`);
      return this.generateFallbackResponse(userMessage, citations, contextPart);
    }

    const payload = await response.json() as any;
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!text) {
      logger.warn('Gemini returned empty response');
      return this.generateFallbackResponse(userMessage, citations, contextPart);
    }
    return text;
  }

  private static generateFallbackResponse(
    userMessage: string,
    citations: Awaited<ReturnType<typeof RAGService.queryKnowledgeBase>>,
    contextPart?: string
  ): string {
    const manualSummary = citations.length > 0
      ? citations
          .slice(0, 2)
          .map((citation) => `- ${citation.title}${citation.content ? `: ${citation.content.slice(0, 160)}...` : ''}`)
          .join('\n')
      : '- No strong indexed manual match was found yet.';

    const focusLine = contextPart ? `Focused component: ${contextPart}.\n` : '';

    return [
      `${focusLine}I analyzed your latest message: "${userMessage}".`,
      'Here is the most relevant manual context I found:',
      manualSummary,
      '',
      'Please share the exact observed error code, LED pattern, sound, or visible damage so I can narrow the diagnosis further.',
    ].join('\n');
  }
}

export default AIService;
