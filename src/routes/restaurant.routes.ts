import { Router } from 'express';
import restaurantController from '../controllers/restaurant.controller.js';
import { authenticate, isRestaurant } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas
/**
 * @swagger
 * /api/restaurants/register:
 *   post:
 *     tags: [Restaurants]
 *     summary: Cadastro completo de Restaurante
 *     description: Cria uma conta de autenticação e um perfil de restaurante com horários de funcionamento.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantRegister'
 *     responses:
 *       201:
 *         description: Restaurante cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 restaurant:
 *                   $ref: '#/components/schemas/Restaurant'
 *                 session:
 *                   type: object
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', restaurantController.register);

// Protegidas
router.get('/profile', authenticate, isRestaurant, restaurantController.getProfile);
router.put('/profile', authenticate, isRestaurant, restaurantController.updateProfile);
router.get('/sales', authenticate, isRestaurant, restaurantController.getSalesHistory);

export default router;
