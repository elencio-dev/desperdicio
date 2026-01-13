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
            },
            {
                url: 'https://api.foodsurplus.com',
                description: 'Servidor de produção',
            },
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
            {
                name: 'Notifications',
                description: 'Endpoints para notificações do sistema',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT recebido após login. Use: Bearer {seu-token}',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Mensagem de erro',
                        },
                        details: {
                            type: 'string',
                            description: 'Detalhes adicionais do erro',
                        },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Mensagem de sucesso',
                        },
                    },
                },
                Restaurant: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        name: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        phone: {
                            type: 'string',
                        },
                        address: {
                            type: 'string',
                        },
                        latitude: {
                            type: 'number',
                            format: 'double',
                        },
                        longitude: {
                            type: 'number',
                            format: 'double',
                        },
                        description: {
                            type: 'string',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Consumer: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        name: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        phone: {
                            type: 'string',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Offer: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        restaurantId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        title: {
                            type: 'string',
                        },
                        description: {
                            type: 'string',
                        },
                        originalPrice: {
                            type: 'number',
                            format: 'double',
                        },
                        discountedPrice: {
                            type: 'number',
                            format: 'double',
                        },
                        quantity: {
                            type: 'integer',
                        },
                        availableFrom: {
                            type: 'string',
                            format: 'date-time',
                        },
                        availableUntil: {
                            type: 'string',
                            format: 'date-time',
                        },
                        status: {
                            type: 'string',
                            enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
                        },
                    },
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        consumerId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        offerId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        quantity: {
                            type: 'integer',
                        },
                        totalPrice: {
                            type: 'number',
                            format: 'double',
                        },
                        pickupCode: {
                            type: 'string',
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Review: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        consumerId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        restaurantId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        orderId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        rating: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 5,
                        },
                        comment: {
                            type: 'string',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Notification: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        userId: {
                            type: 'string',
                            format: 'uuid',
                        },
                        type: {
                            type: 'string',
                        },
                        title: {
                            type: 'string',
                        },
                        message: {
                            type: 'string',
                        },
                        isRead: {
                            type: 'boolean',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'], // Caminho para os arquivos de rotas
};

export const swaggerSpec = swaggerJsdoc(options);
