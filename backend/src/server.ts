import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tenantContextMiddleware } from './middleware/tenantContext.js';
import { checkoutRouter } from './routes/checkout.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { tenantRouter } from './routes/tenant.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Healthcheck general sin tenant
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'nightlife-pos-backend', timestamp: new Date() });
});

// Todas las rutas de negocio bajo middleware multi-tenant
app.use('/api/v1', tenantContextMiddleware);

app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/tenant', tenantRouter);

app.listen(PORT, () => {
  console.log(`🚀 Servidor POS Nightlife escuchando en http://localhost:${PORT}`);
});

