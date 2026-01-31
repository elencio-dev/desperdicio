import { Router } from 'express';
import restaurantController from '../controllers/restaurant.controller.js';
import { authenticate, isRestaurant } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas
router.post('/register', restaurantController.register);

// Protegidas
router.get('/profile', authenticate, isRestaurant, restaurantController.getProfile);
router.put('/profile', authenticate, isRestaurant, restaurantController.updateProfile);
router.get('/sales', authenticate, isRestaurant, restaurantController.getSalesHistory);

export default router;
