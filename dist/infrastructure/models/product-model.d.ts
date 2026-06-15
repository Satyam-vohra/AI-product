import { Schema, Document } from 'mongoose';
export interface IProduct extends Document {
    sku: string;
    name: string;
    category: string;
    companyId: Schema.Types.ObjectId;
    description: string;
    manualUrl?: string;
    imageUrls: string[];
    specifications: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ProductModel: import("mongoose").Model<IProduct, {}, {}, {}, Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default ProductModel;
