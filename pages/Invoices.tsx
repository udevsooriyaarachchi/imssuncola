import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, X, Filter } from 'lucide-react';
import { InvoiceStatus } from '../types';

const Invoices: React.FC = () => {
  const { invoices, deleteInvoice } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesStartDate = !startDate || inv.date >= startDate;
    const matchesEndDate = !endDate || inv.date <= endDate;

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clearFilters = () => {
      setSearchTerm('');
      setStatusFilter('ALL');
      setStartDate('');
      setEndDate('');
      setSelectedIds([]);
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-green-100 text-green-700';
      case InvoiceStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} invoice(s)? Stock will be restored for any PAID invoices.`)) {
        selectedIds.forEach(id => deleteInvoice(id));
        setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Invoices</h2>
           <p className="text-gray-500 mt-1">Manage billing and history.</p>
        </div>
        <div className="flex space-x-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center px-5 py-3 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors animate-in fade-in"
            >
              <Trash2 className="w-4 h-4 mr-2" /> 
              Delete ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => navigate('/invoices/new')}
            className="flex items-center px-5 py-3 bg-[#007AFF] text-white rounded-full font-semibold shadow-md shadow-blue-200 hover:opacity-90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> New Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 bg-gray-50/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by Customer or ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border-none rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:bg-white transition-all font-medium"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIds([]);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
             <div className="flex items-center bg-gray-100 rounded-xl px-3 border-none">
                <Filter className="w-4 h-4 text-gray-500 mr-2" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'ALL')}
                    className="py-2.5 bg-transparent text-gray-700 focus:outline-none text-sm font-medium cursor-pointer"
                >
                    <option value="ALL">All Status</option>
                    <option value={InvoiceStatus.DRAFT}>Draft</option>
                    <option value={InvoiceStatus.PAID}>Paid</option>
                    <option value={InvoiceStatus.CANCELLED}>Cancelled</option>
                </select>
             </div>

             <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
                 <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 bg-white rounded-lg text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] border-none shadow-sm"
                    placeholder="Start Date"
                 />
                 <span className="text-gray-400 font-medium">-</span>
                 <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1.5 bg-white rounded-lg text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] border-none shadow-sm"
                    placeholder="End Date"
                 />
             </div>

             {(searchTerm || statusFilter !== 'ALL' || startDate || endDate) && (
                <button 
                  onClick={clearFilters}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear Filters"
                >
                    <X className="w-5 h-5" />
                </button>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
              <tr>
                <th className="p-5 w-14 pl-8">
                  <input 
                    type="checkbox" 
                    className="rounded-md border-gray-300 text-[#007AFF] focus:ring-[#007AFF] w-4 h-4"
                    checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-5">Invoice ID</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Date</th>
                <th className="p-5">Total</th>
                <th className="p-5">Status</th>
                <th className="p-5 pr-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.includes(inv.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-5 pl-8">
                    <input 
                      type="checkbox" 
                      className="rounded-md border-gray-300 text-[#007AFF] focus:ring-[#007AFF] w-4 h-4"
                      checked={selectedIds.includes(inv.id)}
                      onChange={() => handleSelectOne(inv.id)}
                    />
                  </td>
                  <td className="p-5 font-mono text-sm text-gray-500 font-medium">#{inv.id.slice(0, 8)}</td>
                  <td className="p-5 font-bold text-gray-900">{inv.customerName}</td>
                  <td className="p-5 text-gray-500 font-medium">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="p-5 font-bold text-gray-900">${inv.total.toFixed(2)}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <button 
                      onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                      className="text-[#007AFF] hover:bg-blue-50 px-3 py-1.5 rounded-full font-medium text-sm inline-flex items-center transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">
                    No invoices found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;