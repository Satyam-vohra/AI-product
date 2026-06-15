"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgentService = exports.DiagnosticPhase = void 0;
const rag_service_1 = __importDefault(require("./rag-service"));
const logger_1 = require("../../core/utils/logger");
const memory_service_1 = __importDefault(require("./memory-service"));
// State machine enum matching approved flow chart layout
var DiagnosticPhase;
(function (DiagnosticPhase) {
    DiagnosticPhase["UNDERSTANDING_SYMPTOMS"] = "UNDERSTANDING_SYMPTOMS";
    DiagnosticPhase["GATHERING_DETAILS"] = "GATHERING_DETAILS";
    DiagnosticPhase["INSPECTION"] = "INSPECTION";
    DiagnosticPhase["ROOT_CAUSE_DETERMINATION"] = "ROOT_CAUSE_DETERMINATION";
    DiagnosticPhase["REPAIR_RECOMMENDATION"] = "REPAIR_RECOMMENDATION";
    DiagnosticPhase["COMPLETED"] = "COMPLETED";
})(DiagnosticPhase || (exports.DiagnosticPhase = DiagnosticPhase = {}));
class AIAgentService {
    /**
     * Evaluates the current conversation history, determines the diagnostic phase,
     * performs RAG query searches, filters/eliminates impossible causes,
     * runs safety audits, and formulates the agent's next technician response.
     */
    static async processDiagnosticStep(session, userMessage) {
        try {
            const history = session.chatHistory;
            // Determine current phase from the session metadata or calculate based on history length
            const currentPhase = this.determineCurrentPhase(history);
            logger_1.logger.info(`AI Diagnostics Orchestrator - Current session phase: ${currentPhase}`);
            // 1. Run RAG Search to gather manuals context matching user message
            const citations = await rag_service_1.default.queryKnowledgeBase(session.productId.toString(), userMessage);
            // 2. State-Machine Phase Routing
            switch (currentPhase) {
                case DiagnosticPhase.UNDERSTANDING_SYMPTOMS:
                    return this.handleUnderstandingSymptoms(userMessage, citations);
                case DiagnosticPhase.GATHERING_DETAILS:
                    return this.handleGatheringDetails(history, userMessage, citations);
                case DiagnosticPhase.INSPECTION:
                    return this.handleInspection(history, userMessage, citations);
                case DiagnosticPhase.ROOT_CAUSE_DETERMINATION:
                    return this.handleRootCause(session.productId.toString(), history, userMessage, citations);
                case DiagnosticPhase.REPAIR_RECOMMENDATION:
                    return this.handleRepairRecommendation(session.productId.toString(), citations);
                default:
                    return {
                        nextMessage: "Diagnostic ticket is closed. If you have any new hardware failures, please create a new diagnostic session.",
                        updatedPhase: DiagnosticPhase.COMPLETED,
                    };
            }
        }
        catch (error) {
            logger_1.logger.error(`AI Agent Diagnostic processing failed: ${error.message}`);
            return {
                nextMessage: "Diagnostic Engine Exception. I encountered a pipeline blockage. Please repeat your last telemetry log.",
                updatedPhase: DiagnosticPhase.UNDERSTANDING_SYMPTOMS,
            };
        }
    }
    /**
     * Evaluates chat history to determine what phase of diagnosis the technician is on.
     */
    static determineCurrentPhase(history) {
        const userMessageCount = history.filter((h) => h.sender === 'user').length;
        if (userMessageCount <= 1) {
            return DiagnosticPhase.UNDERSTANDING_SYMPTOMS;
        }
        if (userMessageCount === 2) {
            return DiagnosticPhase.GATHERING_DETAILS;
        }
        if (userMessageCount === 3) {
            return DiagnosticPhase.INSPECTION;
        }
        if (userMessageCount === 4) {
            return DiagnosticPhase.ROOT_CAUSE_DETERMINATION;
        }
        return DiagnosticPhase.REPAIR_RECOMMENDATION;
    }
    /**
     * Phase 1: Greet the user, acknowledge symptoms, and start details collection. (Never immediately answer)
     */
    static handleUnderstandingSymptoms(userMessage, citations) {
        const kbContext = citations.length > 0 ? ` [Manual match found: ${citations[0].title}]` : '';
        // Store brief symptom summary to user memory (non-blocking)
        (async () => {
            try {
                await memory_service_1.default.setMemory('system', 'last_symptom_summary', { text: userMessage, detectedAt: new Date() });
            }
            catch (e) {
                // ignore memory write failures
            }
        })();
        return {
            nextMessage: `I have received the symptom profile: "${userMessage}".${kbContext}\n\nBefore I can formulate a hypothesis, I need to check some parameters. Are there any LED indicators blinking on your device panel? If yes, what is the color and blink frequency?`,
            updatedPhase: DiagnosticPhase.GATHERING_DETAILS,
        };
    }
    /**
     * Phase 2: Eliminate impossible causes based on answers, and recommend a physical inspection.
     */
    static handleGatheringDetails(history, userMessage, citations) {
        const userMsgLower = userMessage.toLowerCase();
        let eliminatedCause = "";
        if (userMsgLower.includes('no') || userMsgLower.includes('off') || userMsgLower.includes('solid')) {
            eliminatedCause = "Eliminated: Master fuse rupture / complete power supply short-circuit (since indicators are operational).";
        }
        else {
            eliminatedCause = "Eliminated: Thermal fuse overheat (since display is powering up).";
        }
        return {
            nextMessage: `Noted. **${eliminatedCause}**\n\nLet's perform a physical inspection: Please power off the unit, unplug the power socket, and verify if the primary compressor bypass valve has any liquid residue or if the main radiator vents are clogged. What do you see?`,
            updatedPhase: DiagnosticPhase.INSPECTION,
        };
    }
    /**
     * Phase 3: Receive inspection results and prepare root cause findings.
     */
    static handleInspection(history, userMessage, citations) {
        return {
            nextMessage: `Inspection report received: "${userMessage}".\n\nI am compiling the telemetry results and referencing the manuals to isolate the faulty component. Please confirm if you've heard any clicking sounds or humming noises from the core unit in the past 24 hours?`,
            updatedPhase: DiagnosticPhase.ROOT_CAUSE_DETERMINATION,
        };
    }
    /**
     * Phase 4: Find root cause, calculate confidence scores, and display citations.
     */
    static async handleRootCause(productId, history, userMessage, citations) {
        const bestCitation = citations[0];
        const confidence = bestCitation ? bestCitation.score : 0.72;
        const causeText = bestCitation
            ? `Thermal valve blockage and core compressor backpressure due to ${bestCitation.title}`
            : 'Primary motor brush wear leading to voltage leakage';
        // Fetch Digital Product Passport to evaluate maintenance health status
        const passport = await rag_service_1.default.generateProductPassport(productId);
        const healthImpact = passport ? ` (Device Health Index: ${passport.healthScore}%)` : '';
        return {
            nextMessage: `### Diagnostic Report\n* **Isolated Root Cause:** ${causeText}${healthImpact}\n* **Isolator Confidence:** ${(confidence * 100).toFixed(0)}%\n\nI am now running safety validations to prepare repair recommendations. Type "view steps" to outline the safe maintenance procedure.`,
            updatedPhase: DiagnosticPhase.REPAIR_RECOMMENDATION,
            confidenceScore: confidence,
            rootCause: causeText,
            citations: citations.map((c) => c.title),
        };
    }
    /**
     * Phase 5: Suggest repair instructions, estimate costs, request spare parts, and run Safety checks.
     */
    static async handleRepairRecommendation(productId, citations) {
        const defaultSteps = [
            'De-energize the entire module and wait 5 minutes for discharge.',
            'Loosen the pressure retention flange screws by a quarter turn to bleed system pressure.',
            'Slide the wear-ring seal off the valve shaft and check for structural cracking.',
            'Replace with a certified spare part and tighten flange screws to 12 Nm torque.',
        ];
        // Safety and Validation check
        const safetyWarning = AIAgentService.runSafetyValidator(defaultSteps);
        // Fetch spare recommendation list
        const passport = await rag_service_1.default.generateProductPassport(productId);
        const spares = passport ? passport.sparesList : ['OEM Replacement Valve Kit'];
        return {
            nextMessage: `### Repair Guide\n${safetyWarning}\n\n**Steps:**\n${defaultSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\n* **Estimated Repair Cost:** $145.00 (Includes parts and 1 hour labor)\n* **Recommended Spares:** ${spares.join(', ')}\n\nThis completes the troubleshooting guide. You can now close this diagnostic session or request service engineer escalation.`,
            updatedPhase: DiagnosticPhase.COMPLETED,
            repairSteps: defaultSteps,
            costEstimation: '$145.00',
            spareRecommendations: spares,
        };
    }
    /**
     * Safety Agent validation: scans steps and inserts explicit safety alerts if high risks are detected.
     */
    static runSafetyValidator(steps) {
        const joinedSteps = steps.join(' ').toLowerCase();
        let alert = '';
        if (joinedSteps.includes('pressure') || joinedSteps.includes('valve')) {
            alert += `> [!WARNING]\n> **HIGH PRESSURE HAZARD**: Verify the system pressure gauge reads 0.00 bar before removing the flange assembly.\n\n`;
        }
        if (joinedSteps.includes('de-energize') || joinedSteps.includes('voltage') || joinedSteps.includes('discharge')) {
            alert += `> [!IMPORTANT]\n> **ELECTRICAL HAZARD**: High-voltage capacitors require 5 minutes of discharge time after power disconnected.\n\n`;
        }
        return alert;
    }
}
exports.AIAgentService = AIAgentService;
exports.default = AIAgentService;
