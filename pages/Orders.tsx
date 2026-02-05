import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { POStatus, PurchaseOrder } from '../types';
import { ClipboardList, CheckCircle2, XCircle, RefreshCcw, Plus } from 'lucide-react';

const Orders: React.FC = () => {
  const { purchaseOrders, returns, approvePurchaseOrder, addPurchaseOrder } = useData();
  const [activeTab, setActiveTab] = useState<'PO' | 'RETURNS'>('PO');
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({ supplier: '', items: [], totalCost: 0 });

  // Simplified PO Creation Logic for Demo
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPO.supplier) {
        addPurchaseOrder({
            id: crypto.randomUUID(),
            supplier: newPO.supplier,
            items: [{ productName: 'Demo Item', quantity: 10, cost: 50 }], // Mocked items
            totalCost: 500,
            status: POStatus.PENDING,
            date: new Date().toISOString()
        });
        setIsPoModalOpen(false);
        setNewPO({ supplier: '', items: [], totalCost: 0 });
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Orders & Returns</h2>
           <p className="text-gray-500 mt-1">Operational control for supplies and returns.</p>
        </div>
        
        {activeTab === 'PO' && (
             <button 
                onClick={() => setIsPoModalOpen(true)}
                className="flex items-center px-5 py-3 bg-[#007AFF] text-white rounded-full font-semibold shadow-md shadow-blue-200 hover:opacity-90 transition-all active:scale-95"
            >
                <Plus className="w-5 h-5 mr-2" /> New PO
            </button>
        )}
      </div>

      <div className="bg-gray-200/50 p-1.5 rounded-2xl inline-flex w-full md:w-auto">
        <button 
          onClick={() => setActiveTab('PO')}
          className={`flex-1 md:flex-none px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'PO' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Purchase Orders
        </button>
        <button 
          onClick={() => setActiveTab('RETURNS')}
          className={`flex-1 md:flex-none px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'RETURNS' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Returns (RMA)
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm overflow-hidden border border-gray-100 min-h-[400px]">
         {activeTab === 'PO' ? (
             <div className="overflow-x-auto">
                 <table className="w-full text-left">
                     <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                         <tr>
                             <th className="p-5 pl-8">Order ID</th>
                             <th className="p-5">Supplier</th>
                             <th className="p-5">Date</th>
                             <th className="p-5">Total Cost</th>
                             <th className="p-5">Status</th>
                             <th className="p-5 text-right pr-8">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {purchaseOrders.map(po => (
                             <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                                 <td className="p-5 pl-8 font-mono text-sm text-gray-500">#{po.id.slice(0,8)}</td>
                                 <td className="p-5 font-bold text-gray-900">{po.supplier}</td>
                                 <td className="p-5 text-gray-600">{new Date(po.date).toLocaleDateString()}</td>
                                 <td className="p-5 font-medium text-gray-900">${po.totalCost.toFixed(2)}</td>
                                 <td className="p-5">
                                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                         po.status === POStatus.APPROVED ? 'bg-green-100 text-green-600' :
                                         po.status === POStatus.REJECTED ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                     }`}>
                                         {po.status}
                                     </span>
                                 </td>
                                 <td className="p-5 text-right pr-8">
                                     {po.status === POStatus.PENDING && (
                                         <button 
                                            onClick={() => approvePurchaseOrder(po.id)}
                                            className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-full font-bold text-xs hover:bg-green-100 transition-colors"
                                         >
                                             <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                         </button>
                                     )}
                                 </td>
                             </tr>
                         ))}
                         {purchaseOrders.length === 0 && (
                             <tr><td colSpan={6} className="p-10 text-center text-gray-400">No Purchase Orders found.</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                        <tr>
                            <th className="p-5 pl-8">RMA ID</th>
                            <th className="p-5">Invoice ID</th>
                            <th className="p-5">Reason</th>
                            <th className="p-5">Refund</th>
                            <th className="p-5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {returns.map(ret => (
                            <tr key={ret.id}>
                                <td className="p-5 pl-8 font-mono text-sm text-gray-500">#{ret.id.slice(0,8)}</td>
                                <td className="p-5 font-medium text-gray-900">#{ret.invoiceId.slice(0,8)}</td>
                                <td className="p-5 text-gray-600">{ret.reason}</td>
                                <td className="p-5 font-bold text-gray-900">${ret.refundAmount.toFixed(2)}</td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ret.status === 'Processed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {ret.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {returns.length === 0 && (
                             <tr><td colSpan={5} className="p-10 text-center text-gray-400">No Returns recorded.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
         )}
      </div>

      {/* Simple PO Modal */}
      {isPoModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[32px] p-8 w-full max-w-sm">
                  <h3 className="text-xl font-bold mb-4">Create Purchase Order</h3>
                  <form onSubmit={handleCreatePO} className="space-y-4">
                      <input 
                         placeholder="Supplier Name" 
                         className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 outline-none"
                         value={newPO.supplier}
                         onChange={e => setNewPO({...newPO, supplier: e.target.value})}
                      />
                      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                          * Adds demo items (10 units, $500 total) automatically.
                      </div>
                      <div className="flex justify-end space-x-3 mt-4">
                          <button type="button" onClick={() => setIsPoModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                          <button className="px-6 py-3 bg-[#007AFF] text-white rounded-full font-bold">Create</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Orders;