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
import { Banknote, CreditCard, ArrowRight, CheckCircle2, Percent, DollarSign } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amountTendered?: number, discount?: { value: number, type: 'FIXED' | 'PERCENTAGE' }) => void;
    totalAmount: number;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
    isLoading?: boolean;
}

export function PaymentModal({
    isOpen,
    onClose,
    onConfirm,
    totalAmount,
    paymentMethod,
    isLoading = false
}: PaymentModalProps) {
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [change, setChange] = useState<number>(0);

    // Discount State
    const [discountValue, setDiscountValue] = useState<string>('');
    const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
    const [finalTotal, setFinalTotal] = useState<number>(totalAmount);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            console.log("PaymentModal Open - Discount Version Active");
            setAmountTendered('');
            setChange(0);
            setDiscountValue('');
            setDiscountType('FIXED');
            setFinalTotal(totalAmount);
        }
    }, [isOpen, totalAmount]);

    // Calculate Final Total based on Discount
    useEffect(() => {
        const discount = parseFloat(discountValue) || 0;
        let calculatedTotal = totalAmount;

        if (discount > 0) {
            if (discountType === 'FIXED') {
                calculatedTotal = Math.max(0, totalAmount - discount);
            } else {
                calculatedTotal = Math.max(0, totalAmount - (totalAmount * (discount / 100)));
            }
        }
        setFinalTotal(calculatedTotal);
    }, [discountValue, discountType, totalAmount]);

    // Calculate change based on Final Total
    useEffect(() => {
        const tendered = parseFloat(amountTendered);
        if (!isNaN(tendered) && tendered >= finalTotal) {
            setChange(tendered - finalTotal);
        } else {
            setChange(0);
        }
    }, [amountTendered, finalTotal]);

    const handleConfirm = () => {
        const discount = parseFloat(discountValue) || 0;
        const discountData = discount > 0 ? { value: discount, type: discountType } : undefined;

        if (paymentMethod === 'CASH') {
            const tendered = parseFloat(amountTendered);
            if (isNaN(tendered) || tendered < finalTotal) return;
            onConfirm(tendered, discountData);
        } else {
            onConfirm(undefined, discountData);
        }
    };

    const isConfirmDisabled = () => {
        if (paymentMethod === 'CASH') {
            const tendered = parseFloat(amountTendered);
            return isNaN(tendered) || tendered < finalTotal;
        }
        return false;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border max-h-[90vh] overflow-y-auto">
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

                <div className="py-4 space-y-6">
                    {/* Discount Section */}
                    <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Percent size={14} /> Aplicar Descuento (Opcional)
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="bg-background"
                                />
                            </div>
                            <div className="flex bg-muted rounded-md p-1 gap-1">
                                <Button
                                    type="button"
                                    variant={discountType === 'FIXED' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setDiscountType('FIXED')}
                                    className="h-8 px-2"
                                >
                                    <DollarSign size={14} />
                                </Button>
                                <Button
                                    type="button"
                                    variant={discountType === 'PERCENTAGE' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setDiscountType('PERCENTAGE')}
                                    className="h-8 px-2"
                                >
                                    <Percent size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Total Display */}
                    <div className="text-center space-y-1">
                        <p className="text-sm text-muted-foreground uppercase tracking-wider">Total a Pagar</p>
                        <div className="flex flex-col items-center">
                            {finalTotal !== totalAmount && (
                                <span className="text-lg text-muted-foreground line-through decoration-destructive">
                                    ${totalAmount.toLocaleString()}
                                </span>
                            )}
                            <div className="text-4xl font-bold text-foreground font-mono">
                                ${finalTotal.toLocaleString()}
                            </div>
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
                        disabled={isConfirmDisabled() || isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? 'Procesando...' : 'Confirmar Venta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
