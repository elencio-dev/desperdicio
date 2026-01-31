import { NextFunction, Request, Response } from 'express';
import prisma from '../utils/prisma.js';

// Obter notificações do usuário autenticado
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Buscar perfil (Restaurante ou Consumidor)
    const restaurant = await prisma.restaurant.findUnique({ where: { userId: user.id } });
    const consumer = await prisma.consumer.findUnique({ where: { userId: user.id } });

    const profileId = restaurant?.id || consumer?.id;

    if (!profileId) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: profileId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// Marcar uma notificação como lida
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({ where: { userId: user.id } });
    const consumer = await prisma.consumer.findUnique({ where: { userId: user.id } });
    const profileId = restaurant?.id || consumer?.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: profileId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Marcar todas como lidas
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    const restaurant = await prisma.restaurant.findUnique({ where: { userId: user.id } });
    const consumer = await prisma.consumer.findUnique({ where: { userId: user.id } });
    const profileId = restaurant?.id || consumer?.id;

    await prisma.notification.updateMany({
      where: { userId: profileId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });
  } catch (error) {
    next(error);
  }
};

// Excluir notificação
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({ where: { userId: user.id } });
    const consumer = await prisma.consumer.findUnique({ where: { userId: user.id } });
    const profileId = restaurant?.id || consumer?.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: profileId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notificação excluída com sucesso' });
  } catch (error) {
    next(error);
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
