import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';

const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
});

// RF-09: Criar avaliação
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumerId = (req as any).user.id;
    const data = createReviewSchema.parse(req.body);

    // Verificar se o pedido pertence ao consumidor e está concluído
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        consumerId,
        status: 'COMPLETED'
      },
      include: {
        review: true
      }
    });

    if (!order) {
      return res.status(404).json({ 
        error: 'Pedido não encontrado ou não está concluído' 
      });
    }

    if (order.review) {
      return res.status(400).json({ 
        error: 'Pedido já foi avaliado' 
      });
    }

    // Criar avaliação
    const review = await prisma.review.create({
      data: {
        orderId: data.orderId,
        consumerId,
        restaurantId: order.restaurantId,
        rating: data.rating,
        comment: data.comment
      }
    });

    // RN-10: Atualizar média do restaurante
    const reviews = await prisma.review.findMany({
      where: { restaurantId: order.restaurantId }
    });

    const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const totalRatings = reviews.length;

    await prisma.restaurant.update({
      where: { id: order.restaurantId },
      data: {
        averageRating,
        totalRatings
      }
    });

    // Verificar se restaurante precisa de revisão (média < 3.0 após 10 vendas)
    if (totalRatings >= 10 && averageRating < 3.0) {
      await prisma.notification.create({
        data: {
          userId: order.restaurantId,
          userType: 'restaurant',
          type: 'ORDER_CANCELLED', // Usar como alerta geral
          title: 'Atenção: Avaliação Baixa',
          message: `Sua avaliação média está em ${averageRating.toFixed(1)}. Seu cadastro entrará em revisão.`,
          relatedId: order.restaurantId
        }
      });
    }

    res.status(201).json(review);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error});
    }
    next(error);
  }
};

// Obter avaliações de um restaurante
export const getRestaurantReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (typeof restaurantId !== 'string') {
      return res.status(400).json({ error: 'ID do restaurante inválido' });
    }

    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      include: {
        consumer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.review.count({ where: { restaurantId } });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        averageRating: true,
        totalRatings: true
      }
    });

    res.json({
      reviews,
      summary: restaurant,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    next(error);
  }
};

// Obter minhas avaliações
export const getMyReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumerId = (req as any).user.id;

    const reviews = await prisma.review.findMany({
      where: { consumerId },
      include: {
        order: {
          include: {
            offer: {
              include: {
                restaurant: {
                  select: {
                    name: true,
                    address: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);

  } catch (error) {
    next(error);
  }
};

export default {
  createReview,
  getRestaurantReviews,
  getMyReviews
};