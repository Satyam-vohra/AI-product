import { ResolutionStatus } from '../../core/constants/roles';
import { IChatMessage, IDiagnosticSession } from '../../infrastructure/models/session-model';
import RAGService, { DocumentChunk, ProductPassport } from './rag-service';
import { logger } from '../../core/utils/logger';
import MemoryService from './memory-service';
import AIService from './ai-service';

export enum DiagnosticPhase {
  UNDERSTANDING_SYMPTOMS = 'UNDERSTANDING_SYMPTOMS',
  GATHERING_DETAILS = 'GATHERING_DETAILS',
  INSPECTION = 'INSPECTION',
  ROOT_CAUSE_DETERMINATION = 'ROOT_CAUSE_DETERMINATION',
  REPAIR_RECOMMENDATION = 'REPAIR_RECOMMENDATION',
  COMPLETED = 'COMPLETED',
}

export interface AgentDiagnosticResult {
  nextMessage: string;
  updatedPhase: DiagnosticPhase;
  confidenceScore?: number;
  rootCause?: string;
  repairSteps?: string[];
  costEstimation?: string;
  spareRecommendations?: string[];
  citations?: string[];
}

type DiagnosticIntent = 'triage' | 'summary' | 'repair' | 'escalate' | 'greeting';

type DiagnosticSignals = {
  errorCodes: string[];
  ledSignals: string[];
  soundSignals: string[];
  powerSignals: string[];
  inspectionSignals: string[];
  componentSignals: string[];
};

export class AIAgentService {
  public static async processDiagnosticStep(
    session: IDiagnosticSession,
    userMessage: string
  ): Promise<AgentDiagnosticResult> {
    try {
      const focusMatch = userMessage.match(/Focused component:\s*(.+)$/im);
      const contextPart = focusMatch?.[1]?.trim();
      const rawUserMessage = userMessage.replace(/\n?Focused component:\s*.+$/im, '').trim();
      const productIdStr = session.productId ? session.productId.toString() : '';
      const llmResponse = await AIService.generateDiagnosticResponse(
        productIdStr,
        rawUserMessage || userMessage,
        session.chatHistory,
        contextPart
      );

      if (llmResponse) {
        return {
          nextMessage: llmResponse,
          updatedPhase: this.determineCompletionPhase(llmResponse, rawUserMessage || userMessage),
        };
      }

      const history = session.chatHistory;
      const conversationText = this.buildConversationText(history, userMessage);
      const intent = this.detectIntent(userMessage);
      const signals = this.extractSignals(conversationText);
      const currentPhase = this.determineCurrentPhase(intent, signals);

      logger.info(`AI Diagnostics Orchestrator - Current session phase: ${currentPhase}`);

      const citations = productIdStr
        ? await RAGService.queryKnowledgeBase(productIdStr, conversationText)
        : [];
      const passport = productIdStr
        ? await RAGService.generateProductPassport(productIdStr)
        : null;

      this.persistSessionSummary(conversationText);

      if (intent === 'escalate') {
        return this.handleEscalation(passport);
      }

      if (intent === 'repair') {
        return this.handleRepairRecommendation(passport, citations, signals);
      }

      if (intent === 'summary' || currentPhase === DiagnosticPhase.ROOT_CAUSE_DETERMINATION) {
        return this.handleRootCause(signals, citations, passport);
      }

      if (currentPhase === DiagnosticPhase.INSPECTION) {
        return this.handleInspection(signals, citations);
      }

      if (currentPhase === DiagnosticPhase.GATHERING_DETAILS) {
        return this.handleGatheringDetails(signals, citations);
      }

      return this.handleUnderstandingSymptoms(userMessage, signals, citations);
    } catch (error: any) {
      logger.error(`AI Agent Diagnostic processing failed: ${error.message}`);
      return {
        nextMessage:
          'Diagnostic engine exception. I hit a temporary processing issue. Please resend the symptom, error code, or observed behavior.',
        updatedPhase: DiagnosticPhase.UNDERSTANDING_SYMPTOMS,
      };
    }
  }

