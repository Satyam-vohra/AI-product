import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
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

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: function (this: any) {
        // Company and Service Engineers require a company assignment
        return this.role === UserRole.COMPANY || this.role === UserRole.SERVICE_ENGINEER;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// `email` is marked `unique` on the field; avoid duplicate schema.index declaration.
userSchema.index({ companyId: 1 });

// Password hashing hook
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = model<IUser>('User', userSchema);
export default UserModel;
