import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authenticate, isConsumer } from '../middleware/auth.middleware';

const router = Router();

// Públicas
router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);

// Protegidas
router.post('/', authenticate, isConsumer, reviewController.createReview);
router.get('/my-reviews', authenticate, isConsumer, reviewController.getMyReviews);

export default router;