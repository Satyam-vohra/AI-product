import { Schema, model, Document } from 'mongoose';
import { SubscriptionPlan } from '../../core/constants/roles';

export interface ICompany extends Document {
  name: string;
  domain: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Company domain is required'],
      trim: true,
    },
    subscriptionPlan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.FREE,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize domains searches
companySchema.index({ domain: 1 });

export const CompanyModel = model<ICompany>('Company', companySchema);
export default CompanyModel;
