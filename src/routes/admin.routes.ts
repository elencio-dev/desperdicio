import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Todas as rotas de admin exigem autenticação e papel de ADMIN
router.use(authenticate, isAdmin);

/**
 * @swagger
 * /api/admin/restaurants/pending:
 *   get:
 *     summary: Lista restaurantes pendentes de aprovação
 *     tags: [Admin]
 */
router.get('/restaurants/pending', adminController.listPendingRestaurants);

/**
 * @swagger
 * /api/admin/restaurants/{id}/approve:
 *   post:
 *     summary: Aprova um restaurante
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/restaurants/:id/approve', adminController.approveRestaurant);

export default router;
