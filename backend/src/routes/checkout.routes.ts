import { Router, Request, Response } from 'express';
import { CheckoutService } from '../services/checkout.service.js';

export const checkoutRouter = Router();

/**
 * POST /api/v1/checkout/fast-pos
 * Endpoint de checkout ultra rápido para barra
 */
checkoutRouter.post('/fast-pos', async (req: Request, res: Response) => {
  try {
    const { items, paymentMethod, customerNit, customerName, customerEmail, tableId, includeTip } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La orden debe contener al menos un producto.' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'El método de pago es requerido.' });
    }

    const sale = await CheckoutService.processSale(req.tenantSettings, {
      items,
      paymentMethod,
      customerNit,
      customerName,
      customerEmail,
      tableId,
      includeTip,
    });

    res.status(201).json({
      success: true,
      data: sale,
    });
  } catch (error: any) {
    console.error('Error procesando venta:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno al procesar checkout',
    });
  }
});

