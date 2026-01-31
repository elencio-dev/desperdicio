import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Todas protegidas
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Obter notificações do usuário
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get('/', authenticate, notificationController.getNotifications);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
