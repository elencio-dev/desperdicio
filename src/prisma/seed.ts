
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { OfferStatus, OrderStatus, PaymentMethod, PaymentStatus } from '../generated/prisma/index.js';
import prisma from '../utils/prisma.js';

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Limpar dados existentes (em ordem reversa às dependências)
  console.log('🧹 Limpando dados existentes...');
  await prisma.transaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.consumer.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('senha123', 10);

  // ==================== RESTAURANTES ====================
  console.log('🏪 Criando restaurantes...');

  const restaurantData = [
    {
      name: 'Pizzaria Bella Napoli',
      email: 'contato@bellanapoli.com',
      cnpj: '12345678000190',
      phone: '85987654321',
      address: 'Rua Barão de Studart, 1234 - Meireles',
      latitude: -3.7327,
      longitude: -38.5270,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Padaria São Francisco',
      email: 'contato@padariasf.com',
      cnpj: '98765432000101',
      phone: '85987123456',
      address: 'Av. Beira Mar, 567 - Praia de Iracema',
      latitude: -3.7190,
      longitude: -38.5130,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Green Life Veggie',
      email: 'contato@greenlife.com',
      cnpj: '11122233000144',
      phone: '85988776655',
      address: 'Rua Desembargador Moreira, 789 - Aldeota',
      latitude: -3.7380,
      longitude: -38.5000,
      image: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  const createdRestaurants = [];

  for (const data of restaurantData) {
    // Criar Usuário
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: 'RESTAURANT',
        image: data.image,
        emailVerified: true,
      },
    });

    // Criar Conta (Better Auth)
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    // Criar Perfil de Restaurante
    const restaurant = await prisma.restaurant.create({
      data: {
        userId: user.id,
        cnpj: data.cnpj,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        isApproved: true,
        averageRating: 4.5 + Math.random() * 0.5,
        totalRatings: Math.floor(Math.random() * 100),
        businessHours: {
          create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            dayOfWeek: day,
            openTime: '08:00',
            closeTime: '22:00',
            isOpen: true,
          })),
        },
      },
    });
    createdRestaurants.push(restaurant);
  }

  // ==================== CONSUMIDORES ====================
  console.log('👤 Criando consumidores...');

  const consumerData = [
    { name: 'Maria Silva', email: 'maria@email.com' },
    { name: 'João Santos', email: 'joao@email.com' },
  ];

  const createdConsumers = [];

  for (const data of consumerData) {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: 'CONSUMER',
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    const consumer = await prisma.consumer.create({
      data: {
        userId: user.id,
        name: data.name,
        email: data.email,
      },
    });
    createdConsumers.push(consumer);
  }

  // ==================== OFERTAS (PRODUTOS) ====================
  console.log('🍱 Criando ofertas...');

  const now = new Date();
  const validUntil = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 horas a partir de agora

  const offers = [
    {
      restaurantId: createdRestaurants[0].id,
      packageType: 'Pacote Surpresa Grande',
      description: 'Uma seleção de nossas melhores pizzas do dia.',
      quantity: 10,
      availableQuantity: 8,
      originalPrice: 60.0,
      promotionalPrice: 24.9,
      discountPercent: 58.5,
      isVegetarian: false,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
    },
    {
      restaurantId: createdRestaurants[1].id,
      packageType: 'Kit Café da Manhã',
      description: 'Pães artesanais, croissants e frios.',
      quantity: 15,
      availableQuantity: 15,
      originalPrice: 40.0,
      promotionalPrice: 15.0,
      discountPercent: 62.5,
      isVegetarian: true,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop',
    },
    {
      restaurantId: createdRestaurants[2].id,
      packageType: 'Bowl Super Nutritivo',
      description: 'Mix de grãos, legumes frescos e proteína vegetal.',
      quantity: 5,
      availableQuantity: 3,
      originalPrice: 35.0,
      promotionalPrice: 17.5,
      discountPercent: 50.0,
      isVegetarian: true,
      isVegan: true,
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  const createdOffers = [];
  for (const offerData of offers) {
    const offer = await prisma.offer.create({
      data: {
        ...offerData,
        pickupStartTime: now,
        pickupEndTime: validUntil,
        status: OfferStatus.ACTIVE,
      },
    });
    createdOffers.push(offer);
  }

  // ==================== PEDIDOS E AVALIAÇÕES ====================
  console.log('🧾 Criando pedidos de exemplo...');

  const order = await prisma.order.create({
    data: {
      consumerId: createdConsumers[0].id,
      offerId: createdOffers[0].id,
      restaurantId: createdRestaurants[0].id,
      quantity: 1,
      originalPrice: 60.0,
      promotionalPrice: 24.9,
      totalAmount: 24.9,
      platformFee: 24.9 * 0.15,
      restaurantAmount: 24.9 * 0.85,
      paymentMethod: PaymentMethod.PIX,
      paymentStatus: PaymentStatus.APPROVED,
      status: OrderStatus.COMPLETED,
      pickupCode: 'BELLA-777',
      pickupTime: new Date(),
    },
  });

  await prisma.review.create({
    data: {
      orderId: order.id,
      consumerId: createdConsumers[0].id,
      restaurantId: createdRestaurants[0].id,
      rating: 5,
      comment: 'Pizza maravilhosa, nem parecia excedente!',
    },
  });

  console.log('✨ Seed finalizado com sucesso!');
  console.log('\nCredenciais de Teste:');
  console.log('-------------------');
  console.log('🍕 Restaurantes:');
  restaurantData.forEach(r => console.log(`  - ${r.email} / senha123`));
  console.log('\n👤 Consumidores:');
  consumerData.forEach(c => console.log(`  - ${c.email} / senha123`));
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
