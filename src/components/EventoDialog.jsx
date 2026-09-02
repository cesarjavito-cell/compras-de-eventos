import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Check, Square, Utensils, Users } from 'lucide-react';

const estados = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function EventoDialog({ open, onOpenChange, evento, menus, onSave }) {
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    fecha: '',
    cantidad_comensales: 0,
    menus_ids: [],
    menu_comensales: {},
    estado: 'borrador',
    notas: '',
  });

  useEffect(() => {
    if (evento) {
      setFormData({
        nombre: evento.nombre || '',
        cliente: evento.cliente || '',
        fecha: evento.fecha || '',
        cantidad_comensales: evento.cantidad_comensales || 0,
        menus_ids: evento.menus_ids || [],
        menu_comensales: evento.menu_comensales || {},
        estado: evento.estado || 'borrador',
        notas: evento.notas || '',
      });
    } else {
      setFormData({
        nombre: '',
        cliente: '',
        fecha: '',
        cantidad_comensales: 0,
        menus_ids: [],
        menu_comensales: {},
        estado: 'borrador',
        notas: '',
      });
    }
  }, [evento, open]);

  const toggleMenu = (menuId) => {
    setFormData(prev => {
      const isSelected = prev.menus_ids.includes(menuId);
      const newIds = isSelected
        ? prev.menus_ids.filter(id => id !== menuId)
        : [...prev.menus_ids, menuId];

      const newMenuComensales = { ...prev.menu_comensales };
      if (!isSelected && newMenuComensales[menuId] === undefined) {
        newMenuComensales[menuId] = prev.cantidad_comensales || 0;
      } else if (isSelected) {
        delete newMenuComensales[menuId];
      }

      return {
        ...prev,
        menus_ids: newIds,
        menu_comensales: newMenuComensales,
      };
    });
  };

  const handleMenuComensalesChange = (menuId, value) => {
    const val = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      menu_comensales: {
        ...prev.menu_comensales,
        [menuId]: val
      }
    }));
  };

  const handleTotalComensalesChange = (value) => {
    const total = parseInt(value) || 0;
    setFormData(prev => {
      // If single menu selected or menu_comensales empty, sync default
      const updatedMenuComensales = { ...prev.menu_comensales };
      if (prev.menus_ids.length === 1) {
        updatedMenuComensales[prev.menus_ids[0]] = total;
      }
      return {
        ...prev,
        cantidad_comensales: total,
        menu_comensales: updatedMenuComensales,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const totalAssignedComensales = formData.menus_ids.reduce((sum, id) => {
    const count = formData.menu_comensales[id] !== undefined
      ? formData.menu_comensales[id]
      : formData.cantidad_comensales;
    return sum + count;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{evento ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ev-nombre">Nombre del evento *</Label>
            <Input
              id="ev-nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              placeholder="Ej: Boda de Juan y María"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ev-cliente">Cliente</Label>
              <Input
                id="ev-cliente"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-fecha">Fecha</Label>
              <Input
                id="ev-fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ev-comensales">Comensales totales del evento</Label>
              <Input
                id="ev-comensales"
                type="number"
                min="0"
                value={formData.cantidad_comensales}
                onChange={(e) => handleTotalComensalesChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.estado} onValueChange={(v) => setFormData({ ...formData, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {estados.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Menus and Mixed Menu comensales configuration */}
          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-primary" /> Menús seleccionados (Menú Mixto)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seleccioná los menús y asigná cuántas personas consumirán cada uno.
                </p>
              </div>
              {formData.menus_ids.length > 1 && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                  totalAssignedComensales === formData.cantidad_comensales
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  Suma menús: {totalAssignedComensales} / {formData.cantidad_comensales} pers
                </span>
              )}
            </div>

            {menus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No hay menús creados. Creá al menos uno primero.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {menus.map(m => {
                  const selected = formData.menus_ids.includes(m.id);
                  const currentComensales = formData.menu_comensales[m.id] !== undefined
                    ? formData.menu_comensales[m.id]
                    : formData.cantidad_comensales;

                  return (
                    <div
                      key={m.id}
                      className={`rounded-lg border transition-all ${
                        selected
                          ? 'bg-card border-primary/40 shadow-sm p-3'
                          : 'bg-card border-border hover:bg-muted/40 p-2.5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleMenu(m.id)}
                          className="flex items-center gap-2.5 text-left flex-1 select-none"
                        >
                          <span className={`flex-shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
                            {selected ? <Check className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </span>
                          <div>
                            <span className="font-semibold text-sm">{m.nombre}</span>
                            {m.tipo && <span className="text-xs text-muted-foreground ml-2">({m.tipo})</span>}
                          </div>
                        </button>

                        {selected && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-md border border-border">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0"
                                value={currentComensales}
                                onChange={(e) => handleMenuComensalesChange(m.id, e.target.value)}
                                className="w-16 h-7 text-right font-bold text-xs bg-background px-1"
                                placeholder="0"
                              />
                              <span className="text-xs text-muted-foreground font-medium">pers.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-notas">Notas</Label>
            <Textarea
              id="ev-notas"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
              placeholder="Opcional"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{evento ? 'Guardar cambios' : 'Crear evento'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