  private static determineCompletionPhase(responseText: string, userMessage: string): DiagnosticPhase {
    const merged = `${responseText}\n${userMessage}`.toLowerCase();
    if (merged.includes('repair guide') || merged.includes('estimated repair cost') || merged.includes('recommended spares')) {
      return DiagnosticPhase.REPAIR_RECOMMENDATION;
    }
    if (merged.includes('likely root cause') || merged.includes('diagnostic summary') || merged.includes('confidence')) {
      return DiagnosticPhase.ROOT_CAUSE_DETERMINATION;
    }
    if (merged.includes('inspect') || merged.includes('inspection')) {
      return DiagnosticPhase.INSPECTION;
    }
    return DiagnosticPhase.GATHERING_DETAILS;
  }

  private static buildConversationText(history: IChatMessage[], userMessage: string): string {
    const userHistory = history
      .filter((entry) => entry.sender === 'user')
      .map((entry) => entry.message.trim())
      .filter(Boolean);

    return [...userHistory, userMessage.trim()].filter(Boolean).join('\n');
  }

  private static detectIntent(userMessage: string): DiagnosticIntent {
    const text = userMessage.toLowerCase();

    if (/^(hi|hello|hey)\b/.test(text)) return 'greeting';
    if (/(repair|fix|replace|steps|how to fix|view steps|solution)/.test(text)) return 'repair';
    if (/(engineer|human|technician|escalate|manual review)/.test(text)) return 'escalate';
    if (/(root cause|what.*wrong|diagnos|summary|likely issue|cause)/.test(text)) return 'summary';

    return 'triage';
  }

  private static extractSignals(conversationText: string): DiagnosticSignals {
    const text = conversationText.toLowerCase();

    const errorCodes = Array.from(
      new Set(
        (conversationText.match(/\b[a-z]{2,}(?:[-_ ]?\d{1,4})\b/gi) || [])
          .map((match) => match.replace(/\s+/g, '_').toUpperCase())
      )
    );

    const ledSignals = this.collectMatches(text, [
      'led',
      'blink',
      'blinking',
      'red',
      'green',
      'amber',
      'solid',
      'indicator',
    ]);
    const soundSignals = this.collectMatches(text, [
      'click',
      'clicking',
      'hum',
      'humming',
      'buzz',
      'noise',
      'whine',
    ]);
    const powerSignals = this.collectMatches(text, [
      'no power',
      "won't start",
      'not turn on',
      'dead',
      'shutdown',
      'trip',
      'overheat',
      'smoke',
      'burning smell',
    ]);
    const inspectionSignals = this.collectMatches(text, [
      'leak',
      'residue',
      'clog',
      'clogged',
      'burn mark',
      'crack',
      'swollen',
      'loose',
      'corrosion',
    ]);
    const componentSignals = this.collectMatches(text, [
      'battery',
      'compressor',
      'pump',
      'valve',
      'fan',
      'motor',
      'sensor',
      'display',
      'filter',
      'board',
    ]);

    return {
      errorCodes,
      ledSignals,
      soundSignals,
      powerSignals,
      inspectionSignals,
      componentSignals,
    };
  }

  private static collectMatches(text: string, terms: string[]): string[] {
    return terms.filter((term) => text.includes(term));
  }

  private static determineCurrentPhase(
    intent: DiagnosticIntent,
    signals: DiagnosticSignals
  ): DiagnosticPhase {
    if (intent === 'repair') return DiagnosticPhase.REPAIR_RECOMMENDATION;
    if (signals.inspectionSignals.length > 0 && (signals.errorCodes.length > 0 || signals.soundSignals.length > 0)) {
      return DiagnosticPhase.ROOT_CAUSE_DETERMINATION;
    }
    if (signals.errorCodes.length > 0 || signals.ledSignals.length > 0 || signals.soundSignals.length > 0) {
      return DiagnosticPhase.GATHERING_DETAILS;
    }
    if (signals.powerSignals.length > 0 || signals.componentSignals.length > 0) {
      return DiagnosticPhase.INSPECTION;
    }
    return DiagnosticPhase.UNDERSTANDING_SYMPTOMS;
  }

