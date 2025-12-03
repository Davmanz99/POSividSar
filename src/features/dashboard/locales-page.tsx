import { useState } from 'react';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Store, MapPin, Edit, Power, Trash2 } from 'lucide-react';
import { LocalFormModal } from '@/components/ui/local-form-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { type Local } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function LocalesPage() {
    const { locales, addLocal, updateLocal, deleteLocal, toggleLocalStatus, addUser } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLocal, setEditingLocal] = useState<Local | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
    const [actionType, setActionType] = useState<'TOGGLE' | 'DELETE' | null>(null);

    const filteredLocales = locales.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async (data: any) => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newLocalId = uuidv4();

        // 1. Create Local
        const newLocal: Local = {
            id: newLocalId,
            name: data.name,
            address: data.address,
            isActive: true,
            subscriptionStatus: 'ACTIVE'
        };
        addLocal(newLocal);

        // 2. Create Local Admin User
        if (data.adminName && data.adminEmail && data.adminPassword) {
            const newAdmin = {
                id: uuidv4(),
                name: data.adminName,
                username: data.adminEmail,
                email: data.adminEmail,
                password: data.adminPassword,
                role: 'ADMIN' as const,
                localId: newLocalId
            };
            addUser(newAdmin);
        }

        setIsLoading(false);
        setIsFormOpen(false);
    };

    const handleUpdate = async (data: { name: string; address: string }) => {
        if (editingLocal) {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateLocal(editingLocal.id, data);
            setIsLoading(false);
            setIsFormOpen(false);
        }
    };

    const handleConfirmAction = () => {
        if (!selectedLocal || !actionType) return;

        if (actionType === 'TOGGLE') {
            toggleLocalStatus(selectedLocal.id);
        } else if (actionType === 'DELETE') {
            deleteLocal(selectedLocal.id);
        }

        setIsConfirmOpen(false);
        setSelectedLocal(null);
        setActionType(null);
    };

    const openConfirm = (local: Local, type: 'TOGGLE' | 'DELETE') => {
        setSelectedLocal(local);
        setActionType(type);
        setIsConfirmOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white font-display">Gestión de Locales</h1>
                    <p className="text-muted-foreground">Administra tus sucursales físicas.</p>
                </div>
                <Button
                    variant="neon"
                    className="gap-2"
                    onClick={() => {
                        setEditingLocal(null);
                        setIsFormOpen(true);
                    }}
                >
                    <Plus size={18} />
                    Agregar Local
                </Button>
            </div>

            <Card className="glass-panel">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Locales Registrados</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Buscar locales..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredLocales.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Store size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No se encontraron locales. ¡Crea tu primera sucursal!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLocales.map((local) => (
                                <Card key={local.id} className={`bg-white/5 border-white/10 transition-all ${!local.isActive ? 'opacity-60 grayscale' : ''}`}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                                <Store size={24} />
                                            </div>
                                            <Badge variant={local.isActive ? 'success' : 'destructive'}>
                                                {local.isActive ? 'ACTIVO' : 'INACTIVO'}
                                            </Badge>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{local.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                                            <MapPin size={14} />
                                            <span>{local.address}</span>
                                        </div>

                                        <div className="flex gap-2 border-t border-white/10 pt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 gap-2"
                                                onClick={() => {
                                                    setEditingLocal(local);
                                                    setIsFormOpen(true);
                                                }}
                                            >
                                                <Edit size={14} />
                                                Editar
                                            </Button>
                                            <Button
                                                variant={local.isActive ? 'destructive' : 'default'}
                                                size="sm"
                                                className="flex-1 gap-2"
                                                onClick={() => openConfirm(local, 'TOGGLE')}
                                            >
                                                <Power size={14} />
                                                {local.isActive ? 'Desactivar' : 'Habilitar'}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="px-3"
                                                onClick={() => openConfirm(local, 'DELETE')}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <LocalFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingLocal ? handleUpdate : handleCreate}
                initialData={editingLocal}
                title={editingLocal ? "Editar Local" : "Crear Nuevo Local"}
                isLoading={isLoading}
            />

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmAction}
                title={
                    actionType === 'DELETE' ? "Eliminar Local" :
                        selectedLocal?.isActive ? "Desactivar Local" : "Habilitar Local"
                }
                description={
                    actionType === 'DELETE' ? "¿Estás seguro de que deseas eliminar este local permanentemente? Esta acción no se puede deshacer." :
                        selectedLocal?.isActive
                            ? "¿Estás seguro de que deseas desactivar este local? No se podrán realizar ventas en él."
                            : "¿Estás seguro de que deseas habilitar este local nuevamente?"
                }
                confirmText={
                    actionType === 'DELETE' ? "Eliminar" :
                        selectedLocal?.isActive ? "Desactivar" : "Habilitar"
                }
                variant={
                    actionType === 'DELETE' ? 'destructive' :
                        selectedLocal?.isActive ? 'destructive' : 'default'
                }
            />
        </div>
    );
}
