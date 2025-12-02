import { useStore } from '@/store/store';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function NotificationsPopover() {
    const { notifications, markNotificationRead, currentUser } = useStore();
    const navigate = useNavigate();

    // Filter notifications for current user
    const userNotifications = notifications.filter(n => {
        if (currentUser?.role === 'SUPER_ADMIN') return true;
        return n.localId === currentUser?.localId;
    });

    const unreadCount = userNotifications.filter(n => !n.read).length;

    const handleNotificationClick = (id: string, productId?: string) => {
        markNotificationRead(id);
        if (productId) {
            navigate('/inventory');
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="p-3 rounded-full bg-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/30 relative group">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-card border-white/10" align="end">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h4 className="font-semibold text-white">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {unreadCount} nuevas
                        </span>
                    )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {userNotifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <Bell className="mx-auto mb-2 opacity-50" size={24} />
                            No tienes notificaciones
                        </div>
                    ) : (
                        userNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification.id, notification.productId)}
                                className={`
                                    p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5
                                    ${!notification.read ? 'bg-primary/5' : ''}
                                `}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 ${notification.type === 'LOW_STOCK' ? 'text-amber-500' : 'text-primary'}`}>
                                        {notification.type === 'LOW_STOCK' ? <AlertTriangle size={16} /> : <Bell size={16} />}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </h5>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/50 mt-2">
                                            {format(new Date(notification.date), "d MMM, HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
