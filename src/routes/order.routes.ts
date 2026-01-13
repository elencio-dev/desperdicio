import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { authenticate, isRestaurant, isConsumer } from '../middleware/auth.middleware';

const router = Router();

// Rotas do consumidor
router.post('/', authenticate, isConsumer, orderController.createOrder);
router.get('/my-orders', authenticate, isConsumer, orderController.getConsumerOrders);
router.delete('/:id', authenticate, isConsumer, orderController.cancelOrder);

// Rotas do restaurante
router.post('/validate-pickup', authenticate, isRestaurant, orderController.validatePickupCode);
router.post('/confirm-pickup', authenticate, isRestaurant, orderController.confirmPickup);

export default router;