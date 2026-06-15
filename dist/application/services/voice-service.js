"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceService = void 0;
const logger_1 = require("../../core/utils/logger");
class VoiceService {
    /**
     * Very small stub for speech-to-text. In production, wire to deep speech, Whisper, or cloud STT.
     */
    static async transcribeAudio(buffer, language = 'en-US') {
        logger_1.logger.info(`Voice Transcription - lightweight stub for language ${language}`);
        // naive detection: if buffer contains ASCII text then return it
        try {
            const maybe = buffer.toString('utf-8');
            if (maybe && maybe.length > 20)
                return { transcript: maybe.slice(0, 1000), language };
        }
        catch (err) {
            // ignore
        }
        return { transcript: 'Audio received; transcription not available in offline mode.', language };
    }
}
exports.VoiceService = VoiceService;
exports.default = VoiceService;
