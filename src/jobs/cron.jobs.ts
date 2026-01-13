import cron from 'node-cron';
import prisma from '../utils/prisma';


// RN-02: Expirar ofertas automaticamente
export const expireOffers = cron.schedule('*/5 * * * *', async () => {
  console.log('🕐 Verificando ofertas expiradas...');

  try {
    const result = await prisma.offer.updateMany({
      where: {
        status: 'ACTIVE',
        pickupEndTime: {
          lt: new Date()
        }
      },
      data: {
        status: 'EXPIRED'
      }
    });

    if (result.count > 0) {
      console.log(`✅ ${result.count} ofertas expiradas`);
    }
  } catch (error) {
    console.error('❌ Erro ao expirar ofertas:', error);
  }
});

// RN-07: Processar no-shows e bloquear usuários
export const processNoShows = cron.schedule('0 * * * *', async () => {
  console.log('🕐 Processando ausências de retirada...');

  try {
    // Buscar pedidos que não foram retirados
    const noShows = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        offer: {
          pickupEndTime: {
            lt: new Date()
          }
        }
      },
      include: {
        consumer: true,
        offer: true
      }
    });

    for (const order of noShows) {
      // Atualizar status do pedido
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'NO_SHOW' }
      });

      // Incrementar contador de falhas
      const newFailedPickups = order.consumer.failedPickups + 1;

      // RN-07: Bloquear após 3 ausências
      let updateData: any = {
        failedPickups: newFailedPickups
      };

      if (newFailedPickups >= 3) {
        const blockUntil = new Date();
        blockUntil.setDate(blockUntil.getDate() + 30); // 30 dias
        updateData.blockedUntil = blockUntil;

        // Notificar bloqueio
        await prisma.notification.create({
          data: {
            userId: order.consumerId,
            userType: 'consumer',
            type: 'ORDER_CANCELLED',
            title: 'Conta Temporariamente Bloqueada',
            message: `Sua conta foi bloqueada até ${blockUntil.toLocaleDateString()} devido a 3 ausências consecutivas na retirada.`,
            relatedId: order.consumerId
          }
        });
      } else {
        // Apenas alertar
        await prisma.notification.create({
          data: {
            userId: order.consumerId,
            userType: 'consumer',
            type: 'ORDER_CANCELLED',
            title: 'Ausência Registrada',
            message: `Você não retirou seu pedido. Ausências: ${newFailedPickups}/3. Após 3 ausências, sua conta será bloqueada por 30 dias.`,
            relatedId: order.id
          }
        });
      }

      await prisma.consumer.update({
        where: { id: order.consumerId },
        data: updateData
      });

      // Devolver quantidade
      await prisma.offer.update({
        where: { id: order.offerId },
        data: {
          availableQuantity: {
            increment: order.quantity
          }
        }
      });
    }

    if (noShows.length > 0) {
      console.log(`✅ ${noShows.length} no-shows processados`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar no-shows:', error);
  }
});

// RN-09: Processar pagamentos para restaurantes (D+1)
export const processPayouts = cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Processando repasses para restaurantes...');

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date(yesterday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar transações pendentes de D-1
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'processed',
        createdAt: {
          gte: yesterday,
          lt: tomorrow
        }
      }
    });

    for (const transaction of transactions) {
      // Aqui você integraria com API de pagamento real
      // Por exemplo: Stripe Connect, PagSeguro Split, etc.

      // Simulação de pagamento
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'paid',
          paymentDate: new Date()
        }
      });

      // Notificar restaurante
      await prisma.notification.create({
        data: {
          userId: transaction.restaurantId,
          userType: 'restaurant',
          type: 'NEW_ORDER',
          title: 'Pagamento Recebido',
          message: `Você recebeu R$ ${transaction.restaurantAmount.toFixed(2)} referente a vendas de ontem.`,
          relatedId: transaction.id
        }
      });
    }

    if (transactions.length > 0) {
      console.log(`✅ ${transactions.length} pagamentos processados`);
    }
  } catch (error) {
    console.error('❌ Erro ao processar pagamentos:', error);
  }
});

// Enviar lembretes de retirada (30 min antes)
export const sendPickupReminders = cron.schedule('*/10 * * * *', async () => {
  console.log('🕐 Enviando lembretes de retirada...');

  try {
    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60000);

    const orders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        offer: {
          pickupStartTime: {
            gte: now,
            lte: in30Minutes
          }
        }
      },
      include: {
        offer: {
          include: {
            restaurant: true
          }
        }
      }
    });

    for (const order of orders) {
      await prisma.notification.create({
        data: {
          userId: order.consumerId,
          userType: 'consumer',
          type: 'PICKUP_REMINDER',
          title: 'Lembrete de Retirada ⏰',
          message: `Seu pedido no ${order.offer.restaurant.name} está disponível para retirada em 30 minutos!`,
          relatedId: order.id
        }
      });
    }

    if (orders.length > 0) {
      console.log(`✅ ${orders.length} lembretes enviados`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar lembretes:', error);
  }
});

// Desbloquear usuários após período
export const unblockUsers = cron.schedule('0 0 * * *', async () => {
  console.log('🕐 Verificando desbloqueio de usuários...');

  try {
    const result = await prisma.consumer.updateMany({
      where: {
        blockedUntil: {
          lte: new Date()
        },
        isActive: true
      },
      data: {
        blockedUntil: null,
        failedPickups: 0
      }
    });

    if (result.count > 0) {
      console.log(`✅ ${result.count} usuários desbloqueados`);
    }
  } catch (error) {
    console.error('❌ Erro ao desbloquear usuários:', error);
  }
});

export function startAllJobs() {
  console.log('🚀 Iniciando cron jobs...');
  
  expireOffers.start();
  processNoShows.start();
  processPayouts.start();
  sendPickupReminders.start();
  unblockUsers.start();

  console.log('✅ Todos os cron jobs iniciados');
}

export function stopAllJobs() {
  expireOffers.stop();
  processNoShows.stop();
  processPayouts.stop();
  sendPickupReminders.stop();
  unblockUsers.stop();
  
  console.log('⏸️  Todos os cron jobs parados');
}

// Adicione ao package.json:
// "node-cron": "^3.0.3"

// Adicione ao server.ts:
// import { startAllJobs } from './jobs/cron.jobs';
// startAllJobs();