import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { type Product, type Role, type Local } from "@/types"

const productSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
    category: z.string().min(2, "La categoría es requerida"),
    measurementUnit: z.enum(['UNIT', 'KG', 'GRAM', 'LITER']).default('UNIT'),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
    costPrice: z.coerce.number().min(0, "El costo no puede ser negativo").optional(),
    stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
    minStock: z.coerce.number().min(0, "El stock mínimo no puede ser negativo"),
    localId: z.string().min(1, "Debes asignar un local"),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ProductFormData) => void;
    initialData?: Product | null;
    title: string;
    isLoading?: boolean;
    locales: Local[];
    currentUserRole: Role;
    defaultLocalId?: string;
}

export function ProductFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title,
    isLoading = false,
    locales,
    currentUserRole,
    defaultLocalId
}: ProductFormModalProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            sku: '',
            category: '',
            measurementUnit: 'UNIT',
            price: '' as any,
            costPrice: '' as any,
            stock: 0,
            minStock: 5,
            localId: ''
        }
    })

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    sku: initialData.sku,
                    category: initialData.category,
                    measurementUnit: initialData.measurementUnit || 'UNIT',
                    price: initialData.price,
                    costPrice: initialData.costPrice || 0,
                    stock: initialData.stock,
                    minStock: initialData.minStock,
                    localId: initialData.localId
                })
            } else {
                reset({
                    name: '',
                    sku: '',
                    category: '',
                    measurementUnit: 'UNIT',
                    price: '' as any,
                    costPrice: '' as any,
                    stock: 0,
                    minStock: 5,
                    localId: defaultLocalId || ''
                })
            }
        }
    }, [isOpen, initialData, reset, defaultLocalId])

    const handleFormSubmit = (data: ProductFormData) => {
        onSubmit(data);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Formulario de producto
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre del Producto</label>
                        <Input {...register("name")} placeholder="Ej: Coca Cola 3L" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">SKU / Código</label>
                            <Input {...register("sku")} placeholder="COD-123" />
                            {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Categoría</label>
                            <Input {...register("category")} placeholder="Bebidas" />
                            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Unidad de Medida</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("measurementUnit")}
                        >
                            <option value="UNIT">Unidad (c/u)</option>
                            <option value="KG">Kilogramos (kg)</option>
                            <option value="GRAM">Gramos (g)</option>
                            <option value="LITER">Litros (L)</option>
                        </select>
                        {errors.measurementUnit && <p className="text-xs text-destructive">{errors.measurementUnit.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Precio Venta ($)</label>
                            <Input
                                {...register("price")}
                                type="number"
                                step="0.01"
                                onFocus={(e) => e.target.select()}
                            />
                            {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Precio Costo ($)</label>
                            <Input
                                {...register("costPrice")}
                                type="number"
                                step="0.01"
                                onFocus={(e) => e.target.select()}
                            />
                            {errors.costPrice && <p className="text-xs text-destructive">{errors.costPrice.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Stock</label>
                            <Input {...register("stock")} type="number" />
                            {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Min. Stock</label>
                            <Input {...register("minStock")} type="number" />
                            {errors.minStock && <p className="text-xs text-destructive">{errors.minStock.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Asignar a Local</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("localId")}
                            disabled={currentUserRole === 'ADMIN' || currentUserRole === 'SELLER'}
                        >
                            <option value="">Seleccionar Local...</option>
                            {locales.map(local => (
                                <option key={local.id} value={local.id}>{local.name}</option>
                            ))}
                        </select>
                        {errors.localId && <p className="text-xs text-destructive">{errors.localId.message}</p>}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" variant="neon" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
