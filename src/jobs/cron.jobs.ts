import cron from 'node-cron';
import prisma from '../utils/prisma.js';

export function setupCronJobs() {
  // 1. Verificar pedidos expirados (No-Show) a cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    console.log('🕒 Executando Job: Verificação de No-Show...');

    try {
      const now = new Date();

      // Buscar pedidos CONFIRMADOS onde o horário de retirada já passou
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: 'CONFIRMED',
          offer: {
            pickupEndTime: { lt: now }
          }
        },
        include: {
          offer: true
        }
      });

      for (const order of expiredOrders) {
        await prisma.$transaction(async (tx) => {
          // Marcar como No-Show
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'NO_SHOW' }
          });

          // Incrementar contador de falhas do consumidor
          await tx.consumer.update({
            where: { id: order.consumerId },
            data: {
              failedPickups: { increment: 1 }
            }
          });

          // RN-07: Bloquear se tiver 3 falhas
          const consumer = await tx.consumer.findUnique({
            where: { id: order.consumerId }
          });

          if (consumer && consumer.failedPickups >= 3) {
            const blockedUntil = new Date();
            blockedUntil.setDate(blockedUntil.getDate() + 7); // Bloqueio de 7 dias

            await tx.consumer.update({
              where: { id: order.consumerId },
              data: {
                blockedUntil,
                failedPickups: 0 // Reseta após o bloqueio ser aplicado
              }
            });

            console.log(`🚫 Consumidor ${consumer.id} bloqueado por 7 dias (3 no-shows).`);
          }
        });
      }

      if (expiredOrders.length > 0) {
        console.log(`✅ ${expiredOrders.length} pedidos marcados como NO_SHOW.`);
      }
    } catch (error) {
      console.error('❌ Erro no Job de No-Show:', error);
    }
  });

  // 2. Limpar ofertas expiradas a cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('🕒 Executando Job: Limpeza de Ofertas Expiradas...');

    try {
      const now = new Date();
      const result = await prisma.offer.updateMany({
        where: {
          status: 'ACTIVE',
          pickupEndTime: { lt: now }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      if (result.count > 0) {
        console.log(`✅ ${result.count} ofertas expiradas limpas.`);
      }
    } catch (error) {
      console.error('❌ Erro no Job de Limpeza de Ofertas:', error);
    }
  });
}
