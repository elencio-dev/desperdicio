import { Router } from 'express';
import consumerController from '../controllers/consumer.controller';
import { authenticate, isConsumer } from '../middleware/auth.middleware';

const router = Router();

// Públicas
router.post('/register', consumerController.register);
router.post('/login', consumerController.login);

// Protegidas
router.get('/profile', authenticate, isConsumer, consumerController.getProfile);
router.put('/profile', authenticate, isConsumer, consumerController.updateProfile);

export default router;