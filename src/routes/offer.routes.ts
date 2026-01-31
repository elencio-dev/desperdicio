import { Router } from 'express';
import offerController from '../controllers/offer.controller.js';
import { authenticate, isRestaurant } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas - qualquer um pode ver ofertas
/**
 * @swagger
 * /api/offers:
 *   get:
 *     tags: [Offers]
 *     summary: Listar ofertas com filtros
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *           default: 5
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isVegetarian
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isVegan
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de ofertas
 */
router.get('/', offerController.listOffers);
router.get('/:id', offerController.getOffer);

// Protegidas - apenas restaurantes
/**
 * @swagger
 * /api/offers:
 *   post:
 *     tags: [Offers]
 *     summary: Criar uma nova oferta (Restaurante)
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Offer'
 *     responses:
 *       201:
 *         description: Oferta criada
 */
router.post('/', authenticate, isRestaurant, offerController.createOffer);
router.put('/:id', authenticate, isRestaurant, offerController.updateOffer);
router.delete('/:id', authenticate, isRestaurant, offerController.cancelOffer);

export default router;
