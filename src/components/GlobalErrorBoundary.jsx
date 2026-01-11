import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        // Limpiar caché y recargar
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/dashboard';
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-4 bg-red-500/10 rounded-full mb-6 animate-pulse">
                        <AlertTriangle size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Algo salió mal</h1>
                    <p className="text-slate-400 mb-8 max-w-md">
                        Ocurrió un error inesperado en la sección: <span className="text-indigo-400 font-bold">{window.location.pathname}</span>
                    </p>

                    <div className="bg-slate-900 p-4 rounded-xl border border-white/5 mb-8 text-left w-full max-w-lg overflow-auto max-h-48">
                        <code className="text-xs text-red-300 font-mono">
                            {this.state.error && this.state.error.toString()}
                        </code>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={this.handleReset}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all w-full shadow-lg shadow-indigo-500/20"
                        >
                            <RefreshCw size={20} /> Reiniciar Aplicación
                        </button>

                        <button
                            onClick={() => window.location.href = '/onboarding'}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-4 rounded-2xl font-bold transition-colors w-full"
                        >
                            Volver al Onboarding
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
