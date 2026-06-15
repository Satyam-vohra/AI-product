import { logger } from '../../core/utils/logger';

export class VoiceService {
  /**
   * Very small stub for speech-to-text. In production, wire to deep speech, Whisper, or cloud STT.
   */
  public static async transcribeAudio(buffer: Buffer, language = 'en-US') {
    logger.info(`Voice Transcription - lightweight stub for language ${language}`);
    // naive detection: if buffer contains ASCII text then return it
    try {
      const maybe = buffer.toString('utf-8');
      if (maybe && maybe.length > 20) return { transcript: maybe.slice(0, 1000), language };
    } catch (err) {
      // ignore
    }
    return { transcript: 'Audio received; transcription not available in offline mode.', language };
  }
}

export default VoiceService;
