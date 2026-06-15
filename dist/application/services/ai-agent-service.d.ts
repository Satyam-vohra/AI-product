import { IDiagnosticSession } from '../../infrastructure/models/session-model';
export declare enum DiagnosticPhase {
    UNDERSTANDING_SYMPTOMS = "UNDERSTANDING_SYMPTOMS",
    GATHERING_DETAILS = "GATHERING_DETAILS",
    INSPECTION = "INSPECTION",
    ROOT_CAUSE_DETERMINATION = "ROOT_CAUSE_DETERMINATION",
    REPAIR_RECOMMENDATION = "REPAIR_RECOMMENDATION",
    COMPLETED = "COMPLETED"
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
export declare class AIAgentService {
    /**
     * Evaluates the current conversation history, determines the diagnostic phase,
     * performs RAG query searches, filters/eliminates impossible causes,
     * runs safety audits, and formulates the agent's next technician response.
     */
    static processDiagnosticStep(session: IDiagnosticSession, userMessage: string): Promise<AgentDiagnosticResult>;
    /**
     * Evaluates chat history to determine what phase of diagnosis the technician is on.
     */
    private static determineCurrentPhase;
    /**
     * Phase 1: Greet the user, acknowledge symptoms, and start details collection. (Never immediately answer)
     */
    private static handleUnderstandingSymptoms;
    /**
     * Phase 2: Eliminate impossible causes based on answers, and recommend a physical inspection.
     */
    private static handleGatheringDetails;
    /**
     * Phase 3: Receive inspection results and prepare root cause findings.
     */
    private static handleInspection;
    /**
     * Phase 4: Find root cause, calculate confidence scores, and display citations.
     */
    private static handleRootCause;
    /**
     * Phase 5: Suggest repair instructions, estimate costs, request spare parts, and run Safety checks.
     */
    private static handleRepairRecommendation;
    /**
     * Safety Agent validation: scans steps and inserts explicit safety alerts if high risks are detected.
     */
    private static runSafetyValidator;
}
export default AIAgentService;
