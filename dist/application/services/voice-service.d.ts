export declare class VoiceService {
    /**
     * Very small stub for speech-to-text. In production, wire to deep speech, Whisper, or cloud STT.
     */
    static transcribeAudio(buffer: Buffer, language?: string): Promise<{
        transcript: string;
        language: string;
    }>;
}
export default VoiceService;
