import { Router } from 'express';
import reviewController from '../controllers/review.controller.js';
import { authenticate, isConsumer } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Protegidas
/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Avaliar um pedido concluído
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, rating]
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Avaliação criada
 */
router.post('/', authenticate, isConsumer, reviewController.createReview);
router.get('/my-reviews', authenticate, isConsumer, reviewController.getMyReviews);

export default router;
