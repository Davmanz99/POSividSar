import { useState } from 'react';
import { useStore } from '@/store/store';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, ScanBarcode, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type CartItem, type Product, type Sale } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { PaymentModal } from '@/components/ui/payment-modal';
import { printReceipt } from '@/utils/receipt-printer';
import { CheckCircle, Printer } from 'lucide-react';

export function POSPage() {
    const { products, addSale, currentUser, locales } = useStore();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Success Modal State
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);

    // Filter products
    // Filter products
    const filteredProducts = products.filter(p => {
        // 1. Filter by Local (Strict Isolation)
        if (currentUser?.role !== 'SUPER_ADMIN' && p.localId !== currentUser?.localId) {
            return false;
        }

        // 2. Filter by Search Term
        return (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.includes(searchTerm) ||
            (p.barcode && p.barcode.includes(searchTerm))
        );
    });

    // Add to Cart Logic
    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) return prev; // Prevent overselling
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    // Barcode Scanner Hook
    useBarcodeScanner((barcode) => {
        const product = products.find(p => p.sku === barcode || p.barcode === barcode);
        if (product) {
            addToCart(product);
            setSearchTerm(''); // Clear search term to prevent barcode buildup
            // Optional: Play beep sound
        } else {
            alert(`Producto no encontrado: ${barcode}`);
        }
    });

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty > item.stock) return item; // Stock limit
                if (newQty < 1) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckoutClick = () => {
        if (cart.length === 0 || !currentUser) return;
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = (amountTendered?: number) => {
        if (!currentUser) return;

        const sale = {
            id: uuidv4(),
            localId: currentUser.localId || 'main',
            sellerId: currentUser.id,
            items: cart,
            total,
            date: new Date().toISOString(),
            paymentMethod,
            amountTendered // Optional: store this if needed in the future
        };

        addSale(sale);
        setCart([]);
        setSearchTerm(''); // Reset search after sale
        setIsPaymentModalOpen(false);

        // Open Success Modal
        setLastSale(sale);
        setIsSuccessModalOpen(true);
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
            {/* Product Grid Section */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Buscar productos o escanear..."
                            className="pl-10 h-12 text-lg"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-card border border-border text-muted-foreground text-sm">
                        <ScanBarcode size={18} className="text-primary animate-pulse" />
                        <span>Escáner Listo</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-2">
                    {filteredProducts.map(product => (
                        <motion.div
                            key={product.id}
                            layoutId={product.id}
                            onClick={() => addToCart(product)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                cursor-pointer group relative overflow-hidden rounded-xl border p-4 transition-all
                ${product.stock > 0
                                    ? 'bg-card border-border hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                                    : 'bg-destructive/5 border-destructive/20 opacity-60 cursor-not-allowed'}
              `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="bg-muted/40 text-[10px]">{product.category}</Badge>
                                <span className={`text-xs font-bold ${product.stock <= product.minStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {product.stock} left
                                </span>
                            </div>
                            <h3 className="font-bold text-foreground mb-1 truncate">{product.name}</h3>
                            <p className="text-lg text-primary font-mono">${product.price.toFixed(2)}</p>

                            {/* Tech overlay effect */}
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Cart Section */}
            <Card className="w-full lg:w-[400px] flex flex-col glass-panel border-border h-full">
                <div className="p-4 border-b border-border bg-card/50">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <ShoppingCart className="text-primary" />
                        Venta Actual
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <AnimatePresence>
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <ScanBarcode size={48} className="mb-4" />
                                <p>Escanea items o selecciona</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                                >
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
                                        <p className="text-xs text-primary font-mono">${item.price.toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center text-sm font-mono text-foreground">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-card/50 border-t border-border space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-foreground">
                            <span>Total</span>
                            <span className="text-primary font-mono">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod('CASH')}
                            className="text-xs"
                        >
                            <Banknote size={14} className="mr-1" /> Efectivo
                        </Button>
                        <Button
                            variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod('CARD')}
                            className="text-xs"
                        >
                            <CreditCard size={14} className="mr-1" /> Tarjeta
                        </Button>
                        <Button
                            variant={paymentMethod === 'TRANSFER' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod('TRANSFER')}
                            className="text-xs"
                        >
                            <ArrowRight size={14} className="mr-1" /> Transf.
                        </Button>
                    </div>

                    <Button
                        variant="neon"
                        className="w-full h-12 text-lg font-bold tracking-wider"
                        disabled={cart.length === 0}
                        onClick={handleCheckoutClick}
                    >
                        COMPLETAR VENTA
                    </Button>
                </div>
            </Card>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={handleConfirmPayment}
                totalAmount={total}
                paymentMethod={paymentMethod}
            />

            {/* Success Modal */}
            <AnimatePresence>
                {lastSale && isSuccessModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border p-6 rounded-xl shadow-2xl w-full max-w-md text-center"
                        >
                            <div className="mb-4 flex justify-center">
                                <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-500">
                                    <CheckCircle size={48} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">¡Venta Exitosa!</h2>
                            <p className="text-muted-foreground mb-6">La transacción se ha registrado correctamente.</p>

                            <div className="bg-muted/30 p-4 rounded-lg mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Total Pagado:</span>
                                    <span className="font-bold text-foreground">${lastSale.total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Método:</span>
                                    <span className="font-bold text-foreground">
                                        {lastSale.paymentMethod === 'CASH' ? 'Efectivo' :
                                            lastSale.paymentMethod === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={() => {
                                        const local = locales.find(l => l.id === lastSale.localId);
                                        printReceipt({ sale: lastSale, local, seller: currentUser || undefined });
                                    }}
                                >
                                    <Printer size={18} />
                                    Imprimir Boleta
                                </Button>
                                <Button
                                    variant="neon"
                                    className="flex-1 gap-2"
                                    onClick={() => {
                                        setIsSuccessModalOpen(false);
                                        setLastSale(null);
                                    }}
                                >
                                    <Plus size={18} />
                                    Nueva Venta
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
