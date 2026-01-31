import { Router } from 'express';
import orderController from '../controllers/order.controller.js';
import { authenticate, isConsumer, isRestaurant } from '../middleware/auth.middleware.js';

const router = Router();

// Rotas do consumidor
router.post('/', authenticate, isConsumer, orderController.createOrder);
router.get('/my-orders', authenticate, isConsumer, orderController.getConsumerOrders);
router.post('/:id/cancel', authenticate, isConsumer, orderController.cancelOrder);

// Rotas do restaurante
router.post('/validate-pickup', authenticate, isRestaurant, orderController.validatePickupCode);
router.post('/confirm-pickup', authenticate, isRestaurant, orderController.confirmPickup);

export default router;
