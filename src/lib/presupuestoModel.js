/**
 * Modelo de datos y validaciones para la entidad Presupuesto Comercial
 * Proyecto: Compras de Eventos — La Juliana
 * FASE 2.2.1
 */

export const PRESUPUESTO_SCHEMA_VERSION = 1;

export const PRESUPUESTO_ESTADOS = ['borrador', 'presentado', 'aprobado', 'rechazado'];

export const DEFAULT_PORCENTAJE_COMERCIAL = 40;

/**
 * Límite superior razonable para evitar entradas accidentales extremas (1000% sobre costo)
 */
export const MAX_PORCENTAJE_COMERCIAL = 1000;

/**
 * Clave de almacenamiento en localStorage para el porcentaje comercial predeterminado
 */
export const SETTING_KEY_DEFAULT_MARKUP = 'catering_setting_default_markup_percent';

/**
 * Valida un porcentaje comercial numérico
 * Acepta números o strings numéricos válidos, permitiendo decimales.
 * Rechaza: vacíos, NaN, Infinity, negativos y valores superiores a MAX_PORCENTAJE_COMERCIAL.
 */
export const validatePorcentajeComercial = (val) => {
  if (val === '' || val === null || val === undefined) {
    throw new Error('El porcentaje comercial no puede estar vacío');
  }
  const str = String(val).trim();
  if (str === '') {
    throw new Error('El porcentaje comercial no puede estar vacío');
  }
  const num = Number(str);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    throw new Error('El porcentaje comercial debe ser un número válido');
  }
  if (num < 0) {
    throw new Error('El porcentaje comercial no puede ser negativo');
  }
  if (num > MAX_PORCENTAJE_COMERCIAL) {
    throw new Error(`El porcentaje comercial no puede superar el ${MAX_PORCENTAJE_COMERCIAL}%`);
  }
  return num;
};

/**
 * Obtiene el porcentaje comercial predeterminado desde localStorage.
 * Si no está configurado, retorna DEFAULT_PORCENTAJE_COMERCIAL (40).
 * Si el valor almacenado está corrupto (NaN, negativo o no numérico), retorna { isCorrupted: true, rawValue }.
 */
export const getDefaultMarkupPercent = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_PORCENTAJE_COMERCIAL;
  }
  const stored = localStorage.getItem(SETTING_KEY_DEFAULT_MARKUP);
  if (stored === null || stored === '') {
    return DEFAULT_PORCENTAJE_COMERCIAL;
  }
  try {
    return validatePorcentajeComercial(stored);
  } catch {
    return { isCorrupted: true, rawValue: stored };
  }
};

/**
 * Campos que componen la instantánea histórica inmutable.
 * Una vez que un presupuesto pasa a 'presentado', 'aprobado' o 'rechazado',
 * estos campos NO pueden ser modificados silenciosamente.
 */
export const IMMUTABLE_SNAPSHOT_FIELDS = [
  'evento_id',
  'porcentaje_comercial',
  'costo_total_interno',
  'incremento_comercial_monto',
  'precio_venta_total',
  'precio_venta_por_comensal_general',
  'menus_cotizados',
  'insumos_snapshot',
  'evento_nombre',
  'cliente',
  'fecha_evento',
  'comensales_evento',
  'fecha_creacion',
  'version_cotizacion',
  'presupuesto_origen_id'
];

/**
 * Valida si una modificación sobre un presupuesto existente respeta la inmutabilidad histórica.
 * Lanza Error si se intenta alterar la cotización de un presupuesto presentado, aprobado o rechazado,
 * o si se intenta regresar un presupuesto presentado/aprobado/rechazado al estado 'borrador'.
 */
export const checkPresupuestoImmutability = (current, patchOrUpdated) => {
  if (!current || current.estado === 'borrador') {
    return true; // Los borradores son 100% editables
  }

  // Regla FASE 2.2.2: Un presupuesto presentado, aprobado o rechazado no puede regresar a 'borrador'
  if (current.estado !== 'borrador' && patchOrUpdated.estado === 'borrador') {
    throw new Error(
      `No está permitido cambiar un presupuesto en estado "${current.estado}" nuevamente a "borrador". Para realizar una nueva cotización editable, genere un nuevo presupuesto o versión.`
    );
  }

  for (const field of IMMUTABLE_SNAPSHOT_FIELDS) {
    if (patchOrUpdated[field] !== undefined) {
      const oldVal = current[field];
      const newVal = patchOrUpdated[field];

      if (typeof oldVal === 'object' && oldVal !== null) {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          throw new Error(
            `No está permitido modificar el campo histórico "${field}" en un presupuesto en estado "${current.estado}". Para cotizar nuevos valores o recetas, genere una nueva versión o presupuesto.`
          );
        }
      } else if (oldVal !== newVal) {
        throw new Error(
          `No está permitido modificar el valor histórico de "${field}" (${oldVal} -> ${newVal}) en un presupuesto en estado "${current.estado}".`
        );
      }
    }
  }

  return true;
};


