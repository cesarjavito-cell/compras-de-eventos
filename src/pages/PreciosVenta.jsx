import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';
import {
  CircleDollarSign,
  CalendarDays,
  Users,
  UtensilsCrossed,
  Save,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileText,
  Copy,
  RefreshCw,
  Eye,
  Info,
  DollarSign,
  Sliders,
  Check,
  X,
  Download,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatPrice, formatNumber, formatDate, formatDateLong } from '@/lib/format';
import PullToRefresh from '@/components/PullToRefresh';
import {
  DEFAULT_PORCENTAJE_COMERCIAL,
  getDefaultMarkupPercent,
  validatePorcentajeComercial,
  validatePresupuesto,
  PRESUPUESTO_ESTADOS
} from '@/lib/presupuestoModel';
import {
  calculateCommercialQuote,
  buildPresupuestoDraftFromCalculation,
  resolveMenuDiners,
  CommercialPricingError
} from '@/lib/commercialPricing';

const estadoBadges = {
  borrador: { label: 'Borrador', className: 'bg-muted text-muted-foreground border-border' },
  presentado: { label: 'Presentado', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  aprobado: { label: 'Aprobado', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  rechazado: { label: 'Rechazado', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
};

export default function PreciosVenta() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [menus, setMenus] = useState([]);
  const [productos, setProductos] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  // Estados de la cotización activa
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [markupPercent, setMarkupPercent] = useState('40');
  const [markupError, setMarkupError] = useState('');
  const [showMenuBreakdown, setShowMenuBreakdown] = useState(true);
  const [condicionesComerciales, setCondicionesComerciales] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [tituloPresupuesto, setTituloPresupuesto] = useState('Presupuesto Comercial');
  const [origenPresupuestoId, setOrigenPresupuestoId] = useState(null);
  const [versionCotizacion, setVersionCotizacion] = useState(1);

  // Historial de presupuestos del evento
  const [presupuestosEvento, setPresupuestosEvento] = useState([]);
  const [loadingPresupuestos, setLoadingPresupuestos] = useState(false);
  const [detallePresupuesto, setDetallePresupuesto] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  // Control de guardado y confirmaciones
  const [isSaving, setIsSaving] = useState(false);
  const [showZeroDinersConfirm, setShowZeroDinersConfirm] = useState(false);
  const [pendingDraftToSave, setPendingDraftToSave] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'historial'

  // Generación y exportación de PDF comercial (FASE 2.2.5)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  // Consolidado expandible
  const [showConsolidatedInsumos, setShowConsolidatedInsumos] = useState(false);

  // Carga inicial de datos
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [evs, ms, ps] = await Promise.all([
        base44.entities.Evento.list('-fecha', 100),
        base44.entities.Menu.list('-updated_date', 200),
        base44.entities.Producto.list('-updated_date', 500),
      ]);
      setEventos(evs || []);
      setMenus(ms || []);
      setProductos(ps || []);

      const urlEventId = searchParams.get('evento');
      if (urlEventId && (evs || []).some(e => e.id === urlEventId)) {
        setSelectedEventId(urlEventId);
      } else if (evs && evs.length > 0) {
        setSelectedEventId(evs[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      toast.error('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar presupuestos cada vez que cambia el evento seleccionado
  const loadEventBudgets = async (eventId) => {
    if (!eventId) {
      setPresupuestosEvento([]);
      return;
    }
    setLoadingPresupuestos(true);
    try {
      const allBudgets = await base44.entities.Presupuesto.list('-fecha_creacion', 200);
      const filtered = (allBudgets || []).filter(p => p.evento_id === eventId);
      setPresupuestosEvento(filtered);
    } catch (err) {
      console.error('Error al cargar presupuestos:', err);
      toast.error('Error al cargar presupuestos del evento');
    } finally {
      setLoadingPresupuestos(false);
    }
  };

  const selectedEvento = useMemo(() => {
    return eventos.find(e => e.id === selectedEventId) || null;
  }, [eventos, selectedEventId]);

  // Menús asignados al evento
  const assignedMenus = useMemo(() => {
    if (!selectedEvento) return [];
    const assignedIds = new Set();
    if (Array.isArray(selectedEvento.menus_ids)) {
      selectedEvento.menus_ids.forEach(id => assignedIds.add(id));
    } else if (Array.isArray(selectedEvento.menus)) {
      selectedEvento.menus.forEach(m => assignedIds.add(typeof m === 'object' && m ? m.id : m));
    }
    return menus.filter(m => assignedIds.has(m.id));
  }, [selectedEvento, menus]);

  // Manejo de cambio de evento: limpiar estado temporal para evitar contaminación de datos
  const handleEventChange = (newEventId) => {
    setSelectedEventId(newEventId);
    setSearchParams({ evento: newEventId });

    const newEv = eventos.find(e => e.id === newEventId);
    // Reiniciar configuración comercial al valor predeterminado de Ajustes
    const defaultM = getDefaultMarkupPercent();
    const effectiveDefault = (defaultM && typeof defaultM === 'object' && defaultM.isCorrupted)
      ? DEFAULT_PORCENTAJE_COMERCIAL
      : defaultM;

    setMarkupPercent(String(effectiveDefault));
    setMarkupError('');
    setShowMenuBreakdown(true);
    setCondicionesComerciales('');
    setNotasInternas('');
    setTituloPresupuesto(newEv ? `Presupuesto - ${newEv.nombre}` : 'Presupuesto Comercial');
    setOrigenPresupuestoId(null);
    setVersionCotizacion(1);

    // Seleccionar por defecto todos los menús del nuevo evento
    if (newEv && Array.isArray(newEv.menus_ids)) {
      setSelectedMenuIds([...newEv.menus_ids]);
    } else {
      setSelectedMenuIds([]);
    }

    loadEventBudgets(newEventId);
  };

  // Inicializar selección de menús cuando se carga el primer evento
  useEffect(() => {
    if (selectedEvento && selectedMenuIds.length === 0) {
      const defaultM = getDefaultMarkupPercent();
      const effectiveDefault = (defaultM && typeof defaultM === 'object' && defaultM.isCorrupted)
        ? DEFAULT_PORCENTAJE_COMERCIAL
        : defaultM;
      setMarkupPercent(String(effectiveDefault));
      setTituloPresupuesto(`Presupuesto - ${selectedEvento.nombre}`);

      if (Array.isArray(selectedEvento.menus_ids)) {
        setSelectedMenuIds([...selectedEvento.menus_ids]);
      }
      loadEventBudgets(selectedEvento.id);
    }
  }, [selectedEvento]);

  // Toggle de selección de menú
  const toggleMenuSelection = (menuId) => {
    setSelectedMenuIds(prev => {
      if (prev.includes(menuId)) {
        return prev.filter(id => id !== menuId);
      }
      return [...prev, menuId];
    });
  };

  const handleSelectAllMenus = () => {
    setSelectedMenuIds(assignedMenus.map(m => m.id));
  };

  const handleDeselectAllMenus = () => {
    setSelectedMenuIds([]);
  };

  // Cálculo en tiempo real usando el motor independiente
  const calculationResult = useMemo(() => {
    if (!selectedEvento || selectedMenuIds.length === 0) {
      return { success: false, data: null, error: 'Seleccioná al menos un menú para cotizar' };
    }

    try {
      const validMarkup = validatePorcentajeComercial(markupPercent);
      const quote = calculateCommercialQuote({
        evento: selectedEvento,
        menusDisponibles: menus,
        productosDisponibles: productos,
        selectedMenuIds,
        porcentajeComercial: validMarkup
      });
      return { success: true, data: quote, error: null };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err.message || 'Error en el cálculo de la cotización'
      };
    }
  }, [selectedEvento, menus, productos, selectedMenuIds, markupPercent]);

  // Comprobar si hay menús seleccionados con 0 comensales
  const zeroDinersMenus = useMemo(() => {
    if (!selectedEvento) return [];
    return selectedMenuIds
      .map(id => {
        const m = menus.find(x => x.id === id);
        const diners = resolveMenuDiners(selectedEvento, id);
        return { menu: m, diners };
      })
      .filter(item => item.diners === 0);
  }, [selectedEvento, selectedMenuIds, menus]);

  // Guardado de presupuesto
  const handleSaveBudgetClick = async () => {
    if (!calculationResult.success || !calculationResult.data) {
      toast.error(calculationResult.error || 'No se puede guardar un presupuesto inválido');
      return;
    }

    try {
      const draft = buildPresupuestoDraftFromCalculation({
        calculation: calculationResult.data,
        evento: selectedEvento,
        titulo: tituloPresupuesto.trim() || 'Presupuesto Comercial',
        notas_internas: notasInternas,
        condiciones_comerciales: condicionesComerciales,
        mostrar_desglose_por_menu: showMenuBreakdown,
        version_cotizacion: versionCotizacion,
        presupuesto_origen_id: origenPresupuestoId
      });

      // Validación estricta con el modelo antes de guardar
      validatePresupuesto(draft, { throwOnError: true });

      // Si hay menús con cero comensales, pedir confirmación explícita antes de guardar
      if (zeroDinersMenus.length > 0) {
        setPendingDraftToSave(draft);
        setShowZeroDinersConfirm(true);
        return;
      }

      await executeSaveBudget(draft);
    } catch (err) {
      console.error('Error de validación previa al guardado:', err);
      toast.error(`Error al validar presupuesto: ${err.message}`);
    }
  };

  const executeSaveBudget = async (draft) => {
    setIsSaving(true);
    try {
      await base44.entities.Presupuesto.create(draft);
      toast.success('¡Presupuesto comercial guardado exitosamente!');
      await loadEventBudgets(selectedEvento.id);
      setActiveTab('historial');
    } catch (err) {
      console.error('Error al guardar presupuesto:', err);
      toast.error(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
      setShowZeroDinersConfirm(false);
      setPendingDraftToSave(null);
    }
  };

  // Operación A: Duplicar condiciones históricas (conservar importes y datos del presupuesto)
  const handleDuplicateBudget = async (presupuesto) => {
    try {
      const nextVersion = (presupuesto.version_cotizacion || 1) + 1;
      const duplicatedDraft = {
        ...presupuesto,
        id: `presup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        titulo: `${presupuesto.titulo} (v${nextVersion})`,
        estado: 'borrador',
        version_cotizacion: nextVersion,
        presupuesto_origen_id: presupuesto.id,
        fecha_creacion: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      validatePresupuesto(duplicatedDraft, { throwOnError: true });
      await base44.entities.Presupuesto.create(duplicatedDraft);
      toast.success(`Copia creada en borrador (v${nextVersion})`);
      await loadEventBudgets(selectedEvento.id);
      setDetalleOpen(false);
    } catch (err) {
      toast.error(`Error al duplicar presupuesto: ${err.message}`);
    }
  };

  // Operación B: Recotizar con precios actuales (cargar en el editor y re-ejecutar motor)
  const handleRequoteBudget = (presupuesto) => {
    const nextVersion = (presupuesto.version_cotizacion || 1) + 1;
    const menuIds = Array.isArray(presupuesto.menus_cotizados)
      ? presupuesto.menus_cotizados.map(m => m.menu_id)
      : [];

    setSelectedMenuIds(menuIds);
    setMarkupPercent(String(presupuesto.porcentaje_comercial));
    setShowMenuBreakdown(presupuesto.mostrar_desglose_por_menu ?? true);
    setCondicionesComerciales(presupuesto.condiciones_comerciales || '');
    setNotasInternas(presupuesto.notas_internas || '');
    setTituloPresupuesto(`${presupuesto.titulo} (v${nextVersion} Recotizado)`);
    setOrigenPresupuestoId(presupuesto.id);
    setVersionCotizacion(nextVersion);

    setDetalleOpen(false);
    setActiveTab('editor');
    toast.success('Parámetros cargados en el editor para recotizar con costos actuales');
  };

  // Cambio de estado en el presupuesto visualizado
  const handleStatusChange = async (presupuesto, newEstado) => {
    try {
      await base44.entities.Presupuesto.update(presupuesto.id, { estado: newEstado });
      toast.success(`Estado actualizado a "${estadoBadges[newEstado]?.label || newEstado}"`);
      await loadEventBudgets(selectedEvento.id);
      setDetallePresupuesto(prev => prev ? { ...prev, estado: newEstado } : null);
    } catch (err) {
      toast.error(err.message || 'Error al cambiar el estado');
    }
  };

  const handleOpenDetalle = (p) => {
    setDetallePresupuesto(p);
    setDetalleOpen(true);
  };

  // Cargar logotipo oficial para el documento PDF si está disponible
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== 'undefined' && window.fetch) {
      fetch('/app_logo.jpg')
        .then(res => {
          if (!res.ok) throw new Error('Logo no accesible');
          return res.blob();
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted && typeof reader.result === 'string') {
              setLogoBase64(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // Si no se puede cargar la imagen, se usará el respaldo tipográfico oficial
        });
    }
    return () => { isMounted = false; };
  }, []);

  // Descarga del PDF comercial (carga diferida con dynamic import para optimizar el bundle)
  const handleDownloadPdf = async (presupuesto) => {
    if (!presupuesto) return;
    setIsGeneratingPdf(true);
    try {
      const { downloadCommercialQuotePdf } = await import('@/lib/commercialQuotePdf');
      const filename = downloadCommercialQuotePdf(presupuesto, { logoBase64 });
      toast.success(`PDF descargado: ${filename}`);
    } catch (err) {
      console.error('Error al generar PDF comercial:', err);
      toast.error('No se pudo generar el archivo PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Compartir PDF comercial vía Web Share API o fallback a descarga (carga diferida)
  const handleSharePdf = async (presupuesto) => {
    if (!presupuesto) return;
    setIsGeneratingPdf(true);
    try {
      const { shareCommercialQuotePdf } = await import('@/lib/commercialQuotePdf');
      const res = await shareCommercialQuotePdf(presupuesto, { logoBase64 });
      if (res.method === 'web-share') {
        if (res.success) {
          toast.success('¡Presupuesto compartido exitosamente!');
        }
      } else if (res.method === 'download-fallback') {
        toast(res.message, {
          icon: 'ℹ️',
          duration: 6000,
          style: {
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            maxWidth: '460px'
          }
        });
      }
    } catch (err) {
      console.error('Error al compartir PDF:', err);
      toast.error('Ocurrió un error al preparar el PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CalendarDays className="w-12 h-12 text-muted-foreground/40" />
        <p className="mt-4 text-muted-foreground">No hay eventos registrados. Creá un evento primero para cotizar.</p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadInitialData}>
      <div className="space-y-6 max-w-6xl pb-12">
        {/* Encabezado y Selector de Evento */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <CircleDollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-semibold">Precios de Venta</h1>
                <p className="text-sm text-muted-foreground">Cotizaciones comerciales y cálculo de presupuestos para clientes</p>
              </div>
            </div>
          </div>

          {/* Selector de Evento */}
          <div className="min-w-[280px] sm:max-w-md">
            <Label className="text-xs text-muted-foreground font-medium mb-1 block">Evento a presupuestar</Label>
            <Select value={selectedEventId} onValueChange={handleEventChange}>
              <SelectTrigger className="w-full bg-card shadow-sm border-border">
                <SelectValue placeholder="Seleccionar evento..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {eventos.map(ev => (
                  <SelectItem key={ev.id} value={ev.id}>
                    <span className="font-medium">{ev.nombre}</span>
                    {ev.cliente ? ` · ${ev.cliente}` : ''}
                    {ev.fecha ? ` (${formatDate(ev.fecha)})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ficha Resumen del Evento Seleccionado */}
        {selectedEvento && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-xs text-muted-foreground block">Evento</span>
                <span className="font-semibold text-foreground">{selectedEvento.nombre}</span>
              </div>
              {selectedEvento.cliente && (
                <div>
                  <span className="text-xs text-muted-foreground block">Cliente</span>
                  <span className="font-medium text-foreground">{selectedEvento.cliente}</span>
                </div>
              )}
              {selectedEvento.fecha && (
                <div>
                  <span className="text-xs text-muted-foreground block">Fecha</span>
                  <span className="font-medium text-foreground">{formatDateLong(selectedEvento.fecha)}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground block">Invitados Totales</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" /> {selectedEvento.cantidad_comensales || 0} personas
                </span>
              </div>
            </div>

            {/* Selector de Pestañas (Editor vs Historial) */}
            <div className="inline-flex p-1 rounded-lg bg-muted border border-border select-none">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'editor'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-4 h-4" /> Cotizar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('historial')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'historial'
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="w-4 h-4" /> Historial ({presupuestosEvento.length})
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 1: EDITOR DE COTIZACIÓN */}
        {/* ========================================================================= */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* 1. Selección de Menús */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-primary" /> Menús a Incluir en la Cotización
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Elegí cuáles menús del evento formarán parte de este presupuesto.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllMenus} className="text-xs">
                    Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAllMenus} className="text-xs">
                    Ninguno
                  </Button>
                </div>
              </div>

              {assignedMenus.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Este evento no tiene menús asignados. Asigná al menos un menú desde la sección Eventos.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {assignedMenus.map(m => {
                    const isSelected = selectedMenuIds.includes(m.id);
                    const diners = resolveMenuDiners(selectedEvento, m.id);
                    const isZeroDiners = diners === 0;

                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleMenuSelection(m.id)}
                        className={`rounded-lg border p-3.5 cursor-pointer select-none transition-all ${
                          isSelected
                            ? 'bg-primary/5 border-primary/50 shadow-sm'
                            : 'bg-card border-border hover:bg-muted/40 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                              isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div className="truncate">
                              <h3 className="font-semibold text-sm truncate">{m.nombre}</h3>
                              {m.tipo && <span className="text-[11px] text-muted-foreground">{m.tipo}</span>}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0 ${
                            isZeroDiners
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {diners} pers
                          </span>
                        </div>

                        {isZeroDiners && isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Menú configurado con 0 comensales.</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Configuración Comercial de esta Cotización */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="border-b border-border pb-3">
                <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Condiciones y Porcentaje Comercial
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ajustá el incremento sobre costos y los datos generales de esta cotización.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Título de la cotización */}
                <div className="space-y-1.5">
                  <Label htmlFor="quote-title" className="text-sm font-medium">Título del Presupuesto</Label>
                  <Input
                    id="quote-title"
                    value={tituloPresupuesto}
                    onChange={(e) => setTituloPresupuesto(e.target.value)}
                    placeholder="Ej: Presupuesto Oficial Boda"
                  />
                </div>

                {/* Porcentaje comercial */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quote-markup" className="text-sm font-medium">Incremento Comercial (%)</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const def = getDefaultMarkupPercent();
                        setMarkupPercent(String(typeof def === 'number' ? def : 40));
                        setMarkupError('');
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Usar predeterminado de Ajustes
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="quote-markup"
                      type="number"
                      step="any"
                      min="0"
                      max="1000"
                      value={markupPercent}
                      onChange={(e) => {
                        setMarkupPercent(e.target.value);
                        if (markupError) setMarkupError('');
                      }}
                      className={`pr-8 ${markupError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
                      %
                    </span>
                  </div>
                  {markupError && <p className="text-xs text-destructive">{markupError}</p>}
                </div>
              </div>

              {/* Preferencia de desglose para el cliente */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="toggle-breakdown" className="text-sm font-medium block">
                    Mostrar precios individuales por menú en el presupuesto del cliente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {showMenuBreakdown
                      ? 'Activado: el presupuesto detallará el precio por persona de cada menú y el total.'
                      : 'Desactivado: el presupuesto presentará únicamente el importe total del servicio.'}
                  </p>
                </div>
                <input
                  id="toggle-breakdown"
                  type="checkbox"
                  checked={showMenuBreakdown}
                  onChange={(e) => setShowMenuBreakdown(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
                />
              </div>

              {/* Condiciones comerciales opcionales */}
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="quote-conds" className="text-sm font-medium">Condiciones comerciales (opcional)</Label>
                <Textarea
                  id="quote-conds"
                  rows={2}
                  value={condicionesComerciales}
                  onChange={(e) => setCondicionesComerciales(e.target.value)}
                  placeholder="Ej: Seña del 50% para reserva de fecha. Saldo restante 7 días previos al evento..."
                />
              </div>

              {/* Notas internas del equipo */}
              <div className="space-y-1.5">
                <Label htmlFor="quote-notes" className="text-sm font-medium">Notas internas (privadas)</Label>
                <Input
                  id="quote-notes"
                  value={notasInternas}
                  onChange={(e) => setNotasInternas(e.target.value)}
                  placeholder="Ej: Incluye mozo adicional sin cargo, cliente recomendado por Juan..."
                />
              </div>
            </div>

            {/* 3. Panel Financiero y Desglose de Resultados */}
            {calculationResult.success && calculationResult.data ? (
              <div className="space-y-6">
                {/* Tarjetas de Totales Financieros */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <span className="text-xs text-muted-foreground block">Costo Insumos Teóricos</span>
                    <span className="text-xl font-bold font-heading text-foreground mt-1 block">
                      {formatPrice(calculationResult.data.costo_total_interno)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Costo 100% de recetas</span>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <span className="text-xs text-muted-foreground block">Incremento Comercial</span>
                    <span className="text-xl font-bold font-heading text-emerald-600 dark:text-emerald-400 mt-1 block">
                      +{formatPrice(calculationResult.data.incremento_comercial_monto)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">+{calculationResult.data.porcentaje_comercial}% sobre costo</span>
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
                    <span className="text-xs font-semibold text-primary block">Precio de Venta Total</span>
                    <span className="text-2xl font-bold font-heading text-primary mt-1 block">
                      {formatPrice(calculationResult.data.precio_venta_total)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Importe total al cliente</span>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <span className="text-xs text-muted-foreground block">Precio Promedio / Persona</span>
                    <span className="text-xl font-bold font-heading text-foreground mt-1 block">
                      {formatPrice(calculationResult.data.precio_venta_por_comensal_general)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Sobre {calculationResult.data.comensales_evento} comensales</span>
                  </div>
                </div>

                {/* Tabla de Menús Cotizados */}
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Desglose Comercial por Menú
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">
                      {calculationResult.data.menus_cotizados.length} menús seleccionados
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                          <th className="text-left py-2.5 px-4 font-medium">Menú</th>
                          <th className="text-center py-2.5 px-4 font-medium">Comensales</th>
                          <th className="text-right py-2.5 px-4 font-medium">Costo Interno</th>
                          <th className="text-right py-2.5 px-4 font-medium">Precio Venta Menú</th>
                          <th className="text-right py-2.5 px-4 font-medium">Precio / Persona</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculationResult.data.menus_cotizados.map(m => (
                          <tr key={m.menu_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                            <td className="py-3 px-4 font-semibold text-foreground">{m.menu_nombre}</td>
                            <td className="py-3 px-4 text-center font-medium">{m.comensales}</td>
                            <td className="py-3 px-4 text-right text-muted-foreground">{formatPrice(m.costo_menu)}</td>
                            <td className="py-3 px-4 text-right font-bold text-foreground">{formatPrice(m.precio_venta_menu)}</td>
                            <td className="py-3 px-4 text-right font-semibold text-primary">{formatPrice(m.precio_venta_por_comensal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Consolidado de Insumos Expandible */}
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowConsolidatedInsumos(!showConsolidatedInsumos)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="font-heading font-semibold text-sm">
                        Ver Consolidado de Insumos Teóricos ({calculationResult.data.insumos_snapshot.length} ítems)
                      </span>
                    </div>
                    {showConsolidatedInsumos ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {showConsolidatedInsumos && (
                    <div className="border-t border-border overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                            <th className="text-left py-2 px-4 font-medium">Insumo</th>
                            <th className="text-left py-2 px-4 font-medium">Categoría</th>
                            <th className="text-right py-2 px-4 font-medium">Cantidad Teórica</th>
                            <th className="text-left py-2 px-4 font-medium">Unidad</th>
                            <th className="text-right py-2 px-4 font-medium">Precio Costo</th>
                            <th className="text-right py-2 px-4 font-medium">Costo Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculationResult.data.insumos_snapshot.map(ins => (
                            <tr key={ins.producto_id} className="border-b border-border last:border-0 hover:bg-muted/20">
                              <td className="py-2 px-4 font-medium">{ins.producto_nombre}</td>
                              <td className="py-2 px-4 text-muted-foreground">{ins.categoria}</td>
                              <td className="py-2 px-4 text-right font-semibold">{formatNumber(ins.cantidad_requerida, 3)}</td>
                              <td className="py-2 px-4 text-muted-foreground">{ins.unidad}</td>
                              <td className="py-2 px-4 text-right text-muted-foreground">{formatPrice(ins.precio_costo_unitario)}</td>
                              <td className="py-2 px-4 text-right font-medium">{formatPrice(ins.costo_subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Botón de Guardado */}
                <div className="flex justify-end pt-2">
                  <Button
                    size="lg"
                    disabled={isSaving}
                    onClick={handleSaveBudgetClick}
                    className="min-w-[220px] shadow-sm font-semibold flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar presupuesto'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{calculationResult.error}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: HISTORIAL DE PRESUPUESTOS DEL EVENTO */}
        {/* ========================================================================= */}
        {activeTab === 'historial' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Cotizaciones Guardadas para este Evento
              </h2>
              <Button size="sm" onClick={() => setActiveTab('editor')}>
                Nueva Cotización
              </Button>
            </div>

            {loadingPresupuestos ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : presupuestosEvento.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground space-y-3">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="font-medium text-foreground">No hay presupuestos guardados para este evento.</p>
                <p className="text-xs">Podés armar una cotización en la pestaña "Cotizar" y guardarla para el cliente.</p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('editor')}>
                  Crear primer presupuesto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presupuestosEvento.map(p => {
                  const badge = estadoBadges[p.estado] || estadoBadges.borrador;
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-heading font-semibold text-base">{p.titulo}</h3>
                              {p.version_cotizacion > 1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  v{p.version_cotizacion}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground block mt-0.5">
                              {formatDateLong(p.fecha_creacion?.split('T')[0])}
                            </span>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                          <div>
                            <span className="text-muted-foreground block">Precio Venta Total:</span>
                            <span className="font-bold text-sm text-foreground">{formatPrice(p.precio_venta_total)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Markup Aplicado:</span>
                            <span className="font-semibold text-sm text-primary">{p.porcentaje_comercial}%</span>
                          </div>
                        </div>

                        {p.menus_cotizados && p.menus_cotizados.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span>Menús: </span>
                            <span className="font-medium text-foreground">
                              {p.menus_cotizados.map(m => m.menu_nombre).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetalle(p)}>
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL DE DETALLE HISTÓRICO Y NUEVAS VERSIONES */}
        {/* ========================================================================= */}
        <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            {detallePresupuesto && (
              <div className="space-y-5">
                <DialogHeader>
                  <div className="flex items-center justify-between gap-4 pr-6">
                    <div>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <span>{detallePresupuesto.titulo}</span>
                        {detallePresupuesto.version_cotizacion > 1 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted">
                            v{detallePresupuesto.version_cotizacion}
                          </span>
                        )}
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cotizado el {formatDateLong(detallePresupuesto.fecha_creacion?.split('T')[0])}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
                      estadoBadges[detallePresupuesto.estado]?.className || estadoBadges.borrador.className
                    }`}>
                      {estadoBadges[detallePresupuesto.estado]?.label || detallePresupuesto.estado}
                    </span>
                  </div>
                </DialogHeader>

                {/* Barra de Acciones del Documento Comercial (FASE 2.2.5) */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">Presupuesto Comercial en PDF</span>
                      <span className="text-[11px] text-muted-foreground block">
                        {detallePresupuesto.mostrar_desglose_por_menu
                          ? 'Modalidad: Desglose por menú con precios unitarios'
                          : 'Modalidad: Importe global único (sin desgloses)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isGeneratingPdf}
                      onClick={() => handleDownloadPdf(detallePresupuesto)}
                      className="text-xs flex items-center gap-1.5 shadow-sm bg-card hover:bg-muted font-medium flex-1 sm:flex-initial justify-center min-h-[38px]"
                    >
                      <Download className="w-4 h-4 text-primary" />
                      {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isGeneratingPdf}
                      onClick={() => handleSharePdf(detallePresupuesto)}
                      className="text-xs flex items-center gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex-1 sm:flex-initial justify-center min-h-[38px]"
                    >
                      <Share2 className="w-4 h-4" />
                      Compartir PDF
                    </Button>
                  </div>
                </div>

                {/* Selector de Cambio de Estado Válido */}
                <div className="rounded-lg border border-border p-3.5 bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold block text-foreground">Estado de la cotización</span>
                    <span className="text-[11px] text-muted-foreground">
                      {detallePresupuesto.estado === 'borrador'
                        ? 'En borrador podés modificar el estado antes de enviarlo al cliente.'
                        : 'Un presupuesto presentado o cerrado no puede regresar a borrador para proteger la cotización original.'}
                    </span>
                  </div>
                  <Select
                    value={detallePresupuesto.estado}
                    onValueChange={(val) => handleStatusChange(detallePresupuesto, val)}
                  >
                    <SelectTrigger className="w-[170px] bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESUPUESTO_ESTADOS.map(est => {
                        // Regla de negocio FASE 2.2.2: no regresar de presentado/aprobado/rechazado a borrador
                        const isDisabled = detallePresupuesto.estado !== 'borrador' && est === 'borrador';
                        return (
                          <SelectItem key={est} value={est} disabled={isDisabled}>
                            {estadoBadges[est]?.label || est}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Totales Históricos Inmutables */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-border p-3 bg-card">
                    <span className="text-xs text-muted-foreground block">Costo Interno</span>
                    <span className="text-base font-bold text-foreground">
                      {formatPrice(detallePresupuesto.costo_total_interno)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-card">
                    <span className="text-xs text-muted-foreground block">Markup</span>
                    <span className="text-base font-bold text-primary">
                      {detallePresupuesto.porcentaje_comercial}%
                    </span>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-card">
                    <span className="text-xs text-muted-foreground block">Precio Venta Total</span>
                    <span className="text-base font-bold text-foreground">
                      {formatPrice(detallePresupuesto.precio_venta_total)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border p-3 bg-card">
                    <span className="text-xs text-muted-foreground block">Precio / Persona</span>
                    <span className="text-base font-bold text-foreground">
                      {formatPrice(detallePresupuesto.precio_venta_por_comensal_general)}
                    </span>
                  </div>
                </div>

                {/* Desglose de menús cotizados */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Menús Incluidos en esta Versión
                  </span>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-3 font-medium">Menú</th>
                          <th className="text-center py-2 px-3 font-medium">Comensales</th>
                          <th className="text-right py-2 px-3 font-medium">Costo</th>
                          <th className="text-right py-2 px-3 font-medium">Precio Venta</th>
                          <th className="text-right py-2 px-3 font-medium">Precio/Persona</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detallePresupuesto.menus_cotizados || []).map(m => (
                          <tr key={m.menu_id} className="border-b border-border last:border-0">
                            <td className="py-2 px-3 font-medium">{m.menu_nombre}</td>
                            <td className="py-2 px-3 text-center">{m.comensales}</td>
                            <td className="py-2 px-3 text-right text-muted-foreground">{formatPrice(m.costo_menu)}</td>
                            <td className="py-2 px-3 text-right font-semibold">{formatPrice(m.precio_venta_menu)}</td>
                            <td className="py-2 px-3 text-right text-primary font-medium">{formatPrice(m.precio_venta_por_comensal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Condiciones comerciales si existen */}
                {detallePresupuesto.condiciones_comerciales && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">Condiciones comerciales:</span>
                    <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
                      {detallePresupuesto.condiciones_comerciales}
                    </p>
                  </div>
                )}

                {/* Acciones de Nueva Versión (Requirement 12) */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="text-xs text-muted-foreground">
                    Crear nueva versión a partir de esta cotización:
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateBudget(detallePresupuesto)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicar condiciones históricas
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleRequoteBudget(detallePresupuesto)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Recotizar con precios actuales
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de confirmación ante menús con cero comensales */}
        <AlertDialog open={showZeroDinersConfirm} onOpenChange={setShowZeroDinersConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Menús con cero comensales detectados
              </AlertDialogTitle>
              <AlertDialogDescription>
                Se detectaron menús seleccionados con 0 comensales asignados:
                <br />
                <strong>{zeroDinersMenus.map(z => z.menu?.nombre).join(', ')}</strong>
                <br /><br />
                Estos menús tendrán un importe de $0 en la cotización. ¿Deseás guardar el presupuesto con esta configuración?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingDraftToSave(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => executeSaveBudget(pendingDraftToSave)}>
                Confirmar y Guardar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PullToRefresh>
  );
}
