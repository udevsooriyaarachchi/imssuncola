import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Invoice, InvoiceStatus, InvoiceItem, Product } from '../types';
import { Plus, Trash, Printer, ArrowLeft, AlertCircle, Download } from 'lucide-react';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const InvoiceEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, products, addInvoice, updateInvoice } = useData();
  const { user } = useAuth();
  const isEditing = !!id;

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: InvoiceStatus.DRAFT,
    items: [],
    notes: '',
  });

  const [errors, setErrors] = useState<{[key: number]: string}>({});

  useEffect(() => {
    if (isEditing && id) {
      const existing = invoices.find(i => i.id === id);
      if (existing) {
        setInvoice(JSON.parse(JSON.stringify(existing))); // Deep copy
      } else {
        navigate('/invoices');
      }
    }
  }, [id, isEditing, invoices, navigate]);

  const handleAddItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId: '', productName: '', quantity: 1, price: 0 }]
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...(invoice.items || [])];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          price: product.price
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    // Clear error for this line when modified
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
    
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(invoice.items || [])];
    newItems.splice(index, 1);
    setInvoice(prev => ({ ...prev, items: newItems }));
    
    // Clear errors
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const calculateTotal = () => {
    return (invoice.items || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const validateStock = (targetStatus: InvoiceStatus): boolean => {
    // Only validate stock if we are finalizing the invoice (PAID)
    if (targetStatus !== InvoiceStatus.PAID) return true;

    const newErrors: {[key: number]: string} = {};
    let isValid = true;

    // We need to know if this invoice was ALREADY paid to calculate true available stock.
    // If it was PAID, the items in it are already deducted from the global 'products' state.
    const wasAlreadyPaid = isEditing && invoices.find(i => i.id === id)?.status === InvoiceStatus.PAID;

    invoice.items?.forEach((item, index) => {
      if (!item.productId) return;
      
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        newErrors[index] = "Product not found";
        isValid = false;
        return;
      }

      // Calculate available stock
      // If wasAlreadyPaid is true, we "own" the quantity that was previously saved.
      // We need to fetch the original quantity from the saved invoice to add it back to "available" calculation.
      let availableStock = product.stock;
      
      if (wasAlreadyPaid && id) {
        const originalInvoice = invoices.find(i => i.id === id);
        const originalItem = originalInvoice?.items.find(i => i.productId === item.productId);
        if (originalItem) {
          availableStock += originalItem.quantity;
        }
      }

      if (item.quantity > availableStock) {
        newErrors[index] = `Max available: ${availableStock}`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Separated save logic from navigation
  const saveInvoice = (targetStatus: InvoiceStatus): Invoice | null => {
    if (!invoice.customerName || (invoice.items || []).length === 0) {
      alert("Please fill in customer name and at least one item.");
      return null;
    }

    if (!validateStock(targetStatus)) {
      alert("Cannot proceed: Some items exceed available stock.");
      return null;
    }

    const total = calculateTotal();
    const finalId = invoice.id || crypto.randomUUID();
    
    const invoiceData: Invoice = {
      ...invoice,
      id: finalId,
      total,
      status: targetStatus,
      createdBy: invoice.createdBy || user?.id || 'unknown',
      items: invoice.items || [],
    } as Invoice;

    // Determine if update or add
    // If we have a param ID, it's definitely an edit of an existing loaded invoice.
    // Or if the invoice ID already exists in our local invoices list (handled by ensuring we check invoices)
    const exists = invoices.some(i => i.id === finalId);

    if (isEditing || exists) {
      updateInvoice(invoiceData);
    } else {
      addInvoice(invoiceData);
    }

    return invoiceData;
  };

  const handleSaveBtn = (status: InvoiceStatus = InvoiceStatus.DRAFT) => {
    const saved = saveInvoice(status);
    if (saved) {
      navigate('/invoices');
    }
  };

  const handlePrint = () => {
    // Pre-validation to avoid prompt if invalid
    if (!validateStock(InvoiceStatus.PAID)) {
      alert("Cannot issue: Some items exceed available stock.");
      return;
    }

    if(window.confirm("Marking as PAID and printing will deduct stock. Continue?")) {
         const saved = saveInvoice(InvoiceStatus.PAID);
         if (saved) {
             setInvoice(saved);
             // Small delay to allow React to render the "PAID" status and Invoice ID before printing
             setTimeout(() => {
                 window.print();
                 if (!id) {
                     navigate(`/invoices/edit/${saved.id}`, { replace: true });
                 }
             }, 500);
         }
    }
  };

  const handleDownloadPDF = () => {
    if (!validateStock(InvoiceStatus.PAID)) {
      alert("Cannot issue: Some items exceed available stock.");
      return;
    }

    if(window.confirm("Marking as PAID and downloading PDF will deduct stock. Continue?")) {
        const saved = saveInvoice(InvoiceStatus.PAID);
        if (saved) {
            setInvoice(saved);
            
            // Wait for render
            setTimeout(() => {
                const element = document.getElementById('invoice-content');
                if (window.html2pdf && element) {
                    
                    // Manually toggle visibility for PDF generation
                    // html2pdf snapshots the DOM, so we need to show the hidden text fields
                    // and rely on data-html2canvas-ignore to hide the inputs
                    const pdfOnlyElements = element.querySelectorAll('.hidden-on-screen-visible-in-pdf');
                    pdfOnlyElements.forEach(el => (el as HTMLElement).style.display = 'block');

                    const opt = {
                        margin: 10,
                        filename: `Invoice_${saved.id.slice(0,8)}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };
                    
                    window.html2pdf().set(opt).from(element).save().then(() => {
                        // Restore visibility
                        pdfOnlyElements.forEach(el => (el as HTMLElement).style.display = 'none');
                        
                        if (!id) {
                            navigate(`/invoices/edit/${saved.id}`, { replace: true });
                        }
                    });

                } else {
                    alert('PDF Generator not ready. Opening Print dialog instead.');
                    window.print();
                }
            }, 500);
        }
    }
  };

  const getProductStockInfo = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    return product.stock;
  };

  return (
    <div className="max-w-4xl mx-auto print:max-w-none print:mx-0 print:w-full">
      {/* Action Bar - No Print */}
      <div className="flex justify-between items-center mb-6 no-print">
        <button onClick={() => navigate('/invoices')} className="text-gray-500 hover:text-gray-900 flex items-center font-medium transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>
        <div className="flex space-x-3">
          <button 
            onClick={() => handleSaveBtn(InvoiceStatus.DRAFT)}
            className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition-all active:scale-95"
          >
            Save Draft
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 flex items-center font-medium transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 mr-2" /> PDF
          </button>
          <button 
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#007AFF] text-white rounded-full hover:bg-blue-600 flex items-center font-bold shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </button>
        </div>
      </div>

      {/* Invoice Paper */}
      <div id="invoice-content" className="bg-white p-12 shadow-2xl rounded-[24px] min-h-[900px] print:shadow-none print:p-8 print:m-0 print:w-full print:h-auto print:rounded-none">
        {/* Header */}
        <div className="flex justify-between border-b border-gray-100 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">INVOICE</h1>
            <div className="mt-3 text-gray-500 font-medium">
              <p className="tracking-widest">#{invoice.id ? invoice.id.slice(0, 8).toUpperCase() : 'NEW'}</p>
              <p>{new Date(invoice.date!).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">InvoiceFlow Inc.</h2>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">123 Business Rd.<br/>Tech City, TC 90210</p>
          </div>
        </div>

        {/* Customer & Details */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 no-print" data-html2canvas-ignore="true">Bill To</label>
            <input 
              type="text" 
              placeholder="Enter Customer Name"
              className="w-full text-2xl font-bold border-b border-dashed border-gray-200 focus:border-[#007AFF] focus:outline-none py-2 bg-transparent placeholder-gray-300"
              value={invoice.customerName}
              onChange={e => setInvoice({...invoice, customerName: e.target.value})}
            />
          </div>
          <div className="text-right space-y-3">
            <div>
              <span className="text-gray-400 font-medium mr-4">Status:</span>
              <span className={`font-bold uppercase tracking-wide px-3 py-1 rounded-full text-xs ${
                  invoice.status === InvoiceStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                  {invoice.status}
              </span>
            </div>
            <div className="no-print flex items-center justify-end" data-html2canvas-ignore="true">
               <label className="text-sm text-gray-400 font-medium mr-3">Due Date:</label>
               <input 
                 type="date" 
                 value={invoice.dueDate}
                 onChange={e => setInvoice({...invoice, dueDate: e.target.value})}
                 className="border-none bg-gray-50 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-100"
               />
            </div>
            {/* Fallback for PDF generation */}
             <div className="hidden-on-screen-visible-in-pdf mt-1">
               <span className="text-gray-500 mr-4">Due Date:</span>
               <span className="font-semibold">{new Date(invoice.dueDate!).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-10">
          <thead className="border-b-2 border-gray-100">
            <tr>
              <th className="text-left py-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Item Description</th>
              <th className="text-center py-4 font-bold text-gray-400 text-xs uppercase tracking-wider w-24">Qty</th>
              <th className="text-right py-4 font-bold text-gray-400 text-xs uppercase tracking-wider w-32">Price</th>
              <th className="text-right py-4 font-bold text-gray-400 text-xs uppercase tracking-wider w-32">Amount</th>
              <th className="w-10 no-print" data-html2canvas-ignore="true"></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => {
              const stock = item.productId ? getProductStockInfo(item.productId) : null;
              const hasError = !!errors[index];
              return (
              <tr key={index} className={`border-b border-gray-50 ${hasError ? 'bg-red-50' : 'group hover:bg-gray-50/50'}`}>
                <td className="py-5 align-top">
                  <div className="no-print mb-2" data-html2canvas-ignore="true">
                     <select 
                       className={`w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all ${hasError ? 'ring-2 ring-red-200 bg-red-50' : ''}`}
                       value={item.productId}
                       onChange={e => handleItemChange(index, 'productId', e.target.value)}
                     >
                       <option value="">Select Product...</option>
                       {products.map(p => (
                         <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock})
                         </option>
                       ))}
                     </select>
                  </div>
                  <div className="font-bold text-gray-900 text-lg">{item.productName || '—'}</div>
                  {stock !== null && (
                    <div className="no-print text-xs text-gray-400 mt-1 font-medium" data-html2canvas-ignore="true">
                       Stock Available: <span className="text-gray-600">{stock}</span>
                    </div>
                  )}
                  {hasError && (
                    <div className="flex items-center text-xs text-red-500 mt-2 font-bold no-print" data-html2canvas-ignore="true">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors[index]}
                    </div>
                  )}
                </td>
                <td className="py-5 text-center align-top">
                  <input 
                    type="number" 
                    min="1"
                    className="w-16 text-center bg-gray-50 rounded-lg p-2 font-semibold no-print focus:ring-2 focus:ring-blue-100 outline-none"
                    value={item.quantity}
                    onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    data-html2canvas-ignore="true"
                  />
                  {/* Explicit span for PDF/Print */}
                  <span className="hidden-on-screen-visible-in-pdf font-semibold">{item.quantity}</span>
                </td>
                <td className="py-5 text-right align-top font-medium text-gray-600">${item.price.toFixed(2)}</td>
                <td className="py-5 text-right font-bold text-gray-900 align-top">
                  ${(item.quantity * item.price).toFixed(2)}
                </td>
                <td className="py-5 text-center no-print align-top" data-html2canvas-ignore="true">
                  <button onClick={() => handleRemoveItem(index)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>

        {/* Add Item Button */}
        <div className="mb-8 no-print" data-html2canvas-ignore="true">
          <button 
            onClick={handleAddItem}
            className="flex items-center text-[#007AFF] hover:bg-blue-50 px-4 py-2 rounded-full font-bold transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Line Item
          </button>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-4">
            <div className="flex justify-between border-t-2 border-gray-900 pt-6">
              <span className="font-extrabold text-2xl text-gray-900">Total</span>
              <span className="font-extrabold text-2xl text-[#007AFF]">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notes & Terms</label>
          <textarea 
            className="w-full bg-gray-50 rounded-2xl p-4 text-gray-600 h-28 focus:ring-2 focus:ring-blue-100 outline-none resize-none font-medium text-sm"
            placeholder="Thank you for your business. Payment is due within 7 days."
            value={invoice.notes}
            onChange={e => setInvoice({...invoice, notes: e.target.value})}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;