  private static handleUnderstandingSymptoms(
    userMessage: string,
    signals: DiagnosticSignals,
    citations: DocumentChunk[]
  ): AgentDiagnosticResult {
    const manualHint = this.formatManualHint(citations);
    const nextQuestion = this.chooseNextQuestion(signals);

    return {
      nextMessage:
        `I understand the current symptom: "${userMessage}".` +
        `${manualHint}\n\n` +
        `To narrow this down accurately, ${nextQuestion}`,
      updatedPhase: DiagnosticPhase.GATHERING_DETAILS,
      citations: citations.map((citation) => citation.title),
    };
  }

  private static handleGatheringDetails(
    signals: DiagnosticSignals,
    citations: DocumentChunk[]
  ): AgentDiagnosticResult {
    const evidence = this.buildEvidenceSummary(signals);
    const nextQuestion = this.chooseNextQuestion(signals);
    const manualHint = this.formatManualHint(citations);

    return {
      nextMessage:
        `Current diagnostic evidence:\n${evidence}\n\n` +
        `${manualHint ? `${manualHint}\n\n` : ''}` +
        `Next check: ${nextQuestion}`,
      updatedPhase: DiagnosticPhase.INSPECTION,
      citations: citations.map((citation) => citation.title),
    };
  }

  private static handleInspection(
    signals: DiagnosticSignals,
    citations: DocumentChunk[]
  ): AgentDiagnosticResult {
    const manualExcerpt = this.formatManualExcerpt(citations);
    const nextQuestion = this.chooseInspectionQuestion(signals);

    return {
      nextMessage:
        `We're moving from symptom collection into physical verification.\n\n` +
        `${manualExcerpt}\n\n` +
        `${nextQuestion}`,
      updatedPhase: DiagnosticPhase.ROOT_CAUSE_DETERMINATION,
      citations: citations.map((citation) => citation.title),
    };
  }

  private static handleRootCause(
    signals: DiagnosticSignals,
    citations: DocumentChunk[],
    passport: ProductPassport | null
  ): AgentDiagnosticResult {
    const bestCitation = citations[0];
    const confidence = bestCitation?.score ?? this.estimateConfidence(signals);
    const rootCause = this.inferRootCause(signals, citations);
    const evidence = this.buildEvidenceSummary(signals);
    const healthLine = passport ? `Device health score: ${passport.healthScore}%` : 'Device health score unavailable.';

    return {
      nextMessage:
        `### Diagnostic Summary\n` +
        `**Likely root cause:** ${rootCause}\n` +
        `**Confidence:** ${(confidence * 100).toFixed(0)}%\n` +
        `**Evidence:**\n${evidence}\n\n` +
        `${healthLine}\n` +
        `${this.formatCitationList(citations)}\n\n` +
        `If you want, ask me for repair steps, replacement guidance, or escalation to a service engineer.`,
      updatedPhase: DiagnosticPhase.REPAIR_RECOMMENDATION,
      confidenceScore: confidence,
      rootCause,
      citations: citations.map((citation) => citation.title),
    };
  }

  private static handleRepairRecommendation(
    passport: ProductPassport | null,
    citations: DocumentChunk[],
    signals: DiagnosticSignals
  ): AgentDiagnosticResult {
    const repairSteps = this.buildRepairSteps(signals);
    const safetyWarning = this.runSafetyValidator(repairSteps);
    const spares = passport?.sparesList?.length
      ? passport.sparesList
      : ['OEM Replacement Kit', 'Harness Check Tool', 'Thermal Probe'];
    const estimatedCost = signals.componentSignals.includes('battery') ? '$120.00' : '$145.00';

    return {
      nextMessage:
        `### Repair Guide\n` +
        `${safetyWarning}` +
        `**Steps:**\n${repairSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n` +
        `**Estimated repair cost:** ${estimatedCost}\n` +
        `**Recommended spares:** ${spares.join(', ')}\n` +
        `${this.formatCitationList(citations)}\n\n` +
        `After you complete the repair, run a short validation test and tell me the result so I can confirm closure.`,
      updatedPhase: DiagnosticPhase.COMPLETED,
      repairSteps,
      costEstimation: estimatedCost,
      spareRecommendations: spares,
      citations: citations.map((citation) => citation.title),
    };
  }

