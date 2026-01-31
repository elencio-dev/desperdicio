// src/controllers/webhook.controller.ts

import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import mercadoPagoService from '../service/mercadopago.js';

/**
 * Webhook do Mercado Pago
 *
 * O Mercado Pago envia notificações para esta rota sempre que
 * há uma atualização no status de um pagamento.
 *
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export const mercadoPagoWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📥 Webhook recebido do Mercado Pago');

    const notification = req.body || req.query;

    // Validar assinatura (opcional mas recomendado para produção)
    const isValid = validateMercadoPagoSignature(req);

    if (!isValid && process.env.NODE_ENV === 'production') {
      console.error('❌ Assinatura inválida do webhook');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Processar notificação
    const result = await mercadoPagoService.processWebhook(notification);

    if (result.success) {
      console.log('✅ Webhook processado com sucesso');
      // IMPORTANTE: Sempre retornar 200 para o Mercado Pago
      return res.status(200).json({ received: true });
    } else {
      console.error('❌ Erro ao processar webhook:', result.error);
      // Mesmo em caso de erro, retornar 200 para evitar reenvios
      return res.status(200).json({ received: true, error: result.error });
    }

  } catch (error) {
    console.error('❌ Erro crítico no webhook:', error);
    // Sempre retornar 200 para o Mercado Pago
    return res.status(200).json({ received: true, error: 'Internal error' });
  }
};

/**
 * Validar assinatura do webhook do Mercado Pago
 */
function validateMercadoPagoSignature(req: Request): boolean {
  try {
    const xSignature = req.headers['x-signature'] as string;
    const xRequestId = req.headers['x-request-id'] as string;

    if (!xSignature || !xRequestId) {
      return true; // Permitir em desenvolvimento
    }

    const parts = xSignature.split(',');
    const tsMatch = parts.find(p => p.startsWith('ts='));
    const hashMatch = parts.find(p => p.startsWith('v1='));

    if (!tsMatch || !hashMatch) {
      return true;
    }

    const ts = tsMatch.split('=')[1];
    const receivedHash = hashMatch.split('=')[1];

    const dataId = req.query.id || req.body?.data?.id || '';
    const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(template);
    const calculatedHash = hmac.digest('hex');

    return calculatedHash === receivedHash;

  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    return true;
  }
}

/**
 * Endpoint para testar webhook manualmente (apenas desenvolvimento)
 */
export const testWebhook = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Disponível apenas em desenvolvimento' });
  }

  const { paymentId, action = 'approved' } = req.body;

  const mockNotification = {
    type: 'payment',
    data: {
      id: paymentId
    },
    action,
    date_created: new Date().toISOString()
  };

  const result = await mercadoPagoService.processWebhook(mockNotification);

  res.json({
    message: 'Webhook de teste processado',
    result
  });
};

export default {
  mercadoPagoWebhook,
  testWebhook
};
