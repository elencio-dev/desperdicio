import { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { z } from 'zod';
import orderService from '../service/order.service.js';
import prisma from '../utils/prisma.js';



// Validação
const createOrderSchema = z.object({
  offerId: z.string().uuid(),
  quantity: z.number().min(1).default(1),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD'])
});

// RF-04: Criar pedido (compra)
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const data = createOrderSchema.parse(req.body);

    // Buscar consumidor vinculado ao usuário
    const consumer = await prisma.consumer.findUnique({
      where: { userId: user.id }
    });

    if (!consumer) {
      return res.status(403).json({ error: 'Perfil de consumidor não encontrado' });
    }

    const consumerId = consumer.id;

    // Verificar consumidor bloqueado (RN-07)
    if (consumer.blockedUntil && consumer.blockedUntil > new Date()) {
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

    // Simular aprovação automática para PIX (Apenas DEV)
    if (data.paymentMethod === 'PIX' && process.env.NODE_ENV !== 'production') {
      setTimeout(async () => {
        await orderService.processPaymentApproval(order.id);
      }, 5000);
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



// RF-08: Validar código de retirada
export const validatePickupCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { pickupCode } = req.body;

    // Buscar restaurante vinculado ao usuário
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id }
    });

    if (!restaurant) {
      return res.status(403).json({ error: 'Perfil de restaurante não encontrado' });
    }

    const order = await prisma.order.findFirst({
      where: {
        pickupCode: pickupCode.toUpperCase(),
        restaurantId: restaurant.id
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
    const user = (req as any).user;
    const { pickupCode } = req.body;

    // Buscar restaurante vinculado ao usuário
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id }
    });

    if (!restaurant) {
      return res.status(403).json({ error: 'Perfil de restaurante não encontrado' });
    }

    const order = await prisma.order.findFirst({
      where: {
        pickupCode: pickupCode.toUpperCase(),
        restaurantId: restaurant.id
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

    // Solicitar avaliação
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
    const user = (req as any).user;
    const { status, page = 1, limit = 20 } = req.query;

    const consumer = await prisma.consumer.findUnique({
      where: { userId: user.id }
    });

    if (!consumer) {
      return res.status(403).json({ error: 'Perfil de consumidor não encontrado' });
    }

    const where: any = { consumerId: consumer.id };
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
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const consumer = await prisma.consumer.findUnique({
      where: { userId: user.id }
    });

    if (!consumer) {
      return res.status(403).json({ error: 'Perfil de consumidor não encontrado' });
    }

    const order = await prisma.order.findFirst({
      where: { id, consumerId: consumer.id },
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
