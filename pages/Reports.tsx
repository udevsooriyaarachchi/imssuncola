import React from 'react';
import { useData } from '../context/DataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Wallet, Package } from 'lucide-react';
import { InvoiceStatus } from '../types';

const Reports: React.FC = () => {
  const { invoices, products } = useData();

  // Financial Calculations
  const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID);
  
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  
  // Calculate COGS (Cost of Goods Sold)
  let totalCOGS = 0;
  paidInvoices.forEach(inv => {
      inv.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
              totalCOGS += (product.cost || 0) * item.quantity;
          }
      });
  });

  const grossProfit = totalRevenue - totalCOGS;
  const inventoryValuation = products.reduce((sum, p) => sum + (p.stock * (p.cost || 0)), 0);

  // Chart Data
  const profitData = paidInvoices.map(inv => ({
      name: new Date(inv.date).toLocaleDateString(),
      revenue: inv.total,
      profit: inv.total * 0.4 // Approximation for visualization if individual item costs aren't strictly tracked in invoice history object yet
  }));

  const COLORS = ['#007AFF', '#34C759', '#FF9500'];
  const categoryData = [
      { name: 'Revenue', value: totalRevenue },
      { name: 'Cost', value: totalCOGS },
      { name: 'Profit', value: grossProfit }
  ];

  return (
    <div className="space-y-6">
      <div>
         <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Financial Reports</h2>
         <p className="text-gray-500 mt-1">Profit & Loss, Inventory Valuation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[24px] shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-gray-400 uppercase">Gross Profit</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">${grossProfit.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-1">Net from ${totalRevenue.toFixed(2)} Revenue</div>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Package className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-gray-400 uppercase">Inventory Value</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">${inventoryValuation.toFixed(2)}</div>
              <div className="text-sm text-gray-500 mt-1">Total asset value at cost</div>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                      <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-gray-400 uppercase">Profit Margin</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                  {totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Average across all sales</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm h-[400px]">
              <h3 className="font-bold text-gray-900 mb-6">Profit vs Revenue Breakdown</h3>
               <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
               </ResponsiveContainer>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm h-[400px]">
               <h3 className="font-bold text-gray-900 mb-6">Income Trend</h3>
               <ResponsiveContainer width="100%" height="90%">
                   <AreaChart data={profitData}>
                        <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#999'}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#007AFF" fillOpacity={0} strokeWidth={2} />
                        <Area type="monotone" dataKey="profit" stroke="#34C759" fill="url(#colorProfit)" strokeWidth={2} />
                   </AreaChart>
               </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Reports;