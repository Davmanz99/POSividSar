import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type User, type Local, type Product, type Sale, type Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
    currentUser: User | null;
    users: User[];
    locales: Local[];
    products: Product[];
    sales: Sale[];
    notifications: Notification[];

    failedAttempts: Record<string, number>;
    lockoutUntil: Record<string, number>;

    // Auth Actions
    login: (username: string, password?: string) => { success: boolean; message?: string };
    logout: () => void;
    addUser: (user: User) => void;
    updateUser: (id: string, updates: Partial<User>) => void;
    deleteUser: (id: string) => void;

    // Inventory Actions
    addProduct: (product: Product) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    // Sales Actions
    addSale: (sale: Sale) => void;

    // Local Actions
    addLocal: (local: Local) => void;
    updateLocal: (id: string, updates: Partial<Local>) => void;
    deleteLocal: (id: string) => void;
    toggleLocalStatus: (id: string) => void;

    // Notification Actions
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;
}

const INITIAL_SUPER_ADMIN: User = {
    id: 'super-admin-1',
    username: 'superadmin',
    password: 'SuperSecurePassword123!', // Changed default password
    role: 'SUPER_ADMIN',
    name: 'System Owner',
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            users: [INITIAL_SUPER_ADMIN],
            locales: [],
            products: [],
            sales: [],
            notifications: [],
            failedAttempts: {},
            lockoutUntil: {},

            login: (username, password) => {
                const state = get();
                const now = Date.now();

                // Check Lockout
                if (state.lockoutUntil[username] && now < state.lockoutUntil[username]) {
                    const remaining = Math.ceil((state.lockoutUntil[username] - now) / 60000);
                    return { success: false, message: `Cuenta bloqueada. Intente en ${remaining} minutos.` };
                }

                const user = state.users.find((u) => u.username === username || u.email === username);

                if (user) {
                    // Check Password
                    if (user.password && user.password !== password) {
                        const newAttempts = (state.failedAttempts[username] || 0) + 1;

                        if (newAttempts >= MAX_ATTEMPTS) {
                            set((prev) => ({
                                failedAttempts: { ...prev.failedAttempts, [username]: 0 }, // Reset attempts after lockout? Or keep? Usually reset after lockout expires.
                                lockoutUntil: { ...prev.lockoutUntil, [username]: now + LOCKOUT_DURATION }
                            }));
                            return { success: false, message: `Demasiados intentos. Cuenta bloqueada por 5 min.` };
                        }

                        set((prev) => ({
                            failedAttempts: { ...prev.failedAttempts, [username]: newAttempts }
                        }));

                        return { success: false, message: `Contraseña incorrecta. Intentos: ${newAttempts}/${MAX_ATTEMPTS}` };
                    }

                    // Success
                    set((prev) => ({
                        currentUser: user,
                        failedAttempts: { ...prev.failedAttempts, [username]: 0 },
                        lockoutUntil: { ...prev.lockoutUntil, [username]: 0 } // Clear lockout
                    }));
                    return { success: true };
                }

                return { success: false, message: 'Usuario no encontrado' };
            },

            logout: () => set({ currentUser: null }),

            addUser: (user) => set((state) => ({ users: [...state.users, user] })),

            updateUser: (id, updates) =>
                set((state) => ({
                    users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
                })),

            deleteUser: (id) =>
                set((state) => ({
                    users: state.users.filter((u) => u.id !== id),
                })),

            addProduct: (product) => set((state) => ({ products: [...state.products, product] })),

            updateProduct: (id, updates) =>
                set((state) => ({
                    products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                })),

            deleteProduct: (id) =>
                set((state) => ({
                    products: state.products.filter((p) => p.id !== id),
                })),

            addSale: (sale) => {
                set((state) => {
                    const newNotifications: Notification[] = [];

                    // Intelligent Stock Update
                    const updatedProducts = state.products.map(p => {
                        const soldItem = sale.items.find(item => item.id === p.id);
                        if (soldItem) {
                            const newStock = p.stock - soldItem.quantity;

                            // Trigger Low Stock Alert
                            if (newStock <= p.minStock) {
                                newNotifications.push({
                                    id: uuidv4(),
                                    localId: p.localId,
                                    type: 'LOW_STOCK',
                                    title: 'Alerta de Stock Bajo',
                                    message: `El producto "${p.name}" tiene ${newStock} unidades restantes.`,
                                    date: new Date().toISOString(),
                                    read: false,
                                    productId: p.id
                                });
                            }
                            return { ...p, stock: newStock };
                        }
                        return p;
                    });

                    return {
                        sales: [...state.sales, sale],
                        products: updatedProducts,
                        notifications: [...newNotifications, ...state.notifications] // Add new alerts to top
                    };
                });
            },

            addLocal: (local) => set((state) => ({ locales: [...state.locales, local] })),

            updateLocal: (id, updates) =>
                set((state) => ({
                    locales: state.locales.map((l) => (l.id === id ? { ...l, ...updates } : l)),
                })),

            deleteLocal: (id) =>
                set((state) => ({
                    locales: state.locales.filter((l) => l.id !== id),
                })),

            toggleLocalStatus: (id) =>
                set((state) => ({
                    locales: state.locales.map((l) =>
                        l.id === id ? { ...l, isActive: !l.isActive } : l
                    ),
                })),

            markNotificationRead: (id) =>
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                })),

            clearNotifications: () =>
                set((state) => ({
                    notifications: state.notifications.filter(n => !n.read) // Keep unread or clear all? Usually clear all read.
                })),
        }),
        {
            name: 'pos-ultimate-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