/**
 * Verifica si un valor es un número finito no negativo (excluye NaN, Infinity, strings, etc.)
 */
export const isNonNegativeFiniteNumber = (val) => {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0;
};


/**
 * Valida un registro de menú cotizado
 */
export const validateMenuCotizado = (menu, index = 0) => {
  const prefix = `Menu cotizado [${index}]:`;
  if (!menu || typeof menu !== 'object') {
    throw new Error(`${prefix} Debe ser un objeto válido`);
  }
  if (!menu.menu_id || typeof menu.menu_id !== 'string') {
    throw new Error(`${prefix} menu_id requerido y debe ser texto`);
  }
  if (!menu.menu_nombre || typeof menu.menu_nombre !== 'string') {
    throw new Error(`${prefix} menu_nombre requerido y debe ser texto`);
  }
  if (!isNonNegativeFiniteNumber(menu.comensales)) {
    throw new Error(`${prefix} comensales debe ser un número finito >= 0`);
  }
  if (!isNonNegativeFiniteNumber(menu.costo_menu)) {
    throw new Error(`${prefix} costo_menu debe ser un número finito >= 0`);
  }
  if (!isNonNegativeFiniteNumber(menu.precio_venta_menu)) {
    throw new Error(`${prefix} precio_venta_menu debe ser un número finito >= 0`);
  }
  if (!isNonNegativeFiniteNumber(menu.precio_venta_por_comensal)) {
    throw new Error(`${prefix} precio_venta_por_comensal debe ser un número finito >= 0`);
  }
  return true;
};

/**
 * Valida un registro de la instantánea de insumo
 */
export const validateInsumoSnapshot = (insumo, index = 0) => {
  const prefix = `Insumo snapshot [${index}]:`;
  if (!insumo || typeof insumo !== 'object') {
    throw new Error(`${prefix} Debe ser un objeto válido`);
  }
  if (!insumo.producto_id || typeof insumo.producto_id !== 'string') {
    throw new Error(`${prefix} producto_id requerido y debe ser texto`);
  }
  if (!insumo.producto_nombre || typeof insumo.producto_nombre !== 'string') {
    throw new Error(`${prefix} producto_nombre requerido y debe ser texto`);
  }
  if (typeof insumo.categoria !== 'string') {
    throw new Error(`${prefix} categoria debe ser texto`);
  }
  if (typeof insumo.unidad !== 'string') {
    throw new Error(`${prefix} unidad debe ser texto`);
  }
  if (!isNonNegativeFiniteNumber(insumo.cantidad_requerida)) {
    throw new Error(`${prefix} cantidad_requerida debe ser un número finito >= 0`);
  }
  if (!isNonNegativeFiniteNumber(insumo.precio_costo_unitario)) {
    throw new Error(`${prefix} precio_costo_unitario debe ser un número finito >= 0`);
  }
  if (!isNonNegativeFiniteNumber(insumo.costo_subtotal)) {
    throw new Error(`${prefix} costo_subtotal debe ser un número finito >= 0`);
  }
  return true;
};

/**
 * Valida un presupuesto completo
 * @param {Object} p - Objeto presupuesto
 * @param {Object} options - { throwOnError: boolean }
 * @returns {boolean} true si es válido
 */
