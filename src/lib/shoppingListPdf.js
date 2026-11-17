/**
 * Módulo de Generación Documental de Lista de Compras en PDF
 * Proyecto: Compras de Eventos — La Juliana
 * FASE 2.3.1
 *
 * Módulo puro, determinista y desacoplado de React, UI, localStorage y red.
 * Genera el documento PDF A4 operativo con casillas de verificación para compras,
 * excluyendo productos en depósito, cantidades cero y cualquier información de costos o precios.
 */

import { jsPDF } from 'jspdf';

// Paleta cromática institucional oficial de La Juliana
const COLORS = {
  primary: [46, 68, 38],        // Verde institucional principal #2E4426
  primaryLight: [234, 240, 232], // Verde muy claro / fondo suave #EAF0E8
  primaryMedium: [96, 128, 86],  // Verde oliva medio #608056
  textDark: [28, 36, 27],        // Carbón oscuro para lectura #1C241B
  textMuted: [100, 110, 98],     // Gris medio para detalles #646E62
  borderLight: [214, 222, 211],  // Gris sutil para separadores #D6DED3
  cardBg: [248, 250, 247],       // Fondo de bloques #F8FAF7
  white: [255, 255, 255]
};

/**
 * Error estructurado emitido por el generador de lista de compras.
 */
export class ShoppingListError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ShoppingListError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Formatea una fecha ISO o string a formato legible en español rioplatense.
 * Ejemplo: "2026-12-20" -> "20 de diciembre de 2026"
 * @param {string|number|Date} dateVal
 * @returns {string}
 */
export function formatFechaArgentina(dateVal) {
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

    if (Number.isNaN(date.getTime())) return String(dateVal);

    const str = date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch {
    return String(dateVal);
  }
}

/**
 * Formatea cantidades numéricas para la lista de compras de forma precisa y legible.
 * Respeta decimales reales sin redondeos destructivos que puedan reducir la cantidad a comprar.
 * Si el insumo presenta más de 4 decimales (ej: 0.00005 kg o 0.000075 kg en especias o esencias),
 * preserva hasta 6 decimales exactos para evitar truncamiento silencioso.
 * @param {number|string} val
 * @returns {string}
 */
export function formatShoppingQuantity(val) {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return '0';

  // Si es un número entero exacto, devolver sin decimales
  if (Number.isInteger(num)) {
    return num.toLocaleString('es-AR');
  }

  // Detectar cantidad de decimales reales en la representación decimal
  const str = String(val).trim();
  let decimalCount = 0;
  if (str.includes('.')) {
    decimalCount = str.split('.')[1].length;
  } else if (str.includes(',')) {
    decimalCount = str.split(',')[1].length;
  }

  // Si se detectaron decimales, preservar la precisión real (mínimo 1, hasta 6 decimales)
  const maxFractionDigits = decimalCount > 4 ? Math.min(decimalCount, 6) : Math.min(Math.max(decimalCount, 1), 4);

  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits
  });
}

/**
 * Filtra los productos de compras aplicando estrictamente las reglas de negocio:
 * 1. Excluir productos con isChecked === true (ya en depósito).
 * 2. Excluir productos cuya cantidad a comprar sea <= 0 o no finita.
 * 3. Utilizar qtyToBuy (cantidad manual si existe, o cantidad_total).
 * 4. Inmutabilidad: no muta los objetos recibidos.
 *
 * @param {Array<Object>} items
 * @returns {Array<Object>} Ítems filtrados listos para comprar
 */
export function filterPendingShoppingItems(items) {
  if (!Array.isArray(items)) return [];

  const filtered = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    // Regla 1: Excluir si está marcado como En depósito
    if (item.isChecked === true) continue;

    // Regla 2: Resolver cantidad pendiente a comprar
    // Se prioriza qtyToBuy si está definido y es numérico; de lo contrario cantidad_total
    const rawQty = item.qtyToBuy !== undefined ? item.qtyToBuy : item.cantidad_total;
    const qty = Number(rawQty);

    // Regla 3: Debe ser estrictamente mayor a 0 y finito
    if (!Number.isFinite(qty) || Number.isNaN(qty) || qty <= 0) {
      continue;
    }

    filtered.push({
      producto_id: String(item.producto_id || ''),
      producto_nombre: String(item.producto_nombre || 'Producto sin nombre'),
      categoria: String(item.categoria || 'Otros').trim() || 'Otros',
      unidad: String(item.unidad || 'unidad').trim() || 'unidad',
      cantidad_a_comprar: qty,
      menu_nombres: Array.isArray(item.menu_nombres) ? [...item.menu_nombres] : []
    });
  }

  return filtered;
}

/**
 * Agrupa una lista de productos filtrados por categoría y los ordena alfabéticamente:
 * 1. Categorías ordenadas de A a Z.
 * 2. Productos ordenados de A a Z dentro de cada categoría.
 *
 * @param {Array<Object>} filteredItems
 * @returns {Object.<string, Array<Object>>}
 */
export function groupShoppingItemsByCategory(filteredItems) {
  const groups = {};

  for (const item of filteredItems) {
    const cat = item.categoria || 'Otros';
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(item);
  }

  // Ordenar productos dentro de cada categoría
  for (const cat of Object.keys(groups)) {
    groups[cat].sort((a, b) => a.producto_nombre.localeCompare(b.producto_nombre, 'es'));
  }

  // Retornar un objeto con claves ordenadas alfabéticamente
  const sortedCategories = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'es'));
  const sortedResult = {};
  for (const cat of sortedCategories) {
    sortedResult[cat] = groups[cat];
  }

  return sortedResult;
}

/**
 * Genera el nombre de archivo seguro y normalizado para el PDF.
 * Ejemplo: "Lista_de_Compras_La_Juliana_Casamiento_Sofia_y_Lucas.pdf"
 * @param {Object} evento
 * @returns {string}
 */
export function getShoppingListFilename(evento) {
  const rawNombre = evento?.nombre || 'Evento';
  const cleanNombre = rawNombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `Lista_de_Compras_La_Juliana_${cleanNombre || 'Evento'}.pdf`;
}

/**
 * Genera el documento PDF A4 de la lista de compras.
 *
 * @param {Object} params
 * @param {Object} params.evento - Metadatos del evento
 * @param {Array<Object>} params.items - Lista completa de insumos
 * @param {Object} [params.options={}] - Opciones adicionales (ej: logoUrl, compress)
 * @returns {jsPDF}
 */
