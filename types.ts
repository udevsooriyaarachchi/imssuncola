export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface UserPermissions {
  inventory: boolean;
  invoices: boolean;
  orders: boolean;
  reports: boolean;
  team: boolean;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  password?: string; // stored for mock auth
  permissions: UserPermissions;
}

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number; // Added for Profit/Loss
  stock: number;
  sku: string;
  category?: string;
  brand?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  PAID = 'Paid',
  CANCELLED = 'Cancelled'
}

export interface Invoice {
  id: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  total: number;
  status: InvoiceStatus;
  notes?: string;
  createdBy: string; // user id
}

export enum POStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  items: { productName: string; quantity: number; cost: number }[];
  totalCost: number;
  status: POStatus;
  date: string;
}

export interface SalesReturn {
  id: string;
  invoiceId: string;
  reason: string;
  date: string;
  status: 'Pending' | 'Processed';
  refundAmount: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  lowStockItems: number;
  revenueByMonth: { name: string; value: number }[];
}