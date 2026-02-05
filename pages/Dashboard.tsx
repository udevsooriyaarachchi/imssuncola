import React from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { InvoiceStatus } from '../types';

const Dashboard: React.FC = () => {
  const { invoices, products } = useData();

  // Calculate Stats
  const totalRevenue = invoices
    .filter(i => i.status === InvoiceStatus.PAID)
    .reduce((sum, i) => sum + i.total, 0);
  
  const totalInvoices = invoices.length;
  const lowStockItems = products.filter(p => p.stock < 10).length;

  // Prepare Chart Data (Group by month)
  const chartData = invoices.reduce((acc, inv) => {
    const month = new Date(inv.date).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.name === month);
    if (existing) {
      existing.amount += inv.total;
    } else {
      acc.push({ name: month, amount: inv.total });
    }
    return acc;
  }, [] as { name: string; amount: number }[]).sort((a, b) => {
      // Sort months vaguely correctly for demo
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.indexOf(a.name) - months.indexOf(b.name);
  });

  const StatCard = ({ title, value, icon: Icon, colorClass, iconColor }: any) => (
    <div className="bg-white p-6 rounded-[24px] shadow-sm flex items-center transition-transform hover:scale-[1.02] duration-300">
      <div className={`p-4 rounded-2xl ${colorClass} text-white mr-5 shadow-sm`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wide">{title}</p>
        <h3 className={`text-3xl font-extrabold ${iconColor}`}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard</h2>
           <p className="text-gray-500 mt-1">Overview of your business performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Revenue (Paid)" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          colorClass="bg-green-500" 
          iconColor="text-gray-900"
        />
        <StatCard 
          title="Invoices Issued" 
          value={totalInvoices} 
          icon={FileText} 
          colorClass="bg-blue-500" 
          iconColor="text-gray-900"
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockItems} 
          icon={AlertTriangle} 
          colorClass="bg-orange-500" 
          iconColor="text-gray-900"
        />
      </div>

      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100/50 h-[450px]">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} />
            <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
            />
            <Bar dataKey="amount" fill="#007AFF" radius={[6, 6, 6, 6]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;