import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Package, UtensilsCrossed, CalendarDays, ShoppingCart, ChefHat, Menu, X, LogOut, Settings, ChevronLeft, CircleDollarSign } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Navegación completa para escritorio y menú lateral móvil (drawer)
const sidebarNavItems = [
  { label: 'Panel', path: '/', icon: LayoutDashboard },
  { label: 'Productos', path: '/productos', icon: Package },
  { label: 'Menús', path: '/menus', icon: UtensilsCrossed },
  { label: 'Eventos', path: '/eventos', icon: CalendarDays },
  { label: 'Cálculo', path: '/calculo', icon: ShoppingCart },
  { label: 'Precios de Venta', path: '/precios-venta', icon: CircleDollarSign },
  { label: 'Ajustes', path: '/ajustes', icon: Settings },
];

// Barra inferior móvil: conserva los 6 botones originales sin comprimir la interfaz
const mobileBottomNavItems = [
  { label: 'Panel', path: '/', icon: LayoutDashboard },
  { label: 'Productos', path: '/productos', icon: Package },
  { label: 'Menús', path: '/menus', icon: UtensilsCrossed },
  { label: 'Eventos', path: '/eventos', icon: CalendarDays },
  { label: 'Cálculo', path: '/calculo', icon: ShoppingCart },
  { label: 'Ajustes', path: '/ajustes', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const hasDialog = searchParams.has('dialog');
  const showBack = location.pathname !== '/' || hasDialog;

  const handleTopBarClick = () => {
    if (hasDialog) {
      const next = new URLSearchParams(searchParams);
      next.delete('dialog');
      next.delete('id');
      setSearchParams(next, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div id="main-scroll" className="fixed inset-0 flex flex-col md:flex-row items-stretch overflow-y-auto bg-background w-full">
      {/* Mobile top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-primary))] border-b border-[hsl(var(--sidebar-border))] md:hidden"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2 text-[hsl(var(--sidebar-primary))]">
          <img src="/app_logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-[hsl(var(--sidebar-border))]/30 shadow-sm" />
          <span className="font-heading text-lg font-bold">La Juliana</span>
        </div>
        <div className="flex items-center gap-1">
          {showBack && (
            <button
              onClick={handleTopBarClick}
              aria-label="Volver"
              className="text-[hsl(var(--sidebar-primary))] min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú principal"
            className="text-[hsl(var(--sidebar-primary))] min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))] flex flex-col
        transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-3">
            <img src="/app_logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-[hsl(var(--sidebar-border))]/40 shadow-sm" />
            <div>
              <h1 className="font-heading text-lg font-bold text-[hsl(var(--sidebar-primary))]">La Juliana</h1>
              <p className="text-xs text-[hsl(var(--sidebar-foreground))]/70">Compras de Eventos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none min-h-[44px] ${
                  active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]/50 hover:text-[hsl(var(--sidebar-primary))]'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]/50 hover:text-[hsl(var(--sidebar-primary))] transition-all select-none min-h-[44px]"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <main
        className="flex-1 w-full min-w-0 p-4 sm:p-6 md:p-10 pt-16 sm:pt-20 md:pt-10 pb-24 md:pb-10"
      >
        <Outlet />
      </main>

      {/* Bottom navigation (mobile only) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-[hsl(var(--sidebar-background))] border-t border-[hsl(var(--sidebar-border))] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 select-none min-h-[56px] ${
                  active ? 'text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground))]/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
