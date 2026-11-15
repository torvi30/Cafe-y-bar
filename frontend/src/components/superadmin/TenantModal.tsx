import React, { useState, useEffect } from 'react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { TenantRecord, SubscriptionPlan, PLAN_PRESETS } from '../../types/saas.types';
import { notifyWarning, notifyError, toastSuccess } from '../../lib/alerts';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantToEdit?: TenantRecord | null;
}

export const TenantModal: React.FC<TenantModalProps> = ({ isOpen, onClose, tenantToEdit }) => {
  const { createTenant, updateTenant } = useSuperAdmin();

  const [businessName, setBusinessName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [nit, setNit] = useState('');
  const [city, setCity] = useState('Bogotá D.C.');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<SubscriptionPlan>('CLUB_PRO');
  const [monthlyFee, setMonthlyFee] = useState<number>(190000);
  const [prefix, setPrefix] = useState('SETT');
  const [resolutionNumber, setResolutionNumber] = useState('18764000001');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tenantToEdit) {
      setBusinessName(tenantToEdit.businessName || '');
      setTradeName(tenantToEdit.tradeName || '');
      setNit(tenantToEdit.nit || '');
      setCity(tenantToEdit.city || 'Bogotá D.C.');
      setAddress(tenantToEdit.address || '');
      setPhone(tenantToEdit.phone || '');
      setEmail(tenantToEdit.email || '');
      setPlan(tenantToEdit.plan || 'CLUB_PRO');
      setMonthlyFee(typeof tenantToEdit.monthlyFee === 'number' ? tenantToEdit.monthlyFee : 190000);
      setPrefix(tenantToEdit.dianConfig?.prefix || 'SETT');
      setResolutionNumber(tenantToEdit.dianConfig?.resolutionNumber || '18764000001');
    } else {
      setBusinessName('');
      setTradeName('');
      setNit('');
      setCity('Bogotá D.C.');
      setAddress('');
      setPhone('');
      setEmail('');
      setPlan('CLUB_PRO');
      setMonthlyFee(PLAN_PRESETS.CLUB_PRO.price);
      setPrefix('BAR');
      setResolutionNumber('18764000001');
    }
  }, [tenantToEdit, isOpen]);

  const handlePlanChange = (selectedPlan: SubscriptionPlan) => {
    setPlan(selectedPlan);
    setMonthlyFee(PLAN_PRESETS[selectedPlan].price);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !nit.trim()) {
      notifyWarning('Campos Incompletos', 'Por favor ingresa la razón social y el número de NIT.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tenantToEdit) {
        await updateTenant(tenantToEdit.tenantId, {
          businessName: businessName.trim(),
          tradeName: tradeName.trim() || businessName.trim(),
          nit: nit.trim(),
          city,
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          plan,
          monthlyFee: Number(monthlyFee),
          dianConfig: {
            ...(tenantToEdit.dianConfig || {
              currentNumber: 1,
              environment: '2',
              taxRegime: 'RESPONSABLE_IMPOCONSUMO_8',
            }),
            resolutionNumber,
            prefix,
          },
        });
        toastSuccess(`Empresa "${tradeName || businessName}" actualizada`);
      } else {
        await createTenant({
          businessName: businessName.trim(),
          tradeName: tradeName.trim() || businessName.trim(),
          nit: nit.trim(),
          city,
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          plan,
          status: 'ACTIVE',
          monthlyFee: Number(monthlyFee),
          features: { ...PLAN_PRESETS[plan].features },
          dianConfig: {
            resolutionNumber,
            prefix,
            currentNumber: 1,
            environment: '2',
            taxRegime: 'RESPONSABLE_IMPOCONSUMO_8',
          },
        });
        toastSuccess(`Empresa "${tradeName || businessName}" creada exitosamente`);
      }
      onClose();
    } catch (err: any) {
      console.error('Error guardando empresa:', err);
      notifyError('Error al Guardar', err?.message || 'Ocurrió un error al guardar los datos de la empresa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0e1422] border border-amber-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
              🏢
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {tenantToEdit ? `Editar Empresa: ${tenantToEdit.tradeName}` : 'Alta de Nuevo Bar / Discoteca'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {tenantToEdit
                  ? 'Modifica los datos fiscales, comerciales y el plan contratado'
                  : 'Aprovisionamiento instantáneo de base de datos multi-tenant y motor DIAN'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Razón Social y Nombre Comercial */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Razón Social *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ej. Inversiones Babilonia S.A.S"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Nombre Comercial (Aviso)</label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="ej. Discoteca Babilonia"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Plan de Suscripción y Mensualidad (COP) */}
          <div className="grid grid-cols-2 gap-3 bg-[#07090e] p-3 rounded-2xl border border-amber-500/25">
            <div>
              <label className="font-bold text-amber-300 block mb-1">Plan de Suscripción SaaS</label>
              <select
                value={plan}
                onChange={(e) => {
                  const newPlan = e.target.value as SubscriptionPlan;
                  setPlan(newPlan);
                  if (PLAN_PRESETS[newPlan]) {
                    setMonthlyFee(PLAN_PRESETS[newPlan].price);
                  }
                }}
                className="w-full bg-[#0e1422] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="LEGAL_DIAN">Plan Legal DIAN (Básico)</option>
                <option value="CLUB_PRO">Plan Discoteca & Club Pro</option>
                <option value="GASTROBAR_FULL">Plan Gastrobar & Lounge Full</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-emerald-400 block mb-1">Tarifa Mensual Cobrada (COP) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-mono font-bold text-emerald-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  required
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  placeholder="190000"
                  className="w-full bg-[#0e1422] border border-emerald-500/50 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* NIT y Ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">NIT *</label>
              <input
                type="text"
                required
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="901.458.963-2"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Ciudad</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Bogotá D.C.">Bogotá D.C.</option>
                <option value="Medellín">Medellín</option>
                <option value="Cali">Cali</option>
                <option value="Barranquilla">Barranquilla</option>
                <option value="Cartagena">Cartagena</option>
                <option value="Bucaramanga">Bucaramanga</option>
                <option value="Pereira">Pereira</option>
                <option value="Santa Marta">Santa Marta</option>
                <option value="Villavicencio">Villavicencio</option>
              </select>
            </div>
          </div>

          {/* Dirección y Contacto */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Cl. 85 # 14-05"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="310 456 7890"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Email Facturación</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="factura@babilonia.com"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Parámetros DIAN Iniciales */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Prefijo DIAN</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="SETT"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Resolución DIAN</label>
              <input
                type="text"
                value={resolutionNumber}
                onChange={(e) => setResolutionNumber(e.target.value)}
                placeholder="18764000001"
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl uppercase transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black rounded-xl uppercase tracking-wider transition shadow-lg shadow-amber-400/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : tenantToEdit ? (
                'Guardar Cambios'
              ) : (
                'Crear Establecimiento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
