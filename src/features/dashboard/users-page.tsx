import { useState } from 'react';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Shield, Edit, Trash2, Store } from 'lucide-react';
import { UserFormModal } from '@/components/ui/user-form-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { type User, type Role } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function UsersPage() {
    const { users, locales, currentUser, addUser, updateUser, deleteUser } = useStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Need to implement updateUser and deleteUser in store first, but for now I'll mock or assume they exist
    // Actually I should add them to store first.

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Filter users based on role
    const filteredUsers = users.filter(u => {
        // Search filter
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

        // Role filter
        if (currentUser?.role === 'SUPER_ADMIN') return matchesSearch;
        if (currentUser?.role === 'ADMIN') {
            // Admin only sees users in their local
            return matchesSearch && u.localId === currentUser.localId;
        }
        return false;
    });

    const handleCreate = async (data: any) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newUser: User = {
            id: uuidv4(),
            name: data.name,
            username: data.username,
            email: data.email,
            password: data.password, // In real app, hash this
            role: data.role,
            localId: data.localId
        };
        addUser(newUser);

        setIsLoading(false);
        setIsFormOpen(false);
    };

    const handleUpdate = async (data: any) => {
        if (editingUser) {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Filter out empty password to avoid overwriting with empty string
            const updates = { ...data };
            if (!updates.password) {
                delete updates.password;
            }

            updateUser(editingUser.id, updates);

            setIsLoading(false);
            setIsFormOpen(false);
        }
    };

    const handleDelete = () => {
        if (selectedUser) {
            deleteUser(selectedUser.id);
            setIsConfirmOpen(false);
            setSelectedUser(null);
        }
    };

    const getRoleBadge = (role: Role) => {
        switch (role) {
            case 'SUPER_ADMIN': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Super Admin</Badge>;
            case 'ADMIN': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Admin Local</Badge>;
            case 'SELLER': return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Vendedor</Badge>;
        }
    };

    const getLocalName = (localId?: string) => {
        if (!localId) return 'Sin Asignar';
        const local = locales.find(l => l.id === localId);
        return local ? local.name : 'Desconocido';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground font-display">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">Administra el acceso y roles del personal.</p>
                </div>
                <Button
                    variant="neon"
                    className="gap-2"
                    onClick={() => {
                        setEditingUser(null);
                        setIsFormOpen(true);
                    }}
                >
                    <Plus size={18} />
                    Nuevo Usuario
                </Button>
            </div>

            <Card className="glass-panel border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-foreground">Usuarios del Sistema</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Buscar usuarios..."
                            className="pl-9 bg-background border-border"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map((user) => (
                            <Card key={user.id} className="bg-card border-border hover:border-primary/50 transition-all">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                                            {user.role === 'SUPER_ADMIN' ? <Shield size={24} /> : <Users size={24} />}
                                        </div>
                                        {getRoleBadge(user.role)}
                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-1">{user.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">@{user.username}</p>

                                    {user.role !== 'SUPER_ADMIN' && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 bg-muted/50 p-2 rounded">
                                            <Store size={12} />
                                            <span>{getLocalName(user.localId)}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 border-t border-border pt-4 mt-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setIsFormOpen(true);
                                            }}
                                        >
                                            <Edit size={14} />
                                            Editar
                                        </Button>
                                        {user.id !== currentUser?.id && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="px-3"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setIsConfirmOpen(true);
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <UserFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingUser ? handleUpdate : handleCreate}
                initialData={editingUser}
                title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
                isLoading={isLoading}
                locales={locales}
                currentUserRole={currentUser?.role || 'SELLER'}
                defaultLocalId={currentUser?.localId}

            />

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Usuario"
                description={`¿Estás seguro de que deseas eliminar al usuario ${selectedUser?.name}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="destructive"
            />
        </div>
    );
}
