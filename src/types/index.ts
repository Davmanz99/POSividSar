export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SELLER';

export interface User {
    id: string;
    username: string;
    email?: string;
    password?: string;
    role: Role;
    name: string;
    localId?: string;
}

export interface Local {
    id: string;
    name: string;
    address: string;
    isActive: boolean;
    subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    lastPaymentDate?: string;
}

export interface Product {
    id: string;
    localId: string;
    name: string;
    price: number;
    stock: number;
    minStock: number; // For low stock alerts
    category: string;
    sku: string; // Barcode
    barcode?: string; // Alternative barcode field if SKU is internal
    costPrice?: number; // Cost price of the product
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Sale {
    id: string;
    localId: string;
    sellerId: string;
    items: CartItem[];
    total: number;
    date: string;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
}

export interface Notification {
    id: string;
    localId: string; // Which local this alert belongs to
    type: 'LOW_STOCK' | 'SYSTEM';
    title: string;
    message: string;
    date: string;
    read: boolean;
    productId?: string; // Link to product if applicable
}
