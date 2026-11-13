import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebaseAdmin.js';
import { TenantSettings, TenantFeatures } from '../types/tenant.types.js';

// Extender el tipado de Express Request
declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      tenantSettings: TenantSettings;
      features: TenantFeatures;
    }
  }
}

// Caché en memoria de corta duración para no saturar Firestore en cada tap de barra
const settingsCache = new Map<string, { data: TenantSettings; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de caché

export async function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req.query.tenantId as string);

    if (!tenantId) {
      return res.status(400).json({
        error: 'Header x-tenant-id o query param tenantId es requerido para solicitudes multi-tenant.',
      });
    }

    const now = Date.now();
    const cached = settingsCache.get(tenantId);

    if (cached && cached.expiresAt > now) {
      req.tenantId = tenantId;
      req.tenantSettings = cached.data;
      req.features = cached.data.features;
      return next();
    }

    // Consulta en Firestore: /tenants/{tenantId}/config/settings
    const docRef = db.doc(`tenants/${tenantId}/config/settings`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: `Configuración de tenant no encontrada para: ${tenantId}`,
      });
    }

    const tenantData = docSnap.data() as TenantSettings;
    settingsCache.set(tenantId, { data: tenantData, expiresAt: now + CACHE_TTL_MS });

    req.tenantId = tenantId;
    req.tenantSettings = tenantData;
    req.features = tenantData.features;

    next();
  } catch (error: any) {
    console.error('Error en tenantContextMiddleware:', error);
    res.status(500).json({ error: 'Error resolviendo contexto del tenant', details: error.message });
  }
}

// Middleware de guarda por Feature Flag en backend
export function requireFeature(featureKey: keyof TenantFeatures) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.features || !req.features[featureKey]) {
      return res.status(403).json({
        error: `El módulo '${featureKey}' no está habilitado para el tenant ${req.tenantId}`,
        code: 'FEATURE_DISABLED',
      });
    }
    next();
  };
}

