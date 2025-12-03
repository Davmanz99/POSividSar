import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type User, type Local, type Product, type Sale, type Notification } from '../types';

import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

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
    login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>;
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

    // Firebase Init
    initializeListeners: () => () => void; // Returns unsubscribe function
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

            initializeListeners: () => {
                const unsubs: (() => void)[] = [];

                // Users Listener
                unsubs.push(onSnapshot(collection(db, "users"), (snapshot) => {
                    const users = snapshot.docs.map(d => d.data() as User);
                    // Ensure Super Admin always exists in local state if DB is empty (first run)
                    if (users.length === 0) {
                        set({ users: [INITIAL_SUPER_ADMIN] });
                        // Optionally write it to DB
                        setDoc(doc(db, "users", INITIAL_SUPER_ADMIN.id), INITIAL_SUPER_ADMIN);
                    } else {
                        set({ users });
                    }
                }));

                // Locales Listener
                unsubs.push(onSnapshot(collection(db, "locales"), (snapshot) => {
                    set({ locales: snapshot.docs.map(d => d.data() as Local) });
                }));

                // Products Listener
                unsubs.push(onSnapshot(collection(db, "products"), (snapshot) => {
                    set({ products: snapshot.docs.map(d => d.data() as Product) });
                }));

                // Sales Listener
                unsubs.push(onSnapshot(collection(db, "sales"), (snapshot) => {
                    set({ sales: snapshot.docs.map(d => d.data() as Sale) });
                }));

                return () => unsubs.forEach(u => u());
            },

            login: async (username, password) => {
                const state = get();
                const now = Date.now();

                // Check Lockout
                if (state.lockoutUntil[username] && now < state.lockoutUntil[username]) {
                    const remaining = Math.ceil((state.lockoutUntil[username] - now) / 60000);
                    return { success: false, message: `Cuenta bloqueada. Intente en ${remaining} minutos.` };
                }

                // 1. Try to find in local state first (Fast)
                let user = state.users.find((u) =>
                    u.username.toLowerCase() === username.toLowerCase() ||
                    (u.email && u.email.toLowerCase() === username.toLowerCase())
                );

                // 2. If not found locally, try to find in Firestore directly (Robust)
                // This handles cases where sync hasn't finished yet or is lagging
                if (!user) {
                    try {
                        const usersRef = collection(db, "users");
                        // We can't easily query by OR in Firestore without multiple queries or an index
                        // So we try username first, then email

                        // Query by username
                        const qUsername = query(usersRef, where("username", "==", username)); // Case sensitive in Firestore usually, but let's try
                        const snapshotUsername = await getDocs(qUsername);

                        if (!snapshotUsername.empty) {
                            user = snapshotUsername.docs[0].data() as User;
                        } else {
                            // Query by email
                            const qEmail = query(usersRef, where("email", "==", username));
                            const snapshotEmail = await getDocs(qEmail);
                            if (!snapshotEmail.empty) {
                                user = snapshotEmail.docs[0].data() as User;
                            }
                        }

                        // Note: This simple query is case-sensitive. 
                        // For true case-insensitive search in Firestore, we'd need a normalized 'username_lower' field.
                        // But this is better than nothing.
                    } catch (e) {
                        console.error("Error querying user during login:", e);
                        return { success: false, message: "Error de conexión al verificar usuario." };
                    }
                }

                if (user) {
                    // Check Password
                    if (user.password && user.password !== password) {
                        const newAttempts = (state.failedAttempts[username] || 0) + 1;

                        if (newAttempts >= MAX_ATTEMPTS) {
                            set((prev) => ({
                                failedAttempts: { ...prev.failedAttempts, [username]: 0 },
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

            addUser: async (user) => {
                try {
                    await setDoc(doc(db, "users", user.id), user);
                } catch (e) {
                    console.error("Error adding user:", e);
                }
            },

            updateUser: async (id, updates) => {
                try {
                    await updateDoc(doc(db, "users", id), updates);
                } catch (e) {
                    console.error("Error updating user:", e);
                }
            },

            deleteUser: async (id) => {
                try {
                    await deleteDoc(doc(db, "users", id));
                } catch (e) {
                    console.error("Error deleting user:", e);
                }
            },

            addProduct: async (product) => {
                try {
                    await setDoc(doc(db, "products", product.id), product);
                } catch (e) {
                    console.error("Error adding product:", e);
                }
            },

            updateProduct: async (id, updates) => {
                try {
                    await updateDoc(doc(db, "products", id), updates);
                } catch (e) {
                    console.error("Error updating product:", e);
                }
            },

            deleteProduct: async (id) => {
                try {
                    await deleteDoc(doc(db, "products", id));
                } catch (e) {
                    console.error("Error deleting product:", e);
                }
            },

            addSale: async (sale) => {
                try {
                    // 1. Save Sale
                    await setDoc(doc(db, "sales", sale.id), sale);

                    // 2. Update Stock for each item
                    const state = get();
                    for (const item of sale.items) {
                        const product = state.products.find(p => p.id === item.id);
                        if (product) {
                            const newStock = product.stock - item.quantity;
                            await updateDoc(doc(db, "products", product.id), { stock: newStock });
                        }
                    }
                } catch (e) {
                    console.error("Error adding sale:", e);
                }
            },

            addLocal: async (local) => {
                try {
                    await setDoc(doc(db, "locales", local.id), local);
                } catch (e) {
                    console.error("Error adding local:", e);
                }
            },

            updateLocal: async (id, updates) => {
                try {
                    await updateDoc(doc(db, "locales", id), updates);
                } catch (e) {
                    console.error("Error updating local:", e);
                }
            },

            deleteLocal: async (id) => {
                try {
                    await deleteDoc(doc(db, "locales", id));
                } catch (e) {
                    console.error("Error deleting local:", e);
                }
            },

            toggleLocalStatus: async (id) => {
                const state = get();
                const local = state.locales.find(l => l.id === id);
                if (local) {
                    try {
                        await updateDoc(doc(db, "locales", id), { isActive: !local.isActive });
                    } catch (e) {
                        console.error("Error toggling local:", e);
                    }
                }
            },

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
