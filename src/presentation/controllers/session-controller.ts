import { Request, Response, NextFunction } from 'express';
import DiagnosticSessionModel from '../../infrastructure/models/session-model';
import ProductModel from '../../infrastructure/models/product-model';
import UserModel from '../../infrastructure/models/user-model';
import AIAgentService from '../../application/services/ai-agent-service';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../core/errors/app-error';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';
import { UserRole, ResolutionStatus } from '../../core/constants/roles';

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;
    const { productId } = req.body;

    let productName = 'general diagnostics';
    if (productId) {
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      productName = product.name;
    }

    const sessionData: Record<string, unknown> = {
      userId,
      chatHistory: [
        {
          sender: 'ai',
          message: productId
            ? `Hello! I am Mantis AI Diagnostic agent for the **${productName}**. How can I help you troubleshoot today?`
            : `Hello! I am Mantis AI Diagnostic agent. Describe the symptom, error code, or component you want to troubleshoot.`,
          timestamp: new Date(),
        },
      ],
      resolutionStatus: ResolutionStatus.OPEN,
    };
    if (productId) sessionData.productId = productId;

    const session = await DiagnosticSessionModel.create(sessionData);

    res.status(201).json({
      status: 'success',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const { userId, role, companyId } = authReq.user!;

    const session = await DiagnosticSessionModel.findById(id)
      .populate('productId', 'sku name companyId')
      .populate('userId', 'name email')
      .populate('assignedEngineerId', 'name email');

    if (!session) {
      throw new NotFoundError('Diagnostic session not found');
    }

    // Role check: User owns session, Admin, or Company/Engineer linked to the product's company
    const product = session.productId as any;
    const ownsSession = (session.userId as any)._id?.toString() === userId || session.userId.toString() === userId;
    const companyMatches = product && product.companyId.toString() === companyId;
    const isEngineerAssigned = session.assignedEngineerId && (session.assignedEngineerId as any)._id?.toString() === userId;

    if (
      role !== UserRole.ADMIN &&
      !ownsSession &&
      !(role === UserRole.COMPANY && companyMatches) &&
      !(role === UserRole.SERVICE_ENGINEER && (companyMatches || isEngineerAssigned))
    ) {
      throw new ForbiddenError('You are not authorized to view this diagnostic session');
    }

    res.status(200).json({
      status: 'success',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessageToSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, contextPart } = req.body;
    const authReq = req as AuthenticatedRequest;
    const { userId, role } = authReq.user!;

    const session = await DiagnosticSessionModel.findById(id);
    if (!session) {
      throw new NotFoundError('Diagnostic session not found');
    }

    if (session.userId.toString() !== userId && role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only the session initiator can send chat messages');
    }

    if (session.resolutionStatus === ResolutionStatus.RESOLVED) {
      throw new BadRequestError('Cannot send message to a resolved session. Please open a new session.');
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
    } else {
      const contextAwareMessage = contextPart
        ? `${message}\nFocused component: ${contextPart}`
        : message;
      const agentResult = await AIAgentService.processDiagnosticStep(session, contextAwareMessage);
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
  } catch (error) {
    next(error);
  }
};

export const assignServiceEngineer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { engineerId } = req.body;
    const authReq = req as AuthenticatedRequest;
    const companyId = authReq.user?.companyId;

    const session = await DiagnosticSessionModel.findById(id).populate({
      path: 'productId',
      select: 'companyId',
    });

    if (!session) {
      throw new NotFoundError('Diagnostic session not found');
    }

    // Verify ownership
    const product = session.productId as any;
    if (authReq.user?.role !== UserRole.ADMIN && product.companyId.toString() !== companyId) {
      throw new ForbiddenError('You can only assign technicians to sessions for your products');
    }

    // Verify target engineer exists and belongs to the company
    const engineer = await UserModel.findById(engineerId);
    if (!engineer || engineer.role !== UserRole.SERVICE_ENGINEER) {
      throw new BadRequestError('Assigned user must be a registered Service Engineer');
    }

    if (authReq.user?.role !== UserRole.ADMIN && engineer.companyId?.toString() !== companyId) {
      throw new ForbiddenError('Service Engineer must belong to your company');
    }

    session.assignedEngineerId = engineer._id as any;
    session.resolutionStatus = ResolutionStatus.PENDING; // Shift status to Pending (Technician review required)
    
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
  } catch (error) {
    next(error);
  }
};

export const updateSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const authReq = req as AuthenticatedRequest;
    const { userId, role, companyId } = authReq.user!;

    const session = await DiagnosticSessionModel.findById(id).populate({
      path: 'productId',
      select: 'companyId',
    });

    if (!session) {
      throw new NotFoundError('Diagnostic session not found');
    }

    // Security check
    const product = session.productId as any;
    const ownsSession = session.userId.toString() === userId;
    const companyMatches = product && product.companyId.toString() === companyId;
    const isAssigned = session.assignedEngineerId?.toString() === userId;

    if (
      role !== UserRole.ADMIN &&
      !ownsSession &&
      !(role === UserRole.COMPANY && companyMatches) &&
      !(role === UserRole.SERVICE_ENGINEER && isAssigned)
    ) {
      throw new ForbiddenError('You do not have permission to update status of this session');
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
  } catch (error) {
    next(error);
  }
};

export const getUserSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    const sessions = await DiagnosticSessionModel.find({ userId })
      .populate('productId', 'sku name category imageUrls')
      .populate('assignedEngineerId', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanySessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { companyId, role, userId } = authReq.user!;

    if (!companyId && role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only company representatives can view company-wide sessions');
    }

    // Find products belonging to company
    const products = await ProductModel.find({ companyId });
    const productIds = products.map((p) => p._id);

    const query: any = { productId: { $in: productIds } };

    // If Service Engineer, they can optionally filter or view only assigned sessions
    if (role === UserRole.SERVICE_ENGINEER) {
      query.assignedEngineerId = userId;
    }

    const sessions = await DiagnosticSessionModel.find(query)
      .populate('productId', 'sku name category')
      .populate('userId', 'name email')
      .populate('assignedEngineerId', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};
