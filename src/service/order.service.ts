import { nanoid } from 'nanoid';
import prisma from '../utils/prisma.js';

/**
 * Processar a aprovação de um pagamento e atualizar o pedido
 */
export async function processPaymentApproval(orderId: string, gatewayPaymentId?: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado`);
    }

    if (order.status !== 'PENDING_PAYMENT' && order.paymentStatus !== 'PENDING') {
      console.log(`Pedido ${orderId} já está processado ou em outro status: ${order.status}`);
      return order;
    }

    // Atualizar status para confirmado
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'APPROVED',
        status: 'CONFIRMED',
        paymentId: gatewayPaymentId || `PAY_${nanoid(16)}`,
        updatedAt: new Date()
      }
    });

    // Notificar consumidor
    await prisma.notification.create({
      data: {
        userId: updatedOrder.consumerId,
        userType: 'consumer',
        type: 'ORDER_CONFIRMED',
        title: 'Pedido Confirmado! 🎉',
        message: `Seu pedido foi confirmado. Código de retirada: ${updatedOrder.pickupCode}`,
        relatedId: orderId
      }
    });

    // Notificar restaurante
    await prisma.notification.create({
      data: {
        userId: updatedOrder.restaurantId,
        userType: 'restaurant',
        type: 'NEW_ORDER',
        title: 'Novo Pedido Recebido',
        message: `Você tem um novo pedido. Código: ${updatedOrder.pickupCode}`,
        relatedId: orderId
      }
    });

    // Criar transação financeira
    await prisma.transaction.create({
      data: {
        orderId,
        restaurantId: updatedOrder.restaurantId,
        amount: updatedOrder.totalAmount,
        platformFee: updatedOrder.platformFee,
        restaurantAmount: updatedOrder.restaurantAmount,
        status: 'pending'
      }
    });

    return updatedOrder;
  } catch (error) {
    console.error('Erro ao processar aprovação de pagamento:', error);
    throw error;
  }
}

export default {
  processPaymentApproval
};
