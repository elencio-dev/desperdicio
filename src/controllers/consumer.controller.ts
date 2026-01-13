import { Request, Response, NextFunction } from 'express';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../utils/prisma';

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// RF-02: Cadastro de consumidor
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingConsumer = await prisma.consumer.findUnique({
      where: { email: data.email }
    });

    if (existingConsumer) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const consumer = await prisma.consumer.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone
      }
    });

    const { password, ...consumerWithoutPassword } = consumer;

    res.status(201).json({
      message: 'Cadastro realizado com sucesso',
      consumer: consumerWithoutPassword
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error });
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const consumer = await prisma.consumer.findUnique({
      where: { email }
    });

    if (!consumer) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!consumer.isActive) {
      return res.status(403).json({ error: 'Conta desativada' });
    }

    const isValidPassword = await bcrypt.compare(password, consumer.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: consumer.id, type: 'consumer' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password: _, ...consumerWithoutPassword } = consumer;

    res.json({
      token,
      consumer: consumerWithoutPassword
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error });
    }
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumerId = (req as any).user.id;

    const consumer = await prisma.consumer.findUnique({
      where: { id: consumerId }
    });

    if (!consumer) {
      return res.status(404).json({ error: 'Consumidor não encontrado' });
    }

    const { password, ...consumerWithoutPassword } = consumer;

    res.json(consumerWithoutPassword);

  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const consumerId = (req as any).user.id;
    const { name, phone } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const consumer = await prisma.consumer.update({
      where: { id: consumerId },
      data: updateData
    });

    const { password, ...consumerWithoutPassword } = consumer;

    res.json(consumerWithoutPassword);

  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile
};