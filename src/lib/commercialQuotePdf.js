/**
 * Módulo de Generación Documental de Presupuestos Comerciales en PDF
 * Proyecto: Compras de Eventos — La Juliana
 *
 * Reglas de Arquitectura:
 * 1. Privacidad Comercial: Lista blanca explícita de campos públicos. Prohibido exponer costos, insumos, porcentajes y notas internas.
 * 2. Inmutabilidad Histórica: Utiliza exclusivamente el snapshot persistido en la entidad Presupuesto.
 * 3. Modalidades A (total único) y B (desglose por menú).
 * 4. Salida en formato A4 con diseño profesional verde institucional (#2E4426).
 * 5. Paginación automática y pie de página en todas las hojas.
 * 6. Funcionalidades independientes de descarga y compartición vía Web Share API.
 */

import { jsPDF } from 'jspdf';

// Paleta cromática institucional de La Juliana
const COLORS = {
  primary: [46, 68, 38],        // Verde institucional principal #2E4426
  primaryLight: [234, 240, 232], // Verde muy claro / fondo suave #EAF0E8
  primaryMedium: [96, 128, 86],  // Verde intermedio para detalles
  textDark: [28, 36, 27],        // Gris carbón oscuro para lectura
  textMuted: [100, 110, 98],     // Gris medio para subtítulos y notas
  borderLight: [214, 222, 211],  // Gris sutil para separadores
  cardBg: [248, 250, 247],       // Fondo claro de tarjetas
  white: [255, 255, 255]
};

/**
 * Formatea un importe numérico en Pesos Argentinos (ARS) de forma determinista.
 * Ejemplo: 1401990.5 -> "$ 1.401.990,50"
 * @param {number|string} value
 * @returns {string}
 */
export function formatPesosArgentinos(value) {
  const num = Number(value) || 0;
  return '$ ' + num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formatea una fecha ISO o timestamp a formato argentino legible.
 * Ejemplo: "2026-12-20" -> "20 de diciembre de 2026"
 * @param {string|number|Date} dateVal
 * @param {boolean} [includeWeekday=false]
 * @returns {string}
 */
export function formatFechaArgentina(dateVal, includeWeekday = false) {
  if (!dateVal) return '-';
  try {
    let date;
    if (typeof dateVal === 'string' && dateVal.includes('T')) {
      date = new Date(dateVal);
    } else if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [year, month, day] = dateVal.split('-').map(Number);
      date = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      date = new Date(dateVal);
    }

    if (isNaN(date.getTime())) return String(dateVal);

    const opciones = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(includeWeekday ? { weekday: 'long' } : {})
    };

    const str = date.toLocaleDateString('es-AR', opciones);
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch {
    return String(dateVal);
  }
}

/**
 * Sanitiza el objeto Presupuesto aplicando una lista blanca estricta de campos públicos.
 * Bloquea costos internos, insumos_snapshot, porcentaje_comercial, notas_internas, etc.
 * @param {Object} rawPresupuesto
 * @returns {Object} Presupuesto comercial público
 */