  private static handleEscalation(passport: ProductPassport | null): AgentDiagnosticResult {
    const productLine = passport
      ? `I can package the ${passport.name} diagnostic context, likely failure area, and recommended spares for the engineer.`
      : 'I can package the current diagnostic context for a service engineer.';

    return {
      nextMessage:
        `${productLine}\n\n` +
        `Before escalating, send me either the exact error code, a photo/OCR log, or the result of your latest inspection so the engineer receives a useful handoff.`,
      updatedPhase: DiagnosticPhase.GATHERING_DETAILS,
    };
  }

  private static chooseNextQuestion(signals: DiagnosticSignals): string {
    if (signals.errorCodes.length === 0) {
      return 'please share the exact error code, warning text, or screen behavior you see.';
    }
    if (signals.ledSignals.length === 0) {
      return 'tell me whether any LEDs are blinking, their color, and whether the light is solid or pulsing.';
    }
    if (signals.soundSignals.length === 0) {
      return 'listen for clicking, humming, buzzing, or complete silence during startup and tell me what you hear.';
    }
    return 'inspect the focused component for residue, heat damage, swelling, loose connectors, or blockage and report what you find.';
  }

  private static chooseInspectionQuestion(signals: DiagnosticSignals): string {
    if (signals.componentSignals.includes('battery')) {
      return 'Please inspect the battery pack for swelling, terminal corrosion, or a large voltage drop between cells.';
    }
    if (signals.componentSignals.includes('compressor') || signals.componentSignals.includes('pump')) {
      return 'Please inspect the pressure path for leaks, blocked vents, or residue near the valve assembly.';
    }
    return 'Please inspect the selected component for heat damage, connector looseness, or contamination and tell me what is visible.';
  }

  private static buildEvidenceSummary(signals: DiagnosticSignals): string {
    const lines: string[] = [];

    if (signals.errorCodes.length > 0) {
      lines.push(`- Error codes: ${signals.errorCodes.join(', ')}`);
    }
    if (signals.ledSignals.length > 0) {
      lines.push(`- Indicator behavior: ${signals.ledSignals.join(', ')}`);
    }
    if (signals.soundSignals.length > 0) {
      lines.push(`- Audible clues: ${signals.soundSignals.join(', ')}`);
    }
    if (signals.powerSignals.length > 0) {
      lines.push(`- Power or thermal clues: ${signals.powerSignals.join(', ')}`);
    }
    if (signals.inspectionSignals.length > 0) {
      lines.push(`- Inspection findings: ${signals.inspectionSignals.join(', ')}`);
    }
    if (signals.componentSignals.length > 0) {
      lines.push(`- Components mentioned: ${signals.componentSignals.join(', ')}`);
    }

    return lines.length > 0 ? lines.join('\n') : '- Symptom detail is still limited.';
  }

  private static inferRootCause(signals: DiagnosticSignals, citations: DocumentChunk[]): string {
    const citedTitle = citations[0]?.title?.replace(/\s+\(Part \d+\)$/, '');

    if (signals.componentSignals.includes('battery')) {
      return citedTitle
        ? `battery cell imbalance or pack protection trigger, matching ${citedTitle}`
        : 'battery cell imbalance or pack protection trigger';
    }

    if (signals.componentSignals.includes('compressor') || signals.componentSignals.includes('pump')) {
      return citedTitle
        ? `flow restriction or valve-side pressure fault, matching ${citedTitle}`
        : 'flow restriction or valve-side pressure fault';
    }

    if (signals.errorCodes.length > 0) {
      return citedTitle
        ? `fault pattern associated with ${citedTitle}`
        : `fault pattern associated with ${signals.errorCodes[0]}`;
    }

    return citedTitle || 'general component-level electrical or mechanical degradation';
  }

