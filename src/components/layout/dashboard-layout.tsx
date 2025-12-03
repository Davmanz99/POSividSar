import { useState } from 'react';
import { useStore } from '@/store/store';
import { useNavigate, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Store, Users, ShoppingCart, Package, Menu, X, Zap, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationsPopover } from '@/components/ui/notifications-popover';

export const DashboardLayout = () => {
    const { currentUser, logout } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    const NavItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
        const isActive = location.pathname === path;
        return (
            <div
                onClick={() => {
                    navigate(path);
                    setIsMobileMenuOpen(false);
                }}
                className={`
          group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 relative overflow-hidden
          ${isActive
                        ? 'text-primary bg-primary/10 border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'}
        `}
            >
                <Icon size={20} className={`z-10 transition-colors ${isActive ? 'text-primary drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : ''}`} />
                <span className="font-medium text-sm z-10 tracking-wide">{label}</span>
                {isActive && (
                    <motion.div
                        layoutId="active-glow"
                        className="absolute inset-0 bg-primary/5 z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </div>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <Zap size={20} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight font-display">NEXUS<span className="text-primary">POS</span></h2>
                    <p className="text-[10px] text-primary/70 uppercase tracking-[0.2em]">System v2.0</p>
                </div>
            </div>

            <div className="flex-1 space-y-1">
                <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Navegación</p>

                <NavItem icon={LayoutDashboard} label="Dashboard" path="/" />

                {currentUser.role === 'SUPER_ADMIN' && (
                    <NavItem icon={Store} label="Locales" path="/locales" />
                )}

                {currentUser.role === 'ADMIN' && (
                    <>
                        <NavItem icon={Users} label="Vendedores" path="/users" />
                        <NavItem icon={Package} label="Inventario" path="/inventory" />
                        <NavItem icon={ShoppingCart} label="Terminal POS" path="/pos" />
                        <NavItem icon={Store} label="Historial Ventas" path="/history" />
                    </>
                )}

                {currentUser.role === 'SELLER' && (
                    <>
                        <NavItem icon={ShoppingCart} label="Terminal POS" path="/pos" />
                        <NavItem icon={Store} label="Historial Ventas" path="/history" />
                    </>
                )}
            </div>

            <div className="pt-6 border-t border-border mt-auto">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border mb-4 backdrop-blur-sm">
                    <div className="w-9 h-9 rounded bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center font-bold text-white border border-white/10">
                        {currentUser.name.charAt(0)}
                    </div>
                    <div
                        className="overflow-hidden flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/profile')}
                    >
                        <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-primary truncate uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <LogOut size={16} />
                    Desconectar
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 p-4 flex-col">
                <div className="glass-panel p-6 flex flex-col h-full border-border bg-card/50">
                    <SidebarContent />
                </div>
            </aside>

            {/* Mobile Header & Menu */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Zap size={20} className="text-primary" />
                    <span className="font-bold text-lg tracking-tight text-foreground">NEXUS<span className="text-primary">POS</span></span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-foreground">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl p-6 md:hidden"
                    >
                        <div className="flex justify-end mb-8">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-muted-foreground hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>
                        <SidebarContent />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative pt-16 md:pt-0">
                {/* Desktop Header */}
                <header className="hidden md:flex h-20 px-8 items-center justify-between z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display">
                            {location.pathname === '/' ? 'Dashboard' :
                                location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2)}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            <p className="text-xs text-primary/70 font-mono">
                                SISTEMA ONLINE
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Global Search Bar */}
                        <div className="relative w-64 hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input placeholder="Búsqueda Global (Ctrl+K)..." className="pl-9 h-10 bg-card border-border focus:bg-background" />
                        </div>

                        <ThemeToggle />


                        <NotificationsPopover />
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