export function sanitizeQuoteForPdf(rawPresupuesto) {
  if (!rawPresupuesto || typeof rawPresupuesto !== 'object') {
    throw new Error('El presupuesto es inválido o no está definido.');
  }

  // Lista blanca estricta de campos públicos a nivel de presupuesto
  const publicQuote = {
    id: String(rawPresupuesto.id || ''),
    titulo: String(rawPresupuesto.titulo || 'Presupuesto de Evento'),
    evento_nombre: String(rawPresupuesto.evento_nombre || 'Evento'),
    cliente: String(rawPresupuesto.cliente || 'Cliente'),
    fecha_evento: rawPresupuesto.fecha_evento || '',
    fecha_creacion: rawPresupuesto.fecha_creacion || '',
    comensales_evento: Number(rawPresupuesto.comensales_evento) || 0,
    version_cotizacion: Number(rawPresupuesto.version_cotizacion) || 1,
    mostrar_desglose_por_menu: Boolean(rawPresupuesto.mostrar_desglose_por_menu),
    condiciones_comerciales: typeof rawPresupuesto.condiciones_comerciales === 'string'
      ? rawPresupuesto.condiciones_comerciales.trim()
      : '',
    precio_venta_total: Number(rawPresupuesto.precio_venta_total) || 0,
    menus_cotizados: []
  };

  // Lista blanca estricta para cada menú cotizado
  if (Array.isArray(rawPresupuesto.menus_cotizados)) {
    publicQuote.menus_cotizados = rawPresupuesto.menus_cotizados.map(m => {
      const comensales = Number(m.comensales) || 0;
      const precio_venta = Number(m.precio_venta !== undefined ? m.precio_venta : m.precio_venta_menu) || 0;
      const precio_por_persona = Number(m.precio_por_persona !== undefined ? m.precio_por_persona : m.precio_venta_por_comensal) || (comensales > 0 ? Math.round((precio_venta / comensales) * 100) / 100 : 0);

      return {
        menu_id: String(m.menu_id || ''),
        menu_nombre: String(m.menu_nombre || 'Menú sin nombre'),
        tipo: String(m.tipo || 'Principal'),
        comensales: comensales,
        precio_venta: precio_venta,
        precio_por_persona: Math.round(precio_por_persona * 100) / 100
      };
    });
  }

  return publicQuote;
}

/**
 * Genera el nombre de archivo normalizado y seguro para el PDF.
 * Ejemplo: "Presupuesto_La_Juliana_Casamiento_Sofia_v1.pdf"
 * @param {Object} presupuesto
 * @returns {string}
 */
export function getQuotePdfFilename(presupuesto) {
  const rawEvento = presupuesto?.evento_nombre || 'Evento';
  const cleanEvento = rawEvento
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes para compatibilidad de sistema de archivos
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const version = presupuesto?.version_cotizacion || 1;
  return `Presupuesto_La_Juliana_${cleanEvento || 'Evento'}_v${version}.pdf`;
}

/**
 * Genera el documento PDF A4 comercial profesional a partir del snapshot del presupuesto.
 * @param {Object} rawPresupuesto
 * @param {Object} [options={}] - Opciones adicionales (ej: logoBase64)
 * @returns {jsPDF} Instancia de jsPDF lista para guardar o exportar
 */
