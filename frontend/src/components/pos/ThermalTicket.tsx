import React from 'react';
import type { InvoiceRecord } from '../../services/invoiceService';

interface ThermalTicketProps {
  invoice: InvoiceRecord;
  businessName: string;
  nit: string;
  city?: string;
  address?: string;
  phone?: string;
  resolutionNumber?: string;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  invoice,
  businessName,
  nit,
  city = 'Colombia',
  address,
  phone,
  resolutionNumber,
}) => {
  return (
    <div id="thermal-print-area" className="hidden print:block text-black bg-white font-mono text-[12px] leading-tight max-w-[80mm] p-2 mx-auto">
      {/* Cabecera del Establecimiento */}
      <div className="text-center pb-2 border-b border-dashed border-black mb-2">
        <h2 className="font-bold text-sm uppercase">{businessName}</h2>
        <p className="text-[11px]">NIT: {nit}</p>
        {address && <p className="text-[10px]">{address}</p>}
        {city && <p className="text-[10px]">{city}</p>}
        {phone && <p className="text-[10px]">Tel: {phone}</p>}
        <p className="text-[10px] mt-1">SISTEMA POS - FACTURA ELECTRÓNICA DIAN</p>
        {resolutionNumber && (
          <p className="text-[9px]">Res. DIAN: {resolutionNumber}</p>
        )}
      </div>

      {/* Datos de la Factura y Cajero */}
      <div className="text-[10px] mb-2 pb-2 border-b border-dashed border-black space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>FACTURA:</span>
          <span>{invoice.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>FECHA:</span>
          <span>{invoice.date}</span>
        </div>
        <div className="flex justify-between">
          <span>CAJERO:</span>
          <span>{invoice.cashierName || 'Cajero Barra'}</span>
        </div>
        <div className="flex justify-between">
          <span>CLIENTE:</span>
          <span>{invoice.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>CC/NIT:</span>
          <span>{invoice.customerNit}</span>
        </div>
      </div>

      {/* Detalle de Productos Vendidos */}
      <table className="w-full text-[10px] mb-2">
        <thead>
          <tr className="border-b border-black text-left font-bold">
            <th className="py-1">CANT</th>
            <th className="py-1">DESCRIPCIÓN</th>
            <th className="py-1 text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dotted divide-gray-400">
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="py-0.5">
              <td className="align-top py-0.5">{item.quantity}</td>
              <td className="align-top py-0.5 pr-1">{item.name}</td>
              <td className="align-top text-right py-0.5 font-bold">
                ${item.subtotal.toLocaleString('es-CO')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales y Medios de Pago */}
      <div className="border-t border-dashed border-black pt-1.5 text-[11px] space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>${invoice.subtotal.toLocaleString('es-CO')}</span>
        </div>
        <div className="flex justify-between">
          <span>IMPUESTOS (ICO/IVA):</span>
          <span>${invoice.taxAmount.toLocaleString('es-CO')}</span>
        </div>
        {invoice.tipAmount > 0 && (
          <div className="flex justify-between">
            <span>PROPINA VOLUNTARIA (10%):</span>
            <span>${invoice.tipAmount.toLocaleString('es-CO')}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
          <span>TOTAL A PAGAR:</span>
          <span>${invoice.total.toLocaleString('es-CO')}</span>
        </div>
        <div className="flex justify-between text-[10px] pt-0.5">
          <span>FORMA DE PAGO:</span>
          <span className="font-bold">{invoice.paymentMethod}</span>
        </div>
      </div>

      {/* Datos Legales DIAN & CUFE */}
      <div className="border-t border-dashed border-black pt-2 text-center text-[9px] space-y-1">
        <p className="font-bold">CUFE DIAN:</p>
        <p className="break-all font-mono leading-none text-[8px] bg-gray-100 p-1 border border-gray-300">
          {invoice.cufe}
        </p>
        <p className="mt-1 text-[8px]">Consulte su documento electrónico en dian.gov.co</p>
        <p className="font-bold text-[10px] mt-2">¡GRACIAS POR SU COMPRA!</p>
        <p className="text-[8px] text-gray-600">Software Licenciado SaaS - Nightlife & Bar POS</p>
      </div>
    </div>
  );
};
