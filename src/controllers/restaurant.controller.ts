import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { auth } from '../utils/auth.js';
import prisma from '../utils/prisma.js';


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

// RF-01: Cadastro de Restaurante
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // 1. Better Auth: Criar Usuário
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'RESTAURANT'
      }
    });

    if (!result || !result.user) {
      return res.status(400).json({ error: 'Erro ao criar conta de autenticação' });
    }

    // 2. Criar perfil do restaurante vinculado ao User
    try {
      const restaurant = await prisma.restaurant.create({
        data: {
          userId: result.user.id,
          cnpj: data.cnpj,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          isApproved: false,
          businessHours: {
            create: data.businessHours
          }
        },
        include: {
          businessHours: true
        }
      });

      res.status(201).json({
        message: 'Restaurante cadastrado com sucesso. Aguardando aprovação administrativa.',
        restaurant,
        session: 'session' in result ? result.session : null
      });

    } catch (profileError) {
      console.error('Erro ao criar perfil de restaurante:', profileError);
      return res.status(500).json({
        error: 'Conta criada, mas erro ao configurar perfil. Entre em contato com o suporte.',
        userId: result.user.id
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error });
    }
    next(error);
  }
};

// Obter perfil do restaurante
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id },
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

    res.json(restaurant);

  } catch (error) {
    next(error);
  }
};

// Esquema de atualização
const updateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  businessHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.string(),
    closeTime: z.string(),
    isOpen: z.boolean()
  })).optional()
});

// Atualizar perfil
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const data = updateProfileSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Atualizar dados do Restaurante
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.phone) updateData.phone = data.phone;
        if (data.address) updateData.address = data.address;
        if (data.latitude !== undefined) updateData.latitude = data.latitude;
        if (data.longitude !== undefined) updateData.longitude = data.longitude;

        const restaurant = await tx.restaurant.update({
            where: { userId: user.id },
            data: updateData
        });

        // 2. Atualizar nome no User (se mudou)
        if (data.name) {
            await tx.user.update({
                where: { id: user.id },
                data: { name: data.name }
            });
        }

        // 3. Atualizar horários (se fornecido)
        if (data.businessHours) {
            await tx.businessHours.deleteMany({
                where: { restaurantId: restaurant.id }
            });

            await tx.businessHours.createMany({
                data: data.businessHours.map((bh) => ({
                    ...bh,
                    restaurantId: restaurant.id
                }))
            });
        }

        return tx.restaurant.findUnique({
             where: { id: restaurant.id },
             include: { businessHours: true }
        });
    });

    res.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error });
    }
    next(error);
  }
};

// RF-12: Histórico de vendas
export const getSalesHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { startDate, endDate, status } = req.query;

    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }

    const restaurantId = restaurant.id;
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
  getProfile,
  updateProfile,
  getSalesHistory
};
