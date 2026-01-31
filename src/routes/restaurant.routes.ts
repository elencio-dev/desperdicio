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
/**
 * @swagger
 * /api/restaurants/profile:
 *   get:
 *     tags: [Restaurants]
 *     summary: Obter perfil do restaurante
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: Perfil do restaurante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 */
router.get('/profile', authenticate, isRestaurant, restaurantController.getProfile);
/**
 * @swagger
 * /api/restaurants/profile:
 *   put:
 *     tags: [Restaurants]
 *     summary: Atualizar perfil do restaurante
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               businessHours:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/RestaurantRegister/properties/businessHours/items'
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 */
router.put('/profile', authenticate, isRestaurant, restaurantController.updateProfile);
/**
 * @swagger
 * /api/restaurants/sales:
 *   get:
 *     tags: [Restaurants]
 *     summary: Histórico de vendas
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Histórico detalhado e resumido
 */
router.get('/sales', authenticate, isRestaurant, restaurantController.getSalesHistory);

export default router;
