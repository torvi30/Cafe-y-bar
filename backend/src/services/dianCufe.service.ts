import crypto from 'crypto';

export interface CufeCalculationParams {
  numFac: string;          // Ej: "SETT1421"
  fecFac: string;          // Formato: "YYYY-MM-DD"
  horFac: string;          // Formato: "HH:mm:ss-05:00"
  valFac: string;          // Valor bruto sin tributos (ej: "100000.00")
  codImp1: string;         // "01" (IVA) ó "04" (Impoconsumo)
  valImp1: string;         // Valor del tributo (ej: "8000.00")
  valTot: string;          // Total a pagar (ej: "108000.00")
  nitEmisor: string;       // NIT sin dígito de verificación
  numAdq: string;          // NIT/Cédula cliente o "222222222222" (Consumidor Final)
  claveTecnica: string;    // Clave técnica DIAN de la resolución
  tipoAmbiente: '1' | '2'; // 1: Producción, 2: Habilitación/Pruebas
}

export class DianCufeService {
  /**
   * Genera el CUFE (Código Único de Factura Electrónica) según el Anexo Técnico 1.9 de la DIAN.
   * Algoritmo: SHA-384 sobre cadena canónica encadenada.
   */
  static calculateCUFE(params: CufeCalculationParams): string {
    const canonicalString = [
      params.numFac,
      params.fecFac,
      params.horFac,
      params.valFac,
      params.codImp1,
      params.valImp1,
      '02', '0.00',          // codImp2 (Tributo secundario)
      '03', '0.00',          // codImp3 (Tributo terciario)
      params.valTot,
      params.nitEmisor,
      params.numAdq,
      params.claveTecnica,
      params.tipoAmbiente,
    ].join('');

    return crypto.createHash('sha384').update(canonicalString, 'utf8').digest('hex');
  }

  /**
   * Construye el contenido canónico para el código QR de la tirilla térmica
   */
  static generateQrContent(params: {
    numFac: string;
    fecFac: string;
    nitEmisor: string;
    numAdq: string;
    valTot: string;
    cufe: string;
  }): string {
    return `NumFac=${params.numFac}&FecFac=${params.fecFac}&NitFac=${params.nitEmisor}&DocAdq=${params.numAdq}&ValTot=${params.valTot}&CUFE=${params.cufe}`;
  }
}

