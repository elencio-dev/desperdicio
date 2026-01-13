import { Router } from 'express';
import webhookController from '../controllers/webhook.controller';

const router = Router();

// Webhook do Mercado Pago
// IMPORTANTE: Esta rota NÃO deve ter autenticação
router.post('/mercadopago', webhookController.mercadoPagoWebhook);
router.get('/mercadopago', webhookController.mercadoPagoWebhook); // MP pode usar GET também

// Endpoint de teste (apenas dev)
router.post('/test-mercadopago', webhookController.testWebhook);

export default router;
