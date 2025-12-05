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
    cashInRegister?: number; // Current cash in register
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
    measurementUnit?: 'UNIT' | 'KG' | 'GRAM' | 'LITER'; // Unit of measurement
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
    discount?: number;
    discountType?: 'FIXED' | 'PERCENTAGE';
    finalTotal?: number;
    amountTendered?: number;
    status?: 'COMPLETED' | 'CANCELLED' | 'CANCELLATION_REQUESTED';
    cancellationReason?: string;
    cancellationRequestedBy?: string; // User ID
    cancellationApprovedBy?: string; // Admin ID
    cancellationDate?: string;
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

export interface Task {
    id: string;
    localId: string;
    assignedToId: string; // Seller ID
    assignedById: string; // Admin ID
    title: string;
    description?: string;
    dueDate?: string; // ISO Date string
    status: 'PENDING' | 'COMPLETED';
    completedAt?: string;
    createdAt: string;
    isRecurring?: boolean;
    frequency?: 'DAILY';
}
