"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyModel = void 0;
const mongoose_1 = require("mongoose");
const roles_1 = require("../../core/constants/roles");
const companySchema = new mongoose_1.Schema({
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
        enum: Object.values(roles_1.SubscriptionPlan),
        default: roles_1.SubscriptionPlan.FREE,
    },
}, {
    timestamps: true,
});
// Optimize domains searches
companySchema.index({ domain: 1 });
exports.CompanyModel = (0, mongoose_1.model)('Company', companySchema);
exports.default = exports.CompanyModel;