export function generateCommercialQuotePdf(rawPresupuesto, options = {}) {
  // 1. Sanitizar mediante lista blanca estricta
  const quote = sanitizeQuoteForPdf(rawPresupuesto);

  // 2. Inicializar documento A4 (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: options.compress !== undefined ? options.compress : false
  });

  // Metadatos del documento (únicamente datos públicos)
  doc.setProperties({
    title: `Presupuesto - ${quote.evento_nombre}`,
    subject: 'Presupuesto Comercial de Evento',
    author: 'La Juliana - Eventos y Hospedaje',
    creator: 'Compras de Eventos - La Juliana'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const marginTop = 16;
  const marginBottom = 18;
  const contentWidth = pageWidth - (marginX * 2); // 178 mm
  const contentBottom = pageHeight - marginBottom;

  let currentY = marginTop;

  // Encabezado reducido para páginas secundarias
  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.primary);
    doc.text('LA JULIANA — EVENTOS Y HOSPEDAJE', marginX, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    const rightText = `Presupuesto: ${quote.evento_nombre} (v${quote.version_cotizacion})`;
    doc.text(rightText, pageWidth - marginX, currentY, { align: 'right' });

    currentY += 2.5;
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 6;
  };

  // Función para salto de página automático y preservación de encabezado
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > contentBottom) {
      doc.addPage();
      currentY = marginTop;
      drawRunningHeader();
    }
  };

  // ==========================================
  // 1. ENCABEZADO INSTITUCIONAL PRINCIPAL (PÁGINA 1)
  // ==========================================
  const startHeaderY = currentY;

  // Logotipo oficial si está disponible en opciones (dataUrl / base64)
  if (options.logoBase64) {
    try {
      doc.addImage(options.logoBase64, 'JPEG', marginX, currentY, 15, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.setTextColor(...COLORS.primary);
      doc.text('LA JULIANA', marginX + 18, currentY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('EVENTOS Y HOSPEDAJE', marginX + 18.2, currentY + 12);
    } catch {
      // Respaldo tipográfico si falla la imagen
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...COLORS.primary);
      doc.text('LA JULIANA', marginX, currentY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('EVENTOS Y HOSPEDAJE', marginX, currentY + 12.5);
    }
  } else {
    // Encabezado tipográfico elegante
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...COLORS.primary);
    doc.text('LA JULIANA', marginX, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('EVENTOS Y HOSPEDAJE', marginX, currentY + 12.5);
  }

  // Tarjeta de identificación derecha (Presupuesto de Evento)
  const idBoxWidth = 74;
  const idBoxX = pageWidth - marginX - idBoxWidth;
  const idBoxY = startHeaderY;

  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(idBoxX, idBoxY, idBoxWidth, 7, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('PRESUPUESTO DE EVENTO', idBoxX + (idBoxWidth / 2), idBoxY + 4.8, { align: 'center' });

  // Fecha de emisión y versión
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  const fechaEmisionStr = formatFechaArgentina(quote.fecha_creacion);
  doc.text(`Fecha de emisión: ${fechaEmisionStr}`, idBoxX + idBoxWidth, idBoxY + 11.5, { align: 'right' });
  doc.text(`Cotización Versión: ${quote.version_cotizacion}`, idBoxX + idBoxWidth, idBoxY + 15.5, { align: 'right' });

  currentY = startHeaderY + 19;

  // Línea divisoria elegante
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.7);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 7;

  // ==========================================
  // 2. BLOQUE DE INFORMACIÓN DEL CLIENTE Y EVENTO
  // ==========================================
  const infoBoxY = currentY;
  const infoBoxHeight = 26;

  doc.setFillColor(...COLORS.cardBg);
  doc.setDrawColor(...COLORS.borderLight);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, infoBoxY, contentWidth, infoBoxHeight, 2, 2, 'FD');

  const col1X = marginX + 6;
  const col2X = marginX + (contentWidth / 2) + 2;

  // Columna 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('CLIENTE:', col1X, infoBoxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.textDark);
  doc.text(quote.cliente || 'No especificado', col1X, infoBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('EVENTO:', col1X, infoBoxY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.textDark);
  doc.text(quote.evento_nombre || 'No especificado', col1X, infoBoxY + 22);

  // Columna 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('FECHA DEL EVENTO:', col2X, infoBoxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.textDark);
  doc.text(formatFechaArgentina(quote.fecha_evento, true), col2X, infoBoxY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('INVITADOS TOTALES:', col2X, infoBoxY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.textDark);
  const invitadosText = quote.comensales_evento > 0 ? `${quote.comensales_evento} personas` : 'A definir';
  doc.text(invitadosText, col2X, infoBoxY + 22);

  currentY += infoBoxHeight + 8;

  // ==========================================
  // 3. PROPUESTA GASTRONÓMICA
  // ==========================================
  checkPageBreak(25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('PROPUESTA GASTRONÓMICA Y SERVICIOS', marginX, currentY);
  currentY += 4;

  doc.setDrawColor(...COLORS.primaryMedium);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, marginX + 70, currentY);
  currentY += 5;

  // MODALIDAD A: SOLO TOTAL GENERAL (sin importes individuales)
  if (!quote.mostrar_desglose_por_menu) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('Servicio integral que incluye los siguientes menús seleccionados para el evento:', marginX, currentY);
    currentY += 6;

    quote.menus_cotizados.forEach((m, idx) => {
      checkPageBreak(16);

      doc.setFillColor(...(idx % 2 === 0 ? COLORS.cardBg : COLORS.white));
      doc.setDrawColor(...COLORS.borderLight);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, currentY, contentWidth, 13, 1.5, 1.5, 'FD');

      // Nombre del menú
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...COLORS.textDark);
      doc.text(m.menu_nombre, marginX + 4, currentY + 6);

      // Tipo de servicio
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(`Categoría: ${m.tipo}`, marginX + 4, currentY + 10);

      // Comensales asignados
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.primary);
      const comensalesStr = m.comensales > 0 ? `${m.comensales} personas` : 'Servicio general';
      doc.text(comensalesStr, pageWidth - marginX - 5, currentY + 8, { align: 'right' });

      currentY += 16;
    });

    currentY += 4;
  }
  // MODALIDAD B: DESGLOSE COMPLETO POR MENÚ
  else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('Detalle de servicios y cotización por menú según cantidad de comensales:', marginX, currentY);
    currentY += 5;

    // Encabezado de tabla
    const colWidths = {
      nombre: 70,
      tipo: 28,
      comensales: 22,
      precioUnit: 28,
      total: 30
    };

    checkPageBreak(18);

    doc.setFillColor(...COLORS.primary);
    doc.rect(marginX, currentY, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.white);

    let colX = marginX + 4;
    doc.text('MENÚ / SERVICIO', colX, currentY + 5.2);
    colX += colWidths.nombre;
    doc.text('TIPO', colX, currentY + 5.2);
    colX += colWidths.tipo;
    doc.text('COMENSALES', colX + colWidths.comensales - 4, currentY + 5.2, { align: 'right' });
    colX += colWidths.comensales;
    doc.text('PRECIO / PERS.', colX + colWidths.precioUnit - 4, currentY + 5.2, { align: 'right' });
    colX += colWidths.precioUnit;
    doc.text('TOTAL', colX + colWidths.total - 8, currentY + 5.2, { align: 'right' });

    currentY += 8;

    // Filas de la tabla
    quote.menus_cotizados.forEach((m, idx) => {
      checkPageBreak(12);

      const rowHeight = 9;
      doc.setFillColor(...(idx % 2 === 0 ? COLORS.white : COLORS.cardBg));
      doc.setDrawColor(...COLORS.borderLight);
      doc.setLineWidth(0.2);
      doc.rect(marginX, currentY, contentWidth, rowHeight, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.textDark);

      let rowColX = marginX + 4;
      const cleanNombre = m.menu_nombre.length > 36 ? m.menu_nombre.slice(0, 33) + '...' : m.menu_nombre;
      doc.text(cleanNombre, rowColX, currentY + 5.8);

      rowColX += colWidths.nombre;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(m.tipo, rowColX, currentY + 5.8);

      rowColX += colWidths.tipo;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.textDark);
      doc.text(String(m.comensales), rowColX + colWidths.comensales - 4, currentY + 5.8, { align: 'right' });

      rowColX += colWidths.comensales;
      doc.text(formatPesosArgentinos(m.precio_por_persona), rowColX + colWidths.precioUnit - 4, currentY + 5.8, { align: 'right' });

      rowColX += colWidths.precioUnit;
      doc.setFont('helvetica', 'bold');
      doc.text(formatPesosArgentinos(m.precio_venta), rowColX + colWidths.total - 8, currentY + 5.8, { align: 'right' });

      currentY += rowHeight;
    });

    currentY += 5;
  }

  // ==========================================
  // 4. CUADRO DESTACADO DE TOTAL DE VENTA
  // ==========================================
  checkPageBreak(28);

  const totalBoxHeight = 22;
  doc.setFillColor(...COLORS.primaryLight);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.6);
  doc.roundedRect(marginX, currentY, contentWidth, totalBoxHeight, 2, 2, 'FD');

  // Lado izquierdo: Leyenda
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('TOTAL DEL PRESUPUESTO', marginX + 6, currentY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Valores finales expresados en pesos argentinos (ARS).', marginX + 6, currentY + 15);

  // Lado derecho: Importe Total Destacado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  const totalStr = formatPesosArgentinos(quote.precio_venta_total);
  doc.text(totalStr, pageWidth - marginX - 6, currentY + 10, { align: 'right' });

  // Promedio por persona general (si los comensales son mayores a cero)
  if (quote.comensales_evento > 0) {
    const promedioPersona = Math.round((quote.precio_venta_total / quote.comensales_evento) * 100) / 100;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`Promedio estimado: ${formatPesosArgentinos(promedioPersona)} / persona`, pageWidth - marginX - 6, currentY + 16, { align: 'right' });
  }

  currentY += totalBoxHeight + 10;

  // ==========================================
  // 5. CONDICIONES COMERCIALES (SI CONTIENE TEXTO)
  // ==========================================
  if (quote.condiciones_comerciales && quote.condiciones_comerciales.length > 0) {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text('CONDICIONES COMERCIALES Y FORMA DE PAGO', marginX, currentY);
    currentY += 4;

    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY, marginX + 60, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textDark);

    // Ajuste de texto multi-línea dentro de la caja de contenido
    const textLines = doc.splitTextToSize(quote.condiciones_comerciales, contentWidth - 10);
    const boxHeight = Math.max(14, (textLines.length * 4.5) + 6);

    checkPageBreak(boxHeight + 4);

    doc.setFillColor(...COLORS.cardBg);
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currentY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.text(textLines, marginX + 5, currentY + 6);
    currentY += boxHeight + 8;
  }

  // ==========================================
  // 6. PIE DE PÁGINA Y NUMERACIÓN EN TODAS LAS HOJAS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const footerY = pageHeight - 10;

    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('La Juliana — Eventos y Hospedaje  •  Documento comercial emitido para el cliente', marginX, footerY);

    const paginacionStr = `Página ${i} de ${totalPages}`;
    doc.text(paginacionStr, pageWidth - marginX, footerY, { align: 'right' });
  }

  return doc;
}

