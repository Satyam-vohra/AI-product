import { Schema, Document } from 'mongoose';
export interface IKnowledgeBase extends Document {
    title: string;
    content: string;
    tags: string[];
    embeddings?: number[];
    productId?: Schema.Types.ObjectId;
    companyId: Schema.Types.ObjectId;
    fileUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const KnowledgeBaseModel: import("mongoose").Model<IKnowledgeBase, {}, {}, {}, Document<unknown, {}, IKnowledgeBase, {}, {}> & IKnowledgeBase & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default KnowledgeBaseModel;