export const validatePresupuesto = (p, options = { throwOnError: true }) => {
  try {
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      throw new Error('El presupuesto debe ser un objeto válido');
    }

    // 1. Identificación y relaciones
    if (!p.id || typeof p.id !== 'string' || p.id.trim() === '') {
      throw new Error('id de presupuesto requerido');
    }
    if (!p.evento_id || typeof p.evento_id !== 'string' || p.evento_id.trim() === '') {
      throw new Error('evento_id requerido');
    }
    if (!p.titulo || typeof p.titulo !== 'string' || p.titulo.trim() === '') {
      throw new Error('titulo de presupuesto requerido');
    }

    // 2. Estado
    if (!p.estado || !PRESUPUESTO_ESTADOS.includes(p.estado)) {
      throw new Error(`estado inválido ("${p.estado}"). Debe ser uno de: ${PRESUPUESTO_ESTADOS.join(', ')}`);
    }

    // 3. Fechas
    if (!p.fecha_creacion || typeof p.fecha_creacion !== 'string') {
      throw new Error('fecha_creacion requerida (ISO string)');
    }

    // 4. Instantánea del Evento
    if (typeof p.evento_nombre !== 'string') {
      throw new Error('evento_nombre debe ser texto');
    }
    if (typeof p.cliente !== 'string') {
      throw new Error('cliente debe ser texto');
    }
    if (typeof p.fecha_evento !== 'string') {
      throw new Error('fecha_evento debe ser texto');
    }
    if (!isNonNegativeFiniteNumber(p.comensales_evento)) {
      throw new Error('comensales_evento debe ser un número finito >= 0');
    }

    // 5. Configuración Comercial
    if (!isNonNegativeFiniteNumber(p.porcentaje_comercial)) {
      throw new Error('porcentaje_comercial debe ser un número finito >= 0');
    }
    if (typeof p.mostrar_desglose_por_menu !== 'boolean') {
      throw new Error('mostrar_desglose_por_menu debe ser un booleano (true/false)');
    }
    if (p.condiciones_comerciales !== undefined && typeof p.condiciones_comerciales !== 'string') {
      throw new Error('condiciones_comerciales debe ser texto');
    }
    if (p.notas_internas !== undefined && typeof p.notas_internas !== 'string') {
      throw new Error('notas_internas debe ser texto');
    }

    // 6. Totales numéricos (estrictamente números finitos >= 0)
    if (!isNonNegativeFiniteNumber(p.costo_total_interno)) {
      throw new Error('costo_total_interno debe ser un número finito >= 0');
    }
    if (!isNonNegativeFiniteNumber(p.incremento_comercial_monto)) {
      throw new Error('incremento_comercial_monto debe ser un número finito >= 0');
    }
    if (!isNonNegativeFiniteNumber(p.precio_venta_total)) {
      throw new Error('precio_venta_total debe ser un número finito >= 0');
    }
    if (!isNonNegativeFiniteNumber(p.precio_venta_por_comensal_general)) {
      throw new Error('precio_venta_por_comensal_general debe ser un número finito >= 0');
    }

    // 7. Desglose de menús
    if (!Array.isArray(p.menus_cotizados)) {
      throw new Error('menus_cotizados debe ser una lista');
    }
    // Política de borradores: un borrador puede no tener menús asignados todavía; un presupuesto presentado o aprobado debe tener al menos 1
    if (p.estado !== 'borrador' && p.menus_cotizados.length === 0) {
      throw new Error(`Un presupuesto en estado "${p.estado}" debe incluir al menos un menú cotizado`);
    }
    p.menus_cotizados.forEach((m, idx) => validateMenuCotizado(m, idx));

    // 8. Instantánea de insumos
    if (!Array.isArray(p.insumos_snapshot)) {
      throw new Error('insumos_snapshot debe ser una lista');
    }
    p.insumos_snapshot.forEach((ins, idx) => validateInsumoSnapshot(ins, idx));

    // 9. Schema version y versionado de cotización
    if (p.schema_version !== undefined && (!Number.isInteger(p.schema_version) || p.schema_version < 1)) {
      throw new Error('schema_version debe ser un entero positivo');
    }
    if (p.version_cotizacion !== undefined && (!Number.isInteger(p.version_cotizacion) || p.version_cotizacion < 1)) {
      throw new Error('version_cotizacion debe ser un entero positivo (>= 1)');
    }
    if (p.presupuesto_origen_id !== undefined && p.presupuesto_origen_id !== null && typeof p.presupuesto_origen_id !== 'string') {
      throw new Error('presupuesto_origen_id debe ser un texto o null');
    }

    return true;
  } catch (err) {
    if (options.throwOnError) {
      throw err;
    }
    return false;
  }
};

/**
 * Crea un borrador vacío para un evento dado
 */
export const createEmptyPresupuestoDraft = (evento, defaultPorcentaje = DEFAULT_PORCENTAJE_COMERCIAL) => {
  const now = new Date().toISOString();
  return {
    id: `presup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    evento_id: evento?.id || '',
    titulo: 'Presupuesto Comercial',
    fecha_creacion: now,
    updated_date: now,
    estado: 'borrador',
    schema_version: PRESUPUESTO_SCHEMA_VERSION,
    version_cotizacion: 1,
    presupuesto_origen_id: null,

    // Snapshot inicial de datos del evento
    evento_nombre: evento?.nombre || '',
    cliente: evento?.cliente || '',
    fecha_evento: evento?.fecha || '',
    comensales_evento: evento?.cantidad_comensales || 0,

    // Preferencias comerciales
    porcentaje_comercial: defaultPorcentaje,
    mostrar_desglose_por_menu: true,
    condiciones_comerciales: '',
    notas_internas: '',

    // Menús y totales en cero
    menus_cotizados: [],
    costo_total_interno: 0,
    incremento_comercial_monto: 0,
    precio_venta_total: 0,
    precio_venta_por_comensal_general: 0,

    insumos_snapshot: []
  };
};
