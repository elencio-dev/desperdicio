import { Router } from 'express';
import orderController from '../controllers/order.controller.js';
import { authenticate, isConsumer, isRestaurant } from '../middleware/auth.middleware.js';

const router = Router();

// Rotas do consumidor
/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Criar um novo pedido
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId]
 *             properties:
 *               offerId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 default: 1
 *               paymentMethod:
 *                 type: string
 *                 enum: [PIX, CREDIT_CARD, DEBIT_CARD]
 *     responses:
 *       201:
 *         description: Pedido criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, isConsumer, orderController.createOrder);
/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Listar pedidos do consumidor logado
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get('/my-orders', authenticate, isConsumer, orderController.getConsumerOrders);
/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancelar um pedido
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido cancelado
 */
router.post('/:id/cancel', authenticate, isConsumer, orderController.cancelOrder);

// Rotas do restaurante
/**
 * @swagger
 * /api/orders/validate-pickup:
 *   post:
 *     tags: [Orders]
 *     summary: Validar um código de retirada (Restaurante)
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupCode]
 *             properties:
 *               pickupCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código válido
 */
router.post('/validate-pickup', authenticate, isRestaurant, orderController.validatePickupCode);
/**
 * @swagger
 * /api/orders/confirm-pickup:
 *   post:
 *     tags: [Orders]
 *     summary: Confirmar a retirada (Restaurante)
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupCode]
 *             properties:
 *               pickupCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Retirada confirmada
 */
router.post('/confirm-pickup', authenticate, isRestaurant, orderController.confirmPickup);

export default router;
