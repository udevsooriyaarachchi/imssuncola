import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Invoice, InvoiceStatus, InvoiceItem, Category, Brand, PurchaseOrder, POStatus, SalesReturn } from '../types';

interface DataContextType {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  returns: SalesReturn[];
  
  // CRUD
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  addBrand: (name: string) => void;
  deleteBrand: (id: string) => void;

  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;

  addPurchaseOrder: (po: PurchaseOrder) => void;
  approvePurchaseOrder: (id: string) => void;
  
  addReturn: (rma: SalesReturn) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const SEED_PRODUCTS: Product[] = [
  { id: '1', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, cost: 15.00, stock: 50, sku: 'WM-001', category: 'Electronics', brand: 'Logitech' },
  { id: '2', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 89.99, cost: 45.00, stock: 15, sku: 'MK-002', category: 'Electronics', brand: 'Keychron' },
  { id: '3', name: 'USB-C Monitor', description: '27 inch 4K Display', price: 349.99, cost: 200.00, stock: 8, sku: 'MN-003', category: 'Monitors', brand: 'Dell' },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State Initialization ---
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : SEED_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : [{id: '1', name: 'Electronics'}, {id: '2', name: 'Monitors'}];
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('brands');
    return saved ? JSON.parse(saved) : [{id: '1', name: 'Logitech'}, {id: '2', name: 'Dell'}];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('purchaseOrders');
    return saved ? JSON.parse(saved) : [];
  });

  const [returns, setReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem('returns');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Effects ---
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('brands', JSON.stringify(brands)), [brands]);
  useEffect(() => localStorage.setItem('invoices', JSON.stringify(invoices)), [invoices]);
  useEffect(() => localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders)), [purchaseOrders]);
  useEffect(() => localStorage.setItem('returns', JSON.stringify(returns)), [returns]);

  // --- Logic ---

  // Products
  const addProduct = (product: Product) => setProducts(prev => [...prev, product]);
  const updateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));

  // Categories/Brands
  const addCategory = (name: string) => setCategories(prev => [...prev, { id: crypto.randomUUID(), name }]);
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));
  const addBrand = (name: string) => setBrands(prev => [...prev, { id: crypto.randomUUID(), name }]);
  const deleteBrand = (id: string) => setBrands(prev => prev.filter(b => b.id !== id));

  // Invoices & Stock Logic
  const adjustStock = (items: InvoiceItem[], direction: 'deduct' | 'add') => {
    setProducts(currentProducts => {
      const newProducts = [...currentProducts];
      items.forEach(item => {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          const product = newProducts[productIndex];
          const newStock = direction === 'deduct' 
            ? product.stock - item.quantity 
            : product.stock + item.quantity;
          newProducts[productIndex] = { ...product, stock: newStock };
        }
      });
      return newProducts;
    });
  };

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
    if (invoice.status === InvoiceStatus.PAID) {
      adjustStock(invoice.items, 'deduct');
    }
  };

  const updateInvoice = (updatedInvoice: Invoice) => {
    const oldInvoice = invoices.find(inv => inv.id === updatedInvoice.id);
    if (oldInvoice) {
      if (oldInvoice.status === InvoiceStatus.PAID) {
        adjustStock(oldInvoice.items, 'add'); // Revert old
      }
    }
    if (updatedInvoice.status === InvoiceStatus.PAID) {
      adjustStock(updatedInvoice.items, 'deduct'); // Apply new
    }
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
  };

  const deleteInvoice = (id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice && invoice.status === InvoiceStatus.PAID) {
      adjustStock(invoice.items, 'add'); // Return stock if deleted
    }
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  // Orders
  const addPurchaseOrder = (po: PurchaseOrder) => setPurchaseOrders(prev => [...prev, po]);
  
  const approvePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id && po.status === POStatus.PENDING) {
        // Increase Stock Logic (Simplified: matching by name since PO usually doesn't have internal ID yet)
        setProducts(currProds => currProds.map(p => {
          const item = po.items.find(i => i.productName === p.name);
          return item ? { ...p, stock: p.stock + item.quantity } : p;
        }));
        return { ...po, status: POStatus.APPROVED };
      }
      return po;
    }));
  };

  const addReturn = (rma: SalesReturn) => setReturns(prev => [...prev, rma]);

  return (
    <DataContext.Provider value={{
      products, categories, brands, invoices, purchaseOrders, returns,
      addProduct, updateProduct, deleteProduct,
      addCategory, deleteCategory, addBrand, deleteBrand,
      addInvoice, updateInvoice, deleteInvoice,
      addPurchaseOrder, approvePurchaseOrder, addReturn
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};