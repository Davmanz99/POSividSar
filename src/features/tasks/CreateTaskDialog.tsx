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
import { User } from "@/types"

const taskSchema = z.object({
    title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    dueDate: z.string().min(1, "La fecha es requerida"),
    assignedToId: z.string().min(1, "Debes asignar un vendedor"),
    isRecurring: z.boolean().optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>

interface CreateTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => void;
    sellers: User[];
    isLoading?: boolean;
}

export function CreateTaskDialog({
    isOpen,
    onClose,
    onSubmit,
    sellers,
    isLoading = false,
}: CreateTaskDialogProps) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            dueDate: '',
            assignedToId: '',
            isRecurring: false
        }
    })

    useEffect(() => {
        if (isOpen) {
            reset({
                title: '',
                description: '',
                dueDate: '',
                assignedToId: '',
                isRecurring: false
            })
        }
    }, [isOpen, reset])

    const handleFormSubmit = (data: TaskFormData) => {
        onSubmit(data);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                <DialogHeader>
                    <DialogTitle>Asignar Nueva Tarea</DialogTitle>
                    <DialogDescription>
                        Crea una tarea para un vendedor.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input {...register("title")} placeholder="Ej: Prender luces" />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción (Opcional)</label>
                        <Input {...register("description")} placeholder="Detalles adicionales..." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hora/Fecha Límite</label>
                        <Input type="datetime-local" {...register("dueDate")} />
                        {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Asignar a</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("assignedToId")}
                        >
                            <option value="">Seleccionar Vendedor...</option>
                            {sellers.map(seller => (
                                <option key={seller.id} value={seller.id}>{seller.name}</option>
                            ))}
                        </select>
                        {errors.assignedToId && <p className="text-xs text-destructive">{errors.assignedToId.message}</p>}
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isRecurring"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            {...register("isRecurring")}
                        />
                        <label htmlFor="isRecurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Repetir diariamente (Tarea recurrente)
                        </label>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                        <Button type="submit" variant="neon" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Asignar Tarea'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
