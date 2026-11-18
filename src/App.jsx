import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Productos from '@/pages/Productos';
import Menus from '@/pages/Menus';
import Eventos from '@/pages/Eventos';
import CalculoCompra from '@/pages/CalculoCompra';
import PreciosVenta from '@/pages/PreciosVenta';
import Ajustes from '@/pages/Ajustes';
import { base44 } from '@/api/base44Client';
import { Toaster as HotToaster } from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleEmergencyDownload = () => {
    try {
      const data = base44.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catering_juliana_respaldo_emergencia_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar respaldo de emergencia:', err);
      alert('No se pudo generar la descarga automática. Sus datos locales en el dispositivo siguen preservados.');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-bold font-heading text-foreground">La Juliana Catering</h2>
            <p className="text-muted-foreground text-sm">
              Ocurrió un problema inesperado al mostrar la pantalla. Podés recargar la aplicación o descargar una copia de seguridad de tus datos para mayor tranquilidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm shadow-sm hover:opacity-90 transition-opacity"
              >
                Recargar Aplicación
              </button>
              <button
                type="button"
                onClick={this.handleEmergencyDownload}
                className="px-4 py-2 bg-muted text-foreground border border-border rounded-lg font-medium text-sm shadow-sm hover:bg-muted/80 transition-colors"
              >
                Descargar Respaldo de Emergencia
              </button>
            </div>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground/60 font-mono mt-4 text-left p-2 rounded bg-muted/30 overflow-auto max-h-24">
                Detalle técnico: {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/menus" element={<Menus />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/calculo" element={<CalculoCompra />} />
        <Route path="/precios-venta" element={<PreciosVenta />} />
        <Route path="/ajustes" element={<Ajustes />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <HotToaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } }} />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
