"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const logger_1 = require("../../core/utils/logger");
class PDFService {
    /**
     * Lightweight PDF text extractor placeholder. If a real PDF parser is available,
     * replace implementation with `pdf-parse` or similar.
     */
    static async extractText(buffer, fileName = 'document.pdf') {
        logger_1.logger.info(`PDF Parser - extracting text for ${fileName}`);
        try {
            // naive fallback: attempt to decode as utf-8
            const txt = buffer.toString('utf-8');
            if (txt && txt.length > 50)
                return txt;
        }
        catch (err) {
            // ignore
        }
        // default placeholder
        return `PDF document ${fileName} ingested. Content extraction unavailable in this environment.`;
    }
}
exports.PDFService = PDFService;
exports.default = PDFService;
