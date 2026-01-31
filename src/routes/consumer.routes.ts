import { Router } from 'express';
import consumerController from '../controllers/consumer.controller.js';
import { authenticate, isConsumer } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas
/**
 * @swagger
 * /api/consumers/register:
 *   post:
 *     tags: [Consumers]
 *     summary: Cadastro completo de Consumidor
 *     description: Cria uma conta de autenticação e um perfil de consumidor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsumerRegister'
 *     responses:
 *       201:
 *         description: Consumidor cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 consumer:
 *                   $ref: '#/components/schemas/Consumer'
 *                 session:
 *                   type: object
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', consumerController.register);

// Protegidas
router.get('/profile', authenticate, isConsumer, consumerController.getProfile);
router.put('/profile', authenticate, isConsumer, consumerController.updateProfile);

export default router;
