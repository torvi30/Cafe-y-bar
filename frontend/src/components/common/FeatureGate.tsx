import React from 'react';
import { useTenantConfig, TenantFeatures } from '../../context/TenantConfigContext';

interface FeatureGateProps {
  feature: keyof TenantFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente declarativo para renderizar elementos visuales condicionalmente
 * según las banderas activas del bar.
 * 
 * Ejemplo de uso:
 * <FeatureGate feature="inventoryEnabled" fallback={<span>Sin control de stock</span>}>
 *   <BadgeStock stock={item.stock} />
 * </FeatureGate>
 */
export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, fallback = null }) => {
  const { isFeatureActive, isLoading } = useTenantConfig();

  if (isLoading) return null;
  return isFeatureActive(feature) ? <>{children}</> : <>{fallback}</>;
};

