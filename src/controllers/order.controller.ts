import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import prisma from '../utils/prisma';


// Validação
const createOrderSchema = z.object({
  offerId: z.string().uuid(),
  quantity: z.number().min(1).default(1),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD'])
});

// RF-04: Criar pedido (compra)
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumerId = (req as any).user.id;
    const data = createOrderSchema.parse(req.body);

    // Verificar consumidor bloqueado (RN-07)
    const consumer = await prisma.consumer.findUnique({
      where: { id: consumerId }
    });

    if (consumer?.blockedUntil && consumer.blockedUntil > new Date()) {
      return res.status(403).json({
        error: `Você está bloqueado até ${consumer.blockedUntil.toLocaleDateString()}`,
        reason: 'Três ausências consecutivas na retirada'
      });
    }

    // Verificar disponibilidade da oferta
    const offer = await prisma.offer.findUnique({
      where: { id: data.offerId },
      include: { restaurant: true }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Oferta não encontrada' });
    }

    if (offer.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Oferta não disponível' });
    }

    if (offer.availableQuantity < data.quantity) {
      return res.status(400).json({ 
        error: 'Quantidade insuficiente',
        available: offer.availableQuantity
      });
    }

    // RN-02: Verificar se não expirou
    if (offer.pickupEndTime < new Date()) {
      await prisma.offer.update({
        where: { id: data.offerId },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ error: 'Oferta expirada' });
    }

    // Calcular valores (RN-08)
    const totalAmount = offer.promotionalPrice * data.quantity;
    const platformFee = totalAmount * 0.15;
    const restaurantAmount = totalAmount - platformFee;

    // Gerar código de retirada (RF-07)
    const pickupCode = nanoid(10).toUpperCase();
    
    // Gerar QR Code
    const qrCodeUrl = await QRCode.toDataURL(pickupCode);

    // Criar pedido
    const order = await prisma.$transaction(async (tx) => {
      // Criar order
      const newOrder = await tx.order.create({
        data: {
          consumerId,
          offerId: data.offerId,
          restaurantId: offer.restaurantId,
          quantity: data.quantity,
          originalPrice: offer.originalPrice * data.quantity,
          promotionalPrice: offer.promotionalPrice,
          totalAmount,
          platformFee,
          restaurantAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'PENDING',
          pickupCode,
          qrCodeUrl,
          status: 'PENDING_PAYMENT'
        },
        include: {
          offer: {
            include: {
              restaurant: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      // RF-11: Atualizar quantidade disponível
      await tx.offer.update({
        where: { id: data.offerId },
        data: {
          availableQuantity: {
            decrement: data.quantity
          }
        }
      });

      // Verificar se esgotou
      const updatedOffer = await tx.offer.findUnique({
        where: { id: data.offerId }
      });

      if (updatedOffer && updatedOffer.availableQuantity <= 0) {
        await tx.offer.update({
          where: { id: data.offerId },
          data: { status: 'SOLD_OUT' }
        });
      }

      return newOrder;
    });

    // Aqui você integraria com gateway de pagamento real
    // Por enquanto, simularemos aprovação automática para PIX
    if (data.paymentMethod === 'PIX') {
      // Simular aprovação em 2 segundos
      setTimeout(async () => {
        await processPaymentApproval(order.id);
      }, 2000);
    }

    res.status(201).json({
      order,
      message: data.paymentMethod === 'PIX' 
        ? 'Pedido criado. Aguardando confirmação do pagamento PIX.' 
        : 'Pedido criado. Processando pagamento com cartão.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error});
    }
    next(error);
  }
};

// Processar aprovação de pagamento (RF-06)
async function processPaymentApproval(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'APPROVED',
        status: 'CONFIRMED',
        paymentId: `PAY_${nanoid(16)}`
      }
    });

    // RF-10: Enviar notificação de confirmação
    await prisma.notification.create({
      data: {
        userId: order.consumerId,
        userType: 'consumer',
        type: 'ORDER_CONFIRMED',
        title: 'Pedido Confirmado! 🎉',
        message: `Seu pedido foi confirmado. Código de retirada: ${order.pickupCode}`,
        relatedId: orderId
      }
    });

    // Notificar restaurante
    await prisma.notification.create({
      data: {
        userId: order.restaurantId,
        userType: 'restaurant',
        type: 'NEW_ORDER',
        title: 'Novo Pedido Recebido',
        message: `Você tem um novo pedido. Código: ${order.pickupCode}`,
        relatedId: orderId
      }
    });

    // Criar transação financeira
    await prisma.transaction.create({
      data: {
        orderId,
        restaurantId: order.restaurantId,
        amount: order.totalAmount,
        platformFee: order.platformFee,
        restaurantAmount: order.restaurantAmount,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
  }
}

// RF-08: Validar código de retirada
export const validatePickupCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;
    const { pickupCode } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        pickupCode: pickupCode.toUpperCase(),
        restaurantId
      },
      include: {
        consumer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        offer: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Código inválido' });
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'READY_FOR_PICKUP') {
      return res.status(400).json({ 
        error: 'Pedido não está pronto para retirada',
        status: order.status
      });
    }

    // Verificar se está no horário de retirada
    const now = new Date();
    if (now < order.offer.pickupStartTime || now > order.offer.pickupEndTime) {
      return res.status(400).json({
        error: 'Fora do horário de retirada',
        pickupWindow: {
          start: order.offer.pickupStartTime,
          end: order.offer.pickupEndTime
        }
      });
    }

    res.json({
      valid: true,
      order
    });

  } catch (error) {
    next(error);
  }
};

// RF-05: Confirmar retirada
export const confirmPickup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;
    const { pickupCode } = req.body;

    const order = await prisma.order.findFirst({
      where: {
        pickupCode: pickupCode.toUpperCase(),
        restaurantId
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Código inválido' });
    }

    // Atualizar status para concluído
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'COMPLETED',
        pickupTime: new Date()
      }
    });

    // RN-09: Atualizar transação para processamento
    await prisma.transaction.updateMany({
      where: { orderId: order.id },
      data: {
        status: 'processed',
        paymentDate: new Date()
      }
    });

    // RF-10: Solicitar avaliação
    setTimeout(async () => {
      await prisma.notification.create({
        data: {
          userId: order.consumerId,
          userType: 'consumer',
          type: 'REVIEW_REQUEST',
          title: 'Como foi sua experiência?',
          message: 'Avalie o restaurante e ajude outros usuários!',
          relatedId: order.id
        }
      });
    }, 3600000); // 1 hora depois

    res.json({
      message: 'Retirada confirmada com sucesso',
      order: updatedOrder
    });

  } catch (error) {
    next(error);
  }
};

