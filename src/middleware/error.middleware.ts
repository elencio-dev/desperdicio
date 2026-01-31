import { NextFunction, Request, Response } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Registro duplicado',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erro de validação',
      details: err.errors
    });
  }

  // Handle Better Auth errors or other string status codes
  let statusCode = 500;
  if (typeof err.status === 'number') {
    statusCode = err.status;
  } else if (err.status === 'BAD_REQUEST') {
    statusCode = 400;
  }

  res.status(statusCode).json({
    error: err.message || 'Erro interno do servidor'
  });
};
