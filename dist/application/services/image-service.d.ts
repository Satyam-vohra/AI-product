export declare class ImageService {
    /**
     * Simple image diagnostic routine: runs OCR and looks for keywords.
     */
    static diagnoseImage(buffer: Buffer, fileName: string): Promise<{
        ocrText: string;
        findings: string[];
        summary: string;
    }>;
}
export default ImageService;
