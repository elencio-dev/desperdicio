import cors from 'cors';
import "dotenv/config";
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';



// Routes
import adminRoutes from './routes/admin.routes.js';
import consumerRoutes from './routes/consumer.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import offerRoutes from './routes/offer.routes.js';
import orderRoutes from './routes/order.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import reviewRoutes from './routes/review.routes.js';
import webhookRoutes from './routes/webhook.routes.js';


// Auth
import { toNodeHandler } from "better-auth/node";
import { auth } from "./utils/auth.js";


//Swagger
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config.js';

// Middleware
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';

// Middleware

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - Server Status
app.get('/', (req, res) => {
  res.json({
    name: 'Food Surplus API',
    description: 'Backend MVP - SaaS de Venda de Excedentes de Comida',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      docs: '/api-docs'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Food Surplus API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Raw OpenAPI Spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Middleware para Mobile/Expo (Injeta Origin se estiver faltando)
app.use((req, res, next) => {
    if (!req.headers.origin) {
        req.headers.origin = process.env.API_URL || "http://localhost:3000";
    }
    next();
});

// Auth Route (Better Auth)
app.use("/api/auth", toNodeHandler(auth));

// Routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/consumers', consumerRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);


// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);


});

export default app;
