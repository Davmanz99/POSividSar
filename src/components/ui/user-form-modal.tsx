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
import { type User, type Role, type Local } from "@/types"

const userSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    email: z.string().email("Correo inválido"),
    password: z.union([z.string().min(6, "La contraseña debe tener al menos 6 caracteres"), z.literal('')]).optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SELLER']),
    localId: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => void;
    initialData?: User | null;
    title: string;
    isLoading?: boolean;
    locales: Local[];
    currentUserRole: Role;
    defaultLocalId?: string;
}

export function UserFormModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title,
    isLoading = false,
    locales,
    currentUserRole,
    defaultLocalId
}: UserFormModalProps) {
    const isEditing = !!initialData;

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            username: '',
            email: '',
            password: '',
            role: 'SELLER',
            localId: ''
        }
    })

    const selectedRole = watch('role');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    username: initialData.username,
                    email: initialData.email || '',
                    password: '',
                    role: initialData.role,
                    localId: initialData.localId || ''
                })
            } else {
                reset({
                    name: '',
                    username: '',
                    email: '',
                    password: '',
                    role: 'SELLER',
                    localId: defaultLocalId || ''
                })
            }
        }
    }, [isOpen, initialData, reset])

    const handleFormSubmit = (data: UserFormData) => {
        onSubmit(data);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Formulario para {title.toLowerCase()}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre Completo</label>
                        <Input {...register("name")} placeholder="Ej: Juan Pérez" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Usuario</label>
                            <Input {...register("username")} placeholder="juan.perez" />
                            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Correo</label>
                            <Input {...register("email")} placeholder="juan@email.com" />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contraseña {isEditing && '(Dejar en blanco para no cambiar)'}</label>
                        <Input {...register("password")} type="password" placeholder="******" />
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Rol</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...register("role")}
                            disabled={currentUserRole === 'SELLER' || (currentUserRole === 'ADMIN' && (!initialData || initialData.role !== 'ADMIN'))}
                        >
                            <option value="SELLER">Vendedor</option>
                            {/* Show ADMIN option if Super Admin OR if we are editing an existing Admin (e.g. self-edit) */}
                            {(currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && initialData?.role === 'ADMIN')) && (
                                <option value="ADMIN">Administrador de Local</option>
                            )}
                            {currentUserRole === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                        </select>
                        {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                    </div>

                    {selectedRole !== 'SUPER_ADMIN' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Asignar a Local</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register("localId")}
                                disabled={currentUserRole === 'ADMIN' || currentUserRole === 'SELLER'} // Admins and Sellers cannot change local assignment
                            >
                                <option value="">Seleccionar Local...</option>
                                {locales.map(local => (
                                    <option key={local.id} value={local.id}>{local.name}</option>
                                ))}
                            </select>
                            {errors.localId && <p className="text-xs text-destructive">{errors.localId.message}</p>}
                        </div>
                    )}

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
