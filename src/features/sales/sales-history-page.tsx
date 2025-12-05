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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

export function SalesHistoryPage() {
    const { sales, users, currentUser, locales, cancelSale, approveCancellation, rejectCancellation } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCancelClick = (saleId: string) => {
        setSelectedSaleId(saleId);
        setCancellationReason('');
        setCancelDialogOpen(true);
    };

    const handleConfirmCancellation = async () => {
        if (!selectedSaleId || !currentUser) return;
        if (!cancellationReason.trim()) {
            alert("Debe ingresar un motivo.");
            return;
        }

        setIsProcessing(true);
        await cancelSale(selectedSaleId, cancellationReason, currentUser.id, currentUser.role);
        setIsProcessing(false);
        setCancelDialogOpen(false);
    };

    const handleApproveCancellation = async (saleId: string) => {
        if (!currentUser) return;
        if (confirm("¿Aprobar anulación y restaurar stock?")) {
            await approveCancellation(saleId, currentUser.id);
        }
    };

    const handleRejectCancellation = async (saleId: string) => {
        if (confirm("¿Rechazar anulación? La venta volverá a estado completado.")) {
            await rejectCancellation(saleId);
        }
    };

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
                                    <th className="px-6 py-3 text-right">Ganancia</th>
                                    <th className="px-6 py-3 rounded-tr-lg text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                            No se encontraron ventas registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => {
                                        const seller = users.find(u => u.id === sale.sellerId);

                                        // Calculate Profit
                                        const saleRevenue = sale.finalTotal !== undefined ? sale.finalTotal : sale.total;
                                        const saleCost = sale.items.reduce((acc, item) => {
                                            const unitCost = item.costPrice || 0;
                                            return acc + (unitCost * item.quantity);
                                        }, 0);
                                        const profit = saleRevenue - saleCost;
                                        const margin = saleRevenue > 0 ? (profit / saleRevenue) * 100 : 0;

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
                                                    {sale.status === 'CANCELLED' && (
                                                        <Badge variant="destructive" className="mt-1 text-[10px] h-5">ANULADA</Badge>
                                                    )}
                                                    {sale.status === 'CANCELLATION_REQUESTED' && (
                                                        <Badge variant="outline" className="mt-1 text-[10px] h-5 text-yellow-500 border-yellow-500">SOLICITADA</Badge>
                                                    )}
                                                    {sale.cancellationReason && (
                                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] truncate" title={sale.cancellationReason}>
                                                            Motivo: {sale.cancellationReason}
                                                        </p>
                                                    )}
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
                                                    ${saleRevenue.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-emerald-500">
                                                            ${profit.toLocaleString()}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {margin.toFixed(1)}%
                                                        </span>
                                                    </div>
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

                                                    {/* Cancellation Actions */}
                                                    {(sale.status === 'COMPLETED' || !sale.status) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleCancelClick(sale.id)}
                                                            title={currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' ? "Anular Venta" : "Solicitar Anulación"}
                                                        >
                                                            <XCircle size={16} />
                                                        </Button>
                                                    )}

                                                    {/* Admin Approval Actions */}
                                                    {sale.status === 'CANCELLATION_REQUESTED' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                                                onClick={() => handleApproveCancellation(sale.id)}
                                                                title="Aprobar Anulación"
                                                            >
                                                                <CheckCircle2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleRejectCancellation(sale.id)}
                                                                title="Rechazar Solicitud"
                                                            >
                                                                <XCircle size={16} />
                                                            </Button>
                                                        </div>
                                                    )}
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

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle size={20} />
                            {currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' ? 'Anular Venta' : 'Solicitar Anulación'}
                        </DialogTitle>
                        <DialogDescription>
                            {currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN'
                                ? 'Esta acción revertirá el stock y marcará la venta como anulada. Esta acción es irreversible.'
                                : 'Se enviará una solicitud al administrador para anular esta venta.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Motivo de anulación:</label>
                        <Textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Ej: Error en cobro, devolución de producto..."
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isProcessing}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmCancellation} disabled={isProcessing}>
                            {isProcessing ? 'Procesando...' : (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' ? 'Confirmar Anulación' : 'Enviar Solicitud')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
