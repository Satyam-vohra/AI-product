import multer from 'multer';
export declare const upload: multer.Multer;
export interface UploadResult {
    url: string;
    publicId: string;
    bytes: number;
    format: string;
}
export declare const uploadToCloudinary: (fileBuffer: Buffer, folder: string, originalName: string) => Promise<UploadResult>;
