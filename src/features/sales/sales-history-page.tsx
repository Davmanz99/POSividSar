import { useState } from 'react';
import { useStore } from '@/store/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, User, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { printReceipt } from '@/utils/receipt-printer';
import { Button } from '@/components/ui/button';

export function SalesHistoryPage() {
    const { sales, users, currentUser, locales } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter sales based on role and search
    const filteredSales = sales.filter(sale => {
        // Role Filter
        if (currentUser?.role === 'ADMIN') {
            if (sale.localId !== currentUser.localId) return false;
        }
        if (currentUser?.role === 'SELLER') {
            if (sale.sellerId !== currentUser.id) return false;
        }

        // Search Filter (by ID, Seller Name, or Date)
        const seller = users.find(u => u.id === sale.sellerId);
        const sellerName = seller?.name.toLowerCase() || '';
        const dateStr = format(new Date(sale.date), 'dd/MM/yyyy', { locale: es });
        const term = searchTerm.toLowerCase();

        return (
            sale.id.toLowerCase().includes(term) ||
            sellerName.includes(term) ||
            dateStr.includes(term)
        );
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground font-display">Historial de Ventas</h1>
                <p className="text-muted-foreground">Registro completo de transacciones.</p>
            </div>

            <Card className="glass-panel border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-foreground">Transacciones</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Buscar por ID, vendedor o fecha..."
                            className="pl-9 bg-background border-border"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left text-muted-foreground">
                            <thead className="text-xs uppercase bg-muted/50 text-foreground">
                                <tr>
                                    <th className="px-6 py-3 rounded-tl-lg">Fecha</th>
                                    <th className="px-6 py-3">Vendedor</th>
                                    <th className="px-6 py-3">Items</th>
                                    <th className="px-6 py-3">Método</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 rounded-tr-lg text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            No se encontraron ventas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => {
                                        const seller = users.find(u => u.id === sale.sellerId);
                                        return (
                                            <tr
                                                key={sale.id}
                                                className="border-b border-border hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-foreground">
                                                        <Calendar size={14} className="text-primary" />
                                                        {format(new Date(sale.date), 'dd MMM yyyy HH:mm', { locale: es })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} />
                                                        {seller?.name || 'Desconocido'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {sale.items.slice(0, 2).map((item, idx) => (
                                                            <span key={idx} className="text-xs flex items-center gap-1">
                                                                <span className="text-foreground font-bold">{item.quantity}x</span> {item.name}
                                                            </span>
                                                        ))}
                                                        {sale.items.length > 2 && (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                +{sale.items.length - 2} más...
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="border-border bg-muted/30 text-foreground">
                                                        {sale.paymentMethod === 'CASH' ? 'Efectivo' :
                                                            sale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-foreground text-lg">
                                                    ${sale.total.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const local = locales.find(l => l.id === sale.localId);
                                                            printReceipt({ sale, local, seller });
                                                        }}
                                                        title="Imprimir Boleta"
                                                    >
                                                        <Printer size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
