"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const roles_1 = require("../../core/constants/roles");
const userSchema = new mongoose_1.Schema({
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
        enum: Object.values(roles_1.UserRole),
        default: roles_1.UserRole.USER,
    },
    companyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: function () {
            // Company and Service Engineers require a company assignment
            return this.role === roles_1.UserRole.COMPANY || this.role === roles_1.UserRole.SERVICE_ENGINEER;
        },
    },
}, {
    timestamps: true,
});
// Indexes
// `email` is marked `unique` on the field; avoid duplicate schema.index declaration.
userSchema.index({ companyId: 1 });
// Password hashing hook
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
exports.default = exports.UserModel;
