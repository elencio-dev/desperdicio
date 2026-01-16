
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

async function main() {
  // Limpar dados existentes
  await prisma.notification.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.consumer.deleteMany();

  // ==================== RESTAURANTES ====================
  
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const restaurant1 = await prisma.restaurant.create({
    data: {
      cnpj: '12345678000190',
      name: 'Pizzaria Bella Napoli',
      email: 'contato@bellanapoli.com',
      password: hashedPassword,
      phone: '85987654321',
      address: 'Rua Barão de Studart, 1234 - Meireles',
      latitude: -3.7327,
      longitude: -38.5270,
      isApproved: true,
      averageRating: 4.8,
      totalRatings: 45,
      businessHours: {
        create: [
          { dayOfWeek: 0, openTime: '18:00', closeTime: '23:00', isOpen: true },
          { dayOfWeek: 1, openTime: '18:00', closeTime: '23:00', isOpen: true },
          { dayOfWeek: 2, openTime: '18:00', closeTime: '23:00', isOpen: true },
          { dayOfWeek: 3, openTime: '18:00', closeTime: '23:00', isOpen: true },
          { dayOfWeek: 4, openTime: '18:00', closeTime: '23:00', isOpen: true },
          { dayOfWeek: 5, openTime: '18:00', closeTime: '00:00', isOpen: true },
          { dayOfWeek: 6, openTime: '12:00', closeTime: '00:00', isOpen: true }
        ]
      }
    }
  });

  const restaurant2 = await prisma.restaurant.create({
    data: {
      cnpj: '98765432000101',
      name: 'Padaria São Francisco',
      email: 'contato@padariasf.com',
      password: hashedPassword,
      phone: '85987123456',
      address: 'Av. Beira Mar, 567 - Praia de Iracema',
      latitude: -3.7190,
      longitude: -38.5130,
      isApproved: true,
      averageRating: 4.6,
      totalRatings: 89,
      businessHours: {
        create: [
          { dayOfWeek: 0, openTime: '06:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 1, openTime: '06:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 2, openTime: '06:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 3, openTime: '06:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 4, openTime: '06:00', closeTime: '20:00', isOpen: true },
          { dayOfWeek: 5, openTime: '06:00', closeTime: '21:00', isOpen: true },
          { dayOfWeek: 6, openTime: '07:00', closeTime: '21:00', isOpen: true }
        ]
      }
    }
  });

  const restaurant3 = await prisma.restaurant.create({
    data: {
      cnpj: '11122233000144',
      name: 'Restaurante Vegetariano Green Life',
      email: 'contato@greenlife.com',
      password: hashedPassword,
      phone: '85988776655',
      address: 'Rua Desembargador Moreira, 789 - Aldeota',
      latitude: -3.7380,
      longitude: -38.5000,
      isApproved: true,
      averageRating: 4.9,
      totalRatings: 67,
      businessHours: {
        create: [
          { dayOfWeek: 0, openTime: '11:00', closeTime: '15:00', isOpen: true },
          { dayOfWeek: 1, openTime: '11:00', closeTime: '15:00', isOpen: true },
          { dayOfWeek: 2, openTime: '11:00', closeTime: '15:00', isOpen: true },
          { dayOfWeek: 3, openTime: '11:00', closeTime: '15:00', isOpen: true },
          { dayOfWeek: 4, openTime: '11:00', closeTime: '15:00', isOpen: true },
          { dayOfWeek: 5, openTime: '11:00', closeTime: '15:00', isOpen: true },
          { dayOfWeek: 6, openTime: '12:00', closeTime: '16:00', isOpen: true }
        ]
      }
    }
  });

  console.log('✅ 3 restaurantes criados');

  // ==================== CONSUMIDORES ====================

  const consumer1 = await prisma.consumer.create({
    data: {
      name: 'Maria Silva',
      email: 'maria@email.com',
      password: hashedPassword,
      phone: '85999888777'
    }
  });

  const consumer2 = await prisma.consumer.create({
    data: {
      name: 'João Santos',
      email: 'joao@email.com',
      password: hashedPassword,
      phone: '85988777666'
    }
  });

  console.log('✅ 2 consumidores criados');

  // ==================== OFERTAS ATIVAS ====================

  const now = new Date();
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const offer1 = await prisma.offer.create({
    data: {
      restaurantId: restaurant1.id,
      packageType: 'Pacote Surpresa de Pizzas',
      description: 'Mix de fatias de pizzas variadas do dia',
      quantity: 10,
      availableQuantity: 7,
      originalPrice: 45.00,
      promotionalPrice: 22.50,
      discountPercent: 50,
      pickupStartTime: in2Hours,
      pickupEndTime: new Date(in2Hours.getTime() + 2 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isVegetarian: false,
      isVegan: false
    }
  });

  const offer2 = await prisma.offer.create({
    data: {
      restaurantId: restaurant2.id,
      packageType: 'Pacote de Pães e Doces',
      description: 'Pães franceses, doces e salgados frescos',
      quantity: 15,
      availableQuantity: 15,
      originalPrice: 30.00,
      promotionalPrice: 15.00,
      discountPercent: 50,
      pickupStartTime: in2Hours,
      pickupEndTime: new Date(in2Hours.getTime() + 2 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isVegetarian: true,
      isVegan: false
    }
  });

  const offer3 = await prisma.offer.create({
    data: {
      restaurantId: restaurant3.id,
      packageType: 'Pacote Vegano Completo',
      description: 'Refeição completa: salada, prato principal e sobremesa',
      quantity: 8,
      availableQuantity: 5,
      originalPrice: 40.00,
      promotionalPrice: 20.00,
      discountPercent: 50,
      pickupStartTime: in2Hours,
      pickupEndTime: new Date(in2Hours.getTime() + 2 * 60 * 60 * 1000),
      status: 'ACTIVE',
      isVegetarian: true,
      isVegan: true
    }
  });

  console.log('✅ 3 ofertas ativas criadas');

  // ==================== PEDIDOS EXEMPLO ====================

  const order1 = await prisma.order.create({
    data: {
      consumerId: consumer1.id,
      offerId: offer1.id,
      restaurantId: restaurant1.id,
      quantity: 2,
      originalPrice: 90.00,
      promotionalPrice: 22.50,
      totalAmount: 45.00,
      platformFee: 6.75,
      restaurantAmount: 38.25,
      paymentMethod: 'PIX',
      paymentStatus: 'APPROVED',
      paymentId: 'PAY_123456789',
      pickupCode: 'ABC123XYZ0',
      qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      status: 'CONFIRMED'
    }
  });

  const order2 = await prisma.order.create({
    data: {
      consumerId: consumer2.id,
      offerId: offer3.id,
      restaurantId: restaurant3.id,
      quantity: 1,
      originalPrice: 40.00,
      promotionalPrice: 20.00,
      totalAmount: 20.00,
      platformFee: 3.00,
      restaurantAmount: 17.00,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'APPROVED',
      paymentId: 'PAY_987654321',
      pickupCode: 'XYZ789ABC1',
      qrCodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      status: 'COMPLETED',
      pickupTime: new Date()
    }
  });

  console.log('✅ 2 pedidos criados');

  // ==================== AVALIAÇÕES ====================

  await prisma.review.create({
    data: {
      orderId: order2.id,
      consumerId: consumer2.id,
      restaurantId: restaurant3.id,
      rating: 5,
      comment: 'Comida excelente! Muito fresca e saborosa. Super recomendo!'
    }
  });

  console.log('✅ 1 avaliação criada');

  // ==================== NOTIFICAÇÕES ====================

  await prisma.notification.create({
    data: {
      userId: consumer1.id,
      userType: 'consumer',
      type: 'ORDER_CONFIRMED',
      title: 'Pedido Confirmado! 🎉',
      message: `Seu pedido na Pizzaria Bella Napoli foi confirmado. Código: ABC123XYZ0`,
      relatedId: order1.id,
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: restaurant1.id,
      userType: 'restaurant',
      type: 'NEW_ORDER',
      title: 'Novo Pedido Recebido',
      message: `Você tem um novo pedido. Código: ABC123XYZ0`,
      relatedId: order1.id,
      isRead: false
    }
  });

  console.log('✅ 2 notificações criadas');

  // ==================== TRANSAÇÕES ====================

  await prisma.transaction.create({
    data: {
      orderId: order1.id,
      restaurantId: restaurant1.id,
      amount: 45.00,
      platformFee: 6.75,
      restaurantAmount: 38.25,
      status: 'pending'
    }
  });

  await prisma.transaction.create({
    data: {
      orderId: order2.id,
      restaurantId: restaurant3.id,
      amount: 20.00,
      platformFee: 3.00,
      restaurantAmount: 17.00,
      status: 'paid',
      paymentDate: new Date()
    }
  });

  console.log('✅ 2 transações criadas');

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📝 Credenciais de acesso:');
  console.log('');
  console.log('🍕 RESTAURANTES:');
  console.log('Email: contato@bellanapoli.com | Senha: senha123');
  console.log('Email: contato@padariasf.com | Senha: senha123');
  console.log('Email: contato@greenlife.com | Senha: senha123');
  console.log('');
  console.log('👤 CONSUMIDORES:');
  console.log('Email: maria@email.com | Senha: senha123');
  console.log('Email: joao@email.com | Senha: senha123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });