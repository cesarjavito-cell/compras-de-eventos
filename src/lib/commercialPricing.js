/**
 * Motor de Cálculo Comercial Independiente
 * Proyecto: Compras de Eventos — La Juliana
 * FASE 2.2.3
 *
 * Módulo puro, determinista y desacoplado de React, UI, localStorage y red.
 * Realiza el costeo de recetas y la cotización de precios de venta comerciales
 * a partir de los insumos teóricos y comensales por menú.
 */

import {
  DEFAULT_PORCENTAJE_COMERCIAL,
  validatePorcentajeComercial,
  PRESUPUESTO_SCHEMA_VERSION
} from './presupuestoModel.js';

/**
 * Error estructurado emitido por el motor de cálculo comercial.
 */
export class CommercialPricingError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'CommercialPricingError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Redondeo determinista a 2 decimales para importes monetarios.
 * Evita anomalías de coma flotante mediante Number.EPSILON.
 * @param {number|string} val
 * @returns {number}
 */
export const round2 = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Redondeo determinista a 4 decimales para cantidades de insumos.
 * @param {number|string} val
 * @returns {number}
 */
export const round4 = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
};

/**
 * Normaliza una cadena de unidad para comparaciones homogéneas.
 * @param {string} unit
 * @returns {string}
 */
export const normalizeUnit = (unit) => {
  if (typeof unit !== 'string') return '';
  return unit.trim().toLowerCase();
};

/**
 * Valida la compatibilidad de unidades entre receta y producto.
 * No asume conversiones arbitrarias (ej. kg -> gr o litros -> unidades).
 * Si ambas unidades están definidas, deben coincidir exactamente tras normalizarse.
 * @param {string} recipeUnit
 * @param {string} productUnit
 * @returns {boolean}
 */
export const areUnitsCompatible = (recipeUnit, productUnit) => {
  const normRecipe = normalizeUnit(recipeUnit);
  const normProduct = normalizeUnit(productUnit);

  if (!normRecipe || !normProduct) {
    return true; // Si una no está especificada, se asume la del producto registrado
  }
  return normRecipe === normProduct;
};

/**
 * Resuelve la cantidad de comensales aplicable a un menú en un evento dado.
 * Respeta la regla de menús mixtos:
 * 1. Si existe una asignación explícita en evento.menu_comensales[menuId], se utiliza ese valor.
 *    (Incluso si es 0, respetando el significado de menú sin comensales).
 * 2. Si no existe asignación específica, recurre a evento.cantidad_comensales.
 * 3. Valida que el valor sea un entero no negativo.
 *
 * @param {Object} evento
 * @param {string} menuId
 * @returns {number} Comensales asignados (entero >= 0)
 */
export const resolveMenuDiners = (evento, menuId) => {
  if (!evento || typeof evento !== 'object') {
    throw new CommercialPricingError('EVENTO_INVALIDO', 'El evento proporcionado no es un objeto válido');
  }

  const menuComensalesMap = evento.menu_comensales;
  let rawDiners;

  if (menuComensalesMap && typeof menuComensalesMap === 'object' && menuComensalesMap[menuId] !== undefined) {
    rawDiners = menuComensalesMap[menuId];
  } else {
    rawDiners = evento.cantidad_comensales;
  }

  // Validación estricta de comensales
  if (rawDiners === null || rawDiners === undefined || rawDiners === '') {
    return 0;
  }

  const num = Number(rawDiners);
  if (!Number.isFinite(num) || Number.isNaN(num) || !Number.isInteger(num) || num < 0) {
    throw new CommercialPricingError(
      'COMENSALES_INVALIDOS',
      `La cantidad de comensales para el menú con ID "${menuId}" (${rawDiners}) es inválida. Debe ser un número entero no negativo.`,
      { menuId, rawDiners }
    );
  }

  return num;
};

/**
 * Motor principal de cálculo de cotización comercial.
 *
 * Admite invocación tanto por objeto de opciones como por argumentos posicionales:
 * - calculateCommercialQuote({ evento, menusDisponibles, productosDisponibles, selectedMenuIds, porcentajeComercial })
 * - calculateCommercialQuote(evento, menusDisponibles, productosDisponibles, selectedMenuIds, porcentajeComercial)
 *
 * @returns {Object} Resultado estructurado del cálculo comercial
 */
export const calculateCommercialQuote = (...args) => {
  let evento;
  let menusDisponibles;
  let productosDisponibles;
  let selectedMenuIds;
  let porcentajeComercial;

  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
    const opts = args[0];
    evento = opts.evento;
    menusDisponibles = opts.menusDisponibles || opts.menus;
    productosDisponibles = opts.productosDisponibles || opts.productos;
    selectedMenuIds = opts.selectedMenuIds;
    porcentajeComercial = opts.porcentajeComercial;
  } else {
    [evento, menusDisponibles, productosDisponibles, selectedMenuIds, porcentajeComercial] = args;
  }

  // 1. Validación de Evento
  if (!evento || typeof evento !== 'object' || Array.isArray(evento)) {
    throw new CommercialPricingError('EVENTO_INVALIDO', 'El evento proporcionado es inválido o no existe');
  }
  if (!evento.id || typeof evento.id !== 'string') {
    throw new CommercialPricingError('EVENTO_INVALIDO', 'El evento no posee un identificador (id) válido');
  }
  if (!evento.nombre || typeof evento.nombre !== 'string') {
    throw new CommercialPricingError('EVENTO_INVALIDO', 'El evento no posee un nombre válido');
  }

  // 2. Validación de Colecciones
  if (!Array.isArray(menusDisponibles)) {
    throw new CommercialPricingError('MENUS_INVALIDOS', 'La lista de menús disponibles debe ser un arreglo');
  }
  if (!Array.isArray(productosDisponibles)) {
    throw new CommercialPricingError('PRODUCTOS_INVALIDOS', 'La lista de productos disponibles debe ser un arreglo');
  }

  // 3. Validación de Menús Seleccionados
  if (!Array.isArray(selectedMenuIds) || selectedMenuIds.length === 0) {
    throw new CommercialPricingError('SELECCION_VACIA', 'Debe seleccionar al menos un menú para cotizar');
  }

  // Control de duplicados en la selección
  const seenIds = new Set();
  for (const mId of selectedMenuIds) {
    if (typeof mId !== 'string' || mId.trim() === '') {
      throw new CommercialPricingError('SELECCION_INVALIDA', 'Los identificadores de menús seleccionados deben ser textos no vacíos');
    }
    if (seenIds.has(mId)) {
      throw new CommercialPricingError('MENU_DUPLICADO', `El menú con ID "${mId}" está duplicado en la selección`, { menuId: mId });
    }
    seenIds.add(mId);
  }

  // Validación de que los menús seleccionados pertenezcan a los asignados al evento
  const eventAssignedIds = new Set();
  if (Array.isArray(evento.menus_ids)) {
    evento.menus_ids.forEach(id => eventAssignedIds.add(id));
  } else if (Array.isArray(evento.menus)) {
    evento.menus.forEach(m => eventAssignedIds.add(typeof m === 'object' && m ? m.id : m));
  }

  for (const mId of selectedMenuIds) {
    if (!eventAssignedIds.has(mId)) {
      throw new CommercialPricingError(
        'MENU_NO_ASIGNADO',
        `El menú con ID "${mId}" no está asignado al evento "${evento.nombre}"`,
        { menuId: mId, eventoId: evento.id }
      );
    }
  }

  // 4. Validación del Porcentaje Comercial
  const effectiveMarkup = porcentajeComercial !== undefined && porcentajeComercial !== null
    ? validatePorcentajeComercial(porcentajeComercial)
    : DEFAULT_PORCENTAJE_COMERCIAL;

  // Mapas de búsqueda rápida
  const productMap = new Map();
  for (const p of productosDisponibles) {
    if (p && p.id) {
      productMap.set(p.id, p);
    }
  }

  const availableMenuMap = new Map();
  for (const m of menusDisponibles) {
    if (m && m.id) {
      availableMenuMap.set(m.id, m);
    }
  }

  // 5. Proceso de Cálculo por Menú y Consolidación de Insumos
  const menusCotizados = [];
  const consolidatedInsumosMap = new Map(); // producto_id -> { producto_id, producto_nombre, categoria, unidad, cantidad_requerida, precio_costo_unitario, costo_subtotal }

  let totalDinersAcrossQuotedMenus = 0;

  for (const menuId of selectedMenuIds) {
    const menu = availableMenuMap.get(menuId);
    if (!menu) {
      throw new CommercialPricingError(
        'MENU_NO_ENCONTRADO',
        `El menú con ID "${menuId}" no existe en la lista de menús disponibles`,
        { menuId }
      );
    }

    const comensales = resolveMenuDiners(evento, menuId);
    totalDinersAcrossQuotedMenus += comensales;

    let costoMenuRaw = 0;
    const items = Array.isArray(menu.items) ? menu.items : [];

    for (const item of items) {
      if (!item || typeof item !== 'object') {
        throw new CommercialPricingError(
          'ITEM_INVALIDO',
          `Se encontró un ingrediente no válido en la receta del menú "${menu.nombre}"`,
          { menuId: menu.id }
        );
      }

      if (!item.producto_id || typeof item.producto_id !== 'string') {
        throw new CommercialPricingError(
          'ITEM_SIN_PRODUCTO_ID',
          `Un ingrediente en el menú "${menu.nombre}" carece de identificador de producto`,
          { menuId: menu.id }
        );
      }

      const product = productMap.get(item.producto_id);
      if (!product) {
        throw new CommercialPricingError(
          'PRODUCTO_NO_ENCONTRADO',
          `El producto con ID "${item.producto_id}" requerido por el menú "${menu.nombre}" no existe en la lista de productos disponibles`,
          { menuId: menu.id, productoId: item.producto_id }
        );
      }

      // Validación de cantidad por persona
      const rawQty = item.cantidad_por_persona;
      const qtyPerPerson = Number(rawQty);
      if (rawQty === null || rawQty === undefined || !Number.isFinite(qtyPerPerson) || Number.isNaN(qtyPerPerson) || qtyPerPerson < 0) {
        throw new CommercialPricingError(
          'CANTIDAD_INGREDIENTE_INVALIDA',
          `La cantidad por persona para el ingrediente "${product.nombre}" en el menú "${menu.nombre}" es inválida (${rawQty}). Debe ser un número finito no negativo.`,
          { menuId: menu.id, productoId: product.id, rawQty }
        );
      }

      // Validación de precio de costo unitario
      const rawPrice = product.precio_actual;
      const unitPrice = Number(rawPrice);
      if (rawPrice === null || rawPrice === undefined || !Number.isFinite(unitPrice) || Number.isNaN(unitPrice) || unitPrice < 0) {
        throw new CommercialPricingError(
          'PRECIO_INVALIDO',
          `El producto "${product.nombre}" (ID: "${product.id}") no tiene un precio de costo válido (${rawPrice}).`,
          { productoId: product.id, rawPrice }
        );
      }

      // Verificación de compatibilidad de unidades
      const recipeUnit = item.unidad || product.unidad;
      const productUnit = product.unidad;
      if (!areUnitsCompatible(recipeUnit, productUnit)) {
        throw new CommercialPricingError(
          'UNIDAD_INCOMPATIBLE',
          `Unidad incompatible para el producto "${product.nombre}": la receta en "${menu.nombre}" especifica "${recipeUnit}" pero el producto está registrado con "${productUnit}".`,
          { menuId: menu.id, productoId: product.id, recipeUnit, productUnit }
        );
      }

      // Cálculo de cantidades e importes para este ingrediente en este menú
      const itemQtyRequired = qtyPerPerson * comensales;
      const itemCost = round2(itemQtyRequired * unitPrice);
      costoMenuRaw += itemCost;

      // Consolidación por producto
      if (!consolidatedInsumosMap.has(product.id)) {
        consolidatedInsumosMap.set(product.id, {
          producto_id: product.id,
          producto_nombre: product.nombre || item.producto_nombre || 'Desconocido',
          categoria: product.categoria || 'Otros',
          unidad: product.unidad || item.unidad || 'unidad',
          cantidad_requerida: 0,
          precio_costo_unitario: unitPrice,
          costo_subtotal: 0
        });
      }

      const consolidated = consolidatedInsumosMap.get(product.id);
      consolidated.cantidad_requerida += itemQtyRequired;
      consolidated.costo_subtotal += itemCost;
    }

    const costoMenu = round2(costoMenuRaw);
    const precioVentaMenu = round2(costoMenu * (1 + effectiveMarkup / 100));
    const precioVentaPorComensal = comensales > 0
      ? round2(precioVentaMenu / comensales)
      : 0;

    menusCotizados.push({
      menu_id: menu.id,
      menu_nombre: menu.nombre,
      comensales,
      costo_menu: costoMenu,
      precio_venta_menu: precioVentaMenu,
      precio_venta_por_comensal: precioVentaPorComensal
    });
  }

  // 6. Preparación de la instantánea de insumos consolidados
  const insumosSnapshot = Array.from(consolidatedInsumosMap.values()).map(ins => ({
    producto_id: ins.producto_id,
    producto_nombre: ins.producto_nombre,
    categoria: ins.categoria,
    unidad: ins.unidad,
    cantidad_requerida: round4(ins.cantidad_requerida),
    precio_costo_unitario: round2(ins.precio_costo_unitario),
    costo_subtotal: round2(ins.costo_subtotal)
  }));

  // Ordenar insumos por categoría y luego por nombre para una presentación determinista
  insumosSnapshot.sort((a, b) =>
    a.categoria.localeCompare(b.categoria) || a.producto_nombre.localeCompare(b.producto_nombre)
  );

  // 7. Cálculo de Totales Globales y Validación de Coherencia
  const costoTotalInterno = round2(menusCotizados.reduce((acc, m) => acc + m.costo_menu, 0));
  const costoTotalInsumos = round2(insumosSnapshot.reduce((acc, i) => acc + i.costo_subtotal, 0));

  // Coherencia matemática exacta entre menús e insumos consolidados
  if (Math.abs(costoTotalInterno - costoTotalInsumos) > 0.01) {
    throw new CommercialPricingError(
      'DISCREPANCIA_TOTALES',
      `Discrepancia interna entre el costo total de los menús ($${costoTotalInterno}) y el costo total consolidado de insumos ($${costoTotalInsumos})`,
      { costoTotalInterno, costoTotalInsumos }
    );
  }

  const precioVentaTotal = round2(menusCotizados.reduce((acc, m) => acc + m.precio_venta_menu, 0));
  const incrementoComercialMonto = round2(precioVentaTotal - costoTotalInterno);

  const comensalesDivisor = totalDinersAcrossQuotedMenus > 0
    ? totalDinersAcrossQuotedMenus
    : (evento.cantidad_comensales > 0 ? evento.cantidad_comensales : 0);

  const precioVentaPorComensalGeneral = comensalesDivisor > 0
    ? round2(precioVentaTotal / comensalesDivisor)
    : 0;

  // Validación de resultados finitos
  if (!Number.isFinite(costoTotalInterno) || !Number.isFinite(precioVentaTotal) || !Number.isFinite(incrementoComercialMonto)) {
    throw new CommercialPricingError('CALCULO_NO_FINITO', 'El cálculo arrojó un resultado numérico no finito o inválido');
  }

  return {
    evento_id: evento.id,
    evento_nombre: evento.nombre || '',
    cliente: evento.cliente || '',
    fecha_evento: evento.fecha || '',
    comensales_evento: totalDinersAcrossQuotedMenus > 0 ? totalDinersAcrossQuotedMenus : (evento.cantidad_comensales || 0),
    porcentaje_comercial: effectiveMarkup,
    menus_cotizados: menusCotizados,
    insumos_snapshot: insumosSnapshot,
    costo_total_interno: costoTotalInterno,
    incremento_comercial_monto: incrementoComercialMonto,
    precio_venta_total: precioVentaTotal,
    precio_venta_por_comensal_general: precioVentaPorComensalGeneral
  };
};

/**
 * Función de conveniencia que ensambla un objeto borrador completo compatible
 * con la entidad Presupuesto (validatePresupuesto) a partir del resultado del motor.
 *
 * @param {Object} options
 * @returns {Object} Presupuesto comercial en estado 'borrador'
 */
export const buildPresupuestoDraftFromCalculation = ({
  calculation,
  evento,
  titulo = 'Presupuesto Comercial',
  notas_internas = '',
  condiciones_comerciales = '',
  mostrar_desglose_por_menu = true,
  version_cotizacion = 1,
  presupuesto_origen_id = null
}) => {
  if (!calculation || typeof calculation !== 'object') {
    throw new CommercialPricingError('CALCULO_REQUERIDO', 'El resultado de cálculo es requerido para construir el presupuesto');
  }

  const now = new Date().toISOString();
  const id = `presup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  return {
    id,
    evento_id: calculation.evento_id || evento?.id || '',
    titulo,
    fecha_creacion: now,
    updated_date: now,
    estado: 'borrador',
    schema_version: PRESUPUESTO_SCHEMA_VERSION,
    version_cotizacion,
    presupuesto_origen_id,

    evento_nombre: calculation.evento_nombre || evento?.nombre || '',
    cliente: calculation.cliente || evento?.cliente || '',
    fecha_evento: calculation.fecha_evento || evento?.fecha || '',
    comensales_evento: calculation.comensales_evento || evento?.cantidad_comensales || 0,

    porcentaje_comercial: calculation.porcentaje_comercial,
    mostrar_desglose_por_menu,
    condiciones_comerciales,
    notas_internas,

    menus_cotizados: calculation.menus_cotizados || [],
    costo_total_interno: calculation.costo_total_interno || 0,
    incremento_comercial_monto: calculation.incremento_comercial_monto || 0,
    precio_venta_total: calculation.precio_venta_total || 0,
    precio_venta_por_comensal_general: calculation.precio_venta_por_comensal_general || 0,

    insumos_snapshot: calculation.insumos_snapshot || []
  };
};
