"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const user_model_1 = __importDefault(require("../../infrastructure/models/user-model"));
const company_model_1 = __importDefault(require("../../infrastructure/models/company-model"));
const jwt_1 = require("../../core/utils/jwt");
const app_error_1 = require("../../core/errors/app-error");
const roles_1 = require("../../core/constants/roles");
const redis_1 = require("../../config/redis");
const register = async (req, res, next) => {
    try {
        const { name, email, password, role, companyId, companyName, domain } = req.body;
        // Check if user already exists
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            throw new app_error_1.ConflictError('Email address is already registered');
        }
        let assignedCompanyId = companyId;
        // Standard Tenant onboarding: if role is Company and company details are supplied
        if (role === roles_1.UserRole.COMPANY && companyName && domain) {
            const existingCompany = await company_model_1.default.findOne({ name: companyName });
            if (existingCompany) {
                throw new app_error_1.ConflictError('Company name already exists');
            }
            const newCompany = await company_model_1.default.create({
                name: companyName,
                domain,
            });
            assignedCompanyId = newCompany._id;
        }
        // Ensure company is linked for engineers
        if (role === roles_1.UserRole.SERVICE_ENGINEER && !assignedCompanyId) {
            throw new app_error_1.BadRequestError('Service Engineers must be associated with a Company');
        }
        const newUser = await user_model_1.default.create({
            name,
            email,
            password,
            role,
            companyId: assignedCompanyId,
        });
        const userResponse = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            companyId: newUser.companyId,
        };
        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: { user: userResponse },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Fetch user and explicitly select password field
        const user = await user_model_1.default.findOne({ email }).select('+password');
        if (!user) {
            throw new app_error_1.UnauthorizedError('Invalid email or password');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new app_error_1.UnauthorizedError('Invalid email or password');
        }
        const payload = {
            userId: user.id,
            role: user.role,
            companyId: user.companyId?.toString(),
            email: user.email,
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        // Save active refresh token in cache for revocation capabilities
        await redis_1.cache.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        };
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: userResponse,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        let decoded;
        try {
            decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch (err) {
            throw new app_error_1.UnauthorizedError('Invalid or expired refresh token');
        }
        // Verify refresh token still exists in Cache
        const cachedToken = await redis_1.cache.get(`refresh_token:${decoded.userId}`);
        if (!cachedToken || cachedToken !== refreshToken) {
            throw new app_error_1.UnauthorizedError('Session expired or revoked');
        }
        const user = await user_model_1.default.findById(decoded.userId);
        if (!user) {
            throw new app_error_1.UnauthorizedError('User no longer exists');
        }
        const payload = {
            userId: user.id,
            role: user.role,
            companyId: user.companyId?.toString(),
            email: user.email,
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(payload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(payload);
        // Rotate refresh token
        await redis_1.cache.set(`refresh_token:${user.id}`, newRefreshToken, 7 * 24 * 60 * 60);
        res.status(200).json({
            status: 'success',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refresh = refresh;
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        let decoded;
        try {
            decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch {
            throw new app_error_1.BadRequestError('Invalid refresh token');
        }
        // Delete session token in cache
        await redis_1.cache.del(`refresh_token:${decoded.userId}`);
        res.status(200).json({
            status: 'success',
            message: 'Logout successful',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const getProfile = async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        const user = await user_model_1.default.findById(userId).populate('companyId');
        if (!user) {
            throw new app_error_1.UnauthorizedError('User not found');
        }
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
