import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';


// Validação
const createOfferSchema = z.object({
  packageType: z.string().min(3),
  description: z.string().optional(),
  quantity: z.number().min(1).max(50), // RN-03
  originalPrice: z.number().positive(),
  promotionalPrice: z.number().positive(),
  pickupStartTime: z.string().datetime(),
  pickupEndTime: z.string().datetime(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false)
});

// RF-03: Criar oferta
export const createOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;
    const data = createOfferSchema.parse(req.body);

    // RN-04: Validar desconto mínimo de 30%
    const discountPercent = ((data.originalPrice - data.promotionalPrice) / data.originalPrice) * 100;
    
    if (discountPercent < 30) {
      return res.status(400).json({
        error: 'Desconto mínimo obrigatório de 30%'
      });
    }

    // RN-01: Validar janela de retirada (1-3 horas)
    const pickupStart = new Date(data.pickupStartTime);
    const pickupEnd = new Date(data.pickupEndTime);
    const hoursDiff = (pickupEnd.getTime() - pickupStart.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1 || hoursDiff > 3) {
      return res.status(400).json({
        error: 'Janela de retirada deve ter entre 1 e 3 horas'
      });
    }

    // Verificar se restaurante está aprovado
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant?.isApproved) {
      return res.status(403).json({
        error: 'Restaurante não aprovado'
      });
    }

    const offer = await prisma.offer.create({
      data: {
        restaurantId,
        packageType: data.packageType,
        description: data.description,
        quantity: data.quantity,
        availableQuantity: data.quantity,
        originalPrice: data.originalPrice,
        promotionalPrice: data.promotionalPrice,
        discountPercent,
        pickupStartTime: pickupStart,
        pickupEndTime: pickupEnd,
        isVegetarian: data.isVegetarian,
        isVegan: data.isVegan,
        status: 'ACTIVE'
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            averageRating: true
          }
        }
      }
    });

    res.status(201).json(offer);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error });
    }
    next(error);
  }
};

// RF-04 e RF-05: Listar ofertas com filtros
export const listOffers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      latitude, 
      longitude, 
      maxDistance = 5, // km
      minPrice,
      maxPrice,
      isVegetarian,
      isVegan,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Query base
    const where: any = {
      status: 'ACTIVE',
      availableQuantity: { gt: 0 },
      pickupEndTime: { gte: new Date() }
    };

    // Filtros de preço
    if (minPrice) where.promotionalPrice = { ...where.promotionalPrice, gte: Number(minPrice) };
    if (maxPrice) where.promotionalPrice = { ...where.promotionalPrice, lte: Number(maxPrice) };

    // Filtros alimentares
    if (isVegetarian === 'true') where.isVegetarian = true;
    if (isVegan === 'true') where.isVegan = true;

    let offers;

    // Se tiver localização, calcular distância
    if (latitude && longitude) {
      const lat = Number(latitude);
      const lon = Number(longitude);
      const maxDist = Number(maxDistance);

      // Haversine formula em SQL
      offers = await prisma.$queryRaw`
        SELECT 
          o.*,
          (
            6371 * acos(
              cos(radians(${lat})) * 
              cos(radians(r.latitude)) * 
              cos(radians(r.longitude) - radians(${lon})) + 
              sin(radians(${lat})) * 
              sin(radians(r.latitude))
            )
          ) as distance,
          json_build_object(
            'id', r.id,
            'name', r.name,
            'address', r.address,
            'latitude', r.latitude,
            'longitude', r.longitude,
            'averageRating', r."averageRating"
          ) as restaurant
        FROM offers o
        JOIN restaurants r ON o."restaurantId" = r.id
        WHERE o.status = 'ACTIVE'
          AND o."availableQuantity" > 0
          AND o."pickupEndTime" >= NOW()
          ${minPrice ? prisma.$queryRawUnsafe(`AND o."promotionalPrice" >= ${minPrice}`) : prisma.$queryRawUnsafe('')}
          ${maxPrice ? prisma.$queryRawUnsafe(`AND o."promotionalPrice" <= ${maxPrice}`) : prisma.$queryRawUnsafe('')}
          ${isVegetarian === 'true' ? prisma.$queryRawUnsafe(`AND o."isVegetarian" = true`) : prisma.$queryRawUnsafe('')}
          ${isVegan === 'true' ? prisma.$queryRawUnsafe(`AND o."isVegan" = true`) : prisma.$queryRawUnsafe('')}
        HAVING (
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(r.latitude)) * 
            cos(radians(r.longitude) - radians(${lon})) + 
            sin(radians(${lat})) * 
            sin(radians(r.latitude))
          )
        ) <= ${maxDist}
        ORDER BY distance ASC
        LIMIT ${Number(limit)}
        OFFSET ${skip}
      `;
    } else {
      // Sem filtro de distância
      offers = await prisma.offer.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
              averageRating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      });
    }

    const total = await prisma.offer.count({ where });

    res.json({
      offers,
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

// Obter oferta específica
export const getOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            averageRating: true,
            phone: true,
            businessHours: true
          }
        }
      }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Oferta não encontrada' });
    }

    res.json(offer);

  } catch (error) {
    next(error);
  }
};

// Atualizar oferta
export const updateOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;
    const { id } = req.params as { id: string };
    const { quantity, availableQuantity, status } = req.body;

    // Verificar se a oferta pertence ao restaurante
    const offer = await prisma.offer.findFirst({
      where: {
        id,
        restaurantId
      }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Oferta não encontrada' });
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (availableQuantity !== undefined) updateData.availableQuantity = availableQuantity;
    if (status) updateData.status = status;

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: updateData
    });

    res.json(updatedOffer);

  } catch (error) {
    next(error);
  }
};

// Cancelar oferta
export const cancelOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurantId = (req as any).user.id;
    const { id } = req.params as { id: string };

    const offer = await prisma.offer.findFirst({
      where: { id, restaurantId }
    });

    if (!offer) {
      return res.status(404).json({ error: 'Oferta não encontrada' });
    }

    // RN-06: Reembolsar pedidos confirmados + crédito
    const affectedOrders = await prisma.order.findMany({
      where: {
        offerId: id,
        status: { in: ['CONFIRMED', 'READY_FOR_PICKUP'] }
      }
    });

    // Atualizar oferta
    await prisma.offer.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Processar reembolsos (aqui você integraria com gateway)
    for (const order of affectedOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED'
        }
      });

      // Criar notificação
      await prisma.notification.create({
        data: {
          userId: order.consumerId,
          userType: 'consumer',
          type: 'ORDER_CANCELLED',
          title: 'Pedido Cancelado',
          message: `Seu pedido foi cancelado pelo restaurante. Você receberá reembolso total + 10% de crédito.`,
          relatedId: order.id
        }
      });
    }

    res.json({
      message: 'Oferta cancelada com sucesso',
      affectedOrders: affectedOrders.length
    });

  } catch (error) {
    next(error);
  }
};

export default {
  createOffer,
  listOffers,
  getOffer,
  updateOffer,
  cancelOffer
};