export function generateShoppingListPdf({ evento, items, options = {} }) {
  if (!evento || typeof evento !== 'object') {
    throw new ShoppingListError('EVENTO_REQUERIDO', 'Los datos del evento son requeridos para generar la lista de compras');
  }

  // 1. Filtrar productos pendientes
  const pendingItems = filterPendingShoppingItems(items);

  // Regla de Negocio 6: Si no hay ítems pendientes, no generar documento vacío
  if (pendingItems.length === 0) {
    throw new ShoppingListError(
      'SIN_PRODUCTOS_PENDIENTES',
      'No hay productos pendientes de compra para este evento. Todos los insumos están en depósito o con cantidad cero.'
    );
  }

  // 2. Agrupar por categoría
  const grouped = groupShoppingItemsByCategory(pendingItems);

  // 3. Inicializar documento jsPDF A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: options.compress !== undefined ? options.compress : false
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const marginTop = 14;
  const marginBottom = 16;
  const contentWidth = pageWidth - (marginX * 2); // 182 mm
  const contentBottom = pageHeight - marginBottom; // 281 mm

  // Metadatos del documento (estrictamente públicos y operativos)
  const eventoNombre = evento.nombre || 'Evento';
  doc.setProperties({
    title: `Lista de Compras - ${eventoNombre}`,
    subject: 'Lista Operativa de Compras de Insumos',
    author: 'La Juliana - Eventos y Hospedaje',
    creator: 'Compras de Eventos - La Juliana'
  });

  let currentY = marginTop;

  // Función interna para dibujar el encabezado de página
  const renderHeader = (isFirstPage = true) => {
    if (isFirstPage) {
      // Banda superior decorativa
      doc.setFillColor(...COLORS.primary);
      doc.rect(marginX, currentY, contentWidth, 3, 'F');
      currentY += 8;

      // Encabezado institucional (con logotipo oficial si está disponible o tipográfico)
      let textStartX = marginX;
      if (options.logoBase64) {
        try {
          doc.addImage(options.logoBase64, 'JPEG', marginX, currentY - 2, 12, 12);
          textStartX = marginX + 15;
        } catch {
          textStartX = marginX;
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...COLORS.primary);
      doc.text('LISTA DE COMPRAS', textStartX, currentY + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('LA JULIANA — EVENTOS Y HOSPEDAJE', pageWidth - marginX, currentY + 3.5, { align: 'right' });
      currentY += 8.5;

      doc.setFontSize(8);
      doc.text('Documento operativo de insumos y provisiones para abastecimiento', textStartX, currentY);
      currentY += (textStartX > marginX ? 6.5 : 5.5);

      // Tarjeta de Metadatos del Evento
      const boxY = currentY;
      const boxHeight = 22;
      doc.setFillColor(...COLORS.cardBg);
      doc.setDrawColor(...COLORS.borderLight);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, boxY, contentWidth, boxHeight, 2, 2, 'FD');

      // Nombre del Evento y Cliente
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.textDark);
      doc.text(eventoNombre, marginX + 4, boxY + 6.5);

      if (evento.cliente) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.textMuted);
        doc.text(`Cliente: ${evento.cliente}`, marginX + 4, boxY + 11);
      }

      // Detalle de fecha y comensales
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.textDark);

      const fechaStr = evento.fecha ? formatFechaArgentina(evento.fecha) : 'Fecha sin definir';
      doc.text(`Fecha del Evento: ${fechaStr}`, marginX + 4, boxY + 16.5);

      const comensalesStr = evento.comensales ? `${evento.comensales} personas` : '-';
      doc.text(`Comensales: ${comensalesStr}`, marginX + 80, boxY + 16.5);

      // Total de productos pendientes a comprar en esta lista
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(`Total ítems a comprar: ${pendingItems.length}`, pageWidth - marginX - 4, boxY + 16.5, { align: 'right' });

      currentY = boxY + boxHeight + 8;
    } else {
      // Encabezado simplificado para páginas continuas
      doc.setFillColor(...COLORS.primary);
      doc.rect(marginX, marginTop, contentWidth, 1.5, 'F');
      currentY = marginTop + 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.primary);
      doc.text(`LISTA DE COMPRAS — ${eventoNombre.toUpperCase()}`, marginX, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.textMuted);
      doc.text('La Juliana — Eventos y Hospedaje', pageWidth - marginX, currentY, { align: 'right' });

      currentY += 5;
      doc.setDrawColor(...COLORS.borderLight);
      doc.setLineWidth(0.2);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 5;
    }
  };

  // Renderizar primera cabecera
  renderHeader(true);

  // Columnas de la tabla de compras
  // [Casilla 8mm] [Producto 110mm] [Cantidad 34mm] [Unidad 30mm] = 182mm
  const colX = {
    check: marginX + 2,
    checkW: 7,
    producto: marginX + 11,
    productoW: 105,
    cantidad: marginX + 120,
    cantidadW: 32,
    unidad: marginX + 154,
    unidadW: 26
  };

  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > contentBottom) {
      doc.addPage();
      currentY = marginTop;
      renderHeader(false);
      return true;
    }
    return false;
  };

  // Recorrer las categorías y sus productos
  for (const [categoria, catItems] of Object.entries(grouped)) {
    // Espacio necesario para la categoría (cabecera de categoría + al menos 1 fila de producto)
    checkPageBreak(18);

    // Cabecera de Categoría
    doc.setFillColor(...COLORS.primaryLight);
    doc.setDrawColor(...COLORS.primaryMedium);
    doc.setLineWidth(0.2);
    doc.rect(marginX, currentY, contentWidth, 6.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.primary);
    doc.text(categoria.toUpperCase(), marginX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.primaryMedium);
    doc.text(`(${catItems.length} ítem${catItems.length !== 1 ? 's' : ''})`, pageWidth - marginX - 3, currentY + 4.5, { align: 'right' });

    currentY += 8.5;

    // Encabezado de columnas de la categoría
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text('COMPRADO', colX.check, currentY);
    doc.text('INSUMO / PRODUCTO', colX.producto, currentY);
    doc.text('CANTIDAD', colX.cantidad + colX.cantidadW - 2, currentY, { align: 'right' });
    doc.text('UNIDAD', colX.unidad, currentY);

    currentY += 2;
    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 4;

    // Filas de productos
    for (const item of catItems) {
      const hasMenus = item.menu_nombres && item.menu_nombres.length > 0;
      const rowHeight = hasMenus ? 9.5 : 7.5;

      checkPageBreak(rowHeight);

      // 1. Casilla de verificación cuadrada para tildar físicamente con lapicera (3.8 x 3.8 mm)
      const boxSize = 3.8;
      const boxY = currentY - 2.8;
      doc.setDrawColor(...COLORS.primaryMedium);
      doc.setLineWidth(0.3);
      doc.rect(colX.check + 2, boxY, boxSize, boxSize, 'D');

      // 2. Nombre del producto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.textDark);
      doc.text(item.producto_nombre, colX.producto, currentY);

      // Menús asociados si existen (letra pequeña en gris)
      if (hasMenus) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.textMuted);
        const menusText = `Menús: ${item.menu_nombres.join(', ')}`;
        doc.text(menusText, colX.producto, currentY + 3.6);
      }

      // 3. Cantidad a comprar (destacada y alineada a la derecha)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textDark);
      const qtyStr = formatShoppingQuantity(item.cantidad_a_comprar);
      doc.text(qtyStr, colX.cantidad + colX.cantidadW - 2, currentY, { align: 'right' });

      // 4. Unidad de medida
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(item.unidad, colX.unidad, currentY);

      // Separador tenue entre filas
      doc.setDrawColor(240, 242, 239);
      doc.setLineWidth(0.15);
      doc.line(marginX, currentY + (hasMenus ? 5 : 2.5), pageWidth - marginX, currentY + (hasMenus ? 5 : 2.5));

      currentY += rowHeight;
    }

    currentY += 3; // Margen tras finalizar cada categoría
  }

  // Paginación y pie de página en todas las hojas
  const totalPages = doc.getNumberOfPages();
  const nowStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 8;

    doc.setDrawColor(...COLORS.borderLight);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(`La Juliana — Eventos y Hospedaje  •  Lista de compras emitida el ${nowStr}`, marginX, footerY);

    const pagStr = `Página ${i} de ${totalPages}`;
    doc.text(pagStr, pageWidth - marginX, footerY, { align: 'right' });
  }

  return doc;
}

