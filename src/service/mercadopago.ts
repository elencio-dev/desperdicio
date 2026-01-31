import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import prisma from '../utils/prisma.js';
import orderService from './order.service.js';


// Inicializar cliente do Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    options: {
        timeout: 5000,
    }
});

const payment = new Payment(client);
const preference = new Preference(client);

interface CreatePixPaymentParams {
    orderId: string;
    amount: number;
    email: string;
    name: string;
    cpf?: string;
    description: string;
}

// ==================== PIX ====================

export async function createPixPayment(params: CreatePixPaymentParams) {
    try {
        const response = await payment.create({
            body: {
                transaction_amount: params.amount,
                description: params.description,
                payment_method_id: 'pix',
                payer: {
                    email: params.email,
                    first_name: params.name.split(' ')[0],
                    last_name: params.name.split(' ').slice(1).join(' ') || params.name.split(' ')[0],
                    identification: params.cpf ? {
                        type: 'CPF',
                        number: params.cpf.replace(/\D/g, '')
                    } : undefined
                },
                notification_url: `${process.env.API_URL}/api/webhooks/mercadopago`,
                metadata: {
                    order_id: params.orderId
                }
            }
        });

        return {
            success: true,
            paymentId: response.id,
            status: response.status || 'pending',
            qrCode: response.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
            ticketUrl: response.point_of_interaction?.transaction_data?.ticket_url,
            expiresAt: response.date_of_expiration
        };
    } catch (error: any) {
        console.error('Erro PIX:', error);
        return { success: false, error: error.message };
    }
}

// ==================== CONSULTAR PAGAMENTO ====================

interface PaymentStatusResponse {
    success: boolean;
    status: string;
    statusDetail?: string;
    amount?: number;
    approved: boolean;
    metadata?: any;
    error?: string;
}

export async function getPaymentStatus(paymentId: string | number): Promise<PaymentStatusResponse> {
    try {
        const id = paymentId.toString();
        const paymentData = await payment.get({ id });

        return {
            success: true,
            status: paymentData.status || 'unknown',
            statusDetail: paymentData.status_detail,
            amount: paymentData.transaction_amount,
            approved: paymentData.status === 'approved',
            metadata: paymentData.metadata
        };
    } catch (error: any) {
        return { success: false, status: 'error', approved: false, error: error.message };
    }
}

// ==================== REEMBOLSO ====================

export async function refundPayment(paymentId: string | number, amount?: number) {
    try {
        const id = paymentId.toString();

        // @ts-ignore
        const refundData = await payment.refund({
            payment_id: id,
            body: amount ? { amount } : {}
        });

        return {
            success: true,
            refundId: refundData.id,
            status: refundData.status,
        };
    } catch (error: any) {
        console.error('Erro reembolso:', error);
        return { success: false, error: error.message };
    }
}

// ==================== CHECKOUT PREFERENCE ====================

export async function createCheckoutPreference(orderId: string, items: any[], payer: any) {
    try {
        const response = await preference.create({
            body: {
                items: items.map(item => ({
                    id: orderId,
                    title: item.title,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    currency_id: 'BRL'
                })),
                payer: {
                    email: payer.email,
                    identification: payer.cpf ? {
                        type: 'CPF',
                        number: payer.cpf.replace(/\D/g, '')
                    } : undefined
                },
                external_reference: orderId,
                notification_url: `${process.env.API_URL}/api/webhooks/mercadopago`,
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/success`,
                    failure: `${process.env.FRONTEND_URL}/failure`
                },
                auto_return: 'approved'
            }
        });

        return {
            success: true,
            preferenceId: response.id,
            initPoint: response.init_point
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function processWebhook(data: any) {
  try {
    const { type, action, data: webhookData } = data;

    // 1. Idempotência: Verificar se já processamos este evento
    const externalId = webhookData?.id?.toString() || data.id?.toString();
    if (!externalId) {
      console.warn('⚠️ Webhook sem externalId:', JSON.stringify(data));
      return { success: true }; // Ignorar mas não dar erro
    }

    const eventType = type || action || 'unknown';

    // Buscar se já existe esse evento processado
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { externalId }
    });

    if (existingEvent) {
      console.log(`ℹ️ Webhook ${externalId} já foi processado anteriormente.`);
      return { success: true };
    }

    // 2. Registrar o evento (Idempotência)
    await prisma.webhookEvent.create({
      data: {
        externalId,
        source: 'MERCADOPAGO',
        type: eventType,
        payload: data
      }
    });

    // 3. Processar apenas eventos de pagamento
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      const paymentId = externalId;
      const paymentInfo = await getPaymentStatus(paymentId);

      if (paymentInfo.success && paymentInfo.metadata) {
        const orderId = paymentInfo.metadata.order_id;

        if (!orderId) {
          console.warn(`⚠️ Webhook ${paymentId} recebido sem order_id no metadata`);
          return { success: true };
        }

        if (paymentInfo.approved) {
          console.log(`✅ Pagamento aprovado: ${paymentId} para pedido ${orderId}`);
          await orderService.processPaymentApproval(orderId as string, paymentId.toString());
        } else if (paymentInfo.status && ['rejected', 'cancelled', 'refunded'].includes(paymentInfo.status)) {
          console.log(`ℹ️ Pagamento ${paymentId} status: ${paymentInfo.status}`);

          await prisma.order.update({
            where: { id: orderId as string },
            data: {
              paymentStatus: paymentInfo.status === 'refunded' ? 'REFUNDED' : 'REFUSED',
              status: paymentInfo.status === 'refunded' ? 'CANCELLED' : 'PENDING_PAYMENT',
              updatedAt: new Date()
            }
          });
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook no serviço:', error);
    return { success: false, error: error.message };
  }
}

export default {
    createPixPayment,
    getPaymentStatus,
    refundPayment,
    createCheckoutPreference,
    processWebhook
};
