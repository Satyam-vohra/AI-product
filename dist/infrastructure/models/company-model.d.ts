import { Document } from 'mongoose';
import { SubscriptionPlan } from '../../core/constants/roles';
export interface ICompany extends Document {
    name: string;
    domain: string;
    subscriptionPlan: SubscriptionPlan;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CompanyModel: import("mongoose").Model<ICompany, {}, {}, {}, Document<unknown, {}, ICompany, {}, {}> & ICompany & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default CompanyModel;