  private static estimateConfidence(signals: DiagnosticSignals): number {
    let score = 0.55;
    score += Math.min(0.12, signals.errorCodes.length * 0.06);
    score += Math.min(0.12, signals.inspectionSignals.length * 0.06);
    score += Math.min(0.08, signals.soundSignals.length * 0.04);
    return Math.min(0.92, score);
  }

  private static formatManualHint(citations: DocumentChunk[]): string {
    if (citations.length === 0) return '';
    return ` I found relevant manual context in ${citations.slice(0, 2).map((citation) => `"${citation.title}"`).join(' and ')}.`;
  }

  private static formatManualExcerpt(citations: DocumentChunk[]): string {
    if (citations.length === 0) {
      return 'I do not have a strong manual match yet, so I am relying on your observed symptoms and inspection findings.';
    }

    const bestCitation = citations[0];
    if (bestCitation.content) {
      return `Closest manual match: "${bestCitation.title}"\n${bestCitation.content.slice(0, 220)}...`;
    }

    return `Closest manual match: "${bestCitation.title}".`;
  }

  private static formatCitationList(citations: DocumentChunk[]): string {
    if (citations.length === 0) return 'Manual references: no direct indexed citation found yet.';
    return `Manual references: ${citations.slice(0, 3).map((citation) => citation.title).join('; ')}`;
  }

  private static buildRepairSteps(signals: DiagnosticSignals): string[] {
    if (signals.componentSignals.includes('battery')) {
      return [
        'Power down the unit and isolate the battery pack from the main harness.',
        'Inspect cell groups and balance leads for swelling, corrosion, or heat damage.',
        'Replace the affected cell pack or protection board if the voltage delta remains outside tolerance.',
        'Reconnect the pack, clear the fault, and run a controlled charge-discharge validation cycle.',
      ];
    }

    if (signals.componentSignals.includes('compressor') || signals.componentSignals.includes('pump')) {
      return [
        'De-energize the module and wait for moving parts and pressure to settle.',
        'Inspect the valve path, filter mesh, and adjoining seals for blockage or residue.',
        'Clean or replace the restricted component, then re-seat connectors and fasteners to the service spec.',
        'Restart the system and verify pressure, temperature, and noise return to normal range.',
      ];
    }

    return [
      'Power down the unit and isolate the affected circuit safely.',
      'Inspect the selected component and harness for visible damage, looseness, or contamination.',
      'Replace the failed part or connector, then reassemble according to the service manual.',
      'Run a short validation cycle and confirm the original symptom does not return.',
    ];
  }

  private static runSafetyValidator(steps: string[]): string {
    const joinedSteps = steps.join(' ').toLowerCase();

    let alert = '';
    if (joinedSteps.includes('pressure') || joinedSteps.includes('valve')) {
      alert +=
        '> [!WARNING]\n' +
        '> HIGH PRESSURE HAZARD: Verify system pressure is at zero before opening the assembly.\n\n';
    }
    if (joinedSteps.includes('power') || joinedSteps.includes('de-energize') || joinedSteps.includes('circuit')) {
      alert +=
        '> [!IMPORTANT]\n' +
        '> ELECTRICAL HAZARD: Disconnect power fully and wait for stored charge to dissipate before servicing.\n\n';
    }

    return alert;
  }

  private static persistSessionSummary(conversationText: string): void {
    void (async () => {
      try {
        await MemoryService.setMemory('system', 'last_symptom_summary', {
          text: conversationText.slice(-1200),
          detectedAt: new Date(),
        });
      } catch {
        // Ignore memory persistence failures during chat orchestration.
      }
    })();
  }
}

export default AIAgentService;