/**
 * Obtiene el Blob nativo application/pdf de la lista de compras.
 * @param {Object} params
 * @returns {Blob}
 */
export function getShoppingListPdfBlob({ evento, items, options = {} }) {
  const doc = generateShoppingListPdf({ evento, items, options });
  return doc.output('blob');
}

/**
 * Descarga directamente el archivo PDF de la lista de compras en el navegador.
 * @param {Object} params
 * @returns {{ success: boolean, filename: string, empty?: boolean, message?: string }}
 */
export function downloadShoppingListPdf({ evento, items, options = {} }) {
  try {
    const doc = generateShoppingListPdf({ evento, items, options });
    const filename = getShoppingListFilename(evento);
    doc.save(filename);
    return { success: true, filename };
  } catch (err) {
    if (err.code === 'SIN_PRODUCTOS_PENDIENTES') {
      return { success: false, empty: true, message: err.message };
    }
    throw err;
  }
}

/**
 * Comparte la lista de compras en PDF utilizando la Web Share API nativa si está disponible,
 * o descarga el PDF y provee instrucciones para adjuntarlo manualmente en WhatsApp.
 *
 * @param {Object} params
 * @returns {Promise<{ success: boolean, method: 'web-share'|'download-fallback', filename: string, message?: string, aborted?: boolean, empty?: boolean }>}
 */
export async function shareShoppingListPdf({ evento, items, options = {} }) {
  try {
    // 1. Validar que existan productos pendientes antes de generar
    const pending = filterPendingShoppingItems(items);
    if (pending.length === 0) {
      return {
        success: false,
        empty: true,
        message: 'No hay productos pendientes de compra para este evento.'
      };
    }

    const filename = getShoppingListFilename(evento);
    const blob = getShoppingListPdfBlob({ evento, items, options });

    // 2. Comprobar compatibilidad con Web Share API para archivos
    if (typeof navigator !== 'undefined' && typeof File !== 'undefined' && navigator.canShare) {
      const file = new File([blob], filename, { type: 'application/pdf' });
      // Compartir exclusivamente el archivo PDF, sin propiedades text ni title que agreguen mensajes
      const shareData = {
        files: [file]
      };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return { success: true, method: 'web-share', filename };
        } catch (shareErr) {
          // Si el usuario canceló voluntariamente la hoja de compartir
          if (shareErr.name === 'AbortError') {
            return { success: true, method: 'web-share', filename, aborted: true };
          }
          console.warn('Error al invocar navigator.share, aplicando fallback a descarga:', shareErr);
        }
      }
    }

    // 3. Fallback: descarga directa en PC o dispositivos sin soporte de archivos
    const doc = generateShoppingListPdf({ evento, items, options });
    doc.save(filename);
    return {
      success: true,
      method: 'download-fallback',
      filename,
      message: 'Compartir no disponible en este dispositivo. Se descargó el PDF para adjuntarlo manualmente.'
    };
  } catch (err) {
    if (err.code === 'SIN_PRODUCTOS_PENDIENTES') {
      return { success: false, empty: true, message: err.message };
    }
    throw err;
  }
}
