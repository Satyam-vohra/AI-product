import { Schema, Document } from 'mongoose';
import { ResolutionStatus } from '../../core/constants/roles';
export interface IChatMessage {
    sender: 'user' | 'ai' | 'agent';
    message: string;
    timestamp: Date;
}
export interface IDiagnosticSession extends Document {
    userId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    chatHistory: IChatMessage[];
    resolutionStatus: ResolutionStatus;
    assignedEngineerId?: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DiagnosticSessionModel: import("mongoose").Model<IDiagnosticSession, {}, {}, {}, Document<unknown, {}, IDiagnosticSession, {}, {}> & IDiagnosticSession & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default DiagnosticSessionModel;
