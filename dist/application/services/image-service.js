"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
const rag_service_1 = __importDefault(require("./rag-service"));
const logger_1 = require("../../core/utils/logger");
class ImageService {
    /**
     * Simple image diagnostic routine: runs OCR and looks for keywords.
     */
    static async diagnoseImage(buffer, fileName) {
        logger_1.logger.info(`Image Diagnosis - processing ${fileName}`);
        const ocr = await rag_service_1.default.performOCR(buffer, fileName);
        const findings = [];
        const lower = ocr.toLowerCase();
        if (lower.includes('compressor'))
            findings.push('Compressor temperature flags detected');
        if (lower.includes('voltage') || lower.includes('battery'))
            findings.push('Power subsystem irregularity reported');
        if (lower.includes('leak') || lower.includes('pressure'))
            findings.push('Pressure leak or valve anomaly detected');
        return {
            ocrText: ocr,
            findings,
            summary: findings.length ? findings.join('; ') : 'No clear hardware indicators found in image OCR',
        };
    }
}
exports.ImageService = ImageService;
exports.default = ImageService;
