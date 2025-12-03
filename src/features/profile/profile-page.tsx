import { useState } from 'react';
import { useStore } from '@/store/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Store, Edit, Key } from 'lucide-react';
import { UserFormModal } from '@/components/ui/user-form-modal';

export function ProfilePage() {
    const { currentUser, locales, updateUser } = useStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!currentUser) return null;

    const currentLocal = locales.find(l => l.id === currentUser.localId);

    const handleUpdate = async (data: any) => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Filter out empty password
        const updates = { ...data };
        if (!updates.password) {
            delete updates.password;
        }

        // Prevent self-demotion or local change if not allowed (safety check)
        // Ideally backend handles this, but here we do it client side
        if (currentUser.role !== 'SUPER_ADMIN') {
            delete updates.role;
            delete updates.localId;
        }

        updateUser(currentUser.id, updates);
        setIsLoading(false);
        setIsEditModalOpen(false);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Super Admin</Badge>;
            case 'ADMIN': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Admin Local</Badge>;
            case 'SELLER': return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Vendedor</Badge>;
            default: return <Badge variant="outline">{role}</Badge>;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground font-display">Mi Perfil</h1>
                <p className="text-muted-foreground">Gestiona tu información personal y seguridad.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Profile Card */}
                <Card className="md:col-span-2 glass-panel border-border bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="text-primary" />
                            Información Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border border-primary/20">
                                {currentUser.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{currentUser.name}</h2>
                                <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                            </div>
                            <div className="ml-auto">
                                {getRoleBadge(currentUser.role)}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Correo Electrónico</label>
                                <div className="flex items-center gap-2 text-foreground p-2 bg-background/50 rounded-md border border-border">
                                    <Mail size={16} className="text-primary/70" />
                                    <span>{currentUser.email || 'No registrado'}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol de Usuario</label>
                                <div className="flex items-center gap-2 text-foreground p-2 bg-background/50 rounded-md border border-border">
                                    <Shield size={16} className="text-primary/70" />
                                    <span>{currentUser.role.replace('_', ' ')}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Local Asignado</label>
                                <div className="flex items-center gap-2 text-foreground p-2 bg-background/50 rounded-md border border-border">
                                    <Store size={16} className="text-primary/70" />
                                    <span>{currentLocal?.name || 'Sin asignar'}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID de Usuario</label>
                                <div className="flex items-center gap-2 text-muted-foreground p-2 bg-background/50 rounded-md border border-border font-mono text-xs">
                                    <Key size={16} className="text-primary/70" />
                                    <span className="truncate">{currentUser.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button variant="neon" onClick={() => setIsEditModalOpen(true)} className="gap-2">
                                <Edit size={16} />
                                Editar Perfil
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Security / Stats Card */}
                <div className="space-y-6">
                    <Card className="glass-panel border-border bg-card">
                        <CardHeader>
                            <CardTitle className="text-base">Seguridad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <p className="text-xs text-emerald-500 font-medium mb-1">Estado de Cuenta</p>
                                <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Activa y Segura
                                </p>
                            </div>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsEditModalOpen(true)}>
                                <Key size={16} />
                                Cambiar Contraseña
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <UserFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdate}
                initialData={currentUser}
                title="Editar Mi Perfil"
                isLoading={isLoading}
                locales={locales}
                currentUserRole={currentUser.role} // Pass role to handle field disabling
                defaultLocalId={currentUser.localId}
            />
        </div>
    );
}