/**
 * Genera el Blob del archivo PDF a partir del presupuesto.
 * @param {Object} presupuesto
 * @param {Object} [options={}]
 * @returns {Blob}
 */
export function getCommercialQuotePdfBlob(presupuesto, options = {}) {
  const doc = generateCommercialQuotePdf(presupuesto, options);
  return doc.output('blob');
}

/**
 * Descarga directamente el archivo PDF en el navegador.
 * @param {Object} presupuesto
 * @param {Object} [options={}]
 * @returns {string} Nombre del archivo descargado
 */
export function downloadCommercialQuotePdf(presupuesto, options = {}) {
  const doc = generateCommercialQuotePdf(presupuesto, options);
  const filename = getQuotePdfFilename(presupuesto);
  doc.save(filename);
  return filename;
}

/**
 * Comparte el presupuesto en PDF utilizando la Web Share API nativa si está disponible,
 * o descarga el PDF y provee información amigable para adjuntarlo manualmente en WhatsApp.
 *
 * @param {Object} presupuesto
 * @param {Object} [options={}]
 * @returns {Promise<{ success: boolean, method: 'web-share'|'download-fallback', filename: string, message?: string, aborted?: boolean }>}
 */
export async function shareCommercialQuotePdf(presupuesto, options = {}) {
  const filename = getQuotePdfFilename(presupuesto);
  const blob = getCommercialQuotePdfBlob(presupuesto, options);

  // Comprobar soporte nativo de Web Share API con archivos
  if (typeof navigator !== 'undefined' && typeof File !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Presupuesto ${presupuesto.evento_nombre || 'Evento'}`,
          text: `Presupuesto de evento para ${presupuesto.cliente || 'el cliente'} emitido por La Juliana.`
        });
        return {
          success: true,
          method: 'web-share',
          filename
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          method: 'web-share',
          filename,
          aborted: true,
          message: 'El usuario canceló el envío.'
        };
      }
    }
  }

  // Fallback: Descarga directa y mensaje informativo para adjuntarlo en WhatsApp
  downloadCommercialQuotePdf(presupuesto, options);

  return {
    success: true,
    method: 'download-fallback',
    filename,
    message: 'Tu navegador no permite adjuntar archivos directamente. Descargamos el PDF para que puedas compartirlo adjuntándolo manualmente en WhatsApp u otra aplicación.'
  };
}
