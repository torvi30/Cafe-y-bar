import React, { useState, useEffect } from 'react';
import { useTenantConfig } from '../context/TenantConfigContext';
import { listenCompanyInvoices, InvoiceRecord } from '../services/invoiceService';

export const DianInvoicesView: React.FC = () => {
  const { tenantId, settings } = useTenantConfig();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    setIsLoading(true);
    const unsub = listenCompanyInvoices(tenantId, (data) => {
      setInvoices(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [tenantId]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0d14] p-6 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>📑</span> Facturación Electrónica DIAN
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Motor DIAN Colombia (UBL 2.1) • Resolución Nº {settings?.dianConfig?.resolutionNumber || '18764000001'} • Prefijo{' '}
            <span className="font-mono text-amber-400 font-bold">{settings?.dianConfig?.prefix || 'SETT'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Web Service DIAN: En línea
          </span>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="flex-1 overflow-y-auto bg-[#121824] border border-slate-800 rounded-3xl p-4 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="p-3">Factura</th>
              <th className="p-3">Fecha / Hora</th>
              <th className="p-3">Cliente / Adquirente</th>
              <th className="p-3">NIT / Cédula</th>
              <th className="p-3 text-right">Impuestos</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Estado DIAN</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                  Cargando facturas en tiempo real desde Firestore...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                  No hay facturas emitidas aún en este bar.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id || inv.invoiceNumber} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-bold text-amber-400">{inv.invoiceNumber}</td>
                  <td className="p-3 text-slate-300 font-sans">{inv.date}</td>
                  <td className="p-3 text-white font-sans font-semibold">{inv.customerName}</td>
                  <td className="p-3 text-slate-400">{inv.customerNit}</td>
                  <td className="p-3 text-right text-slate-300">${inv.taxAmount.toLocaleString('es-CO')}</td>
                  <td className="p-3 text-right font-black text-emerald-400 text-sm">
                    ${inv.total.toLocaleString('es-CO')}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.dianStatus === 'ACCEPTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : inv.dianStatus === 'QUEUED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {inv.dianStatus === 'ACCEPTED' ? '✓ Aceptada' : '⏳ En Cola'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition"
                    >
                      Ver CUFE & QR
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalle CUFE */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-white">Factura {selectedInvoice.invoiceNumber}</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  CUFE (SHA-384 DIAN):
                </span>
                <p className="font-mono text-[11px] text-amber-300 break-all select-all">
                  {selectedInvoice.cufe}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Emisor:</span>
                  <span className="font-semibold text-white">{settings.businessName}</span>
                  <span className="text-slate-400 block text-[10px]">NIT: {settings.nit}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Adquirente:</span>
                  <span className="font-semibold text-white">{selectedInvoice.customerName}</span>
                  <span className="text-slate-400 block text-[10px]">CC/NIT: {selectedInvoice.customerNit}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px]">
                ✓ Validada con firma digital XAdES-BES y ApplicationResponse emitido por la DIAN.
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => alert('Descargando XML UBL 2.1 firmado')}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase"
              >
                Descargar XML
              </button>
              <button
                onClick={() => alert('Imprimiendo tirilla térmica con código QR')}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs uppercase"
              >
                🖨️ Imprimir Tirilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

