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



    },
    apis: ['./src/routes/*.ts', './src/routes/*.js'], // Suporte a TS e JS
};


export const swaggerSpec = swaggerJsdoc(options);
