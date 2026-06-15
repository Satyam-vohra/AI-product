import { Schema, Document } from 'mongoose';
export interface IUserMemory extends Document {
    userId: Schema.Types.ObjectId;
    key: string;
    value: any;
    namespace?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const MemoryModel: import("mongoose").Model<IUserMemory, {}, {}, {}, Document<unknown, {}, IUserMemory, {}, {}> & IUserMemory & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default MemoryModel;
