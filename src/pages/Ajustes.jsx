import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { User, Trash2, Moon, Smartphone, Database, Download, Upload, TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DEFAULT_PORCENTAJE_COMERCIAL,
  SETTING_KEY_DEFAULT_MARKUP,
  validatePorcentajeComercial,
  getDefaultMarkupPercent
} from '@/lib/presupuestoModel';

export default function Ajustes() {
  const { user, logout } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Configuración comercial
  const [markupPercent, setMarkupPercent] = useState('');
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [corruptedRaw, setCorruptedRaw] = useState('');
  const [markupError, setMarkupError] = useState('');

  useEffect(() => {
    const loaded = getDefaultMarkupPercent();
    if (loaded && typeof loaded === 'object' && loaded.isCorrupted) {
      setIsCorrupted(true);
      setCorruptedRaw(loaded.rawValue);
      setMarkupPercent('');
    } else {
      setIsCorrupted(false);
      setMarkupPercent(String(loaded));
    }
  }, []);

  const handleSaveMarkup = (e) => {
    if (e) e.preventDefault();
    try {
      const validNum = validatePorcentajeComercial(markupPercent);
      localStorage.setItem(SETTING_KEY_DEFAULT_MARKUP, String(validNum));
      setMarkupPercent(String(validNum));
      setMarkupError('');
      setIsCorrupted(false);
      toast.success('Porcentaje comercial guardado correctamente');
    } catch (err) {
      setMarkupError(err.message);
      toast.error(err.message);
    }
  };

  const handleResetCorruptedMarkup = () => {
    localStorage.setItem(SETTING_KEY_DEFAULT_MARKUP, String(DEFAULT_PORCENTAJE_COMERCIAL));
    setMarkupPercent(String(DEFAULT_PORCENTAJE_COMERCIAL));
    setIsCorrupted(false);
    setCorruptedRaw('');
    setMarkupError('');
    toast.success(`Configuración comercial restablecida al ${DEFAULT_PORCENTAJE_COMERCIAL}%`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke('eliminarCuenta', {});
      toast.success('Cuenta eliminada');
      logout();
    } catch (err) {
      toast.error('Error al eliminar la cuenta');
      setDeleting(false);
      setDeleteOpen(false);
      setConfirmText('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-heading font-semibold">Ajustes</h1>
        <p className="text-muted-foreground mt-1">Configuración de la cuenta y la app</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user?.full_name || 'Usuario'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Configuración Comercial */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Configuración Comercial</h2>
        </div>
        <p id="markup-desc" className="text-sm text-muted-foreground">
          Porcentaje que se agregará al costo de los insumos para calcular el precio de venta. Podrás modificarlo para cada presupuesto.
        </p>

        {isCorrupted && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>Valor de configuración corrupto detectado ("{corruptedRaw}")</span>
            </div>
            <p className="text-xs text-muted-foreground">
              El valor almacenado previamente en tu navegador no es un número válido. Podés restaurar el valor inicial del 40% presionando el botón abajo.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetCorruptedMarkup}
              className="text-xs border-amber-500/40 hover:bg-amber-500/20"
            >
              Restablecer al 40% predeterminado
            </Button>
          </div>
        )}

        <form onSubmit={handleSaveMarkup} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="markup-input" className="text-sm font-medium text-foreground">
              Incremento comercial predeterminado (%)
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-md">
              <div className="relative flex-1">
                <Input
                  id="markup-input"
                  type="number"
                  step="any"
                  min="0"
                  max="1000"
                  placeholder="Ej: 40"
                  value={markupPercent}
                  onChange={(e) => {
                    setMarkupPercent(e.target.value);
                    if (markupError) setMarkupError('');
                  }}
                  aria-describedby="markup-desc"
                  className={markupError ? 'border-destructive focus-visible:ring-destructive pr-8' : 'pr-8'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none select-none">
                  %
                </span>
              </div>
              <Button type="submit" className="min-w-[150px]">
                Guardar porcentaje
              </Button>
            </div>
            {markupError && (
              <p className="text-xs text-destructive mt-1 font-medium">{markupError}</p>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Moon className="w-5 h-5" /> Apariencia
        </h2>
        <p className="text-sm text-muted-foreground">
          El modo oscuro se activa automáticamente según la configuración de tu dispositivo. No necesitás activarlo manualmente.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5" /> Dispositivo móvil
        </h2>
        <p className="text-sm text-muted-foreground">
          Navegación inferior optimizada con áreas táctiles de 44px y soporte para safe-area en dispositivos con notch.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Database className="w-5 h-5" /> Copia de seguridad y datos
        </h2>
        <p className="text-sm text-muted-foreground">
          Podés exportar una copia de seguridad con todos tus productos, menús y eventos o importar datos guardados en archivo JSON.
        </p>
        <div className="flex gap-3 flex-wrap pt-2">
          <Button variant="outline" onClick={() => {
            const data = base44.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `catering_juliana_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success('Copia de seguridad descargada');
          }}>
            <Download className="w-4 h-4 mr-2" /> Exportar Datos (.json)
          </Button>
          <label className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-input rounded-md cursor-pointer bg-background hover:bg-accent hover:text-accent-foreground shadow-sm">
            <Upload className="w-4 h-4 mr-2" /> Importar Datos
            <input
              type="file"
              accept="*/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target.result);
                    if (!data || typeof data !== 'object') {
                      throw new Error('El archivo no contiene un formato JSON válido');
                    }
                    const confirmed = window.confirm(
                      '¿Estás seguro de que querés importar esta copia de seguridad?\n\n' +
                      'Se actualizarán tus productos, menús, recetas y eventos con los datos del archivo.'
                    );
                    if (!confirmed) {
                      e.target.value = '';
                      return;
                    }
                    base44.importAllData(data);
                    toast.success('Datos importados correctamente');
                    setTimeout(() => window.location.reload(), 1000);
                  } catch (err) {
                    toast.error(err.message || 'El archivo JSON no es válido');
                  } finally {
                    e.target.value = '';
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm('¿Querés borrar todos los datos para crear tus productos y menús desde cero?')) {
                base44.clearAllData();
                toast.success('Se vació la lista. Podés crear tus productos desde cero.');
                setTimeout(() => window.location.reload(), 500);
              }
            }}
          >
            Vaciar todo para empezar de cero
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-card p-5 space-y-3">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2 text-destructive">
          <Trash2 className="w-5 h-5" /> Eliminar cuenta
        </h2>
        <p className="text-sm text-muted-foreground">
          Al eliminar tu cuenta se borrarán permanentemente todos tus datos: productos, menús, eventos y categorías. Esta acción no se puede deshacer.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4 mr-1" /> Eliminar cuenta
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setConfirmText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán todos tus productos, menús, eventos y categorías. Para confirmar, escribí "ELIMINAR" abajo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Escribí ELIMINAR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== 'ELIMINAR' || deleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando...' : 'Eliminar cuenta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
