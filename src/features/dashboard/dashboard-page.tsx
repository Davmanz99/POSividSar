import { useMemo, useState } from 'react';
import { useStore } from '@/store/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, TrendingUp, Users, Clock, PieChart, Building2, CheckCircle, AlertTriangle } from 'lucide-react';

export function DashboardPage() {
    const { sales, products, users, currentUser, locales } = useStore();

    // Filter data based on user role
    const filteredSales = useMemo(() => {
        if (currentUser?.role === 'SUPER_ADMIN') return []; // Super Admin sees NO sales data here
        if (currentUser?.role === 'ADMIN') {
            return sales.filter(s => s.localId === currentUser.localId);
        }
        // Seller sees only their sales
        return sales.filter(s => s.sellerId === currentUser?.id);
    }, [sales, currentUser]);

    // Date Filtering State
    const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('TODAY');
    const [customDays, setCustomDays] = useState<string>('7');

    // Filter sales by date
    const dateFilteredSales = useMemo(() => {
        const now = new Date();
        let startDate = new Date();

        if (dateFilter === 'TODAY') {
            startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'WEEK') {
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'MONTH') {
            startDate.setMonth(now.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'CUSTOM') {
            const days = parseInt(customDays) || 0;
            startDate.setDate(now.getDate() - days);
            startDate.setHours(0, 0, 0, 0);
        }

        return filteredSales.filter(sale => new Date(sale.date) >= startDate);
    }, [filteredSales, dateFilter, customDays]);

    // 1. General Stats & Profit Analysis
    const stats = useMemo(() => {
        let totalRevenue = 0;
        let totalCost = 0;

        dateFilteredSales.forEach(sale => {
            // Use finalTotal if available (after discount), otherwise total
            totalRevenue += (sale.finalTotal !== undefined ? sale.finalTotal : sale.total);

            // Calculate cost for this sale
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.id);
                const unitCost = item.costPrice || product?.costPrice || 0;
                totalCost += unitCost * item.quantity;
            });
        });

        const totalOrders = dateFilteredSales.length;
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            revenue: totalRevenue,
            cost: totalCost,
            profit: totalProfit,
            margin: profitMargin,
            orders: totalOrders,
            avgTicket: averageTicket
        };
    }, [dateFilteredSales, products]);

    // Super Admin Stats
    const superAdminStats = useMemo(() => {
        if (currentUser?.role !== 'SUPER_ADMIN') return null;

        return {
            totalLocales: locales.length,
            activeLocales: locales.filter(l => l.isActive).length,
            pendingPayments: locales.filter(l => l.subscriptionStatus === 'PAST_DUE').length,
            totalRevenue: 0 // Placeholder or maybe platform revenue?
        };
    }, [locales, currentUser]);

    // 2. Sales by Seller (For Admin)
    const salesBySeller = useMemo(() => {
        const sellerStats: Record<string, { name: string; total: number; orders: number }> = {};

        dateFilteredSales.forEach(sale => {
            const seller = users.find(u => u.id === sale.sellerId);
            const sellerName = seller ? seller.name : 'Desconocido';

            if (!sellerStats[sale.sellerId]) {
                sellerStats[sale.sellerId] = { name: sellerName, total: 0, orders: 0 };
            }

            sellerStats[sale.sellerId].total += (sale.finalTotal !== undefined ? sale.finalTotal : sale.total);
            sellerStats[sale.sellerId].orders += 1;
        });

        return Object.values(sellerStats).sort((a, b) => b.total - a.total);
    }, [dateFilteredSales, users]);

    // 3. Product Performance (Top & Bottom)
    const { topProducts, leastSoldProducts } = useMemo(() => {
        const stats: Record<string, { name: string; quantity: number; revenue: number }> = {};

        // 1. Initialize all local products with 0 to catch items with NO sales
        const myProducts = products.filter(p => {
            if (currentUser?.role === 'SUPER_ADMIN') return false;
            // Filter by local for Admin/Seller
            return p.localId === currentUser?.localId;
        });

        myProducts.forEach(p => {
            stats[p.id] = { name: p.name, quantity: 0, revenue: 0 };
        });

        // 2. Add sales data
        dateFilteredSales.forEach(sale => {
            sale.items.forEach(item => {
                if (!stats[item.id]) {
                    // Item sold but not in current product list (maybe deleted or from another local if data mixed?)
                    // We add it to stats to ensure Top Selling is accurate even for deleted items
                    stats[item.id] = { name: item.name, quantity: 0, revenue: 0 };
                }
                stats[item.id].quantity += item.quantity;
                stats[item.id].revenue += item.price * item.quantity;
            });
        });

        const allStats = Object.values(stats);

        // Top Selling: Descending order
        const top = [...allStats]
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // Least Sold: Ascending order (will show 0 sales items first)
        const bottom = [...allStats]
            .sort((a, b) => a.quantity - b.quantity)
            .slice(0, 5);

        return { topProducts: top, leastSoldProducts: bottom };
    }, [dateFilteredSales, products, currentUser]);

    // 4. Peak Hours Analysis
    const peakHours = useMemo(() => {
        const hours: Record<number, number> = {};

        // Initialize all hours
        for (let i = 0; i < 24; i++) hours[i] = 0;

        dateFilteredSales.forEach(sale => {
            const date = new Date(sale.date);
            const hour = date.getHours();
            hours[hour] += (sale.finalTotal !== undefined ? sale.finalTotal : sale.total);
        });

        return Object.entries(hours).map(([hour, total]) => ({
            hour: `${hour}:00`,
            total
        }));
    }, [dateFilteredSales]);

    // 5. Sales Over Time (Daily/Hourly)
    const salesTrends = useMemo(() => {
        const data: Record<string, { name: string; total: number }> = {};

        // Helper to format date key
        const formatDateKey = (dateStr: string) => {
            const date = new Date(dateStr);
            if (dateFilter === 'TODAY') {
                // Group by Hour for Today
                return `${date.getHours()}:00`;
            }
            // Group by Day for others
            return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
        };

        // Initialize keys based on range to ensure empty days/hours show up as 0
        const now = new Date();
        if (dateFilter === 'TODAY') {
            for (let i = 0; i <= now.getHours(); i++) {
                const key = `${i}:00`;
                data[key] = { name: key, total: 0 };
            }
        } else {
            // For Week/Month/Custom, initialize days
            let daysToSubtract = 7;
            if (dateFilter === 'MONTH') daysToSubtract = 30;
            if (dateFilter === 'CUSTOM') daysToSubtract = parseInt(customDays) || 7;

            for (let i = daysToSubtract; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
                data[key] = { name: key, total: 0 };
            }
        }

        // Fill with actual data
        dateFilteredSales.forEach(sale => {
            const key = formatDateKey(sale.date);
            if (data[key]) {
                data[key].total += (sale.finalTotal !== undefined ? sale.finalTotal : sale.total);
            } else if (dateFilter !== 'TODAY') {
                // Handle edge cases where date might be slightly out of initialized range due to time
                // or just add it if it matches the filter
                data[key] = { name: key, total: (sale.finalTotal !== undefined ? sale.finalTotal : sale.total) };
            }
        });

        return Object.values(data);
    }, [dateFilteredSales, dateFilter, customDays]);

    if (!currentUser) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground font-display">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {currentUser.role === 'SUPER_ADMIN'
                            ? 'Bienvenido, Super Admin. Gestión Global de Locales.'
                            : `Bienvenido, ${currentUser.name}. Resumen de tu negocio.`}
                    </p>
                </div>

                {currentUser.role !== 'SUPER_ADMIN' && (
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap items-center gap-2 bg-card border border-border p-1 rounded-lg">
                            <Button
                                variant={dateFilter === 'TODAY' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setDateFilter('TODAY')}
                                className="text-xs"
                            >
                                Hoy
                            </Button>
                            <Button
                                variant={dateFilter === 'WEEK' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setDateFilter('WEEK')}
                                className="text-xs"
                            >
                                7 Días
                            </Button>
                            <Button
                                variant={dateFilter === 'MONTH' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setDateFilter('MONTH')}
                                className="text-xs"
                            >
                                Mes
                            </Button>
                            <div className="flex items-center gap-2 pl-2 border-l border-border">
                                <span className="text-xs text-muted-foreground hidden sm:inline">Personalizado:</span>
                                <Input
                                    type="number"
                                    value={customDays}
                                    onChange={(e) => {
                                        setCustomDays(e.target.value);
                                        setDateFilter('CUSTOM');
                                    }}
                                    className="w-16 h-8 text-xs"
                                    placeholder="Días"
                                />
                                <span className="text-xs text-muted-foreground">días</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Mostrando datos desde: <span className="font-medium text-foreground">
                                {(() => {
                                    const now = new Date();
                                    let d = new Date();
                                    if (dateFilter === 'TODAY') d.setHours(0, 0, 0, 0);
                                    else if (dateFilter === 'WEEK') d.setDate(now.getDate() - 7);
                                    else if (dateFilter === 'MONTH') d.setMonth(now.getMonth() - 1);
                                    else if (dateFilter === 'CUSTOM') d.setDate(now.getDate() - (parseInt(customDays) || 0));
                                    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
                                })()}
                            </span>
                        </p>
                    </div>
                )}
            </div>

            {/* SUPER ADMIN DASHBOARD */}
            {currentUser.role === 'SUPER_ADMIN' && superAdminStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="glass-panel border-l-4 border-l-blue-500 border-border bg-card">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Locales</p>
                                    <h3 className="text-4xl font-bold text-foreground mt-2">
                                        {superAdminStats.totalLocales}
                                    </h3>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                    <Building2 size={32} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel border-l-4 border-l-emerald-500 border-border bg-card">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Locales Activos</p>
                                    <h3 className="text-4xl font-bold text-foreground mt-2">
                                        {superAdminStats.activeLocales}
                                    </h3>
                                </div>
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                    <CheckCircle size={32} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel border-l-4 border-l-amber-500 border-border bg-card">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Pagos Pendientes</p>
                                    <h3 className="text-4xl font-bold text-foreground mt-2">
                                        {superAdminStats.pendingPayments}
                                    </h3>
                                </div>
                                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                                    <AlertTriangle size={32} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* REGULAR ADMIN/SELLER DASHBOARD */}
            {currentUser.role !== 'SUPER_ADMIN' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="glass-panel border-l-4 border-l-cyan-500 border-border bg-card">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Ventas Totales</p>
                                    <h3 className="text-2xl font-bold text-foreground mt-2">
                                        ${stats.revenue.toLocaleString()}
                                    </h3>
                                </div>
                                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {currentUser.role === 'ADMIN' && (
                        <Card className="glass-panel border-l-4 border-l-purple-500 border-border bg-card">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Utilidad Neta</p>
                                        <h3 className="text-2xl font-bold text-foreground mt-2">
                                            ${stats.profit.toLocaleString()}
                                        </h3>
                                        <p className="text-xs text-emerald-500 mt-1">
                                            {stats.margin.toFixed(1)}% Margen
                                        </p>
                                    </div>
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                        <PieChart size={24} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="glass-panel border-l-4 border-l-green-500 border-border bg-card">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Ticket Promedio</p>
                                    <h3 className="text-2xl font-bold text-foreground mt-2">
                                        ${Math.round(stats.avgTicket).toLocaleString()}
                                    </h3>
                                </div>
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel border-l-4 border-l-amber-500 border-border bg-card">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
                                    <h3 className="text-2xl font-bold text-foreground mt-2">
                                        {stats.orders}
                                    </h3>
                                </div>
                                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                    <ShoppingBag size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Admin Specific Analytics (NOT Super Admin) */}
            {(currentUser.role === 'ADMIN') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Sales Over Time Chart (Replaces Financial Overview) */}
                    <Card className="glass-panel col-span-1 lg:col-span-2 border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <DollarSign className="text-emerald-500" size={20} />
                                Ventas en el Tiempo ({dateFilter === 'TODAY' ? 'Por Hora' : 'Por Día'})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                        <Bar dataKey="total" fill="#0891b2" radius={[4, 4, 0, 0]} name="Ventas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Peak Hours Chart */}
                    <Card className="glass-panel border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <Clock className="text-primary" size={20} />
                                Horarios de Mayor Venta
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={peakHours}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                        <XAxis dataKey="hour" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#0891b2" fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="glass-panel border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <ShoppingBag className="text-purple-500" size={20} />
                                Productos Más Vendidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" horizontal={false} />
                                        <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" width={100} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                        <Bar dataKey="quantity" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Least Sold Products */}
                    <Card className="glass-panel border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <AlertTriangle className="text-amber-500" size={20} />
                                Productos Menos Vendidos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={leastSoldProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" horizontal={false} />
                                        <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" width={100} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                        <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sales by Seller */}
                    <Card className="glass-panel col-span-1 lg:col-span-2 border-border bg-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground">
                                <Users className="text-green-500" size={20} />
                                Ventas por Vendedor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesBySeller}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(128,128,128,0.1)' }}
                                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            )}
        </motion.div>
    );
}
