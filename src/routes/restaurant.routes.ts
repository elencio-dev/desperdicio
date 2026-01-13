import { Router } from 'express';
import restaurantController from '../controllers/restaurant.controller';
import { authenticate, isRestaurant } from '../middleware/auth.middleware';

const router = Router();

// Públicas
router.post('/register', restaurantController.register);
router.post('/login', restaurantController.login);

// Protegidas
router.get('/profile', authenticate, isRestaurant, restaurantController.getProfile);
router.put('/profile', authenticate, isRestaurant, restaurantController.updateProfile);
router.get('/sales', authenticate, isRestaurant, restaurantController.getSalesHistory);

export default router;
