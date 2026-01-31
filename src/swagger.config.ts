import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Food Surplus API',
            version: '1.0.0',
            description: 'API para marketplace de venda de excedentes de comida - conectando restaurantes e consumidores',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desenvolvimento',
            }
        ],
        tags: [
            {
                name: 'Restaurants',
                description: 'Endpoints para gestão de restaurantes',
            },
            {
                name: 'Consumers',
                description: 'Endpoints para gestão de consumidores',
            },
            {
                name: 'Offers',
                description: 'Endpoints para gestão de ofertas de comida',
            },
            {
                name: 'Orders',
                description: 'Endpoints para gestão de pedidos',
            },
            {
                name: 'Reviews',
                description: 'Endpoints para avaliações de restaurantes',
            },
        ],
        components: {
            securitySchemes: {
                betterAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                    description: 'Better Auth session-based header. Para ambiente de desenvolvimento, utilize o header Authorization com o token da sessão ou cookies.',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    },
                },
                SignUpEmail: {
                    type: 'object',
                    required: ['email', 'password', 'name'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        name: { type: 'string' },
                        image: { type: 'string' }
                    }
                },
                SignInEmail: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' }
                    }
                },
                Session: {
                    type: 'object',
                    properties: {
                        user: { $ref: '#/components/schemas/User' },
                        session: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                userId: { type: 'string' },
                                expiresAt: { type: 'string', format: 'date-time' },
                                token: { type: 'string' }
                            }
                        }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['RESTAURANT', 'CONSUMER', 'ADMIN'] }
                    }
                },
                Restaurant: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        address: { type: 'string' },
                        isApproved: { type: 'boolean' }
                    },
                },
                Consumer: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' }
                    },
                },
                RestaurantRegister: {
                    type: 'object',
                    required: ['cnpj', 'name', 'email', 'password', 'phone', 'address', 'latitude', 'longitude', 'businessHours'],
                    properties: {
                        cnpj: { type: 'string', minLength: 14, maxLength: 14 },
                        name: { type: 'string', minLength: 3 },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        phone: { type: 'string', minLength: 10 },
                        address: { type: 'string' },
                        latitude: { type: 'number' },
                        longitude: { type: 'number' },
                        businessHours: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
                                    openTime: { type: 'string', example: '08:00' },
                                    closeTime: { type: 'string', example: '18:00' },
                                    isOpen: { type: 'boolean' }
                                }
                            }
                        }
                    }
                },
                ConsumerRegister: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        name: { type: 'string', minLength: 3 },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 },
                        phone: { type: 'string' }
                    }
                },

                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        consumerId: { type: 'string', format: 'uuid' },
                        offerId: { type: 'string', format: 'uuid' },
                        restaurantId: { type: 'string', format: 'uuid' },
                        quantity: { type: 'integer' },
                        totalAmount: { type: 'number' },
                        pickupCode: { type: 'string' },
                        status: { type: 'string', enum: ['PENDING_PAYMENT', 'CONFIRMED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
                        paymentStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REFUSED', 'REFUNDED'] },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Offer: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        restaurantId: { type: 'string', format: 'uuid' },
                        packageType: { type: 'string' },
                        description: { type: 'string' },
                        quantity: { type: 'integer' },
                        availableQuantity: { type: 'integer' },
                        originalPrice: { type: 'number' },
                        promotionalPrice: { type: 'number' },
                        discountPercent: { type: 'number' },
                        pickupStartTime: { type: 'string', format: 'date-time' },
                        pickupEndTime: { type: 'string', format: 'date-time' },
                        status: { type: 'string' },
                        isVegetarian: { type: 'boolean' },
                        isVegan: { type: 'boolean' }
                    }
                },
                Review: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        orderId: { type: 'string', format: 'uuid' },
                        consumerId: { type: 'string', format: 'uuid' },
                        restaurantId: { type: 'string', format: 'uuid' },
                        rating: { type: 'integer', minimum: 1, maximum: 5 },
                        comment: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Notification: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        userType: { type: 'string' },
                        type: { type: 'string' },
                        title: { type: 'string' },
                        message: { type: 'string' },
                        isRead: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                }
            },
        },


        paths: {
            '/api/auth/sign-up/email': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Cadastro básico de usuário',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/SignUpEmail' } }
                        }
                    },
                    responses: {
                        200: { description: 'Usuário criado com sucesso', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } } },
                        400: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/auth/sign-in/email': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Login com e-mail e senha',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/SignInEmail' } }
                        }
                    },
                    responses: {
                        200: { description: 'Login realizado com sucesso', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } } },
                        401: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/auth/email-otp/verify-email': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Verificar e-mail com código OTP',
                    description: 'Valida o código de 6 dígitos enviado por e-mail.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'otp'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        otp: { type: 'string', minLength: 6, maxLength: 6 }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'E-mail verificado com sucesso' },
                        400: { description: 'Código inválido ou expirado' }
                    }
                }
            },
            '/api/auth/email-otp/send-verification-otp': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Reenviar código de verificação',
                    description: 'Envia um novo código OTP para o e-mail do usuário.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'type'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        type: { type: 'string', enum: ['email-verification'], default: 'email-verification' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Código enviado com sucesso', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } } },
                        400: { description: 'Erro ao enviar código' }
                    }
                }
            },
            '/api/auth/get-session': {
                get: {
                    tags: ['Authentication'],
                    summary: 'Obter dados da sessão atual',
                    security: [{ betterAuth: [] }],
                    responses: {
                        200: { description: 'Sessão ativa', content: { 'application/json': { schema: { $ref: '#/components/schemas/Session' } } } },
                        401: { description: 'Sessão inválida ou expirada' }
                    }
                }
            },
            '/api/auth/sign-out': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Encerrar sessão',
                    security: [{ betterAuth: [] }],
                    responses: {
                        200: { description: 'Sessão encerrada com sucesso' }
                    }
                }
            },
            '/api/restaurants/register': {
                post: {
                    tags: ['Restaurants'],
                    summary: 'Cadastro completo de Restaurante',
                    description: 'Cria uma conta de autenticação e um perfil de restaurante com horários de funcionamento.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/RestaurantRegister' } }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Restaurante cadastrado com sucesso',
                            content: { 'application/json': { schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                    restaurant: { $ref: '#/components/schemas/Restaurant' },
                                    session: { type: 'object' }
                                }
                            } } }
                        },
                        400: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/consumers/register': {
                post: {
                    tags: ['Consumers'],
                    summary: 'Cadastro completo de Consumidor',
                    description: 'Cria uma conta de autenticação e um perfil de consumidor.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': { schema: { $ref: '#/components/schemas/ConsumerRegister' } }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Consumidor cadastrado com sucesso',
                            content: { 'application/json': { schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                    consumer: { $ref: '#/components/schemas/Consumer' },
                                    session: { type: 'object' }
                                }
                            } } }
                        },
                        400: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },

            '/api/orders': {
                post: {
                    tags: ['Orders'],
                    summary: 'Criar um novo pedido',
                    security: [{ betterAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['offerId'],
                                    properties: {
                                        offerId: { type: 'string', format: 'uuid' },
                                        quantity: { type: 'integer', default: 1 },
                                        paymentMethod: { type: 'string', enum: ['PIX', 'CREDIT_CARD'] }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Pedido criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
                        400: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/orders/my-orders': {
                get: {
                    tags: ['Orders'],
                    summary: 'Listar pedidos do consumidor logado',
                    security: [{ betterAuth: [] }],
                    responses: {
                        200: { description: 'Lista de pedidos' }
                    }
                }
            },
            '/api/orders/{id}/cancel': {
                post: {
                    tags: ['Orders'],
                    summary: 'Cancelar um pedido',
                    security: [{ betterAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Pedido cancelado' }
                    }
                }
            },
            '/api/orders/validate-pickup': {
                post: {
                    tags: ['Orders'],
                    summary: 'Validar um código de retirada (Restaurante)',
                    security: [{ betterAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['pickupCode'],
                                    properties: { pickupCode: { type: 'string' } }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Código válido' }
                    }
                }
            },
            '/api/orders/confirm-pickup': {
                post: {
                    tags: ['Orders'],
                    summary: 'Confirmar a retirada (Restaurante)',
                    security: [{ betterAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['pickupCode'],
                                    properties: { pickupCode: { type: 'string' } }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Retirada confirmada' }
                    }
                }
            },
            '/api/offers': {
                get: {
                    tags: ['Offers'],
                    summary: 'Listar ofertas com filtros',
                    parameters: [
                        { in: 'query', name: 'latitude', schema: { type: 'number' } },
                        { in: 'query', name: 'longitude', schema: { type: 'number' } },
                        { in: 'query', name: 'maxDistance', schema: { type: 'number', default: 5 } },
                        { in: 'query', name: 'minPrice', schema: { type: 'number' } },
                        { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
                        { in: 'query', name: 'isVegetarian', schema: { type: 'boolean' } },
                        { in: 'query', name: 'isVegan', schema: { type: 'boolean' } }
                    ],
                    responses: {
                        200: { description: 'Lista de ofertas' }
                    }
                },
                post: {
                    tags: ['Offers'],
                    summary: 'Criar uma nova oferta (Restaurante)',
                    security: [{ betterAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/Offer' } } }
                    },
                    responses: {
                        201: { description: 'Oferta criada' }
                    }
                }
            },
            '/api/reviews': {
                post: {
                    tags: ['Reviews'],
                    summary: 'Avaliar um pedido concluído',
                    security: [{ betterAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['orderId', 'rating'],
                                    properties: {
                                        orderId: { type: 'string', format: 'uuid' },
                                        rating: { type: 'integer', minimum: 1, maximum: 5 },
                                        comment: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Avaliação criada' }
                    }
                }
            },
            '/api/notifications': {
                get: {
                    tags: ['Notifications'],
                    summary: 'Obter notificações do usuário',
                    security: [{ betterAuth: [] }],
                    responses: {
                        200: { description: 'Lista de notificações' }
                    }
                }
            },
            '/api/admin/restaurants/pending': {
                get: {
                    tags: ['Admin'],
                    summary: 'Listar restaurantes pendentes de aprovação',
                    security: [{ betterAuth: [] }],
                    responses: {
                        200: { description: 'Lista de restaurantes' }
                    }
                }
            },
            '/api/admin/restaurants/{id}/approve': {
                post: {
                    tags: ['Admin'],
                    summary: 'Aprovar um restaurante',
                    security: [{ betterAuth: [] }],
                    parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                    responses: {
                        200: { description: 'Restaurante aprovado' }
                    }
                }
            }
        }
    },

    apis: ['./src/routes/*.ts', './src/routes/*.js'], // Suporte a TS e JS
};


export const swaggerSpec = swaggerJsdoc(options);
