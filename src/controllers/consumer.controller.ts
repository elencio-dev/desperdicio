import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { auth } from '../utils/auth.js';
import prisma from '../utils/prisma.js';

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional()
});

// RF-02: Cadastro de consumidor
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // 1. Better Auth: Criar Usuário
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'CONSUMER'
      }
    });

    if (!result || !result.user) {
      return res.status(400).json({ error: 'Erro ao criar conta de autenticação' });
    }

    // 2. Criar perfil do consumidor vinculado ao User
    try {
      const consumer = await prisma.consumer.create({
        data: {
          userId: result.user.id,
          name: data.name,
          email: data.email,
          phone: data.phone
        }
      });

      res.status(201).json({
        message: 'Cadastro realizado com sucesso',
        consumer,
        session: 'session' in result ? result.session : null
      });
    } catch (profileError) {
      console.error('Erro ao criar perfil de consumidor:', profileError);
      return res.status(500).json({
        error: 'Conta criada, mas erro ao configurar perfil. Entre em contato com o suporte.',
        userId: result.user.id
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error });
    }
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    const consumer = await prisma.consumer.findUnique({
      where: { userId: user.id }
    });

    if (!consumer) {
      return res.status(404).json({ error: 'Consumidor não encontrado' });
    }

    res.json(consumer);

  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { name, phone } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const consumer = await prisma.consumer.update({
      where: { userId: user.id },
      data: updateData
    });

    res.json(consumer);

  } catch (error) {
    next(error);
  }
};

export default {
  register,
  getProfile,
  updateProfile
};
