"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanySessions = exports.getUserSessions = exports.updateSessionStatus = exports.assignServiceEngineer = exports.sendMessageToSession = exports.getSessionById = exports.createSession = void 0;
const session_model_1 = __importDefault(require("../../infrastructure/models/session-model"));
const product_model_1 = __importDefault(require("../../infrastructure/models/product-model"));
const user_model_1 = __importDefault(require("../../infrastructure/models/user-model"));
const ai_agent_service_1 = __importDefault(require("../../application/services/ai-agent-service"));
const app_error_1 = require("../../core/errors/app-error");
const roles_1 = require("../../core/constants/roles");
const createSession = async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        const { productId } = req.body;
        const product = await product_model_1.default.findById(productId);
        if (!product) {
            throw new app_error_1.NotFoundError('Product not found');
        }
        const session = await session_model_1.default.create({
            userId,
            productId,
            chatHistory: [
                {
                    sender: 'ai',
                    message: `Hello! I am Mantis AI Diagnostic agent for the **${product.name}**. How can I help you troubleshoot today?`,
                    timestamp: new Date(),
                },
            ],
            resolutionStatus: roles_1.ResolutionStatus.OPEN,
        });
        res.status(201).json({
            status: 'success',
            data: { session },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createSession = createSession;
const getSessionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const authReq = req;
        const { userId, role, companyId } = authReq.user;
        const session = await session_model_1.default.findById(id)
            .populate('productId', 'sku name companyId')
            .populate('userId', 'name email')
            .populate('assignedEngineerId', 'name email');
        if (!session) {
            throw new app_error_1.NotFoundError('Diagnostic session not found');
        }
        // Role check: User owns session, Admin, or Company/Engineer linked to the product's company
        const product = session.productId;
        const ownsSession = session.userId._id?.toString() === userId || session.userId.toString() === userId;
        const companyMatches = product && product.companyId.toString() === companyId;
        const isEngineerAssigned = session.assignedEngineerId && session.assignedEngineerId._id?.toString() === userId;
        if (role !== roles_1.UserRole.ADMIN &&
            !ownsSession &&
            !(role === roles_1.UserRole.COMPANY && companyMatches) &&
            !(role === roles_1.UserRole.SERVICE_ENGINEER && (companyMatches || isEngineerAssigned))) {
            throw new app_error_1.ForbiddenError('You are not authorized to view this diagnostic session');
        }
        res.status(200).json({
            status: 'success',
            data: { session },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionById = getSessionById;
const sendMessageToSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const authReq = req;
        const { userId, role } = authReq.user;
        const session = await session_model_1.default.findById(id);
        if (!session) {
            throw new app_error_1.NotFoundError('Diagnostic session not found');
        }
        if (session.userId.toString() !== userId && role !== roles_1.UserRole.ADMIN) {
            throw new app_error_1.ForbiddenError('Only the session initiator can send chat messages');
        }
        if (session.resolutionStatus === roles_1.ResolutionStatus.RESOLVED) {
            throw new app_error_1.BadRequestError('Cannot send message to a resolved session. Please open a new session.');
        }
        // Append user message
        session.chatHistory.push({
            sender: 'user',
            message,
            timestamp: new Date(),
        });
        // Determine sender responder. Default is AI diagnostic response.
        // If a service engineer is assigned, AI acts as a backup system.
        let aiResponse = '';
        if (session.assignedEngineerId) {
            aiResponse = "A technician has been assigned to this ticket and will review the diagnostic log shortly.";
        }
        else {
            const agentResult = await ai_agent_service_1.default.processDiagnosticStep(session, message);
            aiResponse = agentResult.nextMessage;
        }
        session.chatHistory.push({
            sender: 'ai',
            message: aiResponse,
            timestamp: new Date(),
        });
        await session.save();
        res.status(200).json({
            status: 'success',
            data: {
                chatHistory: session.chatHistory,
                resolutionStatus: session.resolutionStatus,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendMessageToSession = sendMessageToSession;
const assignServiceEngineer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { engineerId } = req.body;
        const authReq = req;
        const companyId = authReq.user?.companyId;
        const session = await session_model_1.default.findById(id).populate({
            path: 'productId',
            select: 'companyId',
        });
        if (!session) {
            throw new app_error_1.NotFoundError('Diagnostic session not found');
        }
        // Verify ownership
        const product = session.productId;
        if (authReq.user?.role !== roles_1.UserRole.ADMIN && product.companyId.toString() !== companyId) {
            throw new app_error_1.ForbiddenError('You can only assign technicians to sessions for your products');
        }
        // Verify target engineer exists and belongs to the company
        const engineer = await user_model_1.default.findById(engineerId);
        if (!engineer || engineer.role !== roles_1.UserRole.SERVICE_ENGINEER) {
            throw new app_error_1.BadRequestError('Assigned user must be a registered Service Engineer');
        }
        if (authReq.user?.role !== roles_1.UserRole.ADMIN && engineer.companyId?.toString() !== companyId) {
            throw new app_error_1.ForbiddenError('Service Engineer must belong to your company');
        }
        session.assignedEngineerId = engineer._id;
        session.resolutionStatus = roles_1.ResolutionStatus.PENDING; // Shift status to Pending (Technician review required)
        // Add system message to history
        session.chatHistory.push({
            sender: 'agent',
            message: `System: Service Engineer **${engineer.name}** has been assigned to this diagnostic session.`,
            timestamp: new Date(),
        });
        await session.save();
        res.status(200).json({
            status: 'success',
            message: 'Service Engineer assigned successfully',
            data: { session },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignServiceEngineer = assignServiceEngineer;
const updateSessionStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const authReq = req;
        const { userId, role, companyId } = authReq.user;
        const session = await session_model_1.default.findById(id).populate({
            path: 'productId',
            select: 'companyId',
        });
        if (!session) {
            throw new app_error_1.NotFoundError('Diagnostic session not found');
        }
        // Security check
        const product = session.productId;
        const ownsSession = session.userId.toString() === userId;
        const companyMatches = product && product.companyId.toString() === companyId;
        const isAssigned = session.assignedEngineerId?.toString() === userId;
        if (role !== roles_1.UserRole.ADMIN &&
            !ownsSession &&
            !(role === roles_1.UserRole.COMPANY && companyMatches) &&
            !(role === roles_1.UserRole.SERVICE_ENGINEER && isAssigned)) {
            throw new app_error_1.ForbiddenError('You do not have permission to update status of this session');
        }
        session.resolutionStatus = status;
        session.chatHistory.push({
            sender: 'agent',
            message: `System: Diagnostic session status updated to **${status}**.`,
            timestamp: new Date(),
        });
        await session.save();
        res.status(200).json({
            status: 'success',
            message: 'Status updated successfully',
            data: { session },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSessionStatus = updateSessionStatus;
const getUserSessions = async (req, res, next) => {
    try {
        const authReq = req;
        const userId = authReq.user?.userId;
        const sessions = await session_model_1.default.find({ userId })
            .populate('productId', 'sku name category imageUrls')
            .populate('assignedEngineerId', 'name email')
            .sort({ updatedAt: -1 });
        res.status(200).json({
            status: 'success',
            data: { sessions },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserSessions = getUserSessions;
const getCompanySessions = async (req, res, next) => {
    try {
        const authReq = req;
        const { companyId, role, userId } = authReq.user;
        if (!companyId && role !== roles_1.UserRole.ADMIN) {
            throw new app_error_1.ForbiddenError('Only company representatives can view company-wide sessions');
        }
        // Find products belonging to company
        const products = await product_model_1.default.find({ companyId });
        const productIds = products.map((p) => p._id);
        const query = { productId: { $in: productIds } };
        // If Service Engineer, they can optionally filter or view only assigned sessions
        if (role === roles_1.UserRole.SERVICE_ENGINEER) {
            query.assignedEngineerId = userId;
        }
        const sessions = await session_model_1.default.find(query)
            .populate('productId', 'sku name category')
            .populate('userId', 'name email')
            .populate('assignedEngineerId', 'name email')
            .sort({ updatedAt: -1 });
        res.status(200).json({
            status: 'success',
            data: { sessions },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCompanySessions = getCompanySessions;
