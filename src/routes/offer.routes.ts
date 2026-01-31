import { Router } from 'express';
import offerController from '../controllers/offer.controller.js';
import { authenticate, isRestaurant } from '../middleware/auth.middleware.js';

const router = Router();

// Públicas - qualquer um pode ver ofertas
router.get('/', offerController.listOffers);
router.get('/:id', offerController.getOffer);

// Protegidas - apenas restaurantes
router.post('/', authenticate, isRestaurant, offerController.createOffer);
router.put('/:id', authenticate, isRestaurant, offerController.updateOffer);
router.delete('/:id', authenticate, isRestaurant, offerController.cancelOffer);

export default router;
