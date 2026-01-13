import prisma from "../utils/prisma";
import { Request, Response, NextFunction } from 'express'

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const where: any = {
      userId: user.id,
      userType: user.type
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        userType: user.type,
        isRead: false
      }
    });

    res.json({
      notifications,
      unreadCount,
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

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params as { id: string };;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
        userType: user.type
      }
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

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        userType: user.type,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'Todas as notificações foram marcadas como lidas' });

  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params as { id: string };;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
        userType: user.type
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notificação deletada com sucesso' });

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