import { Schema, Document } from 'mongoose';
import { UserRole } from '../../core/constants/roles';
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    companyId?: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const UserModel: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default UserModel;
