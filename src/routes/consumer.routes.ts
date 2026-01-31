import { Router } from 'express';
import consumerController from '../controllers/consumer.controller.js';
import { authenticate, isConsumer } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas
router.post('/register', consumerController.register);

// Protegidas
router.get('/profile', authenticate, isConsumer, consumerController.getProfile);
router.put('/profile', authenticate, isConsumer, consumerController.updateProfile);

export default router;
