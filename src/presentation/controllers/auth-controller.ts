import { Request, Response, NextFunction } from 'express';
import UserModel from '../../infrastructure/models/user-model';
import CompanyModel from '../../infrastructure/models/company-model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../core/utils/jwt';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../core/errors/app-error';
import { UserRole } from '../../core/constants/roles';
import { cache } from '../../config/redis';
import { AuthenticatedRequest } from '../../core/middlewares/auth-middleware';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, companyId, companyName, domain } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email address is already registered');
    }

    let assignedCompanyId = companyId;

    // Standard Tenant onboarding: if role is Company and company details are supplied
    if (role === UserRole.COMPANY && companyName && domain) {
      const existingCompany = await CompanyModel.findOne({ name: companyName });
      if (existingCompany) {
        throw new ConflictError('Company name already exists');
      }

      const newCompany = await CompanyModel.create({
        name: companyName,
        domain,
      });
      assignedCompanyId = newCompany._id;
    }

    // Ensure company is linked for engineers
    if (role === UserRole.SERVICE_ENGINEER && !assignedCompanyId) {
      throw new BadRequestError('Service Engineers must be associated with a Company');
    }

    const newUser = await UserModel.create({
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
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Fetch user and explicitly select password field
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload = {
      userId: user.id,
      role: user.role,
      companyId: user.companyId?.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save active refresh token in cache for revocation capabilities
    await cache.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days

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
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify refresh token still exists in Cache
    const cachedToken = await cache.get(`refresh_token:${decoded.userId}`);
    if (!cachedToken || cachedToken !== refreshToken) {
      throw new UnauthorizedError('Session expired or revoked');
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    const payload = {
      userId: user.id,
      role: user.role,
      companyId: user.companyId?.toString(),
      email: user.email,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Rotate refresh token
    await cache.set(`refresh_token:${user.id}`, newRefreshToken, 7 * 24 * 60 * 60);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    let decoded;

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new BadRequestError('Invalid refresh token');
    }

    // Delete session token in cache
    await cache.del(`refresh_token:${decoded.userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId;

    const user = await UserModel.findById(userId).populate('companyId');
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
