"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = void 0;
const session_model_1 = __importDefault(require("../../infrastructure/models/session-model"));
const getNotifications = async (req, res, next) => {
    try {
        const authReq = req;
        const { userId, role } = authReq.user;
        // Compile dynamic notifications based on active diagnostic sessions
        const activeSessions = await session_model_1.default.find({ userId })
            .populate('productId', 'name')
            .populate('assignedEngineerId', 'name')
            .sort({ updatedAt: -1 })
            .limit(10);
        const notifications = activeSessions.map((session, idx) => {
            const prod = session.productId;
            const eng = session.assignedEngineerId;
            if (session.assignedEngineerId && idx === 0) {
                return {
                    id: `notif_${session._id}_eng`,
                    title: 'Technician Assigned',
                    message: `Service Engineer ${eng.name} has been assigned to help diagnose your ${prod ? prod.name : 'Device'}.`,
                    read: false,
                    createdAt: session.updatedAt,
                    type: 'ASSIGNMENT',
                    link: `/sessions/${session._id}`,
                };
            }
            return {
                id: `notif_${session._id}_status`,
                title: 'Diagnostic Ticket Update',
                message: `Your session for ${prod ? prod.name : 'Device'} is currently marked: ${session.resolutionStatus}.`,
                read: true,
                createdAt: session.updatedAt,
                type: 'STATUS_UPDATE',
                link: `/sessions/${session._id}`,
            };
        });
        res.status(200).json({
            status: 'success',
            data: { notifications },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
