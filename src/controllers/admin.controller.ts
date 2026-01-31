import { NextFunction, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

/**
 * Listar restaurantes pendentes de aprovação
 */
export const listPendingRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isApproved: false },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(restaurants);
  } catch (error) {
    next(error);
  }
};

/**
 * Aprovar um restaurante
 */
export const approveRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };


    const restaurant = await prisma.restaurant.findUnique({
      where: { id }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: { isApproved: true }
    });

    // Notificar o restaurante (opcional, mas recomendado)
    await prisma.notification.create({
      data: {
        userId: restaurant.id,
        userType: 'restaurant',
        type: 'NEW_ORDER', // Poderia ser um tipo novo como ACCOUNT_APPROVED
        title: 'Sua conta foi aprovada! 🎉',
        message: 'Agora você já pode criar ofertas e gerenciar seu perfil.',
        relatedId: restaurant.id
      }
    });

    res.json({
      message: 'Restaurante aprovado com sucesso',
      restaurant: updatedRestaurant
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listPendingRestaurants,
  approveRestaurant
};
