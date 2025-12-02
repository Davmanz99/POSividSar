import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Banknote, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amountTendered?: number) => void;
    totalAmount: number;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
}

export function PaymentModal({
    isOpen,
    onClose,
    onConfirm,
    totalAmount,
    paymentMethod
}: PaymentModalProps) {
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [change, setChange] = useState<number>(0);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAmountTendered('');
            setChange(0);
        }
    }, [isOpen]);

    // Calculate change
    useEffect(() => {
        const tendered = parseFloat(amountTendered);
        if (!isNaN(tendered) && tendered >= totalAmount) {
            setChange(tendered - totalAmount);
        } else {
            setChange(0);
        }
    }, [amountTendered, totalAmount]);

    const handleConfirm = () => {
        if (paymentMethod === 'CASH') {
            const tendered = parseFloat(amountTendered);
            if (isNaN(tendered) || tendered < totalAmount) return;
            onConfirm(tendered);
        } else {
            onConfirm();
        }
    };

    const isConfirmDisabled = () => {
        if (paymentMethod === 'CASH') {
            const tendered = parseFloat(amountTendered);
            return isNaN(tendered) || tendered < totalAmount;
        }
        return false;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        {paymentMethod === 'CASH' && <Banknote className="text-emerald-500" />}
                        {paymentMethod === 'CARD' && <CreditCard className="text-blue-500" />}
                        {paymentMethod === 'TRANSFER' && <ArrowRight className="text-purple-500" />}
                        Confirmar Pago
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {paymentMethod === 'CASH'
                            ? 'Ingrese el monto recibido para calcular el vuelto.'
                            : 'Confirme que la transacción ha sido procesada.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Total Display */}
                    <div className="text-center space-y-1">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider">Total a Pagar</p>
                        <div className="text-4xl font-bold text-foreground font-mono">
                            ${totalAmount.toLocaleString()}
                        </div>
                    </div>

                    {/* Cash Payment Logic */}
                    {paymentMethod === 'CASH' && (
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Monto Recibido ($)</label>
                                <Input
                                    type="number"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                    className="text-xl font-mono h-12 bg-background border-border text-foreground"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>

                            <div className="pt-2 border-t border-border">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-muted-foreground">Vuelto / Cambio</span>
                                    <span className={`text-2xl font-bold font-mono ${change > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                        ${change.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other Methods Logic */}
                    {paymentMethod !== 'CASH' && (
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg border border-border text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <CheckCircle2 className="text-primary" size={24} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Asegúrese de que el pago haya sido aprobado en el terminal o cuenta bancaria antes de confirmar.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="neon"
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled()}
                        className="w-full sm:w-auto"
                    >
                        Confirmar Venta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
