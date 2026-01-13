import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';


// Validação Zod
const registerSchema = z.object({
  cnpj: z.string().length(14),
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(10),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  businessHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string(),
    closeTime: z.string(),
    isOpen: z.boolean()
  }))
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// RF-01: Cadastro de Restaurante
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // Verifica se CNPJ já existe
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { cnpj: data.cnpj },
          { email: data.email }
        ]
      }
    });

    if (existingRestaurant) {
      return res.status(400).json({
        error: 'CNPJ ou e-mail já cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Cria restaurante com horários
    const restaurant = await prisma.restaurant.create({
      data: {
        cnpj: data.cnpj,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        isApproved: false, // Aguarda validação
        businessHours: {
          create: data.businessHours
        }
      },
      include: {
        businessHours: true
      }
    });

    // Remove senha da resposta
    const { password, ...restaurantWithoutPassword } = restaurant;

    res.status(201).json({
      message: 'Restaurante cadastrado com sucesso. Aguardando aprovação.',
      restaurant: restaurantWithoutPassword
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error });
    }
    next(error);
  }
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const restaurant = await prisma.restaurant.findUnique({
      where: { email },
      include: { businessHours: true }
    });

    if (!restaurant) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!restaurant.isApproved) {
      return res.status(403).json({ error: 'Cadastro aguardando aprovação' });
    }

    if (!restaurant.isActive) {
      return res.status(403).json({ error: 'Conta desativada' });
    }

    const isValidPassword = await bcrypt.compare(password, restaurant.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: restaurant.id, type: 'restaurant' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password: _, ...restaurantWithoutPassword } = restaurant;

    res.json({
      token,
      restaurant: restaurantWithoutPassword
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error});
    }
    next(error);
  }
};

// Obter perfil do restaurante
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        businessHours: true,
        offers: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }

    const { password, ...restaurantWithoutPassword } = restaurant;

    res.json(restaurantWithoutPassword);

  } catch (error) {
    next(error);
  }
};

// Atualizar perfil
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;
    const { name, phone, address, latitude, longitude, businessHours } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
      include: { businessHours: true }
    });

    // Atualiza horários se fornecido
    if (businessHours && Array.isArray(businessHours)) {
      await prisma.businessHours.deleteMany({
        where: { restaurantId }
      });

      await prisma.businessHours.createMany({
        data: businessHours.map((bh: any) => ({
          ...bh,
          restaurantId
        }))
      });
    }

    const { password, ...restaurantWithoutPassword } = restaurant;

    res.json(restaurantWithoutPassword);

  } catch (error) {
    next(error);
  }
};

// RF-12: Histórico de vendas
export const getSalesHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;
    const { startDate, endDate, status } = req.query;

    const where: any = { restaurantId };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.$queryRaw`
      SELECT 
        DATE(o."createdAt") as date,
        COUNT(*)::int as total_orders,
        SUM(o."totalAmount")::float as revenue,
        SUM(o."restaurantAmount")::float as net_revenue,
        SUM(o."platformFee")::float as fees
      FROM orders o
      WHERE o."restaurantId" = ${restaurantId}
        AND o.status IN ('COMPLETED', 'READY_FOR_PICKUP')
      GROUP BY DATE(o."createdAt")
      ORDER BY date DESC
    `;

    const summary = await prisma.order.aggregate({
      where: {
        restaurantId,
        status: { in: ['COMPLETED', 'READY_FOR_PICKUP'] }
      },
      _sum: {
        totalAmount: true,
        restaurantAmount: true,
        platformFee: true
      },
      _count: true
    });

    res.json({
      daily: orders,
      summary: {
        totalOrders: summary._count,
        totalRevenue: summary._sum.totalAmount || 0,
        netRevenue: summary._sum.restaurantAmount || 0,
        totalFees: summary._sum.platformFee || 0
      }
    });

  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  getSalesHistory
};