import { useState } from 'react';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Package, AlertTriangle, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductFormModal } from '@/components/ui/product-form-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { type Product } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function InventoryPage() {
    const { products, addProduct, updateProduct, deleteProduct, locales, currentUser } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Filter products by role and search term
    const filteredProducts = products.filter(p => {
        // Role check
        if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SELLER') {
            if (p.localId !== currentUser.localId) return false;
        }

        // Search check
        return (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.includes(searchTerm)
        );
    });

    const handleCreate = async (data: any) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Sim delay

        const newProduct: Product = {
            id: uuidv4(),
            ...data
        };
        addProduct(newProduct);

        setIsLoading(false);
        setIsFormOpen(false);
    };

    const handleUpdate = async (data: any) => {
        if (editingProduct) {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProduct(editingProduct.id, data);
            setIsLoading(false);
            setIsFormOpen(false);
        }
    };

    const handleDelete = () => {
        if (selectedProduct) {
            deleteProduct(selectedProduct.id);
            setIsConfirmOpen(false);
            setSelectedProduct(null);
        }
    };

    const openConfirm = (product: Product) => {
        setSelectedProduct(product);
        setIsConfirmOpen(true);
    };

    // Stock Health Logic
    const getStockStatus = (stock: number, minStock: number) => {
        if (stock === 0) return { label: 'OUT OF STOCK', variant: 'destructive' as const };
        if (stock <= minStock) return { label: 'LOW STOCK', variant: 'warning' as const };
        return { label: 'IN STOCK', variant: 'success' as const };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground font-display">Gestión de Inventario</h1>
                    <p className="text-muted-foreground">Administra tus productos y niveles de stock.</p>
                </div>
                <Button
                    variant="neon"
                    className="gap-2"
                    onClick={() => {
                        setEditingProduct(null);
                        setIsFormOpen(true);
                    }}
                >
                    <Plus size={18} />
                    Agregar Producto
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/20 text-primary">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Productos</p>
                            <h3 className="text-2xl font-bold text-foreground">{filteredProducts.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-amber-500/5 border-amber-500/20">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-amber-500/20 text-amber-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Alertas Stock Bajo</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {filteredProducts.filter(p => p.stock <= p.minStock).length}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-500">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Valor Total</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                ${filteredProducts.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Product List */}
            <Card className="glass-panel border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-foreground">Productos</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Buscar por nombre o SKU..."
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
                                    <th className="px-6 py-3 rounded-tl-lg">Producto</th>
                                    <th className="px-6 py-3">SKU / Código</th>
                                    <th className="px-6 py-3">Categoría</th>
                                    <th className="px-6 py-3">Precio</th>
                                    <th className="px-6 py-3">Stock</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 rounded-tr-lg text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                            No se encontraron productos.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const status = getStockStatus(product.stock, product.minStock);
                                        return (
                                            <motion.tr
                                                key={product.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="border-b border-border hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">{product.name}</td>
                                                <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="border-border bg-muted/30 text-foreground">
                                                        {product.category}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-foreground">${product.price.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={product.stock <= product.minStock ? "text-amber-500 font-bold" : "text-foreground"}>
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={status.variant}>{status.label}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-primary hover:text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                setEditingProduct(product);
                                                                setIsFormOpen(true);
                                                            }}
                                                        >
                                                            <Edit size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => openConfirm(product)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <ProductFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingProduct ? handleUpdate : handleCreate}
                initialData={editingProduct}
                title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
                isLoading={isLoading}
                locales={locales}
                currentUserRole={currentUser?.role || 'SELLER'}
                defaultLocalId={currentUser?.localId}
            />

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Producto"
                description="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="destructive"
            />
        </div>
    );
}