// Listar pedidos (consumidor)
export const getConsumerOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumerId = (req as any).user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = { consumerId };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        offer: {
          include: {
            restaurant: {
              select: {
                name: true,
                address: true,
                phone: true
              }
            }
          }
        },
        review: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    next(error);
  }
};

// RN-05: Cancelar pedido (consumidor)
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumerId = (req as any).user.id;
    const { id } = req.params as { id: string };;

    const order = await prisma.order.findFirst({
      where: { id, consumerId },
      include: { offer: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Pedido não pode ser cancelado' });
    }

    // Verificar se está dentro do prazo (2 horas antes)
    const hoursUntilPickup = (order.offer.pickupStartTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilPickup < 2) {
      return res.status(400).json({
        error: 'Cancelamento permitido até 2 horas antes da retirada'
      });
    }

    // Cancelar e reembolsar
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED'
        }
      });

      // Devolver quantidade à oferta
      await tx.offer.update({
        where: { id: order.offerId },
        data: {
          availableQuantity: {
            increment: order.quantity
          },
          status: 'ACTIVE'
        }
      });
    });

    res.json({ message: 'Pedido cancelado com sucesso. Reembolso será processado.' });

  } catch (error) {
    next(error);
  }
};

export default {
  createOrder,
  validatePickupCode,
  confirmPickup,
  getConsumerOrders,
  cancelOrder
};